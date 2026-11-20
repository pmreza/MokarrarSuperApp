import { createFileRoute } from "@tanstack/react-router"
import { DashboardView } from "@/features/dashboard/DashboardView"

export const Route = createFileRoute("/_layout/")({
  component: DashboardView,
  head: () => ({
    meta: [
      {
        title: "داشبورد مدیریتی مکرر",
      },
    ],
  }),
})
