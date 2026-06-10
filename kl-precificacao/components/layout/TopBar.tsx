"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { UserMenu } from "./UserMenu"
import { LayoutDashboard, FolderOpen, Package, BarChart3, Filter } from "lucide-react"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projetos", icon: FolderOpen, label: "Projetos" },
  { href: "/insumos", icon: Package, label: "Insumos" },
  { href: "/funil", icon: Filter, label: "Funil" },
  { href: "/dre", icon: BarChart3, label: "Parâmetros DRE" },
]

interface TopBarProps {
  userName: string
  userRole: string
  dreExercicio?: string
  dreSummary?: string
}

export function TopBar({ userName, userRole, dreExercicio, dreSummary }: TopBarProps) {
  const pathname = usePathname()

  return (
    <header className="z-30 flex-shrink-0 border-b border-line bg-paper">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-5 px-8">
        {/* Marca */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
          <Image src="/kl-logo.png" alt="KL Engenharia" width={28} height={28} className="rounded-md" />
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-ink">KL Engenharia</span>
        </Link>

        <span className="h-5 w-px flex-shrink-0 bg-line" />

        {/* Navegação */}
        <nav className="flex h-14 items-center gap-0.5 overflow-x-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full items-center gap-2 whitespace-nowrap px-3 text-[13px] transition-colors",
                  active ? "font-medium text-ink" : "text-ink-soft hover:text-ink"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-brand" : "text-muted-fg")} />
                {label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" aria-hidden />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Ações à direita */}
        <div className="ml-auto flex flex-shrink-0 items-center gap-3">
          <Link
            href="/dre"
            title={dreSummary}
            className="hidden h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-[12px] text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink md:inline-flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            DRE <span className="num text-ink">{dreExercicio ?? "—"}</span>
          </Link>
          <UserMenu userName={userName} userRole={userRole} />
        </div>
      </div>
    </header>
  )
}
