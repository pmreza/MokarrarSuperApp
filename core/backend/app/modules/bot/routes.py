import logging
import re
import time
from typing import Any
import httpx
from fastapi import APIRouter, Request, BackgroundTasks
from pydantic import BaseModel
from sqlmodel import Session, select, col

from app.core.config import settings
from app.core.db import engine
from app.core.security import ROLE_TITLES, verify_password
from app.api.deps import CurrentUser
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

# In-memory authentication state tracker for 2FA flow: {chat_id: {"stage": ..., "user_id": ..., "phone": ..., "time": ...}}
PENDING_AUTH: dict[str, dict[str, Any]] = {}


class BotMessage(BaseModel):
    chat_id: int | str
    text: str


def clean_phone_number(raw: str) -> str:
    """Normalize Persian/Arabic digits and international formats to 09xxxxxxxxx."""
    if not raw:
        return ""
    persian_digits = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩"
    english_digits = "01234567890123456789"
    trans = str.maketrans(persian_digits, english_digits)
    cleaned = raw.translate(trans)
    cleaned = re.sub(r"\D", "", cleaned)
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

    lines = ["📋 *فهرست دستور کارهای فعال در سامane مکرر:*", ""]
    status_map = {
        "todo": "📌 برنامه‌ریزی شده",
        "in_progress": "⏳ در حال اجرا",
        "done": "✅ اتمام یافته",
        "cancelled": "🚫 لغو شده",
    }
    priority_map = {
        "urgent": "🔴 اولویت بحرانی",
        "critical": "🔴 اولویت بحرانی",
        "high": "🟠 اولویت فوری",
        "medium": "🟡 اولویت متوسط",
        "low": "🟢 اولویت پایین",
    }

    for idx, t in enumerate(tasks[:8], 1):
        st = status_map.get(t.state, t.state)
        pr = priority_map.get(t.priority, t.priority)
        lines.append(f"{idx}. *{t.title}*")
        lines.append(f"   • کد رهگیری: `{t.id}`")
        lines.append(f"   • مسئول اجرا: {t.assignee_name}")
        if getattr(t, "follower_name", None):
            lines.append(f"   • مسئول پیگیری: {t.follower_name}")
        if getattr(t, "due_date", None):
            lines.append(f"   • مهلت تحویل: {t.due_date}")
        lines.append(f"   • وضعیت: {st} | اولویت: {pr}")
        lines.append("")

    lines.append("💡 جهت تغییر وضعیت تسک به *اتمام یافته*، دستور زیر را بفرستید:")
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
    Strictly enforces 2-Factor Authentication (Phone Number + Organization Password)
    before granting access to any task, inventory, or internal workflow data.
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
    bale_token = getattr(settings, "BALE_BOT_TOKEN", None)

    with Session(engine) as session:
        user = session.exec(select(User).where(User.bale_chat_id == chat_id_str)).first()

        # ----------------------------------------------------------------------
        # PATH 1: Direct single-command login: /login <username_or_phone> <password>
        # ----------------------------------------------------------------------
        if text.startswith("/login"):
            parts = text.split(maxsplit=2)
            if len(parts) >= 3:
                identifier = parts[1].strip()
                password = parts[2].strip()

                cleaned_id = clean_phone_number(identifier)

                # Search by email/username OR by phone_number
                target_user = session.exec(
                    select(User).where(
                        (User.email == identifier) |
                        (User.phone_number == identifier) |
                        (User.phone_number == cleaned_id) |
                        (User.phone_number == cleaned_id.lstrip("0"))
                    )
                ).first()

                verified, _ = verify_password(password, target_user.hashed_password) if target_user else (False, None)
                if target_user and target_user.is_active and verified:
                    # Unlink any previous user tied to this Bale chat_id
                    prev_users = session.exec(select(User).where(User.bale_chat_id == chat_id_str)).all()
                    for pu in prev_users:
                        if pu.id != target_user.id:
                            pu.bale_chat_id = None
                            session.add(pu)
                    target_user.bale_chat_id = chat_id_str
                    session.add(target_user)
                    session.commit()
                    session.refresh(target_user)
                    PENDING_AUTH.pop(chat_id_str, None)

                    role_lbl = ROLE_TITLES.get(target_user.role, target_user.role)
                    loc_lbl = LOCATION_TITLES.get(target_user.location, target_user.location)

                    reply_text = (
                        f"✅ *احراز هویت دوعاملی با موفقیت انجام شد!*\n\n"
                        f"👤 *نام همکار:* {target_user.full_name or target_user.email}\n"
                        f"🏢 *محل خدمت:* {loc_lbl}\n"
                        f"💼 *سمت سازمانی:* {role_lbl}\n\n"
                        f"حساب شما متصل گردید. اکنون می‌توانید از منوی زیر دستور کارهای خود را بررسی نمایید."
                    )
                    keyboard = {
                        "keyboard": [
                            [{"text": "📋 دستور کارهای من"}],
                            [{"text": "📦 موجودی قطعات بحرانی"}, {"text": "➕ ثبت درخواست خرید سریع"}],
                            [{"text": "👤 مشخصات حساب"}, {"text": "🚪 خروج از حساب"}]
                        ],
                        "resize_keyboard": True
                    }
                    if bale_token:
                        background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)
                    return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}
                else:
                    reply_text = (
                        "❌ *شناسه کاربری یا رمز عبور نادرست است!*\n\n"
                        "لطفاً دقت فرمایید و مجدداً ارسال کنید:\n"
                        "فرمت دستور: `/login <نام_کاربری_یا_شماره_همراه> <رمز_عبور>`"
                    )
                    keyboard = {
                        "keyboard": [
                            [{"text": "📱 ارسال شماره همراه سازمانی", "request_contact": True}],
                            [{"text": "ℹ️ راهنمای احراز هویت"}]
                        ],
                        "resize_keyboard": True
                    }
                    if bale_token:
                        background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)
                    return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}
            elif len(parts) == 2:
                # User typed: /login username
                ident = parts[1].strip()
                cleaned_id = clean_phone_number(ident)
                target_user = session.exec(
                    select(User).where(
                        (User.email == ident) |
                        (User.phone_number == ident) |
                        (User.phone_number == cleaned_id) |
                        (User.phone_number == cleaned_id.lstrip("0"))
                    )
                ).first()
                if target_user:
                    PENDING_AUTH[chat_id_str] = {
                        "stage": "awaiting_password",
                        "user_id": target_user.id,
                        "phone": target_user.phone_number or "",
                        "time": time.time(),
                    }
                    reply_text = (
                        f"👤 کاربر شناسایی شد: *{target_user.full_name or target_user.email}*\n\n"
                        f"🔑 لطفاً **رمز عبور سازمانی** خود را وارد نمایید:"
                    )
                    keyboard = {"keyboard": [[{"text": "انصراف"}]], "resize_keyboard": True}
                    if bale_token:
                        background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)
                    return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}
                else:
                    reply_text = f"❌ کاربری با شناسه `{ident}` در سامانه مکرر یافت نشد."
                    if bale_token:
                        background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text)
                    return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text}
            else:
                PENDING_AUTH[chat_id_str] = {"stage": "awaiting_identifier", "time": time.time()}
                reply_text = (
                    "🔑 *ورود به سامانه مکرر*\n\n"
                    "لطفاً **نام کاربری (ایمیل)** یا **شماره همراه** خود را ارسال کنید:\n"
                    "(یا دستور `/login <نام‌کاربری> <رمز>` را در یک خط بفرستید)"
                )
                keyboard = {
                    "keyboard": [
                        [{"text": "📱 ارسال شماره همراه سازمانی", "request_contact": True}],
                        [{"text": "انصراف"}]
                    ],
                    "resize_keyboard": True
                }
                if bale_token:
                    background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)
                return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}

        # ----------------------------------------------------------------------
        # PATH 2: Step-by-Step 2FA State Machine
        # ----------------------------------------------------------------------
        pending = PENDING_AUTH.get(chat_id_str)

        # Stage: awaiting_identifier
        if pending and pending.get("stage") == "awaiting_identifier" and not contact:
            if text in ("/cancel", "انصراف", "خروج"):
                PENDING_AUTH.pop(chat_id_str, None)
                reply_text = "عملیات ورود لغو شد."
                if bale_token:
                    background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text)
                return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text}

            ident = text.strip()
            cleaned_id = clean_phone_number(ident)
            target_user = session.exec(
                select(User).where(
                    (User.email == ident) |
                    (User.phone_number == ident) |
                    (User.phone_number == cleaned_id) |
                    (User.phone_number == cleaned_id.lstrip("0"))
                )
            ).first()

            if target_user:
                PENDING_AUTH[chat_id_str] = {
                    "stage": "awaiting_password",
                    "user_id": target_user.id,
                    "phone": target_user.phone_number or "",
                    "time": time.time(),
                }
                reply_text = (
                    f"👤 کاربر شناسایی شد: *{target_user.full_name or target_user.email}*\n\n"
                    f"🔑 لطفاً **رمز عبور سازمانی** خود را وارد نمایید:"
                )
                keyboard = {"keyboard": [[{"text": "انصراف"}]], "resize_keyboard": True}
                if bale_token:
                    background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)
                return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}
            else:
                reply_text = f"❌ کاربری با شناسه `{ident}` در سامانه یافت نشد. لطفاً مجدداً ایمیل یا شماره موبایل معتبر بفرستید:"
                if bale_token:
                    background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text)
                return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text}

        # Step 2b: User has already submitted phone/user, now entering password
        if pending and pending.get("stage") == "awaiting_password" and not contact:
            if text in ("/cancel", "انصراف", "خروج"):
                PENDING_AUTH.pop(chat_id_str, None)
                reply_text = "عملیات احراز هویت لغو شد. جهت شروع مجدد شماره همراه خود را ارسال کنید."
                keyboard = {
                    "keyboard": [
                        [{"text": "📱 ارسال شماره همراه سازمانی", "request_contact": True}],
                        [{"text": "ℹ️ راهنمای احراز هویت"}]
                    ],
                    "resize_keyboard": True
                }
                if bale_token:
                    background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)
                return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}

            target_user = session.get(User, pending["user_id"])
            verified, _ = verify_password(text, target_user.hashed_password) if target_user else (False, None)
            if target_user and target_user.is_active and verified:
                # Unlink any previous user tied to this Bale chat_id
                prev_users = session.exec(select(User).where(User.bale_chat_id == chat_id_str)).all()
                for pu in prev_users:
                    if pu.id != target_user.id:
                        pu.bale_chat_id = None
                        session.add(pu)
                target_user.bale_chat_id = chat_id_str
                session.add(target_user)
                session.commit()
                session.refresh(target_user)
                PENDING_AUTH.pop(chat_id_str, None)

                role_lbl = ROLE_TITLES.get(target_user.role, target_user.role)
                loc_lbl = LOCATION_TITLES.get(target_user.location, target_user.location)

                reply_text = (
                    f"✅ *رمز عبور تأیید شد و ورود موفقیت‌آمیز بود!*\n\n"
                    f"👤 *نام همکار:* {target_user.full_name or target_user.email}\n"
                    f"🏢 *محل خدمت:* {loc_lbl}\n"
                    f"💼 *سمت سازمانی:* {role_lbl}\n\n"
                    f"دسترسی شما به سامانه یکپارچه مکرر برقرار شد."
                )
                keyboard = {
                    "keyboard": [
                        [{"text": "📋 دستور کارهای من"}],
                        [{"text": "📦 موجودی قطعات بحرانی"}, {"text": "➕ ثبت درخواست خرید سریع"}],
                        [{"text": "👤 مشخصات حساب"}, {"text": "🚪 خروج از حساب"}]
                    ],
                    "resize_keyboard": True
                }
                if bale_token:
                    background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)
                return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}
            else:
                reply_text = (
                    "❌ *رمز عبور اشتباه است!*\n\n"
                    "لطفاً رمز عبور سامانه مکرر خود را به دقت وارد کنید (یا دکمه انصراف را لمس نمایید):"
                )
                if bale_token:
                    background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text)
                return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text}

        # Step 2a: Check if user submitted a phone number (via button or text)
        input_phone = ""
        if contact and isinstance(contact, dict):
            input_phone = clean_phone_number(contact.get("phone_number", ""))
        elif re.match(r"^(\+98|0)?9\d{9}$", clean_phone_number(text)):
            input_phone = clean_phone_number(text)

        if input_phone:
            matched_user = session.exec(
                select(User).where(
                    (User.phone_number == input_phone) |
                    (User.phone_number == input_phone.lstrip("0")) |
                    (User.phone_number == f"+98{input_phone.lstrip('0')}")
                )
            ).first()

            if matched_user:
                # Stage 1 succeeded! Now prompt for password (2FA)
                PENDING_AUTH[chat_id_str] = {
                    "stage": "awaiting_password",
                    "user_id": matched_user.id,
                    "phone": input_phone,
                    "time": time.time(),
                }
                reply_text = (
                    f"📱 *شماره همراه شما ({input_phone}) در پرتال مکرر تأیید شد.*\n\n"
                    f"👤 کاربر شناسایی‌شده: *{matched_user.full_name or matched_user.email}*\n\n"
                    f"🔑 لطفاً جهت تکمیل احراز هویت، **رمز عبور سازمانی** خود را وارد نمایید:"
                )
                keyboard = {
                    "keyboard": [
                        [{"text": "انصراف"}]
                    ],
                    "resize_keyboard": True
                }
                if bale_token:
                    background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)
                return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}
            else:
                reply_text = (
                    f"❌ شماره همراه وارد شده (`{input_phone}`) در سیستم مدیریت کاربران مکرر تعریف نشده است.\n\n"
                    f"لطفاً با مدیر سامانه تماس حاصل فرمایید تا شماره موبایل شما ثبت شود."
                )
                keyboard = {
                    "keyboard": [
                        [{"text": "📱 ارسال شماره همراه سازمانی", "request_contact": True}],
                        [{"text": "ℹ️ راهنمای احراز هویت"}]
                    ],
                    "resize_keyboard": True
                }
                if bale_token:
                    background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)
                return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}

        # ----------------------------------------------------------------------
        # PATH 3: User is NOT authenticated or inactive in DB
        # ----------------------------------------------------------------------
        if not user or not user.is_active:
            reply_text = (
                "🏭 *به بازوی اختصاصی سامانه یکپارچه مکرر بازآفرین خوش آمدید!*\n\n"
                "🔒 **ورود و اعتبارسنجی الزامی است:**\n"
                "این ربات مستقیماً به پایگاه داده مرکزی متصل بوده و مشاهده تسک‌ها، کاردکس انبار و ثبت دستور کارها تنها برای پرسنل احراز هویت‌شده امکان‌پذیر است.\n\n"
                "لطفاً یکی از دو روش زیر را انتخاب کنید:\n"
                "۱. **روش پیامکی:** دکمه «📱 ارسال شماره همراه سازمانی» در پایین را لمس نمایید تا پس از تایید شماره، رمز عبور را وارد کنید.\n"
                "۲. **روش سریع:** دستور زیر را تایپ کنید:\n"
                "`/login <نام_کاربری_یا_موبایل> <رمز_عبور>`"
            )
            keyboard = {
                "keyboard": [
                    [{"text": "📱 ارسال شماره همراه سازمانی", "request_contact": True}],
                    [{"text": "ℹ️ راهنمای احراز هویت"}]
                ],
                "resize_keyboard": True
            }
            if bale_token:
                background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)
            return {"method": "sendMessage", "chat_id": chat_id, "text": reply_text, "reply_markup": keyboard}

        # ----------------------------------------------------------------------
        # PATH 4: User IS authenticated in DB! Access Granted.
        # ----------------------------------------------------------------------
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
                f"• `📋 دستور کارهای من` : مشاهده وظایف منتسب به شما یا واحد شما\n"
                f"• `/done <کد_رهگیری>` : اعلام اتمام کار تسک در خط تولید\n"
                f"• `📦 موجودی قطعات بحرانی` : کاردکس و موجودی انبار قطعات\n"
                f"• `👤 مشخصات حساب` : بررسی وضعیت دسترسی و شماره ثبت‌شده"
            )
        elif text in ("📋 دستور کارهای من", "/tasks", "وظایف من", "📋 وظایف من"):
            uid_str = str(user.id)
            query = select(TaskRecord).where(
                (TaskRecord.is_deleted == False) &
                (TaskRecord.state != "done") & (
                    (TaskRecord.assignee_id == uid_str) |
                    (TaskRecord.assignee_id == user.email) |
                    (TaskRecord.assignee_name.ilike(f"%{user.full_name or '---'}%")) |
                    (TaskRecord.follower_id == uid_str) |
                    (TaskRecord.follower_id == user.email) |
                    (TaskRecord.follower_name.ilike(f"%{user.full_name or '---'}%")) |
                    (TaskRecord.location == user.location)
                )
            ).order_by(col(TaskRecord.created_at).desc()).limit(8)
            tasks = session.exec(query).all()
            reply_text = format_persian_tasks(tasks)
        elif text.startswith("/done"):
            parts = text.split(maxsplit=1)
            if len(parts) > 1:
                target_id = parts[1].strip()
                task_rec = session.get(TaskRecord, target_id)
                if task_rec and not task_rec.is_deleted:
                    uid_str = str(user.id)
                    is_mgmt = user.is_superuser or user.role in (
                        "admin", "ceo", "managing_director", "manager",
                        "office_manager", "production_manager",
                    )
                    is_owner = (
                        task_rec.assignee_id in (uid_str, user.email)
                        or task_rec.follower_id in (uid_str, user.email)
                        or (user.full_name and user.full_name in (task_rec.assignee_name, task_rec.follower_name))
                        or task_rec.location == user.location
                    )
                    if not (is_mgmt or is_owner):
                        reply_text = "⛔ شما مجوز اتمام تسک مربوط به واحد یا کاربر دیگر را ندارید."
                    else:
                        task_rec.state = "done"
                        session.add(task_rec)
                        session.commit()
                        session.refresh(task_rec)
                        from app.modules.tasks.routes import notify_users_via_bale
                        background_tasks.add_task(notify_users_via_bale, task_rec.to_dict(), "done")
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
                f"• نام کاربری: `{user.email}`\n"
                f"• شماره همراه: `{user.phone_number or 'ثبت‌نشده'}`\n"
                f"• محل خدمت: *{loc_title}*\n"
                f"• نقش سازمانی: *{role_title}*\n"
                f"• شناسه اتصال بله: `{user.bale_chat_id}`\n"
                f"• وضعیت حساب: {'فعال ✅' if user.is_active else 'غیرفعال ❌'}"
            )
        elif text in ("🚪 خروج از حساب", "/logout"):
            user.bale_chat_id = None
            session.add(user)
            session.commit()
            PENDING_AUTH.pop(chat_id_str, None)
            reply_text = "🚪 حساب شما با موفقیت از این بازو خارج شد.\nجهت ورود دوباره، شماره همراه یا دستور /login را ارسال نمایید."
            auth_keyboard = {
                "keyboard": [
                    [{"text": "📱 ارسال شماره همراه سازمانی", "request_contact": True}],
                    [{"text": "ℹ️ راهنمای احراز هویت"}]
                ],
                "resize_keyboard": True
            }
        else:
            reply_text = "دستور نامعتبر است. لطفاً از دکمه‌های منو استفاده فرمایید یا دستور /start را ارسال کنید."

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
async def send_bot_notification(msg: BotMessage, current_user: CurrentUser):
    """Internal push notifications to connected bot users (authenticated)."""
    bale_token = getattr(settings, "BALE_BOT_TOKEN", None)
    if not bale_token:
        return {"status": "error", "detail": "BALE_BOT_TOKEN not configured"}

    await send_bale_message(bale_token, msg.chat_id, msg.text)
    return {"status": "sent", "chat_id": msg.chat_id}
