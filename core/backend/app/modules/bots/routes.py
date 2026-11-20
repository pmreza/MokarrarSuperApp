"""
FastAPI Routes for Bale Bot Integration.
"""

from typing import Any

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel

from app.adapters.bale_adapter import bale_adapter
from app.core.config import settings
from app.modules.bots.bale_bot import BaleBotService

router = APIRouter(prefix="/bots/bale", tags=["bale-bot"])


class OutgoingBaleMessage(BaseModel):
    chat_id: int | str
    text: str
    reply_markup: dict[str, Any] | None = None


@router.post("/webhook")
async def receive_bale_webhook(
    update: dict[str, Any],
    x_bale_secret: str | None = Header(None, alias="X-Bale-Secret"),
) -> dict[str, Any]:
    """
    Public webhook receiver registered with Bale Bot API.
    Validates secret header if configured in production.
    """
    if settings.BALE_BOT_WEBHOOK_SECRET and x_bale_secret:
        if x_bale_secret != settings.BALE_BOT_WEBHOOK_SECRET:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Bale webhook secret",
            )

    result = await BaleBotService.handle_update(update)
    return {"ok": True, "result": result}


@router.post("/send")
async def send_worker_notification(payload: OutgoingBaleMessage) -> dict[str, Any]:
    """
    Internal system endpoint for Mokarrar Core / n8n to push alerts
    or delivery assignment notifications directly to a worker's Bale chat.
    """
    res = await bale_adapter.send_message(
        chat_id=payload.chat_id,
        text=payload.text,
        reply_markup=payload.reply_markup,
    )
    return res


@router.get("/status")
async def get_bale_status() -> dict[str, Any]:
    """Returns integration health and mock sent messages count."""
    return {
        "status": "online",
        "mock_mode": settings.MOCK_EXTERNAL_SERVICES,
        "token_configured": bool(settings.BALE_BOT_TOKEN),
        "mock_messages_sent_count": len(bale_adapter.mock_sent_messages),
    }
