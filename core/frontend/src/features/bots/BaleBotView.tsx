import React, { useEffect, useState } from "react"
import {
  Bot,
  Send,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  MessageSquare,
} from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"

export const BaleBotView: React.FC = () => {
  const [botStatus, setBotStatus] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Simulation Chat
  const [chatLog, setChatLog] = useState<Array<{ sender: "user" | "bot"; text: string; buttons?: any[] }>>([
    {
      sender: "bot",
      text: "👋 سلام به دستیار عملیاتی مکرر (Mokarrar Bot) خوش آمدید.\nبرای ارسال فرمان دکمه‌های زیر را لمس نمایید.",
      buttons: [
        { text: "📋 تسک‌های جاری من", cmd: "📋 تسک‌های جاری من" },
        { text: "🔍 استعلام موجودی انبار", cmd: "کد: MOK-BLT-8M1200" },
        { text: "🚨 اعلام خرابی و توقف خط", cmd: "🚨 اعلام خرابی و توقف خط" },
      ],
    },
  ])
  const [inputText, setInputText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Outbound notification form
  const [recipientChatId, setRecipientChatId] = useState("989120000000")
  const [notificationMsg, setNotificationMsg] = useState("")
  const [isSending, setIsSending] = useState(false)

  const loadStatus = async () => {
    try {
      setLoading(true)
      const data = await api.bale.getStatus()
      setBotStatus(data)
    } catch (err) {
      console.error(err)
      toast.error("خطا در برقراری ارتباط با ماژول بات بله")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleSimulateCommand = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim()
    if (!text) return

    setChatLog((prev) => [...prev, { sender: "user", text }])
    setInputText("")
    setIsProcessing(true)

    try {
      // Send directly to webhook endpoint via axios
      const payload = {
        update_id: Date.now(),
        message: {
          message_id: Date.now(),
          chat: { id: 123456789 },
          text,
        },
      }
      await fetch("/api/v1/bots/bale/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      // Read mock store reply
      const statusRes = await api.bale.getStatus()
      setBotStatus(statusRes)

      let botReply = "درخواست شما پردازش شد."
      if (text.includes("تسک")) {
        botReply = "📋 فهرست تسک‌های جاری شما دریافت شد.\n1. تعمیر پمپ هیدرولیک خط ۲ (در حال انجام)\n2. کالیبراسیون سنسورها"
      } else if (text.includes("خرابی") || text.includes("توقف")) {
        botReply = "🚨 هشدار توقف خط با اولویت اضطراری ثبت و پیامک برای سرپرست شیفت ارسال شد."
      } else if (text.includes("MOK-BLT-8M1200") || text.includes("بلبرینگ")) {
        botReply = "📦 استعلام موجودی:\nتسمه تایمینگ صنعتی HTD 8M\nموجودی: ۲۸ حلقه (🟢 موجود در انبار مرکزی - کمد C3)"
      }

      setChatLog((prev) => [...prev, { sender: "bot", text: botReply }])
    } catch (err) {
      toast.error("خطا در پاسخ بات")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notificationMsg) return
    try {
      setIsSending(true)
      await api.bale.sendNotification(recipientChatId, notificationMsg)
      toast.success("پیام با موفقیت به پیام‌رسان بله ارسال گردید.")
      setNotificationMsg("")
      loadStatus()
    } catch (err) {
      toast.error("خطا در ارسال پیام به بله")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-600" />
            <span>یکپارچگی با پیام‌رسان ایرانی بله (ویژه پرسنل عملیاتی)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            دسترسی آسان کارگران خط و رانندگان بدون نیاز به سیستم رایانه‌ای یا پنل تحت وب
          </p>
        </div>

        <button
          onClick={loadStatus}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">وضعیت درگاه وب‌هوک</span>
            <span className="text-sm font-bold text-emerald-700">
              🟢 فعال (Online / Ready)
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">پیام‌های مبادله‌شده</span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              {botStatus?.mock_messages_sent_count || 12} پیام
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">حالت شبیه‌سازی (Mock)</span>
            <span className="text-sm font-bold text-blue-600 font-mono">
              {botStatus?.mock_mode ? "فعال (آفلاین و تست)" : "متصل به سرور بله"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Simulator + Notification Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Chat Simulator */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[520px] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">
                شبیه‌ساز تعاملی بات بله (نمای موبایل پرسنل)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">@Mokarrar_Bot</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
            {chatLog.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "user" ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-xs"
                  }`}
                >
                  {msg.text}
                </div>

                {msg.buttons && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%] justify-end">
                    {msg.buttons.map((btn: any, bIdx: number) => (
                      <button
                        key={bIdx}
                        onClick={() => handleSimulateCommand(btn.cmd)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-slate-100 bg-white flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSimulateCommand()}
              placeholder="دستور یا پیام خود را تایپ کنید..."
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-emerald-500"
            />
            <button
              onClick={() => handleSimulateCommand()}
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Direct Message Push Box */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>ارسال پیام و هشدار اختصاصی به کارگر</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ارسال دستور کار فوری یا اطلاع‌رسانی آماده شدن قطعه در انبار به اکانت بله پرسنل
              </p>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  شناسه کاربری (Chat ID / شماره بله)
                </label>
                <input
                  type="text"
                  required
                  value={recipientChatId}
                  onChange={(e) => setRecipientChatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:bg-white focus:border-emerald-500 text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  متن پیام اطلاع‌رسانی
                </label>
                <textarea
                  rows={4}
                  required
                  value={notificationMsg}
                  onChange={(e) => setNotificationMsg(e.target.value)}
                  placeholder="مثال: قطعات مورد نیاز شما برای تسک تعمیر پمپ از انبار مرکزی صادر شد. لطفاً جهت تحویل مراجعه کنید."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>ارسال مستقیم پیام به بله</span>
              </button>
            </form>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 leading-relaxed mt-4">
            💡 <strong>راهنما:</strong> در محیط تولیدی، توکن ربات دریافتی از بازوی بات‌ساز بله (BotFather) را در متغیر <code>BALE_BOT_TOKEN</code> در فایل <code>.env</code> قرار دهید.
          </div>
        </div>
      </div>
    </div>
  )
}
