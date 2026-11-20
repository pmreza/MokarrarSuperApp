import React, { useEffect, useState } from "react"
import {
  Plus,
  RefreshCw,
  CheckCircle2,
  CreditCard,
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
  const [priority, setPriority] = useState("high")
  const [justification, setJustification] = useState("")
  const [items, setItems] = useState([
    { item_name: "بلبرینگ دور بالا SKF", quantity: 5, unit: "عدد", estimated_unit_price: 2500000, part_number: "MOK-BRG-6205" },
  ])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const data = await api.procurement.list()
      setRequests(data)
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
      await api.procurement.approve(id, "تایید شد توسط مدیر")
      toast.success("درخواست خرید با موفقیت تایید گردید.")
      loadRequests()
      if (selectedReq?.id === id) setSelectedReq(null)
    } catch (err) {
      toast.error("خطا در تایید درخواست")
    }
  }

  const handleReject = async (id: string) => {
    try {
      await api.procurement.reject(id, "موجودی انبار کافی است.")
      toast.warning("درخواست خرید رد شد.")
      loadRequests()
      if (selectedReq?.id === id) setSelectedReq(null)
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
      if (selectedReq?.id === id) setSelectedReq(null)
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

  const columns: Column<any>[] = [
    {
      header: "شماره درخواست",
      accessorKey: "request_number",
      className: "w-32 text-center font-mono text-xs font-bold text-blue-700",
    },
    {
      header: "عنوان سفارش خرید",
      cell: (row) => (
        <div>
          <span
            onClick={() => setSelectedReq(row)}
            className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
          >
            {row.title}
          </span>
          <p className="text-xs text-slate-500 mt-0.5">
            متقاضی: {row.requester_name} | {row.department}
          </p>
        </div>
      ),
    },
    {
      header: "مبلغ برآوردی (ریال)",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          {(row.total_estimated_cost || 0).toLocaleString()}
        </span>
      ),
      className: "w-40 text-left",
    },
    {
      header: "وضعیت تایید",
      cell: (row) => <StatusBadge status={row.status} />,
      className: "w-36 text-center",
    },
    {
      header: "عملیات گردش‌کار",
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
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              title="ثبت پرداخت و ارسال وب‌هوک به n8n و تسک Plane"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>پرداخت و ارسال خودکار</span>
            </button>
          )}

          {row.status === "PAID" && (
            <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              در انتظار تحویل
            </span>
          )}

          {row.status === "DELIVERED" && (
            <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              تحویل انبار شد
            </span>
          )}
        </div>
      ),
      className: "w-52 text-center",
    },
  ]

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">گردش کار تدارکات و خرید (Phase 2)</h2>
            <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded-md">
              اتوماسیون چندمرحله‌ای
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            تایید مدیران • اتصال رویداد محور به n8n • صدور خودکار تسک تحویل کالا در Plane
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadRequests}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت درخواست خرید جدید</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={requests}
        title="فهرست درخواست‌های خرید و مجوزهای مالی"
        subtitle="مدیریت سفارش‌ها و جریان نقدینگی خرید قطعات"
        onExportExcel={() => api.exports.downloadProcurementExcel()}
      />

      {/* CREATE PR MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="ثبت درخواست خرید کالا و قطعات (PR)"
        description="اطلاعات اقلام، تعداد و دپارتمان متقاضی را وارد کنید."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              عنوان سفارش <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: خرید سنسورهای حرارتی و قطعات یدکی پرس"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">دپارتمان متقاضی</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-purple-500"
              >
                <option value="تولید">خط تولید</option>
                <option value="نگهداری و تعمیرات">نگهداری و تعمیرات (نت)</option>
                <option value="کنترل کیفیت">کنترل و تضمین کیفیت</option>
                <option value="انبارداری">انبارداری و لجستیک</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اولویت تامین</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-purple-500"
              >
                <option value="urgent">فوری و توقف خط</option>
                <option value="high">بالا</option>
                <option value="medium">عادی و برنامه‌ریزی‌شده</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">توجیه فنی و ضرورت خرید</label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="علت درخواست، محل مصرف یا نیاز تعمیراتی..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-purple-500"
            />
          </div>

          {/* Items Sub-table */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">اقلام سفارش خرید:</span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن ردیف</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="نام کالا / قطعه"
                    value={it.item_name}
                    onChange={(e) => updateItemRow(idx, "item_name", e.target.value)}
                    className="flex-2 px-2 py-1 bg-white border border-slate-200 rounded-md"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="تعداد"
                    value={it.quantity}
                    onChange={(e) => updateItemRow(idx, "quantity", Number(e.target.value))}
                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-md text-center font-mono"
                  />
                  <input
                    type="text"
                    placeholder="واحد"
                    value={it.unit}
                    onChange={(e) => updateItemRow(idx, "unit", e.target.value)}
                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-md text-center"
                  />
                  <input
                    type="number"
                    placeholder="قیمت واحد (ریال)"
                    value={it.estimated_unit_price}
                    onChange={(e) => updateItemRow(idx, "estimated_unit_price", Number(e.target.value))}
                    className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-md text-center font-mono"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm cursor-pointer"
            >
              ثبت درخواست خرید
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedReq)}
        onClose={() => setSelectedReq(null)}
        title={selectedReq ? `درخواست ${selectedReq.request_number}` : ""}
        maxWidth="lg"
      >
        {selectedReq && (
          <div className="space-y-5 text-right" dir="rtl">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={selectedReq.status} />
                <span className="text-xs text-slate-400 font-mono">{selectedReq.created_at}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{selectedReq.title}</h3>
              {selectedReq.justification && (
                <p className="text-xs text-slate-600 mt-2 p-3 bg-slate-50 rounded-xl leading-relaxed border border-slate-100">
                  {selectedReq.justification}
                </p>
              )}
            </div>

            {/* Items table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-2.5 bg-slate-100/70 text-xs font-bold text-slate-700">اقلام سفارش داده شده</div>
              <table className="w-full text-right text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-2">نام قطعه</th>
                    <th className="p-2 text-center">تعداد</th>
                    <th className="p-2 text-left">مبلغ برآوردی (ریال)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedReq.items?.map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{it.item_name}</td>
                      <td className="p-2 text-center font-mono">
                        {it.quantity} {it.unit}
                      </td>
                      <td className="p-2 text-left font-mono">
                        {(it.quantity * it.estimated_unit_price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl border border-purple-100 text-sm">
              <span className="font-bold text-purple-900">مبلغ کل برآوردی:</span>
              <span className="font-bold font-mono text-purple-700 text-base">
                {(selectedReq.total_estimated_cost || 0).toLocaleString()} ریال
              </span>
            </div>

            {/* Approvals Timeline */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">سوابق گردش کار و تاییدها:</span>
              <div className="space-y-1.5">
                {selectedReq.approvals?.map((app: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800">{app.approver_name}</span>
                      <span className="text-slate-500 mr-2">({app.action})</span>
                      {app.comment && <p className="text-slate-600 text-[11px] mt-0.5">{app.comment}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{app.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
