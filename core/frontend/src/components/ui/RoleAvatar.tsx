import React from "react"
import {
  Terminal,
  Crown,
  Briefcase,
  Factory,
  Cpu,
  FlaskConical,
  ShieldCheck,
  Wrench,
  HardHat,
  UserCheck,
} from "lucide-react"

interface RoleAvatarProps {
  role?: string
  name?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const ROLE_AVATAR_MAP: Record<
  string,
  {
    file: string
    ring: string
    badgeBg: string
    Icon: React.ComponentType<{ className?: string }>
  }
> = {
  admin: {
    file: "admin",
    ring: "ring-orange-500/80",
    badgeBg: "bg-zinc-900 text-orange-400 border-orange-500/50",
    Icon: Terminal,
  },
  managing_director: {
    file: "managing_director",
    ring: "ring-amber-500/80",
    badgeBg: "bg-amber-600 text-white border-amber-300",
    Icon: Crown,
  },
  ceo: {
    file: "managing_director",
    ring: "ring-amber-500/80",
    badgeBg: "bg-amber-600 text-white border-amber-300",
    Icon: Crown,
  },
  office_manager: {
    file: "office_manager",
    ring: "ring-blue-500/70",
    badgeBg: "bg-blue-600 text-white border-blue-300",
    Icon: Briefcase,
  },
  manager: {
    file: "office_manager",
    ring: "ring-blue-500/70",
    badgeBg: "bg-blue-600 text-white border-blue-300",
    Icon: Briefcase,
  },
  production_manager: {
    file: "production_manager",
    ring: "ring-orange-600/80",
    badgeBg: "bg-orange-600 text-white border-orange-300",
    Icon: Factory,
  },
  line_supervisor: {
    file: "production_manager",
    ring: "ring-orange-600/80",
    badgeBg: "bg-orange-600 text-white border-orange-300",
    Icon: Factory,
  },
  it_supervisor: {
    file: "it_supervisor",
    ring: "ring-cyan-500/75",
    badgeBg: "bg-cyan-700 text-white border-cyan-300",
    Icon: Cpu,
  },
  rd_environment: {
    file: "rd_environment",
    ring: "ring-emerald-500/75",
    badgeBg: "bg-emerald-700 text-white border-emerald-300",
    Icon: FlaskConical,
  },
  qc_supervisor: {
    file: "qc_supervisor",
    ring: "ring-indigo-500/75",
    badgeBg: "bg-indigo-700 text-white border-indigo-300",
    Icon: ShieldCheck,
  },
  maintenance_supervisor: {
    file: "maintenance_supervisor",
    ring: "ring-amber-600/75",
    badgeBg: "bg-amber-700 text-white border-amber-300",
    Icon: Wrench,
  },
  warehouse_manager: {
    file: "maintenance_supervisor",
    ring: "ring-amber-600/75",
    badgeBg: "bg-amber-700 text-white border-amber-300",
    Icon: Wrench,
  },
  admin_staff: {
    file: "admin_staff",
    ring: "ring-zinc-400/70",
    badgeBg: "bg-zinc-700 text-white border-zinc-400",
    Icon: UserCheck,
  },
  procurement_officer: {
    file: "admin_staff",
    ring: "ring-zinc-400/70",
    badgeBg: "bg-zinc-700 text-white border-zinc-400",
    Icon: UserCheck,
  },
  warehouse: {
    file: "admin_staff",
    ring: "ring-zinc-400/70",
    badgeBg: "bg-zinc-700 text-white border-zinc-400",
    Icon: UserCheck,
  },
  worker: {
    file: "worker",
    ring: "ring-zinc-500/70",
    badgeBg: "bg-zinc-800 text-zinc-200 border-zinc-500",
    Icon: HardHat,
  },
  staff: {
    file: "worker",
    ring: "ring-zinc-500/70",
    badgeBg: "bg-zinc-800 text-zinc-200 border-zinc-500",
    Icon: HardHat,
  },
}

export const RoleAvatar: React.FC<RoleAvatarProps> = ({
  role = "worker",
  name = "کاربر",
  size = "md",
  className = "",
}) => {
  const cfg = ROLE_AVATAR_MAP[role] || ROLE_AVATAR_MAP.worker
  const { Icon } = cfg

  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  }[size]

  const badgeSizes = {
    sm: "w-3.5 h-3.5 -bottom-0.5 -left-0.5",
    md: "w-4 h-4 -bottom-0.5 -left-0.5",
    lg: "w-5 h-5 -bottom-0.5 -left-0.5",
  }[size]

  const iconSizes = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  }[size]

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <img
        src={`/assets/avatars/${cfg.file}.svg`}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover ring-2 ${cfg.ring} shadow-xs bg-zinc-900`}
      />
      <span
        className={`absolute ${badgeSizes} rounded-full border flex items-center justify-center shadow-xs ${cfg.badgeBg}`}
      >
        <Icon className={iconSizes} />
      </span>
    </div>
  )
}
