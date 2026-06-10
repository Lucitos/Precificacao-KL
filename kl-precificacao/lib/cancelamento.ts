// Motivos de cancelamento pré-definidos para projetos.
// Fonte única usada pelo diálogo de cancelamento e pelo funil comercial.

export const MOTIVOS_CANCELAMENTO = [
  "Preço",
  "Prazo",
  "Concorrente",
  "Cliente desistiu",
  "Escopo alterado",
  "Outro",
] as const

export type MotivoCancelamento = (typeof MOTIVOS_CANCELAMENTO)[number]
