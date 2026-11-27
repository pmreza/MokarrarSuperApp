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
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-14 h-14",
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Modern Monoline Continuous RR Monogram (Transparent Vector) */}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="لوگوی مکرر"
        className={`${badgeSizes[size]} shrink-0 drop-shadow-sm`}
      >
        <rect
          x="6"
          y="6"
          width="52"
          height="52"
          rx="16"
          stroke="#F97316"
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeOpacity="0.65"
        />
        <path
          d="M17 45V21C17 18.5 19 17 21.5 17H28C32 17 34.5 19.5 34.5 23C34.5 26.5 32 29 28 29H21L33 45C35 45 35 41 35 38V23C35 20.5 37 19 39.5 19H45C48.5 19 51 21.5 51 25C51 28.5 48.5 31 45 31H38L49 45"
          stroke="#F97316"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

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
