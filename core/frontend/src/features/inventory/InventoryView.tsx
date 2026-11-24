import React, { useEffect, useState } from "react"
import {
  Warehouse,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  History,
  FileSpreadsheet,
} from "lucide-react"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Modal } from "@/components/ui/Modal"
import { api } from "@/services/api"
import { toast } from "sonner"

export const InventoryView: React.FC = () => {
  const [parts, setParts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"catalog" | "history">("catalog")

  // Modals
  const [isStockInOpen, setIsStockInOpen] = useState(false)
  const [isStockOutOpen, setIsStockOutOpen] = useState(false)
  const [selectedPartId, setSelectedPartId] = useState("")
  const [quantity, setQuantity] = useState(10)
  const [notes, setNotes] = useState("")
  const [receiver, setReceiver] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      const [partsData, txData] = await Promise.all([
        api.inventory.listParts(),
        api.inventory.listTransactions(),
      ])
      setParts(partsData)
      setTransactions(txData)
      if (partsData.length > 0 && !selectedPartId) {
        setSelectedPartId(partsData[0].id)
      }
    } catch (err) {
      console.error(err)
      toast.error("خطا در بارگذاری اطلاعات انبار از موتور InvenTree")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.inventory.stockIn({
        part_id: selectedPartId,
        quantity: Number(quantity),
        receiver,
        notes,
      })
      toast.success("ورود کالا به انبار با موفقیت ثبت گردید.")
      setIsStockInOpen(false)
      setNotes("")
      loadData()
    } catch (err) {
      toast.error("خطا در ثبت ورود کالا")
    }
  }

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.inventory.stockOut({
        part_id: selectedPartId,
        quantity: Number(quantity),
        requester: receiver,
        notes,
      })
      toast.success("خروج و تحویل کالا از انبار ثبت گردید.")
      setIsStockOutOpen(false)
      setNotes("")
      loadData()
    } catch (err) {
      toast.error("خطا در ثبت خروج کالا")
    }
  }

  const partColumns: Column<any>[] = [
    {
      header: "کد کالا (IPN)",
      accessorKey: "IPN",
      className: "w-36 font-mono text-xs font-bold text-slate-700 text-center",
    },
    {
      header: "نام قطعه / تجهیز صنعتی",
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.name}</span>
          <p className="text-xs text-slate-500 mt-0.5">{row.description}</p>
        </div>
      ),
    },
    {
      header: "دسته‌بندی",
      accessorKey: "category_name",
      className: "w-44 text-slate-600 text-xs",
    },
    {
      header: "موجودی انبار",
      cell: (row) => {
        const isLow = row.total_in_stock <= row.minimum_stock
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`font-mono font-bold text-xs ${
                isLow ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              {row.total_in_stock} {row.units}
            </span>
            {isLow && (
              <span className="text-[10px] px-1.5 py-0.2 bg-rose-50 text-rose-600 border border-rose-200 rounded font-semibold">
                کسری
              </span>
            )}
          </div>
        )
      },
      className: "w-36",
    },
    {
      header: "حداقل موجودی",
      cell: (row) => (
        <span className="font-mono text-xs text-slate-500">
          {row.minimum_stock} {row.units}
        </span>
      ),
      className: "w-28 text-center",
    },
    {
      header: "محل نگهداری",
      accessorKey: "default_location",
      className: "w-40 text-xs text-slate-600",
    },
  ]

  const txColumns: Column<any>[] = [
    {
      header: "نوع سند",
      cell: (row) => <StatusBadge status={row.type} />,
      className: "w-32 text-center",
    },
    {
      header: "نام کالا / قطعه",
      accessorKey: "part_name",
      className: "font-semibold text-slate-800",
    },
    {
      header: "تعداد",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-slate-900">
          {row.quantity}
        </span>
      ),
      className: "w-24 text-center",
    },
    {
      header: "تحویل‌گیرنده / مسئول",
      accessorKey: "receiver",
      className: "w-44 text-xs text-slate-600",
    },
    {
      header: "شرح و شماره سفارش",
      accessorKey: "notes",
      className: "text-xs text-slate-500",
    },
    {
      header: "تاریخ و زمان",
      accessorKey: "timestamp",
      className: "w-36 text-center font-mono text-xs text-slate-400",
    },
  ]

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs card-interactive animate-slide-up flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#062434] text-white flex items-center justify-center shadow-xs">
              <Warehouse className="w-5 h-5 text-orange-400" />
            </span>
            <h1 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              انبار و کاردکس مکانیزه کالا و قطعات یدکی
            </h1>
            <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
              موتور InvenTree • فاز ۳
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            کاردکس لحظه‌ای کالا • ردیابی انبار پای کار و انبار مرکزی ملارد • اتصال خودکار به زنجیره خرید و تسک‌های Plane
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Switch */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "catalog" ? "bg-white text-orange-600 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>موجودی اقلام</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "history" ? "bg-white text-orange-600 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>کاردکس ورود و خروج</span>
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-colors cursor-pointer"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsStockInOpen(true)}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>رسید ورود کالا</span>
          </button>

          <button
            onClick={() => setIsStockOutOpen(true)}
            className="h-9 px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Minus className="w-4 h-4" />
            <span>حواله خروج کالا</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      {activeTab === "catalog" ? (
        <DataTable
          columns={partColumns}
          data={parts}
          title="فهرست اقلام و قطعات یدکی انبار مرکزی"
          subtitle="اتصال بلادرنگ به سرویس InvenTree"
          onExportExcel={() => api.exports.downloadInventoryExcel()}
        />
      ) : (
        <DataTable
          columns={txColumns}
          data={transactions}
          title="کاردکس گردش کالا و سوابق ورود / خروج"
          subtitle="لاگ اسناد انبارداری شرکت مکرر"
          onExportExcel={() => api.exports.downloadInventoryExcel()}
        />
      )}

      {/* STOCK IN MODAL */}
      <Modal
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        title="ثبت سند ورود کالا به انبار (Stock-In)"
        description="تعداد قطعات تحویل گرفته شده را جهت افزایش موجودی ثبت کنید."
      >
        <form onSubmit={handleStockIn} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">انتخاب قطعه</label>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-emerald-500"
            >
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.IPN} - {p.name} (موجودی فعلی: {p.total_in_stock} {p.units})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تعداد ورودی</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-center font-mono focus:outline-hidden focus:bg-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">انباردار / تحویل‌گیرنده</label>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">توضیحات و شماره سفارش خرید</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تحویل محموله سفارش PR-1405-1042..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStockInOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer"
            >
              ثبت ورود قطعه
            </button>
          </div>
        </form>
      </Modal>

      {/* STOCK OUT MODAL */}
      <Modal
        isOpen={isStockOutOpen}
        onClose={() => setIsStockOutOpen(false)}
        title="ثبت حواله خروج کالا از انبار (Stock-Out)"
        description="تعداد قطعات تحویل داده شده به خط تولید یا تعمیرات را ثبت کنید."
      >
        <form onSubmit={handleStockOut} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">انتخاب قطعه</label>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-amber-500"
            >
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.IPN} - {p.name} (موجودی فعلی: {p.total_in_stock} {p.units})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تعداد خروجی</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-center font-mono focus:outline-hidden focus:bg-white focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تحویل‌گیرنده / تکنسین</label>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="مهندس رضایی (تعمیرات خط ۲)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">علت خروج و محل مصرف</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تعویض اضطراری برای تسک تعمیر پمپ هیدرولیک..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-amber-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStockOutOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm cursor-pointer"
            >
              ثبت خروج قطعه
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
