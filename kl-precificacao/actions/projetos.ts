"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { calcularPrecificacao } from "@/lib/markup"
import { gerarNumeroReferencia } from "@/lib/utils"
import { registrarLog } from "@/lib/audit"

type ItemIncluded = {
  componenteId: string
  precoCustoUnitario: { toString(): string }
  quantidade: { toString(): string }
  componente: { precos: Array<{ precoCusto: { toString(): string } }> }
}

export interface ItemInput {
  id?: string
  componenteId: string
  quantidade: number
  precoCustoUnitario: number
}

export interface QuadroInput {
  id?: string
  nome: string
  quantidade: number
  ordem: number
  itens: ItemInput[]
}

export async function criarProjeto(
  nome: string,
  cliente: string,
  descricao: string,
  margemDecimal: number,
  quadros: QuadroInput[]
) {
  const session = await getSession()
  if (!session) return { error: "Não autenticado." }

  const dre = await prisma.dREParametros.findFirst({ where: { ativo: true } })
  if (!dre) return { error: "Nenhum parâmetro DRE ativo encontrado." }

  const todosItens = quadros.flatMap((q) => q.itens)
  if (todosItens.length === 0) return { error: "Adicione ao menos um insumo ao projeto." }

  const custoDireto = quadros.reduce((acc, q) => {
    const quadroCusto = q.itens.reduce((qacc, i) => qacc + i.quantidade * i.precoCustoUnitario, 0)
    return acc + quadroCusto * q.quantidade
  }, 0)
  const resultado = calcularPrecificacao(custoDireto, margemDecimal, {
    pctCustoFixo: dre.pctCustoFixo.toString(),
    pctCustoVariavel: dre.pctCustoVariavel.toString(),
    pctSalarios: dre.pctSalarios.toString(),
  })

  const count = await prisma.projeto.count()
  const numeroReferencia = gerarNumeroReferencia(count)

  const dreSnapshot = {
    exercicio: dre.exercicio,
    pctCustoFixo: dre.pctCustoFixo.toString(),
    pctCustoVariavel: dre.pctCustoVariavel.toString(),
    pctSalarios: dre.pctSalarios.toString(),
    faturamentoEstimado: dre.faturamentoEstimado?.toString() ?? null,
  }

  const projeto = await prisma.projeto.create({
    data: {
      numeroReferencia,
      nome,
      cliente,
      descricao: descricao || null,
      status: "RASCUNHO",
      margemAplicada: margemDecimal.toString(),
      markupAplicado: resultado.markup,
      custoDiretoTotal: resultado.custoDireto,
      precoVendaTotal: resultado.precoVenda,
      vi: resultado.vi,
      dreSnapshot,
      responsavelId: session.userId,
    },
  })

  for (const q of quadros) {
    const quadro = await prisma.quadro.create({
      data: { projetoId: projeto.id, nome: q.nome, quantidade: q.quantidade, ordem: q.ordem },
    })
    for (const item of q.itens) {
      await prisma.itemOrcamento.create({
        data: {
          projetoId: projeto.id,
          quadroId: quadro.id,
          componenteId: item.componenteId,
          quantidade: item.quantidade.toString(),
          precoCustoUnitario: item.precoCustoUnitario.toString(),
          precoCustoTotal: (item.quantidade * item.precoCustoUnitario).toFixed(2),
        },
      })
    }
  }

  revalidatePath("/projetos")
  revalidatePath("/")
  return { success: true, id: projeto.id }
}

