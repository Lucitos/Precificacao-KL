import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { formatBRL, formatPercent } from "@/lib/markup"
import { FolderOpen, TrendingUp, Calendar, BarChart2, ArrowRight, FileText, DollarSign, Percent } from "lucide-react"
import Link from "next/link"

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Rascunho",
  EMITIDO: "Emitido",
  VENDIDO: "Vendido",
  CANCELADO: "Cancelado",
}
const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  RASCUNHO:  { bg: "#F9FAFB", color: "#6B7280", border: "rgba(0,0,0,0.1)" },
  EMITIDO:   { bg: "#F0FDF4", color: "#16A34A", border: "rgba(22,163,74,0.2)" },
  VENDIDO:   { bg: "#EFF6FF", color: "#2563EB", border: "rgba(37,99,235,0.2)" },
  CANCELADO: { bg: "#FEF2F2", color: "#DC2626", border: "rgba(220,38,38,0.2)" },
}

function MonthlyBarChart({
  data,
  label,
  color,
  formatValue,
}: {
  data: { mes: string; value: number }[]
  label: string
  color: string
  formatValue: (v: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const H = 80
  const barW = 28
  const gap = 8
  const totalW = data.length * (barW + gap) - gap + 4

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "#9AABAE" }}>
        {label}
      </p>
      <div className="overflow-x-auto">
        <svg width={totalW} height={H + 24} style={{ display: "block" }}>
          {data.map((d, i) => {
            const barH = max > 0 ? Math.max((d.value / max) * H, d.value > 0 ? 4 : 0) : 0
            const x = i * (barW + gap)
            const y = H - barH
            return (
              <g key={d.mes}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={5}
                  fill={d.value > 0 ? color : "#F3F4F6"}
                />
                <text
                  x={x + barW / 2}
                  y={H + 14}
                  textAnchor="middle"
                  style={{ fontSize: 9, fill: "#9AABAE", fontWeight: 600 }}
                >
                  {d.mes}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      {max > 0 && (
        <p className="text-[12px] font-bold mt-1" style={{ color }}>
          {formatValue(data.reduce((s, d) => s + d.value, 0))}
          <span className="text-[10px] font-normal ml-1" style={{ color: "#9AABAE" }}>total 6 meses</span>
        </p>
      )}
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getSession()

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const sixMonthsAgo = new Date(agora.getFullYear(), agora.getMonth() - 5, 1)

  const [totalProjetos, projetos, dre, totalInsumos, kpiProjetos, projetosMensaisData] = await Promise.all([
    prisma.projeto.count(),
    prisma.projeto.findMany({
      orderBy: { criadoEm: "desc" },
      take: 7,
      include: { responsavel: { select: { name: true } } },
    }),
    prisma.dREParametros.findFirst({ where: { ativo: true } }),
    prisma.componente.count({ where: { ativo: true } }),
    prisma.projeto.findMany({
      where: { status: { in: ["EMITIDO", "VENDIDO"] } },
      select: { precoVendaTotal: true, markupAplicado: true, margemAplicada: true },
    }),
    prisma.projeto.findMany({
      where: { criadoEm: { gte: sixMonthsAgo } },
      select: { criadoEm: true, status: true, precoVendaTotal: true, markupAplicado: true, margemAplicada: true },
    }),
  ])

  const valorTotal = kpiProjetos.reduce((acc, p) => acc + Number(p.precoVendaTotal), 0)
  const markupMedio = kpiProjetos.length > 0
    ? kpiProjetos.reduce((acc, p) => acc + Number(p.markupAplicado), 0) / kpiProjetos.length
    : 0
  const margemMedia = kpiProjetos.length > 0
    ? kpiProjetos.reduce((acc, p) => acc + Number(p.margemAplicada), 0) / kpiProjetos.length * 100
    : 0
  const ticketMedio = kpiProjetos.length > 0 ? valorTotal / kpiProjetos.length : 0

  const projetosMes = projetos.filter((p) => new Date(p.criadoEm) >= inicioMes).length

  // Monthly chart data (last 6 months)
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1)
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    }
  })

  const dadosMensais = meses.map((m) => {
    const projetosDoPeriodo = projetosMensaisData.filter((p) => {
      const d = new Date(p.criadoEm)
      return d.getFullYear() === m.year && d.getMonth() === m.month
    })
    const emitidos = projetosDoPeriodo.filter((p) => p.status === "EMITIDO" || p.status === "VENDIDO")
    return {
      mes: m.mes,
      criados: projetosDoPeriodo.length,
      valorEmitido: emitidos.reduce((s, p) => s + Number(p.precoVendaTotal), 0),
      markupMedio: emitidos.length > 0
        ? emitidos.reduce((s, p) => s + Number(p.markupAplicado), 0) / emitidos.length
        : 0,
    }
  })

  const kpis = [
    {
      label: "Total de Projetos",
      value: totalProjetos,
      sub: `${totalInsumos} insumos cadastrados`,
      icon: <FolderOpen className="w-[17px] h-[17px]" />,
      accent: "#1C2B30",
      iconBg: "rgba(28,43,48,0.08)",
    },
    {
      label: "Valor Total Emitido",
      value: formatBRL(valorTotal),
      sub: `${kpiProjetos.length} projetos emitidos/vendidos`,
      icon: <TrendingUp className="w-[17px] h-[17px]" />,
      accent: "#16A34A",
      iconBg: "#F0FDF4",
      large: true,
    },
    {
      label: "Ticket Médio",
      value: ticketMedio > 0 ? formatBRL(ticketMedio) : "—",
      sub: "por projeto emitido",
      icon: <DollarSign className="w-[17px] h-[17px]" />,
      accent: "#2563EB",
      iconBg: "#EFF6FF",
      large: true,
    },
    {
      label: "Projetos este Mês",
      value: projetosMes,
      sub: agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      icon: <Calendar className="w-[17px] h-[17px]" />,
      accent: "#E87722",
      iconBg: "#FEF3E9",
    },
    {
      label: "Markup Médio",
      value: markupMedio > 0 ? `${markupMedio.toFixed(3)}×` : "—",
      sub: "sobre custo direto",
      icon: <BarChart2 className="w-[17px] h-[17px]" />,
      accent: "#7C3AED",
      iconBg: "#F5F3FF",
    },
    {
      label: "Margem Média",
      value: margemMedia > 0 ? `${margemMedia.toFixed(1)}%` : "—",
      sub: "sobre preço de venda",
      icon: <Percent className="w-[17px] h-[17px]" />,
      accent: "#D97706",
      iconBg: "#FFFBEB",
    },
  ]

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: "#E87722" }}>
            Visão geral
          </p>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em] mb-1" style={{ color: "#1C2B30" }}>
            Olá, {session?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-[14px]" style={{ color: "#5F7177" }}>
            Aqui está o resumo dos seus projetos de precificação.
          </p>
        </div>
        <Link href="/projetos/novo">
          <button
            className="inline-flex items-center gap-1.5 h-[46px] px-5 rounded-lg text-[12px] font-bold uppercase tracking-[0.04em] text-white transition-all"
            style={{ background: "#E87722", boxShadow: "0 2px 8px rgba(232,119,34,0.25)", fontFamily: "inherit" }}
          >
            <span className="text-lg leading-none">+</span>
            Novo Projeto
          </button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4 mb-7">
        {kpis.map(({ label, value, sub, icon, accent, iconBg, large }) => (
          <div
            key={label}
            className="rounded-xl p-5"
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <div className="flex items-start justify-between mb-3.5">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.06em] pr-2"
                style={{ color: "#9AABAE" }}
              >
                {label}
              </p>
              <div
                className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center flex-shrink-0"
                style={{ background: iconBg, color: accent }}
              >
                {icon}
              </div>
            </div>
            <p
              className="font-extrabold tracking-[-0.02em] leading-none"
              style={{
                fontSize: large && String(value).length > 8 ? 16 : large ? 20 : 26,
                color: "#1C2B30",
              }}
            >
              {value}
            </p>
            <p className="text-[11px] mt-1.5" style={{ color: "#9AABAE" }}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_292px] gap-5">
        {/* Recent projects */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="flex items-center justify-between px-[22px] py-[18px]"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: "#9AABAE" }}>
                Atividade recente
              </p>
              <p className="text-[15px] font-bold" style={{ color: "#1C2B30" }}>Últimos Projetos</p>
            </div>
            <Link
              href="/projetos"
              className="flex items-center gap-1 text-[12px] font-bold transition-colors"
              style={{ color: "#E87722" }}
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {projetos.length === 0 ? (
            <div className="px-[22px] py-10 text-center text-[13px]" style={{ color: "#9AABAE" }}>
              Nenhum projeto ainda.{" "}
              <Link href="/projetos/novo" className="font-bold" style={{ color: "#E87722" }}>
                Criar o primeiro →
              </Link>
            </div>
          ) : (
            <div>
              {projetos.map((p, i) => {
                const sc = STATUS_COLORS[p.status] ?? STATUS_COLORS.RASCUNHO
                return (
                  <div key={p.id}>
                    {i > 0 && <div style={{ height: 1, background: "rgba(0,0,0,0.05)" }} />}
                    <Link
                      href={`/projetos/${p.id}`}
                      className="flex items-center gap-3.5 px-[22px] py-[13px] transition-colors group hover:bg-[#F8F7F4]"
                    >
                      <div
                        className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                        style={{ background: "#FEF3E9", color: "#E87722" }}
                      >
                        <FileText className="w-[17px] h-[17px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: "#1C2B30" }}>
                          {p.nome}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#9AABAE" }}>
                          {p.numeroReferencia} · {p.cliente}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[13px] font-bold" style={{ color: "#1C2B30" }}>
                          {formatBRL(p.precoVendaTotal.toString())}
                        </p>
                        <span
                          className="inline-flex items-center h-[22px] px-[9px] rounded-[6px] text-[10px] font-bold uppercase tracking-[0.06em] mt-1"
                          style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                        >
                          {STATUS_LABELS[p.status]}
                        </span>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3.5">
          {/* DRE panel */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "#0A2530",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="flex items-center gap-2.5 px-[18px] py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-white flex-shrink-0"
                style={{ background: "#E87722" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-bold text-white">DRE Vigente</p>
                <p className="text-[10px] tracking-[0.06em] uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
                  EXERCÍCIO {dre?.exercicio ?? "—"}
                </p>
              </div>
            </div>

            <div className="px-[18px] pb-4 pt-3">
              {dre ? (
                <>
                  {[
                    { l: "Custos Fixos", v: formatPercent(dre.pctCustoFixo.toString()) },
                    { l: "Impostos", v: formatPercent(dre.pctCustoVariavel.toString()) },
                    { l: "Salários", v: formatPercent(dre.pctSalarios.toString()) },
                  ].map(({ l, v }) => (
                    <div
                      key={l}
                      className="flex justify-between items-center py-[9px]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>{l}</p>
                      <p className="text-[15px] font-extrabold text-white">{v}</p>
                    </div>
                  ))}
                  <div
                    className="mt-3 px-3 py-2.5 rounded-lg"
                    style={{ background: "rgba(232,119,34,0.1)" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.06em] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Markup mín. s/ margem
                    </p>
                    <p className="text-[22px] font-extrabold" style={{ color: "#F5A623" }}>
                      {dre
                        ? (1 / (1 - (Number(dre.pctCustoFixo) + Number(dre.pctCustoVariavel) + Number(dre.pctSalarios)))).toFixed(4) + "×"
                        : "—"}
                    </p>
                  </div>
                  <Link
                    href="/dre"
                    className="block text-center text-[12px] font-bold mt-2.5 py-1"
                    style={{ color: "#F5A623" }}
                  >
                    Gerenciar DRE →
                  </Link>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>Nenhum DRE ativo</p>
                  <Link href="/dre" className="text-[12px] font-bold mt-1 block" style={{ color: "#F5A623" }}>
                    Configurar DRE →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div
            className="rounded-xl p-[18px]"
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "#9AABAE" }}>
              Resumo financeiro
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="px-3.5 py-3 rounded-lg" style={{ background: "#F8F7F4" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.06em] mb-1" style={{ color: "#9AABAE" }}>
                  Total emitido
                </p>
                <p className="text-[16px] font-extrabold" style={{ color: "#16A34A" }}>
                  {formatBRL(valorTotal)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="px-3.5 py-3 rounded-lg" style={{ background: "#F8F7F4" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.06em] mb-1" style={{ color: "#9AABAE" }}>Ticket Médio</p>
                  <p className="text-[13px] font-extrabold" style={{ color: "#2563EB" }}>
                    {ticketMedio > 0 ? formatBRL(ticketMedio) : "—"}
                  </p>
                </div>
                <div className="px-3.5 py-3 rounded-lg" style={{ background: "#F8F7F4" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.06em] mb-1" style={{ color: "#9AABAE" }}>Margem média</p>
                  <p className="text-[16px] font-extrabold" style={{ color: "#D97706" }}>
                    {margemMedia > 0 ? `${margemMedia.toFixed(1)}%` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Charts */}
      <div className="mt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-4" style={{ color: "#9AABAE" }}>
          Indicadores mensais — últimos 6 meses
        </p>
        <div className="grid grid-cols-3 gap-4">
          <MonthlyBarChart
            data={dadosMensais.map((d) => ({ mes: d.mes, value: d.criados }))}
            label="Projetos criados"
            color="#E87722"
            formatValue={(v) => `${v} projetos`}
          />
          <MonthlyBarChart
            data={dadosMensais.map((d) => ({ mes: d.mes, value: d.valorEmitido }))}
            label="Valor emitido (R$)"
            color="#16A34A"
            formatValue={(v) => formatBRL(v)}
          />
          <MonthlyBarChart
            data={dadosMensais.map((d) => ({ mes: d.mes, value: d.markupMedio }))}
            label="Markup médio"
            color="#7C3AED"
            formatValue={(v) => `${v.toFixed(3)}×`}
          />
        </div>
      </div>
    </div>
  )
}
