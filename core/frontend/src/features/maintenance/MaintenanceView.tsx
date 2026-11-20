import React, { useEffect, useState } from "react"
import {
  Wrench,
  AlertTriangle,
  Clock,
  RefreshCw,
  Activity,
  ShieldAlert,
} from "lucide-react"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Modal } from "@/components/ui/Modal"
import { api } from "@/services/api"
import { toast } from "sonner"

export const MaintenanceView: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Emergency Modal
  const [isOpenStopModal, setIsOpenStopModal] = useState(false)
  const [lineNumber, setLineNumber] = useState(1)
  const [machineName, setMachineName] = useState("")
  const [failureType, setFailureType] = useState("مکانیکی")
  const [description, setDescription] = useState("")
  const [phone, setPhone] = useState("09121112233")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [ticketsData, statsData] = await Promise.all([
        api.maintenance.listTickets(),
        api.maintenance.getStats(),
      ])
      setTickets(ticketsData)
      setStats(statsData)
    } catch (err) {
      console.error(err)
      toast.error("خطا در بارگذاری اطلاعات تعمیرات و نگهداری")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleReportLineStop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!machineName || !description) {
      toast.error("لطفاً نام تجهیز و شرح خرابی را تکمیل کنید.")
      return
    }
    try {
      setIsSubmitting(true)
      await api.maintenance.reportLineStop({
        line_number: Number(lineNumber),
        machine_name: machineName,
        failure_type: failureType,
        priority: "urgent",
        description,
        technician_phone: phone,
      })
      toast.success("🚨 هشدار توقف خط ثبت شد و پیامک فوری به تکنسین ارسال گردید.")
      setIsOpenStopModal(false)
      setMachineName("")
      setDescription("")
      loadData()
    } catch (err) {
      toast.error("خطا در ثبت توقف خط")
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<any>[] = [
    {
      header: "کد تیکت",
      accessorKey: "ticket_number",
      className: "w-32 font-mono text-xs font-bold text-slate-800",
    },
    {
      header: "خط تولید",
      cell: (row) => (
        <span className="font-bold text-xs px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800">
          خط شماره {row.line_number}
        </span>
      ),
      className: "w-28",
    },
    {
      header: "دستگاه / شرح خرابی",
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.machine_name}</span>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      header: "نوع خرابی",
      accessorKey: "failure_type",
      className: "w-36 text-xs text-slate-600",
    },
    {
      header: "تکنسین مسئول",
      cell: (row) => (
        <div className="text-xs">
          <span className="font-medium text-slate-800 block">{row.technician_assigned}</span>
          <span className="font-mono text-[11px] text-slate-400">{row.technician_phone}</span>
        </div>
      ),
      className: "w-44",
    },
    {
      header: "مدت توقف (دقیقه)",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          {row.downtime_minutes} دقیقه
        </span>
      ),
      className: "w-32 text-center",
    },
    {
      header: "وضعیت",
      cell: (row) => {
        const statusMap: Record<string, { label: string }> = {
          OPEN: { label: "توقف فعال (در انتظار)" },
          IN_PROGRESS: { label: "در حال تعمیر (PM)" },
          RESOLVED: { label: "رفع نقص و راه‌اندازی" },
          CLOSED: { label: "بسته شده" },
        }
        const st = statusMap[row.status] || { label: row.status }
        return <StatusBadge status={row.status} label={st.label} />
      },
      className: "w-40",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-rose-600" />
            <span>تعمیرات و نگهداری پیشگیرانه و توقف خطوط (PM)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            پایش لحظه‌ای خطوط تولید، اعزام فوری تکنسین، لاگ توقفات و شاخص MTTR
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsOpenStopModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/25 transition-all cursor-pointer animate-pulse hover:animate-none"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>اعلام فوری توقف خط</span>
          </button>
        </div>
      </div>

      {/* Line Health Quick Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.lines_health.map((line: any) => (
            <div
              key={line.line}
              className={`p-4 rounded-2xl border transition-all ${
                line.status === "DOWN"
                  ? "bg-rose-50/80 border-rose-300 shadow-md shadow-rose-100"
                  : "bg-white border-slate-200/80 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{line.label}</span>
                <span
                  className={`w-3 h-3 rounded-full ${
                    line.status === "DOWN" ? "bg-rose-600 animate-ping" : "bg-emerald-500"
                  }`}
                />
              </div>
              <div className="mt-2 text-[11px] font-semibold">
                {line.status === "DOWN" ? (
                  <span className="text-rose-700">🔴 متوقف - تکنسین در محل</span>
                ) : (
                  <span className="text-emerald-700">🟢 خط فعال و نرمال</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">میانگین زمان تعمیر (MTTR)</span>
              <span className="text-lg font-black text-slate-800 font-mono">
                {stats.mttr_minutes} دقیقه
              </span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">مجموع ساعات توقف تولید</span>
              <span className="text-lg font-black text-slate-800 font-mono">
                {stats.total_downtime_hours} ساعت
              </span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">توقف‌های در جریان</span>
              <span className="text-lg font-black text-rose-600 font-mono">
                {stats.active_line_stops} حادثه فعال
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <DataTable
        columns={columns}
        data={tickets}
        title="تاریخچه حوادث، توقفات و اقدامات اصلاحی PM"
        subtitle="اتصال به موتور تسک Plane و درگاه پیامک اضطراری"
      />

      {/* Emergency Report Modal */}
      <Modal
        isOpen={isOpenStopModal}
        onClose={() => setIsOpenStopModal(false)}
        title="اعلام فوری خرابی و توقف خط تولید"
        size="md"
      >
        <form onSubmit={handleReportLineStop} className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 leading-relaxed">
            ثبت این فرم بلافاصله وضعیت خط را به حالت <strong>توقف اضطراری</strong> تغییر داده و تسک اولویت فوری (Urgent) در سامانه Plane ایجاد می‌نماید.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">شماره خط تولید</label>
              <select
                value={lineNumber}
                onChange={(e) => setLineNumber(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-rose-500"
              >
                <option value={1}>خط ۱ - برش لیزر و پرس</option>
                <option value={2}>خط ۲ - هیدرولیک و قالب‌سازی</option>
                <option value={3}>خط ۳ - مونتاژ و روباتیک</option>
                <option value={4}>خط ۴ - رنگ و پخت کوره</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">نوع خرابی</label>
              <select
                value={failureType}
                onChange={(e) => setFailureType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-rose-500"
              >
                <option value="مکانیکی">مکانیکی (گیربکس، بلبرینگ، تسمه)</option>
                <option value="هیدرولیک/پنوماتیک">هیدرولیک / پنوماتیک (شیر برقی، نشتی)</option>
                <option value="برقی/الکترونیک">برقی / درایو و اتوماسیون PLC</option>
                <option value="نرم‌افزاری">نرم‌افزاری / کالیبراسیون سنسور</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نام دستگاه / ماشین‌آلات</label>
            <input
              type="text"
              required
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              placeholder="مثال: پرس هیدرولیک ۲۰۰ تن کوماتسو..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">شماره موبایل تکنسین کشیک جهت ارسال پیامک</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:bg-white focus:border-rose-500 text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">شرح دقیق واقعه و علائم خرابی</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="شرح صداهای غیرعادی، آلارم خطای روی نمایشگر، یا نشتی روغن..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-rose-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpenStopModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>ثبت توقف و اعزام تیم PM</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
