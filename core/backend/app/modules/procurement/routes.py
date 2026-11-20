import uuid
from datetime import UTC, datetime
from typing import Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, ManagerUser, SessionDep
from app.modules.procurement.models import (
    ApprovalLog,
    PRStatus,
    PurchaseRequest,
    PurchaseRequestItem,
)
from app.adapters.plane_adapter import plane_adapter
from app.adapters.n8n_adapter import n8n_adapter
from app.adapters.sms_adapter import sms_adapter

router = APIRouter(prefix="/procurement", tags=["Procurement & Approvals (Phase 2)"])


# In-memory realistic initial requests for instant demo/testability
MOCK_PRS: list[dict[str, Any]] = [
    {
        "id": "pr-101",
        "request_number": "PR-1405-1042",
        "title": "خرید ۱۰ عدد بلبرینگ دور بالا و تسمه‌های صنعتی خط ۳",
        "department": "نگهداری و تعمیرات",
        "requester_name": "مهندس محمد رضایی",
        "status": "APPROVED",
        "priority": "high",
        "total_estimated_cost": 48500000.0,
        "justification": "تعمیر اضطراری و پیشگیرانه خط تولید اصلی کارخانه جهت جلوگیری از توقف تولید.",
        "created_at": "1405/03/02 11:20",
        "manager_note": "تایید گردید. لطفا پس از پرداخت، تحویل انبار مرکزی شود.",
        "items": [
            {
                "item_name": "بلبرینگ شیار عمیق SKF 6205",
                "quantity": 10.0,
                "unit": "عدد",
                "estimated_unit_price": 2850000.0,
                "part_number": "MOK-BRG-6205",
            },
            {
                "item_name": "تسمه تایمینگ صنعتی HTD 8M",
                "quantity": 4.0,
                "unit": "حلقه",
                "estimated_unit_price": 5000000.0,
                "part_number": "MOK-BLT-8M1200",
            },
        ],
        "approvals": [
            {
                "approver_name": "مدیر فنی مهندسی",
                "action": "APPROVE",
                "comment": "با توجه به اهمیت تداوم تولید خط ۳ تایید شد.",
                "timestamp": "1405/03/03 09:15",
            }
        ],
    },
    {
        "id": "pr-102",
        "request_number": "PR-1405-1043",
        "title": "تامین تجهیزات آزمایشگاه کوانتومتری و مواد شیمیایی تیتراسیون",
        "department": "کنترل کیفیت",
        "requester_name": "سارا کریمی",
        "status": "PENDING_APPROVAL",
        "priority": "medium",
        "total_estimated_cost": 22000000.0,
        "justification": "انجام آزمایش‌های آنالیز عنصری شمش‌های ورودی آلیاژ آلومینیوم.",
        "created_at": "1405/03/08 14:40",
        "manager_note": None,
        "items": [
            {
                "item_name": "محلول استاندارد کالیبراسیون کوانتومتر",
                "quantity": 2.0,
                "unit": "پک",
                "estimated_unit_price": 11000000.0,
                "part_number": "LAB-CAL-02",
            }
        ],
        "approvals": [],
    },
]


class ItemCreate(BaseModel):
    item_name: str
    quantity: float = 1.0
    unit: str = "عدد"
    estimated_unit_price: float = 0.0
    part_number: str | None = None


class PRCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    department: str = "تولید"
    priority: str = "medium"
    justification: str = ""
    items: list[ItemCreate] = []


class ApprovalActionRequest(BaseModel):
    comment: str | None = None


@router.get("/requests")
async def list_purchase_requests(
    current_user: CurrentUser,
    status_filter: str | None = Query(None, alias="status"),
) -> list[dict[str, Any]]:
    """List purchase requests with their items and approval logs."""
    requests = list(MOCK_PRS)
    if status_filter:
        requests = [r for r in requests if r.get("status") == status_filter]
    return requests


@router.get("/requests/{request_id}")
async def get_purchase_request(request_id: str, current_user: CurrentUser) -> dict[str, Any]:
    """Get single purchase request details."""
    for r in MOCK_PRS:
        if str(r["id"]) == str(request_id):
            return r
    raise HTTPException(status_code=404, detail="Purchase request not found")


@router.post("/requests", status_code=status.HTTP_201_CREATED)
async def create_purchase_request(req: PRCreateRequest, current_user: CurrentUser) -> dict[str, Any]:
    """Create a new purchase request for manager review."""
    req_id = f"pr-{uuid.uuid4().hex[:6]}"
    seq_num = len(MOCK_PRS) + 1044
    req_number = f"PR-1405-{seq_num}"

    total_cost = sum(i.quantity * i.estimated_unit_price for i in req.items)

    new_pr = {
        "id": req_id,
        "request_number": req_number,
        "title": req.title,
        "department": req.department,
        "requester_name": current_user.full_name or current_user.email,
        "status": PRStatus.PENDING_APPROVAL.value,
        "priority": req.priority,
        "total_estimated_cost": total_cost,
        "justification": req.justification,
        "created_at": datetime.now(UTC).strftime("%Y/%m/%d %H:%M"),
        "manager_note": None,
        "items": [i.model_dump() for i in req.items],
        "approvals": [
            {
                "approver_name": current_user.full_name or current_user.email,
                "action": "SUBMIT",
                "comment": "ثبت اولیه درخواست خرید",
                "timestamp": datetime.now(UTC).strftime("%Y/%m/%d %H:%M"),
            }
        ],
    }
    MOCK_PRS.insert(0, new_pr)
    return new_pr


