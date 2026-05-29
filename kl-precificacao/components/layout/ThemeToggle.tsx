"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

const OPCOES = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const

/**
 * Seletor de tema segmentado. `variant="full"` mostra rótulos (página de
 * Configurações); `variant="compact"` mostra só ícones (menu do usuário).
 */
export function ThemeToggle({ variant = "full" }: { variant?: "full" | "compact" }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // Guard de montagem do next-themes (evita mismatch de hidratação).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const atual = mounted ? theme ?? "system" : undefined

  return (
    <div className={cn("inline-flex rounded-md border border-line p-0.5", variant === "full" && "gap-0.5")}>
      {OPCOES.map(({ value, label, icon: Icon }) => {
        const active = atual === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            title={label}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-[5px] text-[12px] font-medium transition-colors",
              variant === "full" ? "px-3 py-1.5" : "px-2 py-1",
              active ? "bg-brand text-white" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {variant === "full" && label}
          </button>
        )
      })}
    </div>
  )
}
