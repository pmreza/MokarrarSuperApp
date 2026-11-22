from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

from app.core.config import settings


class UserRole(str, Enum):
    ADMIN = "admin"
    CEO = "ceo"
    LINE_SUPERVISOR = "line_supervisor"
    WAREHOUSE_MANAGER = "warehouse_manager"
    PROCUREMENT_OFFICER = "procurement_officer"
    MANAGER = "manager"
    STAFF = "staff"
    WAREHOUSE = "warehouse"


ROLE_TITLES: dict[str, str] = {
    UserRole.ADMIN.value: "مدیر ارشد سامانه (برنامه‌نویس)",
    UserRole.CEO.value: "مدیرعامل",
    UserRole.LINE_SUPERVISOR.value: "مسئول خط تولید",
    UserRole.WAREHOUSE_MANAGER.value: "مسئول انبار و قطعات",
    UserRole.PROCUREMENT_OFFICER.value: "مسئول تدارکات و خرید",
    UserRole.MANAGER.value: "مدیر میانی",
    UserRole.STAFF.value: "تکنسین / کارمند خط",
    UserRole.WAREHOUSE.value: "انباردار",
}

DEFAULT_ROLE_PERMISSIONS: dict[str, list[str]] = {
    UserRole.ADMIN.value: [
        "tasks:view", "tasks:create", "tasks:update", "tasks:delete",
        "procurement:view", "procurement:create", "procurement:approve", "procurement:pay",
        "inventory:view", "inventory:stock_in", "inventory:stock_out",
        "reports:view", "reports:export", "users:manage"
    ],
    UserRole.CEO.value: [
        "tasks:view", "tasks:create", "tasks:update",
        "procurement:view", "procurement:create", "procurement:approve", "procurement:pay",
        "inventory:view",
        "reports:view", "reports:export"
    ],
    UserRole.LINE_SUPERVISOR.value: [
        "tasks:view", "tasks:create", "tasks:update",
        "procurement:view", "procurement:create",
        "inventory:view",
        "reports:view"
    ],
    UserRole.WAREHOUSE_MANAGER.value: [
        "inventory:view", "inventory:stock_in", "inventory:stock_out",
        "procurement:view",
        "tasks:view",
        "reports:view", "reports:export"
    ],
    UserRole.PROCUREMENT_OFFICER.value: [
        "procurement:view", "procurement:create", "procurement:approve", "procurement:pay",
        "inventory:view",
        "reports:view", "reports:export"
    ],
    UserRole.MANAGER.value: [
        "tasks:view", "tasks:create", "tasks:update",
        "procurement:view", "procurement:create", "procurement:approve",
        "inventory:view", "reports:view", "reports:export"
    ],
    UserRole.STAFF.value: [
        "tasks:view", "tasks:update",
        "procurement:create",
        "inventory:view"
    ],
    UserRole.WAREHOUSE.value: [
        "inventory:view", "inventory:stock_in", "inventory:stock_out",
        "tasks:view"
    ],
}

# Role hierarchy and permissions mapping
ROLE_HIERARCHY = {
    UserRole.ADMIN: list(UserRole),
    UserRole.CEO: [UserRole.CEO, UserRole.MANAGER, UserRole.STAFF, UserRole.LINE_SUPERVISOR, UserRole.WAREHOUSE_MANAGER, UserRole.PROCUREMENT_OFFICER],
    UserRole.MANAGER: [UserRole.MANAGER, UserRole.STAFF, UserRole.WAREHOUSE],
    UserRole.LINE_SUPERVISOR: [UserRole.LINE_SUPERVISOR, UserRole.STAFF],
    UserRole.WAREHOUSE_MANAGER: [UserRole.WAREHOUSE_MANAGER, UserRole.WAREHOUSE, UserRole.STAFF],
    UserRole.PROCUREMENT_OFFICER: [UserRole.PROCUREMENT_OFFICER, UserRole.STAFF],
    UserRole.WAREHOUSE: [UserRole.WAREHOUSE, UserRole.STAFF],
    UserRole.STAFF: [UserRole.STAFF],
}


def role_satisfies(user_role: str | UserRole, required_roles: list[str | UserRole]) -> bool:
    """Check if the user role satisfies any of the required roles considering hierarchy."""
    user_role_str = str(user_role.value if isinstance(user_role, UserRole) else user_role)
    try:
        user_enum = UserRole(user_role_str)
    except ValueError:
        return False

    allowed_effective_roles = [r.value for r in ROLE_HIERARCHY.get(user_enum, [])]
    for required in required_roles:
        req_str = str(required.value if isinstance(required, UserRole) else required)
        if req_str in allowed_effective_roles or req_str == user_role_str:
            return True
    return False


password_hash = PasswordHash(
    (
        Argon2Hasher(),
        BcryptHasher(),
    )
)


ALGORITHM = "HS256"


def create_access_token(subject: str | Any, expires_delta: timedelta, role: str = UserRole.STAFF.value) -> str:
    expire = datetime.now(UTC) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject), "role": str(role)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(
    plain_password: str, hashed_password: str
) -> tuple[bool, str | None]:
    return password_hash.verify_and_update(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)
