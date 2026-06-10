import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { getSession } from "@/lib/session"

export type RegistrarLogArgs = {
  acao: string
  entidade: string
  entidadeId?: string | null
  descricao: string
  metadata?: Prisma.InputJsonValue | null
}

/**
 * Registra um evento na trilha de auditoria. Resolve o usuário atual via
 * getSession(); sem sessão, registra como "Sistema". Nunca lança — falhas de
 * log não devem quebrar a ação que o originou.
 */
export async function registrarLog({
  acao,
  entidade,
  entidadeId,
  descricao,
  metadata,
}: RegistrarLogArgs): Promise<void> {
  try {
    const session = await getSession()
    await prisma.logAuditoria.create({
      data: {
        usuarioId: session?.userId ?? null,
        usuarioNome: session?.name ?? "Sistema",
        acao,
        entidade,
        entidadeId: entidadeId ?? null,
        descricao,
        metadata: metadata ?? undefined,
      },
    })
  } catch (err) {
    console.error("[audit] falha ao registrar log:", err)
  }
}
