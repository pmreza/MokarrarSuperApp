import React from "react"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { Search, Bell, User, LogOut, ShieldCheck, ChevronDown } from "lucide-react"
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

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white/95 px-6 backdrop-blur-xs shadow-2xs" dir="rtl">
      {/* Dynamic Title & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>مکرر</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">{pageTitle}</span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">{pageTitle}</h1>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search Input */}
        <div className="relative hidden md:block w-64">
          <input
            type="text"
            placeholder="جستجوی سریع در سامانه..."
            className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-right"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="اعلان‌های سازمانی"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pr-2 mr-1 border-r border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            م
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-800">مدیر سیستم مکرر</p>
            <div className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500">مدیر ارشد (Admin)</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer mr-1"
            title="خروج از حساب کاربری"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
