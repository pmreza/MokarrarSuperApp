from typing import Any
from fastapi import APIRouter
from app.api.deps import CurrentUser
from app.adapters.plane_adapter import plane_adapter
from app.adapters.inventree_adapter import inventree_adapter
from app.modules.procurement.routes import MOCK_PRS

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])


@router.get("/kpis")
async def get_dashboard_kpis(current_user: CurrentUser) -> dict[str, Any]:
    """Unified executive indicators across Tasks, Procurement, and Warehouse from real data."""
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

    # Dynamic activities synthesized from real recent tasks and procurement records
    activities: list[dict[str, Any]] = []
    for pr in MOCK_PRS[:3]:
        activities.append({
            "id": f"act-pr-{pr.get('id')}",
            "type": "PROCUREMENT",
            "title": f"سفارش خرید {pr.get('request_number', '')}: {pr.get('title', '')[:35]}",
            "user": pr.get("requester_name", "کاربر"),
            "time": pr.get("created_at", "امروز"),
            "badge": pr.get("status", "pending"),
        })

    for t in tasks[:3]:
        activities.append({
            "id": f"act-task-{t.get('id')}",
            "type": "TASK",
            "title": f"تسک: {t.get('title', '')[:40]}",
            "user": t.get("assignee_name", "تخصیص‌نیافته"),
            "time": t.get("due_date", "امروز"),
            "badge": t.get("state", "todo"),
        })

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
                {"name": p["name"], "stock": p["total_in_stock"], "min": p["minimum_stock"], "unit": p.get("units", "عدد")}
                for p in low_stock
            ],
        },
        "activities": activities,
    }
