import uuid
import logging
from datetime import datetime, UTC
from typing import Any
from app.adapters.base import BaseHTTPAdapter, AdapterError
from app.core.config import settings

logger = logging.getLogger("mokarrar.plane_adapter")


# In-memory mock store for Phase 1 offline & demo testing
MOCK_TASKS: list[dict[str, Any]] = [
    {
        "id": "task-001",
        "title": "تعمیر و اورهال پمپ هیدرولیک خط تولید شماره ۲",
        "description": "تعویض کاسه نمد، سیلینگ‌های پیستون و تست فشار هیدرولیک تا ۱۸۰ بار.",
        "state": "in_progress",
        "priority": "urgent",
        "assignee_name": "مهندس محمد رضایی",
        "assignee_id": "user-01",
        "due_date": "1405/03/15",
        "created_at": datetime.now(UTC).isoformat(),
        "tags": ["تولید", "هیدرولیک", "اورهال"],
        "comments": [
            {
                "id": "c-1",
                "author": "مهندس محمد رضایی",
                "content": "کیت آب‌بندی از انبار تحویل گرفته شد. تعمیرات مکانیکی آغاز گردید.",
                "created_at": "1405/03/10 09:30"
            }
        ]
    },
    {
        "id": "task-002",
        "title": "کالیبراسیون و تست سنسورهای دمای کوره عملیات حرارتی",
        "description": "بررسی ترموکوپل‌های نوع K و صدور گواهی کالیبراسیون دوره‌ای آزمایشگاه متالورژی.",
        "state": "todo",
        "priority": "high",
        "assignee_name": "سارا کریمی",
        "assignee_id": "user-02",
        "due_date": "1405/03/18",
        "created_at": datetime.now(UTC).isoformat(),
        "tags": ["کیفیت", "کالیبراسیون", "کوره"],
        "comments": []
    },
    {
        "id": "task-003",
        "title": "تحویل و انبارش قطعات یدکی پمپ وکیوم (درخواست خرید PR-1405-1042)",
        "description": "تطبیق فاکتور و تاییدیه فنی با سفارش خرید شرکت مکرر و ورود به انبار مرکزی.",
        "state": "backlog",
        "priority": "medium",
        "assignee_name": "حمید حسینی",
        "assignee_id": "user-03",
        "due_date": "1405/03/20",
        "created_at": datetime.now(UTC).isoformat(),
        "tags": ["انبارداری", "تدارکات", "ورود کالا"],
        "comments": []
    },
    {
        "id": "task-004",
        "title": "سرویس دوره‌ای تابلو برق اصلی کارخانه و تعویض فیوزها",
        "description": "ترموگرافی کلیدهای مینیاتوری، غبارروبی با پمپ باد، و آچارکشی شینه‌ها با موفقیت پایان یافت.",
        "state": "done",
        "priority": "medium",
        "assignee_name": "علی اکبری",
        "assignee_id": "user-04",
        "due_date": "1405/03/05",
        "created_at": datetime.now(UTC).isoformat(),
        "tags": ["برق", "سرویس_دوره‌ای"],
        "comments": [
            {
                "id": "c-2",
                "author": "علی اکبری",
                "content": "تمامی تست‌ها با موفقیت انجام شد و مدار بدون افت ولتاژ زیر بار قرار گرفت.",
                "created_at": "1405/03/05 16:45"
            }
        ]
    }
]

MOCK_STATES = [
    {"id": "backlog", "name": "بک‌لاگ", "color": "#64748B", "group": "backlog"},
    {"id": "todo", "name": "در انتظار انجام", "color": "#3B82F6", "group": "unstarted"},
    {"id": "in_progress", "name": "در حال انجام", "color": "#F59E0B", "group": "started"},
    {"id": "done", "name": "تکمیل شده", "color": "#10B981", "group": "completed"},
]

MOCK_MEMBERS = [
    {"id": "user-01", "name": "مهندس محمد رضایی", "email": "rezaei@mokarrar.ir", "role": "کارشناس نگهداری"},
    {"id": "user-02", "name": "سارا کریمی", "email": "karimi@mokarrar.ir", "role": "سرپرست کنترل کیفیت"},
    {"id": "user-03", "name": "حمید حسینی", "email": "hosseini@mokarrar.ir", "role": "انباردار مرکزی"},
    {"id": "user-04", "name": "علی اکبری", "email": "akbari@mokarrar.ir", "role": "تکنسین برق صنعتی"},
]