export async function atualizarProjeto(
  id: string,
  nome: string,
  cliente: string,
  descricao: string,
  margemDecimal: number,
  emitir: boolean,
  quadros: QuadroInput[]
) {
  const session = await getSession()
  if (!session) return { error: "Não autenticado." }

  const projeto = await prisma.projeto.findUnique({ where: { id } })
  if (!projeto) return { error: "Projeto não encontrado." }

  const dre = await prisma.dREParametros.findFirst({ where: { ativo: true } })
  if (!dre) return { error: "Nenhum parâmetro DRE ativo encontrado." }

  const todosItens = quadros.flatMap((q) => q.itens)
  if (todosItens.length === 0) return { error: "Adicione ao menos um insumo ao projeto." }

  const custoDireto = quadros.reduce((acc, q) => {
    const quadroCusto = q.itens.reduce((qacc, i) => qacc + i.quantidade * i.precoCustoUnitario, 0)
    return acc + quadroCusto * q.quantidade
  }, 0)
  const resultado = calcularPrecificacao(custoDireto, margemDecimal, {
    pctCustoFixo: dre.pctCustoFixo.toString(),
    pctCustoVariavel: dre.pctCustoVariavel.toString(),
    pctSalarios: dre.pctSalarios.toString(),
  })

  const dreSnapshot = {
    exercicio: dre.exercicio,
    pctCustoFixo: dre.pctCustoFixo.toString(),
    pctCustoVariavel: dre.pctCustoVariavel.toString(),
    pctSalarios: dre.pctSalarios.toString(),
    faturamentoEstimado: dre.faturamentoEstimado?.toString() ?? null,
  }

  await prisma.projeto.update({
    where: { id },
    data: {
      nome,
      cliente,
      descricao: descricao || null,
      status: emitir ? "EMITIDO" : "RASCUNHO",
      margemAplicada: margemDecimal.toString(),
      markupAplicado: resultado.markup,
      custoDiretoTotal: resultado.custoDireto,
      precoVendaTotal: resultado.precoVenda,
      vi: resultado.vi,
      dreSnapshot,
      ...(emitir ? { emitidoEm: new Date() } : {}),
    },
  })

  // Incremental diff: preserve ids/history for untouched quadros and itens.
  const existentes = await prisma.quadro.findMany({
    where: { projetoId: id },
    include: { itens: true },
  })
  const existentesPorId = new Map(existentes.map((q) => [q.id, q]))

  // Quadros and itens present in the input (carry a real DB id).
  const quadroIdsInput = new Set(quadros.filter((q) => q.id).map((q) => q.id!))

  // 1. Delete itens that were removed (do this before deleting quadros — the
  //    quadro→item relation is onDelete: SetNull, so orphaned itens would remain).
  for (const existente of existentes) {
    const quadroMantido = quadroIdsInput.has(existente.id)
    const itemIdsInput = quadroMantido
      ? new Set(
          quadros
            .find((q) => q.id === existente.id)!
            .itens.filter((i) => i.id)
            .map((i) => i.id!)
        )
      : new Set<string>()
    for (const item of existente.itens) {
      // Delete itens removed from a kept quadro, or all itens of a removed quadro.
      if (!quadroMantido || !itemIdsInput.has(item.id)) {
        await prisma.itemOrcamento.delete({ where: { id: item.id } })
      }
    }
  }

  // 2. Delete quadros that were removed.
  for (const existente of existentes) {
    if (!quadroIdsInput.has(existente.id)) {
      await prisma.quadro.delete({ where: { id: existente.id } })
    }
  }

  // 2b. Remove legacy quadro-less itens (older projects stored itens with
  //     quadroId: null; the editor re-creates them attached to a quadro).
  await prisma.itemOrcamento.deleteMany({ where: { projetoId: id, quadroId: null } })

  // 3. Update existing quadros / create new ones; then diff their itens.
  for (const q of quadros) {
    let quadroId: string
    if (q.id && existentesPorId.has(q.id)) {
      await prisma.quadro.update({
        where: { id: q.id },
        data: { nome: q.nome, quantidade: q.quantidade, ordem: q.ordem },
      })
      quadroId = q.id
    } else {
      const novo = await prisma.quadro.create({
        data: { projetoId: id, nome: q.nome, quantidade: q.quantidade, ordem: q.ordem },
      })
      quadroId = novo.id
    }

    const itensExistentes = existentesPorId.get(quadroId)?.itens ?? []
    const itensExistentesPorId = new Map(itensExistentes.map((i) => [i.id, i]))

    for (const item of q.itens) {
      const total = (item.quantidade * item.precoCustoUnitario).toFixed(2)
      const existenteItem = item.id ? itensExistentesPorId.get(item.id) : undefined
      if (existenteItem) {
        const mudou =
          Number(existenteItem.quantidade) !== item.quantidade ||
          Number(existenteItem.precoCustoUnitario) !== item.precoCustoUnitario ||
          Number(existenteItem.precoCustoTotal) !== Number(total) ||
          existenteItem.componenteId !== item.componenteId
        if (mudou) {
          await prisma.itemOrcamento.update({
            where: { id: existenteItem.id },
            data: {
              componenteId: item.componenteId,
              quantidade: item.quantidade.toString(),
              precoCustoUnitario: item.precoCustoUnitario.toString(),
              precoCustoTotal: total,
            },
          })
        }
      } else {
        await prisma.itemOrcamento.create({
          data: {
            projetoId: id,
            quadroId,
            componenteId: item.componenteId,
            quantidade: item.quantidade.toString(),
            precoCustoUnitario: item.precoCustoUnitario.toString(),
            precoCustoTotal: total,
          },
        })
      }
    }
  }

  revalidatePath("/projetos")
  revalidatePath(`/projetos/${id}`)
  revalidatePath("/")
  return { success: true, id }
}

export async function aplicarDesconto(id: string, desconto: number | null) {
  const session = await getSession()
  if (!session) return { error: "Não autenticado." }

  await prisma.projeto.update({
    where: { id },
    data: { desconto: desconto !== null ? desconto.toString() : null },
  })

  revalidatePath("/projetos")
  revalidatePath(`/projetos/${id}`)
  return { success: true }
}

