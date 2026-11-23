import { zodResolver } from "@hookform/resolvers/zod"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { User, Lock, UserPlus, ArrowRight, ShieldCheck } from "lucide-react"

import type { UserRegister } from "@/client"
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

const formSchema = z
  .object({
    full_name: z.string().min(2, { message: "نام و نام خانوادگی الزامی است" }),
    email: z
      .string()
      .min(3, { message: "نام کاربری / شناسه پرسنلی حداقل ۳ کاراکتر است" }),
    password: z
      .string()
      .min(1, { message: "رمز عبور الزامی است" })
      .min(6, { message: "حداقل طول رمز عبور ۶ کاراکتر است" }),
    confirm_password: z
      .string()
      .min(1, { message: "تکرار رمز عبور الزامی است" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirm_password"],
  })

type FormData = z.infer<typeof formSchema>

export const Route = createFileRoute("/signup")({
  component: SignUp,
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
        title: "ثبت‌نام کاربر جدید | مکرر",
      },
    ],
  }),
})

function SignUp() {
  const { signUpMutation } = useAuth()
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (signUpMutation.isPending) return
    const payload: UserRegister = {
      email: data.email.trim(),
      password: data.password.trim(),
      full_name: data.full_name.trim(),
    }
    signUpMutation.mutate(payload)
  }

  return (
    <AuthLayout>
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200/90 shadow-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center mb-6">
          <MokarrarLogo variant="dark" size="md" subtitle="سامانه جامع یکپارچه مکرر بازآفرین" />
          <div className="mt-2">
            <h1 className="text-base font-bold text-zinc-900 tracking-tight">
              تعریف و ثبت‌نام حساب پرسنلی جدید
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              مشخصات خود را جهت عضویت در سامانه وارد نمایید
            </p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-3.5"
            dir="rtl"
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-zinc-700">نام و نام خانوادگی</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="مثال: علی احمدی"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-zinc-700">نام کاربری / شناسه پرسنلی</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="مثال: ahmadi یا ahmadi@mokarrar.ir"
                        className="text-right text-xs pr-9 pl-3 h-10 rounded-xl bg-zinc-50 border-zinc-200"
                        {...field}
                      />
                      <ShieldCheck className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
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
                  <FormLabel className="text-xs font-semibold text-zinc-700">رمز عبور</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <PasswordInput
                        placeholder="حداقل ۶ کاراکتر"
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

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-zinc-700">تکرار رمز عبور</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <PasswordInput
                        placeholder="تکرار دقیق رمز عبور"
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
              loading={signUpMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white h-10 rounded-xl text-xs font-bold shadow-xs transition-all mt-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 ml-1.5" />
              ثبت‌نام و ایجاد حساب
            </LoadingButton>

            {/* Back to Login Link */}
            <div className="mt-2 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">قبلاً حساب داشته‌اید؟</span>
              <RouterLink
                to="/login"
                className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
              >
                <span>ورود به سامانه</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </RouterLink>
            </div>
          </form>
        </Form>
      </div>
    </AuthLayout>
  )
}
export default SignUp
