from typing import Any
from fastapi import APIRouter, HTTPException, Query, status, BackgroundTasks
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.api.deps import CurrentUser
from app.adapters.plane_adapter import plane_adapter
from app.core.config import settings
from app.core.db import engine
from app.models import User
from app.modules.bot.routes import send_bale_message

router = APIRouter(prefix="/tasks", tags=["Tasks (Plane Proxy)"])


class TaskCreateRequest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = ""
    priority: str = Field(default="medium")
    state: str = Field(default="todo")
    assignee_name: str | None = None
    assignee_id: str | None = None
    follower_name: str | None = None
    follower_id: str | None = None
    location: str = Field(default="central_office")
    due_date: str | None = None
    tags: list[str] = []


class TaskUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    state: str | None = None
    assignee_name: str | None = None
    assignee_id: str | None = None
    follower_name: str | None = None
    follower_id: str | None = None
    location: str | None = None
    due_date: str | None = None
    tags: list[str] | None = None


class CommentCreateRequest(BaseModel):
    content: str = Field(min_length=1)


async def notify_users_via_bale(task: dict[str, Any], action: str = "create"):
    """Send Bale push notifications to Assignee and Follower if connected."""
    bale_token = getattr(settings, "BALE_BOT_TOKEN", None)
    if not bale_token:
        return

    assignee_id = task.get("assignee_id")
    assignee_name = task.get("assignee_name") or "همکار گرامی"
    follower_id = task.get("follower_id")
    follower_name = task.get("follower_name") or "مسئول پیگیری"
    title = task.get("title", "")
    priority_labels = {"low": "پایین", "medium": "متوسط", "urgent": "فوری", "critical": "بحرانی"}
    p_fa = priority_labels.get(task.get("priority", "medium"), task.get("priority", "متوسط"))
    due = task.get("due_date", "مشخص‌نشده")

    try:
        with Session(engine) as session:
            # 1. Notify Assignee
            assignee_user = None
            if assignee_id and assignee_id != "unassigned":
                try:
                    assignee_user = session.get(User, int(assignee_id))
                except Exception:
                    assignee_user = session.exec(select(User).where((User.full_name == assignee_name) | (User.email == assignee_name))).first()

            if assignee_user and assignee_user.bale_chat_id:
                if action == "create":
                    msg = (
                        f"📌 *دستور کار جدید به شما محول شد!*\n\n"
                        f"• عنوان: *{title}*\n"
                        f"• اولویت: *{p_fa}*\n"
                        f"• مهلت انجام: `{due}`\n"
                        f"• مسئول پیگیری: *{follower_name}*\n\n"
                        f"جهت مشاهده و تغییر وضعیت از دکمه‌های ربات استفاده کنید."
                    )
                elif action == "done":
                    msg = f"✅ دستور کار *{title}* به عنوان اتمام‌یافته علامت‌گذاری شد."
                else:
                    msg = f"🔄 وضعیت دستور کار *{title}* بروزرسانی گردید."
                await send_bale_message(bale_token, assignee_user.bale_chat_id, msg)

            # 2. Notify Follower
            follower_user = None
            if follower_id:
                try:
                    follower_user = session.get(User, int(follower_id))
                except Exception:
                    follower_user = session.exec(select(User).where((User.full_name == follower_name) | (User.email == follower_name))).first()

            if follower_user and follower_user.bale_chat_id:
                if action == "create":
                    f_msg = (
                        f"👀 *شما به عنوان مسئول پیگیری تسک تعیین شدید:*\n\n"
                        f"• عنوان: *{title}*\n"
                        f"• مسئول اجرا: *{assignee_name}*\n"
                        f"• اولویت: *{p_fa}*\n"
                        f"• مهلت انجام: `{due}`\n\n"
                        f"لطفاً روند پیشرفت کار توسط {assignee_name} را پیگیری فرمایید."
                    )
                elif action == "done":
                    f_msg = f"🎉 *اطلاع به مسئول پیگیری:*\nدستور کار *{title}* توسط {assignee_name} تکمیل شد."
                else:
                    f_msg = f"🔔 *اطلاع به مسئول پیگیری:*\nتسک *{title}* بروزرسانی شد."
                await send_bale_message(bale_token, follower_user.bale_chat_id, f_msg)
    except Exception as e:
        pass


