import React from "react"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { Search, Bell, LogOut, ChevronLeft, Plus } from "lucide-react"
import { NAVIGATION_CONFIG } from "@/config/navigation.config"

export const Header: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Find active nav config for dynamic title & breadcrumb
  const currentNav = NAVIGATION_CONFIG.find((item) => {
    if (item.path === "/") return location.pathname === "/"
    return location.pathname.startsWith(item.path)
  })

  const pageTitle = currentNav?.title || "سامانه یکپارچه مکرر"

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    navigate({ to: "/login" })
  }

  // Persian formatted date
  const todayPersian = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())

  return (
    <header
      className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/95 px-6 backdrop-blur-xs shadow-xs"
      dir="rtl"
    >
      {/* Dynamic Title & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="font-bold text-zinc-900">مکرر</span>
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-600 font-medium">{pageTitle}</span>
          </div>
          <h1 className="text-sm font-bold text-zinc-900 tracking-tight mt-0.5">
            {pageTitle}
          </h1>
        </div>

        <span className="hidden lg:inline-flex bg-zinc-100 px-2.5 py-1 rounded text-zinc-600 font-mono text-xs">
          {todayPersian}
        </span>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search Input */}
        <div className="relative hidden md:block w-64">
          <input
            type="text"
            placeholder="جستجو با Ctrl+K..."
            className="w-full pr-9 pl-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-right"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute right-2.5 top-2 pointer-events-none" />
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          title="اعلان‌ها"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white" />
        </button>

        {/* Action Button: Mokarrar Orange */}
        <button
          onClick={() => navigate({ to: "/tasks" })}
          className="h-9 px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت تسک / خرید</span>
        </button>

        <div className="h-4 w-px bg-zinc-200 mx-1 hidden sm:block" />

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-orange-500/30">
            م
          </div>
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-zinc-900 leading-tight">
              مدیر ارشد مکرر
            </span>
            <span className="text-[10px] text-zinc-400 leading-tight">
              سطح دسترسی: مدیرکل
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mr-1"
            title="خروج از سامانه"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
