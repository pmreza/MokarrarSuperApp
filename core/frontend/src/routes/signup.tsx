import { createFileRoute, redirect, Link as RouterLink } from "@tanstack/react-router"
import { AuthLayout } from "@/components/Common/AuthLayout"
import { ShieldAlert, ArrowRight } from "lucide-react"

export const Route = createFileRoute("/signup")({
  component: SignUpDisabled,
  beforeLoad: async () => {
    throw redirect({
      to: "/login",
    })
  },
  head: () => ({
    meta: [
      {
        title: "ثبت نام غیرفعال است | مکرر",
      },
    ],
  }),
})

function SignUpDisabled() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-4 text-center p-6 bg-white rounded-2xl border border-zinc-200 shadow-sm" dir="rtl">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-lg font-bold text-zinc-900">
          ثبت‌نام عمومی در سامانه مکرر غیرفعال است
        </h1>

        <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
          حساب‌های کاربری و سطوح دسترسی کارکنان، مدیران خطوط و انبار منحصراً توسط مدیر ارشد سامانه (برنامه‌نویس) صادر و تحویل داده می‌شود.
        </p>

        <RouterLink
          to="/login"
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <span>بازگشت به صفحه ورود</span>
          <ArrowRight className="w-4 h-4" />
        </RouterLink>
      </div>
    </AuthLayout>
  )
}
export default SignUpDisabled
