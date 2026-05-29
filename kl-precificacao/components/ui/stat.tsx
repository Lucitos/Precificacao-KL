import * as React from "react"
import { cn } from "@/lib/utils"
import { Sparkline } from "./sparkline"

/**
 * KPI editorial: rótulo discreto, número grande em Geist Mono (.num) como
 * herói, e uma linha de apoio. Sem ícone em caixa colorida — o número fala.
 */
export function Stat({
  label,
  value,
  sub,
  spark,
  sparkColor,
  accent = false,
  className,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  spark?: number[]
  sparkColor?: string
  /** destaca o valor com a cor da marca */
  accent?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <p className="text-[12px] font-medium text-muted-fg">{label}</p>
      <p
        className={cn(
          "num mt-2 text-[28px] font-medium leading-none tracking-[-0.03em]",
          accent ? "text-brand" : "text-ink"
        )}
      >
        {value}
      </p>
      {spark && spark.some((v) => v !== 0) && (
        <div className="mt-3">
          <Sparkline data={spark} color={sparkColor ?? "var(--kl-orange)"} width={140} height={34} />
        </div>
      )}
      {sub && <p className="mt-2 text-[12px] text-muted-fg">{sub}</p>}
    </div>
  )
}
