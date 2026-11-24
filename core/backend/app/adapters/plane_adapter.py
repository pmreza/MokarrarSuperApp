import json
import uuid
import logging
from datetime import datetime, UTC
from typing import Any
from app.adapters.base import BaseHTTPAdapter, AdapterError
from app.core.config import settings
from app.core.db import engine
from sqlmodel import Session, select
from app.modules.tasks.models import TaskRecord

logger = logging.getLogger("mokarrar.plane_adapter")


# DB-backed persistence for tasks when Plane external API is not configured
# No hardcoded fake tasks - tasks are persisted directly in PostgreSQL/SQLite

MOCK_STATES = [
    {"id": "backlog", "name": "بک‌لاگ", "color": "#64748B", "group": "backlog"},
    {"id": "todo", "name": "در انتظار انجام", "color": "#3B82F6", "group": "unstarted"},
    {"id": "in_progress", "name": "در حال انجام", "color": "#F59E0B", "group": "started"},
    {"id": "done", "name": "تکمیل شده", "color": "#10B981", "group": "completed"},
]

MOCK_MEMBERS: list[dict[str, Any]] = []


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

    def _get_db_tasks(
        self,
        state: str | None = None,
        search: str | None = None,
        location: str | None = None,
    ) -> list[dict[str, Any]]:
        try:
            with Session(engine) as session:
                records = session.exec(select(TaskRecord)).all()
                tasks = [r.to_dict() for r in records]
                if state:
                    tasks = [t for t in tasks if t.get("state") == state]
                if location and location != "all":
                    tasks = [t for t in tasks if t.get("location") == location]
                if search:
                    s = search.lower()
                    tasks = [
                        t for t in tasks
                        if s in t.get("title", "").lower() or s in t.get("description", "").lower()
                    ]
                return tasks
        except Exception as e:
            logger.warning("Error fetching tasks from DB: %s", e)
            return []

    def _create_db_task(self, task_data: dict[str, Any]) -> dict[str, Any]:
        try:
            with Session(engine) as session:
                record = TaskRecord(
                    id=task_data["id"],
                    title=task_data["title"],
                    description=task_data.get("description", ""),
                    state=task_data.get("state", "todo"),
                    priority=task_data.get("priority", "medium"),
                    assignee_name=task_data.get("assignee_name", "تخصیص‌نیافته"),
                    assignee_id=task_data.get("assignee_id", "unassigned"),
                    location=task_data.get("location", "central_office"),
                    due_date=task_data.get("due_date", "1405/04/01"),
                    created_at=task_data.get("created_at", datetime.now(UTC).isoformat()),
                    tags=json.dumps(task_data.get("tags", []), ensure_ascii=False),
                    metadata_json=json.dumps(task_data.get("metadata", {}), ensure_ascii=False),
                    comments_json=json.dumps(task_data.get("comments", []), ensure_ascii=False),
                )
                session.add(record)
                session.commit()
                session.refresh(record)
                return record.to_dict()
        except Exception as e:
            logger.error("Error creating task in DB: %s", e)
            return task_data

    def _update_db_task(self, task_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        try:
            with Session(engine) as session:
                record = session.get(TaskRecord, task_id)
                if not record:
                    return None
                if "title" in updates and updates["title"] is not None:
                    record.title = updates["title"]
                if "description" in updates and updates["description"] is not None:
                    record.description = updates["description"]
                if "state" in updates and updates["state"] is not None:
                    record.state = updates["state"]
                if "priority" in updates and updates["priority"] is not None:
                    record.priority = updates["priority"]
                if "assignee_name" in updates and updates["assignee_name"] is not None:
                    record.assignee_name = updates["assignee_name"]
                if "location" in updates and updates["location"] is not None:
                    record.location = updates["location"]
                if "due_date" in updates and updates["due_date"] is not None:
                    record.due_date = updates["due_date"]
                if "tags" in updates and updates["tags"] is not None:
                    record.tags = json.dumps(updates["tags"], ensure_ascii=False)
                session.add(record)
                session.commit()
                session.refresh(record)
                return record.to_dict()
        except Exception as e:
            logger.error("Error updating task in DB: %s", e)
            return None

    def _delete_db_task(self, task_id: str) -> bool:
        try:
            with Session(engine) as session:
                record = session.get(TaskRecord, task_id)
                if record:
                    session.delete(record)
                    session.commit()
                    return True
                return False
        except Exception as e:
            logger.error("Error deleting task from DB: %s", e)
            return False

    async def get_tasks(
        self,
        state: str | None = None,
        search: str | None = None,
        location: str | None = None,
    ) -> list[dict[str, Any]]:
        if self.mock_mode:
            return self._get_db_tasks(state=state, search=search, location=location)
        try:
            endpoint = f"/api/v1/workspaces/{self.workspace_slug}/projects/{self.project_id}/issues/"
            params = {}
            if state:
                params["state"] = state
            res = await self.http_adapter.request("GET", endpoint, params=params)
            return res if isinstance(res, list) else self._get_db_tasks(state=state, search=search, location=location)
        except Exception as e:
            logger.warning("Plane get_tasks failed: %s. Using persistent DB fallback.", e)
            return self._get_db_tasks(state=state, search=search, location=location)

    async def get_task(self, task_id: str) -> dict[str, Any] | None:
        if self.mock_mode:
            try:
                with Session(engine) as session:
                    record = session.get(TaskRecord, task_id)
                    return record.to_dict() if record else None
            except Exception:
                return None
        try:
            endpoint = f"/api/v1/workspaces/{self.workspace_slug}/projects/{self.project_id}/issues/{task_id}/"
            return await self.http_adapter.request("GET", endpoint)
        except Exception as e:
            logger.warning("Plane get_task failed: %s. Checking persistent DB.", e)
            try:
                with Session(engine) as session:
                    record = session.get(TaskRecord, task_id)
                    return record.to_dict() if record else None
            except Exception:
                return None

    async def create_task(
        self,
        title: str,
        description: str,
        priority: str = "medium",
        state: str = "todo",
        assignee_name: str | None = None,
        assignee_id: str | None = None,
        location: str = "central_office",
        due_date: str | None = None,
        tags: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        new_task = {
            "id": f"task-{uuid.uuid4().hex[:6]}",
            "title": title,
            "description": description,
            "priority": priority,
            "state": state,
            "assignee_name": assignee_name or "تخصیص‌نیافته",
            "assignee_id": assignee_id or "unassigned",
            "location": location or "central_office",
            "due_date": due_date or "1405/04/01",
            "created_at": datetime.now(UTC).isoformat(),
            "tags": tags or ["عمومی"],
            "metadata": metadata or {},
            "comments": [],
        }
        if self.mock_mode:
            return self._create_db_task(new_task)

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
            logger.warning("Plane create_task API failed: %s. Falling back to persistent DB.", e)
            return self._create_db_task(new_task)

    async def update_task(self, task_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        if self.mock_mode:
            return self._update_db_task(task_id, updates)
        try:
            endpoint = f"/api/v1/workspaces/{self.workspace_slug}/projects/{self.project_id}/issues/{task_id}/"
            return await self.http_adapter.request("PATCH", endpoint, json_data=updates)
        except Exception as e:
            logger.warning("Plane update_task failed: %s. Updating persistent DB.", e)
            return self._update_db_task(task_id, updates)

    async def delete_task(self, task_id: str) -> bool:
        if self.mock_mode:
            return self._delete_db_task(task_id)
        try:
            endpoint = f"/api/v1/workspaces/{self.workspace_slug}/projects/{self.project_id}/issues/{task_id}/"
            await self.http_adapter.request("DELETE", endpoint)
            return True
        except Exception:
            return self._delete_db_task(task_id)

    async def add_comment(self, task_id: str, content: str, author_name: str = "کاربر مکرر") -> dict[str, Any]:
        comment = {
            "id": f"c-{uuid.uuid4().hex[:4]}",
            "author": author_name,
            "content": content,
            "created_at": datetime.now(UTC).strftime("%Y/%m/%d %H:%M"),
        }
        try:
            with Session(engine) as session:
                record = session.get(TaskRecord, task_id)
                if record:
                    comments = json.loads(record.comments_json) if record.comments_json else []
                    comments.append(comment)
                    record.comments_json = json.dumps(comments, ensure_ascii=False)
                    session.add(record)
                    session.commit()
        except Exception as e:
            logger.error("Error adding comment: %s", e)
        return comment


plane_adapter = PlaneAdapter()
