import { createFileRoute } from "@tanstack/react-router"
import { ReportsView } from "@/features/reports/ReportsView"

export const Route = createFileRoute("/_layout/reports")({
  component: ReportsView,
  head: () => ({
    meta: [
      {
        title: "مرکز صدور گزارشات رسمی | مکرر",
      },
    ],
  }),
})
