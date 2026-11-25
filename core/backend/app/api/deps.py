import uuid
from collections.abc import Generator
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import TokenPayload, User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user_id = uuid.UUID(str(token_data.sub)) if token_data.sub else None
    user = session.get(User, user_id) if user_id else None
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Invalidate session if password was changed after token issuance
    token_pwd_hash = payload.get("pwd_hash")
    current_fingerprint = security.get_password_fingerprint(getattr(user, "hashed_password", None))
    if token_pwd_hash and current_fingerprint and current_fingerprint != token_pwd_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="رمز عبور شما تغییر یافته است. لطفاً مجدداً وارد شوید.",
        )

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(allowed_roles: list[str | security.UserRole]):
    def role_checker(current_user: CurrentUser) -> User:
        if current_user.is_superuser:
            return current_user
        if not security.role_satisfies(current_user.role, allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Required role in {[str(r.value if isinstance(r, security.UserRole) else r) for r in allowed_roles]}",
            )
        return current_user

    return role_checker


AdminUser = Annotated[User, Depends(require_roles([security.UserRole.ADMIN]))]
ManagerUser = Annotated[User, Depends(require_roles([security.UserRole.ADMIN, security.UserRole.MANAGER]))]
WarehouseUser = Annotated[User, Depends(require_roles([security.UserRole.ADMIN, security.UserRole.WAREHOUSE]))]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser and current_user.role != security.UserRole.ADMIN.value:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user
