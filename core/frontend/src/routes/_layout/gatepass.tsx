import { createFileRoute } from "@tanstack/react-router"
import { GatePassView } from "@/features/gatepass/GatePassView"

export const Route = createFileRoute("/_layout/gatepass")({
  component: GatePassView,
  head: () => ({
    meta: [
      {
        title: "برگه خروج و گیت‌پاس | مکرر",
      },
    ],
  }),
})
