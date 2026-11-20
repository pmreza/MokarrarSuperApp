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
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, state: newStateId } : t))
      )
      await api.tasks.update(taskId, { state: newStateId })
      toast.success("وضعیت تسک با موفقیت در Plane بروزرسانی شد.")
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

  // Table Columns
  const columns: Column<TaskItem>[] = [
    {
      header: "شناسه",
      accessorKey: "id",
      className: "w-24 text-center font-mono text-xs text-slate-500",
    },
    {
      header: "عنوان تسک عملیاتی",
      cell: (row) => (
        <div>
          <span
            onClick={() => setSelectedTask(row)}
            className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
          >
            {row.title}
          </span>
          {row.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{row.description}</p>
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
      className: "w-36 text-slate-700",
    },
    {
      header: "سررسید",
      accessorKey: "due_date",
      className: "w-28 text-center font-mono text-xs text-slate-500",
    },
  ]

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">مدیریت وظایف و تسک‌های صنعتی (Phase 1)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            موتور پردازش تسک‌ها بر بستر Plane • هماهنگ با خطوط تولید و کارگاه‌های شرکت مکرر
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>تخته کانبان</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>جدول داده</span>
            </button>
          </div>

          <button
            onClick={loadTasks}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسک جدید</span>
          </button>
        </div>
      </div>

      {/* Main Board or Table */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          tasks={tasks}
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
          data={tasks}
          title="فهرست جامع تسک‌های عملیاتی"
          subtitle="همگام با Plane API"
          onExportExcel={() => api.exports.downloadTasksExcel()}
          onExportDocx={() => api.exports.downloadTasksDocx()}
        />
      )}

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="ثبت تسک جدید در موتور Plane"
        description="مشخصات وظیفه، مسئول اجرا و تاریخ سررسید را وارد نمایید."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              عنوان تسک <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: بازبینی و روانکاری یاتاقان‌های خط ۱"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">شرح و جزییات عملیاتی</label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="دستورالعمل، ابزارهای مورد نیاز یا نکات ایمنی..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اولویت</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-500"
              >
                <option value="urgent">فوری و اضطراری</option>
                <option value="high">بالا</option>
                <option value="medium">متوسط</option>
                <option value="low">پایین</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">مرحله شروع</label>
              <select
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-500"
              >
                <option value="backlog">بک‌لاگ</option>
                <option value="todo">در انتظار انجام</option>
                <option value="in_progress">در حال انجام</option>
                <option value="done">تکمیل شده</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">مسئول اجرا</label>
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-500"
              >
                <option value="مهندس محمد رضایی">مهندس محمد رضایی (نگهداری و تعمیرات)</option>
                <option value="سارا کریمی">سارا کریمی (کنترل کیفیت)</option>
                <option value="حمید حسینی">حمید حسینی (انباردار مرکزی)</option>
                <option value="علی اکبری">علی اکبری (برق و تاسیسات)</option>
              </select>
            </div>

            <div>
              <JalaliDatePicker value={newDueDate} onChange={setNewDueDate} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">برچسب‌ها (با کاما جدا کنید)</label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="تولید, قطعات, فوری"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              ایجاد تسک
            </button>
          </div>
        </form>
      </Modal>

      {/* TASK DETAIL DRAWER / MODAL */}
      <Modal
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={selectedTask ? `جزئیات تسک #${selectedTask.id}` : ""}
        maxWidth="xl"
      >
        {selectedTask && (
          <div className="space-y-6 text-right" dir="rtl">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={selectedTask.state} />
                <StatusBadge status={selectedTask.priority} />
                <span className="text-xs text-slate-400 font-mono">شناسه: {selectedTask.id}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{selectedTask.title}</h3>
              {selectedTask.description && (
                <p className="text-xs text-slate-600 mt-2 p-3 bg-slate-50 rounded-xl leading-relaxed border border-slate-100">
                  {selectedTask.description}
                </p>
              )}
            </div>

            {/* Quick Status Switcher */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">تغییر وضعیت تسک:</span>
              <div className="flex items-center gap-1.5">
                {["backlog", "todo", "in_progress", "done"].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      handleStateChange(selectedTask.id, st)
                      setSelectedTask({ ...selectedTask, state: st })
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      selectedTask.state === st
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {st === "backlog"
                      ? "بک‌لاگ"
                      : st === "todo"
                      ? "در انتظار"
                      : st === "in_progress"
                      ? "در حال انجام"
                      : "تکمیل شده"}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block mb-1">مسئول اجرا</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  {selectedTask.assignee_name || "تخصیص‌نیافته"}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-slate-400 block mb-1">تاریخ سررسید</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  {selectedTask.due_date || "نامشخص"}
                </span>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>دیدگاه‌ها و گفتگو ({selectedTask.comments?.length || 0})</span>
              </div>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {selectedTask.comments && selectedTask.comments.length > 0 ? (
                  selectedTask.comments.map((c, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span className="font-bold text-slate-700">{c.author}</span>
                        <span className="font-mono">{c.created_at}</span>
                      </div>
                      <p className="text-slate-800">{c.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">دیدگاهی برای این تسک ثبت نشده است.</p>
                )}
              </div>

              {/* Add Comment Box */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  placeholder="ثبت یادداشت یا گزارش وضعیت..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال</span>
                </button>
              </div>
            </div>

            {/* Delete button */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
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
