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
    # Central Office Roles
    OFFICE_MANAGER = "office_manager"
    MANAGING_DIRECTOR = "managing_director"
    RD_ENVIRONMENT = "rd_environment"
    IT_SUPERVISOR = "it_supervisor"
    # Factory Roles (Mahshahr / Qazvin)
    PRODUCTION_MANAGER = "production_manager"
    QC_SUPERVISOR = "qc_supervisor"
    MAINTENANCE_SUPERVISOR = "maintenance_supervisor"
    ADMIN_STAFF = "admin_staff"
    WORKER = "worker"
    # Backward Compatibility
    CEO = "ceo"
    LINE_SUPERVISOR = "line_supervisor"
    WAREHOUSE_MANAGER = "warehouse_manager"
    PROCUREMENT_OFFICER = "procurement_officer"
    MANAGER = "manager"
    STAFF = "staff"
    WAREHOUSE = "warehouse"


ROLE_TITLES: dict[str, str] = {
    UserRole.ADMIN.value: "مدیر ارشد سامانه (برنامه‌نویس)",
    # Central Office
    UserRole.OFFICE_MANAGER.value: "مدیر دفتر",
    UserRole.MANAGING_DIRECTOR.value: "مدیریت عامل",
    UserRole.RD_ENVIRONMENT.value: "محیط زیست / تحقیق و توسعه",
    UserRole.IT_SUPERVISOR.value: "سرپرست آی‌تی",
    # Factory / Plants
    UserRole.PRODUCTION_MANAGER.value: "مدیر خط تولید",
    UserRole.QC_SUPERVISOR.value: "سرپرست کنترل کیفیت",
    UserRole.MAINTENANCE_SUPERVISOR.value: "سرپرست تعمیر و نگهداری",
    UserRole.ADMIN_STAFF.value: "کارمند اداری",
    UserRole.WORKER.value: "کارگر",
    # Legacy / Compatibility
    UserRole.CEO.value: "مدیریت عامل",
    UserRole.LINE_SUPERVISOR.value: "مدیر خط تولید",
    UserRole.WAREHOUSE_MANAGER.value: "سرپرست تعمیر و نگهداری",
    UserRole.PROCUREMENT_OFFICER.value: "کارمند اداری",
    UserRole.MANAGER.value: "مدیر دفتر",
    UserRole.STAFF.value: "کارگر",
    UserRole.WAREHOUSE.value: "کارمند اداری",
}

LOCATION_ROLES: dict[str, list[dict[str, str]]] = {
    "central_office": [
        {"role": UserRole.OFFICE_MANAGER.value, "title": "مدیر دفتر"},
        {"role": UserRole.MANAGING_DIRECTOR.value, "title": "مدیریت عامل"},
        {"role": UserRole.RD_ENVIRONMENT.value, "title": "محیط زیست / تحقیق و توسعه"},
        {"role": UserRole.IT_SUPERVISOR.value, "title": "سرپرست آی‌تی"},
        {"role": UserRole.ADMIN.value, "title": "مدیر ارشد سامانه (برنامه‌نویس)"},
    ],
    "mahshahr_plant": [
        {"role": UserRole.PRODUCTION_MANAGER.value, "title": "مدیر خط تولید"},
        {"role": UserRole.QC_SUPERVISOR.value, "title": "سرپرست کنترل کیفیت"},
        {"role": UserRole.MAINTENANCE_SUPERVISOR.value, "title": "سرپرست تعمیر و نگهداری"},
        {"role": UserRole.ADMIN_STAFF.value, "title": "کارمند اداری"},
        {"role": UserRole.WORKER.value, "title": "کارگر"},
    ],
    "qazvin_plant": [
        {"role": UserRole.PRODUCTION_MANAGER.value, "title": "مدیر خط تولید"},
        {"role": UserRole.QC_SUPERVISOR.value, "title": "سرپرست کنترل کیفیت"},
        {"role": UserRole.MAINTENANCE_SUPERVISOR.value, "title": "سرپرست تعمیر و نگهداری"},
        {"role": UserRole.ADMIN_STAFF.value, "title": "کارمند اداری"},
        {"role": UserRole.WORKER.value, "title": "کارگر"},
    ],
}

