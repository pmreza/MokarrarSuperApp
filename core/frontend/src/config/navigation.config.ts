export interface NavigationItem {
  id: string
  title: string
  path: string
  icon: string
  phase: 1 | 2 | 3
  phaseBadge?: string
  requiredPermission?: string
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
    requiredPermission: "dashboard:view",
    allowedRoles: [
      "admin",
      "managing_director",
      "office_manager",
      "production_manager",
      "ceo",
      "manager",
    ],
    description: "نمای کلی شاخص‌های کلیدی عملکرد و آمارهای سازمانی",
  },
  {
    id: "tasks",
    title: "مدیریت تسک‌ها و وظایف",
    path: "/tasks",
    icon: "Kanban",
    phase: 1,
    phaseBadge: "فاز ۱ (فعال)",
    requiredPermission: "tasks:view",
    allowedRoles: [
      "admin",
      "ceo",
      "line_supervisor",
      "warehouse_manager",
      "manager",
      "staff",
      "warehouse",
    ],
    description: "تخته کانبان، وضعیت تسک‌ها، تخصیص نیروها و پیگیری وظایف",
  },
  {
    id: "procurement",
    title: "تدارکات و فرآیند خرید",
    path: "/procurement",
    icon: "ShoppingCart",
    phase: 2,
    phaseBadge: "فاز ۲",
    requiredPermission: "procurement:view",
    allowedRoles: [
      "admin",
      "ceo",
      "line_supervisor",
      "procurement_officer",
      "manager",
      "warehouse_manager",
      "staff",
    ],
    description: "درخواست‌های خرید، تایید مدیران، پرداخت و گردش کار خودکار",
  },
  {
    id: "inventory",
    title: "انبار و مدیریت موجودی",
    path: "/inventory",
    icon: "Warehouse",
    phase: 3,
    phaseBadge: "فاز ۳",
    requiredPermission: "inventory:view",
    allowedRoles: [
      "admin",
      "ceo",
      "warehouse_manager",
      "line_supervisor",
      "warehouse",
      "manager",
    ],
    description: "کاردکس کالاها، کنترل موجودی، ورود و خروج قطعات و هشدار کسری",
  },
  {
    id: "reports",
    title: "مرکز گزارشات و خروجی‌ها",
    path: "/reports",
    icon: "FileSpreadsheet",
    phase: 1,
    requiredPermission: "reports:view",
    allowedRoles: [
      "admin",
      "ceo",
      "warehouse_manager",
      "procurement_officer",
      "manager",
      "line_supervisor",
    ],
    description: "تولید و دانلود گزارش‌های رسمی Excel (راست‌چین) و Word",
  },
  {
    id: "admin",
    title: "مدیریت کاربران و دسترسی",
    path: "/admin",
    icon: "ShieldAlert",
    phase: 1,
    requiredPermission: "users:manage",
    allowedRoles: ["admin"],
    description: "تعریف کاربران، نقش‌ها و سطوح دسترسی",
  },
]

export function getFilteredNavigation(
  userRole: string = "staff",
  userPermissions: string[] = []
): NavigationItem[] {
  return NAVIGATION_CONFIG.filter((item) => {
    if (userRole === "admin") return true
    if (item.requiredPermission && userPermissions.includes(item.requiredPermission)) {
      return true
    }
    return item.allowedRoles.includes(userRole)
  })
}
