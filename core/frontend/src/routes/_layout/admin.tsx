import React, { useState, useEffect } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  KeyRound,
  RefreshCw,
  Search,
  Lock,
  User,
  Sliders,
  Check,
} from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"
import { Modal } from "@/components/ui/Modal"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/admin")({
  component: AdminUserManagement,
  head: () => ({
    meta: [
      {
        title: "مدیریت کاربران و تعیین دسترسی‌ها | مکرر",
      },
    ],
  }),
})

interface RoleMeta {
  id: string
  title: string
  default_permissions: string[]
}

interface PermMeta {
  id: string
  name: string
  category: string
}

export function AdminUserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Roles & Permissions Metadata
  const [rolesMeta, setRolesMeta] = useState<RoleMeta[]>([])
  const [permsMeta, setPermsMeta] = useState<PermMeta[]>([])

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  // Add Form State
  const [addUsername, setAddUsername] = useState("")
  const [addFullName, setAddFullName] = useState("")
  const [addPassword, setAddPassword] = useState("")
  const [addRole, setAddRole] = useState("staff")
  const [addLocation, setAddLocation] = useState("central_office")
  const [addPermissions, setAddPermissions] = useState<string[]>([])

  // Edit Form State
  const [editFullName, setEditFullName] = useState("")
  const [editRole, setEditRole] = useState("staff")
  const [editLocation, setEditLocation] = useState("central_office")
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [editIsActive, setEditIsActive] = useState(true)
  const [editNewPassword, setEditNewPassword] = useState("")

  // Location filter state
  const [selectedLocation, setSelectedLocation] = useState("all")

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersRes, metaRes] = await Promise.all([
        api.users.list(),
        api.users.getRolesMetadata(),
      ])
      setUsers(usersRes.data || [])
      setRolesMeta(metaRes.roles || [])
      setPermsMeta(metaRes.permissions || [])
    } catch (err: any) {
      console.error(err)
      toast.error("خطا در بارگذاری اطلاعات کاربران و نقش‌ها")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle Preset Role Selection in Add Dialog
  const handleRoleChangeForAdd = (newRole: string) => {
    setAddRole(newRole)
    const roleDef = rolesMeta.find((r) => r.id === newRole)
    if (roleDef) {
      setAddPermissions([...roleDef.default_permissions])
    }
  }

  // Handle Preset Role Selection in Edit Dialog
  const handleRoleChangeForEdit = (newRole: string) => {
    setEditRole(newRole)
    const roleDef = rolesMeta.find((r) => r.id === newRole)
    if (roleDef) {
      setEditPermissions([...roleDef.default_permissions])
    }
  }

  const togglePermissionForAdd = (permId: string) => {
    setAddPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    )
  }

  const togglePermissionForEdit = (permId: string) => {
    setEditPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    )
  }

  // Open Edit Modal
  const openEditModal = (u: any) => {
    setSelectedUser(u)
    setEditFullName(u.full_name || "")
    setEditRole(u.role || "staff")
    setEditLocation(u.location || "central_office")
    setEditPermissions(u.permissions_list || [])
    setEditIsActive(u.is_active ?? true)
    setEditNewPassword("")
    setIsEditOpen(true)
  }

  // Submit Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addUsername.trim() || !addPassword.trim()) {
      toast.error("نام کاربری و رمز عبور الزامی است.")
      return
    }

    try {
      setSubmitting(true)
      await api.users.create({
        email: addUsername.trim(),
        full_name: addFullName.trim() || undefined,
        password: addPassword.trim(),
        role: addRole,
        location: addLocation,
        permissions: JSON.stringify(addPermissions),
        is_active: true,
      })
      toast.success(`کاربر ${addFullName || addUsername} با موفقیت ایجاد شد.`)
      setIsAddOpen(false)
      setAddUsername("")
      setAddFullName("")
      setAddPassword("")
      setAddRole("staff")
      setAddLocation("central_office")
      setAddPermissions([])
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "خطا در ایجاد کاربر")
    } finally {
      setSubmitting(false)
    }
  }

  // Submit Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      setSubmitting(true)
      const payload: Record<string, any> = {
        full_name: editFullName.trim(),
        role: editRole,
        location: editLocation,
        permissions: JSON.stringify(editPermissions),
        is_active: editIsActive,
      }
      if (editNewPassword.trim()) {
        payload.password = editNewPassword.trim()
      }

      await api.users.update(selectedUser.id, payload)
      toast.success("اطلاعات و دسترسی‌های کاربر بروزرسانی شد.")
      setIsEditOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "خطا در بروزرسانی کاربر")
    } finally {
      setSubmitting(false)
    }
  }

  // Submit Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return
    try {
      setSubmitting(true)
      await api.users.delete(selectedUser.id)
      toast.success("کاربر با موفقیت حذف گردید.")
      setIsDeleteOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "خطا در حذف کاربر")
    } finally {
      setSubmitting(false)
    }
  }

  // Group permissions by category safely
  const categories = Array.from(new Set((permsMeta || []).map((p) => p?.category).filter(Boolean)))

  const isAdmin = currentUser?.is_superuser || (currentUser as any)?.role === "admin"

  if (!loading && currentUser && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-zinc-200 text-center gap-4 shadow-xs" dir="rtl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-zinc-900">
          دسترسی محدود شده است
        </h2>
        <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
          مدیریت کاربران، صدور نقش‌ها و تخصیص سطوح دسترسی منحصراً در اختیار مدیر ارشد سامانه (برنامه‌نویس) می‌باشد.
        </p>
      </div>
    )
  }

  const filteredUsers = (users || []).filter((u) => {
    if (selectedLocation !== "all" && (u.location || "central_office") !== selectedLocation) {
      return false
    }
    const q = search.toLowerCase()
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.role_title || "").toLowerCase().includes(q) ||
      (u.location_title || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/90 shadow-xs card-interactive">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 border border-orange-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-zinc-900 tracking-tight">
                مدیریت کاربران و سطوح دسترسی ریزدانه (RBAC)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200/60">
                کنترل اختصاصی مدیر سیستم
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              تعریف نام کاربری، تعیین شعبه سازمانی (دفتر مرکزی، ماهشهر، قزوین)، نقش‌های پیش‌فرض و مجوزهای اختصاصی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              handleRoleChangeForAdd("staff")
              setIsAddOpen(true)
            }}
            className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all btn-pressable cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>تعریف کاربر جدید</span>
          </button>
          <button
            onClick={loadData}
            className="h-10 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="بروزرسانی لیست"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Filter & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="جستجوی نام، نام کاربری یا نقش..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="w-full text-right text-xs pr-9 pl-3 h-9 rounded-lg bg-zinc-50 border border-zinc-200"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 font-medium focus:bg-white focus:border-orange-500 transition-colors cursor-pointer"
          >
            <option value="all">محل خدمت: همه موقعیت‌ها</option>
            <option value="central_office">🏢 دفتر مرکزی</option>
            <option value="mahshahr_plant">🏭 کارخانه ماهشهر</option>
            <option value="qazvin_plant">🏭 کارخانه قزوین</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
          <span>کل کاربران: <strong className="text-zinc-900 font-mono">{users.length}</strong></span>
          <span>کاربران فعال: <strong className="text-emerald-600 font-mono">{users.filter((u) => u.is_active).length}</strong></span>
          <span>مدیران سیستم: <strong className="text-orange-600 font-mono">{users.filter((u) => u.role === "admin" || u.is_superuser).length}</strong></span>
        </div>
      </div>

      {/* 3. Users Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-zinc-50/90 text-zinc-500 font-bold border-b border-zinc-200 text-[11px]">
              <tr>
                <th className="py-3.5 px-5">کاربر و نام کامل</th>
                <th className="py-3.5 px-4">نام کاربری / شناسه</th>
                <th className="py-3.5 px-4">محل خدمت / شعبه</th>
                <th className="py-3.5 px-4">نقش سازمانی</th>
                <th className="py-3.5 px-4">دسترسی‌های فعال</th>
                <th className="py-3.5 px-4 text-center">وضعیت</th>
                <th className="py-3.5 px-5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const perms = u.permissions_list || []
                  const isCurrent = currentUser?.id === u.id
                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-orange-500/20">
                            {u.full_name ? u.full_name.trim().charAt(0) : u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 block">
                              {u.full_name || "بدون نام"}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-orange-600 font-semibold">
                                (حساب کاربری شما)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-600 font-semibold">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4">
                        {(() => {
                          const loc = u.location || "central_office"
                          const locMap: Record<string, { label: string; badge: string }> = {
                            central_office: { label: "🏢 دفتر مرکزی", badge: "bg-blue-50 text-blue-700 border-blue-200" },
                            mahshahr_plant: { label: "🏭 کارخانه ماهشهر", badge: "bg-orange-50 text-orange-700 border-orange-200" },
                            qazvin_plant: { label: "🏭 کارخانه قزوین", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                          }
                          const item = locMap[loc] || locMap.central_office
                          return (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.badge}`}>
                              {item.label}
                            </span>
                          )
                        })()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {u.role_title || u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-mono font-bold text-[10px] border border-orange-200/60">
                            {perms.length} مجوز فعال
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            فعال
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                            غیرفعال
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                            title="ویرایش نقش و دسترسی‌ها"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => {
                                setSelectedUser(u)
                                setIsDeleteOpen(true)
                              }}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="حذف کاربر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    {loading ? "در حال بارگذاری..." : "هیچ کاربری یافت نشد."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: Create New User */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="تعریف کاربر جدید و تنظیم دسترسی‌ها"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-4" dir="rtl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                نام کاربری / شناسه ورود <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: ceo یا modir_khat یا rezaei"
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-right"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                placeholder="مثال: مهندس علی احمدی"
                value={addFullName}
                onChange={(e) => setAddFullName(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                رمز عبور اولیه <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="حداقل ۶ کاراکتر (کاربر می‌تواند در پنل خود تغییر دهد)"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-right font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                محل خدمت سازمانی
              </label>
              <select
                value={addLocation}
                onChange={(e) => setAddLocation(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-right font-bold"
              >
                <option value="central_office">🏢 دفتر مرکزی</option>
                <option value="mahshahr_plant">🏭 کارخانه ماهشهر</option>
                <option value="qazvin_plant">🏭 کارخانه قزوین</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              انتخاب الگوی نقش پیش‌فرض سازمانی
            </label>
            <select
              value={addRole}
              onChange={(e) => handleRoleChangeForAdd(e.target.value)}
              className="w-full h-9 px-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-right font-bold"
            >
              {rolesMeta.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          {/* Granular Permissions Checkboxes */}
          <div className="pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-600" />
                تعیین و سفارشی‌سازی مجوزهای ریزدانه این کاربر:
              </span>
              <span className="text-[11px] font-mono text-orange-600 font-bold">
                {addPermissions.length} مجوز انتخاب‌شده
              </span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
              {categories.map((cat) => {
                const catPerms = permsMeta.filter((p) => p.category === cat)
                return (
                  <div key={cat} className="space-y-1.5">
                    <span className="text-[11px] font-bold text-zinc-600 block pb-1 border-b border-zinc-200">
                      {cat}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catPerms.map((perm) => {
                        const checked = addPermissions.includes(perm.id)
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              checked
                                ? "bg-orange-50 border-orange-300 text-orange-950 font-semibold"
                                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermissionForAdd(perm.id)}
                              className="accent-orange-600 rounded"
                            />
                            <span>{perm.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {submitting ? "در حال ایجاد..." : "ایجاد کاربر و ثبت مجوزها"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. MODAL: Edit User & Permissions */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`ویرایش کاربر و مجوزها: ${selectedUser?.full_name || selectedUser?.email}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4" dir="rtl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-right"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                محل خدمت سازمانی
              </label>
              <select
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-right font-bold"
              >
                <option value="central_office">🏢 دفتر مرکزی</option>
                <option value="mahshahr_plant">🏭 کارخانه ماهشهر</option>
                <option value="qazvin_plant">🏭 کارخانه قزوین</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              الگوی نقش پیش‌فرض سازمانی
            </label>
            <select
              value={editRole}
              onChange={(e) => handleRoleChangeForEdit(e.target.value)}
              className="w-full h-9 px-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-right font-bold"
            >
              {rolesMeta.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                تغییر/ریست رمز عبور (در صورت تمایل)
              </label>
              <input
                type="text"
                placeholder="برای عدم تغییر خالی بگذارید"
                value={editNewPassword}
                onChange={(e) => setEditNewPassword(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-right font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="accent-orange-600 w-4 h-4 rounded"
                />
                <span>حساب کاربری فعال باشد</span>
              </label>
            </div>
          </div>

          {/* Granular Permissions Checkboxes */}
          <div className="pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-600" />
                سفارشی‌سازی مستقیم مجوزها:
              </span>
              <span className="text-[11px] font-mono text-orange-600 font-bold">
                {editPermissions.length} مجوز فعال
              </span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
              {categories.map((cat) => {
                const catPerms = permsMeta.filter((p) => p.category === cat)
                return (
                  <div key={cat} className="space-y-1.5">
                    <span className="text-[11px] font-bold text-zinc-600 block pb-1 border-b border-zinc-200">
                      {cat}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catPerms.map((perm) => {
                        const checked = editPermissions.includes(perm.id)
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              checked
                                ? "bg-orange-50 border-orange-300 text-orange-950 font-semibold"
                                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermissionForEdit(perm.id)}
                              className="accent-orange-600 rounded"
                            />
                            <span>{perm.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {submitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. MODAL: Delete User Confirmation */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="تأیید حذف کاربر"
        maxWidth="md"
      >
        <div className="space-y-4" dir="rtl">
          <p className="text-xs text-zinc-600 leading-relaxed">
            آیا از حذف کامل کاربر <strong className="text-zinc-900">{selectedUser?.full_name || selectedUser?.email}</strong> با شناسه پرسنلی <strong className="font-mono text-orange-600">{selectedUser?.email}</strong> اطمینان دارید؟ این عملیات قابل بازگشت نیست.
          </p>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={submitting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {submitting ? "در حال حذف..." : "بله، کاربر حذف شود"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
export default AdminUserManagement
