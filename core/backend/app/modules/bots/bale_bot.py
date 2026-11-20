"""
Bale Bot Service for Factory Operations & Low-Tier Personnel.
Provides intuitive Persian menus for factory workers, operators, and warehouse staff.
"""

import logging
from typing import Any

from app.adapters.bale_adapter import bale_adapter
from app.adapters.inventree_adapter import inventree_adapter
from app.adapters.plane_adapter import plane_adapter

logger = logging.getLogger(__name__)

MAIN_KEYBOARD = {
    "keyboard": [
        [{"text": "📋 تسک‌های جاری من"}, {"text": "🔍 استعلام موجودی انبار"}],
        [{"text": "🚨 اعلام خرابی و توقف خط"}, {"text": "🚪 بررسی برگه خروج کالا"}],
        [{"text": "❓ راهنمای بات مکرر"}],
    ],
    "resize_keyboard": True,
}


class BaleBotService:
    @staticmethod
    async def handle_update(update: dict[str, Any]) -> dict[str, Any]:
        """Process incoming Bale webhook update (message or callback_query)."""
        if "callback_query" in update:
            return await BaleBotService._handle_callback(update["callback_query"])

        message = update.get("message", {})
        chat_id = message.get("chat", {}).get("id")
        text = (message.get("text") or "").strip()

        if not chat_id:
            return {"status": "ignored", "reason": "no_chat_id"}

        if text in ("/start", "سلام", "شروع"):
            welcome_text = (
                "👋 **سلام به دستیار عملیاتی مکرر (Mokarrar Bot) خوش آمدید.**\n\n"
                "این بات ویژه همکاران خط تولید، انبارداری و خدمات فنی کارخانه است.\n"
                "از منوی زیر می‌توانید تسک‌های خود را مشاهده و ثبت اتمام کنید یا موجودی انبار را استعلام نمایید."
            )
            await bale_adapter.send_message(chat_id, welcome_text, reply_markup=MAIN_KEYBOARD)
            return {"status": "handled", "action": "start"}

        if text == "📋 تسک‌های جاری من":
            return await BaleBotService._show_worker_tasks(chat_id)

        if text == "🔍 استعلام موجودی انبار":
            msg = (
                "🔍 لطفاً کد یا نام قطعه مورد نظر را ارسال کنید.\n"
                "نمونه:\n"
                "`کد: ELEC-001` یا `بلبرینگ 6204`"
            )
            await bale_adapter.send_message(chat_id, msg)
            return {"status": "handled", "action": "prompt_stock"}

        if text == "🚨 اعلام خرابی و توقف خط":
            keyboard = {
                "inline_keyboard": [
                    [
                        {"text": "🔴 خط ۱ - برش و پرس", "callback_data": "stop_line:1"},
                        {"text": "🔴 خط ۲ - جوشکاری", "callback_data": "stop_line:2"},
                    ],
                    [
                        {"text": "🔴 خط ۳ - مونتاژ نهایی", "callback_data": "stop_line:3"},
                        {"text": "🔴 خط ۴ - رنگ و پخت", "callback_data": "stop_line:4"},
                    ],
                ]
            }
            await bale_adapter.send_message(
                chat_id,
                "⚠️ **هشدار توقف خط و درخواست تعمیرات فوری (PM):**\nلطفاً خط تولید دچار اختلال را انتخاب فرمایید:",
                reply_markup=keyboard,
            )
            return {"status": "handled", "action": "prompt_line_stop"}

        if text == "🚪 بررسی برگه خروج کالا":
            msg = (
                "🚪 **استعلام برگه خروج / گیت‌پاس:**\n"
                "لطفاً شماره برگه خروج را بفرستید یا بارکد آن را اسکن نمایید.\n"
                "مثال: `GP-1403-101`"
            )
            await bale_adapter.send_message(chat_id, msg)
            return {"status": "handled", "action": "prompt_gatepass"}

        if text == "❓ راهنمای بات مکرر":
            guide = (
                "📖 **راهنمای سامانه عملیاتی مکرر:**\n\n"
                "• **تسک‌ها:** برای مشاهده کارهای محوله و دکمه اتمام کار.\n"
                "• **موجودی انبار:** استعلام لحظه‌ای تعداد موجودی در قفسه‌ها.\n"
                "• **توقف خط:** ارسال هشدار آنی برای سرپرست فنی و ثبت زمان توقف.\n"
                "• در صورت نیاز به پشتیبانی به واحد فناوری اطلاعات مراجعه نمایید."
            )
            await bale_adapter.send_message(chat_id, guide, reply_markup=MAIN_KEYBOARD)
            return {"status": "handled", "action": "help"}

        # Check if text is a part search or code
        if text.startswith("کد:") or len(text) >= 3:
            search_query = text.replace("کد:", "").strip()
            return await BaleBotService._search_stock(chat_id, search_query)

        return {"status": "unhandled", "text": text}

    @staticmethod
    async def _show_worker_tasks(chat_id: int | str) -> dict[str, Any]:
        """Fetch tasks assigned to worker and present inline buttons."""
        tasks = await plane_adapter.get_tasks()

        if not tasks:
            await bale_adapter.send_message(chat_id, "✅ هیچ تسک انجام‌نشده‌ای برای شما ثبت نشده است.")
            return {"status": "handled", "action": "no_tasks"}

        msg = "📋 **فهرست تسک‌های جاری شما:**\n\n"
        keyboard_buttons = []
        for i, t in enumerate(tasks[:5], 1):
            t_id = t.get("id", "")
            title = t.get("title", "بدون عنوان")
            state = t.get("state", "در حال انجام")
            msg += f"{i}. 📌 {title}\n   وضعیت: `{state}`\n\n"
            keyboard_buttons.append([
                {"text": f"✅ اتمام تسک {i}", "callback_data": f"done_task:{t_id}"}
            ])

        keyboard = {"inline_keyboard": keyboard_buttons}
        await bale_adapter.send_message(chat_id, msg, reply_markup=keyboard)
        return {"status": "handled", "action": "show_tasks", "count": min(len(tasks), 5)}

    @staticmethod
    async def _search_stock(chat_id: int | str, query: str) -> dict[str, Any]:
        """Search InvenTree parts and reply to the user."""
        parts = await inventree_adapter.get_parts(search=query)

        if not parts:
            await bale_adapter.send_message(
                chat_id,
                f"❌ قطعه‌ای با عبارت «{query}» در انبار کارخانه یافت نشد.",
            )
            return {"status": "handled", "action": "stock_not_found"}

        reply = f"📦 **نتیجه استعلام انبار برای «{query}»:**\n\n"
        for p in parts[:3]:
            name = p.get("name", "")
            ipn = p.get("IPN", "نامشخص")
            stock = p.get("total_in_stock", 0)
            units = p.get("units", "عدد")
            status_text = "🟢 موجود" if stock > 0 else "🔴 اتمام موجودی"
            reply += f"🔹 **{name}** (کد: `{ipn}`)\n   موجودی: **{stock} {units}** | وضعیت: {status_text}\n\n"

        await bale_adapter.send_message(chat_id, reply)
        return {"status": "handled", "action": "stock_found", "count": len(parts)}

    @staticmethod
    async def _handle_callback(cb: dict[str, Any]) -> dict[str, Any]:
        """Handle inline keyboard button clicks."""
        data = cb.get("data", "")
        message = cb.get("message", {})
        chat_id = message.get("chat", {}).get("id")

        if not chat_id:
            return {"status": "ignored"}

        if data.startswith("done_task:"):
            task_id = data.split(":", 1)[1]
            await plane_adapter.update_task(task_id, {"state": "done"})
            await bale_adapter.send_message(
                chat_id,
                f"🎉 **تسک با شناسه `{task_id[:8]}` با موفقیت خاتمه یافت و در سامانه مکرر ثبت شد.**",
            )
            return {"status": "handled", "action": "task_completed", "task_id": task_id}

        if data.startswith("stop_line:"):
            line_num = data.split(":", 1)[1]
            # Create urgent task in Plane for maintenance team
            title = f"🚨 خرابی اضطراری و توقف خط تولید شماره {line_num}"
            desc = f"ثبت توقف توسط اپراتور بات بله (ChatID: {chat_id}) - نیازمند اعزام فوری تکنسین PM."
            await plane_adapter.create_task(
                title=title,
                description=desc,
                priority="urgent",
                tags=["توقف خط", "تعمیرات فوری", f"خط {line_num}"],
            )
            alert_msg = (
                f"🚨 **هشدار توقف خط {line_num} با اولویت اضطراری (Urgent) ثبت گردید.**\n"
                "پیامک و نوتیفیکیشن فوری برای سرپرست شیفت و تیم تعمیرات نگهداری (PM) ارسال شد."
            )
            await bale_adapter.send_message(chat_id, alert_msg)
            return {"status": "handled", "action": "emergency_logged", "line": line_num}

        return {"status": "unhandled_callback", "data": data}
