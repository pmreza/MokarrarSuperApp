import React from "react"
import { Calendar } from "lucide-react"

interface JalaliDatePickerProps {
  value: string
  onChange: (val: string) => void
  label?: string
  placeholder?: string
}

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  value,
  onChange,
  label = "تاریخ سررسید (شمسی)",
  placeholder = "۱۴۰۵/۰۳/۱۵",
}) => {
  const presets = [
    { label: "امروز", val: "۱۴۰۵/۰۳/۱۱" },
    { label: "۳ روز بعد", val: "۱۴۰۵/۰۳/۱۴" },
    { label: "پایان هفته", val: "۱۴۰۵/۰۳/۱۷" },
    { label: "پایان ماه", val: "۱۴۰۵/۰۳/۳۱" },
  ]

  return (
    <div className="space-y-1.5 text-right" dir="rtl">
      {label && <label className="block text-xs font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pr-10 pl-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
        />
        <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
      </div>
      <div className="flex gap-1.5 mt-1">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.val)}
            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
