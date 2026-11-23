import { createFileRoute, redirect } from "@tanstack/react-router"
import { AppShell } from "@/layouts/AppShell"
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
  component: AppShell,
})
