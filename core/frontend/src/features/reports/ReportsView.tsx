import React from "react"
import {
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"

export const ReportsView: React.FC = () => {
  const handleExport = async (type: string, fn: () => Promise<void>) => {
    try {
      toast.info(`در حال آماده‌سازی و دانلود فایل ${type}...`)
      await fn()
      toast.success(`فایل ${type} با موفقیت دریافت گردید.`)
    } catch (err) {
      toast.error(`خطا در صدور فایل ${type}`)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold tracking-tight">مرکز صدور گزارش‌های رسمی سازمانی مکرر</h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تولید مکانیزه خروجی‌های رسمی در فرمت‌های مایکروسافت اکسل (.xlsx) با چیدمان راست‌چین (RTL) و مایکروسافت ورد (.docx) با سربرگ شرکتی، تاریخ‌های شمسی و استانداردهای چاپی.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>خروجی‌های مستقیم از پایگاه داده و موتورها</span>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Report Card 1: Tasks Excel */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">گزارش اکسل تسک‌ها و پروژه‌ها</h3>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md">
                  XLSX
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                شامل فهرست کامل تسک‌های Plane، وضعیت‌ها، تاریخ سررسید شمسی، مسئولان، و اولویت‌ها با جدول‌بندی رنگی راست‌چین.
              </p>
            </div>

            <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>پشتیبانی ۱۰۰٪ از راست‌چین (RTL)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>فرمت‌بندی فونت تاهوما و عرض خودکار ستون‌ها</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleExport("اکسل تسک‌ها", api.exports.downloadTasksExcel)}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود اکسل تسک‌ها (.xlsx)</span>
          </button>
        </div>

        {/* Report Card 2: Tasks Docx */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">گزارش مدیریتی ورد تسک‌ها</h3>
                <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md">
                  DOCX
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                سند رسمی قابل چاپ برای جلسات هیئت مدیره و سرپرستان کارگاه با سربرگ صنایع مکرر و استایل شرکتی.
              </p>
            </div>

            <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>سربرگ رسمی و عنوان شرکتی مکرر</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>جدول ساخت‌یافته مناسب چاپ A4</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleExport("ورد تسک‌ها", api.exports.downloadTasksDocx)}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود گزارش ورد (.docx)</span>
          </button>
        </div>

        {/* Report Card 3: Procurement Excel */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">گزارش مالی و تدارکات خرید</h3>
                <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-md">
                  XLSX
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ریز هزینه‌ها، مبالغ ریالی برآوردی، دپارتمان‌های متقاضی و وضعیت تاییدهای مدیران در فرآیند خرید.
              </p>
            </div>

            <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>تفکیک مبالغ ریالی و جمع کل</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>وضعیت پیشرفت پرداخت و تحویل کالا</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleExport("اکسل تدارکات", api.exports.downloadProcurementExcel)}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود اکسل تدارکات (.xlsx)</span>
          </button>
        </div>

        {/* Report Card 4: Inventory Excel */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">گزارش موجودی و کاردکس انبار</h3>
                <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md">
                  XLSX
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                موجودی کل قطعات در انبار مرکزی، کدهای IPN، محل استقرار قفسه‌ها و علامت‌گذاری خودکار اقلام دارای کسری.
              </p>
            </div>

            <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>برجسته ساختن رنگی اقلام زیر حد مجاز</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>مستخرج از دیتابیس InvenTree</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleExport("اکسل انبار", api.exports.downloadInventoryExcel)}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود اکسل موجودی انبار (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
