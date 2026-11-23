import { MokarrarLogo } from "@/components/ui/MokarrarLogo"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-slate-50 text-slate-900" dir="rtl">
      {/* 1. Left Industrial Brand Showcase (Desktop) */}
      <div className="relative hidden lg:flex flex-col items-center justify-center bg-zinc-950 p-12 overflow-hidden border-l border-zinc-800">
        <div className="absolute inset-0 bg-radial from-orange-500/10 via-transparent to-transparent opacity-60" />
        <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-md">
          <MokarrarLogo variant="light" size="lg" subtitle="سامانه جامع یکپارچه مکرر بازآفرین" />
          <div className="space-y-2 mt-4 text-xs text-zinc-400 leading-relaxed font-sans">
            <p className="font-semibold text-zinc-300">
              مدیریت هوشمند خطوط بازآفرینی پلیمر، تدارکات و انبارداری صنعتی
            </p>
            <p className="text-[11px] text-zinc-500">
              دستور کارها، زنجیره تامین، نظارت لحظه‌ای اسکادا و کنترل دسترسی سازمانی (RBAC)
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 text-orange-400 border border-orange-500/20 text-[11px] font-mono mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            سیستم ابری نسخه ۲.۴ متصل
          </div>
        </div>
      </div>

      {/* 2. Right Form Viewport */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 md:p-12">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
