import { cn } from "@/lib/utils"
import { statusStyle } from "@/lib/status"

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const s = statusStyle(status)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium leading-5",
        className
      )}
      style={{ color: s.color, background: s.bg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: s.color }}
        aria-hidden
      />
      {s.label}
    </span>
  )
}
