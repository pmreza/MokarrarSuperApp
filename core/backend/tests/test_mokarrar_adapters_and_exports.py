import asyncio
import pytest
from app.adapters.plane_adapter import plane_adapter
from app.adapters.inventree_adapter import inventree_adapter
from app.adapters.n8n_adapter import n8n_adapter
from app.modules.exports.service import (
    export_tasks_to_excel,
    export_tasks_to_docx,
    export_procurement_to_excel,
    export_inventory_to_excel,
)


def test_plane_adapter_mock_tasks():
    tasks = asyncio.run(plane_adapter.get_tasks())
    assert isinstance(tasks, list)

    # Test creating a new task
    new_task = asyncio.run(
        plane_adapter.create_task(
            title="تسک آزمایشی خط ۴",
            description="تست تست",
            priority="high",
            state="todo",
        )
    )
    assert new_task["title"] == "تسک آزمایشی خط ۴"
    assert new_task["priority"] == "high"
    assert "id" in new_task
    assert "state" in new_task


def test_inventree_adapter_mock_inventory():
    parts = asyncio.run(inventree_adapter.get_parts())
    assert isinstance(parts, list)

    if not parts:
        # Seed a test part via import_parts when mock store starts empty
        asyncio.run(
            inventree_adapter.import_parts(
                [
                    {
                        "IPN": "TEST-PART-01",
                        "name": "قطعه آزمایشی تست",
                        "total_in_stock": 10.0,
                        "minimum_stock": 2.0,
                        "units": "عدد",
                    }
                ]
            )
        )
        parts = asyncio.run(inventree_adapter.get_parts())

    assert len(parts) >= 1
    part = parts[0]
    initial_stock = part["total_in_stock"]

    # Stock-In
    record = asyncio.run(
        inventree_adapter.create_stock_in(
            part_id=part["id"],
            quantity=5.0,
            receiver="تستر سیستم",
            notes="ورود آزمایشی",
        )
    )
    assert record["quantity"] == 5.0
    assert part["total_in_stock"] == initial_stock + 5.0


def test_n8n_hmac_signing():
    payload = {"event": "pr.paid", "request_id": "test-123"}
    sig = n8n_adapter.sign_payload(payload)
    assert sig.startswith("sha256=")


def test_excel_export_tasks():
    mock_tasks = [
        {
            "id": "t-1",
            "title": "تعمیر پمپ هیدرولیک",
            "state": "in_progress",
            "priority": "urgent",
            "assignee_name": "مهندس رضایی",
            "due_date": "1405/03/15",
        }
    ]
    stream = export_tasks_to_excel(mock_tasks)
    bytes_data = stream.getvalue()
    assert len(bytes_data) > 1000
    # Check PK zip header for valid xlsx
    assert bytes_data[:2] == b"PK"


def test_docx_export_tasks():
    mock_tasks = [
        {
            "id": "t-1",
            "title": "سرویس تابلو برق",
            "state": "done",
            "priority": "medium",
            "assignee_name": "علی اکبری",
            "due_date": "1405/03/05",
        }
    ]
    stream = export_tasks_to_docx(mock_tasks)
    bytes_data = stream.getvalue()
    assert len(bytes_data) > 1000
    assert bytes_data[:2] == b"PK"

