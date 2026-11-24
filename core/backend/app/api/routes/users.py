import json
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import col, delete, func, select

from app import crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.core.config import settings
from app.core.security import (
    DEFAULT_ROLE_PERMISSIONS,
    LOCATION_ROLES,
    ROLE_TITLES,
    UserRole,
    get_password_hash,
    verify_password,
)
from app.models import (
    Item,
    Message,
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.utils import generate_new_account_email, send_email

router = APIRouter(prefix="/users", tags=["users"])


LOCATION_TITLES = {
    "central_office": "دفتر مرکزی",
    "mahshahr_plant": "کارخانه ماهشهر",
    "qazvin_plant": "کارخانه قزوین",
}

LOCATIONS_LIST = [
    {"id": "central_office", "title": "دفتر مرکزی"},
    {"id": "mahshahr_plant", "title": "کارخانه ماهشهر"},
    {"id": "qazvin_plant", "title": "کارخانه قزوین"},
]


def enrich_user_public(u: User) -> UserPublic:
    perms = u.get_permissions_list()
    role_title = ROLE_TITLES.get(u.role, u.role)
    user_loc = getattr(u, "location", "central_office") or "central_office"
    location_title = LOCATION_TITLES.get(user_loc, user_loc)
    return UserPublic.model_validate(
        u,
        update={
            "permissions_list": perms,
            "role_title": role_title,
            "location": user_loc,
            "location_title": location_title,
        },
    )


@router.get("/roles/metadata")
def get_roles_metadata(current_user: CurrentUser) -> dict[str, Any]:
    """Return available roles, locations and granular permissions list for UI management."""
    available_permissions = [
        {"id": "tasks:view", "name": "مشاهده وظایف و کانبان", "category": "مدیریت تسک‌ها"},
        {"id": "tasks:create", "name": "ثبت تسک جدید", "category": "مدیریت تسک‌ها"},
        {"id": "tasks:update", "name": "ویرایش و تغییر وضعیت تسک", "category": "مدیریت تسک‌ها"},
        {"id": "tasks:delete", "name": "حذف تسک", "category": "مدیریت تسک‌ها"},
        {"id": "procurement:view", "name": "مشاهده درخواست‌های خرید", "category": "تدارکات و خرید"},
        {"id": "procurement:create", "name": "ثبت درخواست خرید (PR)", "category": "تدارکات و خرید"},
        {"id": "procurement:approve", "name": "تأیید درخواست خرید (مدیریت)", "category": "تدارکات و خرید"},
        {"id": "procurement:pay", "name": "تأیید پرداخت و مالی", "category": "تدارکات و خرید"},
        {"id": "inventory:view", "name": "مشاهده کاردکس و موجودی انبار", "category": "انبارداری"},
        {"id": "inventory:stock_in", "name": "ثبت ورود کالا به انبار", "category": "انبارداری"},
        {"id": "inventory:stock_out", "name": "ثبت خروج و تحویل کالا", "category": "انبارداری"},
        {"id": "reports:view", "name": "مشاهده داشبورد و آمار", "category": "گزارشات"},
        {"id": "reports:export", "name": "خروجی اکسل و ورد اسناد", "category": "گزارشات"},
        {"id": "users:manage", "name": "مدیریت کامل کاربران و نقش‌ها", "category": "مدیریت سیستم"},
    ]

    roles = [
        {
            "id": role.value,
            "title": ROLE_TITLES.get(role.value, role.value),
            "default_permissions": DEFAULT_ROLE_PERMISSIONS.get(role.value, []),
        }
        for role in UserRole
    ]

    return {
        "roles": roles,
        "locations": LOCATIONS_LIST,
        "location_roles": LOCATION_ROLES,
        "permissions": available_permissions,
    }


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """Retrieve users with enriched roles and permissions."""
    count_statement = select(func.count()).select_from(User)
    count = session.exec(count_statement).one()

    statement = (
        select(User).order_by(col(User.created_at).desc()).offset(skip).limit(limit)
    )
    users = session.exec(statement).all()
    users_public = [enrich_user_public(user) for user in users]
    return UsersPublic(data=users_public, count=count)


@router.post(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic
)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """Create new user with assigned role and permissions."""
    user = crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="کاربری با این شناسه / ایمیل قبلاً در سیستم ثبت شده است.",
        )

    # Auto-fill permissions from role default if not provided
    if not user_in.permissions or user_in.permissions == "[]":
        default_perms = DEFAULT_ROLE_PERMISSIONS.get(user_in.role, [])
        user_in.permissions = json.dumps(default_perms)

    user = crud.create_user(session=session, user_create=user_in)
    return enrich_user_public(user)


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """Update own user information."""
    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="شناسه / ایمیل وارد شده تکراری است"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return enrich_user_public(current_user)


@router.patch("/me/password", response_model=Message)
def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """Update own password securely."""
    verified, _ = verify_password(body.current_password, current_user.hashed_password)
    if not verified:
        raise HTTPException(status_code=400, detail="رمز عبور فعلی اشتباه است")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="رمز عبور جدید نمی‌تواند با رمز فعلی یکسان باشد"
        )
    hashed_password = get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    session.commit()
    return Message(message="رمز عبور با موفقیت بروزرسانی شد.")


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """Get current logged-in user profile, role, and permissions."""
    return enrich_user_public(current_user)


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """Delete own user account."""
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="امکان حذف حساب مدیر ارشد سامانه وجود ندارد"
        )
    session.delete(current_user)
    session.commit()
    return Message(message="حساب کاربری حذف گردید.")


@router.post("/signup")
def register_user() -> Any:
    """Public registration is disabled. Users can only be created by system administrators."""
    raise HTTPException(
        status_code=403,
        detail="ثبت‌نام عمومی در سامانه غیرفعال است. حساب‌های کاربری منحصراً توسط مدیر سیستم ایجاد می‌شوند.",
    )


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """Get a specific user by id."""
    user = session.get(User, user_id)
    if user == current_user:
        return enrich_user_public(user)
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="شما مجوز مشاهده جزئیات این کاربر را ندارید.",
        )
    if user is None:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    return enrich_user_public(user)


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    """Update a user's details, role, permissions, or password."""
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="کاربر با این شناسه یافت نشد",
        )
    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=409, detail="شناسه / ایمیل قبلاً برای کاربر دیگری ثبت شده است"
            )

    db_user = crud.update_user(session=session, db_user=db_user, user_in=user_in)
    return enrich_user_public(db_user)


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    """Delete a user."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="کاربر یافت نشد")
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="حذف حساب کاربری جاری مجاز نمی‌باشد."
        )
    statement = delete(Item).where(col(Item.owner_id) == user_id)
    session.exec(statement)
    session.delete(user)
    session.commit()
    return Message(message="کاربر با موفقیت حذف شد")
