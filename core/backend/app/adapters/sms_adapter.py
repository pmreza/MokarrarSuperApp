"""
SMS Gateway Adapter for Mokarrar Enterprise Super App.
Supports Kavenegar / Iranian SMS providers with automatic mock mode.
Sends critical alerts for:
- Urgent Line Stoppage & PM Dispatch
- Multi-tier Procurement Approval Pending
- Warehouse Low-stock Warning
"""

import logging
from typing import Any
from datetime import datetime, UTC

from app.adapters.base import BaseHTTPAdapter
from app.core.config import settings

logger = logging.getLogger("mokarrar.sms_adapter")


class SMSAdapter(BaseHTTPAdapter):
    def __init__(self) -> None:
        api_key = settings.KAVENEGAR_API_KEY or "mock_kavenegar_key"
        base_url = f"https://api.kavenegar.com/v1/{api_key}"
        super().__init__(base_url=base_url, service_name="KavenegarSMS")
        self.mock_sent_sms: list[dict[str, Any]] = []

    async def send_sms(
        self,
        receptor: str,
        message: str,
        sender: str | None = None,
    ) -> dict[str, Any]:
        """Send standard SMS to a single receptor."""
        sender_num = sender or settings.SMS_SENDER_NUMBER

        if settings.MOCK_EXTERNAL_SERVICES or not settings.KAVENEGAR_API_KEY:
            sms_record = {
                "messageid": len(self.mock_sent_sms) + 10001,
                "receptor": receptor,
                "message": message,
                "sender": sender_num,
                "status": 1,
                "statustext": "ارسال به مخابرات (شبیه‌سازی)",
                "date": datetime.now(UTC).isoformat(),
            }
            self.mock_sent_sms.append(sms_record)
            logger.info("MOCK SMS sent to %s: %s", receptor, message[:40])
            return {"return": {"status": 200, "message": "تایید شد"}, "entries": [sms_record]}

        payload = {
            "receptor": receptor,
            "message": message,
            "sender": sender_num,
        }
        return await self.request("POST", "sms/send.json", params=payload)

    async def send_urgent_maintenance_alert(
        self,
        technician_phone: str,
        line_number: int,
        machine_name: str,
    ) -> dict[str, Any]:
        """Specific alert for emergency line downtime."""
        msg = (
            f"🚨 مکرر - هشدار توقف خط!\n"
            f"خط {line_number} ({machine_name}) دچار توقف گردید.\n"
            f"لطفاً بلافاصله جهت رفع عیب و ثبت زمان مراجعه فرمایید."
        )
        return await self.send_sms(receptor=technician_phone, message=msg)


sms_adapter = SMSAdapter()
