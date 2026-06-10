"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { registrarLog } from "@/lib/audit"

export async function criarDRE(formData: FormData) {
  const session = await getSession()
  if (session?.role !== "ADMIN") return { error: "Sem permissão." }

  const exercicio = (formData.get("exercicio") as string)?.trim()
  const pctCustoFixo = formData.get("pctCustoFixo") as string
  const pctCustoVariavel = formData.get("pctCustoVariavel") as string
  const pctSalarios = formData.get("pctSalarios") as string
  const faturamento = formData.get("faturamentoEstimado") as string

  if (!exercicio || !pctCustoFixo || !pctCustoVariavel || !pctSalarios) {
    return { error: "Preencha todos os campos obrigatórios." }
  }

  const dre = await prisma.dREParametros.create({
    data: {
      exercicio,
      pctCustoFixo: (Number(pctCustoFixo) / 100).toString(),
      pctCustoVariavel: (Number(pctCustoVariavel) / 100).toString(),
      pctSalarios: (Number(pctSalarios) / 100).toString(),
      faturamentoEstimado: faturamento || null,
      ativo: false,
    },
  })

  await registrarLog({
    acao: "DRE_CRIADA",
    entidade: "DRE",
    entidadeId: dre.id,
    descricao: `Parâmetros DRE criados para o exercício ${exercicio}`,
  })

  revalidatePath("/dre")
  return { success: true }
}

export async function ativarDRE(id: string) {
  const session = await getSession()
  if (session?.role !== "ADMIN") return { error: "Sem permissão." }

  await prisma.$transaction([
    prisma.dREParametros.updateMany({ where: { ativo: true }, data: { ativo: false } }),
    prisma.dREParametros.update({ where: { id }, data: { ativo: true } }),
  ])

  await registrarLog({
    acao: "DRE_ATIVADA",
    entidade: "DRE",
    entidadeId: id,
    descricao: "Parâmetros DRE ativados",
  })

  revalidatePath("/dre")
  return { success: true }
}
