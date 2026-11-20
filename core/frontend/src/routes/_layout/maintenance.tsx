import { createFileRoute } from "@tanstack/react-router"
import { MaintenanceView } from "@/features/maintenance/MaintenanceView"

export const Route = createFileRoute("/_layout/maintenance")({
  component: MaintenanceView,
  head: () => ({
    meta: [
      {
        title: "تعمیرات و توقف خط (PM) | مکرر",
      },
    ],
  }),
})
