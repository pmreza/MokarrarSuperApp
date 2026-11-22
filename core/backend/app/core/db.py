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

    # Pre-seed initial accounts:
    # 1. Super Admin / Developer
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
            permissions=json.dumps(DEFAULT_ROLE_PERMISSIONS[UserRole.ADMIN.value]),
        )
        crud.create_user(session=session, user_create=admin_in)

    # 2. CEO (مدیرعامل)
    ceo = session.exec(select(User).where(User.email == "ceo")).first()
    if not ceo:
        ceo_in = UserCreate(
            email="ceo",
            password="MokarrarCeo2026!",
            is_superuser=False,
            role=UserRole.CEO.value,
            full_name="مهندس مکرر (مدیرعامل محترم)",
            permissions=json.dumps(DEFAULT_ROLE_PERMISSIONS[UserRole.CEO.value]),
        )
        crud.create_user(session=session, user_create=ceo_in)

    # 3. Line Supervisor (مسئول خط تولید)
    supervisor = session.exec(select(User).where(User.email == "supervisor")).first()
    if not supervisor:
        sup_in = UserCreate(
            email="supervisor",
            password="MokarrarLine2026!",
            is_superuser=False,
            role=UserRole.LINE_SUPERVISOR.value,
            full_name="مهندس رحیمی (سرپرست خط تولید)",
            permissions=json.dumps(DEFAULT_ROLE_PERMISSIONS[UserRole.LINE_SUPERVISOR.value]),
        )
        crud.create_user(session=session, user_create=sup_in)

    # 4. Warehouse Manager (مسئول انبار و قطعات)
    warehouse = session.exec(select(User).where(User.email == "warehouse")).first()
    if not warehouse:
        store_in = UserCreate(
            email="warehouse",
            password="MokarrarStore2026!",
            is_superuser=False,
            role=UserRole.WAREHOUSE_MANAGER.value,
            full_name="مهندس کاظمی (مدیر انبار و لجستیک)",
            permissions=json.dumps(DEFAULT_ROLE_PERMISSIONS[UserRole.WAREHOUSE_MANAGER.value]),
        )
        crud.create_user(session=session, user_create=store_in)

    # 5. Technician (تکنسین خط تولید)
    technician = session.exec(select(User).where(User.email == "technician")).first()
    if not technician:
        tech_in = UserCreate(
            email="technician",
            password="MokarrarTech2026!",
            is_superuser=False,
            role=UserRole.STAFF.value,
            full_name="علی رضایی (تکنسین فنی خط A)",
            permissions=json.dumps(DEFAULT_ROLE_PERMISSIONS[UserRole.STAFF.value]),
        )
        crud.create_user(session=session, user_create=tech_in)
