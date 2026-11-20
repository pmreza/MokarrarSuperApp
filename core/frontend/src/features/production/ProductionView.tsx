import React, { useEffect, useState } from "react"
import {
  Factory,
  Plus,
  RefreshCw,
  TrendingUp,
  AlertOctagon,
  Percent,
} from "lucide-react"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Modal } from "@/components/ui/Modal"
import { api } from "@/services/api"
import { toast } from "sonner"

export const ProductionView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [summary, setSummary] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Shift Modal
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [shiftType, setShiftType] = useState("صبح (۰۷:۰۰ - ۱۵:۰۰)")
  const [lineNumber, setLineNumber] = useState(1)
  const [productName, setProductName] = useState("")
  const [targetQty, setTargetQty] = useState(100)
  const [actualQty, setActualQty] = useState(95)
  const [scrapQty, setScrapQty] = useState(2)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [logsData, sumData] = await Promise.all([
        api.production.listLogs(),
        api.production.getSummary(),
      ])
      setLogs(logsData)
      setSummary(sumData)
    } catch (err) {
      console.error(err)
      toast.error("خطا در دریافت اطلاعات خط تولید و شیفت‌ها")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName) {
      toast.error("لطفاً نام محصول تولیدی را وارد کنید.")
      return
    }
    try {
      setIsSubmitting(true)
      await api.production.createLog({
        shift_type: shiftType,
        line_number: Number(lineNumber),
        product_name: productName,
        target_quantity: Number(targetQty),
        actual_quantity: Number(actualQty),
        scrap_quantity: Number(scrapQty),
        notes,
      })
      toast.success("گزارش شیفت تولید با موفقیت ثبت گردید.")
      setIsOpenModal(false)
      setProductName("")
      setNotes("")
      loadData()
    } catch (err) {
      toast.error("خطا در ثبت گزارش شیفت")
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<any>[] = [
    {
      header: "تاریخ / شیفت",
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-slate-800 block">{row.date}</span>
          <span className="text-[11px] text-slate-500">{row.shift_type}</span>
        </div>
      ),
      className: "w-36",
    },
    {
      header: "خط",
      cell: (row) => (
        <span className="font-bold text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700">
          خط {row.line_number}
        </span>
      ),
      className: "w-20 text-center",
    },
    {
      header: "محصول تولیدی / قطعه",
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900 block">{row.product_name}</span>
          <p className="text-xs text-slate-400 mt-0.5">{row.supervisor}</p>
        </div>
      ),
    },
    {
      header: "تارگت شیفت",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-600">
          {row.target_quantity} عدد
        </span>
      ),
      className: "w-28 text-center",
    },
    {
      header: "تولید واقعی",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {row.actual_quantity} عدد
        </span>
      ),
      className: "w-28 text-center",
    },
    {
      header: "ضایعات (Scrap)",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          {row.scrap_quantity} عدد
        </span>
      ),
      className: "w-28 text-center",
    },
    {
      header: "راندمان خط (%)",
      cell: (row) => {
        const isGood = row.efficiency_rate >= 90
        return (
          <span
            className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
              isGood ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {row.efficiency_rate}%
          </span>
        )
      },
      className: "w-28 text-center",
    },
    {
      header: "وضعیت",
      cell: (row) => {
        const isApproved = row.status === "APPROVED"
        return (
          <StatusBadge
            status={row.status}
            label={isApproved ? "تایید شده" : "نیازمند بررسی"}
          />
        )
      },
      className: "w-32",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Factory className="w-5 h-5 text-indigo-600" />
            <span>مدیریت تولید، گزارشات شیفت و کنترل ضایعات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            پایش خروجی روزانه سالن‌های تولید، محاسبه راندمان شیفت و اتصال به موجودی انبار
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsOpenModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت گزارش کارکرد شیفت</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">مجموع کل قطعات تولیدی</span>
              <span className="text-lg font-black text-slate-800 font-mono">
                {summary.total_produced_units.toLocaleString()} عدد
              </span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">میانگین راندمان خطوط</span>
              <span className="text-lg font-black text-emerald-700 font-mono">
                {summary.average_efficiency}%
              </span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">نرخ کل ضایعات (Scrap Rate)</span>
              <span className="text-lg font-black text-rose-600 font-mono">
                {summary.scrap_rate_percentage}%
              </span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">تعداد شیفت‌های ثبت‌شده</span>
              <span className="text-lg font-black text-slate-800 font-mono">
                {summary.recorded_shifts_count} شیفت
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={logs}
        title="دفتر ثبت کارکرد روزانه شیفت‌های تولید"
        subtitle="محاسبه خودکار درصد انحراف از برنامه تولید کارخانه"
      />

      {/* Modal */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title="ثبت گزارش کارکرد شیفت تولید"
        size="md"
      >
        <form onSubmit={handleCreateLog} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">نوبت شیفت</label>
              <select
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500"
              >
                <option value="صبح (۰۷:۰۰ - ۱۵:۰۰)">صبح (۰۷:۰۰ - ۱۵:۰۰)</option>
                <option value="عصر (۱۵:۰۰ - ۲۳:۰۰)">عصر (۱۵:۰۰ - ۲۳:۰۰)</option>
                <option value="شب (۲۳:۰۰ - ۰۷:۰۰)">شب (۲۳:۰۰ - ۰۷:۰۰)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">خط تولید</label>
              <select
                value={lineNumber}
                onChange={(e) => setLineNumber(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500"
              >
                <option value={1}>خط ۱ - برش لیزر و پرس</option>
                <option value={2}>خط ۲ - هیدرولیک و ماشین‌کاری</option>
                <option value={3}>خط ۳ - مونتاژ نهایی</option>
                <option value={4}>خط ۴ - خط رنگ و بسته‌بندی</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نام محصول یا قطعه خروجی</label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="مثال: شاسی فلزی تقویت‌شده دستگاه پرس..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تارگت شیفت</label>
              <input
                type="number"
                min="1"
                required
                value={targetQty}
                onChange={(e) => setTargetQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono focus:outline-hidden focus:bg-white focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تولید سالم</label>
              <input
                type="number"
                min="0"
                required
                value={actualQty}
                onChange={(e) => setActualQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono focus:outline-hidden focus:bg-white focus:border-indigo-500 font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ضایعات (Scrap)</label>
              <input
                type="number"
                min="0"
                required
                value={scrapQty}
                onChange={(e) => setScrapQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono focus:outline-hidden focus:bg-white focus:border-indigo-500 font-bold text-rose-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">توضیحات و توقفات شیفت</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="دلایل تاخیر یا توضیحات فنی..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpenModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>ثبت گزارش شیفت</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
