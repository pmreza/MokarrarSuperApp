import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { KeyRound, ShieldCheck } from "lucide-react"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import { api } from "@/services/api"
import { toast } from "sonner"

const formSchema = z
  .object({
    current_password: z
      .string()
      .min(1, { message: "رمز عبور فعلی الزامی است" })
      .min(6, { message: "حداقل طول رمز عبور ۶ کاراکتر است" }),
    new_password: z
      .string()
      .min(1, { message: "رمز عبور جدید الزامی است" })
      .min(6, { message: "حداقل طول رمز عبور جدید ۶ کاراکتر است" }),
    confirm_password: z
      .string()
      .min(1, { message: "تکرار رمز عبور الزامی است" }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "رمز عبور جدید با تکرار آن همخوانی ندارد",
    path: ["confirm_password"],
  })

type FormData = z.infer<typeof formSchema>

const ChangePassword = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    criteriaMode: "all",
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.users.updatePasswordMe(data.current_password, data.new_password),
    onSuccess: () => {
      toast.success("رمز عبور شما با موفقیت تغییر یافت و ذخیره شد.")
      form.reset()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "خطا در تغییر رمز عبور")
    },
  })

  const onSubmit = async (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="max-w-md bg-white p-6 rounded-2xl border border-zinc-200/90 shadow-xs" dir="rtl">
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-zinc-100">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-900">تغییر رمز عبور حساب کاربری</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            رمز عبور اولیه اهدایی را تغییر داده و رمزی مطمئن انتخاب فرمایید.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="current_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-zinc-700">رمز عبور فعلی</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="رمز عبور فعلی"
                    className="text-right text-xs h-10 rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="new_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-zinc-700">رمز عبور جدید</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="حداقل ۶ کاراکتر"
                    className="text-right text-xs h-10 rounded-xl"
                    {...field}
                  />
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
                <FormLabel className="text-xs font-semibold text-zinc-700">تکرار رمز عبور جدید</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="تکرار رمز عبور جدید"
                    className="text-right text-xs h-10 rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <div className="pt-2">
            <LoadingButton
              type="submit"
              loading={mutation.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold h-10 transition-all cursor-pointer shadow-xs"
            >
              ثبت و تغییر قطعی رمز عبور
            </LoadingButton>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default ChangePassword
