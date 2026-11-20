"""
Bale Messenger Adapter for Mokarrar Enterprise Super App.
Handles operational worker interactions:
- Task notifications & 1-click status transitions (انجام شد / تحویل شد)
- Instant line stop & maintenance reporting
- Simple part stock lookup via barcode/part number
"""

import logging
from typing import Any

import httpx

from app.adapters.base import BaseHTTPAdapter
from app.core.config import settings

logger = logging.getLogger(__name__)


class BaleAdapter(BaseHTTPAdapter):
    def __init__(self) -> None:
        token = settings.BALE_BOT_TOKEN or "mock_token"
        base_url = f"{settings.BALE_API_URL.rstrip('/')}/bot{token}"
        super().__init__(base_url=base_url, service_name="BaleMessenger")
        self.mock_sent_messages: list[dict[str, Any]] = []

    async def send_message(
        self,
        chat_id: int | str,
        text: str,
        reply_markup: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Send a text message with optional interactive keyboard to a Bale user."""
        if settings.MOCK_EXTERNAL_SERVICES or not settings.BALE_BOT_TOKEN:
            msg = {
                "ok": True,
                "result": {
                    "message_id": len(self.mock_sent_messages) + 1,
                    "chat": {"id": chat_id},
                    "text": text,
                    "reply_markup": reply_markup,
                },
            }
            self.mock_sent_messages.append(msg["result"])
            logger.info("MOCK Bale send_message: chat_id=%s, text=%s", chat_id, text[:50])
            return msg

        payload: dict[str, Any] = {"chat_id": chat_id, "text": text}
        if reply_markup:
            payload["reply_markup"] = reply_markup

        return await self.request("POST", "sendMessage", json_data=payload)

    async def send_photo(
        self,
        chat_id: int | str,
        photo_url: str,
        caption: str | None = None,
    ) -> dict[str, Any]:
        """Send a photo with optional caption to a Bale user."""
        if settings.MOCK_EXTERNAL_SERVICES or not settings.BALE_BOT_TOKEN:
            return {
                "ok": True,
                "result": {
                    "message_id": len(self.mock_sent_messages) + 1,
                    "chat": {"id": chat_id},
                    "caption": caption,
                    "photo": photo_url,
                },
            }

        payload: dict[str, Any] = {"chat_id": chat_id, "photo": photo_url}
        if caption:
            payload["caption"] = caption

        return await self.request("POST", "sendPhoto", json_data=payload)


bale_adapter = BaleAdapter()
