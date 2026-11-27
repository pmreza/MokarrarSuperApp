import { zodResolver } from "@hookform/resolvers/zod"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Shield, User, Lock, ArrowRight, UserPlus, LogIn } from "lucide-react"

import type { Body_login_login_access_token as AccessToken } from "@/client"
import { AuthLayout } from "@/components/Common/AuthLayout"
import { MokarrarLogo } from "@/components/ui/MokarrarLogo"
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

  return (
    <AuthLayout>
      <div className="bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-zinc-200/90 shadow-xl shadow-zinc-900/5 transition-all">
        {/* Brand Header: Pure Mokarrar Logo Only */}
        <div className="flex justify-center mb-8">
          <MokarrarLogo variant="dark" size="lg" showSubtitle={false} />
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            dir="rtl"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-zinc-700">نام کاربری / شناسه پرسنلی</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="مثال: admin@mokarrar.com یا شناسه سازمانی"
                        className="text-right text-sm sm:text-xs pr-9 pl-3 h-11 sm:h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:bg-white transition-colors"
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
                  </div>
                  <FormControl>
                    <div className="relative">
                      <PasswordInput
                        placeholder="رمز عبور شما"
                        className="text-right text-sm sm:text-xs pr-9 pl-10 h-11 sm:h-10 rounded-xl bg-zinc-50 border-zinc-200 font-mono placeholder:font-sans focus:bg-white transition-colors"
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
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white h-11 rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all mt-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 ml-2" />
              ورود به سامانه
            </LoadingButton>

            {/* Corporate Closed Registration Notice */}
            <div className="mt-4 pt-4 border-t border-zinc-100/80 text-center">
              <span className="text-xs text-zinc-500">
                حساب‌های کاربری صرفاً توسط مدیر سیستم تخصیص می‌یابند
              </span>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  )
}

export default Login
