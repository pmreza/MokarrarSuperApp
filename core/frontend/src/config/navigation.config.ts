export interface NavigationItem {
  id: string
  title: string
  path: string
  icon: string
  phase: 1 | 2 | 3
  phaseBadge?: string
  allowedRoles: string[]
  description?: string
}

export const NAVIGATION_CONFIG: NavigationItem[] = [
  {
    id: "dashboard",
    title: "داشبورد مدیریتی",
    path: "/",
    icon: "LayoutDashboard",
    phase: 1,
    allowedRoles: ["admin", "manager", "staff", "warehouse"],
    description: "نمای کلی شاخص‌های کلیدی عملکرد و آمارهای سازمانی",
  },
  {
    id: "tasks",
    title: "مدیریت تسک‌ها و وظایف",
    path: "/tasks",
    icon: "Kanban",
    phase: 1,
    phaseBadge: "فاز ۱ (فعال)",
    allowedRoles: ["admin", "manager", "staff", "warehouse"],
    description: "تخته کانبان، وضعیت تسک‌ها، تخصیص نیروها و پیگیری وظایف",
  },
  {
    id: "procurement",
    title: "تدارکات و فرآیند خرید",
    path: "/procurement",
    icon: "ShoppingCart",
    phase: 2,
    phaseBadge: "فاز ۲",
    allowedRoles: ["admin", "manager", "staff"],
    description: "درخواست‌های خرید، تایید مدیران، پرداخت و گردش کار خودکار",
  },
  {
    id: "inventory",
    title: "انبار و مدیریت موجودی",
    path: "/inventory",
    icon: "Warehouse",
    phase: 3,
    phaseBadge: "فاز ۳",
    allowedRoles: ["admin", "manager", "warehouse"],
    description: "کاردکس کالاها، کنترل موجودی، ورود و خروج قطعات و هشدار کسری",
  },
  {
    id: "reports",
    title: "مرکز گزارشات و خروجی‌ها",
    path: "/reports",
    icon: "FileSpreadsheet",
    phase: 1,
    allowedRoles: ["admin", "manager", "staff", "warehouse"],
    description: "تولید و دانلود گزارش‌های رسمی Excel (راست‌چین) و Word",
  },
  {
    id: "admin",
    title: "مدیریت کاربران و دسترسی",
    path: "/admin",
    icon: "ShieldAlert",
    phase: 1,
    allowedRoles: ["admin"],
    description: "تعریف کاربران، نقش‌ها و سطوح دسترسی",
  },
]

export function getFilteredNavigation(userRole: string = "staff"): NavigationItem[] {
  return NAVIGATION_CONFIG.filter((item) => {
    if (userRole === "admin") return true
    return item.allowedRoles.includes(userRole)
  })
}
