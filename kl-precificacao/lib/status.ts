// Fonte única de verdade para os status de projeto.
// Antes duplicado em app/(dashboard)/page.tsx, ProjetosClientPage.tsx e projetos/[id]/page.tsx.

export type ProjetoStatus = "RASCUNHO" | "EMITIDO" | "VENDIDO" | "CANCELADO"

export interface StatusStyle {
  label: string
  /** cor do ponto e do texto do badge */
  color: string
  /** fundo tonal sutil do badge */
  bg: string
}

export const STATUS: Record<ProjetoStatus, StatusStyle> = {
  RASCUNHO:  { label: "Rascunho", color: "#7E8C91", bg: "rgba(126,140,145,0.10)" },
  EMITIDO:   { label: "Emitido",  color: "#2E7D52", bg: "rgba(46,125,82,0.10)" },
  VENDIDO:   { label: "Vendido",  color: "#2B6BBF", bg: "rgba(43,107,191,0.10)" },
  CANCELADO: { label: "Cancelado", color: "#BC4A2B", bg: "rgba(188,74,43,0.10)" },
}

export function statusStyle(status: string): StatusStyle {
  return STATUS[status as ProjetoStatus] ?? STATUS.RASCUNHO
}

export const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS).map(([k, v]) => [k, v.label])
)
