"""
Daily Production & Shift Output Management Module.
Tracks unit output, shift targets, scrap/waste rates, and machine line efficiency.
"""

from datetime import datetime, UTC
from typing import Any
import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser

router = APIRouter(prefix="/production", tags=["Factory Production & Shift Logs"])

MOCK_SHIFT_LOGS: list[dict[str, Any]] = [
    {
        "id": "shift-101",
        "date": "1405/03/10",
        "shift_type": "صبح (۰۷:۰۰ - ۱۵:۰۰)",
        "line_number": 1,
        "product_name": "شاسی فلزی تقویت‌شده دستگاه پرس مدل K-200",
        "target_quantity": 120,
        "actual_quantity": 114,
        "scrap_quantity": 4,  # ضایعات
        "efficiency_rate": 95.0,
        "supervisor": "مهندس کاظمی",
        "status": "APPROVED",
        "notes": "به دلیل نوسان برق ۱۰ دقیقه توقف جزئی داشتیم.",
    },
    {
        "id": "shift-102",
        "date": "1405/03/10",
        "shift_type": "صبح (۰۷:۰۰ - ۱۵:۰۰)",
        "line_number": 2,
        "product_name": "سیلندر هیدرولیک فشار قوی قطر ۸۰",
        "target_quantity": 80,
        "actual_quantity": 62,
        "scrap_quantity": 6,
        "efficiency_rate": 77.5,
        "supervisor": "مهندس محمد رضایی",
        "status": "FLAGGED",
        "notes": "افت فشار یونیت هیدرولیک باعث کاهش تیراژ شد. تیکت PM ثبت گردید.",
    },
    {
        "id": "shift-103",
        "date": "1405/03/09",
        "shift_type": "عصر (۱۵:۰۰ - ۲۳:۰۰)",
        "line_number": 3,
        "product_name": "مجموعه کابل و اتصالات الکتریکی باکس کنترل",
        "target_quantity": 250,
        "actual_quantity": 258,
        "scrap_quantity": 2,
        "efficiency_rate": 103.2,
        "supervisor": "سارا کریمی",
        "status": "APPROVED",
        "notes": "تولید فراتر از تارگت شیفت با کیفیت مطلوب.",
    },
]


class CreateShiftLog(BaseModel):
    shift_type: str = "صبح (۰۷:۰۰ - ۱۵:۰۰)"
    line_number: int = Field(ge=1, le=10)
    product_name: str
    target_quantity: int = Field(gt=0)
    actual_quantity: int = Field(ge=0)
    scrap_quantity: int = Field(ge=0)
    supervisor: str | None = None
    notes: str = ""


@router.get("/logs")
async def list_shift_logs(current_user: CurrentUser) -> list[dict[str, Any]]:
    """List recorded daily production logs by line and shift."""
    return MOCK_SHIFT_LOGS


@router.post("/logs", status_code=status.HTTP_201_CREATED)
async def create_shift_log(
    payload: CreateShiftLog,
    current_user: CurrentUser,
) -> dict[str, Any]:
    """Record a shift production report and calculate efficiency & scrap percentage."""
    eff = round((payload.actual_quantity / payload.target_quantity) * 100, 1)
    status_label = "APPROVED" if eff >= 90 else "FLAGGED"

    new_log = {
        "id": f"shift-{uuid.uuid4().hex[:6]}",
        "date": "1405/03/11",
        "shift_type": payload.shift_type,
        "line_number": payload.line_number,
        "product_name": payload.product_name,
        "target_quantity": payload.target_quantity,
        "actual_quantity": payload.actual_quantity,
        "scrap_quantity": payload.scrap_quantity,
        "efficiency_rate": eff,
        "supervisor": payload.supervisor or current_user.full_name or "سرپرست شیفت",
        "status": status_label,
        "notes": payload.notes,
    }
    MOCK_SHIFT_LOGS.insert(0, new_log)
    return new_log


@router.get("/summary")
async def get_production_summary(current_user: CurrentUser) -> dict[str, Any]:
    """KPI summary of factory output, total scrap, and average line efficiency."""
    total_target = sum(l["target_quantity"] for l in MOCK_SHIFT_LOGS)
    total_actual = sum(l["actual_quantity"] for l in MOCK_SHIFT_LOGS)
    total_scrap = sum(l["scrap_quantity"] for l in MOCK_SHIFT_LOGS)
    avg_efficiency = round((total_actual / max(total_target, 1)) * 100, 1)
    scrap_rate = round((total_scrap / max(total_actual + total_scrap, 1)) * 100, 2)

    return {
        "total_target_units": total_target,
        "total_produced_units": total_actual,
        "total_scrap_units": total_scrap,
        "average_efficiency": avg_efficiency,
        "scrap_rate_percentage": scrap_rate,
        "recorded_shifts_count": len(MOCK_SHIFT_LOGS),
    }
