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
} from "lucide-react"
import { StatCard } from "@/components/ui/StatCard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { api } from "@/services/api"
import { toast } from "sonner"
import { useNavigate } from "@tanstack/react-router"

interface ProductionLine {
  id: string
  name: string
  code: string
  efficiency: number
  status: "active" | "maintenance" | "standby"
  temp: string
  outputRate: string
  speed: string
}

export const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "telemetry">("overview")
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const navigate = useNavigate()

  const productionLines: ProductionLine[] = [
    {
      id: "line-1",
      name: "خط کامپاندینگ و میکس پلیمر و مستربچ",
      code: "LINE-A1 (Extrusion Compound)",
      efficiency: 96.4,
      status: "active",
      temp: "۱۹۴°C",
      outputRate: "۱,۲۴۰ kg/h",
      speed: "۱۰۰٪ ظرفیت نامی",
    },
    {
      id: "line-2",
      name: "خط تزریق و فرم‌دهی قطعات صنعتی",
      code: "LINE-B2 (Injection & Molding)",
      efficiency: 91.8,
      status: "active",
      temp: "۲۱۸°C",
      outputRate: "۸۵۰ pcs/h",
      speed: "۹۲٪ ظرفیت نامی",
    },
    {
      id: "line-3",
      name: "خط کنترل کیفی، لیبل‌زنی و بسته‌بندی مکانیزه",
      code: "LINE-C3 (QC & Automated Packaging)",
      efficiency: 98.2,
      status: "active",
      temp: "۲۴°C",
      outputRate: "۱,۴۰۰ box/h",
      speed: "۹۸٪ ظرفیت نامی",
    },
  ]

  // Weekly throughput mock points for SVG Sparkline
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

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-zinc-400 text-sm gap-3 animate-fade-in">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 animate-pulse-glow">
            <Factory className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        <span className="font-medium text-zinc-600">در حال بارگذاری شاخص‌های هوشمند کارخانه مکرر...</span>
      </div>
    )
  }

  const tasks = data?.tasks || {}
  const procurement = data?.procurement || {}
  const inventory = data?.inventory || {}
  const activities = data?.activities || []

  // SVG Chart Calculations
  const maxTons = Math.max(...weeklyData.map((d) => d.tons))
  const chartHeight = 140
  const chartWidth = 600
  const points = weeklyData.map((d, index) => {
    const x = (index / (weeklyData.length - 1)) * (chartWidth - 40) + 20
    const y = chartHeight - (d.tons / (maxTons + 10)) * (chartHeight - 30) - 15
    return { x, y, ...d }
  })

  // Create SVG path string
  const svgPath = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = arr[i - 1]
    const cpX = (prev.x + pt.x) / 2
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`
  }, "")

  const svgAreaPath = `${svgPath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Industrial Operational Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs card-interactive animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 text-orange-600 flex items-center justify-center shrink-0 border border-orange-500/20 shadow-xs">
            <Activity className="w-6 h-6 animate-float-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-black text-zinc-900 tracking-tight">
                پایش جامع عملیات صنعتی کارخانه مکرر
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                خطوط تولید فعال (شیفت A)
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              پایش بلادرنگ هماهنگی تسک‌های خطوط تولید، انبار قطعات یدکی و گردش کار تدارکات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => api.exports.downloadTasksExcel()}
            className="h-9 px-3.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all btn-pressable cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل تسک‌ها</span>
          </button>
          <button
            onClick={loadData}
            className="h-9 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all btn-pressable cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>بروزرسانی داده‌ها</span>
          </button>
        </div>
      </div>

      {/* 2. Four KPI Metric Cards with Physics Lift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "60ms" }}>
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
          title="نرخ بهره‌وری و راندمان خطوط"
          value="۹۴.۸٪"
          subtitle="OEE خطوط تولید"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          accentColor="emerald"
          colorClass="bg-emerald-50 text-emerald-600"
          footerText="خطوط کامپاندینگ، قالب و اکستروژن"
          footerBadge="استاندارد مطلوب"
        />
      </div>

      {/* 3. Interactive Visual Production & Throughput Chart */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-6 shadow-xs card-interactive animate-slide-up" style={{ animationDelay: "120ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                نمودار خروجی و حجم تولید هفتگی کارخانه (تن بر روز)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                مقایسه حجم تناژ تولیدی با نرخ استاندارد اسمی شیفت‌های تولید
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-zinc-600">میزان تولید واقعی</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
              <span className="text-zinc-400">سقف هدف‌گذاری (۵۵ تن)</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-bold font-mono text-xs border border-orange-200/60">
              میانگین: ۴۹.۷ تن/روز
            </span>
          </div>
        </div>

        {/* SVG Sparkline / Area Chart */}
        <div className="mt-4 pt-2">
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible select-none"
            >
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

              {/* Grid lines */}
              <line x1="20" y1="30" x2={chartWidth - 20} y2="30" stroke="#f4f4f5" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="20" y1="70" x2={chartWidth - 20} y2="70" stroke="#f4f4f5" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="20" y1="110" x2={chartWidth - 20} y2="110" stroke="#f4f4f5" strokeDasharray="4 4" strokeWidth="1" />

              {/* Target guideline */}
              <line x1="20" y1="42" x2={chartWidth - 20} y2="42" stroke="#fdba74" strokeDasharray="6 3" strokeWidth="1.2" opacity="0.6" />

              {/* Area fill */}
              <path d={svgAreaPath} fill="url(#mokarrarOrangeGlow)" />

              {/* Smooth curve line */}
              <path
                d={svgPath}
                fill="none"
                stroke="url(#lineStroke)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Points */}
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
                    r={hoveredPoint === i ? 7 : 4.5}
                    className="fill-white stroke-orange-500 transition-all duration-200"
                    strokeWidth={hoveredPoint === i ? 3.5 : 2.5}
                  />
                  {hoveredPoint === i && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="12"
                      className="fill-orange-500/20 animate-ping"
                    />
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* X-Axis Day Labels */}
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
                <span className="font-mono text-[11px] text-zinc-400 mt-0.5">{d.tons} تن</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Live Machine Telemetry & Production Lines */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-6 shadow-xs card-interactive animate-slide-up" style={{ animationDelay: "180ms" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                وضعیت لحظه‌ای خطوط تولید و ایستگاه‌های صنعتی
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                تله‌متری حرارت، سرعت خروجی و نرخ بهره‌وری تجهیزات کارخانه مکرر
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-zinc-100 text-zinc-700 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            سنسورهای صنعتی برخط
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {productionLines.map((line) => (
            <div
              key={line.id}
              className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-orange-500/30 hover:shadow-sm transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-200/70 text-zinc-700 rounded-md font-bold">
                  {line.code}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  فعال
                </span>
              </div>

              <h4 className="text-xs font-bold text-zinc-900 mt-2.5 line-clamp-1 group-hover:text-orange-600 transition-colors">
                {line.name}
              </h4>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">راندمان عملیاتی:</span>
                  <span className="font-mono font-bold text-zinc-900">{line.efficiency}٪</span>
                </div>
                <div className="w-full h-2 bg-zinc-200/70 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-700"
                    style={{ width: `${line.efficiency}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-200/60 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-zinc-100">
                  <span className="text-zinc-400 block text-[10px]">دما</span>
                  <span className="font-mono font-bold text-zinc-800">{line.temp}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-zinc-100">
                  <span className="text-zinc-400 block text-[10px]">دبی خروجی</span>
                  <span className="font-mono font-bold text-zinc-800">{line.outputRate}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-zinc-100">
                  <span className="text-zinc-400 block text-[10px]">وضعیت بار</span>
                  <span className="font-bold text-emerald-600 text-[10px]">{line.speed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Middle Section: Phase Architecture Progress & Live Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-slide-up" style={{ animationDelay: "240ms" }}>
        {/* Right 8 Cols: Architectural Phases & Progress */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-zinc-200/90 p-6 shadow-xs card-interactive space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                وضعیت پیشرفت یکپارچگی فازهای سه‌گانه سامانه مکرر
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                اتصال و همگام‌سازی لحظه‌ای بین Plane Engine + Mokarrar Core + InvenTree
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200/80">
              نسخه ۱.۰ فعال
            </span>
          </div>

          {/* Phase 1 Progress */}
          <div className="space-y-2 group">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-700 flex items-center gap-1.5 group-hover:text-zinc-900 transition-colors">
                <Kanban className="w-3.5 h-3.5 text-zinc-700" />
                فاز ۱: مدیریت تسک‌ها و برد کانبان صنعتی (Plane Engine)
              </span>
              <span className="text-zinc-900 font-mono">{tasks.rate || 0}% پیشرفت</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-800 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, tasks.rate || 0)}%` }}
              />
            </div>
          </div>

          {/* Phase 2 Progress */}
          <div className="space-y-2 group">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-700 flex items-center gap-1.5 group-hover:text-orange-600 transition-colors">
                <ShoppingCart className="w-3.5 h-3.5 text-orange-600" />
                فاز ۲: گردش کار تدارکات و خرید چندمرحله‌ای (Mokarrar PR Flow)
              </span>
              <span className="text-orange-600 font-mono">تایید دو مرحله‌ای آماده</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full w-full" />
            </div>
          </div>

          {/* Phase 3 Progress */}
          <div className="space-y-2 group">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-700 flex items-center gap-1.5 group-hover:text-emerald-600 transition-colors">
                <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                فاز ۳: انبارداری، کاردکس کالا و قطعات یدکی (InvenTree REST API)
              </span>
              <span className="text-emerald-600 font-mono">
                {inventory.total_sku || 4} قلم ثبت‌شده
              </span>
            </div>
            <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full w-full" />
            </div>
          </div>

          {/* Strategic Navigation Banner */}
          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 group hover:border-orange-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 border border-orange-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900">
                  اتصال خودکار وب‌هوک و تلگرام/بله (@MokarrarSuperAppbot)
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  ارسال نوتیفیکیشن لحظه‌ای تغییر وضعیت تسک‌ها، اعلام خرابی و تأیید درخواست‌های خرید
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate({ to: "/procurement" })}
                className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all btn-pressable cursor-pointer"
              >
                <span>مدیریت تدارکات</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Left 4 Cols: Live Operations Timeline */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-zinc-200/90 p-6 shadow-xs card-interactive space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-zinc-900">فعالیت‌های لحظه‌ای کارخانه</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-600 font-mono font-bold rounded-md border border-orange-200/60">
              زنده
            </span>
          </div>

          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 bg-zinc-50/70 rounded-xl border border-zinc-100 flex items-start gap-3 hover:bg-zinc-100/70 hover:border-zinc-200 transition-all duration-200 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 group-hover:scale-105 transition-transform">
                    {act.type === "PROCUREMENT" ? "خرید" : act.type === "TASK" ? "تسک" : "انبار"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-zinc-900 truncate group-hover:text-orange-600 transition-colors">
                        {act.title}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
                      <span>{act.user}</span>
                      <span className="font-mono text-[10px]">{act.time}</span>
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
