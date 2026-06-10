"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { registrarLog } from "@/lib/audit"
import { formatBRL } from "@/lib/markup"

export async function criarInsumo(
  _prevState: { error: string; success?: boolean; id?: string },
  formData: FormData
): Promise<{ error: string; success?: boolean; id?: string }> {
  const codigo = (formData.get("codigoFabricante") as string)?.trim()
  const descricao = (formData.get("descricao") as string)?.trim()
  const fabricante = (formData.get("fabricante") as string)?.trim() || null
  const categoria = (formData.get("categoria") as string)?.trim() || null
  const unidadeMedida = (formData.get("unidadeMedida") as string)?.trim() || "Unidade"
  const preco = formData.get("precoCusto") as string

  if (!codigo || !descricao || !preco) {
    return { error: "Preencha os campos obrigatórios." }
  }

  const existe = await prisma.componente.findUnique({ where: { codigoFabricante: codigo } })
  if (existe) return { error: "Já existe um insumo com esse código." }

  const componente = await prisma.componente.create({
    data: {
      codigoFabricante: codigo,
      descricao,
      fabricante,
      categoria,
      unidadeMedida,
      precos: {
        create: { precoCusto: preco },
      },
    },
  })

  revalidatePath("/insumos")
  return { error: "", success: true, id: componente.id }
}

export async function atualizarPreco(componenteId: string, novoPreco: string) {
  if (!novoPreco || isNaN(Number(novoPreco))) return { error: "Preço inválido." }

  await prisma.$transaction([
    prisma.precoComponente.updateMany({
      where: { componenteId, vigenteAte: null },
      data: { vigenteAte: new Date() },
    }),
    prisma.precoComponente.create({
      data: {
        componenteId,
        precoCusto: novoPreco,
        vigenteDe: new Date(),
      },
    }),
  ])

  await registrarLog({
    acao: "PRECO_ALTERADO",
    entidade: "Componente",
    entidadeId: componenteId,
    descricao: `Preço alterado para ${formatBRL(novoPreco)}`,
    metadata: { novoPreco },
  })

  revalidatePath("/insumos")
  return { success: true }
}

export async function toggleInsumo(componenteId: string, ativo: boolean) {
  await prisma.componente.update({
    where: { id: componenteId },
    data: { ativo: !ativo },
  })
  revalidatePath("/insumos")
}
