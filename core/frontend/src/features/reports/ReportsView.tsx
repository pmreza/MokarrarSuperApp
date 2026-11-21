import React, { useState } from "react"
import {
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle,
  ShieldCheck,
  Sparkles,
  Printer,
  X,
  Eye,
} from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"
import { MokarrarLogo } from "@/components/ui/MokarrarLogo"

export const ReportsView: React.FC = () => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleExport = async (type: string, fn: () => Promise<void>) => {
    try {
      toast.info(`در حال آماده‌سازی و دانلود فایل ${type}...`)
      await fn()
      toast.success(`فایل ${type} با موفقیت دریافت گردید.`)
    } catch (err) {
      toast.error(`خطا در صدور فایل ${type}`)
    }
  }

  const todayPersian = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="bg-zinc-950 text-white p-6 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-bold tracking-tight">مرکز صدور گزارش‌های رسمی سازمانی مکرر</h2>
            </div>
            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              تولید مکانیزه خروجی‌های رسمی در فرمت‌های مایکروسافت اکسل (.xlsx) با چیدمان راست‌چین (RTL)، مایکروسافت ورد (.docx) با سربرگ شرکتی و پیش‌نمایش چاپی اسناد.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-orange-500/25 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>پیش‌نمایش سند رسمی چاپی</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Report Card 1: Tasks Excel */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">گزارش اکسل تسک‌ها و پروژه‌ها</h3>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md">
                  XLSX
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                شامل کلیه وظایف محوله در خط تولید، وضعیت پیشرفت، مجری و اولویت‌ها با فونت رسمی فارسی.
              </p>
            </div>

            <ul className="text-xs text-zinc-600 space-y-1.5 pt-2 border-t border-zinc-100">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>کاملاً سازگار با نرم‌افزار مایکروسافت اکسل</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>همگام با موتور مدیریت وظایف Plane</span>
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

        {/* Report Card 2: Executive Word Doc */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">گزارش رسمی مدیریتی کارخانه</h3>
                <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md">
                  DOCX
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                سند رسمی ورد با سربرگ شرکتی مکرر، جداول خلاصه وضعیت تولید، تدارکات و انبار جهت ارائه به مدیرعامل.
              </p>
            </div>

            <ul className="text-xs text-zinc-600 space-y-1.5 pt-2 border-t border-zinc-100">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>سربرگ، پانویس و شماره صفحه رسمی</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>محل امضای مدیران فنی و اجرایی</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleExport("سند رسمی ورد", api.exports.downloadTasksDocx)}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود سند رسمی ورد (.docx)</span>
          </button>
        </div>

        {/* Report Card 3: Procurement Excel */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">گزارش تدارکات و خریدهای جاری</h3>
                <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-800 font-bold rounded-md">
                  XLSX
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                ریز درخواست‌های خرید ثبت‌شده، مبالغ ریالی، تاییدکنندگان مالی و وضعیت سفارشات قطعات خطوط.
              </p>
            </div>

            <ul className="text-xs text-zinc-600 space-y-1.5 pt-2 border-t border-zinc-100">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-orange-600" />
                <span>گردش مالی و مبالغ تامین کالا</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-orange-600" />
                <span>وضعیت پیشرفت پرداخت و تحویل کالا</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleExport("اکسل تدارکات", api.exports.downloadProcurementExcel)}
            className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود اکسل تدارکات (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Official Print Preview Modal (Step 17) */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="h-16 px-6 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Printer className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold">پیش‌نمایش سند رسمی چاپی مکرر</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>پرینت سند</span>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable Paper Look) */}
            <div className="p-8 overflow-y-auto bg-zinc-100 flex justify-center">
              <div className="w-full max-w-2xl bg-white p-10 rounded-2xl shadow-md border border-zinc-200 text-zinc-900 space-y-6">
                {/* Official Letterhead */}
                <div className="flex items-center justify-between border-b-2 border-orange-500 pb-5">
                  <MokarrarLogo variant="dark" size="lg" />
                  <div className="text-left text-xs font-mono space-y-1">
                    <div>شماره سند: <span className="font-bold">MOK-1405-PR-8812</span></div>
                    <div>تاریخ صدور: <span className="font-bold">{todayPersian}</span></div>
                    <div>طبقه بندی: <span className="font-bold text-orange-600">محرمانه داخلی</span></div>
                  </div>
                </div>

                <div className="text-center py-2">
                  <h2 className="text-lg font-black text-zinc-900">فرم رسمی تاییدیه تدارکات و تخصیص قطعات خط تولید</h2>
                  <p className="text-xs text-zinc-500 mt-1">مجتمع صنعتی مکرر • واحد هماهنگی عملیات و انبار مرکزی</p>
                </div>

                {/* Items Table */}
                <table className="w-full text-right text-xs border border-zinc-200">
                  <thead className="bg-zinc-100 text-zinc-700">
                    <tr>
                      <th className="p-2 border border-zinc-200">ردیف</th>
                      <th className="p-2 border border-zinc-200">شرح قطعه / کالا</th>
                      <th className="p-2 border border-zinc-200">تعداد / مقدار</th>
                      <th className="p-2 border border-zinc-200">دپارتمان متقاضی</th>
                      <th className="p-2 border border-zinc-200">وضعیت انبار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono text-[11px]">
                    <tr>
                      <td className="p-2 border border-zinc-200 text-center font-sans">۱</td>
                      <td className="p-2 border border-zinc-200 font-sans font-bold">روغن هیدرولیک صنعتی HLP 46</td>
                      <td className="p-2 border border-zinc-200">۸ بشکه ۲۰۸ لیتری</td>
                      <td className="p-2 border border-zinc-200 font-sans">نگهداری خط ۱</td>
                      <td className="p-2 border border-zinc-200 text-rose-600 font-bold font-sans">کسری (نقطه سفارش)</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-zinc-200 text-center font-sans">۲</td>
                      <td className="p-2 border border-zinc-200 font-sans font-bold">بلبرینگ تماس زاویه‌ای SKF 7210</td>
                      <td className="p-2 border border-zinc-200">۱۲ عدد</td>
                      <td className="p-2 border border-zinc-200 font-sans">اکستروژن B</td>
                      <td className="p-2 border border-zinc-200 text-emerald-600 font-bold font-sans">موجود در انبار</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-zinc-200 text-center font-sans">۳</td>
                      <td className="p-2 border border-zinc-200 font-sans font-bold">ترموکوپل سنسور حرارتی تیپ K</td>
                      <td className="p-2 border border-zinc-200">۲۰ شاخه</td>
                      <td className="p-2 border border-zinc-200 font-sans">ابزار دقیق</td>
                      <td className="p-2 border border-zinc-200 text-amber-600 font-bold font-sans">در حال استعلام</td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures Area */}
                <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs">
                  <div className="p-3 border border-dashed border-zinc-300 rounded-xl">
                    <span className="font-bold text-zinc-700">مدیر فنی و مهندسی</span>
                    <div className="h-12 flex items-center justify-center text-zinc-400 text-[10px]">امضا و تایید شده</div>
                  </div>
                  <div className="p-3 border border-dashed border-zinc-300 rounded-xl">
                    <span className="font-bold text-zinc-700">مدیر بازرگانی و خرید</span>
                    <div className="h-12 flex items-center justify-center text-zinc-400 text-[10px]">امضا و تایید شده</div>
                  </div>
                  <div className="p-3 border border-dashed border-zinc-300 rounded-xl">
                    <span className="font-bold text-zinc-700">مدیر کارخانه مکرر</span>
                    <div className="h-12 flex items-center justify-center text-orange-600 font-bold text-[10px]">تایید نهایی مدیریت</div>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 text-center pt-2">
                  این سند به صورت خودکار توسط سامانه یکپارچه مکرر تولید گردیده و فاقد خط‌خوردگی دارای اعتبار رسمی است.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
