import { createFileRoute } from "@tanstack/react-router"
import { TasksView } from "@/features/tasks/TasksView"

export const Route = createFileRoute("/_layout/tasks")({
  component: TasksView,
  head: () => ({
    meta: [
      {
        title: "مدیریت تسک‌ها و وظایف | مکرر",
      },
    ],
  }),
})
