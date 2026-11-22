import React, { useState, useEffect } from "react"
import { useLocation, useNavigate, Link } from "@tanstack/react-router"
import { Search, Bell, LogOut, ChevronLeft, Plus, Settings, Menu } from "lucide-react"
import { NAVIGATION_CONFIG } from "@/config/navigation.config"
import { CommandPalette } from "@/components/ui/CommandPalette"
import useAuth from "@/hooks/useAuth"

interface HeaderProps {
  onOpenMobileMenu?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

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
    <>
      <header
        className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/95 px-3 sm:px-6 backdrop-blur-xs shadow-xs"
        dir="rtl"
      >
        {/* Dynamic Title & Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -mr-1 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 lg:hidden cursor-pointer"
            title="باز کردن منو"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="font-bold text-zinc-900">مکرر</span>
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-600 font-medium truncate max-w-[120px] sm:max-w-none">{pageTitle}</span>
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-zinc-900 tracking-tight mt-0.5 truncate max-w-[150px] sm:max-w-none">
              {pageTitle}
            </h1>
          </div>

          <span className="hidden lg:inline-flex bg-zinc-100 px-2.5 py-1 rounded text-zinc-600 font-mono text-xs">
            {todayPersian}
          </span>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Global Search Input (Triggers Command Palette) */}
          <div
            onClick={() => setIsPaletteOpen(true)}
            className="relative hidden md:flex items-center w-64 cursor-pointer"
          >
            <input
              type="text"
              readOnly
              placeholder="جستجو با Ctrl+K..."
              className="w-full pr-9 pl-12 py-1.5 text-xs bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-600 transition-all text-right cursor-pointer"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute right-2.5 top-2 pointer-events-none" />
            <span className="absolute left-2.5 top-1.5 px-1.5 py-0.5 rounded bg-zinc-200/70 text-zinc-600 text-[10px] font-mono">
              Ctrl+K
            </span>
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
            className="h-8 sm:h-9 px-2.5 sm:px-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 transition-all active:scale-95"
            title="ثبت تسک / خرید"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">ثبت تسک / خرید</span>
          </button>

          <div className="h-4 w-px bg-zinc-200 mx-1 hidden sm:block" />

          {/* User Profile & Settings / Logout */}
          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="flex items-center gap-2 hover:bg-zinc-50 p-1.5 rounded-lg transition-colors cursor-pointer group"
              title="تنظیمات حساب کاربری"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-orange-500/30 group-hover:ring-orange-500">
                {user?.full_name ? user.full_name.trim().charAt(0) : (user?.email?.charAt(0).toUpperCase() || "م")}
              </div>
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-zinc-900 leading-tight">
                  {user?.full_name || user?.email || "کاربر مکرر"}
                </span>
                <span className="text-[10px] text-zinc-500 leading-tight">
                  سطح دسترسی: {(user as any)?.role_title || (user as any)?.role || "کارمند"}
                </span>
              </div>
            </Link>

            <Link
              to="/settings"
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              title="تنظیمات و تغییر رمز"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <button
              onClick={() => logout()}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mr-1 cursor-pointer"
              title="خروج از سامانه"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  )
}
