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
  dreExercicio?: string
  dreSummary?: string
}

export function Sidebar({ userName, userRole, dreExercicio, dreSummary }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="relative flex w-60 min-h-screen flex-shrink-0 flex-col bg-dark text-white"
      style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />

      {/* Marca */}
      <div className="relative flex items-center gap-3 px-5 py-5">
        <Image
          src="/kl-logo.png"
          alt="KL Engenharia"
          width={34}
          height={34}
          className="flex-shrink-0 rounded-md"
        />
        <div className="min-w-0 leading-tight">
          <p className="text-[13px] font-semibold tracking-[-0.01em] text-white">KL Engenharia</p>
          <p className="text-[10px] text-white/35">Elétrica · Precificação</p>
        </div>
      </div>

      <div className="mx-5 h-px bg-white/[0.08]" />

      {/* Navegação */}
      <nav className="relative flex flex-1 flex-col gap-0.5 px-3 pt-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors",
                active
                  ? "bg-white/[0.07] font-medium text-white"
                  : "font-normal text-white/55 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-brand"
                  aria-hidden
                />
              )}
              <Icon
                className={cn(
                  "h-[17px] w-[17px] flex-shrink-0 transition-colors",
                  active ? "text-brand-bright" : "text-white/45 group-hover:text-white/80"
                )}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* DRE vigente */}
      <div className="relative mx-3 mb-3 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium text-white/45">DRE vigente</p>
          <span className="num text-[12px] font-medium text-brand-bright">
            {dreExercicio ?? "—"}
          </span>
        </div>
        <p className="num text-[11px] leading-relaxed text-white/40">
          {dreSummary ?? "—"}
        </p>
      </div>

      <div className="mx-5 h-px bg-white/[0.08]" />

      {/* Usuário + sair */}
      <div className="relative flex flex-col gap-1 px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-brand text-[13px] font-semibold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-white">{userName}</p>
            <p className="text-[10px] text-white/35">
              {userRole === "ADMIN" ? "Administrador" : "Orçamentista"}
            </p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[12px] font-medium text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white/80"
          >
            <LogOut className="h-[15px] w-[15px] flex-shrink-0" />
            <span>Sair da conta</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
