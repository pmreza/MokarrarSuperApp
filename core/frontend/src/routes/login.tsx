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
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/90 shadow-md">
        {/* Brand Header with Mokarrar Logo */}
        <div className="flex flex-col items-center gap-3 text-center mb-6">
          <MokarrarLogo variant="dark" size="md" subtitle="سامانه جامع یکپارچه مکرر بازآفرین" />
          <div className="mt-2">
            <h1 className="text-base font-bold text-zinc-900 tracking-tight">
              ورود به پورتال سازمانی
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              نام کاربری و رمز عبور اختصاصی خود را وارد نمایید
            </p>
          </div>
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
                        className="text-right text-xs pr-9 pl-3 h-10 rounded-xl bg-zinc-50 border-zinc-200"
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
                        className="text-right text-xs pr-9 pl-3 h-10 rounded-xl bg-zinc-50 border-zinc-200 font-mono"
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
              className="bg-orange-500 hover:bg-orange-600 text-white h-10 rounded-xl text-xs font-bold shadow-xs transition-all mt-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 ml-1.5" />
              ورود به سامانه
            </LoadingButton>

            {/* Signup / Register Link */}
            <div className="mt-3 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">حساب کاربری ندارید؟</span>
              <RouterLink
                to="/signup"
                className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>ثبت نام کاربر جدید</span>
              </RouterLink>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  )
}
export default Login
