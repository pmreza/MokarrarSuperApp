import json
from datetime import UTC, datetime
from typing import Any
from sqlmodel import Field, SQLModel


class TaskRecord(SQLModel, table=True):
    __tablename__ = "task_records"

    id: str = Field(primary_key=True)
    title: str = Field(max_length=255)
    description: str = Field(default="")
    state: str = Field(default="todo", max_length=50)
    priority: str = Field(default="medium", max_length=50)
    assignee_name: str = Field(default="تخصیص‌نیافته", max_length=255)
    assignee_id: str = Field(default="unassigned", max_length=100)
    due_date: str = Field(default="1405/04/01", max_length=50)
    created_at: str = Field(default="")
    tags: str = Field(default="[]")
    metadata_json: str = Field(default="{}")
    comments_json: str = Field(default="[]")

    def to_dict(self) -> dict[str, Any]:
        try:
            parsed_tags = json.loads(self.tags) if self.tags else []
        except Exception:
            parsed_tags = []

        try:
            parsed_metadata = json.loads(self.metadata_json) if self.metadata_json else {}
        except Exception:
            parsed_metadata = {}

        try:
            parsed_comments = json.loads(self.comments_json) if self.comments_json else []
        except Exception:
            parsed_comments = []

        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "state": self.state,
            "priority": self.priority,
            "assignee_name": self.assignee_name,
            "assignee_id": self.assignee_id,
            "due_date": self.due_date,
            "created_at": self.created_at or datetime.now(UTC).isoformat(),
            "tags": parsed_tags,
            "metadata": parsed_metadata,
            "comments": parsed_comments,
        }
