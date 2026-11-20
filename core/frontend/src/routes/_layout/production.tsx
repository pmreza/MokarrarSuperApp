import { createFileRoute } from "@tanstack/react-router"
import { ProductionView } from "@/features/production/ProductionView"

export const Route = createFileRoute("/_layout/production")({
  component: ProductionView,
  head: () => ({
    meta: [
      {
        title: "تولید و گزارش شیفت | مکرر",
      },
    ],
  }),
})
