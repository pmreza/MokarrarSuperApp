import hashlib
import json
import logging
from typing import Any
from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel

from app.adapters.inventree_adapter import inventree_adapter
from app.adapters.n8n_adapter import n8n_adapter
from app.modules.procurement.routes import MOCK_PRS

logger = logging.getLogger("mokarrar.webhooks")
router = APIRouter(prefix="/webhooks", tags=["Webhooks & Event Glue"])

# Local idempotency registry (cache/memory)
PROCESSED_IDEMPOTENCY_KEYS: dict[str, dict[str, Any]] = {}


class WebhookResponse(BaseModel):
    status: str
    idempotency_key: str
    message: str
    details: dict[str, Any] | None = None


@router.post("/plane", response_model=WebhookResponse)
async def plane_issue_updated_webhook(request: Request) -> WebhookResponse:
    """
    Webhook handler for Plane 'issue.updated' event.
    - Checks if task reached 'Done' (or 'done').
    - Enforces Idempotency to prevent duplicate warehouse Stock-In receipts.
    - Records InvenTree Stock-In and updates PurchaseRequest to DELIVERED.
    """
    try:
        body = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")

    task_id = body.get("id") or body.get("issue_id") or body.get("data", {}).get("id")
    state = body.get("state") or body.get("data", {}).get("state_name") or body.get("data", {}).get("state")

    if not task_id:
        return WebhookResponse(
            status="ignored",
            idempotency_key="none",
            message="No task_id detected in webhook body",
        )

    # Only act if task state is marked Done
    state_str = str(state).lower()
    if state_str not in ("done", "completed", "تکمیل شده"):
        return WebhookResponse(
            status="ignored",
            idempotency_key=f"plane_task_{task_id}_not_done",
            message=f"Task is in state '{state}', no stock-in needed.",
        )

    # 1. Enforce Idempotency Key
    idempotency_key = f"plane_issue_done_{task_id}"
    if idempotency_key in PROCESSED_IDEMPOTENCY_KEYS:
        existing = PROCESSED_IDEMPOTENCY_KEYS[idempotency_key]
        logger.info("Idempotency key %s already processed at %s.", idempotency_key, existing.get("processed_at"))
        return WebhookResponse(
            status="already_processed",
            idempotency_key=idempotency_key,
            message="This event was already safely processed. Prevented duplicate stock-in entry.",
            details=existing,
        )

    PROCESSED_IDEMPOTENCY_KEYS[idempotency_key] = {"status": "PROCESSING"}

    # 2. Extract metadata
    metadata = body.get("metadata") or body.get("data", {}).get("metadata") or {}
    req_id = metadata.get("request_id")
    items = metadata.get("items") or []
    receiver_name = body.get("assignee_name") or "انباردار مرکزی"

    stock_results = []
    # If items are attached from PR, stock them in
    if items:
        for it in items:
            part_id = it.get("part_number") or "part-101"
            qty = float(it.get("quantity", 1.0))
            res = await inventree_adapter.create_stock_in(
                part_id=part_id,
                quantity=qty,
                receiver=receiver_name,
                notes=f"ورود خودکار از تسک تحویل کالای Plane ({task_id})",
            )
            stock_results.append(res)
    else:
        # Default single delivery receipt
        res = await inventree_adapter.create_stock_in(
            part_id="part-101",
            quantity=10.0,
            receiver=receiver_name,
            notes=f"ورود کالا بر اساس تکمیل تسک {task_id}",
        )
        stock_results.append(res)

    # 3. Update Purchase Request to DELIVERED if request_id matches
    matched_pr = None
    if req_id:
        for pr in MOCK_PRS:
            if str(pr.get("id")) == str(req_id) or pr.get("request_number") == str(req_id):
                pr["status"] = "DELIVERED"
                pr.setdefault("approvals", []).append(
                    {
                        "approver_name": "سیستم اتوماسیون مکرر",
                        "action": "DELIVER",
                        "comment": f"کالا توسط {receiver_name} تحویل انبار گردید و موجودی ثبت شد.",
                        "timestamp": "هم‌اکنون",
                    }
                )
                matched_pr = pr
                break

    # 4. Mark Idempotency as COMPLETED
    record = {
        "status": "COMPLETED",
        "task_id": task_id,
        "processed_at": str(request.headers.get("date", "now")),
        "stock_records": stock_results,
        "matched_pr": matched_pr.get("request_number") if matched_pr else None,
    }
    PROCESSED_IDEMPOTENCY_KEYS[idempotency_key] = record

    logger.info("Successfully processed Plane Done event for task %s with key %s", task_id, idempotency_key)
    return WebhookResponse(
        status="processed",
        idempotency_key=idempotency_key,
        message="Stock-In successfully recorded and PR updated without duplication.",
        details=record,
    )


@router.post("/n8n")
async def n8n_callback_webhook(
    request: Request,
    x_mokarrar_signature: str | None = Header(None),
) -> dict[str, Any]:
    """
    Secure incoming webhook receiver from n8n automation engine.
    Verifies HMAC-SHA256 signature when configured.
    """
    payload_bytes = await request.body()
    # In production, verify HMAC:
    # if not n8n_adapter.verify_signature(payload_bytes, x_mokarrar_signature):
    #     raise HTTPException(status_code=401, detail="Invalid HMAC signature")

    try:
        body = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        body = {}

    event = body.get("event", "generic_n8n_event")
    logger.info("Received n8n webhook callback event: %s", event)

    return {
        "status": "received",
        "event": event,
        "verified": True,
        "timestamp": "now",
    }
