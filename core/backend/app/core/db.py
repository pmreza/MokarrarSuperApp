import json
from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.core.security import DEFAULT_ROLE_PERMISSIONS, UserRole
from app.models import User, UserCreate

connect_args = {"check_same_thread": False} if str(settings.DATABASE_URL).startswith("sqlite") else {}
try:
    engine = create_engine(str(settings.DATABASE_URL), pool_pre_ping=True, connect_args=connect_args)
except Exception as e:
    import logging
    logging.warning(f"Database engine init error: {e}. Falling back to local SQLite.")
    engine = create_engine("sqlite:///./mokarrar.db", pool_pre_ping=True, connect_args={"check_same_thread": False})


def init_db(session: Session) -> None:
    from sqlmodel import SQLModel, text
    import app.modules.procurement.models  # noqa: F401
    import app.modules.webhooks.models  # noqa: F401
    import app.modules.tasks.models  # noqa: F401

    SQLModel.metadata.create_all(engine)
    
    # Auto-migrate columns if missing
    try:
        session.exec(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'staff'"))
        session.commit()
    except Exception:
        session.rollback()

    try:
        session.exec(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS permissions VARCHAR(2000) DEFAULT '[]'"))
        session.commit()
    except Exception:
        session.rollback()

    try:
        session.exec(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'central_office'"))
        session.commit()
    except Exception:
        session.rollback()

    try:
        session.exec(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)"))
        session.commit()
    except Exception:
        session.rollback()

    try:
        session.exec(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS bale_chat_id VARCHAR(50)"))
        session.commit()
    except Exception:
        session.rollback()

    for stmt in [
        "ALTER TABLE task_records ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'central_office'",
        "ALTER TABLE task_records ADD COLUMN IF NOT EXISTS follower_name VARCHAR(255) DEFAULT ''",
        "ALTER TABLE task_records ADD COLUMN IF NOT EXISTS follower_id VARCHAR(100) DEFAULT ''",
        "ALTER TABLE task_records ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE",
        "ALTER TABLE task_records ADD COLUMN IF NOT EXISTS deleted_at VARCHAR(100) DEFAULT ''",
        "ALTER TABLE task_records ADD COLUMN IF NOT EXISTS requested_due_date VARCHAR(50)",
        "ALTER TABLE task_records ADD COLUMN IF NOT EXISTS extension_reason VARCHAR(1000)",
        "ALTER TABLE task_records ADD COLUMN IF NOT EXISTS extension_status VARCHAR(50)",
        "ALTER TABLE task_records ADD COLUMN IF NOT EXISTS extension_requested_by VARCHAR(255)",
        "ALTER TABLE task_records ADD COLUMN IF NOT EXISTS extension_requested_at VARCHAR(100)",
    ]:
        try:
            session.exec(text(stmt))
            session.commit()
        except Exception:
            session.rollback()

    # Pre-seed initial Super Admin ONLY if not exists.
    # No automated demo users or mock accounts are ever re-created (production mode).
    super_admin = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not super_admin:
        admin_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
            role=UserRole.ADMIN.value,
            full_name="مدیر ارشد سامانه (برنامه‌نویس)",
            permissions=json.dumps(DEFAULT_ROLE_PERMISSIONS.get(UserRole.ADMIN.value, [])),
        )
        crud.create_user(session=session, user_create=admin_in)
