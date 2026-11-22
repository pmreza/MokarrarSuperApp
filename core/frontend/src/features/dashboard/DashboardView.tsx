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
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"lines" | "chart">("lines")
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Record<string, boolean>>({})
  const navigate = useNavigate()

  // Weekly throughput points for SVG Sparkline
  const weeklyData = [
    { day: "شنبه", tons: 42, efficiency: 91 },
    { day: "یکشنبه", tons: 48, efficiency: 94 },
    { day: "دوشنبه", tons: 53, efficiency: 96 },
    { day: "سه‌شنبه", tons: 49, efficiency: 93 },
    { day: "چهارشنبه", tons: 57, efficiency: 98 },
    { day: "پنجشنبه", tons: 52, efficiency: 95 },
    { day: "جمعه", tons: 38, efficiency: 89 },
  ]

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

  const handleAckAlert = (id: string, text: string) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: true }))
    toast.success(`اقدام اپراتور ثبت شد: ${text}`)
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

  // SVG Chart Calculations
  const maxTons = Math.max(...weeklyData.map((d) => d.tons))
  const chartHeight = 130
  const chartWidth = 600
  const points = weeklyData.map((d, index) => {
    const x = (index / (weeklyData.length - 1)) * (chartWidth - 40) + 20
    const y = chartHeight - (d.tons / (maxTons + 10)) * (chartHeight - 30) - 15
    return { x, y, ...d }
  })

  const svgPath = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = arr[i - 1]
    const cpX = (prev.x + pt.x) / 2
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`
  }, "")

  const svgAreaPath = `${svgPath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Stitch Industrial Command Sub-Header */}
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
              اسکادا نسخه ۲.۴ متصل
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-semibold text-[11px]">
              شیفت صبح (A) - سرپرست: مهندس کریمی
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            پایش لحظه‌ای خطوط کمپاندینگ، قالب‌گیری، کنترل کیفیت و چرخه بازآفرینی پلیمر کارخانه مکرر
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

          {/* Emergency Stop Report Button (Stitch Pattern) */}
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

      {/* 2. Stitch Telemetry StatCards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "60ms" }}>
        {/* Card 1: Polymer Recovery Rate */}
        <div className="relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 left-0 h-1 bg-[#e02b00]" />
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-semibold block">راندمان مواد و فرآیند</span>
                <h3 className="text-xs font-bold text-zinc-800 mt-0.5">نرخ بازآفرینی و بازدهی مواد</h3>
              </div>
              <span className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <Recycle className="w-5 h-5" />
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-zinc-900 tracking-tight font-mono">۹۴.۲</span>
                <span className="text-sm font-bold text-zinc-600 font-mono">٪</span>
              </div>
              {/* Mini Sparkline SVG */}
              <div className="w-20 h-7 text-emerald-600">
                <svg className="w-full h-full" fill="none" viewBox="0 0 100 32">
                  <path d="M0 24 Q 25 28, 40 18 T 75 10 T 100 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
                  <path d="M0 24 Q 25 28, 40 18 T 75 10 T 100 4 L 100 32 L 0 32 Z" fill="currentColor" fillOpacity="0.12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-[11px]">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +۲.۴٪ نسبت به شیفت قبل
            </span>
            <span className="text-zinc-400">هدف: ۹۳٪</span>
          </div>
        </div>

        {/* Card 2: Total Daily Tonnage */}
        <div className="relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 left-0 h-1 bg-[#062434]" />
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-semibold block">خروجی وزنی خطوط</span>
                <h3 className="text-xs font-bold text-zinc-800 mt-0.5">تناژ تولید کل امروز</h3>
              </div>
              <span className="p-2 rounded-xl bg-zinc-100 text-zinc-800">
                <Scale className="w-5 h-5" />
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-zinc-900 tracking-tight font-mono">۴۸.۶</span>
                <span className="text-xs font-bold text-zinc-500">تن</span>
              </div>
              {/* Circular Meter */}
              <div className="relative flex items-center justify-center">
                <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-zinc-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                  <path className="text-orange-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="93, 100" strokeLinecap="round" strokeWidth="3.5" />
                </svg>
                <span className="absolute font-bold text-[10px] text-zinc-800 font-mono">۹۳٪</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-[11px]">
            <span className="text-zinc-700 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              در محدوده مجاز هدف شیفت
            </span>
            <span className="text-zinc-400">سقف: ۵۲ تن</span>
          </div>
        </div>

        {/* Card 3: Polymerization Temperature */}
        <div className="relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 left-0 h-1 bg-[#ff3200]" />
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-semibold block">حرارت اکسترودر و راکتور</span>
                <h3 className="text-xs font-bold text-zinc-800 mt-0.5">دمای راکتورهای پلیمریزاسیون</h3>
              </div>
              <span className="p-2 rounded-xl bg-orange-50 text-[#e02b00]">
                <Flame className="w-5 h-5" />
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#e02b00] tracking-tight font-mono">۲۱۴</span>
                <span className="text-sm font-bold text-zinc-500 font-mono">°C</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200/60">
                پایدار و نرمال
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-[11px]">
            <span className="text-zinc-600">ثبات حرارتی Zone 4</span>
            <span className="text-zinc-400 font-mono">بازه: ۲۱۰-۲۲۰°C</span>
          </div>
        </div>

        {/* Card 4: Economic Value Recovered */}
        <div className="relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 left-0 h-1 bg-[#006857]" />
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-zinc-400 font-semibold block">ارزش‌گذاری و بازده مالی</span>
                <h3 className="text-xs font-bold text-zinc-800 mt-0.5">ارزش اقتصادی مواد بازیافتی</h3>
              </div>
              <span className="p-2 rounded-xl bg-emerald-50 text-[#006857]">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>

            <div className="my-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight font-mono">۳,۴۵۰,۰۰۰,۰۰۰</span>
                <span className="text-xs text-zinc-500">ریال</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">گردش مالی ۲۴ ساعت گذشته</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 text-[11px]">
            <span className="text-[#006857] font-bold">ROI بازآفرینی: ۳۸.۵٪</span>
            <span className="text-zinc-400">حاشیه سود ایمن</span>
          </div>
        </div>
      </div>

      {/* 3. Operational Integration Strip (Plane + PR + InvenTree) */}
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
                {tasks.total || 0} تسک فعال ({tasks.in_progress || 0} در حال اجرا)
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
                {procurement.pending_count || 0} سفارش در صف بررسی
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
                {inventory.low_stock_count || 0} قلم در مرز هشدار موجودی
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 group-hover:-translate-x-1 transition-all" />
        </div>
      </div>

      {/* 4. Stitch Dynamic Production Lines Monitoring & Alerts (12 Cols Grid) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left/Main 8 Cols: Real-time Production Lines */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-zinc-200/90 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-[#062434] text-white">
                <Cpu className="w-5 h-5 text-orange-400" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-zinc-900">
                  مانیتورینگ برخط و دینامیک خطوط کارخانه (Industrial Plant SCADA)
                </h2>
                <p className="text-xs text-zinc-500">
                  تحلیل دورسنجی سنسورهای فشار، لرزش، دبی خروجی و بار مکانیکی موتورها
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold font-mono">۳ خط فعال</span>
              <span className="text-emerald-600 font-bold hidden sm:inline">۹۸.۴٪ آمادگی کل</span>
            </div>
          </div>

          {/* Line A1 Container */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-4 hover:shadow-sm transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 font-black text-sm flex items-center justify-center shrink-0 border border-orange-500/20 font-mono">
                  A1
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                      خط کمپاندینگ و گرانول‌سازی پیشرفته (Compounder Pro)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold flex items-center gap-1 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      فعال و بار کامل
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    مسئول شیفت: مهندس حسینی | کد بچ جاری: CP-88402-HDPE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                  دمای دای: ۱۹۴°C
                </span>
              </div>
            </div>

            {/* Gauges Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
              <div>
                <span className="text-[10px] text-zinc-400 block">دبی خروجی (Throughput)</span>
                <span className="text-sm font-bold text-zinc-900 font-mono">۱۸.۲ تن/ساعت</span>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: "88%" }} />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block">سرعت خط (Line Speed)</span>
                <span className="text-sm font-bold text-zinc-900 font-mono">۹۶٪ ظرفیت نامی</span>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-[#062434] h-full rounded-full" style={{ width: "96%" }} />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block">لرزش یاتاقان موتور</span>
                <span className="text-sm font-bold text-emerald-600 font-mono">۰.۸ mm/s (عادی)</span>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "25%" }} />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block">فشار خروجی دای (Die Pressure)</span>
                <span className="text-sm font-bold text-orange-600 font-mono">۱۴۲ Bar</span>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: "72%" }} />
                </div>
              </div>
            </div>

            {/* Material Pipeline Flow (Stitch Signature) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>مسیر فرآیند پلیمری: خوراک‌دهی سنگین</span>
                <span className="text-zinc-400">← میکسینگ حرارتی</span>
                <span className="text-zinc-400">← فیلتراسیون مذاب</span>
                <span className="text-emerald-600 font-bold">← دانه‌بندی و سردسازی پلت</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                <div className="bg-[#062434] h-full" style={{ width: "25%" }} title="خوراک دهی" />
                <div className="bg-orange-500 h-full" style={{ width: "35%" }} title="میکسینگ" />
                <div className="bg-amber-500 h-full" style={{ width: "20%" }} title="فیلتراسیون" />
                <div className="bg-emerald-500 h-full" style={{ width: "20%" }} title="سردسازی" />
              </div>
            </div>
          </div>

          {/* Line B2 Container */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-4 hover:shadow-sm transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-800 font-black text-sm flex items-center justify-center shrink-0 border border-zinc-200 font-mono">
                  B2
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                      خط بازآفرینی ضایعات پلیمری و شستشو (Flake Wash)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 font-bold flex items-center gap-1 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      در حال فیلتراسیون پیوسته
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    مسئول شیفت: تکنسین زارع | شستشو و بازیافت ضایعات پلی‌پروپیلن صنعتی
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-1 rounded-lg">
                  دمای خشک‌کن: ۹۵°C
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
              <div>
                <span className="text-[10px] text-zinc-400 block">توان فرآوری</span>
                <span className="text-sm font-bold text-zinc-900 font-mono">۱۲.۴ تن/ساعت</span>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: "65%" }} />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block">راندمان موتور شستشو</span>
                <span className="text-sm font-bold text-zinc-900 font-mono">۷۸٪ دور نامی</span>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-[#062434] h-full rounded-full" style={{ width: "78%" }} />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block">افت فشار فیلتر (Delta P)</span>
                <span className="text-sm font-bold text-amber-600 font-mono">۱.۴ Bar (نزدیک تعویض)</span>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "82%" }} />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block">کنترل کیفیت پرک</span>
                <span className="text-sm font-bold text-emerald-600 font-mono">۹۹.۱٪ خلوص</span>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "95%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Line C3 Container */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-4 hover:shadow-sm transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200 font-mono">
                  C3
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                      خط بسته‌بندی اتوماتیک و تست کیفی (QC & Packaging)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold flex items-center gap-1 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      تأیید استاندارد ملی INSO
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    تأییدیه کنترل کیفیت گرانول با استاندارد ملی و گواهی آزمون آزمایشگاه مرکزی
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                  MFI: 2.1 g/10min
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
              <div>
                <span className="text-[10px] text-zinc-400 block">تعداد کیسه بسته‌بندی</span>
                <span className="text-sm font-bold text-zinc-900 font-mono">۱,۴۲۰ کیسه ۲۵kg</span>
                <span className="text-[10px] text-zinc-400 block mt-1">نرخ در هر ساعت</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block">نرخ رد ضایعات (Rejection)</span>
                <span className="text-sm font-bold text-emerald-600 font-mono">۰.۳٪ (عالی)</span>
                <span className="text-[10px] text-zinc-400 block mt-1">استاندارد: زیر ۱.۵٪</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block">شاخص جریان مذاب (MFI)</span>
                <span className="text-sm font-bold text-zinc-900 font-mono">۲.۱ g/10min</span>
                <span className="text-[10px] text-zinc-400 block mt-1">تطابق با فرمولاسیون</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block">موجودی انبار پالت محصول</span>
                <span className="text-sm font-bold text-zinc-900 font-mono">۶۲ پالت</span>
                <span className="text-[10px] text-emerald-600 block mt-1 font-semibold">آماده بارگیری و ارسال</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Stitch Alerts Hub & Timeline */}
        <div className="xl:col-span-4 space-y-4">
          {/* Active Safety Alerts Hub */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-[#e02b00] text-white">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <h3 className="text-xs font-bold text-zinc-900">هشدارهای فعال و وضعیت ایمنی</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold">
                ۲ رویداد
              </span>
            </div>

            {/* Alert 1 */}
            <div className={`p-3 rounded-xl border transition-all ${
              acknowledgedAlerts["alert-1"] ? "bg-zinc-50 border-zinc-200 opacity-60" : "bg-orange-50/50 border-orange-200/80"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900">تعویض برنامه‌ریزی شده فیلتر خط B2</span>
                <span className="text-[10px] text-orange-600 font-bold font-mono">۴۵ دقیقه مانده</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                افت فشار به ۱.۴ بار رسیده است؛ تیم نگهداری و تعمیرات (نت) در حالت آماده‌باش باشد.
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={() => handleAckAlert("alert-1", "تعویض فیلتر B2")}
                  disabled={acknowledgedAlerts["alert-1"]}
                  className="px-2.5 py-1 rounded-lg bg-[#062434] text-white text-[10px] font-bold hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {acknowledgedAlerts["alert-1"] ? "تأیید شد" : "تأیید اپراتور"}
                </button>
                <button
                  onClick={() => toast.info("هشدار به مدت ۳۰ دقیقه به تعویق افتاد.")}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-600 text-[10px] font-medium hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  به تعویق انداختن
                </button>
              </div>
            </div>

            {/* Alert 2 */}
            <div className={`p-3 rounded-xl border transition-all ${
              acknowledgedAlerts["alert-2"] ? "bg-zinc-50 border-zinc-200 opacity-60" : "bg-emerald-50/50 border-emerald-200/80"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900">تطابق طیف‌سنجی گرانول مشکی</span>
                <span className="text-[10px] text-emerald-700 font-bold font-mono">۹۸٪ تطابق</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                سنجش یکنواختی مستربچ کربن بلک در میکسر دورانی خط ۳ تأیید گردید.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  استاندارد پاس شد
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Activities Feed */}
          <div className="bg-white rounded-xl border border-zinc-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-zinc-900">فعالیت‌های لحظه‌ای کارخانه</h3>
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
                <p className="text-xs text-zinc-400 text-center py-4">رخداد جدیدی ثبت نشده است.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Production Throughput Chart (تن بر روز) */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs card-interactive animate-slide-up" style={{ animationDelay: "180ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900">
                نمودار خروجی و حجم تولید هفتگی کارخانه مکرر (تن بر روز)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                مقایسه حجم تناژ تولیدی با سقف هدف‌گذاری شیفت‌های تولید
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-zinc-600 text-[11px]">تولید واقعی</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-bold font-mono text-xs border border-orange-200/60">
              میانگین: ۴۹.۷ تن/روز
            </span>
          </div>
        </div>

        {/* SVG Sparkline Chart */}
        <div className="mt-4 pt-2">
          <div className="relative w-full overflow-hidden">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-36 overflow-visible select-none">
              <defs>
                <linearGradient id="mokarrarOrangeGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.32" />
                  <stop offset="60%" stopColor="#f97316" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
              </defs>

              <line x1="20" y1="25" x2={chartWidth - 20} y2="25" stroke="#f4f4f5" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="20" y1="65" x2={chartWidth - 20} y2="65" stroke="#f4f4f5" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="20" y1="105" x2={chartWidth - 20} y2="105" stroke="#f4f4f5" strokeDasharray="4 4" strokeWidth="1" />

              <path d={svgAreaPath} fill="url(#mokarrarOrangeGlow)" />
              <path d={svgPath} fill="none" stroke="url(#lineStroke)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {points.map((pt, i) => (
                <g
                  key={i}
                  className="cursor-pointer transition-transform duration-200"
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint === i ? 6 : 4}
                    className="fill-white stroke-orange-500 transition-all duration-200"
                    strokeWidth={hoveredPoint === i ? 3 : 2}
                  />
                  {hoveredPoint === i && (
                    <circle cx={pt.x} cy={pt.y} r="10" className="fill-orange-500/20 animate-ping" />
                  )}
                </g>
              ))}
            </svg>
          </div>

          <div className="flex justify-between items-center px-4 pt-2 border-t border-zinc-100 text-xs text-zinc-500 font-medium">
            {weeklyData.map((d, i) => (
              <div
                key={i}
                className={`flex flex-col items-center transition-colors cursor-pointer ${
                  hoveredPoint === i ? "text-orange-600 font-bold scale-105" : ""
                }`}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <span>{d.day}</span>
                <span className="font-mono text-[10px] text-zinc-400 mt-0.5">{d.tons} تن</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}