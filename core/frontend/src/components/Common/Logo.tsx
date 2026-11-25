import { Link } from "@tanstack/react-router"

import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const mark = (sizeClass: string) => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mokarrar"
      className={cn(sizeClass, "shrink-0")}
    >
      <rect
        x="6"
        y="6"
        width="52"
        height="52"
        rx="16"
        stroke="#F97316"
        strokeWidth="2.2"
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
  )

  const content =
    variant === "responsive" ? (
      <>
        <div className={cn("inline-flex items-center gap-2 group-data-[collapsible=icon]:hidden", className)}>
          {mark("h-7 w-7")}
          <span className="font-black text-base tracking-tight">
            MOKA<span className="text-orange-500">RR</span>AR
          </span>
        </div>
        <div className={cn("hidden group-data-[collapsible=icon]:block", className)}>
          {mark("size-6")}
        </div>
      </>
    ) : variant === "full" ? (
      <div className={cn("inline-flex items-center gap-2", className)}>
        {mark("h-7 w-7")}
        <span className="font-black text-base tracking-tight">
          MOKA<span className="text-orange-500">RR</span>AR
        </span>
      </div>
    ) : (
      mark(cn("size-6", className))
    )

  if (!asLink) {
    return content
  }

  return <Link to="/">{content}</Link>
}
