import React from "react"
import { Outlet } from "@tanstack/react-router"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { Toaster } from "sonner"

export const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* 1. Global Config-Driven Sidebar */}
      <Sidebar />

      {/* 2. Main Content Viewport */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Dynamic Context Header */}
        <Header />

        {/* Feature Child Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/60">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      <Toaster position="bottom-left" richColors closeButton />
    </div>
  )
}
