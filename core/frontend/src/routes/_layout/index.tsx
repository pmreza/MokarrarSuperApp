import { createFileRoute, Navigate } from "@tanstack/react-router"
import { DashboardView } from "@/features/dashboard/DashboardView"
import useAuth from "@/hooks/useAuth"

function DashboardOrTasks() {
  const { user } = useAuth()

  if (!user) return null

  const perms: string[] = (() => {
    try {
      const raw = (user as any)?.permissions
      if (Array.isArray(raw)) return raw
      if (typeof raw === "string") return JSON.parse(raw)
    } catch {}
    return []
  })()

  const role = (user as any)?.role || "staff"
  const canViewDashboard =
    Boolean(user?.is_superuser) ||
    perms.includes("dashboard:view") ||
    ["admin", "managing_director", "office_manager", "production_manager", "ceo", "manager"].includes(role)

  if (!canViewDashboard) {
    return <Navigate to="/tasks" replace />
  }

  return <DashboardView />
}

export const Route = createFileRoute("/_layout/")({
  component: DashboardOrTasks,
  head: () => ({
    meta: [
      {
        title: "داشبورد مدیریتی مکرر",
      },
    ],
  }),
})
