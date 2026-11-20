import React from "react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: string
  trendType?: "positive" | "negative" | "neutral"
  colorClass?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendType = "neutral",
  colorClass = "text-blue-600 bg-blue-50",
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-lg ${colorClass}`}>{icon}</div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trendType === "positive"
                ? "text-emerald-600"
                : trendType === "negative"
                ? "text-rose-600"
                : "text-slate-500"
            }`}
          >
            {trend}
          </span>
          <span className="text-slate-400">نسبت به دوره قبل</span>
        </div>
      )}
    </div>
  )
}
