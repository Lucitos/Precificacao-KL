import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { formatBRL, formatPercent } from "@/lib/markup"
import { ArrowRight, Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SectionHeading } from "@/components/ui/section"
import { Stat } from "@/components/ui/stat"
import { StatusBadge } from "@/components/ui/status-badge"

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

  // Dados mensais (últimos 6 meses)
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

  const periodoLabel = `${meses[0].mes}–${meses[5].mes}`
  const totalCriados = dadosMensais.reduce((s, d) => s + d.criados, 0)
  const totalEmitido6m = dadosMensais.reduce((s, d) => s + d.valorEmitido, 0)
  const markupMeses = dadosMensais.filter((d) => d.markupMedio > 0)
  const markupMedio6m = markupMeses.length
    ? markupMeses.reduce((s, d) => s + d.markupMedio, 0) / markupMeses.length
    : 0

  const markupMinimo = dre
    ? 1 / (1 - (Number(dre.pctCustoFixo) + Number(dre.pctCustoVariavel) + Number(dre.pctSalarios)))
    : 0

  const kpis = [
    { label: "Total de projetos", value: totalProjetos, sub: `${totalInsumos} insumos cadastrados` },
    { label: "Valor total emitido", value: formatBRL(valorTotal), sub: `${kpiProjetos.length} emitidos · vendidos`, accent: true },
    { label: "Ticket médio", value: ticketMedio > 0 ? formatBRL(ticketMedio) : "—", sub: "por projeto emitido" },
    { label: "Projetos este mês", value: projetosMes, sub: agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) },
    { label: "Markup médio", value: markupMedio > 0 ? `${markupMedio.toFixed(3)}×` : "—", sub: "sobre custo direto" },
    { label: "Margem média", value: margemMedia > 0 ? `${margemMedia.toFixed(1)}%` : "—", sub: "sobre preço de venda" },
  ]

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-muted-fg">Visão geral</p>
          <h1 className="text-[27px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink">
            Olá, {session?.name?.split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            Resumo dos seus projetos de precificação.
          </p>
        </div>
        <Link
          href="/projetos/novo"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" />
          Novo projeto
        </Link>
      </div>

      {/* Faixa de KPIs — sobre o papel, dividida por réguas */}
      <div className="mb-10 grid grid-cols-3 border-y border-line">
        {kpis.map((k, i) => {
          const col = i % 3
          return (
            <div
              key={k.label}
              className={cn(
                "py-5",
                col !== 2 && "border-r border-line",
                col === 0 ? "pr-6" : col === 2 ? "pl-6" : "px-6",
                i >= 3 && "border-t border-line"
              )}
            >
              <Stat label={k.label} value={k.value} sub={k.sub} accent={k.accent} />
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-10">
        {/* Projetos recentes */}
        <section>
          <SectionHeading
            title="Últimos projetos"
            action={
              <Link
                href="/projetos"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-brand transition-colors hover:text-brand-hover"
              >
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {projetos.length === 0 ? (
            <div className="py-10 text-[13px] text-muted-fg">
              Nenhum projeto ainda.{" "}
              <Link href="/projetos/novo" className="font-medium text-brand">
                Criar o primeiro →
              </Link>
            </div>
          ) : (
            <ul className="-mt-1">
              {projetos.map((p, i) => (
                <li key={p.id} className={i > 0 ? "border-t border-line" : ""}>
                  <Link
                    href={`/projetos/${p.id}`}
                    className="group -mx-2 flex items-center gap-4 rounded-md px-2 py-3 transition-colors hover:bg-surface-2"
                  >
                    <span className="num w-6 flex-shrink-0 text-[12px] text-muted-fg">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{p.nome}</p>
                      <p className="num mt-0.5 text-[11px] text-muted-fg">
                        {p.numeroReferencia} · {p.cliente}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <p className="num text-[13px] font-medium text-ink">
                        {formatBRL(p.precoVendaTotal.toString())}
                      </p>
                      <StatusBadge status={p.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Coluna direita */}
        <div className="flex flex-col gap-8">
          {/* Painel DRE (escuro — contraste pontual) */}
          <div className="relative overflow-hidden rounded-lg bg-dark text-white">
            <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5">
              <p className="text-[13px] font-semibold text-white">DRE vigente</p>
              <span className="num text-[12px] text-white/45">Exercício {dre?.exercicio ?? "—"}</span>
            </div>

            <div className="relative px-4 py-3">
              {dre ? (
                <>
                  {[
                    { l: "Custos fixos", v: formatPercent(dre.pctCustoFixo.toString()) },
                    { l: "Impostos", v: formatPercent(dre.pctCustoVariavel.toString()) },
                    { l: "Salários", v: formatPercent(dre.pctSalarios.toString()) },
                  ].map(({ l, v }, idx) => (
                    <div
                      key={l}
                      className={cn(
                        "flex items-center justify-between py-2.5",
                        idx > 0 && "border-t border-white/[0.06]"
                      )}
                    >
                      <p className="text-[12px] text-white/50">{l}</p>
                      <p className="num text-[13px] font-medium text-white">{v}</p>
                    </div>
                  ))}
                  <div className="mt-3 rounded-md bg-brand/10 px-3.5 py-3">
                    <p className="text-[11px] text-white/45">Markup mínimo s/ margem</p>
                    <p className="num mt-1 text-[22px] font-medium tracking-[-0.02em] text-brand-bright">
                      {markupMinimo.toFixed(4)}×
                    </p>
                  </div>
                  <Link
                    href="/dre"
                    className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-brand-bright transition-opacity hover:opacity-80"
                  >
                    Gerenciar DRE <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-[13px] text-white/40">Nenhum DRE ativo</p>
                  <Link href="/dre" className="mt-1 block text-[12px] font-medium text-brand-bright">
                    Configurar DRE →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Resumo financeiro — sobre o papel */}
          <section>
            <SectionHeading title="Resumo financeiro" />
            <div className="divide-y divide-line">
              <div className="py-3">
                <Stat label="Total emitido" value={formatBRL(valorTotal)} accent />
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[12px] text-muted-fg">Ticket médio</span>
                <span className="num text-[14px] font-medium text-ink">
                  {ticketMedio > 0 ? formatBRL(ticketMedio) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[12px] text-muted-fg">Margem média</span>
                <span className="num text-[14px] font-medium text-ink">
                  {margemMedia > 0 ? `${margemMedia.toFixed(1)}%` : "—"}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Indicadores mensais — numéricos + sparkline, sobre o papel */}
      <section className="mt-10">
        <SectionHeading
          title="Indicadores mensais"
          action={<span className="num text-[12px] text-muted-fg">{periodoLabel}</span>}
        />
        <div className="grid grid-cols-3">
          {[
            { label: "Projetos criados", value: totalCriados, sub: "total no período", spark: dadosMensais.map((d) => d.criados), color: "var(--kl-orange)" },
            { label: "Valor emitido", value: formatBRL(totalEmitido6m), sub: "total no período", spark: dadosMensais.map((d) => d.valorEmitido), color: "#2E7D52" },
            { label: "Markup médio", value: markupMedio6m > 0 ? `${markupMedio6m.toFixed(3)}×` : "—", sub: "média do período", spark: dadosMensais.map((d) => d.markupMedio), color: "#2B6BBF" },
          ].map((ind, i) => (
            <div
              key={ind.label}
              className={cn(
                "py-1",
                i !== 2 && "border-r border-line",
                i === 0 ? "pr-6" : i === 2 ? "pl-6" : "px-6"
              )}
            >
              <Stat label={ind.label} value={ind.value} sub={ind.sub} spark={ind.spark} sparkColor={ind.color} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
