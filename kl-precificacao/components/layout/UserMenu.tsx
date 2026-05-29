"use client"

import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "./ThemeToggle"
import { logout } from "@/actions/auth"
import { ChevronDown, Settings, LogOut } from "lucide-react"

export function UserMenu({ userName, userRole }: { userName: string; userRole: string }) {
  const cargo = userRole === "ADMIN" ? "Administrador" : "Orçamentista"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 text-left transition-colors hover:bg-surface-2">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-brand text-[12px] font-semibold text-white">
            {userName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden min-w-0 leading-tight sm:block">
            <span className="block truncate text-[12px] font-medium text-ink">{userName}</span>
            <span className="block text-[10px] text-muted-fg">{cargo}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-fg transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-1.5">
          <p className="truncate text-[13px] font-medium text-ink">{userName}</p>
          <p className="text-[11px] text-muted-fg">{cargo}</p>
        </div>

        <DropdownMenuSeparator />

        <div className="px-2 py-2">
          <p className="mb-1.5 text-[11px] text-muted-fg">Tema</p>
          <ThemeToggle variant="compact" />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/configuracoes" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form action={logout}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
