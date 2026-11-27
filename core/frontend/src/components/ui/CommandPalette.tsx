import React, { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  Search,
  LayoutDashboard,
  Kanban,
  ShoppingCart,
  Warehouse,
  FileSpreadsheet,
  X,
  Plus,
  ArrowRight,
} from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // Open handled by parent or state
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const actions = [
    {
      id: "dashboard",
      title: "داشبورد مدیریتی کارخانه",
      subtitle: "مشاهده شاخص‌های عملکردی و پایش خطوط تولید",
      icon: LayoutDashboard,
      path: "/",
      category: "صفحات اصلی",
    },
    {
      id: "tasks",
      title: "وظایف و کانبان صنعتی",
      subtitle: "برد کانبان تسک‌های نگهداری، تعمیرات و تولید",
      icon: Kanban,
      path: "/tasks",
      category: "صفحات اصلی",
    },
    {
      id: "procurement",
      title: "تدارکات و درخواست‌های خرید (PR)",
      subtitle: "گردش کار تایید چندمرحله‌ای و اتصال به مالی",
      icon: ShoppingCart,
      path: "/procurement",
      category: "صفحات اصلی",
    },
    {
      id: "inventory",
      title: "انبارداری و کاردکس قطعات یدکی",
      subtitle: "کنترل موجودی انبار، نقطه سفارش و قطعات بحرانی",
      icon: Warehouse,
      path: "/inventory",
      category: "صفحات اصلی",
    },
    {
      id: "reports",
      title: "مرکز گزارشات و صدور اسناد",
      subtitle: "خروجی اسناد رسمی، فاکتورها و اکسل‌های تحلیلی",
      icon: FileSpreadsheet,
      path: "/reports",
      category: "صفحات اصلی",
    },
    {
      id: "export-tasks",
      title: "دانلود خروجی اکسل تسک‌ها",
      subtitle: "دریافت فایل اکسل رسمی تمام تسک‌های کارخانه",
      icon: FileSpreadsheet,
      category: "عملیات سریع",
      action: () => {
        api.exports.downloadTasksExcel()
        toast.success("خروجی اکسل در حال آماده‌سازی است")
        onClose()
      },
    },
    {
      id: "new-task",
      title: "ثبت تسک جدید در خط تولید",
      subtitle: "افزودن تسک و تخصیص مستقیم به کارگران",
      icon: Plus,
      path: "/tasks",
      category: "عملیات سریع",
    },
  ]

  const filtered = actions.filter(
    (a) =>
      a.title.includes(query) ||
      a.subtitle.includes(query) ||
      a.category.includes(query)
  )

  const handleSelect = (action: typeof actions[0]) => {
    if (action.action) {
      action.action()
    } else if (action.path) {
      navigate({ to: action.path })
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-zinc-100 gap-3">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="جستجو در بخش‌ها، تسک‌ها، انبار یا دستورات..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors text-right group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 group-hover:bg-orange-50 group-hover:text-orange-600 text-zinc-600 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 font-medium">
                    {item.category}
                  </span>
                </button>
              )
            })
          ) : (
            <div className="py-8 text-center text-xs text-zinc-400">
              نتیجه‌ای برای جستجوی شما یافت نشد.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
          <span>انتخاب با Enter • بستن با Esc</span>
          <span className="font-mono">سامانه مکرر</span>
        </div>
      </div>
    </div>
  )
}
