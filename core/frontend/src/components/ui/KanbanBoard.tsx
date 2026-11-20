import React from "react"
import { StatusBadge } from "./StatusBadge"
import { Clock, MessageSquare, User, ArrowLeft, ArrowRight, Plus } from "lucide-react"

export interface TaskItem {
  id: string
  title: string
  description?: string
  priority: string
  state: string
  assignee_name?: string
  due_date?: string
  tags?: string[]
  comments?: Array<{ author: string; content: string; created_at: string }>
}

interface KanbanBoardProps {
  tasks: TaskItem[]
  onTaskClick: (task: TaskItem) => void
  onTaskStateChange: (taskId: string, newState: string) => void
  onAddTask?: (stateId: string) => void
}

const COLUMNS = [
  { id: "backlog", title: "بک‌لاگ", color: "border-slate-300", headerBg: "bg-slate-100" },
  { id: "todo", title: "در انتظار انجام", color: "border-blue-400", headerBg: "bg-blue-50" },
  { id: "in_progress", title: "در حال انجام", color: "border-amber-400", headerBg: "bg-amber-50" },
  { id: "done", title: "تکمیل شده", color: "border-emerald-500", headerBg: "bg-emerald-50" },
]

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onTaskStateChange,
  onAddTask,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5" dir="rtl">
      {COLUMNS.map((col, colIdx) => {
        const colTasks = tasks.filter((t) => t.state === col.id)
        const nextCol = COLUMNS[colIdx + 1]?.id
        const prevCol = COLUMNS[colIdx - 1]?.id

        return (
          <div
            key={col.id}
            className="flex flex-col bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 min-h-[550px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-200/60 mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.headerBg} border ${col.color}`} />
                <h4 className="text-sm font-bold text-slate-800">{col.title}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  {colTasks.length}
                </span>
              </div>
              {onAddTask && (
                <button
                  onClick={() => onAddTask(col.id)}
                  className="p-1 text-slate-500 hover:text-blue-600 rounded-md hover:bg-white transition-colors"
                  title="افزودن تسک جدید"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Column Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {colTasks.length === 0 ? (
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  تسک خالی
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono text-slate-400">#{task.id}</span>
                      <StatusBadge status={task.priority} />
                    </div>

                    <h5 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      {task.title}
                    </h5>

                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {task.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Info */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-bold border border-slate-200">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="text-[11px] truncate max-w-[100px]">
                          {task.assignee_name || "تخصیص‌نیافته"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {task.comments && task.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <MessageSquare className="w-3 h-3" />
                            {task.comments.length}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Clock className="w-3 h-3" />
                            {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Move Buttons */}
                    <div
                      className="mt-3 pt-2 border-t border-slate-100/60 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {prevCol ? (
                        <button
                          onClick={() => onTaskStateChange(task.id, prevCol)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md text-[11px] flex items-center gap-1"
                          title="مرحله قبل"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>قبلی</span>
                        </button>
                      ) : <span />}

                      {nextCol ? (
                        <button
                          onClick={() => onTaskStateChange(task.id, nextCol)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md text-[11px] flex items-center gap-1"
                          title="مرحله بعد"
                        >
                          <span>بعدی</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      ) : <span />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
