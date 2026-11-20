from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils
from app.core.config import settings
from app.modules.tasks.routes import router as tasks_router
from app.modules.procurement.routes import router as procurement_router
from app.modules.inventory.routes import router as inventory_router
from app.modules.webhooks.routes import router as webhooks_router
from app.modules.exports.routes import router as exports_router
from app.modules.dashboard.routes import router as dashboard_router
from app.modules.bots.routes import router as bots_router
from app.modules.maintenance.routes import router as maintenance_router
from app.modules.production.routes import router as production_router
from app.modules.gatepass.routes import router as gatepass_router

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)

# Mokarrar Unified Enterprise Super App Modules
api_router.include_router(tasks_router)
api_router.include_router(procurement_router)
api_router.include_router(inventory_router)
api_router.include_router(webhooks_router)
api_router.include_router(exports_router)
api_router.include_router(dashboard_router)
api_router.include_router(bots_router)
api_router.include_router(maintenance_router)
api_router.include_router(production_router)
api_router.include_router(gatepass_router)


if settings.FASTAPI_ENV == "development":
    api_router.include_router(private.router)
