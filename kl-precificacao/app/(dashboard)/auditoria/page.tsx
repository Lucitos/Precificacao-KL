import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react"

const LIMIT = 50

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ entidade?: string; acao?: string; page?: string }>
}) {
  const { entidade, acao, page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? 1))
  const skip = (page - 1) * LIMIT

  const where: Prisma.LogAuditoriaWhereInput = {
    ...(entidade ? { entidade } : {}),
    ...(acao ? { acao } : {}),
  }

  const [logs, total, entidades, acoes] = await Promise.all([
    prisma.logAuditoria.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip,
      take: LIMIT,
    }),
    prisma.logAuditoria.count({ where }),
    prisma.logAuditoria.groupBy({ by: ["entidade"], orderBy: { entidade: "asc" } }),
    prisma.logAuditoria.groupBy({ by: ["acao"], orderBy: { acao: "asc" } }),
  ])

  const totalPages = Math.ceil(total / LIMIT)

  const buildUrl = (overrides: { entidade?: string | null; acao?: string | null; page?: number }) => {
    const params = new URLSearchParams()
    const ent = overrides.entidade === undefined ? entidade : overrides.entidade
    const ac = overrides.acao === undefined ? acao : overrides.acao
    const p = overrides.page ?? 1
    if (ent) params.set("entidade", ent)
    if (ac) params.set("acao", ac)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/auditoria${qs ? `?${qs}` : ""}`
  }

  const pillBase = "inline-flex h-8 cursor-pointer items-center rounded-md border px-2.5 text-[12px] font-medium transition-colors"

  return (
    <div>
      <Header
        eyebrow="Histórico"
        title="Auditoria"
        subtitle={`${total} registro${total !== 1 ? "s" : ""} de atividade`}
      />

      {/* Filtros */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-medium text-muted-fg">Entidade</span>
          <Link
            href={buildUrl({ entidade: null, page: 1 })}
            className={cn(pillBase, !entidade ? "border-brand bg-brand-bg text-brand" : "border-line bg-surface text-ink-soft hover:bg-surface-2")}
          >
            Todas
          </Link>
          {entidades.map((e) => (
            <Link
              key={e.entidade}
              href={buildUrl({ entidade: e.entidade, page: 1 })}
              className={cn(pillBase, entidade === e.entidade ? "border-brand bg-brand-bg text-brand" : "border-line bg-surface text-ink-soft hover:bg-surface-2")}
            >
              {e.entidade}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-medium text-muted-fg">Ação</span>
          <Link
            href={buildUrl({ acao: null, page: 1 })}
            className={cn(pillBase, !acao ? "border-brand bg-brand-bg text-brand" : "border-line bg-surface text-ink-soft hover:bg-surface-2")}
          >
            Todas
          </Link>
          {acoes.map((a) => (
            <Link
              key={a.acao}
              href={buildUrl({ acao: a.acao, page: 1 })}
              className={cn(pillBase, acao === a.acao ? "border-brand bg-brand-bg text-brand" : "border-line bg-surface text-ink-soft hover:bg-surface-2")}
            >
              {a.acao}
            </Link>
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-surface-2 text-muted-fg">
            <ScrollText className="h-7 w-7" />
          </div>
          <p className="text-[15px] font-medium text-ink-soft">Nenhum registro encontrado</p>
          <p className="mb-6 mt-1 text-[13px] text-muted-fg">Os eventos registrados aparecerão aqui</p>
        </div>
      ) : (
        <div className="border-t border-line">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-2.5 pl-0 pr-3 text-left text-[11px] font-medium text-muted-fg">Data / hora</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium text-muted-fg">Usuário</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium text-muted-fg">Ação</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium text-muted-fg">Entidade</th>
                  <th className="py-2.5 pl-3 pr-0 text-left text-[11px] font-medium text-muted-fg">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} className={cn("transition-colors hover:bg-surface-2", i > 0 && "border-t border-line")}>
                    <td className="num py-3 pl-0 pr-3 align-top text-[12px] whitespace-nowrap text-ink-soft">
                      {dateTimeFmt.format(log.criadoEm)}
                    </td>
                    <td className="px-3 py-3 align-top text-[13px] text-ink-soft">{log.usuarioNome}</td>
                    <td className="px-3 py-3 align-top">
                      <span className="inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                        {log.acao}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top text-[13px] text-ink-soft">{log.entidade}</td>
                    <td className="py-3 pl-3 pr-0 align-top text-[13px] text-ink">{log.descricao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line py-4">
              <p className="num text-[12px] text-muted-fg">
                {skip + 1}–{Math.min(skip + LIMIT, total)} de {total}
              </p>
              <div className="flex items-center gap-1">
                {page > 1 ? (
                  <Link href={buildUrl({ page: page - 1 })}>
                    <Button variant="outline" size="sm" className="h-8 w-8 border-line p-0">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" className="h-8 w-8 border-line p-0 opacity-40" disabled>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <span className="num px-3 text-[12px] font-medium text-ink-soft">
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Link href={buildUrl({ page: page + 1 })}>
                    <Button variant="outline" size="sm" className="h-8 w-8 border-line p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" className="h-8 w-8 border-line p-0 opacity-40" disabled>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
