import hmac
import hashlib
import json
import logging
from typing import Any
from app.adapters.base import BaseHTTPAdapter
from app.core.config import settings

logger = logging.getLogger("mokarrar.n8n_adapter")


class N8nAdapter:
    """
    Adapter for n8n Workflow Automation Engine.
    Handles HMAC-signed outbound triggers to n8n webhook nodes
    and verifies inbound webhook calls from n8n.
    """

    def __init__(self):
        self.mock_mode = settings.MOCK_EXTERNAL_SERVICES
        self.secret = settings.N8N_WEBHOOK_SECRET.encode("utf-8")
        self.http_adapter = BaseHTTPAdapter(
            base_url=settings.N8N_WEBHOOK_URL,
            service_name="n8n",
            timeout=8.0,
            max_retries=2,
        )

    def sign_payload(self, payload: dict[str, Any]) -> str:
        """Create HMAC-SHA256 signature for outgoing payload."""
        data = json.dumps(payload, sort_keys=True).encode("utf-8")
        signature = hmac.new(self.secret, data, hashlib.sha256).hexdigest()
        return f"sha256={signature}"

    def verify_signature(self, payload_bytes: bytes, signature_header: str | None) -> bool:
        """Verify HMAC-SHA256 signature from incoming webhook."""
        if not signature_header:
            return False
        expected_sig = hmac.new(self.secret, payload_bytes, hashlib.sha256).hexdigest()
        provided_sig = signature_header.replace("sha256=", "").strip()
        return hmac.compare_digest(expected_sig, provided_sig)

    async def trigger_webhook(self, event: str, payload: dict[str, Any]) -> dict[str, Any]:
        """
        Trigger an n8n webhook workflow with signed headers.
        """
        signature = self.sign_payload(payload)
        headers = {
            "Content-Type": "application/json",
            "X-Mokarrar-Event": event,
            "X-Mokarrar-Signature": signature,
        }

        path = settings.N8N_PR_PAID_WEBHOOK_PATH if event == "pr.paid" else f"/webhook/mokarrar-{event}"

        if self.mock_mode:
            logger.info(
                "[MOCK n8n] Successfully triggered simulated webhook for event '%s'. Payload: %s",
                event,
                payload,
            )
            return {
                "success": True,
                "event": event,
                "status": "mock_delivered",
                "simulated": True,
            }

        try:
            res = await self.http_adapter.request(
                "POST",
                path,
                json_data=payload,
                headers=headers,
            )
            logger.info("Successfully delivered webhook '%s' to n8n.", event)
            return {"success": True, "result": res}
        except Exception as e:
            logger.warning("n8n webhook call failed: %s. Continuing gracefully.", e)
            return {"success": False, "error": str(e), "fallback": "mock_delivered"}


n8n_adapter = N8nAdapter()