@router.post("/requests/{request_id}/approve")
async def approve_purchase_request(
    request_id: str,
    action_req: ApprovalActionRequest,
    current_user: ManagerUser,
) -> dict[str, Any]:
    """
    Tiered Financial Approval Matrix:
    - Tier 1 (<= 50M Rials): Direct Manager Approval
    - Tier 2 (> 50M and <= 500M Rials): Plant Operations Approval
    - Tier 3 (> 500M Rials): Executive CEO / Board Approval required
    """
    pr = None
    for r in MOCK_PRS:
        if str(r["id"]) == str(request_id):
            pr = r
            break
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase request not found")

    total_cost = pr.get("total_estimated_cost", 0.0)
    user_role = getattr(current_user, "role", "manager")

    # High-value PR check: if cost > 500M and user is not admin, advance to PENDING_CEO
    if total_cost > 500_000_000 and user_role != "admin" and pr["status"] != "PENDING_CEO":
        pr["status"] = "PENDING_CEO"
        note = f"تأیید مرحله اول توسط {current_user.full_name or 'مدیر فنی'}. جهت تأیید نهایی مالی به مدیرعامل ارجاع شد."
        pr["manager_note"] = note
        pr["approvals"].append(
            {
                "approver_name": current_user.full_name or current_user.email,
                "action": "TIER1_APPROVE",
                "comment": action_req.comment or note,
                "timestamp": datetime.now(UTC).strftime("%Y/%m/%d %H:%M"),
            }
        )
        # Notify CEO via SMS/Mock
        await sms_adapter.send_sms(
            receptor="09121000000",
            message=f"مکرر: درخواست خرید کلان {pr['request_number']} با مبلغ {int(total_cost):,} ریال نیازمند تایید نهایی مدیرعامل است.",
        )
        return {"status": "pending_ceo", "message": "درخواست به دلیل سقف مالی بالا به کارتابل مدیرعامل ارجاع شد.", "request": pr}

    pr["status"] = PRStatus.APPROVED.value
    pr["manager_note"] = action_req.comment or "تایید نهایی گردید."
    pr["approvals"].append(
        {
            "approver_name": current_user.full_name or current_user.email,
            "action": "FINAL_APPROVE",
            "comment": action_req.comment or "درخواست توسط مدیریت تایید نهایی شد.",
            "timestamp": datetime.now(UTC).strftime("%Y/%m/%d %H:%M"),
        }
    )
    return {"status": "approved", "request": pr}


@router.post("/requests/{request_id}/reject")
async def reject_purchase_request(
    request_id: str,
    action_req: ApprovalActionRequest,
    current_user: ManagerUser,
) -> dict[str, Any]:
    """Reject purchase request (Requires Manager or Admin role)."""
    pr = None
    for r in MOCK_PRS:
        if str(r["id"]) == str(request_id):
            pr = r
            break
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase request not found")

    pr["status"] = PRStatus.REJECTED.value
    pr["manager_note"] = action_req.comment or "رد شد."
    pr["approvals"].append(
        {
            "approver_name": current_user.full_name or current_user.email,
            "action": "REJECT",
            "comment": action_req.comment or "درخواست رد گردید.",
            "timestamp": datetime.now(UTC).strftime("%Y/%m/%d %H:%M"),
        }
    )
    return {"status": "rejected", "request": pr}


@router.post("/requests/{request_id}/mark-paid")
async def mark_request_paid(
    request_id: str,
    current_user: ManagerUser,
) -> dict[str, Any]:
    """
    Mark request as PAID:
    1. Updates PR status to PAID.
    2. Automatically creates a delivery task in Plane ("تحویل کالا") assigned to employee.
    3. Triggers outbound webhook to n8n workflow engine.
    """
    pr = None
    for r in MOCK_PRS:
        if str(r["id"]) == str(request_id):
            pr = r
            break
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase request not found")

    pr["status"] = PRStatus.PAID.value
    pr["approvals"].append(
        {
            "approver_name": current_user.full_name or current_user.email,
            "action": "MARK_PAID",
            "comment": "فاکتور پرداخت شد. دستور ایجاد تسک تحویل کالا به انبار صادر شد.",
            "timestamp": datetime.now(UTC).strftime("%Y/%m/%d %H:%M"),
        }
    )

    # 1. Create delivery task in Plane
    task_title = f"تحویل و انبارش اقلام سفارش {pr['request_number']}: {pr['title'][:40]}"
    task_desc = (
        f"درخواست خرید {pr['request_number']} پرداخت شد.\n"
        f"متقاضی: {pr['requester_name']}\n"
        f"تعداد اقلام: {len(pr.get('items', []))}\n"
        f"مبلغ کل: {pr.get('total_estimated_cost', 0):,.0f} ریال"
    )

    plane_task = await plane_adapter.create_task(
        title=task_title,
        description=task_desc,
        priority="high",
        state="todo",
        assignee_name="حمید حسینی (انباردار)",
        tags=["تحویل_کالا", "انبارداری", pr["request_number"]],
        metadata={
            "request_id": str(pr["id"]),
            "request_number": pr["request_number"],
            "items": pr.get("items", []),
        },
    )
    pr["plane_task_id"] = plane_task.get("id")

    # 2. Trigger n8n outbound webhook
    n8n_payload = {
        "event": "pr.paid",
        "request_id": str(pr["id"]),
        "request_number": pr["request_number"],
        "requester_name": pr["requester_name"],
        "total_cost": pr.get("total_estimated_cost"),
        "plane_task_id": plane_task.get("id"),
        "items": pr.get("items", []),
        "timestamp": datetime.now(UTC).isoformat(),
    }
    n8n_result = await n8n_adapter.trigger_webhook("pr.paid", n8n_payload)

    return {
        "status": "paid",
        "request": pr,
        "plane_task": plane_task,
        "n8n_event": n8n_result,
    }