class PlaneAdapter:
    """
    Adapter for headless Plane Task Management Engine.
    Uses Plane REST API (/api/v1/workspaces/{slug}/projects/{project_id}/issues/)
    Automatically falls back to rich in-memory Mock Store when MOCK_EXTERNAL_SERVICES=true
    or when Plane server is not reachable.
    """

    def __init__(self):
        self.mock_mode = settings.MOCK_EXTERNAL_SERVICES or not bool(settings.PLANE_API_KEY)
        self.http_adapter = BaseHTTPAdapter(
            base_url=settings.PLANE_API_URL,
            service_name="Plane",
            timeout=10.0,
            default_headers={"X-API-Key": settings.PLANE_API_KEY or ""},
        )
        self.workspace_slug = settings.PLANE_WORKSPACE_SLUG
        self.project_id = settings.PLANE_PROJECT_ID

    async def get_states(self) -> list[dict[str, Any]]:
        if self.mock_mode:
            return MOCK_STATES
        try:
            endpoint = f"/api/v1/workspaces/{self.workspace_slug}/projects/{self.project_id}/states/"
            res = await self.http_adapter.request("GET", endpoint)
            return res if isinstance(res, list) else MOCK_STATES
        except Exception as e:
            logger.warning("Plane get_states failed: %s. Using mock fallback.", e)
            return MOCK_STATES

    async def get_members(self) -> list[dict[str, Any]]:
        if self.mock_mode:
            return MOCK_MEMBERS
        try:
            endpoint = f"/api/v1/workspaces/{self.workspace_slug}/projects/{self.project_id}/members/"
            res = await self.http_adapter.request("GET", endpoint)
            return res if isinstance(res, list) else MOCK_MEMBERS
        except Exception as e:
            logger.warning("Plane get_members failed: %s. Using mock fallback.", e)
            return MOCK_MEMBERS

    async def get_tasks(self, state: str | None = None, search: str | None = None) -> list[dict[str, Any]]:
        if self.mock_mode:
            tasks = list(MOCK_TASKS)
            if state:
                tasks = [t for t in tasks if t.get("state") == state]
            if search:
                tasks = [
                    t for t in tasks
                    if search.lower() in t.get("title", "").lower() or search.lower() in t.get("description", "").lower()
                ]
            return tasks
        try:
            endpoint = f"/api/v1/workspaces/{self.workspace_slug}/projects/{self.project_id}/issues/"
            params = {}
            if state:
                params["state"] = state
            res = await self.http_adapter.request("GET", endpoint, params=params)
            return res if isinstance(res, list) else MOCK_TASKS
        except Exception as e:
            logger.warning("Plane get_tasks failed: %s. Using mock fallback.", e)
            return MOCK_TASKS

    async def get_task(self, task_id: str) -> dict[str, Any] | None:
        if self.mock_mode:
            for task in MOCK_TASKS:
                if task["id"] == task_id:
                    return task
            return None
        try:
            endpoint = f"/api/v1/workspaces/{self.workspace_slug}/projects/{self.project_id}/issues/{task_id}/"
            return await self.http_adapter.request("GET", endpoint)
        except Exception as e:
            logger.warning("Plane get_task failed: %s. Checking mock store.", e)
            for task in MOCK_TASKS:
                if task["id"] == task_id:
                    return task
            return None

    async def create_task(
        self,
        title: str,
        description: str,
        priority: str = "medium",
        state: str = "todo",
        assignee_name: str | None = None,
        assignee_id: str | None = None,
        due_date: str | None = None,
        tags: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if self.mock_mode:
            new_id = f"task-{uuid.uuid4().hex[:6]}"
            new_task = {
                "id": new_id,
                "title": title,
                "description": description,
                "priority": priority,
                "state": state,
                "assignee_name": assignee_name or "تخصیص‌نیافته",
                "assignee_id": assignee_id or "unassigned",
                "due_date": due_date or "1405/04/01",
                "created_at": datetime.now(UTC).isoformat(),
                "tags": tags or ["عمومی"],
                "metadata": metadata or {},
                "comments": [],
            }
            MOCK_TASKS.insert(0, new_task)
            return new_task

        try:
            endpoint = f"/api/v1/workspaces/{self.workspace_slug}/projects/{self.project_id}/issues/"
            payload = {
                "name": title,
                "description_html": f"<p>{description}</p>",
                "priority": priority,
                "state": state,
                "assignees": [assignee_id] if assignee_id else [],
            }
            return await self.http_adapter.request("POST", endpoint, json_data=payload)
        except Exception as e:
            logger.warning("Plane create_task API failed: %s. Falling back to local mock store.", e)
            return await self._create_mock_task(title, description, priority, state, assignee_name, tags, metadata)

    async def _create_mock_task(self, title, description, priority, state, assignee_name, tags, metadata):
        new_id = f"task-{uuid.uuid4().hex[:6]}"
        new_task = {
            "id": new_id,
            "title": title,
            "description": description,
            "priority": priority,
            "state": state,
            "assignee_name": assignee_name or "مهندس رضایی",
            "due_date": "1405/04/01",
            "created_at": datetime.now(UTC).isoformat(),
            "tags": tags or [],
            "metadata": metadata or {},
            "comments": [],
        }
        MOCK_TASKS.insert(0, new_task)
        return new_task

    async def update_task(self, task_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        if self.mock_mode:
            for task in MOCK_TASKS:
                if task["id"] == task_id:
                    task.update(updates)
                    return task
            return None
        try:
            endpoint = f"/api/v1/workspaces/{self.workspace_slug}/projects/{self.project_id}/issues/{task_id}/"
            return await self.http_adapter.request("PATCH", endpoint, json_data=updates)
        except Exception as e:
            logger.warning("Plane update_task failed: %s. Updating mock store.", e)
            for task in MOCK_TASKS:
                if task["id"] == task_id:
                    task.update(updates)
                    return task
            return None

    async def delete_task(self, task_id: str) -> bool:
        if self.mock_mode:
            global MOCK_TASKS
            initial_len = len(MOCK_TASKS)
            MOCK_TASKS = [t for t in MOCK_TASKS if t["id"] != task_id]
            return len(MOCK_TASKS) < initial_len
        try:
            endpoint = f"/api/v1/workspaces/{self.workspace_slug}/projects/{self.project_id}/issues/{task_id}/"
            await self.http_adapter.request("DELETE", endpoint)
            return True
        except Exception:
            return False

    async def add_comment(self, task_id: str, content: str, author_name: str = "کاربر مکرر") -> dict[str, Any]:
        comment = {
            "id": f"c-{uuid.uuid4().hex[:4]}",
            "author": author_name,
            "content": content,
            "created_at": datetime.now(UTC).strftime("%Y/%m/%d %H:%M"),
        }
        for task in MOCK_TASKS:
            if task["id"] == task_id:
                task.setdefault("comments", []).append(comment)
                break
        return comment


plane_adapter = PlaneAdapter()
