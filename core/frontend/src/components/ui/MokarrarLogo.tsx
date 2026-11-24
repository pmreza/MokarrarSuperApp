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
    sm: "w-8 h-8 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-14 h-14 rounded-2xl",
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Official RR Emblem Badge */}
      <img
        src="/assets/images/logo-rr.png"
        alt="لوگوی مکرر"
        className={`${badgeSizes[size]} object-contain shadow-md shrink-0 bg-white/5 border border-zinc-200/20`}
      />

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
