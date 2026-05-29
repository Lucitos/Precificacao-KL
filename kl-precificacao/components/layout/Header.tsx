interface HeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, eyebrow, actions }: HeaderProps) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4 border-b border-line pb-5">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[12px] font-medium text-muted-fg">{eyebrow}</p>
        )}
        <h1 className="text-[27px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-[13px] text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
