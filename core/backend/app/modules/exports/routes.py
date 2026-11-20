from fastapi import APIRouter
from fastapi.responses import Response

from app.api.deps import CurrentUser
from app.adapters.plane_adapter import plane_adapter
from app.adapters.inventree_adapter import inventree_adapter
from app.modules.procurement.routes import MOCK_PRS
from app.modules.exports.service import (
    export_tasks_to_excel,
    export_tasks_to_docx,
    export_procurement_to_excel,
    export_inventory_to_excel,
)

router = APIRouter(prefix="/exports", tags=["Export Engine (Excel & Word)"])


@router.get("/tasks/excel")
async def download_tasks_excel(current_user: CurrentUser):
    """Download styled Persian RTL Excel of all tasks."""
    tasks = await plane_adapter.get_tasks()
    stream = export_tasks_to_excel(tasks)
    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=mokarrar_tasks.xlsx"},
    )


@router.get("/tasks/docx")
async def download_tasks_docx(current_user: CurrentUser):
    """Download styled Persian Word report of all tasks."""
    tasks = await plane_adapter.get_tasks()
    stream = export_tasks_to_docx(tasks)
    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=mokarrar_tasks_report.docx"},
    )


@router.get("/procurement/excel")
async def download_procurement_excel(current_user: CurrentUser):
    """Download styled Persian RTL Excel of purchase requests."""
    stream = export_procurement_to_excel(MOCK_PRS)
    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=mokarrar_procurement.xlsx"},
    )


@router.get("/inventory/excel")
async def download_inventory_excel(current_user: CurrentUser):
    """Download styled Persian RTL Excel of inventory items."""
    parts = await inventree_adapter.get_parts()
    stream = export_inventory_to_excel(parts)
    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=mokarrar_inventory.xlsx"},
    )
