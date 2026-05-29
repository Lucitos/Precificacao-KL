"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { logout } from "@/actions/auth"
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  BarChart3,
  LogOut,
  ChevronRight,
} from "lucide-react"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projetos", icon: FolderOpen, label: "Projetos" },
  { href: "/insumos", icon: Package, label: "Insumos" },
  { href: "/dre", icon: BarChart3, label: "Parâm. DRE" },
]

interface SidebarProps {
  userName: string
  userRole: string
  dreExercicio?: string
  dreSummary?: string
}

export function Sidebar({ userName, userRole, dreExercicio, dreSummary }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-60 min-h-screen flex-shrink-0" style={{ background: "#071D27" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-[22px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Image
          src="/kl-logo.png"
          alt="KL Engenharia"
          width={38}
          height={38}
          className="rounded-xl flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-[13px] font-extrabold text-white tracking-[0.01em] leading-tight">KL ENGENHARIA</p>
          <p className="text-[9px] font-bold leading-tight uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.3)" }}>
            ELÉTRICA · PRECIFICAÇÃO
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 pb-2 flex flex-col gap-0.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] px-2 mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
          Menu principal
        </p>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                active
                  ? "font-bold text-white"
                  : "hover:text-white"
              )}
              style={active
                ? { background: "#E87722", color: "#fff" }
                : { color: "rgba(255,255,255,0.5)" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)"
                  e.currentTarget.style.color = "#fff"
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent"
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)"
                }
              }}
            >
              <Icon className="w-[17px] h-[17px] flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* DRE badge */}
      <div className="mx-3.5 mb-3 p-3 rounded-xl" style={{ background: "rgba(232,119,34,0.1)", border: "1px solid rgba(232,119,34,0.2)" }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#E87722" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: "rgba(255,255,255,0.4)" }}>DRE Vigente</p>
        </div>
        <p className="text-[18px] font-extrabold tracking-[-0.01em]" style={{ color: "#F5A623" }}>
          {dreExercicio ?? "2025"}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
          {dreSummary ?? "CF 20.08% · CV 0.94% · Sal 0.84%"}
        </p>
      </div>

      {/* User + Logout */}
      <div className="px-3 pb-3 flex flex-col gap-1" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-extrabold text-white flex-shrink-0"
            style={{ background: "#E87722" }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-white truncate">{userName}</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              {userRole === "ADMIN" ? "Administrador" : "Orçamentista"}
            </p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150"
            style={{ color: "rgba(255,255,255,0.3)", background: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(248,113,113,0.1)"
              e.currentTarget.style.color = "#F87171"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "rgba(255,255,255,0.3)"
            }}
          >
            <LogOut className="w-[15px] h-[15px] flex-shrink-0" />
            <span>Sair da conta</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
