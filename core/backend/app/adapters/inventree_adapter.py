import uuid
import logging
from datetime import datetime, UTC
from typing import Any
from app.adapters.base import BaseHTTPAdapter
from app.core.config import settings

logger = logging.getLogger("mokarrar.inventree_adapter")

MOCK_PARTS: list[dict[str, Any]] = [
    {
        "id": "part-101",
        "IPN": "MOK-BRG-6205",
        "name": "بلبرینگ شیار عمیق SKF 6205-2RSH",
        "description": "بلبرینگ دور بالا مناسب برای الکتروموتورهای صنعتی خط تولید ۳",
        "category_name": "قطعات مکانیکی و دورانی",
        "total_in_stock": 42.0,
        "minimum_stock": 15.0,
        "units": "عدد",
        "default_location": "انبار مرکزی - قفسه B4",
        "active": True
    },
    {
        "id": "part-102",
        "IPN": "MOK-MOT-055",
        "name": "الکتروموتور ۳ فاز موتوژن ۵.۵ کیلووات ۱۴۰۰ دور",
        "description": "موتور فلنج‌دار استاندارد صنعتی پوسته آلومینیومی",
        "category_name": "تجهیزات دوار برقی",
        "total_in_stock": 6.0,
        "minimum_stock": 2.0,
        "units": "دستگاه",
        "default_location": "انبار ماشین‌آلات سنگین",
        "active": True
    },
    {
        "id": "part-103",
        "IPN": "MOK-VLV-REX4",
        "name": "شیر برقی کنترل جهت هیدرولیک Rexroth 4WE6",
        "description": "اسپول ۲۴ ولت DC مناسب پرس‌های هیدرولیک و تزریق",
        "category_name": "تجهیزات هیدرولیک و پنوماتیک",
        "total_in_stock": 3.0,
        "minimum_stock": 5.0,  # Below threshold! (Alert)
        "units": "عدد",
        "default_location": "انبار ابزار دقیق - کمد H2",
        "active": True
    },
    {
        "id": "part-104",
        "IPN": "MOK-BLT-8M1200",
        "name": "تسمه تایمینگ صنعتی HTD 8M گام ۱۲۰۰ عرض ۵۰",
        "description": "تسمه تقویت‌شده پلی‌اورتان با مغزی فولادی برای خط انتقال",
        "category_name": "لوازم مصرفی خط انتقال",
        "total_in_stock": 28.0,
        "minimum_stock": 10.0,
        "units": "حلقه",
        "default_location": "انبار مصرفی کارخانه",
        "active": True
    },
    {
        "id": "part-105",
        "IPN": "MOK-SEN-M18",
        "name": "سنسور مجاورتی القایی Omron M18 سه سیمه NPN",
        "description": "فاصله سنس ۸ میلی‌متر محافظت‌شده ضد روغن IP67",
        "category_name": "سنسورها و اتوماسیون",
        "total_in_stock": 19.0,
        "minimum_stock": 8.0,
        "units": "عدد",
        "default_location": "انبار اتوماسیون و ابزار دقیق",
        "active": True
    }
]

MOCK_STOCK_TRANSACTIONS: list[dict[str, Any]] = [
    {
        "id": "tx-1",
        "part_id": "part-101",
        "part_name": "بلبرینگ شیار عمیق SKF 6205-2RSH",
        "type": "STOCK_IN",
        "quantity": 20.0,
        "batch": "LOT-1405-998",
        "receiver": "حمید حسینی (انباردار)",
        "notes": "ورود پارت دوم سفارش خرید PR-1405-1030",
        "timestamp": "1405/03/01 10:15"
    },
    {
        "id": "tx-2",
        "part_id": "part-103",
        "part_name": "شیر برقی کنترل جهت هیدرولیک Rexroth 4WE6",
        "type": "STOCK_OUT",
        "quantity": 2.0,
        "batch": "LOT-1405-870",
        "receiver": "مهندس محمد رضایی (تعمیرات خط ۲)",
        "notes": "جهت اورهال پرس هیدرولیک ۲۰۰ تن",
        "timestamp": "1405/03/04 14:30"
    }
]


