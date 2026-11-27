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
from app.models import User
from app.core.security import ROLE_TITLES

logger = logging.getLogger("mokarrar.plane_adapter")

MOCK_STATES = [
    {"id": "backlog", "name": "بک‌لاگ", "color": "#64748B", "group": "backlog"},
    {"id": "todo", "name": "در انتظار انجام", "color": "#3B82F6", "group": "unstarted"},
    {"id": "in_progress", "name": "در حال انجام", "color": "#F59E0B", "group": "started"},
    {"id": "done", "name": "تکمیل شده", "color": "#10B981", "group": "completed"},
]


class PlaneAdapter:
    """
    Adapter for headless Plane Task Management Engine.
    Uses Plane REST API or persists directly in PostgreSQL/SQLite DB.
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
        return MOCK_STATES

    async def get_members(self) -> list[dict[str, Any]]:
        """Return real registered users from DB with their role, email and location."""
        try:
            with Session(engine) as session:
                users = session.exec(select(User).where(User.is_active == True)).all()
                members = []
                for u in users:
                    display_name = u.full_name or u.email
                    role_title = ROLE_TITLES.get(u.role, u.role or "کارمند")
                    members.append({
                        "id": str(u.id),
                        "name": display_name,
                        "email": u.email,
                        "role": role_title,
                        "location": getattr(u, "location", "central_office") or "central_office",
                        "phone_number": getattr(u, "phone_number", "") or "",
                        "bale_chat_id": getattr(u, "bale_chat_id", "") or "",
                    })
                return members
        except Exception as e:
            logger.warning("Error fetching members from DB: %s", e)
            return []

    def _get_db_tasks(
        self,
        state: str | None = None,
        search: str | None = None,
        location: str | None = None,
        include_deleted: bool = False,
    ) -> list[dict[str, Any]]:
        try:
            with Session(engine) as session:
                query = select(TaskRecord)
                if not include_deleted:
                    query = query.where(TaskRecord.is_deleted == False)
                records = session.exec(query).all()
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
                    follower_name=task_data.get("follower_name", ""),
                    follower_id=task_data.get("follower_id", ""),
                    location=task_data.get("location", "central_office"),
                    due_date=task_data.get("due_date", "1405/04/01"),
                    created_at=task_data.get("created_at", datetime.now(UTC).isoformat()),
                    tags=json.dumps(task_data.get("tags", []), ensure_ascii=False),
                    is_deleted=False,
                    deleted_at="",
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
                if "assignee_id" in updates and updates["assignee_id"] is not None:
                    record.assignee_id = updates["assignee_id"]
                if "follower_name" in updates and updates["follower_name"] is not None:
                    record.follower_name = updates["follower_name"]
                if "follower_id" in updates and updates["follower_id"] is not None:
                    record.follower_id = updates["follower_id"]
                if "location" in updates and updates["location"] is not None:
                    record.location = updates["location"]
                if "due_date" in updates and updates["due_date"] is not None:
                    record.due_date = updates["due_date"]
                if "is_deleted" in updates and updates["is_deleted"] is not None:
                    record.is_deleted = updates["is_deleted"]
                    if updates["is_deleted"]:
                        record.deleted_at = datetime.now(UTC).isoformat()
                    else:
                        record.deleted_at = ""
                if "tags" in updates and updates["tags"] is not None:
                    record.tags = json.dumps(updates["tags"], ensure_ascii=False)
                session.add(record)
                session.commit()
                session.refresh(record)
                return record.to_dict()
        except Exception as e:
            logger.error("Error updating task in DB: %s", e)
            return None

    def _soft_delete_db_task(self, task_id: str) -> bool:
        """Move task to Trash Bin (soft delete)."""
        try:
            with Session(engine) as session:
                record = session.get(TaskRecord, task_id)
                if record:
                    record.is_deleted = True
                    record.deleted_at = datetime.now(UTC).isoformat()
                    session.add(record)
                    session.commit()
                    return True
                return False
        except Exception as e:
            logger.error("Error soft deleting task in DB: %s", e)
            return False

    def _hard_delete_db_task(self, task_id: str) -> bool:
        """Permanently delete task from DB."""
        try:
            with Session(engine) as session:
                record = session.get(TaskRecord, task_id)
                if record:
                    session.delete(record)
                    session.commit()
                    return True
                return False
        except Exception as e:
            logger.error("Error permanently deleting task from DB: %s", e)
            return False

    def _restore_db_task(self, task_id: str) -> dict[str, Any] | None:
        """Restore soft-deleted task from Trash Bin."""
        return self._update_db_task(task_id, {"is_deleted": False})

    async def get_tasks(
        self,
        state: str | None = None,
        search: str | None = None,
        location: str | None = None,
        include_deleted: bool = False,
    ) -> list[dict[str, Any]]:
        return self._get_db_tasks(state=state, search=search, location=location, include_deleted=include_deleted)

    async def get_trash_tasks(self) -> list[dict[str, Any]]:
        try:
            with Session(engine) as session:
                records = session.exec(select(TaskRecord).where(TaskRecord.is_deleted == True)).all()
                return [r.to_dict() for r in records]
        except Exception as e:
            logger.error("Error fetching trash tasks: %s", e)
            return []

    async def get_task(self, task_id: str) -> dict[str, Any] | None:
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
        follower_name: str | None = None,
        follower_id: str | None = None,
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
            "follower_name": follower_name or "",
            "follower_id": follower_id or "",
            "location": location or "central_office",
            "due_date": due_date or "1405/04/01",
            "created_at": datetime.now(UTC).isoformat(),
            "tags": tags or [],
            "metadata": metadata or {},
            "comments": [],
        }
        return self._create_db_task(new_task)

    async def update_task(self, task_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        return self._update_db_task(task_id, updates)

    async def delete_task(self, task_id: str, permanent: bool = False) -> bool:
        if permanent:
            return self._hard_delete_db_task(task_id)
        return self._soft_delete_db_task(task_id)

    async def restore_task(self, task_id: str) -> dict[str, Any] | None:
        return self._restore_db_task(task_id)

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
