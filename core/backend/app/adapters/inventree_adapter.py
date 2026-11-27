import uuid
import logging
from datetime import datetime, UTC
from typing import Any
from app.adapters.base import BaseHTTPAdapter
from app.core.config import settings

logger = logging.getLogger("mokarrar.inventree_adapter")

MOCK_PARTS: list[dict[str, Any]] = []

MOCK_STOCK_TRANSACTIONS: list[dict[str, Any]] = []


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

    async def import_parts(self, items: list[dict[str, Any]]) -> dict[str, Any]:
        """Bulk import or update inventory parts by IPN or name."""
        created_count = 0
        updated_count = 0

        for item in items:
            ipn = str(item.get("IPN") or "").strip()
            name = str(item.get("name") or "").strip()
            if not name and not ipn:
                continue

            existing = None
            for p in MOCK_PARTS:
                if (ipn and p.get("IPN") == ipn) or (name and p.get("name") == name):
                    existing = p
                    break

            stock_val = float(item.get("total_in_stock", item.get("stock", 0)) or 0)
            min_stock_val = float(item.get("minimum_stock", item.get("min_stock", 5)) or 5)

            if existing:
                if name:
                    existing["name"] = name
                if item.get("category_name"):
                    existing["category_name"] = str(item["category_name"])
                if item.get("unit"):
                    existing["unit"] = str(item["unit"])
                if item.get("location"):
                    existing["location"] = str(item["location"])
                existing["total_in_stock"] = stock_val
                existing["minimum_stock"] = min_stock_val
                existing["stock"] = stock_val
                existing["min_stock"] = min_stock_val
                updated_count += 1
            else:
                new_id = f"part-{uuid.uuid4().hex[:6]}"
                MOCK_PARTS.append({
                    "id": new_id,
                    "IPN": ipn or new_id.upper(),
                    "name": name or ipn,
                    "category_name": str(item.get("category_name") or "قطعات عمومی"),
                    "total_in_stock": stock_val,
                    "minimum_stock": min_stock_val,
                    "stock": stock_val,
                    "min_stock": min_stock_val,
                    "unit": str(item.get("unit") or "عدد"),
                    "location": str(item.get("location") or "انبار مرکزی"),
                })
                created_count += 1

        return {
            "imported_count": created_count,
            "updated_count": updated_count,
            "total_parts": len(MOCK_PARTS),
        }


inventree_adapter = InvenTreeAdapter()