export async function deletarProjeto(id: string) {
  const session = await getSession()
  if (session?.role !== "ADMIN") return { error: "Sem permissão." }

  await prisma.projeto.delete({ where: { id } })

  revalidatePath("/projetos")
  revalidatePath("/")
  return { success: true }
}

export async function cancelarProjeto(id: string, motivo: string, nota?: string) {
  const session = await getSession()
  if (session?.role !== "ADMIN") return { error: "Sem permissão." }

  await prisma.projeto.update({
    where: { id },
    data: {
      status: "CANCELADO",
      motivoCancelamento: motivo,
      motivoCancelNota: nota || null,
      canceladoEm: new Date(),
    },
  })
  revalidatePath("/projetos")
  revalidatePath(`/projetos/${id}`)
  return { success: true }
}

export async function emitirProjeto(id: string) {
  const session = await getSession()
  if (!session) return { error: "Não autenticado." }

  const projeto = await prisma.projeto.findUnique({ where: { id } })
  if (!projeto) return { error: "Projeto não encontrado." }
  if (projeto.status !== "RASCUNHO") return { error: "Apenas rascunhos podem ser emitidos." }

  await prisma.projeto.update({
    where: { id },
    data: { status: "EMITIDO", emitidoEm: new Date() },
  })

  await registrarLog({
    acao: "PROJETO_EMITIDO",
    entidade: "Projeto",
    entidadeId: id,
    descricao: `Projeto ${projeto.numeroReferencia} — ${projeto.nome} emitido`,
  })

  revalidatePath("/projetos")
  revalidatePath(`/projetos/${id}`)
  revalidatePath("/")
  return { success: true }
}

export async function marcarVendido(id: string) {
  const session = await getSession()
  if (!session) return { error: "Não autenticado." }

  const projeto = await prisma.projeto.findUnique({ where: { id } })
  if (!projeto) return { error: "Projeto não encontrado." }
  if (projeto.status !== "EMITIDO") return { error: "Apenas projetos emitidos podem ser marcados como vendidos." }

  await prisma.projeto.update({
    where: { id },
    data: { status: "VENDIDO", vendidoEm: new Date() },
  })

  await registrarLog({
    acao: "PROJETO_VENDIDO",
    entidade: "Projeto",
    entidadeId: id,
    descricao: `Projeto ${projeto.numeroReferencia} — ${projeto.nome} marcado como vendido`,
  })

  revalidatePath("/projetos")
  revalidatePath(`/projetos/${id}`)
  revalidatePath("/")
  return { success: true }
}

export async function duplicarProjeto(id: string) {
  const session = await getSession()
  if (!session) return { error: "Não autenticado." }

  const original = await prisma.projeto.findUnique({
    where: { id },
    include: {
      quadros: { include: { itens: { include: { componente: { include: { precos: { where: { vigenteAte: null } } } } } } } },
    },
  })
  if (!original) return { error: "Projeto não encontrado." }

  const dre = await prisma.dREParametros.findFirst({ where: { ativo: true } })
  if (!dre) return { error: "Nenhum DRE ativo." }

  const count = await prisma.projeto.count()
  const numeroReferencia = gerarNumeroReferencia(count)

  const novo = await prisma.projeto.create({
    data: {
      numeroReferencia,
      nome: `${original.nome} (Cópia)`,
      cliente: original.cliente,
      descricao: original.descricao,
      status: "RASCUNHO",
      margemAplicada: original.margemAplicada.toString(),
      markupAplicado: original.markupAplicado.toString(),
      custoDiretoTotal: original.custoDiretoTotal.toString(),
      precoVendaTotal: original.precoVendaTotal.toString(),
      vi: original.vi.toString(),
      dreSnapshot: original.dreSnapshot as object,
      responsavelId: session.userId,
    },
  })

  for (const q of original.quadros) {
    const quadro = await prisma.quadro.create({
      data: { projetoId: novo.id, nome: q.nome, quantidade: q.quantidade, ordem: q.ordem },
    })
    for (const item of q.itens) {
      const precoAtual = (item as ItemIncluded).componente.precos[0]?.precoCusto ?? item.precoCustoUnitario
      await prisma.itemOrcamento.create({
        data: {
          projetoId: novo.id,
          quadroId: quadro.id,
          componenteId: item.componenteId,
          quantidade: item.quantidade.toString(),
          precoCustoUnitario: precoAtual.toString(),
          precoCustoTotal: (Number(item.quantidade) * Number(precoAtual)).toFixed(2),
        },
      })
    }
  }

  revalidatePath("/projetos")
  return { success: true, id: novo.id }
}
