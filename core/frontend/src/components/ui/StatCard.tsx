import React from "react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: string
  trendType?: "positive" | "negative" | "neutral"
  colorClass?: string
  accentColor?: "orange" | "amber" | "emerald" | "charcoal" | "rose"
  footerText?: string
  footerBadge?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendType = "neutral",
  colorClass = "text-orange-600 bg-orange-50",
  accentColor = "orange",
  footerText,
  footerBadge,
}) => {
  const accentBorderColors = {
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    charcoal: "bg-zinc-800",
    rose: "bg-rose-500",
  }

  return (
    <div className="relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs card-interactive overflow-hidden flex flex-col justify-between group">
      {/* Top Accent Color Bar (Stitch design signature) with hover expand */}
      <div className={`absolute top-0 right-0 left-0 h-1.5 ${accentBorderColors[accentColor]} transition-all duration-300 group-hover:h-2`} />
      
      {/* Subtle ambient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-800 transition-colors">{title}</span>
          <div className={`p-2.5 rounded-xl ${colorClass} transition-transform duration-300 group-hover:scale-110 shadow-xs`}>{icon}</div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-zinc-900 tracking-tight font-mono">{value}</span>
          {subtitle && <span className="text-xs text-zinc-500 font-medium">{subtitle}</span>}
        </div>
      </div>

      {/* Footer / Context Bar */}
      {(footerText || footerBadge || trend) && (
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs relative z-10">
          {footerText ? (
            <span className="text-zinc-500 text-[11px] truncate group-hover:text-zinc-700 transition-colors">{footerText}</span>
          ) : trend ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`font-semibold ${
                  trendType === "positive"
                    ? "text-emerald-600"
                    : trendType === "negative"
                    ? "text-rose-600"
                    : "text-zinc-500"
                }`}
              >
                {trend}
              </span>
              <span className="text-zinc-400 text-[11px]">نسبت به دوره قبل</span>
            </div>
          ) : (
            <div />
          )}

          {footerBadge && (
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-medium text-[10px] group-hover:bg-orange-50 group-hover:text-orange-700 transition-colors">
              {footerBadge}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
