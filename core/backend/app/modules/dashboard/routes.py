from typing import Any
from fastapi import APIRouter
from app.api.deps import CurrentUser
from app.adapters.plane_adapter import plane_adapter
from app.adapters.inventree_adapter import inventree_adapter
from app.modules.procurement.routes import MOCK_PRS

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])


@router.get("/kpis")
async def get_dashboard_kpis(current_user: CurrentUser) -> dict[str, Any]:
    """Unified executive indicators across Tasks, Procurement, and Warehouse."""
    tasks = await plane_adapter.get_tasks()
    parts = await inventree_adapter.get_parts()

    # Tasks stats
    total_tasks = len(tasks)
    done_tasks = sum(1 for t in tasks if t.get("state") == "done")
    in_progress_tasks = sum(1 for t in tasks if t.get("state") == "in_progress")

    # Procurement stats
    total_prs = len(MOCK_PRS)
    pending_prs = [r for r in MOCK_PRS if r.get("status") == "PENDING_APPROVAL"]
    approved_prs = [r for r in MOCK_PRS if r.get("status") in ("APPROVED", "PAID", "DELIVERED")]
    pending_cost = sum(r.get("total_estimated_cost", 0) for r in pending_prs)
    total_procurement_cost = sum(r.get("total_estimated_cost", 0) for r in MOCK_PRS)

    # Inventory stats
    total_parts = len(parts)
    low_stock = [p for p in parts if p.get("total_in_stock", 0) <= p.get("minimum_stock", 0)]

    # Unified recent timeline
    activities = [
        {
            "id": "act-1",
            "type": "PROCUREMENT",
            "title": "درخواست خرید PR-1405-1042 تایید شد",
            "user": "مدیر مهندسی",
            "time": "۱۰ دقیقه پیش",
            "badge": "approved",
        },
        {
            "id": "act-2",
            "type": "TASK",
            "title": "تسک تعمیر پمپ هیدرولیک خط ۲ به 'در حال انجام' منتقل شد",
            "user": "مهندس محمد رضایی",
            "time": "۴۵ دقیقه پیش",
            "badge": "in_progress",
        },
        {
            "id": "act-3",
            "type": "INVENTORY",
            "title": "ورود ۲۰ عدد بلبرینگ SKF 6205 به انبار مرکزی ثبت شد",
            "user": "حمید حسینی",
            "time": "۲ ساعت پیش",
            "badge": "stock_in",
        },
        {
            "id": "act-4",
            "type": "TASK",
            "title": "سرویس دوره‌ای تابلو برق اصلی کارخانه با موفقیت تکمیل شد",
            "user": "علی اکبری",
            "time": "دیروز",
            "badge": "done",
        },
    ]

    return {
        "tasks": {
            "total": total_tasks,
            "in_progress": in_progress_tasks,
            "done": done_tasks,
            "rate": round((done_tasks / total_tasks * 100), 1) if total_tasks else 0,
        },
        "procurement": {
            "total_count": total_prs,
            "pending_count": len(pending_prs),
            "pending_amount_irr": pending_cost,
            "total_amount_irr": total_procurement_cost,
        },
        "inventory": {
            "total_sku": total_parts,
            "low_stock_count": len(low_stock),
            "low_stock_items": [
                {"name": p["name"], "stock": p["total_in_stock"], "min": p["minimum_stock"], "unit": p["units"]}
                for p in low_stock
            ],
        },
        "activities": activities,
    }
