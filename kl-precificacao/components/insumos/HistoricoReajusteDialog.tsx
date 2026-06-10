"use client"

import { useState, useTransition } from "react"
import {
  historicoPreco,
  simularReajuste,
  type HistoricoPrecoRow,
  type SimularReajusteResult,
} from "@/actions/precos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatBRL } from "@/lib/markup"
import { toast } from "sonner"
import { LineChart, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface Props {
  componenteId: string
  descricao: string
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function Sparkline({ historico }: { historico: HistoricoPrecoRow[] }) {
  const valores = historico.map((h) => Number(h.precoCusto))
  if (valores.length < 2) return null
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const range = max - min || 1
  const w = 100
  const h = 28
  const pts = valores
    .map((v, i) => {
      const x = (i / (valores.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(" ")

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-8 w-full"
    >
      <polyline
        points={pts}
        fill="none"
        stroke="var(--kl-orange)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function HistoricoReajusteDialog({ componenteId, descricao }: Props) {
  const [open, setOpen] = useState(false)
  const [historico, setHistorico] = useState<HistoricoPrecoRow[]>([])
  const [variacao, setVariacao] = useState<string | null>(null)
  const [carregado, setCarregado] = useState(false)
  const [loadingHist, startLoadHist] = useTransition()

  const [pct, setPct] = useState("10")
  const [sim, setSim] = useState<SimularReajusteResult | null>(null)
  const [simulando, startSim] = useTransition()

  const carregarHistorico = () => {
    startLoadHist(async () => {
      const result = await historicoPreco(componenteId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setHistorico(result.historico)
      setVariacao(result.variacaoTrimestre)
      setCarregado(true)
    })
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next && !carregado && !loadingHist) {
      carregarHistorico()
    }
    if (!next) {
      setSim(null)
    }
  }

  const handleSimular = (e: React.FormEvent) => {
    e.preventDefault()
    const valor = Number(pct)
    if (isNaN(valor)) {
      toast.error("Informe um percentual válido.")
      return
    }
    startSim(async () => {
      const result = await simularReajuste(componenteId, valor)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      setSim(result)
    })
  }

  const variacaoNum = variacao !== null ? Number(variacao) : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 border-line px-2 text-xs text-ink-soft hover:bg-surface-2 hover:text-ink"
        >
          <LineChart className="h-3 w-3" />
          Histórico
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-ink">Histórico e impacto de reajuste</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-sm leading-snug text-muted-fg">{descricao}</p>

        {/* (a) Histórico de preços */}
        <section className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-fg">
              Histórico de preços
            </h3>
            {variacaoNum !== null && (
              <span
                className={
                  "num inline-flex items-center gap-1 text-[12px] font-medium " +
                  (variacaoNum > 0
                    ? "text-red-600"
                    : variacaoNum < 0
                    ? "text-emerald-600"
                    : "text-ink-soft")
                }
              >
                {variacaoNum > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : variacaoNum < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
                {variacaoNum > 0 ? "+" : ""}
                {variacao}% no último trimestre
              </span>
            )}
          </div>

          {loadingHist ? (
            <p className="text-[13px] text-muted-fg">Carregando…</p>
          ) : historico.length === 0 ? (
            <p className="text-[13px] text-muted-fg">Sem histórico de preços.</p>
          ) : (
            <>
              <Sparkline historico={historico} />
              <div className="max-h-44 overflow-y-auto rounded-md border border-line">
                <table className="w-full border-collapse">
                  <tbody>
                    {historico
                      .slice()
                      .reverse()
                      .map((h, i) => (
                        <tr
                          key={h.id}
                          className={i > 0 ? "border-t border-line" : ""}
                        >
                          <td className="num px-3 py-1.5 text-[12px] text-ink-soft">
                            {fmtData(h.vigenteDe)}
                            {h.vigenteAte === null && (
                              <span className="ml-1.5 rounded bg-brand-bg px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                atual
                              </span>
                            )}
                          </td>
                          <td className="num px-3 py-1.5 text-right text-[12px] font-medium text-ink">
                            {formatBRL(h.precoCusto)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* (b) Simulador de reajuste */}
        <section className="mt-5 space-y-3 border-t border-line pt-4">
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-fg">
            Simular reajuste
          </h3>
          <form onSubmit={handleSimular} className="flex items-end gap-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-ink">Reajuste (%)</Label>
              <div className="relative">
                <Input
                  value={pct}
                  onChange={(e) => setPct(e.target.value)}
                  type="number"
                  step="0.01"
                  className="num h-9 w-32 pr-7"
                />
                <span className="num absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-fg">
                  %
                </span>
              </div>
            </div>
            <Button
              type="submit"
              disabled={simulando}
              className="h-9 bg-brand text-white hover:bg-brand-hover"
            >
              {simulando ? "Calculando…" : "Simular"}
            </Button>
          </form>

          {sim && (
            <div className="space-y-3">
              <div className="rounded-md border border-line bg-surface-2 px-3 py-2.5">
                <p className="text-[13px] leading-snug text-ink-soft">
                  Reajustar{" "}
                  <span className="num font-semibold text-ink">{sim.pct}%</span>{" "}
                  afeta{" "}
                  <span className="num font-semibold text-ink">
                    {sim.totalProjetos}
                  </span>{" "}
                  projeto{sim.totalProjetos !== 1 ? "s" : ""} em rascunho{" "}
                  <span className="num font-semibold text-brand">
                    (+{formatBRL(sim.custoAdicionalTotal)} de custo direto)
                  </span>
                </p>
              </div>

              {sim.projetos.length > 0 && (
                <div className="max-h-44 overflow-y-auto rounded-md border border-line">
                  <table className="w-full border-collapse">
                    <tbody>
                      {sim.projetos.map((p, i) => (
                        <tr
                          key={p.id}
                          className={i > 0 ? "border-t border-line" : ""}
                        >
                          <td className="px-3 py-1.5">
                            <p className="text-[12px] font-medium leading-tight text-ink">
                              {p.nome}
                            </p>
                            <p className="num text-[11px] text-muted-fg">
                              {p.numeroReferencia}
                            </p>
                          </td>
                          <td className="num px-3 py-1.5 text-right text-[12px] text-ink-soft">
                            {formatBRL(p.custoDiretoTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  )
}
