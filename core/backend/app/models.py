import uuid
from datetime import UTC, datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel

from app.core.security import UserRole, ROLE_TITLES, DEFAULT_ROLE_PERMISSIONS


def get_datetime_utc() -> datetime:
    return datetime.now(UTC)


# Shared properties
class UserBase(SQLModel):
    email: str = Field(unique=True, index=True, max_length=255)  # Username or Email identifier
    is_active: bool = True
    is_superuser: bool = False
    role: str = Field(default=UserRole.STAFF.value, max_length=50)
    full_name: str | None = Field(default=None, max_length=255)
    location: str = Field(default="central_office", max_length=100)  # central_office, mahshahr_plant, qazvin_plant
    permissions: str = Field(default="[]", max_length=2000)  # JSON-encoded array of permissions


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)


class UserRegister(SQLModel):
    email: str = Field(max_length=255)
    password: str = Field(min_length=6, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(SQLModel):
    email: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    is_superuser: bool | None = None
    role: str | None = None
    full_name: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=100)
    permissions: str | None = None
    password: str | None = Field(default=None, min_length=6, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: str | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=6, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


# Shared properties for Item
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(default_factory=get_datetime_utc)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: Optional["User"] = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Database model for User
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(default_factory=get_datetime_utc)
    items: list[Item] = Relationship(back_populates="owner", cascade_delete=True)

    def get_permissions_list(self) -> list[str]:
        import json
        if self.is_superuser or self.role == UserRole.ADMIN.value:
            return DEFAULT_ROLE_PERMISSIONS.get(UserRole.ADMIN.value, [])
        try:
            perms = json.loads(self.permissions) if self.permissions else []
            if not perms and self.role:
                return DEFAULT_ROLE_PERMISSIONS.get(self.role, [])
            return perms
        except Exception:
            return DEFAULT_ROLE_PERMISSIONS.get(self.role, [])


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None
    permissions_list: list[str] = []
    role_title: str | None = None
    location_title: str | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None
    role: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=6, max_length=128)
