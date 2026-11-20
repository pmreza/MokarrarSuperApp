import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.modules.bots.bale_bot import BaleBotService


@pytest.mark.anyio
async def test_bale_bot_start():
    update = {
        "update_id": 1001,
        "message": {
            "message_id": 1,
            "chat": {"id": 123456789},
            "text": "/start",
        },
    }
    res = await BaleBotService.handle_update(update)
    assert res["status"] == "handled"
    assert res["action"] == "start"


@pytest.mark.anyio
async def test_bale_bot_tasks_listing():
    update = {
        "update_id": 1002,
        "message": {
            "message_id": 2,
            "chat": {"id": 123456789},
            "text": "📋 تسک‌های جاری من",
        },
    }
    res = await BaleBotService.handle_update(update)
    assert res["status"] == "handled"
    assert res["action"] in ("show_tasks", "no_tasks")


@pytest.mark.anyio
async def test_bale_bot_emergency_line_stop():
    update = {
        "update_id": 1003,
        "callback_query": {
            "id": "cb_001",
            "message": {"chat": {"id": 123456789}},
            "data": "stop_line:2",
        },
    }
    res = await BaleBotService.handle_update(update)
    assert res["status"] == "handled"
    assert res["action"] == "emergency_logged"
    assert res["line"] == "2"


@pytest.mark.anyio
async def test_bale_webhook_endpoint():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        payload = {
            "update_id": 2001,
            "message": {
                "message_id": 10,
                "chat": {"id": 998877},
                "text": "❓ راهنمای بات مکرر",
            },
        }
        response = await ac.post("/api/v1/bots/bale/webhook", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["result"]["status"] == "handled"
