"use server"

import Decimal from "decimal.js"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export interface HistoricoPrecoRow {
  id: string
  precoCusto: string
  vigenteDe: string
  vigenteAte: string | null
}

export interface HistoricoPrecoResult {
  historico: HistoricoPrecoRow[]
  variacaoTrimestre: string | null
}

export async function historicoPreco(
  componenteId: string
): Promise<HistoricoPrecoResult | { error: string }> {
  const session = await getSession()
  if (!session) return { error: "Não autenticado." }

  const rows = await prisma.precoComponente.findMany({
    where: { componenteId },
    orderBy: { vigenteDe: "asc" },
  })

  const historico: HistoricoPrecoRow[] = rows.map((r) => ({
    id: r.id,
    precoCusto: r.precoCusto.toString(),
    vigenteDe: r.vigenteDe.toISOString(),
    vigenteAte: r.vigenteAte ? r.vigenteAte.toISOString() : null,
  }))

  // Preço ativo atual (vigenteAte null)
  const atual = rows.find((r) => r.vigenteAte === null)

  // Preço que estava vigente ~90 dias atrás
  const noventaDias = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const anterior = rows.find(
    (r) =>
      r.vigenteDe <= noventaDias &&
      (r.vigenteAte === null || r.vigenteAte > noventaDias)
  )

  let variacaoTrimestre: string | null = null
  if (atual && anterior && anterior.id !== atual.id) {
    const precoAtual = new Decimal(atual.precoCusto.toString())
    const precoAnterior = new Decimal(anterior.precoCusto.toString())
    if (!precoAnterior.isZero()) {
      variacaoTrimestre = precoAtual
        .minus(precoAnterior)
        .div(precoAnterior)
        .times(100)
        .toDecimalPlaces(2)
        .toString()
    }
  }

  return { historico, variacaoTrimestre }
}

export interface ProjetoAfetado {
  id: string
  nome: string
  numeroReferencia: string
  custoDiretoTotal: string
}

export interface SimularReajusteResult {
  pct: string
  totalProjetos: number
  custoAdicionalTotal: string
  projetos: ProjetoAfetado[]
}

export async function simularReajuste(
  componenteId: string,
  pct: number
): Promise<SimularReajusteResult | { error: string }> {
  const session = await getSession()
  if (!session) return { error: "Não autenticado." }

  if (pct === undefined || pct === null || isNaN(Number(pct))) {
    return { error: "Percentual inválido." }
  }

  const pctDec = new Decimal(pct)

  // Itens deste componente que pertencem a projetos em rascunho
  const itens = await prisma.itemOrcamento.findMany({
    where: {
      componenteId,
      projeto: { status: "RASCUNHO" },
    },
    include: {
      projeto: {
        select: {
          id: true,
          nome: true,
          numeroReferencia: true,
          custoDiretoTotal: true,
        },
      },
    },
  })

  const projetosMap = new Map<string, ProjetoAfetado>()
  let custoAdicionalTotal = new Decimal(0)

  for (const item of itens) {
    const quantidade = new Decimal(item.quantidade.toString())
    const precoUnitario = new Decimal(item.precoCustoUnitario.toString())
    // custo adicional = quantidade * preço unitário atual * pct/100
    const adicional = quantidade.times(precoUnitario).times(pctDec.div(100))
    custoAdicionalTotal = custoAdicionalTotal.plus(adicional)

    if (!projetosMap.has(item.projeto.id)) {
      projetosMap.set(item.projeto.id, {
        id: item.projeto.id,
        nome: item.projeto.nome,
        numeroReferencia: item.projeto.numeroReferencia,
        custoDiretoTotal: item.projeto.custoDiretoTotal.toString(),
      })
    }
  }

  const projetos = Array.from(projetosMap.values())

  return {
    pct: pctDec.toString(),
    totalProjetos: projetos.length,
    custoAdicionalTotal: custoAdicionalTotal.toDecimalPlaces(2).toString(),
    projetos,
  }
}
