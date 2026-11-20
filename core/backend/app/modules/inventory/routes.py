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
