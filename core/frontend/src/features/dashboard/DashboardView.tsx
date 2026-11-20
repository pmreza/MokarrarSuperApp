import React, { useEffect, useState } from "react"
import {
  Kanban,
  Clock,
  AlertTriangle,
  ShoppingCart,
  RefreshCw,
  FileSpreadsheet,
  Factory,
  Wrench,
  Truck,
  Bot,
} from "lucide-react"
import { Link } from "@tanstack/react-router"
import { StatCard } from "@/components/ui/StatCard"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { api } from "@/services/api"
import { toast } from "sonner"

export const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.dashboard.getKpis()
      setData(res)
    } catch (err) {
      console.error(err)
      toast.error("خطا در بارگذاری شاخص‌های داشبورد")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin ml-2" />
        در حال بارگذاری شاخص‌های سازمانی مکرر...
      </div>
    )
  }

  const tasks = data?.tasks || {}
  const procurement = data?.procurement || {}
  const inventory = data?.inventory || {}
  const activities = data?.activities || []

  return (
    <div className="space-y-6" dir="rtl">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="کل تسک‌های فاز ۱ (Plane)"
          value={tasks.total || 0}
          subtitle={`${tasks.done || 0} تکمیل شده`}
          icon={<Kanban className="w-5 h-5" />}
          trend={`${tasks.rate || 0}% تکمیل`}
          trendType="positive"
          colorClass="text-blue-600 bg-blue-50"
        />

        <StatCard
          title="تسک‌های در حال اجرا"
          value={tasks.in_progress || 0}
          subtitle="خطوط تولید و نگهداری"
          icon={<Clock className="w-5 h-5" />}
          trend="فوری و جاری"
          trendType="neutral"
          colorClass="text-amber-600 bg-amber-50"
        />

        <StatCard
          title="سفارش‌های در انتظار تایید (فاز ۲)"
          value={procurement.pending_count || 0}
          subtitle={`${(procurement.pending_amount_irr || 0).toLocaleString()} ریال`}
          icon={<ShoppingCart className="w-5 h-5" />}
          trend="تایید مدیران"
          trendType="negative"
          colorClass="text-purple-600 bg-purple-50"
        />

        <StatCard
          title="هشدارهای موجودی انبار (فاز ۳)"
          value={inventory.low_stock_count || 0}
          subtitle="اقلام زیر نقطه سفارش"
          icon={<AlertTriangle className="w-5 h-5" />}
          trend="اقدام به خرید"
          trendType={inventory.low_stock_count > 0 ? "negative" : "positive"}
          colorClass="text-rose-600 bg-rose-50"
        />
      </div>

      {/* Middle Section: Progress & Critical Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Progress & Phase Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">وضعیت اجرای فازهای سامانه مکرر</h3>
              <p className="text-xs text-slate-500 mt-0.5">پایش معماری یکپارچه بر بستر Plane + InvenTree + n8n</p>
            </div>
            <button
              onClick={loadData}
              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="بروزرسانی داده‌ها"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Phase 1 Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">فاز ۱: مدیریت تسک‌ها و وظایف عملیاتی (Plane Engine)</span>
              <span className="text-blue-600 font-mono">{tasks.rate || 0}% پیشرفت</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, tasks.rate || 0)}%` }}
              />
            </div>
          </div>

          {/* Phase 2 Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">فاز ۲: فرآیند تدارکات و خرید چندمرحله‌ای (Mokarrar Procurement)</span>
              <span className="text-purple-600 font-mono">فعال و آماده گردش کار</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full w-4/5" />
            </div>
          </div>

          {/* Phase 3 Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">فاز ۳: کنترل انبار و کاردکس کالا (InvenTree REST API)</span>
              <span className="text-emerald-600 font-mono">{inventory.total_sku || 0} قلم کالا ثبت شده</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full w-full" />
            </div>
          </div>

          {/* 1-Click Quick Exports Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-blue-900">مرکز صدور گزارش‌های رسمی شرکت</h4>
              <p className="text-[11px] text-blue-700 mt-0.5">دانلود اکسل و ورد راست‌چین وظایف، تدارکات و انبارداری</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => api.exports.downloadTasksExcel()}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>اکسل تسک‌ها</span>
              </button>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900">هشدارهای انبار مرکزی</h3>
            </div>
            <span className="text-xs px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full font-bold">
              {inventory.low_stock_count || 0} مورد
            </span>
          </div>

          <div className="space-y-3">
            {inventory.low_stock_items && inventory.low_stock_items.length > 0 ? (
              inventory.low_stock_items.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                      موجودی: {item.stock} {item.unit} (حداقل مجاز: {item.min})
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-1 bg-white text-rose-700 font-bold rounded-md border border-rose-200">
                    کسری انبار
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">موجودی تمام اقلام بالاتر از حد مجاز است.</p>
            )}
          </div>
        </div>
      </div>

      {/* Factory Floor & Operational Hub */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Factory className="w-5 h-5 text-indigo-400" />
              <span>پایش بلادرنگ سالن‌های تولید و ماژول‌های میدانی کارخانه</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              وضعیت زنده‌ی خطوط ۱ تا ۴، گزارشات توقف PM، برگه خروج و بات بله کارگران
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">سامانه متصل و آماده</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <Link
            to="/maintenance"
            className="p-3.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition-all group block"
          >
            <div className="flex items-center justify-between">
              <Wrench className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/20 text-rose-300 rounded font-bold">
                PM & توقف
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mt-2">تعمیرات و توقف خط</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">اعزام فوری تکنسین و ثبت MTTR</p>
          </Link>

          <Link
            to="/production"
            className="p-3.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition-all group block"
          >
            <div className="flex items-center justify-between">
              <Factory className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold">
                شیفت ۳ نوبته
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mt-2">تولید و کنترل ضایعات</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">راندمان خطوط و کارکرد شیفت‌ها</p>
          </Link>

          <Link
            to="/gatepass"
            className="p-3.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition-all group block"
          >
            <div className="flex items-center justify-between">
              <Truck className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">
                حراست
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mt-2">برگه خروج کالا (Gate Pass)</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">احراز QR در گیت حراست درب اصلی</p>
          </Link>

          <Link
            to="/bale-bot"
            className="p-3.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition-all group block"
          >
            <div className="flex items-center justify-between">
              <Bot className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">
                پیام‌رسان
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mt-2">بات بله پرسنل کارخانه</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">اتصال موبایل کارگران بدون نیاز به سیستم</p>
          </Link>
        </div>
      </div>

      {/* Bottom Section: Cross-System Unified Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">رویدادهای یکپارچه بین‌سیستمی (Plane + Core + InvenTree)</h3>
            <p className="text-xs text-slate-500 mt-0.5">لاگ زنده هماهنگی رویدادها، تغییر وضعیت تسک‌ها و ورود به انبار</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {activities.map((act: any) => (
            <div key={act.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                  {act.type === "PROCUREMENT" ? "خرید" : act.type === "TASK" ? "تسک" : "انبار"}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{act.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    توسط {act.user} • {act.time}
                  </p>
                </div>
              </div>
              <StatusBadge status={act.badge} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
