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
    except InvalidTokenError, ValidationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
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
