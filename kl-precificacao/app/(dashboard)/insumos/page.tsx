import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { getSession } from "@/lib/session"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatBRL } from "@/lib/markup"
import { AtualizarPrecoDialog } from "@/components/insumos/AtualizarPrecoDialog"
import Link from "next/link"
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

  return (
    <div>
      <Header
        title="Catálogo de Insumos"
        subtitle={`${total} insumo${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
        actions={
          <Link href="/insumos/novo">
            <Button className="bg-[#0f2744] hover:bg-[#1a3a5c] text-white gap-2">
              <Plus className="w-4 h-4" />
              Novo Insumo
            </Button>
          </Link>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        <form className="flex gap-2 flex-1 min-w-0 max-w-sm">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, código ou fabricante..."
            className="flex-1 h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2744]/20 focus:border-[#0f2744]"
          />
          <Button type="submit" size="sm" className="bg-[#0f2744] hover:bg-[#1a3a5c] text-white h-9">
            Buscar
          </Button>
        </form>

        <div className="flex gap-1.5 flex-wrap">
          <Link href="/insumos">
            <Badge
              className={`cursor-pointer h-9 px-3 text-xs transition-colors ${
                !categoria
                  ? "bg-[#0f2744] text-white border-[#0f2744]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#0f2744]"
              }`}
            >
              Todos
            </Badge>
          </Link>
          {categorias.map((c) => (
            <Link key={c.categoria} href={`/insumos?categoria=${encodeURIComponent(c.categoria!)}`}>
              <Badge
                className={`cursor-pointer h-9 px-3 text-xs transition-colors ${
                  categoria === c.categoria
                    ? "bg-[#0f2744] text-white border-[#0f2744]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#0f2744]"
                }`}
              >
                {c.categoria}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {componentes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0f2744]/10 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-[#0f2744]/40" />
          </div>
          <p className="text-lg font-semibold text-[#0f2744]">Nenhum insumo encontrado</p>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            {q ? `Sem resultados para "${q}"` : "Cadastre o primeiro insumo"}
          </p>
          {!q && (
            <Link href="/insumos/novo">
              <Button className="bg-[#0f2744] hover:bg-[#1a3a5c] text-white gap-2">
                <Plus className="w-4 h-4" />
                Novo Insumo
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Código / Descrição
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Fabricante
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Preço de Custo
                    </th>
                    {isAdmin && (
                      <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {componentes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-[#0f2744] leading-snug">{c.descricao}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{c.codigoFabricante}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-slate-600">{c.fabricante ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {c.categoria ? (
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs">
                            {c.categoria}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-semibold text-[#0f2744]">
                          {c.precos[0] ? formatBRL(c.precos[0].precoCusto.toString()) : "—"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3.5 text-center">
                          <AtualizarPrecoDialog
                            componenteId={c.id}
                            descricao={c.descricao}
                            precoAtual={c.precos[0]?.precoCusto?.toString() ?? "0"}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Mostrando {skip + 1}–{Math.min(skip + LIMIT, total)} de {total}
                </p>
                <div className="flex items-center gap-1">
                  {page > 1 ? (
                    <Link href={buildUrl(page - 1)}>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 opacity-40" disabled>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  )}
                  <span className="text-xs text-slate-600 px-3 font-medium">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link href={buildUrl(page + 1)}>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-200 opacity-40" disabled>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
