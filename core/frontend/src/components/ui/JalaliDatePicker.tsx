import React, { useState, useRef, useEffect } from "react"
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Check, Clock } from "lucide-react"

interface JalaliDatePickerProps {
  value: string
  onChange: (val: string) => void
  label?: string
  placeholder?: string
}

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
]

const PERSIAN_WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"]

// Convert Latin digits to Persian digits
export const toPersianDigits = (num: number | string): string => {
  const p = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
  return String(num).replace(/\d/g, (d) => p[parseInt(d, 10)])
}

// Convert Persian digits to Latin
export const toLatinDigits = (str: string): string => {
  const p = "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩"
  const e = "01234567890123456789"
  return String(str).replace(/[\u06F0-\u06F9\u0660-\u0669]/g, (c) => e[p.indexOf(c)])
}

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  value,
  onChange,
  label = "مهلت تحویل (ددلاین)",
  placeholder = "۱۴۰۳/۰۹/۱۰",
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse current value or fallback
  const parseJalali = (valStr: string) => {
    const latin = toLatinDigits(valStr || "")
    const parts = latin.split("/").map((p) => parseInt(p, 10))
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return { year: parts[0], month: parts[1], day: parts[2] }
    }
    return { year: 1403, month: 9, day: 10 }
  }

  const initial = parseJalali(value)
  const [currentYear, setCurrentYear] = useState(initial.year)
  const [currentMonth, setCurrentMonth] = useState(initial.month) // 1 to 12

  // Close calendar popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Get total days in Jalali month
  const getDaysInMonth = (month: number, year: number) => {
    if (month <= 6) return 31
    if (month <= 11) return 30
    // Esfand (29 days or 30 in leap year)
    const isLeap = (year - 1399) % 4 === 0
    return isLeap ? 30 : 29
  }

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleSelectDay = (day: number) => {
    const formattedMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`
    const formattedDay = day < 10 ? `0${day}` : `${day}`
    const selected = `${currentYear}/${formattedMonth}/${formattedDay}`
    onChange(toPersianDigits(selected))
    setIsOpen(false)
  }

  const totalDays = getDaysInMonth(currentMonth, currentYear)
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1)

  // Quick preset options
  const handleQuickPreset = (daysFromNow: number) => {
    let y = currentYear
    let m = currentMonth
    let d = initial.day + daysFromNow
    const maxDays = getDaysInMonth(m, y)
    if (d > maxDays) {
      d = d - maxDays
      m += 1
      if (m > 12) {
        m = 1
        y += 1
      }
    }
    const formattedMonth = m < 10 ? `0${m}` : `${m}`
    const formattedDay = d < 10 ? `0${d}` : `${d}`
    onChange(toPersianDigits(`${y}/${formattedMonth}/${formattedDay}`))
    setIsOpen(false)
  }

  const currentSelectedParsed = parseJalali(value)

  return (
    <div className="relative space-y-1.5 text-right" dir="rtl" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-zinc-700 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-orange-600 font-normal">تقویم هجری شمسی</span>
        </label>
      )}

      {/* Input Field with Calendar Trigger */}
      <div className="relative group">
        <input
          type="text"
          value={value}
          readOnly
          onClick={() => setIsOpen((prev) => !prev)}
          placeholder={placeholder}
          className="w-full pr-10 pl-16 py-2.5 text-xs font-mono font-bold bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-200 hover:border-orange-400 rounded-xl cursor-pointer transition-all shadow-2xs outline-none"
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2.5 top-2.5 p-1 rounded-lg text-zinc-400 group-hover:text-orange-500 hover:bg-orange-50 transition-colors cursor-pointer"
          title="باز کردن تقویم شمسی"
        >
          <CalendarIcon className="w-4 h-4 text-orange-500" />
        </button>

        <span className="absolute left-3 top-2.5 text-[11px] font-bold text-zinc-400 font-sans pointer-events-none">
          انتخاب
        </span>
      </div>

      {/* Calendar Popup Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 right-0 w-72 bg-white rounded-2xl shadow-xl border border-zinc-200/90 p-4 animate-scale-in text-zinc-800">
          {/* Header Month / Year Navigator */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
              title="ماه بعد"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-zinc-900">
                {PERSIAN_MONTHS[currentMonth - 1]}
              </span>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                className="text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-0.5 outline-none cursor-pointer"
              >
                {[1403, 1404, 1405, 1406].map((yr) => (
                  <option key={yr} value={yr}>
                    {toPersianDigits(yr)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
              title="ماه قبل"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center py-2 text-[10px] font-bold text-zinc-400">
            {PERSIAN_WEEK_DAYS.map((wd, i) => (
              <span key={i} className={i === 6 ? "text-rose-500" : ""}>
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
            {daysArray.map((d) => {
              const isSelected =
                currentSelectedParsed.year === currentYear &&
                currentSelectedParsed.month === currentMonth &&
                currentSelectedParsed.day === d

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-orange-500 text-white shadow-xs scale-105"
                      : "text-zinc-700 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  {toPersianDigits(d)}
                </button>
              )
            })}
          </div>

          {/* Quick Preset Buttons */}
          <div className="pt-3 mt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickPreset(0)}
              className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 font-bold text-zinc-600 transition-colors cursor-pointer"
            >
              امروز
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(3)}
              className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 font-bold text-zinc-600 transition-colors cursor-pointer"
            >
              ۳ روز بعد
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(7)}
              className="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 font-bold text-zinc-600 transition-colors cursor-pointer"
            >
              ۱ هفته بعد
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
