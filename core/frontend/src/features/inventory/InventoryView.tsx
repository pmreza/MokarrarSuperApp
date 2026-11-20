import React, { useEffect, useState } from "react"
import {
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  Package,
  History,
  QrCode,
  Search,
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
  const [selectedPartId, setSelectedPartId] = useState("")
  const [quantity, setQuantity] = useState(10)
  const [notes, setNotes] = useState("")
  const [receiver, setReceiver] = useState("حمید حسینی (انباردار)")

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">انبارداری و کنترل موجودی قطعات (Phase 3)</h2>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md font-mono">
              InvenTree Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            کاردکس کالا • ردیابی شماره بچ و انبارش • ورود خودکار پس از تحویل تسک‌های خرید
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tab Switch */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "catalog" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>موجودی اقلام</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "history" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>کاردکس ورود و خروج</span>
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>رسید ورود کالا</span>
          </button>

          <button
            onClick={() => setIsStockOutOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
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
    </div>
  )
}
