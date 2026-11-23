import React from "react"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-zinc-100/70 overflow-hidden"
      dir="rtl"
    >
      {/* Ambient background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:24px_24px] opacity-75 pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Centered Auth Card Viewport */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
