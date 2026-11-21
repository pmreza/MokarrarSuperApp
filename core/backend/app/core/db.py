from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import User, UserCreate

connect_args = {"check_same_thread": False} if str(settings.DATABASE_URL).startswith("sqlite") else {}
engine = create_engine(str(settings.DATABASE_URL), pool_pre_ping=True, connect_args=connect_args)


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    from sqlmodel import SQLModel, text
    import app.modules.procurement.models  # noqa: F401
    import app.modules.webhooks.models  # noqa: F401

    SQLModel.metadata.create_all(engine)
    try:
        session.exec(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'staff'"))
        session.commit()
    except Exception:
        session.rollback()

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
            role="admin",
            full_name="مدیر ارشد مکرر",
        )
        user = crud.create_user(session=session, user_create=user_in)
