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
    MANAGER = "manager"
    STAFF = "staff"
    WAREHOUSE = "warehouse"


# Role hierarchy and permissions mapping
ROLE_HIERARCHY = {
    UserRole.ADMIN: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.WAREHOUSE],
    UserRole.MANAGER: [UserRole.MANAGER, UserRole.STAFF, UserRole.WAREHOUSE],
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

