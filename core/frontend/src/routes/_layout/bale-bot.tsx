import { createFileRoute } from "@tanstack/react-router"
import { BaleBotView } from "@/features/bots/BaleBotView"

export const Route = createFileRoute("/_layout/bale-bot")({
  component: BaleBotView,
  head: () => ({
    meta: [
      {
        title: "بات پیام‌رسان بله | مکرر",
      },
    ],
  }),
})
