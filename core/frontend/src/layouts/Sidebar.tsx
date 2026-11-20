import React from "react"
import { Link, useLocation } from "@tanstack/react-router"
import {
  LayoutDashboard,
  Kanban,
  ShoppingCart,
  Warehouse,
  FileSpreadsheet,
  ShieldAlert,
  Layers,
  Activity,
  Wrench,
  Factory,
  Truck,
  Bot,
} from "lucide-react"
import { getFilteredNavigation, type NavigationItem } from "@/config/navigation.config"

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

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const navItems = getFilteredNavigation("admin") // Can be read from auth context

  return (
    <aside
      className="w-64 shrink-0 bg-slate-900 text-slate-200 border-l border-slate-800 flex flex-col h-screen select-none z-40"
      dir="rtl"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-black tracking-tight text-white">مُـکَـرَّر</h2>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md font-mono">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">سوپراپ یکپارچه صنعتی</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          ماژول‌های عملیاتی
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
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"
                  }`}
                />
                <span>{item.title}</span>
              </div>

              {item.phaseBadge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive
                      ? "bg-white/20 text-white"
                      : item.phase === 1
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {item.phaseBadge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* System Status Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              وضعیت یکپارچگی
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              سالم
            </span>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>هسته Plane:</span>
              <span className="text-slate-300 font-mono">متصل</span>
            </div>
            <div className="flex justify-between">
              <span>انبار InvenTree:</span>
              <span className="text-slate-300 font-mono">متصل</span>
            </div>
            <div className="flex justify-between">
              <span>اتوماسیون n8n:</span>
              <span className="text-slate-300 font-mono">آماده</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
