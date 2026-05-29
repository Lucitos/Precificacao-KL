interface HeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, eyebrow, actions }: HeaderProps) {
  return (
    <div className="flex items-start justify-between mb-7 gap-4">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: "#E87722" }}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em]" style={{ color: "#1C2B30" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] mt-1" style={{ color: "#5F7177" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
