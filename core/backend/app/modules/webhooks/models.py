from datetime import UTC, datetime
from enum import Enum
from sqlmodel import Field, SQLModel


class IdempotencyStatus(str, Enum):
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class IdempotencyKey(SQLModel, table=True):
    __tablename__ = "idempotency_keys"

    key: str = Field(primary_key=True, max_length=255)
    event_type: str = Field(max_length=100)
    resource_id: str = Field(max_length=100)
    status: str = Field(default=IdempotencyStatus.PROCESSING.value, max_length=30)
    payload_hash: str | None = Field(default=None, max_length=128)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
