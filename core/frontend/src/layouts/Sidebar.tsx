import React from "react"
import { Link, useLocation } from "@tanstack/react-router"
import {
  LayoutDashboard,
  Kanban,
  ShoppingCart,
  Warehouse,
  FileSpreadsheet,
  ShieldAlert,
  Activity,
  Wrench,
  Factory,
  Truck,
  Bot,
  UserCheck,
  X,
  Gauge,
} from "lucide-react"
import { getFilteredNavigation, type NavigationItem } from "@/config/navigation.config"
import { MokarrarLogo } from "@/components/ui/MokarrarLogo"
import useAuth from "@/hooks/useAuth"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  Kanban,
  ShoppingCart,
  Warehouse,
  FileSpreadsheet,
  ShieldAlert,
  Wrench,
  Factory,
  Truck,
  Bot,
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation()
  const { user } = useAuth()

  const navItems = getFilteredNavigation(
    (user as any)?.role || (user?.is_superuser ? "admin" : "staff"),
    (user as any)?.permissions_list || []
  )

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 w-72 bg-zinc-950 text-zinc-200 border-l border-zinc-800/80 flex flex-col h-screen select-none transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 lg:shrink-0 ${
        isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full lg:translate-x-0"
      }`}
      dir="rtl"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800/80 bg-zinc-950 shrink-0">
        <MokarrarLogo variant="light" size="sm" subtitle="مکرر بازآفرین • سامانه صنعتی" />
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-full font-bold">
            سامانه یکپارچه
          </span>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 lg:hidden cursor-pointer"
            title="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Industrial Unit Sub-badge */}
      <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center justify-between shrink-0">
        <span className="text-[10px] text-zinc-300 font-medium">واحد بازآفرینی پلیمر و ضایعات</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        <div className="px-3 pb-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          ماژول‌های عملیاتی کارخانه
        </div>

        {navItems.map((item: NavigationItem) => {
          const IconComponent = ICON_MAP[item.icon] || LayoutDashboard
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path)

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => onClose?.()}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all group ${
                isActive
                  ? "bg-zinc-800/90 text-white font-bold border-r-2 border-orange-500 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent
                  className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                    isActive ? "text-orange-500" : "text-zinc-500 group-hover:text-orange-400"
                  }`}
                />
                <span>{item.title}</span>
              </div>

              {item.phaseBadge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive
                      ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                      : item.phase === 1
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {item.phaseBadge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Session & Role Card */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 shrink-0">
        <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-200 font-bold truncate max-w-[130px]" title={user?.full_name || user?.email || ""}>
              {user?.full_name || user?.email || "کاربر مکرر"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">
              {(user as any)?.role_title || (user as any)?.role || "کارمند"}
            </span>
          </div>

          <div className="text-[11px] text-zinc-400">
            <div className="flex justify-between items-center">
              <span>شناسه کاربر:</span>
              <span className="text-zinc-300 font-mono text-[10px] truncate max-w-[110px]">{user?.email || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
