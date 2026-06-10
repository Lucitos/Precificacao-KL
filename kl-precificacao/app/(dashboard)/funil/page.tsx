import { prisma } from "@/lib/db"
import { formatBRL } from "@/lib/markup"
import { Header } from "@/components/layout/Header"
import { SectionHeading } from "@/components/ui/section"
import { Stat } from "@/components/ui/stat"
import { STATUS } from "@/lib/status"
import { cn } from "@/lib/utils"

export default async function FunilPage() {
  const projetos = await prisma.projeto.findMany({
    select: {
      status: true,
      precoVendaTotal: true,
      emitidoEm: true,
      vendidoEm: true,
      motivoCancelamento: true,
    },
  })

  // Contagem por status
  const counts = {
    RASCUNHO: 0,
    EMITIDO: 0,
    VENDIDO: 0,
    CANCELADO: 0,
  }
  for (const p of projetos) {
    if (p.status in counts) counts[p.status as keyof typeof counts]++
  }

  // Base "emitida" = projetos que chegaram a ser emitidos (EMITIDO + VENDIDO).
  const baseEmitidos = counts.EMITIDO + counts.VENDIDO
  const vendidos = counts.VENDIDO
  const taxaConversao = baseEmitidos > 0 ? (vendidos / baseEmitidos) * 100 : 0

  // Valor em pipeline = Σ precoVendaTotal dos projetos atualmente EMITIDO.
  const pipelineValor = projetos
    .filter((p) => p.status === "EMITIDO")
    .reduce((acc, p) => acc + Number(p.precoVendaTotal), 0)

  // Tempo médio até a venda (dias) sobre VENDIDO com ambos os timestamps.
  const vendidosComDatas = projetos.filter(
    (p) => p.status === "VENDIDO" && p.emitidoEm && p.vendidoEm
  )
  const tempoMedioDias =
    vendidosComDatas.length > 0
      ? vendidosComDatas.reduce((acc, p) => {
          const ms = new Date(p.vendidoEm!).getTime() - new Date(p.emitidoEm!).getTime()
          return acc + ms / (1000 * 60 * 60 * 24)
        }, 0) / vendidosComDatas.length
      : null

  // Motivos de cancelamento agrupados.
  const motivosMap = new Map<string, number>()
  for (const p of projetos.filter((p) => p.status === "CANCELADO")) {
    const motivo = p.motivoCancelamento?.trim() || "Sem motivo"
    motivosMap.set(motivo, (motivosMap.get(motivo) ?? 0) + 1)
  }
  const motivos = Array.from(motivosMap.entries())
    .map(([motivo, count]) => ({ motivo, count }))
    .sort((a, b) => b.count - a.count)
  const maxMotivo = Math.max(...motivos.map((m) => m.count), 1)

  // Etapas do funil (RASCUNHO → EMITIDO → VENDIDO).
  const etapas = [
    { key: "RASCUNHO" as const, count: counts.RASCUNHO },
    { key: "EMITIDO" as const, count: counts.EMITIDO },
    { key: "VENDIDO" as const, count: counts.VENDIDO },
  ]
  const maxEtapa = Math.max(...etapas.map((e) => e.count), 1)

  const kpis = [
    {
      label: "Taxa de conversão",
      value: baseEmitidos > 0 ? `${taxaConversao.toFixed(1)}%` : "—",
      sub: `${vendidos} vendidos de ${baseEmitidos} emitidos`,
      accent: true,
    },
    {
      label: "Valor em pipeline",
      value: pipelineValor > 0 ? formatBRL(pipelineValor) : "—",
      sub: `${counts.EMITIDO} emitidos aguardando`,
    },
    {
      label: "Tempo médio até venda",
      value: tempoMedioDias !== null ? `${tempoMedioDias.toFixed(0)} dias` : "—",
      sub: `${vendidosComDatas.length} vendas com datas`,
    },
  ]

  return (
    <div>
      <Header
        eyebrow="Comercial"
        title="Funil de vendas"
        subtitle="Conversão, pipeline e motivos de cancelamento dos projetos."
      />

      {/* KPIs */}
      <div className="mb-7 grid grid-cols-3 border-y border-line">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className={cn(
              "py-4",
              i !== 2 && "border-r border-line",
              i === 0 ? "pr-6" : i === 2 ? "pl-6" : "px-6"
            )}
          >
            <Stat label={k.label} value={k.value} sub={k.sub} accent={k.accent} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-8">
        {/* Funil de etapas */}
        <section>
          <SectionHeading
            title="Etapas do funil"
            action={
              <span className="num text-[12px] text-muted-fg">
                {counts.CANCELADO} cancelados
              </span>
            }
          />
          <div className="space-y-3">
            {etapas.map((e) => {
              const style = STATUS[e.key]
              const pct = (e.count / maxEtapa) * 100
              return (
                <div key={e.key} className="flex items-center gap-3">
                  <span className="w-20 flex-shrink-0 text-[12px] font-medium text-ink-soft">
                    {style.label}
                  </span>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-surface-2">
                    <div
                      className="h-full rounded-md transition-all"
                      style={{
                        width: `${Math.max(pct, e.count > 0 ? 4 : 0)}%`,
                        backgroundColor: style.color,
                        opacity: 0.75,
                      }}
                    />
                  </div>
                  <span className="num w-10 flex-shrink-0 text-right text-[14px] font-medium text-ink">
                    {e.count}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Motivos de cancelamento */}
        <section>
          <SectionHeading
            title="Motivos de cancelamento"
            action={
              <span className="num text-[12px] text-muted-fg">
                {counts.CANCELADO}
              </span>
            }
          />
          {motivos.length === 0 ? (
            <p className="py-6 text-[13px] text-muted-fg">
              Nenhum projeto cancelado ainda.
            </p>
          ) : (
            <div className="space-y-2.5">
              {motivos.map((m) => {
                const pct = (m.count / maxMotivo) * 100
                return (
                  <div key={m.motivo}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[12px] text-ink-soft">{m.motivo}</span>
                      <span className="num text-[12px] font-medium text-ink">{m.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(pct, 4)}%`,
                          backgroundColor: STATUS.CANCELADO.color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
