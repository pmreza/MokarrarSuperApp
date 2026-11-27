import { createFileRoute } from "@tanstack/react-router"
import ChangePassword from "@/components/UserSettings/ChangePassword"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import UserInformation from "@/components/UserSettings/UserInformation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAuth from "@/hooks/useAuth"
import { User, KeyRound, ShieldAlert } from "lucide-react"

const tabsConfig = [
  { value: "password", title: "تغییر رمز عبور", icon: KeyRound, component: ChangePassword },
  { value: "my-profile", title: "مشخصات حساب", icon: User, component: UserInformation },
  { value: "danger-zone", title: "مدیریت حساب", icon: ShieldAlert, component: DeleteAccount },
]

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
  head: () => ({
    meta: [
      {
        title: "تنظیمات کاربری و امنیت | مکرر",
      },
    ],
  }),
})

function UserSettings() {
  const { user: currentUser } = useAuth()
  const finalTabs = currentUser?.is_superuser
    ? tabsConfig.slice(0, 3)
    : tabsConfig.slice(0, 2)

  if (!currentUser) {
    return null
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200/90 shadow-xs card-interactive">
        <h1 className="text-base font-black text-zinc-900 tracking-tight">
          تنظیمات حساب کاربری و امنیت
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          مشاهده مشخصات پرسنلی، نقش سازمانی و تغییر رمز عبور اختصاصی
        </p>
      </div>

      <Tabs defaultValue="password" className="space-y-4">
        <TabsList className="bg-zinc-100 p-1 rounded-xl">
          {finalTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-orange-600 shadow-2xs"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.title}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {finalTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <tab.component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
export default UserSettings
