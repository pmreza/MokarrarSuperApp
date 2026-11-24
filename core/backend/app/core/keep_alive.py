import asyncio
import logging
import httpx

logger = logging.getLogger(__name__)

BACKEND_URL = "https://mokarrar-backend.onrender.com/api/v1/utils/health-check"
FRONTEND_URL = "https://mokarrar-frontend.onrender.com"
PING_INTERVAL_SECONDS = 600  # 10 minutes (prevents Render 15-minute free tier idle sleep)

_keep_alive_task: asyncio.Task | None = None


async def _ping_services():
    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Ping Backend Router
        try:
            res_back = await client.get(BACKEND_URL)
            logger.info(f"[KeepAlive] Backend ping status: {res_back.status_code}")
        except Exception as e:
            logger.debug(f"[KeepAlive] Backend ping note: {e}")

        # 2. Ping Frontend Router
        try:
            res_front = await client.get(FRONTEND_URL)
            logger.info(f"[KeepAlive] Frontend ping status: {res_front.status_code}")
        except Exception as e:
            logger.debug(f"[KeepAlive] Frontend ping note: {e}")


async def keep_alive_loop():
    """Background worker that continuously sends light pings every 10 minutes."""
    logger.info("[KeepAlive] Service started. Render inactivity preventer active.")
    # Initial sleep to allow FastAPI startup to settle
    await asyncio.sleep(60)
    while True:
        try:
            await _ping_services()
        except Exception as e:
            logger.error(f"[KeepAlive] Unexpected loop error: {e}")
        await asyncio.sleep(PING_INTERVAL_SECONDS)


def start_keep_alive():
    global _keep_alive_task
    if _keep_alive_task is None or _keep_alive_task.done():
        _keep_alive_task = asyncio.create_task(keep_alive_loop())


def stop_keep_alive():
    global _keep_alive_task
    if _keep_alive_task and not _keep_alive_task.done():
        _keep_alive_task.cancel()
