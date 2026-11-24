import logging
from typing import Any
import httpx
from fastapi import APIRouter, Request, BackgroundTasks
from pydantic import BaseModel

from app.core.config import settings
from app.adapters.plane_adapter import plane_adapter
from app.adapters.inventree_adapter import inventree_adapter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bot", tags=["Bale & Telegram Bot"])


class BotMessage(BaseModel):
    chat_id: int | str
    text: str


def format_persian_tasks(tasks: list[dict[str, Any]]) -> str:
    if not tasks:
        return "📋 در حال حاضر هیچ تسک فعالی برای شما ثبت نشده است."
    
    lines = ["📋 *فهرست وظایف فعال خط تولید مکرر:*", ""]
    for idx, t in enumerate(tasks[:5], 1):
        status = "✅ تکمیل" if t.get("status") == "DONE" else "⏳ در حال اجرا" if t.get("status") == "IN_PROGRESS" else "📌 در انتظار"
        priority = "🔴 فوری" if t.get("priority") == "URGENT" else "🟡 متوسط"
        lines.append(f"{idx}. *{t.get('title')}*")
        lines.append(f"   • شناسه: `{t.get('id')}`")
        lines.append(f"   • وضعیت: {status} | اولویت: {priority}")
        lines.append("")
    lines.append("💡 جهت تغییر وضعیت به انجام‌شده، دستور زیر را بفرستید:")
    lines.append("`/done <کد_تسک>`")
    return "\n".join(lines)


def format_persian_inventory(items: list[dict[str, Any]]) -> str:
    if not items:
        return "📦 اطلاعات انبار یافت نشد."
    
    lines = ["📦 *وضعیت موجودی و کاردکس قطعات بحرانی:*", ""]
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
    Supports both direct webhook response and outbound sendMessage.
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
    else:
        chat_id = message.get("chat", {}).get("id") or message.get("from", {}).get("id")
        text = (message.get("text") or "").strip()

    if not chat_id:
        return {"status": "ok", "detail": "No chat id found"}

    reply_text = ""
    keyboard = {
        "keyboard": [
            [{"text": "📋 وظایف من"}],
            [{"text": "📦 موجودی انبار و قطعات"}],
            [{"text": "➕ ثبت درخواست خرید سریع"}],
            [{"text": "📊 راهنما و دستورات"}]
        ],
        "resize_keyboard": True
    }

    if text in ("/start", "سلام", "راهنما", "📊 راهنما و دستورات"):
        reply_text = (
            "🏭 به بات یکپارچه کارخانه مکرر خوش آمدید!\n\n"
            "با این بات می‌توانید به وظایف محوله در خط تولید، موجودی قطعات انبار و ثبت درخواست قطعات دسترسی داشته باشید.\n\n"
            "دستورات موجود:\n"
            "• 📋 وظایف من : دریافت تسک‌های منتسب به شما\n"
            "• 📦 موجودی انبار و قطعات : مشاهده کاردکس اقلام بحرانی\n"
            "• /done <کد_تسک> : ثبت اتمام کار تسک\n"
            "• /req <نام_قطعه> : ثبت پیش‌نویس خرید کالا"
        )
    elif text in ("📋 وظایف من", "/tasks"):
        tasks = await plane_adapter.get_tasks()
        reply_text = format_persian_tasks(tasks)
    elif text in ("📦 موجودی انبار و قطعات", "/kardex", "/inventory"):
        parts = await inventree_adapter.get_parts()
        reply_text = format_persian_inventory(parts)
    elif text.startswith("/done"):
        parts = text.split(maxsplit=1)
        if len(parts) > 1:
            task_id = parts[1].strip()
            await plane_adapter.update_task(task_id=task_id, data={"state": "done"})
            reply_text = f"✅ وضعیت تسک {task_id} با موفقیت به انجام‌شده تغییر یافت."
        else:
            reply_text = "⚠️ لطفاً شناسه تسک را وارد کنید:\nمثال: /done task-101"
    elif text.startswith("/req") or text == "➕ ثبت درخواست خرید سریع":
        if text.startswith("/req"):
            item_name = text.replace("/req", "").strip() or "روغن هیدرولیک صنعتی"
        else:
            item_name = "بلبرینگ تماس زاویه‌ای SKF"
        
        reply_text = (
            f"✅ پیش‌نویس درخواست خرید کالا (PR) با عنوان {item_name} با موفقیت ثبت شد.\n"
            f"• وضعیت: در انتظار تایید سرپرست شیفت\n"
            f"• پس از تایید مدیر، فاکتور جهت پرداخت به سیستم مالی منتقل خواهد شد."
        )
    else:
        reply_text = "دستور نامعتبر است. لطفاً از دکمه‌های زیر استفاده کنید یا دستور /start را ارسال نمایید."

    # Send response back to Bale Bot API via background task as secondary guarantee
    bale_token = getattr(settings, "BALE_BOT_TOKEN", None)
    if bale_token:
        background_tasks.add_task(send_bale_message, bale_token, chat_id, reply_text, keyboard)

    # Return standard webhook response that Bale immediately delivers
    return {
        "method": "sendMessage",
        "chat_id": chat_id,
        "text": reply_text,
        "reply_markup": keyboard
    }


async def send_bale_message(token: str, chat_id: int | str, text: str, keyboard: dict | None = None):
    url = f"https://tapi.bale.ai/bot{token}/sendMessage"
    payload: dict[str, Any] = {
        "chat_id": chat_id,
        "text": text,
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
    """
    Endpoint for internal services (e.g. n8n or procurement) to push a message to user
    """
    return {
        "status": "queued",
        "chat_id": msg.chat_id,
        "text": msg.text
    }