@router.get("/")
async def list_tasks(
    current_user: CurrentUser,
    state: str | None = Query(None, description="Filter by state id"),
    search: str | None = Query(None, description="Search term in title or description"),
    location: str | None = Query(None, description="Filter by location"),
) -> list[dict[str, Any]]:
    """List active tasks (excluding soft-deleted tasks)."""
    return await plane_adapter.get_tasks(state=state, search=search, location=location, include_deleted=False)


@router.get("/trash")
async def list_trash_tasks(current_user: CurrentUser) -> list[dict[str, Any]]:
    """List soft-deleted tasks in Trash Bin."""
    return await plane_adapter.get_trash_tasks()


@router.get("/states")
async def list_states(current_user: CurrentUser) -> list[dict[str, Any]]:
    """List task workflow states for Kanban board."""
    return await plane_adapter.get_states()


@router.get("/members")
async def list_members(current_user: CurrentUser) -> list[dict[str, Any]]:
    """List real registered team members from DB for assignment & follow-up."""
    return await plane_adapter.get_members()


@router.get("/stats/summary")
async def get_task_summary(current_user: CurrentUser) -> dict[str, Any]:
    """Provide KPI aggregation for dashboard and task board."""
    tasks = await plane_adapter.get_tasks(include_deleted=False)
    total = len(tasks)
    in_progress = sum(1 for t in tasks if t.get("state") == "in_progress")
    todo = sum(1 for t in tasks if t.get("state") == "todo")
    done = sum(1 for t in tasks if t.get("state") == "done")
    urgent = sum(1 for t in tasks if t.get("priority") in ("urgent", "critical"))

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
async def create_task(req: TaskCreateRequest, current_user: CurrentUser, background_tasks: BackgroundTasks) -> dict[str, Any]:
    """Create a new task and notify assignee & follower via Bale."""
    task = await plane_adapter.create_task(
        title=req.title,
        description=req.description,
        priority=req.priority,
        state=req.state,
        assignee_name=req.assignee_name or current_user.full_name or current_user.email,
        assignee_id=req.assignee_id,
        follower_name=req.follower_name,
        follower_id=req.follower_id,
        location=req.location,
        due_date=req.due_date,
        tags=req.tags,
    )
    background_tasks.add_task(notify_users_via_bale, task, "create")
    return task


@router.patch("/{task_id}")
async def update_task(task_id: str, req: TaskUpdateRequest, current_user: CurrentUser, background_tasks: BackgroundTasks) -> dict[str, Any]:
    """Update task fields or move across Kanban status columns."""
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = await plane_adapter.update_task(task_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")

    action = "done" if updates.get("state") == "done" else "update"
    background_tasks.add_task(notify_users_via_bale, updated, action)
    return updated


@router.post("/{task_id}/restore")
async def restore_task(task_id: str, current_user: CurrentUser) -> dict[str, Any]:
    """Restore task from trash bin."""
    restored = await plane_adapter.restore_task(task_id)
    if not restored:
        raise HTTPException(status_code=404, detail="Task not found")
    return restored


@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
async def delete_task(
    task_id: str,
    current_user: CurrentUser,
    permanent: bool = Query(False, description="If true, permanently remove; if false, move to trash"),
):
    """Delete a task (soft delete by default, or permanent)."""
    deleted = await plane_adapter.delete_task(task_id, permanent=permanent)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "deleted", "permanent": permanent}


@router.post("/{task_id}/comments")
async def add_task_comment(
    task_id: str, req: CommentCreateRequest, current_user: CurrentUser
) -> dict[str, Any]:
    """Add a Persian discussion comment to a task."""
    author_name = current_user.full_name or current_user.email
    return await plane_adapter.add_comment(task_id, req.content, author_name=author_name)
