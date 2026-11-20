import React from "react"

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  // Tasks
  backlog: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-500", label: "بک‌لاگ" },
  todo: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "در انتظار" },
  in_progress: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "در حال انجام" },
  done: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-600", label: "تکمیل شده" },

  // Priorities
  urgent: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-600", label: "فوری" },
  high: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", label: "بالا" },
  medium: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500", label: "متوسط" },
  low: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: "پایین" },

  // Procurement
  DRAFT: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400", label: "پیش‌نویس" },
  PENDING_APPROVAL: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", label: "در انتظار تایید مدیر" },
  APPROVED: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-600", label: "تایید شده" },
  REJECTED: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", label: "رد شده" },
  PAID: { bg: "bg-purple-50", text: "text-purple-800", dot: "bg-purple-600", label: "پرداخت شده" },
  DELIVERED: { bg: "bg-teal-50", text: "text-teal-800", dot: "bg-teal-600", label: "تحویل انبار شده" },

  // Inventory
  STOCK_IN: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-600", label: "ورود به انبار" },
  STOCK_OUT: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-600", label: "خروج از انبار" },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = "" }) => {
  const meta = STATUS_COLOR_MAP[status] || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    label: status,
  }

  const displayText = label || meta.label || status

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${meta.bg} ${meta.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      <span>{displayText}</span>
    </span>
  )
}
