import React from "react"

interface MokarrarLogoProps {
  className?: string
  variant?: "dark" | "light"
  size?: "sm" | "md" | "lg"
  showSubtitle?: boolean
  subtitle?: string
}

export const MokarrarLogo: React.FC<MokarrarLogoProps> = ({
  className = "",
  variant = "light",
  size = "md",
  showSubtitle = true,
  subtitle = "سامانه یکپارچه مکرر بازآفرین",
}) => {
  const baseTextColor = variant === "light" ? "text-white" : "text-zinc-900"
  const fontSizes = {
    sm: "text-base tracking-tight",
    md: "text-xl tracking-tight",
    lg: "text-2xl tracking-tight",
  }
  const badgeSizes = {
    sm: "w-7 h-7 text-xs rounded-lg",
    md: "w-8 h-8 text-sm rounded-lg",
    lg: "w-10 h-10 text-base rounded-xl",
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Icon Badge */}
      <div className={`${badgeSizes[size]} bg-orange-500 flex items-center justify-center text-white font-black shadow-md shadow-orange-500/25 shrink-0`}>
        م
      </div>

      <div className="flex flex-col">
        {/* Exact Typography matching official logo: MOKA - RR - AR */}
        <div className={`font-black leading-none ${fontSizes[size]}`}>
          <span className={baseTextColor}>MOKA</span>
          <span className="text-orange-500">RR</span>
          <span className={baseTextColor}>AR</span>
        </div>

        {showSubtitle && (
          <span className="text-[10px] text-zinc-400 font-medium tracking-wide mt-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}
