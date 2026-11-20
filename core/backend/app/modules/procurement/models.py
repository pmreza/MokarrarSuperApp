import uuid
from datetime import UTC, datetime
from enum import Enum
from sqlmodel import Field, Relationship, SQLModel


class PRStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PAID = "PAID"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


def get_utc_now() -> datetime:
    return datetime.now(UTC)


class PurchaseRequestBase(SQLModel):
    request_number: str = Field(index=True, unique=True, max_length=50)
    title: str = Field(max_length=255)
    department: str = Field(default="تولید", max_length=100)
    total_estimated_cost: float = Field(default=0.0)
    justification: str = Field(default="")
    status: str = Field(default=PRStatus.PENDING_APPROVAL.value, max_length=30)
    priority: str = Field(default="medium", max_length=20)


class PurchaseRequest(PurchaseRequestBase, table=True):
    __tablename__ = "purchase_requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    requester_id: uuid.UUID = Field(index=True)
    requester_name: str = Field(max_length=255)
    manager_note: str | None = Field(default=None)
    plane_task_id: str | None = Field(default=None, max_length=100)
    inventree_stock_id: str | None = Field(default=None, max_length=100)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

    items: list["PurchaseRequestItem"] = Relationship(back_populates="request", cascade_delete=True)
    approvals: list["ApprovalLog"] = Relationship(back_populates="request", cascade_delete=True)


class PurchaseRequestItemBase(SQLModel):
    item_name: str = Field(max_length=255)
    quantity: float = Field(default=1.0)
    unit: str = Field(default="عدد", max_length=50)
    estimated_unit_price: float = Field(default=0.0)
    part_number: str | None = Field(default=None, max_length=100)


class PurchaseRequestItem(PurchaseRequestItemBase, table=True):
    __tablename__ = "purchase_request_items"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    request_id: uuid.UUID = Field(foreign_key="purchase_requests.id", ondelete="CASCADE")
    request: PurchaseRequest | None = Relationship(back_populates="items")


class ApprovalLog(SQLModel, table=True):
    __tablename__ = "approval_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    request_id: uuid.UUID = Field(foreign_key="purchase_requests.id", ondelete="CASCADE")
    approver_id: uuid.UUID
    approver_name: str = Field(max_length=255)
    action: str = Field(max_length=50)  # SUBMIT, APPROVE, REJECT, MARK_PAID, DELIVER
    comment: str | None = Field(default=None)
    timestamp: datetime = Field(default_factory=get_utc_now)

    request: PurchaseRequest | None = Relationship(back_populates="approvals")
