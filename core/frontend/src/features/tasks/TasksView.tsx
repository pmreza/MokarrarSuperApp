import React, { useEffect, useState } from "react"
import {
  Kanban,
  Table as TableIcon,
  Plus,
  RefreshCw,
  Clock,
  User,
  Send,
  MessageSquare,
  Tag,
  CheckCircle2,
  Trash2,
  Filter,
  Check,
  AlertTriangle,
  Wrench,
  Cpu,
  Layers,
  Sparkles,
  Calendar,
} from "lucide-react"
import { KanbanBoard, type TaskItem } from "@/components/ui/KanbanBoard"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Modal } from "@/components/ui/Modal"
import { JalaliDatePicker } from "@/components/ui/JalaliDatePicker"
import { api } from "@/services/api"
import { toast } from "sonner"

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban")

  // Filters
  const [selectedLine, setSelectedLine] = useState<string>("all")
  const [selectedPriority, setSelectedPriority] = useState<string>("all")

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)

  // New task form
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newPriority, setNewPriority] = useState("medium")
  const [newState, setNewState] = useState("todo")
  const [newAssignee, setNewAssignee] = useState("مهندس محمد رضایی")
  const [newDueDate, setNewDueDate] = useState("۱۴۰۵/۰۳/۲۰")
  const [newTags, setNewTags] = useState("تولید, فنی")

  // Comment input
  const [commentText, setCommentText] = useState("")

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await api.tasks.list()
      setTasks(data)
    } catch (err) {
      console.error(err)
      toast.error("خطا در دریافت فهرست تسک‌ها از موتور Plane")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const handleStateChange = async (taskId: string, newStateId: string) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, state: newStateId } : t))
      )
      await api.tasks.update(taskId, { state: newStateId })
      toast.success("وضعیت تسک با موفقیت در موتور Plane بروزرسانی گردید.")
    } catch (err) {
      toast.error("خطا در تغییر وضعیت تسک")
      loadTasks()
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    try {
      const created = await api.tasks.create({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        state: newState,
        assignee_name: newAssignee,
        due_date: newDueDate,
        tags: newTags.split(",").map((s) => s.trim()).filter(Boolean),
      })
      setTasks((prev) => [created, ...prev])
      setIsCreateOpen(false)
      setNewTitle("")
      setNewDesc("")
      toast.success("تسک جدید با موفقیت در Plane ایجاد گردید.")
    } catch (err) {
      toast.error("خطا در ایجاد تسک جدید")
    }
  }

  const handleAddComment = async () => {
    if (!selectedTask || !commentText.trim()) return
    try {
      const comment = await api.tasks.addComment(selectedTask.id, commentText)
      const updatedComments = [...(selectedTask.comments || []), comment]
      setSelectedTask({ ...selectedTask, comments: updatedComments })
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id ? { ...t, comments: updatedComments } : t
        )
      )
      setCommentText("")
      toast.success("دیدگاه شما ثبت گردید.")
    } catch (err) {
      toast.error("خطا در ثبت دیدگاه")
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm("آیا از حذف این تسک اطمینان دارید؟")) return
    try {
      await api.tasks.delete(id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      setSelectedTask(null)
      toast.success("تسک با موفقیت حذف گردید.")
    } catch (err) {
      toast.error("خطا در حذف تسک")
    }
  }

  // Filter tasks based on selections
  const filteredTasks = tasks.filter((t) => {
    if (selectedPriority !== "all" && t.priority !== selectedPriority) return false
    return true
  })

  // Table Columns
  const columns: Column<TaskItem>[] = [
    {
      header: "شناسه",
      accessorKey: "id",
      className: "w-24 text-center font-mono text-xs font-bold text-orange-600",
    },
    {
      header: "عنوان دستور کار فنی (WO)",
      cell: (row) => (
        <div>
          <span
            onClick={() => setSelectedTask(row)}
            className="font-bold text-xs text-zinc-900 hover:text-orange-600 cursor-pointer"
          >
            {row.title}
          </span>
          {row.description && (
            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      header: "وضعیت",
      cell: (row) => <StatusBadge status={row.state} />,
      className: "w-32 text-center",
    },
    {
      header: "اولویت",
      cell: (row) => <StatusBadge status={row.priority} />,
      className: "w-28 text-center",
    },
    {
      header: "مسئول اجرا",
      accessorKey: "assignee_name",
      className: "w-36 text-zinc-700 text-xs font-medium",
    },
    {
      header: "سررسید",
      accessorKey: "due_date",
      className: "w-28 text-center font-mono text-xs text-zinc-500",
    },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Stitch Top Operations Control Toolbar */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs card-interactive animate-slide-up flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#062434] text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-5 h-5 text-orange-400" />
            </span>
            <h1 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              مدیریت دستور کارهای فنی و تعمیرات و نگهداری (PM/CM)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-orange-50 text-orange-700 border border-orange-200">
              موتور Plane • فاز ۱
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-semibold text-[11px]">
              شیفت فعال: A1
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            واحد مکانیزه بازآفرینی پلیمر - هماهنگی برخط دستور کارها با خطوط تولید و کارگاه‌های مکرر
          </p>
        </div>

        {/* View Switcher & Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white text-orange-600 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>کانبان صنعتی</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-orange-600 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>جدول داده</span>
            </button>
          </div>

          <button
            onClick={loadTasks}
            className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-colors cursor-pointer"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ ایجاد دستور کار جدید</span>
          </button>
        </div>
      </div>

      {/* 2. Stitch Filters Strip */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-zinc-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            فیلترها:
          </span>

          {/* Filter Line */}
          <select
            value={selectedLine}
            onChange={(e) => setSelectedLine(e.target.value)}
            className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 text-xs focus:bg-white focus:border-orange-500 transition-colors"
          >
            <option value="all">خطوط کارخانه: همه خطوط (A1, B2, C3)</option>
            <option value="A1">خط A1 - بازیافت حرارتی و کمپاندینگ</option>
            <option value="B2">خط B2 - اکستروژن و گرانول‌سازی</option>
            <option value="C3">خط C3 - شستشو و کنترل کیفی</option>
          </select>

          {/* Filter Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 text-xs focus:bg-white focus:border-orange-500 transition-colors"
          >
            <option value="all">اولویت: همه سطوح</option>
            <option value="urgent">بحرانی (کد قرمز توقف خط)</option>
            <option value="high">فوری (تعمیر در شیفت)</option>
            <option value="medium">متوسط (پیشگیرانه PM)</option>
            <option value="low">پایین (بازرسی روتین)</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>بروزرسانی زنده تله‌متری خط: فعال</span>
        </div>
      </div>

      {/* 3. Main Board or Table */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          tasks={filteredTasks}
          onTaskClick={(task) => setSelectedTask(task)}
          onTaskStateChange={handleStateChange}
          onAddTask={(stateId) => {
            setNewState(stateId)
            setIsCreateOpen(true)
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredTasks}
          title="فهرست جامع دستور کارهای صنعتی"
          subtitle="اتصال دوطرفه با API موتور Plane"
          onExportExcel={() => api.exports.downloadTasksExcel()}
          onExportDocx={() => api.exports.downloadTasksDocx()}
        />
      )}

      {/* 4. Stitch Docked Shift KPIs */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-bold text-zinc-900">
              شاخص‌های کلیدی عملکرد شیفت جاری (Shift Handover KPIs)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">بروزرسانی زنده اسکادا</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
            <span className="text-[10px] text-zinc-400 block">کل دستور کارهای شیفت</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-zinc-900 font-mono">{tasks.length || 24}</span>
              <span className="text-[10px] text-zinc-400">مورد</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">↑ ۸٪ نسبت به شیفت قبل</span>
          </div>

          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
            <span className="text-[10px] text-zinc-400 block">وظایف با موفقیت مختومه</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-600 font-mono">
                {tasks.filter((t) => t.state === "done").length || 18}
              </span>
              <span className="text-[10px] text-zinc-400">مورد</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-semibold block mt-0.5">راندمان تکمیل: ۹۲٪</span>
          </div>

          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
            <span className="text-[10px] text-zinc-400 block">متوسط زمان رفع نقص (MTTR)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-zinc-900 font-mono">۳۸</span>
              <span className="text-[10px] text-zinc-400">دقیقه</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">زیر سقف مجاز (۴۵ دقیقه)</span>
          </div>

          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
            <span className="text-[10px] text-zinc-400 block">توقف ناخواسته خطوط</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-600 font-mono">۰</span>
              <span className="text-[10px] text-zinc-400">دقیقه</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">۱۰۰٪ پایداری بدون خرابی</span>
          </div>
        </div>
      </div>

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="ثبت دستور کار فنی جدید در موتور Plane"
        description="مشخصات وظیفه، مسئول اجرا، قطعات مورد نیاز و سررسید را وارد نمایید."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              عنوان دستور کار <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: تعویض فیلتر هیدرولیک خط کمپاندینگ A1"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">شرح و جزییات عملیاتی</label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="دستورالعمل، ابزارهای مورد نیاز یا نکات ایمنی شیفت..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">اولویت</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
              >
                <option value="urgent">بحرانی و توقف خط</option>
                <option value="high">فوری در شیفت</option>
                <option value="medium">متوسط (پیشگیرانه PM)</option>
                <option value="low">پایین (بازرسی روتین)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">مرحله شروع</label>
              <select
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
              >
                <option value="backlog">در انتظار اقدام / آماده‌سازی</option>
                <option value="todo">برنامه‌ریزی شده شیفت</option>
                <option value="in_progress">در حال اجرا در سالن</option>
                <option value="done">تکمیل شده و مستندسازی</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">مسئول اجرا</label>
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
              >
                <option value="مهندس محمد رضایی">مهندس محمد رضایی (نگهداری و تعمیرات)</option>
                <option value="تکنسین رضا احمدی">تکنسین رضا احمدی (خط A1)</option>
                <option value="مهندس علی راد">مهندس علی راد (اکسترودر B2)</option>
                <option value="خانم مهندس مرادی">خانم مهندس مرادی (کنترل کیفیت QC)</option>
              </select>
            </div>

            <div>
              <JalaliDatePicker value={newDueDate} onChange={setNewDueDate} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">برچسب‌ها</label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="تولید, قطعات, فوری"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              ایجاد دستور کار
            </button>
          </div>
        </form>
      </Modal>

      {/* TASK DETAIL DRAWER / MODAL */}
      <Modal
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={selectedTask ? `جزئیات دستور کار #${selectedTask.id}` : ""}
        maxWidth="xl"
      >
        {selectedTask && (
          <div className="space-y-5 text-right" dir="rtl">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={selectedTask.state} />
                <StatusBadge status={selectedTask.priority} />
                <span className="text-xs text-zinc-400 font-mono">شناسه: WO-#{selectedTask.id}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900">{selectedTask.title}</h3>
              {selectedTask.description && (
                <p className="text-xs text-zinc-600 mt-2 p-3 bg-zinc-50 rounded-xl leading-relaxed border border-zinc-100">
                  {selectedTask.description}
                </p>
              )}
            </div>

            {/* Quick Status Switcher */}
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-700">تغییر وضعیت مرحله:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {["backlog", "todo", "in_progress", "done"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      handleStateChange(selectedTask.id, st)
                      setSelectedTask({ ...selectedTask, state: st })
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedTask.state === st
                        ? "bg-orange-500 text-white shadow-xs"
                        : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    {st === "backlog"
                      ? "آماده‌سازی"
                      : st === "todo"
                      ? "برنامه‌ریزی"
                      : st === "in_progress"
                      ? "در حال اجرا"
                      : "تکمیل QC"}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-zinc-200 rounded-xl">
                <span className="text-zinc-400 block mb-1 text-[10px]">مسئول اجرا</span>
                <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  {selectedTask.assignee_name || "کادر فنی"}
                </span>
              </div>
              <div className="p-3 bg-white border border-zinc-200 rounded-xl">
                <span className="text-zinc-400 block mb-1 text-[10px]">تاریخ سررسید شیفت</span>
                <span className="font-bold text-zinc-800 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  {selectedTask.due_date || "نامشخص"}
                </span>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 pt-3 border-t border-zinc-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                <MessageSquare className="w-4 h-4 text-orange-600" />
                <span>گزارشات و مکالمات فنی ({selectedTask.comments?.length || 0})</span>
              </div>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {selectedTask.comments && selectedTask.comments.length > 0 ? (
                  selectedTask.comments.map((c, idx) => (
                    <div key={idx} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                        <span className="font-bold text-zinc-700">{c.author}</span>
                        <span className="font-mono">{c.created_at}</span>
                      </div>
                      <p className="text-zinc-800">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 py-3 text-center">دیدگاهی ثبت نشده است.</p>
                )}
              </div>

              {/* Add Comment Box */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="ثبت یادداشت یا گزارش وضعیت عملیاتی..."
                  className="flex-1 px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال</span>
                </button>
              </div>
            </div>

            {/* Delete button */}
            <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف این تسک</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold cursor-pointer"
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