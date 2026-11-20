"""
Maintenance & Preventive Maintenance (PM) Module for Factory Lines.
Monitors line downtime, machine breakdowns, MTTR metrics, and technicians dispatch.
"""

from datetime import datetime, UTC
from typing import Any
import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, ManagerUser
from app.adapters.plane_adapter import plane_adapter
from app.adapters.sms_adapter import sms_adapter
from app.adapters.bale_adapter import bale_adapter

router = APIRouter(prefix="/maintenance", tags=["Preventive & Emergency Maintenance (PM)"])

# In-memory mock store for maintenance tickets
MOCK_MAINTENANCE_TICKETS: list[dict[str, Any]] = [
    {
        "id": "pm-101",
        "ticket_number": "PM-1405-081",
        "line_number": 2,
        "machine_name": "پرس هیدرولیک ۲۰۰ تن کوماتسو",
        "failure_type": "هیدرولیک/پنوماتیک",
        "priority": "urgent",
        "status": "IN_PROGRESS",
        "description": "نشتی شدید روغن از سیل اصلی پیستون و افت فشار هیدرولیک به زیر ۱۰۰ بار.",
        "reported_by": "علیرضا نجفی (اپراتور خط)",
        "technician_assigned": "مهندس محمد رضایی",
        "technician_phone": "09121112233",
        "downtime_minutes": 45,
        "root_cause": "فرسودگی پکینگ و سیلینگ پیستون در اثر حرارت مداوم",
        "started_at": "1405/03/10 08:30",
        "resolved_at": None,
    },
    {
        "id": "pm-102",
        "ticket_number": "PM-1405-080",
        "line_number": 1,
        "machine_name": "دستگاه برش لیزر فیبر نوری Bystronic",
        "failure_type": "مکانیکی",
        "priority": "high",
        "status": "RESOLVED",
        "description": "انحراف نازل برش و خطای محور Z در حین برش ورق استیل ۳ میل.",
        "reported_by": "امیر جلالی",
        "technician_assigned": "مهندس فرزاد میرزایی",
        "technician_phone": "09124445566",
        "downtime_minutes": 70,
        "root_cause": "گرفتگی گاید ریل محور Z با براده‌های فلزی",
        "started_at": "1405/03/08 11:15",
        "resolved_at": "1405/03/08 12:25",
    },
    {
        "id": "pm-103",
        "ticket_number": "PM-1405-079",
        "line_number": 3,
        "machine_name": "روبوت جوشکاری اتوماتیک ABB",
        "failure_type": "برقی/الکترونیک",
        "priority": "medium",
        "status": "CLOSED",
        "description": "آلارم دمای بالای درایو محور ۴ روبوت.",
        "reported_by": "مرتضی کرمی",
        "technician_assigned": "سارا کریمی",
        "technician_phone": "09127778899",
        "downtime_minutes": 25,
        "root_cause": "خرابی فن خنک‌کننده درایو серو موتور",
        "started_at": "1405/03/05 15:40",
        "resolved_at": "1405/03/05 16:05",
    },
]


class CreateMaintenanceTicket(BaseModel):
    line_number: int = Field(ge=1, le=10)
    machine_name: str
    failure_type: str = "مکانیکی"
    priority: str = "urgent"
    description: str
    technician_phone: str = "09120000000"


class ResolveMaintenanceTicket(BaseModel):
    root_cause: str
    downtime_minutes: int = Field(ge=0)
    parts_replaced: list[str] = []
    notes: str = ""


@router.get("/tickets")
async def list_tickets(current_user: CurrentUser) -> list[dict[str, Any]]:
    """List all factory maintenance and line stop incident tickets."""
    return MOCK_MAINTENANCE_TICKETS


