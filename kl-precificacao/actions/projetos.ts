"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { calcularPrecificacao } from "@/lib/markup"
import { gerarNumeroReferencia } from "@/lib/utils"

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
type ItemIncluded = {
  componenteId: string
  precoCustoUnitario: { toString(): string }
  quantidade: { toString(): string }
  componente: { precos: Array<{ precoCusto: { toString(): string } }> }
}

export interface ItemInput {
  componenteId: string
  quantidade: number
  precoCustoUnitario: number
}

export interface QuadroInput {
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

  const projeto = await prisma.$transaction(async (tx: TransactionClient) => {
    const p = await tx.projeto.create({
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
      const quadro = await tx.quadro.create({
        data: { projetoId: p.id, nome: q.nome, quantidade: q.quantidade, ordem: q.ordem },
      })
      if (q.itens.length > 0) {
        await tx.itemOrcamento.createMany({
          data: q.itens.map((item) => ({
            projetoId: p.id,
            quadroId: quadro.id,
            componenteId: item.componenteId,
            quantidade: item.quantidade.toString(),
            precoCustoUnitario: item.precoCustoUnitario.toString(),
            precoCustoTotal: (item.quantidade * item.precoCustoUnitario).toFixed(2),
          })),
        })
      }
    }

    return p
  })

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

  await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.itemOrcamento.deleteMany({ where: { projetoId: id } })
    await tx.quadro.deleteMany({ where: { projetoId: id } })

    await tx.projeto.update({
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

    for (const q of quadros) {
      const quadro = await tx.quadro.create({
        data: { projetoId: id, nome: q.nome, quantidade: q.quantidade, ordem: q.ordem },
      })
      if (q.itens.length > 0) {
        await tx.itemOrcamento.createMany({
          data: q.itens.map((item) => ({
            projetoId: id,
            quadroId: quadro.id,
            componenteId: item.componenteId,
            quantidade: item.quantidade.toString(),
            precoCustoUnitario: item.precoCustoUnitario.toString(),
            precoCustoTotal: (item.quantidade * item.precoCustoUnitario).toFixed(2),
          })),
        })
      }
    }
  })

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

export async function cancelarProjeto(id: string) {
  const session = await getSession()
  if (session?.role !== "ADMIN") return { error: "Sem permissão." }

  await prisma.projeto.update({ where: { id }, data: { status: "CANCELADO" } })
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

  const novo = await prisma.$transaction(async (tx: TransactionClient) => {
    const p = await tx.projeto.create({
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
      const quadro = await tx.quadro.create({
        data: { projetoId: p.id, nome: q.nome, quantidade: q.quantidade, ordem: q.ordem },
      })
      if (q.itens.length > 0) {
        await tx.itemOrcamento.createMany({
          data: q.itens.map((item: ItemIncluded) => {
            const precoAtual = item.componente.precos[0]?.precoCusto ?? item.precoCustoUnitario
            return {
              projetoId: p.id,
              quadroId: quadro.id,
              componenteId: item.componenteId,
              quantidade: item.quantidade.toString(),
              precoCustoUnitario: precoAtual.toString(),
              precoCustoTotal: (Number(item.quantidade) * Number(precoAtual)).toFixed(2),
            }
          }),
        })
      }
    }

    return p
  })

  revalidatePath("/projetos")
  return { success: true, id: novo.id }
}
