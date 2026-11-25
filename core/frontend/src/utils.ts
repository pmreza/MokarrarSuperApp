import { AxiosError } from "axios"

const PERSIAN_ERROR_MAP: Record<string, string> = {
  "Incorrect email or password":
    "نام کاربری یا رمز عبور واردشده صحیح نیست. لطفاً مجدداً بررسی فرمایید.",
  "Inactive user":
    "حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سامانه تماس بگیرید.",
  "Not enough permissions":
    "شما دسترسی لازم برای انجام این عملیات را ندارید.",
  "Could not validate credentials":
    "اعتبار نشست کاربری شما منقضی شده است. لطفاً دوباره وارد شوید.",
  "User not found":
    "کاربر مورد نظر در سامانه یافت نشد.",
  "The user with this email already exists in the system.":
    "کاربری با این ایمیل یا شناسه قبلاً در سامانه ثبت شده است.",
  "Incorrect password":
    "رمز عبور فعلی واردشده نادرست است.",
  "New password cannot be the same as the current one":
    "رمز عبور جدید نمی‌تواند با رمز عبور فعلی یکسان باشد.",
  "Network Error":
    "ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.",
}

function localizeErrorMessage(raw: string, status?: number): string {
  const trimmed = (raw || "").trim()
  if (PERSIAN_ERROR_MAP[trimmed]) {
    return PERSIAN_ERROR_MAP[trimmed]
  }
  for (const [key, fa] of Object.entries(PERSIAN_ERROR_MAP)) {
    if (trimmed.toLowerCase().includes(key.toLowerCase())) {
      return fa
    }
  }
  if (status === 401) {
    return "نشست کاربری شما نامعتبر یا منقضی شده است. لطفاً مجدداً وارد شوید."
  }
  if (status === 403) {
    return "دسترسی شما برای انجام این عملیات محدود شده است."
  }
  if (status === 404) {
    return "اطلاعات یا صفحه درخواستی یافت نشد."
  }
  if (status && status >= 500) {
    return "خطای موقت در سرور رخ داد. لطفاً چند لحظه دیگر تلاش فرمایید."
  }
  // If already Persian, return cleanly; otherwise provide clean fallback
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return trimmed
  }
  return "در انجام عملیات خطایی رخ داد. لطفاً اطلاعات ورودی را بررسی کرده و دوباره تلاش کنید."
}

function extractErrorMessage(err: Error): string {
  if (err instanceof AxiosError) {
    const status = err.response?.status
    const errDetail = (err.response?.data as any)?.detail
    if (Array.isArray(errDetail) && errDetail.length > 0) {
      return localizeErrorMessage(String(errDetail[0].msg || ""), status)
    }
    if (typeof errDetail === "string") {
      return localizeErrorMessage(errDetail, status)
    }
    return localizeErrorMessage(err.message, status)
  }
  return localizeErrorMessage(err.message)
}

export const handleError = function (this: (msg: string) => void, err: Error) {
  const errorMessage = extractErrorMessage(err)
  this(errorMessage)
}

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}
