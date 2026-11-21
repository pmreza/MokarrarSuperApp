import React, { useEffect, useState } from "react"
import {
  Kanban,
  Clock,
  AlertTriangle,
  ShoppingCart,
  Warehouse,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import { StatCard } from "@/components/ui/StatCard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { api } from "@/services/api"
import { toast } from "sonner"
import { useNavigate } from "@tanstack/react-router"

export const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const navigate = useNavigate()

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.dashboard.getKpis()
      setData(res)
    } catch (err) {
      console.error(err)
      toast.error("خطا در بارگذاری شاخص‌های داشبورد")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-zinc-400 text-sm gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
        <span>در حال بارگذاری شاخص‌های جامع کارخانه مکرر...</span>
      </div>
    )
  }

  const tasks = data?.tasks || {}
  const procurement = data?.procurement || {}
  const inventory = data?.inventory || {}
  const activities = data?.activities || []

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Top Industrial Operational Context Header (Inspired by Stitch) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-zinc-900 tracking-tight">
                پایش جامع عملیات صنعتی کارخانه مکرر
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                شبکه آنلاین (شیفت فعال)
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              پایش بلادرنگ هماهنگی تسک‌های خطوط تولید، انبار قطعات یدکی و تدارکات استراتژیک
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => api.exports.downloadTasksExcel()}
            className="h-9 px-3.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل تسک‌ها</span>
          </button>
          <button
            onClick={loadData}
            className="h-9 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>بروزرسانی داده‌ها</span>
          </button>
        </div>
      </div>

      {/* 2. Four KPI Metric Cards with Signature Accent Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Active Tasks */}
        <StatCard
          title="کل وظایف فعال کارخانه"
          value={tasks.total || 0}
          subtitle="تسک عملیاتی"
          icon={<Kanban className="w-5 h-5 text-zinc-800" />}
          accentColor="charcoal"
          colorClass="bg-zinc-100 text-zinc-800"
          footerText={`${tasks.in_progress || 0} در حال اجرا • ${tasks.done || 0} تکمیل‌شده`}
          footerBadge="فاز ۱ (Plane)"
        />

        {/* Card 2: Procurement Requests */}
        <StatCard
          title="درخواست‌های خرید جاری (PR)"
          value={procurement.pending_count || 0}
          subtitle="سفارش در گردش"
          icon={<ShoppingCart className="w-5 h-5 text-orange-600" />}
          accentColor="orange"
          colorClass="bg-orange-50 text-orange-600"
          footerText={`ارزش: ${(procurement.pending_amount_irr || 0).toLocaleString()} ریال`}
          footerBadge="فاز ۲ تدارکات"
        />

        {/* Card 3: Inventory Alerts */}
        <StatCard
          title="قطعات در مرز هشدار انبار"
          value={inventory.low_stock_count || 0}
          subtitle="قلم بحرانی"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          accentColor="amber"
          colorClass="bg-amber-50 text-amber-600"
          footerText="نیازمند سفارش‌گذاری تأمین مجدد"
          footerBadge="فاز ۳ کاردکس"
        />

        {/* Card 4: Factory Efficiency (OEE) */}
        <StatCard
          title="نرخ بهره‌وری و پایداری خطوط"
          value="۹۴.۸٪"
          subtitle="OEE خطوط تولید"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          accentColor="emerald"
          colorClass="bg-emerald-50 text-emerald-600"
          footerText="خطوط اکستروژن و مونتاژ"
          footerBadge="استاندارد مطلوب"
        />
      </div>

      {/* 3. Middle Section: Phase Architecture Progress & Live Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right 8 Cols: Architectural Phases & Progress */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                وضعیت پیشرفت یکپارچگی فازهای سه‌گانه سامانه مکرر
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                اتصال و همگام‌سازی لحظه‌ای بین Plane Engine + Mokarrar Core + InvenTree
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
              نسخه ۱.۰ فعال
            </span>
          </div>

          {/* Phase 1 Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-700 flex items-center gap-1.5">
                <Kanban className="w-3.5 h-3.5 text-zinc-700" />
                فاز ۱: مدیریت تسک‌ها و برد کانبان صنعتی (Plane Engine)
              </span>
              <span className="text-zinc-900 font-mono">{tasks.rate || 0}% پیشرفت</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-800 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, tasks.rate || 0)}%` }}
              />
            </div>
          </div>

          {/* Phase 2 Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-700 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-orange-600" />
                فاز ۲: گردش کار تدارکات و خرید چندمرحله‌ای (Mokarrar PR Flow)
              </span>
              <span className="text-orange-600 font-mono">تایید دو مرحله‌ای آماده</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full w-full" />
            </div>
          </div>

          {/* Phase 3 Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-700 flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                فاز ۳: انبارداری، کاردکس کالا و قطعات یدکی (InvenTree REST API)
              </span>
              <span className="text-emerald-600 font-mono">
                {inventory.total_sku || 4} قلم ثبت‌شده
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-full" />
            </div>
          </div>

          {/* Strategic Navigation Banner */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900">
                  اتصال خودکار وب‌هوک و تلگرام/بله
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  ارسال نوتیفیکیشن لحظه‌ای تغییر وضعیت تسک‌ها و فاکتورهای تاییدشده
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate({ to: "/procurement" })}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
              >
                <span>مدیریت تدارکات</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Left 4 Cols: Live Operations Timeline (Inspired by Stitch) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-zinc-900">فعالیت‌های لحظه‌ای کارخانه</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-600 font-mono rounded">
              زنده
            </span>
          </div>

          <div className="space-y-3.5">
            {activities.length > 0 ? (
              activities.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-100 flex items-start gap-3 hover:bg-zinc-100/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {act.type === "PROCUREMENT" ? "خرید" : act.type === "TASK" ? "تسک" : "انبار"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{act.title}</p>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
                      <span>{act.user}</span>
                      <span className="font-mono">{act.time}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 text-center py-6">رخداد جدیدی ثبت نشده است.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
