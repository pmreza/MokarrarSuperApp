from typing import Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser
from app.adapters.plane_adapter import plane_adapter

router = APIRouter(prefix="/tasks", tags=["Tasks (Plane Proxy)"])


class TaskCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = ""
    priority: str = Field(default="medium")
    state: str = Field(default="todo")
    assignee_name: str | None = None
    assignee_id: str | None = None
    due_date: str | None = None
    tags: list[str] = []


class TaskUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    state: str | None = None
    assignee_name: str | None = None
    assignee_id: str | None = None
    due_date: str | None = None
    tags: list[str] | None = None


class CommentCreateRequest(BaseModel):
    content: str = Field(min_length=1)


@router.get("/")
async def list_tasks(
    current_user: CurrentUser,
    state: str | None = Query(None, description="Filter by state id"),
    search: str | None = Query(None, description="Search term in title or description"),
) -> list[dict[str, Any]]:
    """List enriched tasks from Plane task engine with filtering."""
    return await plane_adapter.get_tasks(state=state, search=search)


@router.get("/states")
async def list_states(current_user: CurrentUser) -> list[dict[str, Any]]:
    """List task workflow states for Kanban board."""
    return await plane_adapter.get_states()


@router.get("/members")
async def list_members(current_user: CurrentUser) -> list[dict[str, Any]]:
    """List project assignees & team members."""
    return await plane_adapter.get_members()


@router.get("/stats/summary")
async def get_task_summary(current_user: CurrentUser) -> dict[str, Any]:
    """Provide KPI aggregation for dashboard and task board."""
    tasks = await plane_adapter.get_tasks()
    total = len(tasks)
    in_progress = sum(1 for t in tasks if t.get("state") == "in_progress")
    todo = sum(1 for t in tasks if t.get("state") == "todo")
    done = sum(1 for t in tasks if t.get("state") == "done")
    urgent = sum(1 for t in tasks if t.get("priority") == "urgent")

    return {
        "total": total,
        "todo": todo,
        "in_progress": in_progress,
        "done": done,
        "urgent": urgent,
        "completion_rate": round((done / total * 100), 1) if total > 0 else 0,
    }


@router.get("/{task_id}")
async def get_task(task_id: str, current_user: CurrentUser) -> dict[str, Any]:
    """Retrieve details for a single task."""
    task = await plane_adapter.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_task(req: TaskCreateRequest, current_user: CurrentUser) -> dict[str, Any]:
    """Create a new task in Plane."""
    return await plane_adapter.create_task(
        title=req.title,
        description=req.description,
        priority=req.priority,
        state=req.state,
        assignee_name=req.assignee_name or current_user.full_name,
        assignee_id=req.assignee_id,
        due_date=req.due_date,
        tags=req.tags,
    )


@router.patch("/{task_id}")
async def update_task(task_id: str, req: TaskUpdateRequest, current_user: CurrentUser) -> dict[str, Any]:
    """Update task fields or move across Kanban status columns."""
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = await plane_adapter.update_task(task_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str, current_user: CurrentUser):
    """Delete a task."""
    deleted = await plane_adapter.delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return None


@router.post("/{task_id}/comments")
async def add_task_comment(
    task_id: str, req: CommentCreateRequest, current_user: CurrentUser
) -> dict[str, Any]:
    """Add a Persian discussion comment to a task."""
    author_name = current_user.full_name or current_user.email
    return await plane_adapter.add_comment(task_id, req.content, author_name=author_name)
