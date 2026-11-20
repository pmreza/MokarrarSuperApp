import React, { useEffect, useState } from "react"
import {
  Truck,
  Plus,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Clock,
} from "lucide-react"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Modal } from "@/components/ui/Modal"
import { api } from "@/services/api"
import { toast } from "sonner"

export const GatePassView: React.FC = () => {
  const [passes, setPasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [passType, setPassType] = useState("TEMPORARY_OUT")
  const [destination, setDestination] = useState("")
  const [driverName, setDriverName] = useState("")
  const [vehiclePlate, setVehiclePlate] = useState("")
  const [itemName, setItemName] = useState("")
  const [itemQty, setItemQty] = useState(1)
  const [itemUnit] = useState("عدد")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // QR Modal
  const [selectedPassForQR, setSelectedPassForQR] = useState<any | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await api.gatepass.listPasses()
      setPasses(data)
    } catch (err) {
      console.error(err)
      toast.error("خطا در بارگذاری برگه‌های خروج کالا")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destination || !driverName || !itemName) {
      toast.error("لطفاً تمامی فیلدهای الزامی را تکمیل کنید.")
      return
    }
    try {
      setIsSubmitting(true)
      await api.gatepass.createPass({
        pass_type: passType,
        destination,
        driver_name: driverName,
        vehicle_plate: vehiclePlate || "فاقد خودرو",
        items: [{ item_name: itemName, quantity: Number(itemQty), unit: itemUnit }],
      })
      toast.success("برگه خروج کالا با موفقیت صادر و کد امنیتی QR اختصاص یافت.")
      setIsOpenModal(false)
      setDestination("")
      setDriverName("")
      setItemName("")
      loadData()
    } catch (err) {
      toast.error("خطا در صدور برگه خروج")
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<any>[] = [
    {
      header: "شماره برگه خروج",
      accessorKey: "gate_pass_number",
      className: "w-32 font-mono text-xs font-bold text-slate-800",
    },
    {
      header: "نوع خروج",
      cell: (row) => (
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
          {row.pass_type_label}
        </span>
      ),
      className: "w-40",
    },
    {
      header: "اقلام و بار خروجی",
      cell: (row) => (
        <div>
          {row.items?.map((it: any, i: number) => (
            <span key={i} className="text-xs font-bold text-slate-800 block">
              • {it.item_name} ({it.quantity} {it.unit})
            </span>
          ))}
          <span className="text-[11px] text-slate-400 block mt-0.5">مقصد: {row.destination}</span>
        </div>
      ),
    },
    {
      header: "راننده و پلاک خودرو",
      cell: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800 block">{row.driver_name}</span>
          <span className="font-mono text-[11px] text-slate-500">{row.vehicle_plate}</span>
        </div>
      ),
      className: "w-40",
    },
    {
      header: "تأیید حراست / گیت",
      cell: (row) => {
        if (row.security_checked) {
          return (
            <div className="text-xs text-emerald-700 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>خارج شد ({row.security_guard})</span>
            </div>
          )
        }
        return (
          <div className="text-xs text-amber-600 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>در انتظار خروج در گیت</span>
          </div>
        )
      },
      className: "w-44",
    },
    {
      header: "کد امنیتی QR",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedPassForQR(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>{row.qr_token}</span>
        </button>
      ),
      className: "w-36 text-center",
    },
    {
      header: "وضعیت",
      cell: (row) => (
        <StatusBadge
          status={row.status}
          label={row.status === "COMPLETED" ? "تکمیل و خروج" : "صادر شده"}
        />
      ),
      className: "w-28",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            <span>مجوز خروج کالا و برگه تردد کارخانه (Gate Pass)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            کنترل تردد حراست درب اصلی، ثبت پلاک خودرو و احراز اصالت با کد QR یکتا
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
            <span>صدور برگه خروج جدید</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={passes}
        title="فهرست برگه‌های تردد و خروج مواد و قطعات"
        subtitle="قابل استعلام از طریق بارکدخوان حراست و بات پیام‌رسان بله"
      />

      {/* Create Modal */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        title="صدور برگه خروج کالا از کارخانه"
        size="md"
      >
        <form onSubmit={handleCreatePass} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نوع مجوز خروج</label>
            <select
              value={passType}
              onChange={(e) => setPassType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500"
            >
              <option value="TEMPORARY_OUT">خروج موقت (تراشکاری، سنگ‌زنی یا تست آزمایشگاهی خارج کارخانه)</option>
              <option value="MATERIAL_OUT">خروج قطعی کالا (فروش نهایی به مشتری / تحویل)</option>
              <option value="SCRAP">خروج ضایعات فلزی و پلیسه</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">نام راننده / حامل بار</label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="مثال: اصغر محمدی"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">پلاک خودرو / وانت</label>
              <input
                type="text"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="مثال: ۶۸ ب ۴۵۲ - ایران ۲۱"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">مقصد / نام کارگاه پیمانکار</label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="مثال: کارگاه تراشکاری دقیق نوین - شهرک صنعتی شمس‌آباد..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">شرح اقلام</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="مثال: شافت اصلی پمپ وکیوم"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تعداد</label>
              <input
                type="number"
                min="1"
                required
                value={itemQty}
                onChange={(e) => setItemQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center font-mono focus:outline-hidden focus:bg-white focus:border-indigo-500"
              />
            </div>
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
              <span>تولید و صدور گیت‌پاس</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Presentation Modal */}
      {selectedPassForQR && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPassForQR(null)}
          title={`کد امنیتی گیت‌پاس ${selectedPassForQR.gate_pass_number}`}
          size="sm"
        >
          <div className="text-center space-y-4 py-2">
            <div className="w-48 h-48 mx-auto p-4 bg-white border-2 border-slate-900 rounded-2xl flex flex-col items-center justify-center shadow-lg">
              <QrCode className="w-32 h-32 text-slate-900" />
              <span className="font-mono font-black text-xs tracking-wider text-slate-800 mt-2">
                {selectedPassForQR.qr_token}
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">{selectedPassForQR.driver_name}</p>
              <p className="font-mono text-slate-500">{selectedPassForQR.vehicle_plate}</p>
              <p className="text-[11px] text-slate-400">
                این بارکد را در گیت حراست درب اصلی به مسئول حراست نشان دهید.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPassForQR(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              بستن
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
