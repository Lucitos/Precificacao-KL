import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatBRL, formatPercent } from "@/lib/markup"
import { cancelarProjeto, duplicarProjeto } from "@/actions/projetos"
import Link from "next/link"
import {
  ArrowLeft, CheckCircle, AlertTriangle, XCircle, Copy, Trash2,
  Pencil, LayoutGrid, Tag,
} from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EMITIDO: "Emitido",
  CANCELADO: "Cancelado",
}
const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: "bg-slate-100 text-slate-600 border-slate-200",
  EMITIDO: "bg-blue-100 text-blue-700 border-blue-200",
  CANCELADO: "bg-red-100 text-red-700 border-red-200",
}

export default async function ProjetoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  const isAdmin = session?.role === "ADMIN"

  const projeto = await prisma.projeto.findUnique({
    where: { id },
    include: {
      responsavel: { select: { name: true } },
      quadros: {
        include: {
          itens: {
            include: { componente: { select: { descricao: true, codigoFabricante: true, categoria: true } } },
            orderBy: { componente: { descricao: "asc" } },
          },
        },
        orderBy: { ordem: "asc" },
      },
      itens: {
        where: { quadroId: null },
        include: { componente: { select: { descricao: true, codigoFabricante: true, categoria: true } } },
        orderBy: { componente: { descricao: "asc" } },
      },
    },
  })

  if (!projeto) notFound()

  const snap = projeto.dreSnapshot as {
    exercicio: string
    pctCustoFixo: string
    pctCustoVariavel: string
    pctSalarios: string
    faturamentoEstimado?: string
  }

  const vi = Number(projeto.vi)
  const viStatus = vi >= 1.1 ? "verde" : vi >= 0.95 ? "amarelo" : "vermelho"
  const viIcon =
    viStatus === "verde" ? <CheckCircle className="w-5 h-5 text-green-600" />
    : viStatus === "amarelo" ? <AlertTriangle className="w-5 h-5 text-amber-500" />
    : <XCircle className="w-5 h-5 text-red-600" />
  const viColor =
    viStatus === "verde" ? "text-green-600"
    : viStatus === "amarelo" ? "text-amber-500"
    : "text-red-600"

  const totalItens =
    projeto.quadros.reduce((acc, q) => acc + q.itens.length, 0) + projeto.itens.length

  const hasQuadros = projeto.quadros.length > 0

  const custoDiretoCalculado = hasQuadros
    ? projeto.quadros.reduce((acc, q) => {
        const quadroCusto = q.itens.reduce((qacc, i) => qacc + Number(i.precoCustoTotal), 0)
        return acc + quadroCusto * q.quantidade
      }, 0) + projeto.itens.reduce((acc, i) => acc + Number(i.precoCustoTotal), 0)
    : projeto.itens.reduce((acc, i) => acc + Number(i.precoCustoTotal), 0)

  function ItemRow({ item }: { item: { id: string; componente: { descricao: string; codigoFabricante: string }; quantidade: { toString(): string }; precoCustoUnitario: { toString(): string }; precoCustoTotal: { toString(): string } } }) {
    return (
      <tr className="hover:bg-slate-50/50">
        <td className="px-6 py-3">
          <p className="text-sm font-medium text-[#0f2744] leading-snug">{item.componente.descricao}</p>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{item.componente.codigoFabricante}</p>
        </td>
        <td className="px-3 py-3 text-center">
          <span className="text-sm text-slate-700">{Number(item.quantidade).toFixed(0)}</span>
        </td>
        <td className="px-3 py-3 text-right text-sm text-slate-600">
          {formatBRL(item.precoCustoUnitario.toString())}
        </td>
        <td className="px-4 py-3 text-right text-sm font-semibold text-[#0f2744]">
          {formatBRL(item.precoCustoTotal.toString())}
        </td>
      </tr>
    )
  }

  return (
    <div>
      <Header
        title={projeto.nome}
        subtitle={`${projeto.numeroReferencia} · ${projeto.cliente}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/projetos">
              <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 text-slate-600 h-9">
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </Button>
            </Link>
            <Link href={`/projetos/${projeto.id}/editar`}>
              <Button variant="outline" size="sm" className="gap-1.5 h-9 border-[#0f2744]/30 text-[#0f2744] hover:bg-[#0f2744]/5">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </Button>
            </Link>
            <form action={async () => { "use server"; await duplicarProjeto(projeto.id) }}>
              <Button type="submit" variant="outline" size="sm" className="gap-1.5 h-9 border-slate-200 text-slate-600 hover:text-[#0f2744]">
                <Copy className="w-3.5 h-3.5" /> Duplicar
              </Button>
            </form>
            {isAdmin && projeto.status !== "CANCELADO" && (
              <form action={async () => { "use server"; await cancelarProjeto(projeto.id) }}>
                <Button type="submit" variant="outline" size="sm" className="gap-1.5 h-9 border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" /> Cancelar
                </Button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Itens */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-[#0f2744]">
                Itens do Projeto ({totalItens})
              </CardTitle>
              <Badge className={`border ${STATUS_COLORS[projeto.status]}`}>
                {STATUS_LABELS[projeto.status]}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {hasQuadros ? (
                <div>
                  {projeto.quadros.map((quadro) => {
                    const subtotal = quadro.itens.reduce(
                      (acc, i) => acc + Number(i.precoCustoTotal),
                      0
                    ) * quadro.quantidade
                    return (
                      <div key={quadro.id}>
                        <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-y border-slate-100">
                          <LayoutGrid className="w-3.5 h-3.5 text-[#0f2744]/60" />
                          <span className="text-sm font-semibold text-[#0f2744]">{quadro.nome}</span>
                          {quadro.quantidade > 1 && (
                            <span className="text-xs bg-[#f59e0b]/20 text-[#0f2744] px-1.5 py-0.5 rounded font-medium">
                              ×{quadro.quantidade}
                            </span>
                          )}
                          <span className="ml-auto text-xs text-slate-400">
                            {quadro.itens.length} insumo{quadro.itens.length !== 1 ? "s" : ""} · {formatBRL(subtotal)}
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-slate-100">
                                <th className="text-left px-6 py-2.5 text-xs font-semibold text-slate-400">Componente</th>
                                <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-400">Qtd</th>
                                <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400">Unit.</th>
                                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-400">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {quadro.itens.map((item) => (
                                <ItemRow key={item.id} item={item} />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                  {/* items without quadro (legacy) */}
                  {projeto.itens.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-y border-slate-100">
                        <span className="text-sm font-semibold text-[#0f2744]">Itens Gerais</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="text-left px-6 py-2.5 text-xs font-semibold text-slate-400">Componente</th>
                              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-400">Qtd</th>
                              <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400">Unit.</th>
                              <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-400">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {projeto.itens.map((item) => (
                              <ItemRow key={item.id} item={item} />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="border-t-2 border-slate-200 bg-slate-50">
                    <table className="w-full">
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-[#0f2744]">
                            Total Custo Direto
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-[#0f2744]">
                            {formatBRL(custoDiretoCalculado)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400">Componente</th>
                        <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400">Qtd</th>
                        <th className="text-right px-3 py-3 text-xs font-semibold text-slate-400">Unit.</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {projeto.itens.map((item) => (
                        <ItemRow key={item.id} item={item} />
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-[#0f2744]">
                          Total Custo Direto
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-[#0f2744]">
                          {formatBRL(custoDiretoCalculado)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm bg-[#0f2744] text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white">Resultado da Precificação</CardTitle>
              <p className="text-xs text-blue-200/60">Margem: {(Number(projeto.margemAplicada) * 100).toFixed(0)}%</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5">
                <span className="text-blue-200/70">Custo Direto</span>
                <span>{formatBRL(custoDiretoCalculado)}</span>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between py-2">
                <span className="font-semibold text-[#f59e0b]">Preço de Venda</span>
                <span className={`font-bold text-lg ${projeto.desconto ? "line-through text-blue-200/40 text-sm self-end" : "text-[#f59e0b]"}`}>
                  {formatBRL(projeto.precoVendaTotal.toString())}
                </span>
              </div>
              {projeto.desconto && (
                <>
                  <div className="flex justify-between py-1.5">
                    <span className="text-blue-200/60 text-xs flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Desconto ({Number(projeto.desconto).toFixed(2)}%)
                    </span>
                    <span className="text-xs text-red-300">
                      -{formatBRL((Number(projeto.precoVendaTotal) * Number(projeto.desconto) / 100).toFixed(2))}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-white/10">
                    <span className="font-semibold text-green-400">Preço Final</span>
                    <span className="font-bold text-green-400 text-lg">
                      {formatBRL((Number(projeto.precoVendaTotal) * (1 - Number(projeto.desconto) / 100)).toFixed(2))}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-blue-200/60">Markup</span>
                <span>{Number(projeto.markupAplicado).toFixed(4)}×</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-3 mt-2">
                <span className="text-xs font-semibold">Indicador VI</span>
                <div className="flex items-center gap-1.5">
                  {viIcon}
                  <span className={`font-bold text-xl ${viColor}`}>{vi.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DRE Snapshot */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#0f2744]">
                DRE Aplicada — Exercício {snap.exercicio}
              </CardTitle>
              <p className="text-xs text-slate-400">Parâmetros congelados no momento da emissão</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: "Custos Fixos", value: formatPercent(snap.pctCustoFixo) },
                { label: "Impostos", value: formatPercent(snap.pctCustoVariavel) },
                { label: "Salários", value: formatPercent(snap.pctSalarios) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-slate-600">
                  <span>{label}</span><span className="font-medium text-[#0f2744]">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Metadados */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Responsável</span>
                <span className="font-medium text-[#0f2744]">{projeto.responsavel.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Criado em</span>
                <span className="font-medium text-[#0f2744]">
                  {new Date(projeto.criadoEm).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {projeto.emitidoEm && (
                <div className="flex justify-between">
                  <span>Emitido em</span>
                  <span className="font-medium text-[#0f2744]">
                    {new Date(projeto.emitidoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
