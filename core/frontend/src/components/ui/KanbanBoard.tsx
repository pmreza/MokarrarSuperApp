import React, { useState } from "react"
import { StatusBadge } from "./StatusBadge"
import { Clock, MessageSquare, User, ArrowLeft, ArrowRight, Plus, GripVertical } from "lucide-react"

export interface TaskItem {
  id: string
  title: string
  description?: string
  priority: string
  state: string
  assignee_name?: string
  assignee_id?: string
  follower_name?: string
  follower_id?: string
  location?: string
  location_title?: string
  due_date?: string
  tags?: string[]
  is_deleted?: boolean
  deleted_at?: string
  requested_due_date?: string | null
  extension_reason?: string | null
  extension_status?: string | null
  extension_requested_by?: string | null
  extension_requested_at?: string | null
  comments?: Array<{ author: string; content: string; created_at: string }>
}

interface KanbanBoardProps {
  tasks: TaskItem[]
  onTaskClick: (task: TaskItem) => void
  onTaskStateChange: (taskId: string, newState: string) => void
  onAddTask?: (stateId: string) => void
}

const COLUMNS = [
  {
    id: "todo",
    alias: ["todo", "backlog"],
    title: "برنامه‌ریزی شده",
    subtitle: "در انتظار اقدام",
    color: "border-blue-400",
    headerBg: "bg-blue-50/70",
    dot: "bg-blue-500",
  },
  {
    id: "in_progress",
    alias: ["in_progress"],
    title: "در حال اجرا",
    subtitle: "عملیات جاری پرسنل",
    color: "border-amber-400",
    headerBg: "bg-amber-50/70",
    dot: "bg-amber-500 animate-pulse",
  },
  {
    id: "done",
    alias: ["done"],
    title: "اتمام یافته",
    subtitle: "تکمیل و مستندسازی",
    color: "border-emerald-400",
    headerBg: "bg-emerald-50/70",
    dot: "bg-emerald-500",
  },
  {
    id: "cancelled",
    alias: ["cancelled"],
    title: "لغو شده",
    subtitle: "متوقف یا ملغی",
    color: "border-rose-400",
    headerBg: "bg-rose-50/70",
    dot: "bg-rose-500",
  },
]

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onTaskStateChange,
  onAddTask,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  const getCardAccent = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-[#e02b00]"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-[#062434]"
      default:
        return "bg-zinc-400"
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.setData("text/plain", taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
    setDragOverCol(null)
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (dragOverCol !== colId) {
      setDragOverCol(colId)
    }
  }

  const handleDragLeave = (e: React.DragEvent, colId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    if (dragOverCol === colId) {
      setDragOverCol(null)
    }
  }

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    setDragOverCol(null)
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId
    if (taskId) {
      onTaskStateChange(taskId, colId)
    }
    setDraggedTaskId(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" dir="rtl">
      {COLUMNS.map((col, colIdx) => {
        const colTasks = tasks.filter((t) => col.alias.includes(t.state))
        const nextCol = COLUMNS[colIdx + 1]?.id
        const prevCol = COLUMNS[colIdx - 1]?.id
        const isTarget = dragOverCol === col.id

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={(e) => handleDragLeave(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl p-3 min-h-[160px] md:min-h-[550px] transition-all duration-200 border ${
              isTarget
                ? "bg-orange-50/70 border-orange-500 border-2 border-dashed shadow-md"
                : "bg-zinc-100/60 border-zinc-200/90"
            }`}
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-3 px-2 border-b border-zinc-200/80 mb-3 p-2.5 rounded-xl shadow-2xs ${col.headerBg}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 leading-tight">{col.title}</h4>
                  <span className="text-[10px] text-zinc-500 block">{col.subtitle}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-zinc-700 font-bold font-mono border border-zinc-200/80">
                  {colTasks.length}
                </span>
                {onAddTask && (
                  <button
                    onClick={() => onAddTask(col.id)}
                    className="p-1 text-zinc-500 hover:text-orange-600 rounded-md hover:bg-white/80 transition-colors cursor-pointer"
                    title="افزودن دستور کار جدید"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Column Cards Drop Area */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {colTasks.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl text-xs transition-colors ${
                  isTarget
                    ? "border-orange-400 bg-orange-100/40 text-orange-700 font-bold"
                    : "border-zinc-200 text-zinc-400"
                }`}>
                  <span>{isTarget ? "تسک را اینجا رها کنید" : "دستور کاری در این ستون نیست"}</span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">می‌توانید تسک‌ها را به اینجا بکشید</span>
                </div>
              ) : (
                colTasks.map((task) => {
                  const isBeingDragged = draggedTaskId === task.id
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onTaskClick(task)}
                      className={`bg-white p-4 rounded-xl border border-zinc-200/90 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden ${
                        isBeingDragged ? "opacity-40 scale-[0.98] border-orange-400" : "hover:-translate-y-0.5"
                      }`}
                    >
                      {/* Top Accent Strip */}
                      <div className={`absolute top-0 right-0 left-0 h-1 ${getCardAccent(task.priority)}`} />

                      <div className="flex items-start justify-between gap-2 mb-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 shrink-0 transition-colors" />
                          <span className="text-[10px] font-mono text-zinc-400 font-bold">WO-#{task.id}</span>
                        </div>
                        <StatusBadge status={task.priority} />
                      </div>

                      <h5 className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                        {task.title}
                      </h5>

                      {task.description && (
                        <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Location Badge if available */}
                      {task.location && (
                        <div className="mt-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-zinc-50 text-zinc-600 border border-zinc-200">
                            {task.location === "mahshahr_plant"
                              ? "کارخانه ماهشهر"
                              : task.location === "qazvin_plant"
                              ? "کارخانه قزوین"
                              : "دفتر مرکزی"}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-md font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="mt-3.5 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] text-zinc-700 font-bold border border-zinc-200">
                            <User className="w-3 h-3" />
                          </div>
                          <span className="text-[11px] truncate max-w-[100px]">
                            {task.assignee_name || "کادر فنی"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {task.comments && task.comments.length > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                              <MessageSquare className="w-3 h-3" />
                              {task.comments.length}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                              <Clock className="w-3 h-3" />
                              {task.due_date}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Move Buttons (always visible on touch/mobile, hover on desktop) */}
                      <div
                        className="mt-2.5 pt-2 border-t border-zinc-100/60 flex items-center justify-between gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {prevCol ? (
                          <button
                            onClick={() => onTaskStateChange(task.id, prevCol)}
                            className="px-2.5 py-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                            title="انتقال به ستون قبل"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>قبلی</span>
                          </button>
                        ) : <span />}

                        {nextCol ? (
                          <button
                            onClick={() => onTaskStateChange(task.id, nextCol)}
                            className="px-2.5 py-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="انتقال به ستون بعد"
                          >
                            <span>بعدی</span>
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        ) : <span />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}