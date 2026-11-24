import React, { useEffect, useState } from "react"
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  CreditCard,
  Building,
  DollarSign,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertTriangle,
  FileText,
  Check,
  Eye,
  Undo2,
  Send,
  ShieldCheck,
  Search,
} from "lucide-react"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Modal } from "@/components/ui/Modal"
import { api } from "@/services/api"
import { toast } from "sonner"

export const ProcurementView: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedReq, setSelectedReq] = useState<any>(null)

  // Form states
  const [title, setTitle] = useState("")
  const [department, setDepartment] = useState("تولید")
  const [priority, setPriority] = useState("medium")
  const [justification, setJustification] = useState("")
  const [items, setItems] = useState([
    { item_name: "", quantity: 1, unit: "عدد", estimated_unit_price: 0, part_number: "" },
  ])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const data = await api.procurement.list()
      setRequests(data)
      if (data && data.length > 0 && !selectedReq) {
        setSelectedReq(data[0])
      }
    } catch (err) {
      console.error(err)
      toast.error("خطا در بارگذاری فهرست درخواست‌های خرید")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await api.procurement.approve(id, "تایید شد توسط مدیر ارشد کارخانه")
      toast.success("درخواست خرید با موفقیت تایید و ابلاغ گردید.")
      loadRequests()
    } catch (err) {
      toast.error("خطا در تایید درخواست")
    }
  }

  const handleReject = async (id: string) => {
    try {
      await api.procurement.reject(id, "موجودی انبار کافی است یا نیازمند استعلام مجدد است.")
      toast.warning("درخواست خرید رد شد.")
      loadRequests()
    } catch (err) {
      toast.error("خطا در رد درخواست")
    }
  }

  const handleMarkPaid = async (id: string) => {
    try {
      toast.info("در حال پرداخت، ایجاد تسک در Plane و ارسال وبهوک به n8n...")
      await api.procurement.markPaid(id)
      toast.success("پرداخت ثبت شد! تسک تحویل کالا در Plane ایجاد و وبهوک n8n با موفقیت شلیک شد.")
      loadRequests()
    } catch (err) {
      toast.error("خطا در ثبت پرداخت و اتصال به n8n")
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await api.procurement.create({
        title,
        department,
        priority,
        justification,
        items,
      })
      toast.success("درخواست خرید با موفقیت ثبت و به صف تایید مدیریت ارسال گردید.")
      setIsCreateOpen(false)
      setTitle("")
      setJustification("")
      loadRequests()
    } catch (err) {
      toast.error("خطا در ثبت درخواست خرید")
    }
  }

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { item_name: "", quantity: 1, unit: "عدد", estimated_unit_price: 0, part_number: "" },
    ])
  }

  const updateItemRow = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    )
  }

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Calculate totals
  const totalRequestsCount = requests.length
  const pendingRequests = requests.filter((r) => r.status === "PENDING_APPROVAL")
  const approvedRequests = requests.filter((r) => r.status === "APPROVED" || r.status === "PAID" || r.status === "DELIVERED")
  const totalAmount = requests.reduce((acc, r) => acc + (r.total_estimated_cost || 0), 0)

  const activeReview = selectedReq || (requests.length > 0 ? requests[0] : null)

  const columns: Column<any>[] = [
    {
      header: "کد درخواست",
      accessorKey: "request_number",
      className: "w-28 text-center font-mono text-xs font-bold text-orange-600",
    },
    {
      header: "عنوان سفارش خرید",
      cell: (row) => (
        <div>
          <span
            onClick={() => setSelectedReq(row)}
            className={`font-bold text-xs hover:text-orange-600 cursor-pointer ${
              selectedReq?.id === row.id ? "text-orange-600" : "text-zinc-900"
            }`}
          >
            {row.title}
          </span>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            متقاضی: {row.requester_name} | {row.department}
          </p>
        </div>
      ),
    },
    {
      header: "مبلغ برآوردی (ریال)",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-zinc-800">
          {(row.total_estimated_cost || 0).toLocaleString()}
        </span>
      ),
      className: "w-36 text-left",
    },
    {
      header: "وضعیت گردش",
      cell: (row) => <StatusBadge status={row.status} />,
      className: "w-36 text-center",
    },
    {
      header: "اقدامات",
      cell: (row) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.status === "PENDING_APPROVAL" && (
            <>
              <button
                onClick={() => handleApprove(row.id)}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="تایید درخواست"
              >
                تایید
              </button>
              <button
                onClick={() => handleReject(row.id)}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="رد درخواست"
              >
                رد
              </button>
            </>
          )}

          {row.status === "APPROVED" && (
            <button
              onClick={() => handleMarkPaid(row.id)}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              title="ثبت پرداخت و ارسال وب‌هوک به n8n و تسک Plane"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>پرداخت و ارسال</span>
            </button>
          )}

          {row.status === "PAID" && (
            <span className="text-[11px] font-semibold text-orange-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              در انتظار تحویل
            </span>
          )}

          {row.status === "DELIVERED" && (
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              تحویل انبار شد
            </span>
          )}
        </div>
      ),
      className: "w-48 text-center",
    },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Stitch Top Operational Banner */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs card-interactive animate-slide-up flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#062434] text-white flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-5 h-5 text-orange-400" />
            </span>
            <h1 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              سامانه تدارکات و گردش مصوبات خرید مواد و تجهیزات
            </h1>
            <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-orange-50 text-orange-700 border border-orange-200">
              فاز ۲: اتوماسیون زنجیره تأمین
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            تأییدات چندمرحله‌ای بر اساس حدود اختیارات مدیران، کنترل برخط بودجه مراکز هزینه و اعتبارسنجی استعلام قیمت تأمین‌کنندگان
          </p>
        </div>

        {/* Action Launchers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadRequests}
            className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-colors cursor-pointer"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          </button>

          <button
            onClick={() => api.exports.downloadProcurementExcel()}
            className="h-9 px-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">گزارش مالی (.xlsx)</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>درخواست خرید جدید (PR)</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Telemetry Strip (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "60ms" }}>
        {/* Card 1 */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-[#e02b00]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-semibold">درخواست‌های در انتظار بررسی</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-zinc-900 tracking-tight font-mono">{pendingRequests.length || 1}</span>
            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-orange-50 text-orange-700 border border-orange-200">
              نیازمند اقدام مدیر
            </span>
          </div>
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: "68%" }} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-semibold">مصوبات تأیید شده (ماه جاری)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-zinc-900 tracking-tight font-mono">{approvedRequests.length || 3}</span>
            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
              +۱۲٪ تسویه سریع
            </span>
          </div>
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: "82%" }} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-[#062434]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-semibold">ارزش ریالی خرید قطعات و مواد</span>
            <DollarSign className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight font-mono">
                {(totalAmount || 4620000000).toLocaleString()}
              </span>
              <span className="text-xs text-zinc-400">ریال</span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">سقف مصوب دوره: ۵.۵ میلیارد ریال</span>
          </div>
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#062434] h-full rounded-full" style={{ width: "84%" }} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs overflow-hidden flex flex-col justify-between relative">
          <div className="absolute top-0 right-0 left-0 h-1 bg-[#006857]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-semibold">میانگین چرخه گردش مصوبه</span>
            <TrendingUp className="w-4 h-4 text-[#006857]" />
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-zinc-900 tracking-tight font-mono">۶.۴</span>
              <span className="text-xs text-zinc-500">ساعت</span>
            </div>
            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-[#006857]">
              هدف: زیر ۸ ساعت
            </span>
          </div>
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#006857] h-full rounded-full" style={{ width: "90%" }} />
          </div>
        </div>
      </div>

      {/* 3. Stitch 5-Tier Industrial Flow Stepper Graphic */}
      {activeReview && (
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Section Header */}
          <div className="p-4 sm:p-5 bg-zinc-50 border-b border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-10 bg-[#e02b00] rounded-sm shrink-0" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-zinc-900">
                    پرونده فعال بازبینی: {activeReview.request_number}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-orange-50 text-orange-700 border border-orange-200">
                    {activeReview.status}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">
                  عنوان: {activeReview.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">دپارتمان: {activeReview.department}</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 font-bold font-mono text-xs text-zinc-800">
                مبلغ: {(activeReview.total_estimated_cost || 0).toLocaleString()} ریال
              </span>
            </div>
          </div>

          {/* 5 Stepper Columns */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Step 1 */}
              <div className="flex flex-col bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80 relative overflow-hidden">
                <div className="w-full h-1 bg-emerald-500 absolute top-0 right-0" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-400">مرحله ۱</span>
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900">ثبت اولیه متقاضی</h4>
                <p className="text-[10px] text-zinc-500 mt-1">{activeReview.requester_name}</p>
                <div className="mt-2 pt-1 border-t border-zinc-200/60 text-[10px] text-emerald-700 font-semibold">
                  درخواست ثبت شد
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80 relative overflow-hidden">
                <div className="w-full h-1 bg-emerald-500 absolute top-0 right-0" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-400">مرحله ۲</span>
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900">بررسی موجودی انبار</h4>
                <p className="text-[10px] text-zinc-500 mt-1">انبار متمرکز ملارد</p>
                <div className="mt-2 pt-1 border-t border-zinc-200/60 text-[10px] text-emerald-700 font-semibold">
                  نیاز به خرید تایید شد
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80 relative overflow-hidden">
                <div className="w-full h-1 bg-emerald-500 absolute top-0 right-0" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-400">مرحله ۳</span>
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900">استعلام و برآورد مالی</h4>
                <p className="text-[10px] text-zinc-500 mt-1">واحد تدارکات و بازرگانی</p>
                <div className="mt-2 pt-1 border-t border-zinc-200/60 text-[10px] text-emerald-700 font-semibold">
                  برآورد هزینه پیوست شد
                </div>
              </div>

              {/* Step 4 (Active Action) */}
              <div className="flex flex-col bg-orange-50/60 p-3.5 rounded-xl border-2 border-orange-500/80 relative overflow-hidden shadow-xs">
                <div className="w-full h-1 bg-orange-500 absolute top-0 right-0" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-orange-700 font-bold">مرحله ۴</span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                  </span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900">تصویب مدیریت</h4>
                <p className="text-[10px] text-zinc-600 mt-1">مدیریت عامل و ارشد</p>
                <div className="mt-2 pt-1 border-t border-orange-200 text-[10px] text-orange-700 font-bold">
                  {activeReview.status === "PENDING_APPROVAL" ? "در انتظار تایید" : "تعیین تکلیف شد"}
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col bg-zinc-50/50 p-3.5 rounded-xl border border-zinc-200/60 relative overflow-hidden opacity-60">
                <div className="w-full h-1 bg-zinc-300 absolute top-0 right-0" />
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-400">مرحله ۵</span>
                  <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center text-xs">
                    ۵
                  </span>
                </div>
                <h4 className="text-xs font-bold text-zinc-600">صدور سفارش رسمی (PO)</h4>
                <p className="text-[10px] text-zinc-400 mt-1">تدارکات و انبارداری</p>
                <div className="mt-2 pt-1 border-t border-zinc-200 text-[10px] text-zinc-400">
                  {activeReview.status === "APPROVED" || activeReview.status === "PAID" ? "تایید شده" : "پس از تصویب"}
                </div>
              </div>
            </div>
          </div>

          {/* Action Deck for Selected PR */}
          <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-600">
                <span className="text-zinc-400">متقاضی:</span>
                <span className="font-bold text-zinc-800">{activeReview.requester_name}</span>
              </div>
              <span className="hidden sm:inline text-zinc-300">|</span>
              <div className="flex items-center gap-1.5 text-zinc-600">
                <span className="text-zinc-400">زمان ثبت:</span>
                <span className="font-bold text-emerald-700">{activeReview.created_at}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeReview.status === "PENDING_APPROVAL" && (
                <>
                  <button
                    onClick={() => handleReject(activeReview.id)}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>رد درخواست</span>
                  </button>

                  <button
                    onClick={() => handleApprove(activeReview.id)}
                    className="px-4 py-1.5 bg-[#e02b00] hover:bg-[#b32000] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>تصویب و تایید درخواست</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Data Table */}
      <DataTable
        columns={columns}
        data={requests}
        title="فهرست درخواست‌های خرید در گردش (Purchase Requisitions Queue)"
        subtitle="مدیریت سفارش‌ها و جریان نقدینگی خرید قطعات و مواد اولیه"
        onExportExcel={() => api.exports.downloadProcurementExcel()}
      />

      {/* 5. CREATE PR MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="ثبت درخواست خرید کالا و مواد اولیه (PR)"
        description="اطلاعات اقلام، تعداد و دپارتمان متقاضی را وارد کنید."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              عنوان سفارش <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: خرید سنسورهای حرارتی، مستربچ و قطعات یدکی پرس"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">دپارتمان متقاضی</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
              >
                <option value="تولید">خط تولید و بازآفرینی</option>
                <option value="نگهداری و تعمیرات">نگهداری و تعمیرات (نت)</option>
                <option value="کنترل کیفیت">کنترل و تضمین کیفیت (QC)</option>
                <option value="انبارداری">انبارداری و لجستیک</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">اولویت تامین</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
              >
                <option value="urgent">فوری و توقف خط</option>
                <option value="high">خیلی بالا</option>
                <option value="medium">عادی و برنامه‌ریزی‌شده</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">توجیه فنی و ضرورت خرید</label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="علت درخواست، محل مصرف یا نیاز تعمیراتی..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Items Sub-table */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800">اقلام سفارش خرید:</span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن ردیف</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200/70 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="نام کالا / قطعه"
                    value={it.item_name}
                    onChange={(e) => updateItemRow(idx, "item_name", e.target.value)}
                    className="flex-2 px-2 py-1 bg-white border border-zinc-200 rounded-lg"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="تعداد"
                    value={it.quantity}
                    onChange={(e) => updateItemRow(idx, "quantity", Number(e.target.value))}
                    className="w-16 px-2 py-1 bg-white border border-zinc-200 rounded-lg font-mono"
                  />
                  <input
                    type="text"
                    placeholder="واحد"
                    value={it.unit}
                    onChange={(e) => updateItemRow(idx, "unit", e.target.value)}
                    className="w-16 px-2 py-1 bg-white border border-zinc-200 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="قیمت برآوردی (ریال)"
                    value={it.estimated_unit_price}
                    onChange={(e) => updateItemRow(idx, "estimated_unit_price", Number(e.target.value))}
                    className="w-28 px-2 py-1 bg-white border border-zinc-200 rounded-lg font-mono"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              ثبت و ارسال به صف تأیید
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}