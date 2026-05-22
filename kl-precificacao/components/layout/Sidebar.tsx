"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { logout } from "@/actions/auth"
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  BarChart3,
  LogOut,
  Zap,
  ChevronRight,
} from "lucide-react"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projetos", icon: FolderOpen, label: "Projetos" },
  { href: "/insumos", icon: Package, label: "Insumos" },
  { href: "/dre", icon: BarChart3, label: "Parâmetros DRE" },
]

interface SidebarProps {
  userName: string
  userRole: string
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#0f2744] text-white flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#f59e0b] flex-shrink-0">
          <Zap className="w-5 h-5 text-[#0f2744]" fill="currentColor" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight">KL Engenharia</p>
          <p className="text-[10px] text-blue-200/60 leading-tight truncate">Precificação</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                active
                  ? "bg-[#f59e0b] text-[#0f2744]"
                  : "text-blue-100/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5" />}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 border-t border-white/10 pt-4 space-y-1">
        <div className="px-3 py-2 rounded-xl bg-white/5">
          <p className="text-xs font-semibold text-white truncate">{userName}</p>
          <p className="text-[10px] text-blue-200/50 mt-0.5">
            {userRole === "ADMIN" ? "Administrador" : "Orçamentista"}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300/80 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
