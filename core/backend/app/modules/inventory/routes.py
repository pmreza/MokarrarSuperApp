from typing import Any
from fastapi import APIRouter, Query, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, WarehouseUser
from app.adapters.inventree_adapter import inventree_adapter

router = APIRouter(prefix="/inventory", tags=["Inventory & Warehouse (InvenTree Proxy)"])


class StockInRequest(BaseModel):
    part_id: str
    quantity: float = Field(gt=0)
    batch: str | None = None
    receiver: str | None = None
    location: str = "انبار مرکزی"
    notes: str = ""


class StockOutRequest(BaseModel):
    part_id: str
    quantity: float = Field(gt=0)
    requester: str | None = None
    notes: str = ""


class InventoryImportItem(BaseModel):
    IPN: str = Field(..., description="کد یکتای قطعه یا کالا")
    name: str = Field(..., description="نام قطعه یا ماده اولیه")
    category_name: str = Field(default="قطعات فنی", description="دسته‌بندی")
    total_in_stock: float = Field(default=0, ge=0, description="موجودی فعلی")
    minimum_stock: float = Field(default=5, ge=0, description="حداقل موجودی مجاز (نقطه سفارش)")
    unit: str = Field(default="عدد", description="واحد اندازه‌گیری")
    location: str = Field(default="انبار مرکزی", description="محل نگهداری")


class InventoryImportRequest(BaseModel):
    items: list[InventoryImportItem]


@router.get("/parts")
async def list_parts(
    current_user: CurrentUser,
    search: str | None = Query(None, description="Search by name, part number, or category"),
) -> list[dict[str, Any]]:
    """List inventory items/parts with current stock levels."""
    return await inventree_adapter.get_parts(search=search)


@router.get("/transactions")
async def list_transactions(current_user: CurrentUser) -> list[dict[str, Any]]:
    """List stock entry (In) and withdrawal (Out) audit transactions."""
    return await inventree_adapter.get_transactions()


@router.get("/scan/{code}")
async def scan_barcode_or_qr(code: str, current_user: CurrentUser) -> dict[str, Any]:
    """
    Rapid Barcode / QR Scanner endpoint for warehouse workers and mobile users.
    Accepts IPN, Part ID, or scanned barcode string and returns real-time inventory balance.
    """
    parts = await inventree_adapter.get_parts()
    clean_code = code.strip().upper()

    for p in parts:
        ipn = (p.get("IPN") or "").strip().upper()
        p_id = str(p.get("id") or "").strip().upper()
        if clean_code in (ipn, p_id) or clean_code == f"MOK-{p_id}":
            stock = p.get("total_in_stock", 0)
            min_stock = p.get("minimum_stock", 0)
            return {
                "found": True,
                "part": p,
                "is_low_stock": stock <= min_stock,
                "scan_code": code,
                "message": f"قطعه «{p.get('name')}» با موفقیت شناسایی شد.",
            }

    # Partial match fallback
    for p in parts:
        if clean_code in (p.get("IPN") or "").upper() or clean_code in (p.get("name") or "").upper():
            return {
                "found": True,
                "part": p,
                "is_low_stock": p.get("total_in_stock", 0) <= p.get("minimum_stock", 0),
                "scan_code": code,
                "message": f"قطعه مشابه «{p.get('name')}» شناسایی شد.",
            }

    return {
        "found": False,
        "part": None,
        "is_low_stock": False,
        "scan_code": code,
        "message": f"بارکد «{code}» در سامانه انبارداری کارخانه مکرر ثبت نشده است.",
    }


@router.post("/stock-in", status_code=status.HTTP_201_CREATED)
async def stock_in(req: StockInRequest, current_user: WarehouseUser) -> dict[str, Any]:
    """Record physical entry of parts into the warehouse."""
    receiver_name = req.receiver or current_user.full_name or "انباردار"
    return await inventree_adapter.create_stock_in(
        part_id=req.part_id,
        quantity=req.quantity,
        batch=req.batch,
        receiver=receiver_name,
        location=req.location,
        notes=req.notes,
    )


@router.post("/stock-out", status_code=status.HTTP_201_CREATED)
async def stock_out(req: StockOutRequest, current_user: WarehouseUser) -> dict[str, Any]:
    """Record withdrawal of parts for factory maintenance or line use."""
    requester_name = req.requester or current_user.full_name or "کارشناس تولید"
    return await inventree_adapter.create_stock_out(
        part_id=req.part_id,
        quantity=req.quantity,
        requester=requester_name,
        notes=req.notes,
    )


@router.get("/stats/kpi")
async def get_inventory_kpis(current_user: CurrentUser) -> dict[str, Any]:
    """Warehouse inventory indicators, alert thresholds, and valuation."""
    parts = await inventree_adapter.get_parts()
    total_parts = len(parts)
    low_stock_parts = [p for p in parts if p.get("total_in_stock", 0) <= p.get("minimum_stock", 0)]
    total_units = sum(p.get("total_in_stock", 0) for p in parts)

    return {
        "total_sku_count": total_parts,
        "total_units_in_stock": total_units,
        "low_stock_alert_count": len(low_stock_parts),
        "low_stock_items": low_stock_parts,
    }


@router.get("/import-template")
async def get_inventory_import_template(current_user: CurrentUser) -> dict[str, Any]:
    """Return suggested JSON schema and sample payload for bulk inventory import/update."""
    return {
        "description": "الگوی استاندارد JSON برای ایمپورت یا بروزرسانی موجودی انبار (بر اساس کد یکتای IPN)",
        "fields": [
            {"key": "IPN", "type": "string", "required": True, "desc": "کد یکتای قطعه (برای بروزرسانی خودکار)"},
            {"key": "name", "type": "string", "required": True, "desc": "نام کامل قطعه یا ماده اولیه"},
            {"key": "category_name", "type": "string", "required": False, "desc": "دسته‌بندی کالا"},
            {"key": "total_in_stock", "type": "number", "required": True, "desc": "موجودی فعلی در انبار"},
            {"key": "minimum_stock", "type": "number", "required": False, "desc": "حد هشدار کسری انبار"},
            {"key": "unit", "type": "string", "required": False, "desc": "واحد (عدد، لیتر، کیلوگرم، متر...)"},
            {"key": "location", "type": "string", "required": False, "desc": "انبار / قفسه محل نگهداری"},
        ],
        "sample": {
            "items": [
                {
                    "IPN": "MOK-BRG-6205",
                    "name": "بلبرینگ شیار عمیق SKF 6205",
                    "category_name": "قطعات مکانیکی",
                    "total_in_stock": 24,
                    "minimum_stock": 6,
                    "unit": "عدد",
                    "location": "انبار ماهشهر - قفسه B2",
                },
                {
                    "IPN": "MOK-OIL-46",
                    "name": "روغن هیدرولیک صنعتی ISO 46",
                    "category_name": "روان‌کارها",
                    "total_in_stock": 180,
                    "minimum_stock": 40,
                    "unit": "لیتر",
                    "location": "انبار قزوین - مخزن ۱",
                },
            ]
        },
    }


@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_inventory_parts(req: InventoryImportRequest, current_user: WarehouseUser) -> dict[str, Any]:
    """Bulk import or update inventory items from JSON payload."""
    items_dicts = [item.model_dump() for item in req.items]
    return await inventree_adapter.import_parts(items_dicts)
