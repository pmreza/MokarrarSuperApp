import { createFileRoute } from "@tanstack/react-router"
import { ProcurementView } from "@/features/procurement/ProcurementView"

export const Route = createFileRoute("/_layout/procurement")({
  component: ProcurementView,
  head: () => ({
    meta: [
      {
        title: "فرآیند تدارکات و خرید | مکرر",
      },
    ],
  }),
})