DEFAULT_ROLE_PERMISSIONS: dict[str, list[str]] = {
    UserRole.ADMIN.value: [
        "tasks:view", "tasks:create", "tasks:update", "tasks:delete",
        "procurement:view", "procurement:create", "procurement:approve", "procurement:pay",
        "inventory:view", "inventory:stock_in", "inventory:stock_out",
        "reports:view", "reports:export", "users:manage"
    ],
    UserRole.OFFICE_MANAGER.value: [
        "tasks:view", "tasks:create", "tasks:update",
        "procurement:view", "procurement:create", "procurement:approve",
        "reports:view", "reports:export"
    ],
    UserRole.MANAGING_DIRECTOR.value: [
        "tasks:view", "tasks:create", "tasks:update",
        "procurement:view", "procurement:create", "procurement:approve", "procurement:pay",
        "inventory:view", "reports:view", "reports:export"
    ],
    UserRole.RD_ENVIRONMENT.value: [
        "tasks:view", "tasks:create", "tasks:update",
        "reports:view"
    ],
    UserRole.IT_SUPERVISOR.value: [
        "tasks:view", "tasks:create", "tasks:update", "tasks:delete",
        "reports:view", "users:manage"
    ],
    UserRole.PRODUCTION_MANAGER.value: [
        "tasks:view", "tasks:create", "tasks:update",
        "procurement:view", "procurement:create",
        "inventory:view", "reports:view"
    ],
    UserRole.QC_SUPERVISOR.value: [
        "tasks:view", "tasks:create", "tasks:update",
        "reports:view"
    ],
    UserRole.MAINTENANCE_SUPERVISOR.value: [
        "tasks:view", "tasks:create", "tasks:update",
        "inventory:view", "inventory:stock_in", "inventory:stock_out",
        "procurement:create"
    ],
    UserRole.ADMIN_STAFF.value: [
        "tasks:view", "tasks:create", "tasks:update",
        "procurement:view", "procurement:create"
    ],
    UserRole.WORKER.value: [
        "tasks:view", "tasks:update"
    ],
    # Legacy fallbacks
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
    UserRole.MANAGING_DIRECTOR: list(UserRole),
    UserRole.CEO: list(UserRole),
    UserRole.OFFICE_MANAGER: [
        UserRole.OFFICE_MANAGER, UserRole.MANAGER, UserRole.RD_ENVIRONMENT,
        UserRole.IT_SUPERVISOR, UserRole.ADMIN_STAFF, UserRole.PROCUREMENT_OFFICER,
        UserRole.WAREHOUSE_MANAGER, UserRole.WAREHOUSE, UserRole.STAFF,
    ],
    UserRole.PRODUCTION_MANAGER: [
        UserRole.PRODUCTION_MANAGER, UserRole.LINE_SUPERVISOR, UserRole.QC_SUPERVISOR,
        UserRole.MAINTENANCE_SUPERVISOR, UserRole.WAREHOUSE_MANAGER, UserRole.WAREHOUSE,
        UserRole.ADMIN_STAFF, UserRole.WORKER, UserRole.STAFF,
    ],
    UserRole.IT_SUPERVISOR: [UserRole.IT_SUPERVISOR, UserRole.ADMIN_STAFF, UserRole.STAFF],
    UserRole.RD_ENVIRONMENT: [UserRole.RD_ENVIRONMENT, UserRole.STAFF],
    UserRole.QC_SUPERVISOR: [UserRole.QC_SUPERVISOR, UserRole.WORKER, UserRole.STAFF],
    UserRole.MAINTENANCE_SUPERVISOR: [
        UserRole.MAINTENANCE_SUPERVISOR, UserRole.WAREHOUSE_MANAGER,
        UserRole.WAREHOUSE, UserRole.WORKER, UserRole.STAFF,
    ],
    UserRole.ADMIN_STAFF: [UserRole.ADMIN_STAFF, UserRole.PROCUREMENT_OFFICER, UserRole.WAREHOUSE, UserRole.STAFF],
    UserRole.WORKER: [UserRole.WORKER, UserRole.STAFF],
    UserRole.MANAGER: [UserRole.MANAGER, UserRole.STAFF, UserRole.WAREHOUSE],
    UserRole.LINE_SUPERVISOR: [UserRole.LINE_SUPERVISOR, UserRole.STAFF],
    UserRole.WAREHOUSE_MANAGER: [UserRole.WAREHOUSE_MANAGER, UserRole.WAREHOUSE, UserRole.STAFF],
    UserRole.PROCUREMENT_OFFICER: [UserRole.PROCUREMENT_OFFICER, UserRole.STAFF],
    UserRole.WAREHOUSE: [UserRole.WAREHOUSE, UserRole.STAFF],
    UserRole.STAFF: [UserRole.STAFF],
}


def get_password_fingerprint(hashed_password: str | None) -> str | None:
    """Return a stable 16-char SHA-256 fingerprint of a hashed password for JWT invalidation."""
    if not hashed_password:
        return None
    import hashlib
    return hashlib.sha256(hashed_password.encode("utf-8")).hexdigest()[:16]


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


def create_access_token(
    subject: str | Any,
    expires_delta: timedelta,
    role: str = UserRole.STAFF.value,
    pwd_hash: str | None = None,
) -> str:
    expire = datetime.now(UTC) + expires_delta
    to_encode: dict[str, Any] = {"exp": expire, "sub": str(subject), "role": str(role)}
    if pwd_hash:
        to_encode["pwd_hash"] = pwd_hash
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(
    plain_password: str, hashed_password: str
) -> tuple[bool, str | None]:
    return password_hash.verify_and_update(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)
