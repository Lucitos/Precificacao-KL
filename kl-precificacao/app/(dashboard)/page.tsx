import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatBRL, formatPercent } from "@/lib/markup"
import { FolderOpen, TrendingUp, Calendar, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EMITIDO: "Emitido",
  CANCELADO: "Cancelado",
}
const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: "bg-slate-100 text-slate-600",
  EMITIDO: "bg-blue-100 text-blue-700",
  CANCELADO: "bg-red-100 text-red-700",
}

export default async function DashboardPage() {
  const session = await getSession()

  const [totalProjetos, projetos, dre, totalInsumos] = await Promise.all([
    prisma.projeto.count(),
    prisma.projeto.findMany({
      orderBy: { criadoEm: "desc" },
      take: 8,
      include: { responsavel: { select: { name: true } } },
    }),
    prisma.dREParametros.findFirst({ where: { ativo: true } }),
    prisma.componente.count({ where: { ativo: true } }),
  ])

  const projetosEmitidos = projetos.filter((p) => p.status === "EMITIDO")
  const valorTotal = projetosEmitidos.reduce((acc, p) => acc + Number(p.precoVendaTotal), 0)
  const markupMedio =
    projetosEmitidos.length > 0
      ? projetosEmitidos.reduce((acc, p) => acc + Number(p.markupAplicado), 0) / projetosEmitidos.length
      : 0

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const projetosMes = projetos.filter((p) => new Date(p.criadoEm) >= inicioMes).length

  return (
    <div>
      <Header
        title={`Olá, ${session?.name?.split(" ")[0]} 👋`}
        subtitle="Aqui está um resumo dos seus projetos"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Total de Projetos</span>
              <div className="w-9 h-9 rounded-xl bg-[#0f2744]/10 flex items-center justify-center">
                <FolderOpen className="w-4.5 h-4.5 text-[#0f2744]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#0f2744]">{totalProjetos}</p>
            <p className="text-xs text-slate-400 mt-1">{totalInsumos} insumos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Valor Total Emitido</span>
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#0f2744]">{formatBRL(valorTotal)}</p>
            <p className="text-xs text-slate-400 mt-1">{projetosEmitidos.length} projetos emitidos</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Projetos este Mês</span>
              <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center">
                <Calendar className="w-4.5 h-4.5 text-[#f59e0b]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#0f2744]">{projetosMes}</p>
            <p className="text-xs text-slate-400 mt-1">
              {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Markup Médio</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#0f2744]">
              {markupMedio > 0 ? `${markupMedio.toFixed(2)}×` : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-1">sobre o custo direto</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Últimos projetos */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold text-[#0f2744]">Últimos Projetos</CardTitle>
              <Link
                href="/projetos"
                className="flex items-center gap-1 text-xs text-[#f59e0b] font-medium hover:text-[#d97706] transition-colors"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {projetos.length === 0 ? (
                <div className="px-6 py-10 text-center text-slate-400 text-sm">
                  Nenhum projeto ainda.{" "}
                  <Link href="/projetos/novo" className="text-[#0f2744] font-medium hover:underline">
                    Criar o primeiro
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {projetos.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projetos/${p.id}`}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0f2744] truncate group-hover:text-[#1a3a5c]">
                          {p.nome}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {p.numeroReferencia} · {p.cliente}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-[#0f2744]">
                          {formatBRL(p.precoVendaTotal.toString())}
                        </p>
                        <Badge className={`text-[10px] px-1.5 py-0.5 mt-0.5 ${STATUS_COLORS[p.status]} border-0`}>
                          {STATUS_LABELS[p.status]}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* DRE Vigente */}
        <div>
          <Card className="border-0 shadow-sm bg-[#0f2744] text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#f59e0b] flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-[#0f2744]" fill="currentColor" />
                </div>
                <CardTitle className="text-sm font-semibold text-white">DRE Vigente</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {dre ? (
                <>
                  <div className="flex items-center justify-between py-2.5 border-b border-white/10">
                    <span className="text-xs text-blue-200/70">Exercício</span>
                    <span className="text-sm font-bold text-[#f59e0b]">{dre.exercicio}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-blue-200/70">Custos Fixos</span>
                    <span className="text-sm font-semibold">{formatPercent(dre.pctCustoFixo.toString())}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-blue-200/70">Impostos</span>
                    <span className="text-sm font-semibold">{formatPercent(dre.pctCustoVariavel.toString())}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-blue-200/70">Salários</span>
                    <span className="text-sm font-semibold">{formatPercent(dre.pctSalarios.toString())}</span>
                  </div>
                  {dre.faturamentoEstimado && (
                    <div className="flex items-center justify-between py-2 border-t border-white/10">
                      <span className="text-xs text-blue-200/70">Faturamento Est.</span>
                      <span className="text-xs font-medium text-blue-200">
                        {formatBRL(dre.faturamentoEstimado.toString())}
                      </span>
                    </div>
                  )}
                  <Link
                    href="/dre"
                    className="block mt-2 text-center text-xs text-[#f59e0b] hover:text-[#fbbf24] transition-colors"
                  >
                    Gerenciar DRE →
                  </Link>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-blue-200/60">Nenhum DRE ativo</p>
                  <Link href="/dre" className="text-xs text-[#f59e0b] hover:underline mt-1 block">
                    Configurar DRE →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
