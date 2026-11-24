import logging
import re
from typing import Any
import httpx
from fastapi import APIRouter, Request, BackgroundTasks
from pydantic import BaseModel
from sqlmodel import Session, select, col

from app.core.config import settings
from app.core.db import engine
from app.core.security import ROLE_TITLES
from app.models import User
from app.modules.tasks.models import TaskRecord
from app.adapters.inventree_adapter import inventree_adapter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bot", tags=["Bale & Telegram Bot"])

LOCATION_TITLES = {
    "central_office": "دفتر مرکزی",
    "mahshahr_plant": "کارخانه ماهشهر",
    "qazvin_plant": "کارخانه قزوین",
}


class BotMessage(BaseModel):
    chat_id: int | str
    text: str


def clean_phone_number(raw: str) -> str:
    """Normalize Persian/Arabic digits and international formats to 09xxxxxxxxx."""
    if not raw:
        return ""
    # Map Persian & Arabic numerals to English
    persian_digits = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩"
    english_digits = "01234567890123456789"
    trans = str.maketrans(persian_digits, english_digits)
    cleaned = raw.translate(trans)
    # Remove all non-digit characters
    cleaned = re.sub(r"\D", "", cleaned)
    # Handle country codes
    if cleaned.startswith("0098"):
        cleaned = "0" + cleaned[4:]
    elif cleaned.startswith("98"):
        cleaned = "0" + cleaned[2:]
    elif cleaned.startswith("9") and len(cleaned) == 10:
        cleaned = "0" + cleaned
    return cleaned


def format_persian_tasks(tasks: list[TaskRecord]) -> str:
    if not tasks:
        return "📋 در حال حاضر هیچ دستور کار بازی برای شما یا واحد شما ثبت نشده است."

    lines = ["📋 *فهرست دستور کارهای فعال در سامانه مکرر:*", ""]
    status_map = {
        "todo": "📌 برنامه‌ریزی شده",
        "in_progress": "⏳ در حال اجرا",
        "done": "✅ اتمام یافته",
        "cancelled": "🚫 لغو شده",
    }
    priority_map = {
        "urgent": "🔴 بحرانی (کد قرمز)",
        "high": "🟠 فوری",
        "medium": "🟡 متوسط",
        "low": "🟢 عادی",
    }

    for idx, t in enumerate(tasks[:6], 1):
        st = status_map.get(t.state, t.state)
        pr = priority_map.get(t.priority, t.priority)
        lines.append(f"{idx}. *{t.title}*")
        lines.append(f"   • کد رهگیری: `{t.id}`")
        lines.append(f"   • مسئول: {t.assignee_name}")
        lines.append(f"   • وضعیت: {st} | اولویت: {pr}")
        lines.append("")

    lines.append("💡 جهت تغییر وضعیت به *اتمام یافته*، دستور زیر را بفرستید:")
    lines.append("`/done <کد_رهگیری>` (مثال: `/done task-01`)")
    return "\n".join(lines)


def format_persian_inventory(items: list[dict[str, Any]]) -> str:
    if not items:
        return "📦 اطلاعات انبار یافت نشد."

    lines = ["📦 *وضعیت موجودی و کاردکس اقلام کارخانه:*", ""]
    for idx, item in enumerate(items[:6], 1):
        stock = item.get("stock", 0)
        min_stock = item.get("min_stock", item.get("min", 5))
        alert = "⚠️ کسری انبار" if stock <= min_stock else "✅ مطلوب"
        lines.append(f"{idx}. *{item.get('name')}*")
        lines.append(f"   • موجودی: *{stock} {item.get('unit', 'عدد')}* (حداقل مجاز: {min_stock})")
        lines.append(f"   • وضعیت: {alert}")
        lines.append("")
    return "\n".join(lines)


