import * as React from "react"
import { cn } from "@/lib/utils"

type PanelProps = React.ComponentProps<"div"> & {
  /** superfície tonal (surface-2) em vez de branca */
  tonal?: boolean
}

/**
 * Superfície editorial: borda hairline, cantos sóbrios, sem sombra ambiente.
 * Profundidade vem da linha e do tom de fundo, não de drop-shadow.
 */
export function Panel({ className, tonal, ...props }: PanelProps) {
  return (
    <div
      data-slot="panel"
      className={cn(
        "rounded-lg border border-line",
        tonal ? "bg-surface-2" : "bg-surface",
        className
      )}
      {...props}
    />
  )
}

/** Cabeçalho de painel com régua hairline embaixo. */
export function PanelHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-line px-5 py-3.5",
        className
      )}
      {...props}
    />
  )
}

export function PanelTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-[14px] font-semibold tracking-[-0.01em] text-ink",
        className
      )}
      {...props}
    />
  )
}
