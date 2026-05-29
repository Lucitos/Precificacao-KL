"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

type ValueKind = "count" | "currency" | "multiplier"

function fmtCompact(v: number, kind: ValueKind): string {
  if (kind === "currency") {
    if (v === 0) return "—"
    if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`
    return `R$${v.toFixed(0)}`
  }
  if (kind === "multiplier") {
    return v > 0 ? `${v.toFixed(2)}×` : "—"
  }
  return String(v)
}

export function MonthBarChart({
  data,
  color = "var(--kl-orange)",
  kind = "count",
  className,
}: {
  data: { mes: string; value: number }[]
  color?: string
  kind?: ValueKind
  className?: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.value), 1)
  const hasData = data.some((d) => d.value > 0)

  return (
    <div className={cn("w-full select-none", className)}>
      {/* Área das barras */}
      <div className="flex items-end gap-1" style={{ height: 64 }}>
        {data.map((d, i) => {
          const isHovered = hovered === i
          const barPct = d.value > 0 ? Math.max((d.value / max) * 100, 6) : 0
          const label = fmtCompact(d.value, kind)

          return (
            <div
              key={i}
              className="relative flex flex-1 flex-col items-center justify-end h-full cursor-default"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* rótulo acima da barra — sempre visível quando há dado */}
              {hasData && (
                <span
                  className={cn(
                    "num absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] leading-none transition-opacity duration-100",
                    isHovered ? "opacity-100 font-semibold" : "opacity-50 font-medium"
                  )}
                  style={{ color }}
                >
                  {label}
                </span>
              )}
              {/* barra */}
              <div
                className="w-full rounded-t-[2px] transition-all duration-100"
                style={{
                  height: `${barPct}%`,
                  backgroundColor: color,
                  opacity: isHovered ? 1 : 0.55,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Rótulos dos meses — eixo X */}
      <div className="flex gap-1 mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 items-center justify-center">
            <span
              className={cn(
                "text-[10px] leading-none transition-colors duration-100",
                hovered === i ? "text-ink" : "text-muted-fg"
              )}
            >
              {d.mes}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