@router.post("/tickets", status_code=status.HTTP_201_CREATED)
async def report_line_stoppage(
    payload: CreateMaintenanceTicket,
    current_user: CurrentUser,
) -> dict[str, Any]:
    """
    Emergency Line Stop & Breakdown Reporter.
    Creates urgent ticket, notifies technician via SMS/Bale, and creates a task in Plane.
    """
    new_id = f"pm-{uuid.uuid4().hex[:6]}"
    now_str = datetime.now(UTC).strftime("%Y/%m/%d %H:%M")
    ticket_num = f"PM-1405-{len(MOCK_MAINTENANCE_TICKETS) + 82}"

    ticket = {
        "id": new_id,
        "ticket_number": ticket_num,
        "line_number": payload.line_number,
        "machine_name": payload.machine_name,
        "failure_type": payload.failure_type,
        "priority": payload.priority,
        "status": "OPEN",
        "description": payload.description,
        "reported_by": current_user.full_name or "اپراتور مکرر",
        "technician_assigned": "واحد تعمیرات و نگهداری (شیفت آماده)",
        "technician_phone": payload.technician_phone,
        "downtime_minutes": 0,
        "root_cause": "",
        "started_at": now_str,
        "resolved_at": None,
    }
    MOCK_MAINTENANCE_TICKETS.insert(0, ticket)

    # 1. Create urgent task in Plane
    await plane_adapter.create_task(
        title=f"🚨 توقف خط {payload.line_number} - {payload.machine_name}",
        description=f"خرابی فوری: {payload.description}\nگزارش‌دهنده: {ticket['reported_by']}",
        priority="urgent",
        tags=["PM", f"خط {payload.line_number}", "توقف اضطراری"],
    )

    # 2. Dispatch SMS alert to technician
    await sms_adapter.send_urgent_maintenance_alert(
        technician_phone=payload.technician_phone,
        line_number=payload.line_number,
        machine_name=payload.machine_name,
    )

    return ticket


@router.post("/tickets/{ticket_id}/resolve")
async def resolve_ticket(
    ticket_id: str,
    payload: ResolveMaintenanceTicket,
    current_user: CurrentUser,
) -> dict[str, Any]:
    """Resolve an incident, record downtime duration and root cause analysis."""
    for ticket in MOCK_MAINTENANCE_TICKETS:
        if ticket["id"] == ticket_id:
            ticket["status"] = "RESOLVED"
            ticket["root_cause"] = payload.root_cause
            ticket["downtime_minutes"] = payload.downtime_minutes
            ticket["resolved_at"] = datetime.now(UTC).strftime("%Y/%m/%d %H:%M")
            return ticket
    raise HTTPException(status_code=404, detail="تیکت تعمیرات یافت نشد")


@router.get("/stats")
async def get_maintenance_kpis(current_user: CurrentUser) -> dict[str, Any]:
    """Calculate MTTR, total downtime minutes, and breakdown distribution."""
    total_downtime = sum(t["downtime_minutes"] for t in MOCK_MAINTENANCE_TICKETS)
    resolved_count = sum(1 for t in MOCK_MAINTENANCE_TICKETS if t["status"] in ("RESOLVED", "CLOSED"))
    active_stops = sum(1 for t in MOCK_MAINTENANCE_TICKETS if t["status"] in ("OPEN", "IN_PROGRESS"))
    mttr_avg = round(total_downtime / max(resolved_count, 1), 1)

    return {
        "active_line_stops": active_stops,
        "total_downtime_hours": round(total_downtime / 60, 1),
        "mttr_minutes": mttr_avg,
        "total_incidents": len(MOCK_MAINTENANCE_TICKETS),
        "lines_health": [
            {"line": 1, "status": "ONLINE", "label": "خط ۱ - برش لیزر و پرس (فعال)"},
            {"line": 2, "status": "DOWN" if any(t["line_number"] == 2 and t["status"] == "IN_PROGRESS" for t in MOCK_MAINTENANCE_TICKETS) else "ONLINE", "label": "خط ۲ - هیدرولیک و قالب‌سازی"},
            {"line": 3, "status": "ONLINE", "label": "خط ۳ - مونتاژ و روباتیک"},
            {"line": 4, "status": "ONLINE", "label": "خط ۴ - رنگ و پخت کوره"},
        ],
    }
