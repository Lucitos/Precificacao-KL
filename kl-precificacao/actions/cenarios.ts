"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { calcularPrecificacao, type DREParams } from "@/lib/markup"

export interface CenarioDTO {
  id: string
  nome: string
  margemAplicada: string
  markupAplicado: string
  custoDiretoTotal: string
  precoVendaTotal: string
  vi: string
  criadoEm: string
}

export async function criarCenario(
  projetoId: string,
  nome: string,
  margemPercent: number
) {
  const session = await getSession()
  if (!session) return { error: "Não autenticado." }

  const nomeLimpo = nome?.trim()
  if (!nomeLimpo) return { error: "Nome obrigatório." }

  if (!Number.isFinite(margemPercent) || margemPercent < 0 || margemPercent >= 100) {
    return { error: "Margem inválida (deve estar entre 0 e 99,99%)." }
  }

  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    select: { id: true, custoDiretoTotal: true, dreSnapshot: true },
  })
  if (!projeto) return { error: "Projeto não encontrado." }

  const snap = (projeto.dreSnapshot ?? {}) as {
    pctCustoFixo?: string
    pctCustoVariavel?: string
    pctSalarios?: string
  }

  let dreParams: DREParams
  if (
    snap.pctCustoFixo != null &&
    snap.pctCustoVariavel != null &&
    snap.pctSalarios != null
  ) {
    dreParams = {
      pctCustoFixo: snap.pctCustoFixo,
      pctCustoVariavel: snap.pctCustoVariavel,
      pctSalarios: snap.pctSalarios,
    }
  } else {
    const dre = await prisma.dREParametros.findFirst({ where: { ativo: true } })
    if (!dre) return { error: "Nenhuma DRE ativa encontrada." }
    dreParams = {
      pctCustoFixo: dre.pctCustoFixo.toString(),
      pctCustoVariavel: dre.pctCustoVariavel.toString(),
      pctSalarios: dre.pctSalarios.toString(),
    }
  }

  const margemDecimal = margemPercent / 100
  const resultado = calcularPrecificacao(
    projeto.custoDiretoTotal.toString(),
    margemDecimal,
    dreParams
  )

  await prisma.cenarioProjeto.create({
    data: {
      projetoId: projeto.id,
      nome: nomeLimpo,
      margemAplicada: margemDecimal.toString(),
      markupAplicado: resultado.markup,
      custoDiretoTotal: projeto.custoDiretoTotal.toString(),
      precoVendaTotal: resultado.precoVenda,
      vi: resultado.vi,
      criadoPorId: session.userId,
    },
  })

  revalidatePath(`/projetos/${projeto.id}`)
}

export async function listarCenarios(projetoId: string): Promise<CenarioDTO[]> {
  const cenarios = await prisma.cenarioProjeto.findMany({
    where: { projetoId },
    orderBy: { margemAplicada: "asc" },
  })

  return cenarios.map((c) => ({
    id: c.id,
    nome: c.nome,
    margemAplicada: c.margemAplicada.toString(),
    markupAplicado: c.markupAplicado.toString(),
    custoDiretoTotal: c.custoDiretoTotal.toString(),
    precoVendaTotal: c.precoVendaTotal.toString(),
    vi: c.vi.toString(),
    criadoEm: c.criadoEm.toISOString(),
  }))
}

export async function deletarCenario(id: string) {
  const session = await getSession()
  if (!session) return { error: "Não autenticado." }

  const cenario = await prisma.cenarioProjeto.findUnique({
    where: { id },
    select: { projetoId: true },
  })
  if (!cenario) return { error: "Cenário não encontrado." }

  await prisma.cenarioProjeto.delete({ where: { id } })

  revalidatePath(`/projetos/${cenario.projetoId}`)
}
