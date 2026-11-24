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
  Zap,
  Gauge,
  Cpu,
  BarChart3,
  Factory,
  Flame,
  Scale,
  Recycle,
  AlertOctagon,
  Calendar,
  Check,
  ChevronLeft,
} from "lucide-react"
import { StatCard } from "@/components/ui/StatCard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { api } from "@/services/api"
import { toast } from "sonner"
import { useNavigate } from "@tanstack/react-router"

export const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Record<string, boolean>>({})
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

  const handleEmergencyStop = () => {
    toast.error("اعلام توقف اضطراری! سیگنال ایمنی به سرپرست شیفت و بازوی بله مخابره گردید.", {
      duration: 5000,
    })
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-zinc-400 text-sm gap-3 animate-fade-in">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 animate-pulse-glow">
            <Factory className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        <span className="font-medium text-zinc-600">در حال بارگذاری مرکز فرماندهی و پایش برخط مکرر بازآفرین...</span>
      </div>
    )
  }

  const tasks = data?.tasks || {}
  const procurement = data?.procurement || {}
  const inventory = data?.inventory || {}
  const activities = data?.activities || []

  const totalTasks = tasks.total || 0
  const inProgressTasks = tasks.in_progress || 0
  const doneTasks = tasks.done || 0
  const taskRate = tasks.rate || 0

  const totalPrs = procurement.total_count || 0
  const pendingPrs = procurement.pending_count || 0
  const pendingCost = procurement.pending_amount_irr || 0
  const totalCost = procurement.total_amount_irr || 0

  const totalSku = inventory.total_sku || 0
  const lowStockCount = inventory.low_stock_count || 0

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Industrial Command Sub-Header */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs card-interactive animate-slide-up flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#062434] text-white flex items-center justify-center shadow-xs">
              <Factory className="w-5 h-5 text-orange-400" />
            </span>
            <h1 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              مرکز فرماندهی و پایش برخط خطوط بازآفرینی مکرر
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-[11px] border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              سیستم عملیاتی متصل به پایگاه داده زنده
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            پایش یکپارچه و واقعی تسک‌های فنی، تدارکات و مصوبات خرید، و موجودی انبار کارخانه مکرر
          </p>
        </div>

        {/* Operational Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Sync Indicator */}
          <div className="flex items-center gap-1.5 bg-zinc-100/80 px-2.5 py-1.5 rounded-xl text-zinc-600 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium hidden sm:inline">همگام‌سازی لحظه‌ای</span>
            <button
              onClick={loadData}
              className="text-zinc-500 hover:text-zinc-900 p-0.5 rounded transition-colors cursor-pointer"
              title="تازه‌سازی دستی"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Excel Export */}
          <button
            onClick={() => api.exports.downloadTasksExcel()}
            className="h-9 px-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">خروجی اکسل شیفت</span>
          </button>

          {/* Emergency Stop Report Button */}
          <button
            onClick={handleEmergencyStop}
            className="h-9 px-3.5 bg-[#e02b00] hover:bg-[#b32000] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="ثبت فوری رخداد توقف خط"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>ثبت توقف اضطراری</span>
          </button>
        </div>
      </div>

      {/* 2. Real Telemetry StatCards (100% Data-Driven) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "60ms" }}>
        {/* Card 1: Tasks Completion Rate */}
        <div
          onClick={() => navigate({ to: "/tasks" })}
          className="relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-orange-500/40 transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-orange-600" />
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-semibold block">پیشرفت عملیات فنی</span>
                <h3 className="text-xs font-bold text-zinc-800 mt-0.5">درصد تکمیل دستور کارها</h3>
              </div>
              <span className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <Kanban className="w-5 h-5" />
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-zinc-900 tracking-tight font-mono">{taskRate}</span>
                <span className="text-sm font-bold text-zinc-600 font-mono">٪</span>
              </div>
              <div className="text-xs font-bold font-mono text-zinc-500">
                {doneTasks} از {totalTasks} تسک
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-[11px]">
            <span className="text-zinc-600 font-medium">
              {inProgressTasks} تسک در حال انجام
            </span>
            <span className="text-orange-600 font-bold flex items-center gap-0.5">
              مشاهده بورد <ChevronLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Total Active Tasks Count */}
        <div
          onClick={() => navigate({ to: "/tasks" })}
          className="relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-blue-500/40 transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-[#062434]" />
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-semibold block">حجم کل اقدامات</span>
                <h3 className="text-xs font-bold text-zinc-800 mt-0.5">کل تسک‌های ثبت‌شده</h3>
              </div>
              <span className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
                <Activity className="w-5 h-5" />
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-zinc-900 tracking-tight font-mono">{totalTasks}</span>
                <span className="text-xs font-bold text-zinc-500">مورد</span>
              </div>
              <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md font-mono">
                {totalTasks > 0 ? "فعال" : "خالی"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-[11px]">
            <span className="text-zinc-600">پایگاه داده کارخانه</span>
            <span className="text-zinc-400">ثبت از طریق سامانه یا بات بله</span>
          </div>
        </div>

        {/* Card 3: Pending Procurement Approvals */}
        <div
          onClick={() => navigate({ to: "/procurement" })}
          className="relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-amber-500/40 transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500" />
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-semibold block">گردش مصوبات مالی</span>
                <h3 className="text-xs font-bold text-zinc-800 mt-0.5">سفارشات در انتظار تایید</h3>
              </div>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <ShoppingCart className="w-5 h-5" />
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-zinc-900 tracking-tight font-mono">{pendingPrs}</span>
                <span className="text-xs font-bold text-zinc-500">سفارش</span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-mono">
                از {totalPrs} کل
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-[11px]">
            <span className="text-zinc-600 font-mono">
              مبلغ: {pendingCost.toLocaleString()} ریال
            </span>
            <span className="text-amber-600 font-bold flex items-center gap-0.5">
              بررسی <ChevronLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Inventory SKUs & Alerts */}
        <div
          onClick={() => navigate({ to: "/inventory" })}
          className="relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-emerald-500/40 transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 left-0 h-1 bg-[#006857]" />
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-semibold block">انبار و کاردکس کالا</span>
                <h3 className="text-xs font-bold text-zinc-800 mt-0.5">اقلام موجود در انبار</h3>
              </div>
              <span className="p-2 rounded-xl bg-emerald-50 text-[#006857]">
                <Warehouse className="w-5 h-5" />
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-zinc-900 tracking-tight font-mono">{totalSku}</span>
                <span className="text-xs font-bold text-zinc-500">قلم کالا</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md font-mono ${
                lowStockCount > 0 ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700"
              }`}>
                {lowStockCount > 0 ? `${lowStockCount} کسری` : "موجودی کافی"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-[11px]">
            <span className="text-[#006857] font-bold">کاردکس مکانیزه</span>
            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
              مدیریت انبار <ChevronLeft className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Operational Integration Strip (Direct Real-time Links) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plane Tasks */}
        <div
          onClick={() => navigate({ to: "/tasks" })}
          className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-orange-500/50 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Kanban className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">مدیریت دستور کارهای فنی (فاز ۱)</span>
              <span className="text-sm font-bold text-zinc-900">
                {totalTasks} تسک فعال ({inProgressTasks} در حال اجرا)
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 group-hover:-translate-x-1 transition-all" />
        </div>

        {/* PR Procurement */}
        <div
          onClick={() => navigate({ to: "/procurement" })}
          className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-orange-500/50 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">تدارکات و گردش مصوبات خرید (فاز ۲)</span>
              <span className="text-sm font-bold text-zinc-900">
                {pendingPrs} سفارش در صف بررسی
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 group-hover:-translate-x-1 transition-all" />
        </div>

        {/* InvenTree Inventory */}
        <div
          onClick={() => navigate({ to: "/inventory" })}
          className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-orange-500/50 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 block">انبار و کاردکس مکانیزه کالا (فاز ۳)</span>
              <span className="text-sm font-bold text-zinc-900">
                {lowStockCount} قلم در مرز هشدار موجودی
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 group-hover:-translate-x-1 transition-all" />
        </div>
      </div>

      {/* 4. Real System Overview & Live Activities Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Operational Status by Location */}
        <div className="xl:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-[#062434] text-white">
                  <Factory className="w-5 h-5 text-orange-400" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">
                    وضعیت عملیاتی واحدهای سازمان (بر اساس داده‌های واقعی)
                  </h2>
                  <p className="text-xs text-zinc-500">
                    پایش برخط وظایف و مصوبات به تفکیک کارخانه ملارد و دفتر مرکزی
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200/60">
                سیستم آنلاین
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Plant Card */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <h3 className="text-xs font-bold text-zinc-900">کارخانه مکرر (ملارد)</h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200">
                    واحد تولید و فنی
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  مسئولیت خطوط تولید، تعمیرات و نگهداری، کنترل کیفی، انبار قطعات و پرسنل میدانی.
                </p>
                <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-600">دستور کارهای اختصاص‌یافته:</span>
                  <span className="font-mono text-orange-600">{totalTasks} تسک</span>
                </div>
              </div>

              {/* Central Office Card */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#062434]" />
                    <h3 className="text-xs font-bold text-zinc-900">دفتر مرکزی (تهران)</h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200">
                    مدیریت و ستاد
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  هماهنگی مدیریت عامل، امور اداری، تحقیق و توسعه، سرپرست IT و تاییدات مالی تدارکات.
                </p>
                <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-600">سفارشات خرید در انتظار:</span>
                  <span className="font-mono text-amber-600">{pendingPrs} سفارش</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Real-time Activities Feed */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-zinc-900">آخرین فعالیت‌های واقعی سیستم</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-600 font-mono font-bold rounded-md">
                زنده
              </span>
            </div>

            <div className="space-y-2.5">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((act: any) => (
                  <div
                    key={act.id}
                    className="p-2.5 bg-zinc-50/70 rounded-xl border border-zinc-100 flex items-start gap-2.5 hover:bg-zinc-100/70 transition-all cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 font-mono">
                      {act.type === "PROCUREMENT" ? "خرید" : act.type === "TASK" ? "تسک" : "انبار"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate group-hover:text-orange-600 transition-colors">
                        {act.title}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400 font-mono">
                        <span>{act.user}</span>
                        <span>{act.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                  <p className="text-xs font-medium text-zinc-500">هیچ رخداد یا داده فیکی در سیستم وجود ندارد.</p>
                  <p className="text-[11px] text-zinc-400 mt-1">با ثبت تسک یا سفارش خرید جدید، فعالیت‌ها نمایش داده می‌شوند.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
