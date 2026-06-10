import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { getSession } from "@/lib/session"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { formatBRL } from "@/lib/markup"
import { AtualizarPrecoDialog } from "@/components/insumos/AtualizarPrecoDialog"
import { HistoricoReajusteDialog } from "@/components/insumos/HistoricoReajusteDialog"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Plus, Package, ChevronLeft, ChevronRight } from "lucide-react"

const LIMIT = 50

export default async function InsumosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; page?: string }>
}) {
  const session = await getSession()
  const isAdmin = session?.role === "ADMIN"
  const { q, categoria, page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr ?? 1))
  const skip = (page - 1) * LIMIT

  const where: Prisma.ComponenteWhereInput = {
    ativo: true,
    ...(q
      ? {
          OR: [
            { descricao: { contains: q, mode: "insensitive" } },
            { codigoFabricante: { contains: q, mode: "insensitive" } },
            { fabricante: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoria ? { categoria } : {}),
  }

  const [componentes, total] = await Promise.all([
    prisma.componente.findMany({
      where,
      include: {
        precos: { where: { vigenteAte: null }, take: 1 },
      },
      orderBy: { descricao: "asc" },
      skip,
      take: LIMIT,
    }),
    prisma.componente.count({ where }),
  ])

  const totalPages = Math.ceil(total / LIMIT)

  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (categoria) params.set("categoria", categoria)
    if (p > 1) params.set("page", String(p))
    const qs = params.toString()
    return `/insumos${qs ? `?${qs}` : ""}`
  }

  const categorias = await prisma.componente.groupBy({
    by: ["categoria"],
    where: { ativo: true, categoria: { not: null } },
    orderBy: { categoria: "asc" },
  })

  const pillBase = "inline-flex h-9 cursor-pointer items-center rounded-md border px-3 text-[12px] font-medium transition-colors"

  return (
    <div>
      <Header
        eyebrow="Catálogo"
        title="Insumos"
        subtitle={`${total} insumo${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
        actions={
          <Link
            href="/insumos/novo"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-hover"
          >
            <Plus className="h-4 w-4" /> Novo insumo
          </Link>
        }
      />

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <form className="flex min-w-0 max-w-sm flex-1 gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, código ou fabricante…"
            className="h-9 flex-1 rounded-md border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-muted-fg focus:border-brand"
          />
          <Button type="submit" size="sm" className="h-9 bg-brand text-white hover:bg-brand-hover">
            Buscar
          </Button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/insumos"
            className={cn(pillBase, !categoria ? "border-brand bg-brand-bg text-brand" : "border-line bg-surface text-ink-soft hover:bg-surface-2")}
          >
            Todos
          </Link>
          {categorias.map((c) => (
            <Link
              key={c.categoria}
              href={`/insumos?categoria=${encodeURIComponent(c.categoria!)}`}
              className={cn(pillBase, categoria === c.categoria ? "border-brand bg-brand-bg text-brand" : "border-line bg-surface text-ink-soft hover:bg-surface-2")}
            >
              {c.categoria}
            </Link>
          ))}
        </div>
      </div>

      {componentes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-surface-2 text-muted-fg">
            <Package className="h-7 w-7" />
          </div>
          <p className="text-[15px] font-medium text-ink-soft">Nenhum insumo encontrado</p>
          <p className="mb-6 mt-1 text-[13px] text-muted-fg">
            {q ? `Sem resultados para "${q}"` : "Cadastre o primeiro insumo"}
          </p>
          {!q && (
            <Link
              href="/insumos/novo"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-hover"
            >
              <Plus className="h-4 w-4" /> Novo insumo
            </Link>
          )}
        </div>
      ) : (
        <div className="border-t border-line">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-2.5 pl-0 pr-3 text-left text-[11px] font-medium text-muted-fg">Código / Descrição</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium text-muted-fg">Fabricante</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-medium text-muted-fg">Categoria</th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-medium text-muted-fg">Preço de custo</th>
                  <th className="py-2.5 pl-3 pr-0 text-center text-[11px] font-medium text-muted-fg">Ações</th>
                </tr>
              </thead>
              <tbody>
                {componentes.map((c, i) => (
                  <tr key={c.id} className={cn("transition-colors hover:bg-surface-2", i > 0 && "border-t border-line")}>
                    <td className="py-3 pl-0 pr-3">
                      <p className="text-[13px] font-medium leading-snug text-ink">{c.descricao}</p>
                      <p className="num mt-0.5 text-[11px] text-muted-fg">{c.codigoFabricante}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[13px] text-ink-soft">{c.fabricante ?? "—"}</p>
                    </td>
                    <td className="px-3 py-3">
                      {c.categoria ? (
                        <span className="inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                          {c.categoria}
                        </span>
                      ) : (
                        <span className="text-[12px] text-muted-fg">—</span>
                      )}
                    </td>
                    <td className="num px-3 py-3 text-right text-[13px] font-medium text-ink">
                      {c.precos[0] ? formatBRL(c.precos[0].precoCusto.toString()) : "—"}
                    </td>
                    <td className="py-3 pl-3 pr-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <HistoricoReajusteDialog
                          componenteId={c.id}
                          descricao={c.descricao}
                        />
                        {isAdmin && (
                          <AtualizarPrecoDialog
                            componenteId={c.id}
                            descricao={c.descricao}
                            precoAtual={c.precos[0]?.precoCusto?.toString() ?? "0"}
                          />
                        )}
                      </div>
                    </td>
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
                  <Link href={buildUrl(page - 1)}>
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
                  <Link href={buildUrl(page + 1)}>
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
