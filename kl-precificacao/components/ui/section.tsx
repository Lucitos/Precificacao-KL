import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Cabeçalho de seção editorial: título + ação opcional, com régua hairline
 * embaixo. Estrutura por linha e tipografia — sem caixa em volta do conteúdo.
 */
export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4 border-b border-line pb-2.5", className)}>
      <div className="min-w-0">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[12px] text-muted-fg">{description}</p>}
      </div>
      {action && <div className="flex flex-shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
