import React from "react"

interface MokarrarLogoProps {
  className?: string
  variant?: "dark" | "light"
  size?: "sm" | "md" | "lg"
  showSubtitle?: boolean
}

export const MokarrarLogo: React.FC<MokarrarLogoProps> = ({
  className = "",
  variant = "light",
  size = "md",
  showSubtitle = true,
}) => {
  const baseTextColor = variant === "light" ? "text-white" : "text-zinc-900"
  const fontSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon Badge */}
      <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-500/25 shrink-0">
        م
      </div>

      <div className="flex flex-col">
        {/* Exact Typography matching official logo: MOKA - RR - AR */}
        <div className={`font-black tracking-tight leading-none ${fontSizes[size]}`}>
          <span className={baseTextColor}>MOKA</span>
          <span className="text-orange-500">RR</span>
          <span className={baseTextColor}>AR</span>
        </div>

        {showSubtitle && (
          <span className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">
            سامانه یکپارچه مکرر
          </span>
        )}
      </div>
    </div>
  )
}
