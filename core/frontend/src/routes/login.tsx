import { zodResolver } from "@hookform/resolvers/zod"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Shield, User, Lock, ArrowRight, UserCheck, KeyRound } from "lucide-react"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { AuthLayout } from "@/components/Common/AuthLayout"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

const formSchema = z.object({
  username: z.string().min(1, { message: "نام کاربری یا شناسه کاربری الزامی است" }),
  password: z
    .string()
    .min(1, { message: "رمز عبور الزامی است" })
    .min(6, { message: "حداقل طول رمز عبور ۶ کاراکتر است" }),
})

type FormData = z.infer<typeof formSchema>

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: "ورود به سامانه یکپارچه مکرر",
      },
    ],
  }),
})

function Login() {
  const { loginMutation } = useAuth()
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data as any)
  }

  const handleQuickLogin = (username: string, pass: string) => {
    form.setValue("username", username)
    form.setValue("password", pass)
    loginMutation.mutate({ username, password: pass } as any)
  }

  return (
    <AuthLayout>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          dir="rtl"
        >
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              ورود به سامانه یکپارچه مکرر
            </h1>
            <p className="text-xs text-zinc-500">
              نام کاربری و رمز عبور اختصاصی خود را وارد نمایید
            </p>
          </div>

          <div className="grid gap-3.5">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-zinc-700">نام کاربری / شناسه پرسنلی</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="مثال: admin@mokarrar.com یا ceo یا supervisor"
                        className="text-right text-xs pr-9 pl-3 h-10 rounded-xl"
                        {...field}
                      />
                      <User className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-semibold text-zinc-700">رمز عبور</FormLabel>
                    <span className="text-[11px] text-zinc-400">
                      امنیت بالا
                    </span>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <PasswordInput
                        placeholder="رمز عبور شما"
                        className="text-right text-xs pr-9 pl-3 h-10 rounded-xl"
                        {...field}
                      />
                      <Lock className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <LoadingButton
              type="submit"
              loading={loginMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white h-10 rounded-xl text-xs font-bold shadow-xs transition-all mt-1"
            >
              ورود به سامانه
            </LoadingButton>
          </div>

          {/* Quick Demo Switcher / Preset Roles */}
          <div className="mt-2 pt-3 border-t border-zinc-200/80">
            <span className="text-[11px] font-bold text-zinc-500 block mb-2 text-center">
              انتخاب سریع حساب کاربری پیش‌فرض سازمانی:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@mokarrar.com", "MokarrarAdmin2026!")}
                className="col-span-2 p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold flex items-center justify-between transition-colors cursor-pointer text-[11px]"
              >
                <span>⚡ مدیر ارشد سامانه (برنامه‌نویس)</span>
                <span className="font-mono text-[10px] text-zinc-400">تمام دسترسی‌ها</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("ceo", "MokarrarCeo2026!")}
                className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/60 font-semibold flex items-center justify-between transition-colors cursor-pointer text-[11px]"
              >
                <span>👔 مدیرعامل</span>
                <span className="font-mono text-[9px] text-orange-600">تایید و گزارش</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("supervisor", "MokarrarLine2026!")}
                className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold flex items-center justify-between transition-colors cursor-pointer text-[11px]"
              >
                <span>🏭 مسئول خط تولید</span>
                <span className="font-mono text-[9px] text-zinc-500">تسک و خط</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("warehouse", "MokarrarStore2026!")}
                className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold flex items-center justify-between transition-colors cursor-pointer text-[11px]"
              >
                <span>📦 مسئول انبار</span>
                <span className="font-mono text-[9px] text-zinc-500">کاردکس</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("technician", "MokarrarTech2026!")}
                className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold flex items-center justify-between transition-colors cursor-pointer text-[11px]"
              >
                <span>🔧 تکنسین خط</span>
                <span className="font-mono text-[9px] text-zinc-500">وظایف فنی</span>
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-zinc-400 mt-1">
            ثبت‌نام عمومی غیرفعال است • حساب‌های کاربری منحصراً توسط مدیر سیستم ایجاد می‌شوند
          </div>
        </form>
      </Form>
    </AuthLayout>
  )
}
export default Login
