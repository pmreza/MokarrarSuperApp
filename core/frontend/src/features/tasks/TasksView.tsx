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
  Eye,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  AlertOctagon,
} from "lucide-react"
import { KanbanBoard, type TaskItem } from "@/components/ui/KanbanBoard"
import { DataTable, type Column } from "@/components/ui/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { Modal } from "@/components/ui/Modal"
import { JalaliDatePicker } from "@/components/ui/JalaliDatePicker"
import { api } from "@/services/api"
import { toast } from "sonner"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  location?: string
  phone_number?: string
  bale_chat_id?: string
}

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [trashTasks, setTrashTasks] = useState<TaskItem[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "trash">("kanban")

  // Filters
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedPriority, setSelectedPriority] = useState<string>("all")

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)

  // New task form state
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newPriority, setNewPriority] = useState("medium") // low, medium, urgent, critical
  const [newState, setNewState] = useState("todo")
  const [newLocation, setNewLocation] = useState("central_office")
  const [newAssigneeId, setNewAssigneeId] = useState("")
  const [newFollowerId, setNewFollowerId] = useState("")
  const [newDueDate, setNewDueDate] = useState("۱۴۰۳/۰۹/۱۰")

  // Comment input
  const [commentText, setCommentText] = useState("")

  const loadData = async () => {
    try {
      setLoading(true)
      const [tasksData, membersData, trashData] = await Promise.all([
        api.tasks.list(),
        api.tasks.getMembers(),
        api.tasks.getTrash(),
      ])
      setTasks(tasksData || [])
      setMembers(membersData || [])
      setTrashTasks(trashData || [])

      if (membersData && membersData.length > 0 && !newAssigneeId) {
        setNewAssigneeId(membersData[0].id)
      }
    } catch (err) {
      console.error(err)
      toast.error("خطا در بارگذاری اطلاعات تسک‌ها و اعضای تیم")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-set default assignee when location changes
  const filteredMembersByLocation = members.filter((m) => {
    if (newLocation === "central_office") {
      return !m.location || m.location === "central_office"
    }
    return m.location === newLocation
  })

  const effectiveMembers = filteredMembersByLocation.length > 0 ? filteredMembersByLocation : members

  useEffect(() => {
    if (effectiveMembers.length > 0) {
      if (!effectiveMembers.some((m) => m.id === newAssigneeId)) {
        setNewAssigneeId(effectiveMembers[0].id)
      }
    }
  }, [newLocation, effectiveMembers, newAssigneeId])

  const handleStateChange = async (taskId: string, newStateId: string) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, state: newStateId } : t))
      )
      await api.tasks.update(taskId, { state: newStateId })
      toast.success("وضعیت تسک با موفقیت بروزرسانی شد.")
    } catch (err) {
      toast.error("خطا در تغییر وضعیت تسک")
      loadData()
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error("لطفاً عنوان تسک را وارد نمایید.")
      return
    }

    const assignedUser = members.find((m) => String(m.id) === String(newAssigneeId))
    const followerUser = members.find((m) => String(m.id) === String(newFollowerId))

    try {
      const created = await api.tasks.create({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        state: newState,
        assignee_name: assignedUser ? assignedUser.name : "تخصیص‌نیافته",
        assignee_id: assignedUser ? String(assignedUser.id) : "unassigned",
        follower_name: followerUser ? followerUser.name : "",
        follower_id: followerUser ? String(followerUser.id) : "",
        location: newLocation,
        due_date: newDueDate,
        tags: [],
      })

      setTasks((prev) => [created, ...prev])
      setIsCreateOpen(false)
      setNewTitle("")
      setNewDesc("")
      toast.success("تسک جدید با موفقیت ثبت شد و اعلان برای مجری و پیگیر ارسال گردید.")
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

  const handleSoftDelete = async (id: string) => {
    try {
      await api.tasks.delete(id, false)
      const target = tasks.find((t) => t.id === id)
      if (target) {
        setTrashTasks((prev) => [{ ...target, is_deleted: true }, ...prev])
      }
      setTasks((prev) => prev.filter((t) => t.id !== id))
      setSelectedTask(null)
      toast.info("تسک به سطل آشغال منتقل شد. هر زمان بخواهید قابل بازیابی است.")
    } catch (err) {
      toast.error("خطا در حذف تسک")
    }
  }

  const handleRestoreTask = async (id: string) => {
    try {
      const restored = await api.tasks.restore(id)
      setTrashTasks((prev) => prev.filter((t) => t.id !== id))
      setTasks((prev) => [restored, ...prev])
      toast.success("تسک با موفقیت از سطل آشغال بازیابی شد.")
    } catch (err) {
      toast.error("خطا در بازیابی تسک")
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("آیا از حذف دائمی این تسک از پایگاه داده اطمینان دارید؟ این عمل غیرقابل بازگشت است.")) return
    try {
      await api.tasks.delete(id, true)
      setTrashTasks((prev) => prev.filter((t) => t.id !== id))
      toast.success("تسک به طور دائمی حذف گردید.")
    } catch (err) {
      toast.error("خطا در حذف دائمی تسک")
    }
  }

  // Filter tasks based on location and priority
  const filteredTasks = tasks.filter((t) => {
    if (selectedPriority !== "all" && t.priority !== selectedPriority) return false
    if (selectedLocation !== "all" && (t.location || "central_office") !== selectedLocation) return false
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
      header: "عنوان تسک",
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
      header: "محل / شعبه",
      cell: (row) => {
        const loc = row.location || "central_office"
        const titles: Record<string, { label: string; badge: string }> = {
          central_office: { label: "دفتر مرکزی", badge: "bg-blue-50 text-blue-700 border-blue-200" },
          mahshahr_plant: { label: "کارخانه ماهشهر", badge: "bg-orange-50 text-orange-700 border-orange-200" },
          qazvin_plant: { label: "کارخانه قزوین", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        }
        const item = titles[loc] || { label: "دفتر مرکزی", badge: "bg-zinc-100 text-zinc-700 border-zinc-200" }
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badge}`}>
            {item.label}
          </span>
        )
      },
      className: "w-28 text-center",
    },
    {
      header: "وضعیت",
      cell: (row) => <StatusBadge status={row.state} />,
      className: "w-28 text-center",
    },
    {
      header: "اولویت",
      cell: (row) => <StatusBadge status={row.priority} />,
      className: "w-32 text-center",
    },
    {
      header: "مسئول اجرا",
      accessorKey: "assignee_name",
      className: "w-36 text-zinc-800 text-xs font-bold",
    },
    {
      header: "مسئول پیگیری",
      cell: (row) => (
        <span className="text-zinc-600 text-xs font-medium">
          {row.follower_name || "—"}
        </span>
      ),
      className: "w-32 text-center",
    },
    {
      header: "مهلت تحویل (ددلاین)",
      accessorKey: "due_date",
      className: "w-28 text-center font-mono text-xs text-zinc-600",
    },
    {
      header: "اقدامات",
      cell: (row) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedTask(row)}
            className="p-1.5 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            title="مشاهده جزئیات"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSoftDelete(row.id)}
            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="انتقال به سطل آشغال"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: "w-24 text-center",
    },
  ]

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs card-interactive animate-slide-up flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#062434] text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-5 h-5 text-orange-400" />
            </span>
            <h1 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
              مدیریت و پیگیری دستور کارهای سازمانی و فنی
            </h1>
            <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-orange-50 text-orange-700 border border-orange-200">
              سامانه عملیات هوشمند مکرر
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            تخصیص وظایف به پرسنل واقعی، تعیین مسئول پیگیری، همگام‌سازی اعلان‌های بله و مدیریت مهلت تحویل
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
              <span>بورد کانبان</span>
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
            <button
              onClick={() => setViewMode("trash")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "trash"
                  ? "bg-white text-rose-600 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
              title="تسک‌های حذف شده"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>سطل آشغال ({trashTasks.length})</span>
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
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت تسک جدید</span>
          </button>
        </div>
      </div>

      {/* 2. Filters Strip */}
      {viewMode !== "trash" && (
        <div className="bg-white p-3.5 rounded-xl border border-zinc-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-zinc-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              فیلترها:
            </span>

            {/* Filter Location / Branch */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 text-xs focus:bg-white focus:border-orange-500 transition-colors font-medium cursor-pointer"
            >
              <option value="all">موقعیت: همه (دفتر مرکزی و کارخانه‌ها)</option>
              <option value="central_office">دفتر مرکزی</option>
              <option value="mahshahr_plant">کارخانه ماهشهر</option>
              <option value="qazvin_plant">کارخانه قزوین</option>
            </select>

            {/* Filter Priority */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 text-xs focus:bg-white focus:border-orange-500 transition-colors cursor-pointer"
            >
              <option value="all">اولویت: همه سطوح</option>
              <option value="critical">اولویت بحرانی</option>
              <option value="urgent">اولویت فوری</option>
              <option value="medium">اولویت متوسط</option>
              <option value="low">اولویت پایین</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>متصل به پایگاه داده و ربات بله</span>
          </div>
        </div>
      )}

      {/* 3. Main Views (Kanban / Table / Trash) */}
      {viewMode === "trash" ? (
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="text-sm font-bold text-zinc-900">سطل آشغال (تسک‌های بایگانی و حذف شده)</h3>
                <p className="text-xs text-zinc-400">تسک‌ها در این بخش نگهداری می‌شوند و هر زمان مایل باشید می‌توانید آن‌ها را بازیابی نمایید.</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg">
              {trashTasks.length} تسک
            </span>
          </div>

          {trashTasks.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
              <p className="text-xs font-bold text-zinc-600">سطل آشغال خالی است.</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">هیچ تسک حذف‌شده‌ای در سیستم وجود ندارد.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {trashTasks.map((task) => (
                <div key={task.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 p-2 rounded-xl transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900">{task.title}</span>
                      <StatusBadge status={task.priority} />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                      <span>مجری: {task.assignee_name || "تخصیص‌نیافته"}</span>
                      {task.follower_name && <span>پیگیر: {task.follower_name}</span>}
                      <span>مهلت: {task.due_date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreTask(task.id)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>بازیابی تسک</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(task.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف دائم</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : viewMode === "kanban" ? (
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
          subtitle="اتصال دوطرفه با پایگاه داده و ربات بله"
          onExportExcel={() => api.exports.downloadTasksExcel()}
          onExportDocx={() => api.exports.downloadTasksDocx()}
        />
      )}

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="ثبت تسک جدید"
        description="مشخصات وظیفه، مسئول اجرا، مسئول پیگیری و مهلت تحویل را تعیین نمایید."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              عنوان تسک <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: تنظیم دمای اکسترودر خط بازآفرینی A1"
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">شرح و جزییات عملیاتی</label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="توضیحات تکمیلی، مراحل اجرا و نکات مورد نیاز..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">سطح اولویت</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors font-medium cursor-pointer"
              >
                <option value="low">اولویت پایین</option>
                <option value="medium">اولویت متوسط</option>
                <option value="urgent">اولویت فوری</option>
                <option value="critical">اولویت بحرانی</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">مرحله شروع</label>
              <select
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors font-medium cursor-pointer"
              >
                <option value="todo">برنامه‌ریزی شده</option>
                <option value="in_progress">در حال اجرا</option>
                <option value="done">اتمام یافته</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">محل سازمانی / شعبه</label>
            <select
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors font-bold cursor-pointer"
            >
              <option value="central_office">دفتر مرکزی</option>
              <option value="mahshahr_plant">کارخانه ماهشهر</option>
              <option value="qazvin_plant">کارخانه قزوین</option>
            </select>
          </div>

          {/* User Selectors: Assignee & Follower */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center justify-between">
                <span>مسئول اجرا (Assignee) <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-zinc-400 font-normal">دریافت‌کننده تسک</span>
              </label>
              <select
                value={newAssigneeId}
                onChange={(e) => setNewAssigneeId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors font-bold cursor-pointer"
              >
                {effectiveMembers.length > 0 ? (
                  effectiveMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role}) {m.bale_chat_id ? "📱" : ""}
                    </option>
                  ))
                ) : (
                  <option value="">هیچ کاربری یافت نشد</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center justify-between">
                <span>مسئول پیگیری (Follow-up)</span>
                <span className="text-[10px] text-zinc-400 font-normal">کنترل روند کار</span>
              </label>
              <select
                value={newFollowerId}
                onChange={(e) => setNewFollowerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-orange-500 transition-colors font-medium cursor-pointer"
              >
                <option value="">بدون مسئول پیگیری</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role}) {m.bale_chat_id ? "📱" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modern Persian Jalali DatePicker with Calendar Popup */}
          <div>
            <JalaliDatePicker
              label="مهلت تحویل (ددلاین)"
              value={newDueDate}
              onChange={setNewDueDate}
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
              className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              ثبت و ایجاد تسک
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
          <div className="space-y-5 text-right" dir="rtl">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={selectedTask.state} />
                <StatusBadge status={selectedTask.priority} />
                <span className="text-xs text-zinc-400 font-mono">شناسه: #{selectedTask.id}</span>
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
                {[
                  { id: "todo", label: "برنامه‌ریزی شده" },
                  { id: "in_progress", label: "در حال اجرا" },
                  { id: "done", label: "اتمام یافته" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      handleStateChange(selectedTask.id, st.id)
                      setSelectedTask({ ...selectedTask, state: st.id })
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedTask.state === st.id
                        ? "bg-orange-500 text-white shadow-xs"
                        : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white border border-zinc-200 rounded-xl">
                <span className="text-zinc-400 block mb-1 text-[10px]">مسئول اجرا</span>
                <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  {selectedTask.assignee_name || "تخصیص‌نیافته"}
                </span>
              </div>
              <div className="p-3 bg-white border border-zinc-200 rounded-xl">
                <span className="text-zinc-400 block mb-1 text-[10px]">مسئول پیگیری</span>
                <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  {selectedTask.follower_name || "تعیین‌نشده"}
                </span>
              </div>
              <div className="p-3 bg-white border border-zinc-200 rounded-xl">
                <span className="text-zinc-400 block mb-1 text-[10px]">مهلت تحویل (ددلاین)</span>
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

            {/* Delete button (Soft Delete) */}
            <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleSoftDelete(selectedTask.id)}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>انتقال به سطل آشغال</span>
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
