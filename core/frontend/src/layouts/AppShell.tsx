import React, { useState } from "react"
import { Outlet, Link, useLocation } from "@tanstack/react-router"
import {
  LayoutDashboard,
  Kanban,
  ShoppingCart,
  Warehouse,
  Menu,
} from "lucide-react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { Toaster } from "sonner"

export const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const mobileNavTabs = [
    { id: "dashboard", title: "داشبورد", path: "/", icon: LayoutDashboard },
    { id: "tasks", title: "تسک‌ها", path: "/tasks", icon: Kanban },
    { id: "procurement", title: "تدارکات", path: "/procurement", icon: ShoppingCart },
    { id: "inventory", title: "انبار", path: "/inventory", icon: Warehouse },
  ]

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* 1. Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 2. Global Config-Driven Sidebar (Desktop: static, Mobile: drawer) */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* 3. Main Content Viewport */}
      <div className="flex flex-col flex-1 min-w-0 h-dvh overflow-hidden">
        {/* Dynamic Context Header */}
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Feature Child Outlet */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 bg-slate-50/60 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto space-y-5">
            <Outlet />
          </div>
        </main>

        {/* 4. Mobile Bottom Navigation Bar (Appears on screens < lg) */}
        <nav
          className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-zinc-200 z-30 flex items-center justify-around px-2 lg:hidden shadow-lg"
          dir="rtl"
        >
          {mobileNavTabs.map((tab) => {
            const Icon = tab.icon
            const isActive =
              tab.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(tab.path)

            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors ${
                  isActive ? "text-orange-600 font-bold" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? "bg-orange-500/10 text-orange-600" : ""}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] leading-tight">{tab.title}</span>
              </Link>
            )
          })}

          {/* Menu button to open full drawer */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 gap-1 text-zinc-500 hover:text-zinc-900 cursor-pointer"
          >
            <div className="p-1 rounded-xl">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight">سایر منو</span>
          </button>
        </nav>
      </div>

      <Toaster position="bottom-left" richColors closeButton />
    </div>
  )
}
