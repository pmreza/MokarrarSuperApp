import React, { useState } from "react"
import { Search, FileSpreadsheet, FileText, ChevronRight, ChevronLeft } from "lucide-react"

export interface Column<T> {
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  title?: string
  subtitle?: string
  searchPlaceholder?: string
  searchKey?: keyof T
  onExportExcel?: () => void
  onExportDocx?: () => void
  actions?: React.ReactNode
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  title,
  subtitle,
  searchPlaceholder = "جستجو در جدول...",
  searchKey,
  onExportExcel,
  onExportDocx,
  actions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filteredData = data.filter((row) => {
    if (!searchTerm) return true
    if (searchKey) {
      return String(row[searchKey] || "").toLowerCase().includes(searchTerm.toLowerCase())
    }
    return Object.values(row).some((val) =>
      String(val || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden" dir="rtl">
      {/* Table Header Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
        <div>
          {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              placeholder={searchPlaceholder}
              className="w-full pr-9 pl-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>

          {/* Export Action Buttons */}
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              title="دریافت فایل اکسل راست‌چین"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>خروجی اکسل</span>
            </button>
          )}

          {onExportDocx && (
            <button
              onClick={onExportDocx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              title="دریافت گزارش رسمی Word"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>خروجی ورد</span>
            </button>
          )}

          {actions}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-100/60 text-slate-600 text-xs font-semibold">
              <th className="py-3 px-4 w-12 text-center">ردیف</th>
              {columns.map((col, idx) => (
                <th key={idx} className={`py-3 px-4 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400 text-xs">
                  هیچ موردی جهت نمایش یافت نشد.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-center text-xs text-slate-400 font-mono">
                    {(page - 1) * pageSize + rIdx + 1}
                  </td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`py-3 px-4 ${col.className || ""}`}>
                      {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? "") : "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/20">
        <div>
          نمایش {(page - 1) * pageSize + 1} تا {Math.min(page * pageSize, filteredData.length)} از{" "}
          {filteredData.length} رکورد
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">
            صفحه {page} از {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
