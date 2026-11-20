"""
Factory Gate Pass & Material Exit Authorization Module.
Enforces security protocols for materials leaving factory grounds.
Supports QR verification for security guards and Bale Bot validation.
"""

from datetime import datetime, UTC
from typing import Any
import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, WarehouseUser

router = APIRouter(prefix="/gatepass", tags=["Gate Pass & Material Exit Authorization"])

MOCK_GATE_PASSES: list[dict[str, Any]] = [
    {
        "id": "gp-101",
        "gate_pass_number": "GP-1405-312",
        "pass_type": "TEMPORARY_OUT",
        "pass_type_label": "خروج موقت (تراشکاری و سنگ‌زنی)",
        "destination": "کارگاه تراشکاری دقیق نوین - شهرک صنعتی",
        "driver_name": "اصغر محمدی",
        "vehicle_plate": "۶۸ ب ۴۵۲ - ایران ۲۱",
        "items": [
            {"item_name": "شافت اصلی روتور پمپ وکیوم", "quantity": 1, "unit": "عدد"},
            {"item_name": "فلنج اتصال چدنی قطر ۲۵۰", "quantity": 2, "unit": "عدد"},
        ],
        "approved_by": "مهندس کاظمی (مدیر تولید)",
        "status": "APPROVED",
        "security_checked": False,
        "security_guard": None,
        "verified_at": None,
        "created_at": "1405/03/10 10:30",
        "qr_token": "GP-SEC-7A8B9C",
    },
    {
        "id": "gp-102",
        "gate_pass_number": "GP-1405-311",
        "pass_type": "SCRAP",
        "pass_type_label": "خروج ضایعات فلزی و پلیسه",
        "destination": "کارخانه ذوب آهن آریا",
        "driver_name": "رضا صادقی",
        "vehicle_plate": "۱۴ ج ۹۸۳ - ایران ۳۳",
        "items": [
            {"item_name": "براده آهن و ضایعات ورق پرس", "quantity": 3800, "unit": "کیلوگرم"},
        ],
        "approved_by": "مدیر بازرگانی",
        "status": "COMPLETED",
        "security_checked": True,
        "security_guard": "نگهبان عباسی (گیت شماره ۱)",
        "verified_at": "1405/03/09 16:45",
        "created_at": "1405/03/09 15:00",
        "qr_token": "GP-SEC-1D2E3F",
    },
]


class GatePassItem(BaseModel):
    item_name: str
    quantity: float = Field(gt=0)
    unit: str = "عدد"


class CreateGatePass(BaseModel):
    pass_type: str = "TEMPORARY_OUT"
    destination: str
    driver_name: str
    vehicle_plate: str
    items: list[GatePassItem]
    notes: str = ""


class VerifyGatePass(BaseModel):
    guard_name: str = "نگهبان درب اصلی"


@router.get("/passes")
async def list_gate_passes(current_user: CurrentUser) -> list[dict[str, Any]]:
    """List all created factory gate passes and their status."""
    return MOCK_GATE_PASSES


@router.post("/passes", status_code=status.HTTP_201_CREATED)
async def create_gate_pass(
    payload: CreateGatePass,
    current_user: CurrentUser,
) -> dict[str, Any]:
    """Issue a new material exit gate pass awaiting security verification at the gate."""
    new_id = f"gp-{uuid.uuid4().hex[:6]}"
    seq = len(MOCK_GATE_PASSES) + 313
    gp_num = f"GP-1405-{seq}"
    token = f"GP-SEC-{uuid.uuid4().hex[:6].upper()}"

    type_labels = {
        "TEMPORARY_OUT": "خروج موقت (تعمیرات/پیمانکار)",
        "MATERIAL_OUT": "خروج قطعی کالا / فروش",
        "SCRAP": "خروج ضایعات و اقلام مازاد",
    }

    new_pass = {
        "id": new_id,
        "gate_pass_number": gp_num,
        "pass_type": payload.pass_type,
        "pass_type_label": type_labels.get(payload.pass_type, "خروج کالا"),
        "destination": payload.destination,
        "driver_name": payload.driver_name,
        "vehicle_plate": payload.vehicle_plate,
        "items": [i.model_dump() for i in payload.items],
        "approved_by": current_user.full_name or "مدیر مربوطه",
        "status": "APPROVED",
        "security_checked": False,
        "security_guard": None,
        "verified_at": None,
        "created_at": datetime.now(UTC).strftime("%Y/%m/%d %H:%M"),
        "qr_token": token,
    }
    MOCK_GATE_PASSES.insert(0, new_pass)
    return new_pass


@router.get("/verify/{token_or_number}")
async def query_gate_pass_for_guard(
    token_or_number: str,
    current_user: CurrentUser,
) -> dict[str, Any]:
    """Verification lookup by security guard (via QR code scan or pass number)."""
    clean = token_or_number.strip().upper()
    for gp in MOCK_GATE_PASSES:
        if clean in (gp["qr_token"].upper(), gp["gate_pass_number"].upper(), gp["id"].upper()):
            return {"valid": True, "gate_pass": gp}
    raise HTTPException(status_code=404, detail="برگه خروج معتبری با این مشخصات یافت نشد.")


@router.post("/passes/{pass_id}/security-check")
async def verify_and_allow_exit(
    pass_id: str,
    payload: VerifyGatePass,
    current_user: CurrentUser,
) -> dict[str, Any]:
    """Security guard stamps gate exit, completing the gate pass lifecycle."""
    for gp in MOCK_GATE_PASSES:
        if gp["id"] == pass_id or gp["gate_pass_number"] == pass_id:
            gp["security_checked"] = True
            gp["status"] = "COMPLETED"
            gp["security_guard"] = payload.guard_name or current_user.full_name or "نگهبان شیفت"
            gp["verified_at"] = datetime.now(UTC).strftime("%Y/%m/%d %H:%M")
            return {"status": "checked_out", "gate_pass": gp}
    raise HTTPException(status_code=404, detail="برگه خروج یافت نشد.")