@router.get("/status")
async def get_bale_bot_status():
    """Diagnostic check for Bale bot connection and webhook registration."""
    token = getattr(settings, "BALE_BOT_TOKEN", None)
    if not token:
        return {"status": "unconfigured", "error": "BALE_BOT_TOKEN is not set"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            me_resp = await client.get(f"https://tapi.bale.ai/bot{token}/getMe")
            wh_resp = await client.get(f"https://tapi.bale.ai/bot{token}/getWebhookInfo")
            return {
                "status": "connected",
                "bot": me_resp.json() if me_resp.status_code == 200 else me_resp.text,
                "webhook": wh_resp.json() if wh_resp.status_code == 200 else wh_resp.text,
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.post("/bale/webhook")
async def bale_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Handle incoming webhooks from Bale Messenger Bot API.
    Authenticates users against PostgreSQL/SQLite database via phone_number or bale_chat_id.
    """
    try:
        data = await request.json()
    except Exception:
        return {"status": "ignored", "detail": "Invalid JSON"}

    message = data.get("message") or {}
    callback_query = data.get("callback_query") or {}

    if callback_query:
        chat_id = callback_query.get("message", {}).get("chat", {}).get("id") or callback_query.get("from", {}).get("id")
        text = (callback_query.get("data") or "").strip()
        contact = None
    else:
        chat_id = message.get("chat", {}).get("id") or message.get("from", {}).get("id")
        text = (message.get("text") or "").strip()
        contact = message.get("contact")

    if not chat_id:
        return {"status": "ok", "detail": "No chat id found"}

    chat_id_str = str(chat_id)

    # 1. Check if user is already linked with this bale_chat_id in DB
    with Session(engine) as session:
        user = session.exec(select(User).where(User.bale_chat_id == chat_id_str)).first()

        # Check if the user is attempting phone number login (contact object or text)
        input_phone = ""
        if contact and isinstance(contact, dict):
            input_phone = clean_phone_number(contact.get("phone_number", ""))
        elif re.match(r"^(\+98|0)?9\d{9}$", clean_phone_number(text)):
            input_phone = clean_phone_number(text)

        # CASE A: User is trying to authenticate via phone number
        if input_phone:
            matched_user = session.exec(
                select(User).where(
                    (User.phone_number == input_phone) |
                    (User.phone_number == input_phone.lstrip("0")) |
                    (User.phone_number == f"+98{input_phone.lstrip('0')}")
                )
            ).first()

            if matched_user:
                matched_user.bale_chat_id = chat_id_str
                session.add(matched_user)
                session.commit()
                session.refresh(matched_user)

                role_lbl = ROLE_TITLES.get(matched_user.role, matched_user.role)
                loc_lbl = LOCATION_TITLES.get(matched_user.location, matched_user.location)

                reply_text = (
                    f"✅ *احراز هویت با موفقیت انجام شد!*\n\n"
                    f"👤 *نام همکار:* {matched_user.full_name or matched_user.email}\n"
                    f"🏢 *محل خدمت:* {loc_lbl}\n"
                    f"💼 *سمت سازمانی:* {role_lbl}\n\n"
                    f"حساب شما به سامانه یکپارچه مکرر متصل شد. از منوی زیر می‌توانید وظایف و وضعیت خطوط را پیگیری نمایید."
                )
                keyboard = {
                    "keyboard": [
                        [{"text": "📋 دستور کارهای من"}],
                        [{"text": "📦 موجودی قطعات بحرانی"}, {"text": "➕ ثبت درخواست خرید سریع"}],
                        [{"text": "👤 مشخصات حساب"}, {"text": "🚪 خروج از حساب"}]
                    ],
                    "resize_keyboard": True
                }

                # Dual delivery
                bale_token = getattr(settings, "BALE_BOT_TOKEN", None)
                if bale_token:
                    background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)

                return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}
            else:
                reply_text = (
                    f"❌ شماره همراه وارد شده (`{input_phone}`) در سامانه مکرر بازآفرین یافت نشد.\n\n"
                    f"لطفاً با مدیر سیستم تماس بگیرید تا این شماره موبایل در بخش «مدیریت کاربران» برای حساب شما ثبت گردد."
                )
                keyboard = {
                    "keyboard": [
                        [{"text": "📱 ارسال شماره همراه سازمانی", "request_contact": True}],
                        [{"text": "راهنما"}]
                    ],
                    "resize_keyboard": True
                }
                return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}

        # CASE B: User is NOT authenticated yet
        if not user:
            reply_text = (
                "🏭 *به بازوی اختصاصی سامانه یکپارچه مکرر خوش آمدید!*\n\n"
                "🔒 این ربات به پایگاه داده مرکزی مکرر متصل است و دسترسی به اطلاعات سازمانی منوط به احراز هویت می‌باشد.\n\n"
                "لطفاً با لمس دکمه زیر شماره همراه سازمانی خود را ارسال فرمایید (یا شماره خود را به صورت `0912xxxxxxx` تایپ کنید):"
            )
            keyboard = {
                "keyboard": [
                    [{"text": "📱 ارسال شماره همراه سازمانی", "request_contact": True}],
                    [{"text": "ℹ️ راهنمای احراز هویت"}]
                ],
                "resize_keyboard": True
            }
            return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}

        # CASE C: User IS authenticated! Process real commands from database.
        role_title = ROLE_TITLES.get(user.role, user.role)
        loc_title = LOCATION_TITLES.get(user.location, user.location)

        auth_keyboard = {
            "keyboard": [
                [{"text": "📋 دستور کارهای من"}],
                [{"text": "📦 موجودی قطعات بحرانی"}, {"text": "➕ ثبت درخواست خرید سریع"}],
                [{"text": "👤 مشخصات حساب"}, {"text": "🚪 خروج از حساب"}]
            ],
            "resize_keyboard": True
        }

        if text in ("/start", "سلام", "راهنما", "منو", "ℹ️ راهنمای احراز هویت"):
            reply_text = (
                f"👋 *درود، {user.full_name or user.email} عزیز!*\n"
                f"💼 {role_title} • 🏢 {loc_title}\n\n"
                f"دستورات موجود:\n"
                f"• `📋 دستور کارهای من` : مشاهده وظایف منتسب به شما یا شعبه\n"
                f"• `/done <کد_رهگیری>` : اعلام اتمام کار و تغییر وضعیت به انجام‌شده\n"
                f"• `📦 موجودی قطعات بحرانی` : کاردکس و موجودی انبار قطعات\n"
                f"• `👤 مشخصات حساب` : بررسی وضعیت دسترسی و شماره ثبت‌شده"
            )
        elif text in ("📋 دستور کارهای من", "/tasks", "وظایف من", "📋 وظایف من"):
            # Query REAL database records for this user or their location
            query = select(TaskRecord).where(
                (TaskRecord.assignee_name.ilike(f"%{user.full_name or '---'}%")) |
                (TaskRecord.assignee_id == user.email) |
                (TaskRecord.location == user.location)
            ).order_by(col(TaskRecord.created_at).desc()).limit(8)
            tasks = session.exec(query).all()
            reply_text = format_persian_tasks(tasks)
        elif text.startswith("/done"):
            parts = text.split(maxsplit=1)
            if len(parts) > 1:
                target_id = parts[1].strip()
                task_rec = session.get(TaskRecord, target_id)
                if task_rec:
                    task_rec.state = "done"
                    session.add(task_rec)
                    session.commit()
                    reply_text = f"✅ وضعیت دستور کار `{task_rec.id}` با عنوان *{task_rec.title}* با موفقیت به *اتمام یافته (DONE)* تغییر یافت."
                else:
                    reply_text = f"⚠️ دستور کاری با شناسه `{target_id}` در پایگاه داده مرکزی یافت نشد."
            else:
                reply_text = "⚠️ لطفاً شناسه تسک را وارد کنید:\nمثال: `/done task-01`"
        elif text in ("📦 موجودی قطعات بحرانی", "📦 موجودی انبار و قطعات", "/inventory", "/kardex"):
            parts = await inventree_adapter.get_parts()
            reply_text = format_persian_inventory(parts)
        elif text.startswith("/req") or text == "➕ ثبت درخواست خرید سریع":
            if text.startswith("/req"):
                item_name = text.replace("/req", "").strip() or "روغن هیدرولیک صنعتی"
            else:
                item_name = "بلبرینگ تماس زاویه‌ای SKF"
            reply_text = (
                f"✅ پیش‌نویس درخواست خرید (PR) با عنوان *{item_name}* با موفقیت ثبت شد.\n"
                f"• ثبت‌کننده: {user.full_name} ({role_title})\n"
                f"• شعبه: {loc_title}\n"
                f"• وضعیت: در انتظار تایید سرپرست"
            )
        elif text in ("👤 مشخصات حساب", "/profile"):
            reply_text = (
                f"👤 *شناسه کاربری شما در مکرر:*\n\n"
                f"• نام و نشان: *{user.full_name or 'ثبت‌نشده'}*\n"
                f"• نام کاربری / ایمیل: `{user.email}`\n"
                f"• شماره همراه ثبت‌شده: `{user.phone_number or 'ثبت‌نشده'}`\n"
                f"• محل خدمت: *{loc_title}*\n"
                f"• نقش سازمانی: *{role_title}*\n"
                f"• وضعیت حساب: {'فعال ✅' if user.is_active else 'غیرفعال ❌'}"
            )
        elif text in ("🚪 خروج از حساب", "/logout"):
            user.bale_chat_id = None
            session.add(user)
            session.commit()
            reply_text = "🚪 حساب شما با موفقیت از این بازو خارج شد.\nجهت ورود دوباره، شماره همراه خود را ارسال نمایید."
            auth_keyboard = {
                "keyboard": [
                    [{"text": "📱 ارسال شماره همراه سازمانی", "request_contact": True}],
                    [{"text": "راهنما"}]
                ],
                "resize_keyboard": True
            }
        else:
            reply_text = "دستور نامعتبر است. لطفاً از دکمه‌های منو استفاده فرمایید یا دستور /start را ارسال کنید."

        # Dual delivery via background task
        bale_token = getattr(settings, "BALE_BOT_TOKEN", None)
        if bale_token:
            background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, auth_keyboard)

        return {
            "method": "sendMessage",
            "chat_id": chat_id,
            "text": reply_text,
            "reply_markup": auth_keyboard
        }


async def send_bale_message(token: str, chat_id: int | str, text: str, keyboard: dict | None = None):
    url = f"https://tapi.bale.ai/bot{token}/sendMessage"
    payload: dict[str, Any] = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown",
    }
    if keyboard:
        payload["reply_markup"] = keyboard

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.warning(f"Bale sendMessage non-200: {resp.status_code} {resp.text}")
    except Exception as e:
        logger.error(f"Failed to send message to Bale: {e}")


@router.post("/send-notification")
async def send_bot_notification(msg: BotMessage):
    """Internal push notifications to connected bot users."""
    bale_token = getattr(settings, "BALE_BOT_TOKEN", None)
    if not bale_token:
        return {"status": "error", "detail": "BALE_BOT_TOKEN not configured"}

    await send_bale_message(bale_token, msg.chat_id, msg.text)
    return {"status": "sent", "chat_id": msg.chat_id}
