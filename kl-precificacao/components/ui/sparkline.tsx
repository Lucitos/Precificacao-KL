/**
 * Sparkline minimalista (linha + área sutil). Leitura de tendência discreta,
 * sem eixos nem grade — coerente com a decisão "mais numérico" do dashboard.
 */
export function Sparkline({
  data,
  color = "var(--kl-orange)",
  width = 132,
  height = 36,
  strokeWidth = 1.5,
  className,
}: {
  data: number[]
  color?: string
  width?: number
  height?: number
  strokeWidth?: number
  className?: string
}) {
  const n = data.length
  if (n === 0) return null

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const span = max - min || 1
  const pad = strokeWidth
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  const pt = (v: number, i: number) => {
    const x = n === 1 ? width / 2 : pad + (i / (n - 1)) * innerW
    const y = pad + innerH - ((v - min) / span) * innerH
    return [x, y] as const
  }

  const pts = data.map(pt)
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${pts[n - 1][0].toFixed(1)},${height} L${pts[0][0].toFixed(1)},${height} Z`
  const [lx, ly] = pts[n - 1]
  const gid = `spark-${width}-${height}-${Math.round(max)}`

  return (
    <svg width={width} height={height} className={className} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={strokeWidth + 0.8} fill={color} />
    </svg>
  )
}
