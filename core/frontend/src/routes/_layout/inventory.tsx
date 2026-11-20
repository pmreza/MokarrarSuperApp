import { createFileRoute } from "@tanstack/react-router"
import { InventoryView } from "@/features/inventory/InventoryView"

export const Route = createFileRoute("/_layout/inventory")({
  component: InventoryView,
  head: () => ({
    meta: [
      {
        title: "انبارداری و موجودی کالا | مکرر",
      },
    ],
  }),
})
