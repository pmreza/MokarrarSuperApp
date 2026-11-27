import React, { useEffect, useState } from "react"
import {
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  Package,
  History,
  Warehouse,
  QrCode,
  Search,
  FileSpreadsheet,
  FileJson,
  Upload,
  Copy,
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
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scanInput, setScanInput] = useState("")
  const [scanResult, setScanResult] = useState<any | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importJsonText, setImportJsonText] = useState("")
  const [importing, setImporting] = useState(false)
  const [selectedPartId, setSelectedPartId] = useState("")

  const SUGGESTED_JSON_TEMPLATE = JSON.stringify(
    {
      items: [
        {
          IPN: "MOK-BRG-6205",
          name: "بلبرینگ شیار عمیق SKF 6205",
          category_name: "قطعات مکانیکی",
          total_in_stock: 24,
          minimum_stock: 6,
          unit: "عدد",
          location: "انبار ماهشهر - قفسه B2",
        },
        {
          IPN: "MOK-OIL-46",
          name: "روغن هیدرولیک صنعتی ISO 46",
          category_name: "روان‌کارها",
          total_in_stock: 180,
          minimum_stock: 40,
          unit: "لیتر",
          location: "انبار قزوین - مخزن ۱",
        },
      ],
    },
    null,
    2
  )
  const [quantity, setQuantity] = useState(10)
  const [notes, setNotes] = useState("")
  const [receiver, setReceiver] = useState("")

  const handleScanLookup = async (codeToSearch?: string) => {
    const code = (codeToSearch || scanInput).trim()
    if (!code) {
      toast.error("لطفاً بارکد یا کد قطعه را وارد نمایید")
      return
    }
    try {
      setIsScanning(true)
      const res = await api.inventory.scan(code)
      setScanResult(res)
      if (res.found) {
        toast.success(res.message)
      } else {
        toast.warning(res.message)
      }
    } catch (err) {
      toast.error("خطا در استعلام بارکد")
    } finally {
      setIsScanning(false)
    }
  }

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

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SUGGESTED_JSON_TEMPLATE)
    toast.success("الگوی پیشنهادی JSON در حافظه کپی شد.")
  }

  const handleImportJson = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setImporting(true)
      const parsed = JSON.parse(importJsonText || SUGGESTED_JSON_TEMPLATE)
      const items = Array.isArray(parsed) ? parsed : parsed.items
      if (!Array.isArray(items) || items.length === 0) {
        toast.error("فرمت JSON باید شامل آرایه‌ای از اقلام یا کلید items باشد.")
        return
      }
      const res = await api.inventory.importParts(items)
      toast.success(
        `ایمپورت با موفقیت انجام شد: ${res.imported_count} قلم جدید، ${res.updated_count} قلم بروزرسانی.`
      )
      setIsImportOpen(false)
      setImportJsonText("")
      loadData()
    } catch (err: any) {
      toast.error(err instanceof SyntaxError ? "ساختار JSON واردشده معتبر نیست." : "خطا در ایمپورت اطلاعات انبار")
    } finally {
      setImporting(false)
    }
  }

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImportJsonText(String(ev.target?.result || ""))
    }
    reader.readAsText(file)
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
            onClick={() => {
              if (!importJsonText) setImportJsonText(SUGGESTED_JSON_TEMPLATE)
              setIsImportOpen(true)
            }}
            className="h-9 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-orange-600" />
            <span>ایمپورت و راهنمای JSON</span>
          </button>

          <button
            onClick={() => {
              setScanResult(null)
              setScanInput("")
              setIsScannerOpen(true)
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>اسکن بارکد / QR</span>
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

      {/* Barcode / QR Scanner Modal */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="اسکنر هوشمند بارکد و کد QR قطعات انبار"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-3">
            <QrCode className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-indigo-900 block mb-0.5">اسکن سریع انبارداری</span>
              بارکد یا کد QR روی جعبه قطعه را با بارکدخوان بخوانید یا کد فنی را دستی تایپ کنید تا موجودی لحظه‌ای و محل دقیق قفسه نمایش داده شود.
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScanLookup()}
                placeholder="مثال: MOK-BLT-8M1200 یا part-101..."
                className="w-full pl-3 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:bg-white focus:border-indigo-500"
                autoFocus
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={() => handleScanLookup()}
              disabled={isScanning}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>استعلام</span>
              )}
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400">کدهای نمونه:</span>
            {["MOK-BLT-8M1200", "MOK-SEN-M18", "MOK-HYD-SEAL200", "part-101"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setScanInput(chip)
                  handleScanLookup(chip)
                }}
                className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-md border border-slate-200 transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Scan result display */}
          {scanResult && (
            <div
              className={`p-4 rounded-xl border transition-all ${
                scanResult.found
                  ? "bg-slate-50/80 border-slate-200"
                  : "bg-rose-50/60 border-rose-200 text-rose-800"
              }`}
            >
              {scanResult.found ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {scanResult.part.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        کد فنی: <span className="font-mono font-bold text-slate-700">{scanResult.part.IPN}</span> | دسته‌بندی: {scanResult.part.category_name}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        scanResult.is_low_stock
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {scanResult.part.total_in_stock} {scanResult.part.units} موجود
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-lg border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">موقعیت در انبار:</span>
                      <span className="font-semibold text-slate-700">{scanResult.part.default_location}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">حد نصاب نقطه سفارش:</span>
                      <span className="font-mono text-slate-700">{scanResult.part.minimum_stock} {scanResult.part.units}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPartId(scanResult.part.id)
                        setIsScannerOpen(false)
                        setIsStockInOpen(true)
                      }}
                      className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ثبت رسید ورود</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPartId(scanResult.part.id)
                        setIsScannerOpen(false)
                        setIsStockOutOpen(true)
                      }}
                      className="flex-1 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>ثبت حواله خروج</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{scanResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* JSON IMPORT & DOCUMENTATION MODAL */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="مستندات و ایمپورت گروهی انبار (JSON)"
        maxWidth="lg"
      >
        <form onSubmit={handleImportJson} className="space-y-4 text-right" dir="rtl">
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">راهنمای ساختار پیشنهادی JSON برای آپدیت و ورود کالا:</span>
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>کپی الگو</span>
              </button>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              هر قلم بر اساس کد یکتای <code className="font-mono font-bold">IPN</code> بررسی می‌شود؛ اگر کد قبلاً موجود باشد موجودی آن بروزرسانی و در غیر این صورت به‌عنوان کالای جدید ثبت می‌گردد.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700">محتوای JSON یا انتخاب فایل:</label>
            <label className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-semibold text-zinc-700 flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-orange-600" />
              <span>انتخاب فایل JSON.</span>
              <input type="file" accept=".json,application/json" onChange={handleJsonFileUpload} className="hidden" />
            </label>
          </div>

          <textarea
            rows={10}
            dir="ltr"
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            className="w-full p-3 text-xs font-mono bg-zinc-950 text-emerald-300 border border-zinc-800 rounded-xl focus:outline-hidden"
          />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsImportOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={importing}
              className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm cursor-pointer"
            >
              {importing ? "در حال ایمپورت..." : "ایمپورت و بروزرسانی انبار"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