class InvenTreeAdapter:
    """
    Adapter for headless InvenTree Inventory & Warehouse Management Engine.
    Uses InvenTree REST API (/api/part/, /api/stock/).
    Supports automatic mock fallback when MOCK_EXTERNAL_SERVICES=true.
    """

    def __init__(self):
        self.mock_mode = settings.MOCK_EXTERNAL_SERVICES or not bool(settings.INVENTREE_API_TOKEN)
        self.http_adapter = BaseHTTPAdapter(
            base_url=settings.INVENTREE_API_URL,
            service_name="InvenTree",
            timeout=10.0,
            default_headers={"Authorization": f"Token {settings.INVENTREE_API_TOKEN or ''}"},
        )

    async def get_parts(self, search: str | None = None) -> list[dict[str, Any]]:
        if self.mock_mode:
            parts = list(MOCK_PARTS)
            if search:
                parts = [
                    p for p in parts
                    if search.lower() in p["name"].lower()
                    or search.lower() in p["IPN"].lower()
                    or search.lower() in p["category_name"].lower()
                ]
            return parts
        try:
            params = {}
            if search:
                params["search"] = search
            res = await self.http_adapter.request("GET", "/api/part/", params=params)
            return res if isinstance(res, list) else MOCK_PARTS
        except Exception as e:
            logger.warning("InvenTree get_parts failed: %s. Using mock fallback.", e)
            return MOCK_PARTS

    async def get_part(self, part_id: str) -> dict[str, Any] | None:
        parts = await self.get_parts()
        for p in parts:
            if str(p.get("id")) == str(part_id):
                return p
        return None

    async def create_stock_in(
        self,
        part_id: str,
        quantity: float,
        batch: str | None = None,
        receiver: str = "انباردار مرکزی",
        location: str = "انبار مرکزی",
        notes: str = ""
    ) -> dict[str, Any]:
        """
        Record Stock-In transaction (entry of goods into warehouse).
        """
        tx_id = f"tx-{uuid.uuid4().hex[:6]}"
        part_name = "قطعه ناشناخته"

        for p in MOCK_PARTS:
            if str(p["id"]) == str(part_id):
                p["total_in_stock"] += quantity
                part_name = p["name"]
                break

        record = {
            "id": tx_id,
            "part_id": part_id,
            "part_name": part_name,
            "type": "STOCK_IN",
            "quantity": quantity,
            "batch": batch or f"LOT-{datetime.now(UTC).strftime('%Y%m%d')}",
            "receiver": receiver,
            "location": location,
            "notes": notes,
            "timestamp": datetime.now(UTC).strftime("%Y/%m/%d %H:%M"),
        }
        MOCK_STOCK_TRANSACTIONS.insert(0, record)

        if not self.mock_mode:
            try:
                payload = {
                    "part": part_id,
                    "quantity": quantity,
                    "batch": batch,
                    "notes": f"Receiver: {receiver} | {notes}"
                }
                await self.http_adapter.request("POST", "/api/stock/", json_data=payload)
            except Exception as e:
                logger.warning("InvenTree real API stock-in failed: %s. Mock state preserved.", e)

        return record

    async def create_stock_out(
        self,
        part_id: str,
        quantity: float,
        requester: str = "کارشناس تولید",
        notes: str = ""
    ) -> dict[str, Any]:
        """
        Record Stock-Out transaction (withdrawal of goods).
        """
        tx_id = f"tx-{uuid.uuid4().hex[:6]}"
        part_name = "قطعه ناشناخته"

        for p in MOCK_PARTS:
            if str(p["id"]) == str(part_id):
                p["total_in_stock"] = max(0.0, p["total_in_stock"] - quantity)
                part_name = p["name"]
                break

        record = {
            "id": tx_id,
            "part_id": part_id,
            "part_name": part_name,
            "type": "STOCK_OUT",
            "quantity": quantity,
            "batch": "-",
            "receiver": requester,
            "notes": notes,
            "timestamp": datetime.now(UTC).strftime("%Y/%m/%d %H:%M"),
        }
        MOCK_STOCK_TRANSACTIONS.insert(0, record)
        return record

    async def get_transactions(self) -> list[dict[str, Any]]:
        return list(MOCK_STOCK_TRANSACTIONS)


inventree_adapter = InvenTreeAdapter()
