"use client"

import { useMemo, useState } from "react"
import { formatBRL } from "@/lib/markup"
import { STATUS, statusStyle } from "@/lib/status"
import { StatusBadge } from "@/components/ui/status-badge"
import ProjetoActionsDropdown from "./ProjetoActionsDropdown"
import { Search, FolderOpen, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Projeto = {
  id: string
  nome: string
  numeroReferencia: string
  cliente: string
  status: string
  custoDiretoTotal: { toString(): string }
  precoVendaTotal: { toString(): string }
  markupAplicado: { toString(): string }
  vi: { toString(): string }
  desconto: { toString(): string } | null
  itens: { id: string }[]
  criadoEm: string | Date
  responsavel: { name: string } | null
}

const STATUS_OPTS = ["TODOS", "EMITIDO", "VENDIDO", "RASCUNHO", "CANCELADO"] as const
const FILTRO_LABELS: Record<string, string> = {
  TODOS: "Todos", EMITIDO: "Emitidos", VENDIDO: "Vendidos", RASCUNHO: "Rascunhos", CANCELADO: "Cancelados",
}

const SELECT_CLASS =
  "h-9 rounded-md border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors focus:border-brand"
const NUM_INPUT_CLASS =
  "h-9 w-[112px] rounded-md border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-muted-fg focus:border-brand num"

export default function ProjetosClientPage({ projetos, userRole }: { projetos: Projeto[]; userRole: string }) {
  const [busca, setBusca] = useState("")
  const [filtro, setFiltro] = useState<typeof STATUS_OPTS[number]>("TODOS")
  const [cliente, setCliente] = useState("")
  const [responsavel, setResponsavel] = useState("")
  const [dataDe, setDataDe] = useState("")
  const [dataAte, setDataAte] = useState("")
  const [valorMin, setValorMin] = useState("")
  const [valorMax, setValorMax] = useState("")

  // Opções derivadas da lista carregada (distintas, ordenadas)
  const clientesOpts = useMemo(
    () => Array.from(new Set(projetos.map((p) => p.cliente).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [projetos]
  )
  const responsaveisOpts = useMemo(
    () =>
      Array.from(new Set(projetos.map((p) => p.responsavel?.name).filter((n): n is string => !!n))).sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [projetos]
  )

  const totalEmitido = projetos
    .filter((p) => p.status === "EMITIDO" || p.status === "VENDIDO")
    .reduce((a, p) => a + Number(p.precoVendaTotal), 0)

  const contagem = {
    emitidos: projetos.filter((p) => p.status === "EMITIDO").length,
    vendidos: projetos.filter((p) => p.status === "VENDIDO").length,
    rascunhos: projetos.filter((p) => p.status === "RASCUNHO").length,
    cancelados: projetos.filter((p) => p.status === "CANCELADO").length,
  }

  // Distribuição por status (barra segmentada — leitura numérica, sem donut)
  const distribuicao = [
    { key: "EMITIDO", label: "Emitidos", value: contagem.emitidos },
    { key: "VENDIDO", label: "Vendidos", value: contagem.vendidos },
    { key: "RASCUNHO", label: "Rascunhos", value: contagem.rascunhos },
    { key: "CANCELADO", label: "Cancelados", value: contagem.cancelados },
  ]
  const totalDist = distribuicao.reduce((s, d) => s + d.value, 0) || 1

  const stats = [
    { l: "Total", v: projetos.length },
    { l: "Emitidos", v: contagem.emitidos },
    { l: "Vendidos", v: contagem.vendidos },
    { l: "Rascunhos", v: contagem.rascunhos },
  ]

  const min = valorMin.trim() === "" ? null : Number(valorMin)
  const max = valorMax.trim() === "" ? null : Number(valorMax)
  // datas como timestamp (início do "de", fim do "até") — comparação inclusiva
  const tsDe = dataDe ? new Date(`${dataDe}T00:00:00`).getTime() : null
  const tsAte = dataAte ? new Date(`${dataAte}T23:59:59.999`).getTime() : null

  const filtrados = projetos.filter((p) => {
    const q = busca.toLowerCase()
    if (busca && !(p.nome.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q) || p.numeroReferencia.toLowerCase().includes(q)))
      return false
    if (filtro !== "TODOS" && p.status !== filtro) return false
    if (cliente && p.cliente !== cliente) return false
    if (responsavel && p.responsavel?.name !== responsavel) return false
    if (tsDe !== null || tsAte !== null) {
      const ts = new Date(p.criadoEm).getTime()
      if (tsDe !== null && ts < tsDe) return false
      if (tsAte !== null && ts > tsAte) return false
    }
    if (min !== null || max !== null) {
      const preco = Number(p.precoVendaTotal)
      if (min !== null && !Number.isNaN(min) && preco < min) return false
      if (max !== null && !Number.isNaN(max) && preco > max) return false
    }
    return true
  })

  const filtrosAtivos =
    !!busca || filtro !== "TODOS" || !!cliente || !!responsavel || !!dataDe || !!dataAte || valorMin.trim() !== "" || valorMax.trim() !== ""

  function limparFiltros() {
    setBusca("")
    setFiltro("TODOS")
    setCliente("")
    setResponsavel("")
    setDataDe("")
    setDataAte("")
    setValorMin("")
    setValorMax("")
  }

  return (
    <div>
      {/* Resumo — faixa sobre o papel */}
      <div className="grid grid-cols-5 border-y border-line">
        {[...stats.map((s) => ({ ...s, accent: false })), { l: "Emitido + vendido", v: formatBRL(totalEmitido), accent: true }].map((s, i) => (
          <div
            key={s.l}
            className={cn(
              "py-4",
              i > 0 && "border-l border-line",
              i === 0 ? "pr-5" : i === 4 ? "pl-5" : "px-5"
            )}
          >
            <p className={cn("num text-[23px] font-medium leading-none tracking-[-0.03em]", s.accent ? "text-brand" : "text-ink")}>
              {s.v}
            </p>
            <p className="mt-2 text-[12px] text-muted-fg">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Distribuição por status — barra full-width + legenda inline */}
      <div className="mb-6 mt-4">
        <div className="flex h-1.5 overflow-hidden rounded-full bg-surface-2">
          {distribuicao.map((d) =>
            d.value > 0 ? (
              <span
                key={d.key}
                style={{ width: `${(d.value / totalDist) * 100}%`, background: statusStyle(d.key).color }}
              />
            ) : null
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {distribuicao.map((d) => (
            <div key={d.key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: statusStyle(d.key).color }} />
              <span className="text-[12px] text-ink-soft">{d.label}</span>
              <span className="num text-[12px] font-medium text-ink">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-2.5 flex items-center gap-2.5">
        <div className="relative max-w-[360px] flex-1">
          <Search className="absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-muted-fg" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar projeto, cliente ou referência…"
            className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-[13px] text-ink outline-none transition-colors placeholder:text-muted-fg focus:border-brand"
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_OPTS.map((s) => {
            const active = filtro === s
            return (
              <button
                key={s}
                onClick={() => setFiltro(s)}
                className={cn(
                  "h-9 rounded-md border px-3 text-[12px] font-medium transition-colors",
                  active
                    ? "border-brand bg-brand-bg text-brand"
                    : "border-line bg-surface text-ink-soft hover:bg-surface-2"
                )}
              >
                {FILTRO_LABELS[s]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filtros avançados */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <select value={cliente} onChange={(e) => setCliente(e.target.value)} className={SELECT_CLASS} aria-label="Filtrar por cliente">
          <option value="">Todos os clientes</option>
          {clientesOpts.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className={SELECT_CLASS}
          aria-label="Filtrar por responsável"
        >
          <option value="">Todos os responsáveis</option>
          {responsaveisOpts.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dataDe}
            max={dataAte || undefined}
            onChange={(e) => setDataDe(e.target.value)}
            className={SELECT_CLASS}
            aria-label="Período: de"
          />
          <span className="text-[12px] text-muted-fg">até</span>
          <input
            type="date"
            value={dataAte}
            min={dataDe || undefined}
            onChange={(e) => setDataAte(e.target.value)}
            className={SELECT_CLASS}
            aria-label="Período: até"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={valorMin}
            onChange={(e) => setValorMin(e.target.value)}
            placeholder="Valor mín."
            className={NUM_INPUT_CLASS}
            aria-label="Valor mínimo"
          />
          <span className="text-[12px] text-muted-fg">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={valorMax}
            onChange={(e) => setValorMax(e.target.value)}
            placeholder="Valor máx."
            className={NUM_INPUT_CLASS}
            aria-label="Valor máximo"
          />
        </div>

        {filtrosAtivos && (
          <button
            onClick={limparFiltros}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-line bg-surface px-2.5 text-[12px] font-medium text-ink-soft transition-colors hover:bg-surface-2"
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </button>
        )}

        <span className="ml-auto text-[12px] text-muted-fg">
          <span className="num font-medium text-ink-soft">{filtrados.length}</span>
          {filtrosAtivos ? ` de ${projetos.length}` : ""} projeto{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabela — sobre o papel, delimitada por régua */}
      <div className="border-t border-line">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-muted-fg">
              <FolderOpen className="h-6 w-6" />
            </div>
            <p className="text-[14px] font-medium text-ink-soft">Nenhum projeto encontrado</p>
            <p className="mt-1 text-[13px] text-muted-fg">
              {busca ? `Sem resultados para "${busca}"` : filtrosAtivos ? "Nenhum projeto corresponde aos filtros" : "Crie o primeiro projeto"}
            </p>
            {filtrosAtivos && (
              <button
                onClick={limparFiltros}
                className="mt-3 inline-flex h-8 items-center gap-1 rounded-md border border-line bg-surface px-3 text-[12px] font-medium text-ink-soft transition-colors hover:bg-surface-2"
              >
                <X className="h-3.5 w-3.5" />
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  {[
                    { h: "Referência / Projeto", a: "left" },
                    { h: "Cliente", a: "left" },
                    { h: "Custo direto", a: "right" },
                    { h: "Preço final", a: "right" },
                    { h: "Markup", a: "right" },
                    { h: "Status", a: "center" },
                    { h: "Itens", a: "center" },
                    { h: "", a: "right" },
                  ].map(({ h, a }, i) => (
                    <th
                      key={h + i}
                      className={cn(
                        "px-3.5 py-2.5 text-[11px] font-medium text-muted-fg whitespace-nowrap",
                        i === 0 && "pl-0",
                        i === 7 && "pr-0",
                        a === "right" && "text-right",
                        a === "center" && "text-center",
                        a === "left" && "text-left"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p, i) => {
                  const hasDesconto = p.desconto !== null && Number(p.desconto) > 0
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-surface-2",
                        i < filtrados.length - 1 && "border-b border-line"
                      )}
                      onClick={() => (window.location.href = `/projetos/${p.id}`)}
                    >
                      <td className="py-3.5 pl-0 pr-3.5">
                        <p className="text-[13px] font-medium text-ink">{p.nome}</p>
                        <p className="num mt-0.5 text-[11px] text-muted-fg">{p.numeroReferencia}</p>
                      </td>
                      <td className="max-w-[160px] px-3.5 py-3.5">
                        <p className="truncate text-[13px] text-ink-soft">{p.cliente}</p>
                      </td>
                      <td className="num px-3.5 py-3.5 text-right text-[13px] text-muted-fg">
                        {formatBRL(p.custoDiretoTotal.toString())}
                      </td>
                      <td className="px-3.5 py-3.5 text-right">
                        {hasDesconto ? (
                          <>
                            <p className="num text-[11px] text-muted-fg line-through">
                              {formatBRL(p.precoVendaTotal.toString())}
                            </p>
                            <p className="num text-[13px] font-medium" style={{ color: STATUS.EMITIDO.color }}>
                              {formatBRL((Number(p.precoVendaTotal) * (1 - Number(p.desconto) / 100)).toFixed(2))}
                            </p>
                          </>
                        ) : (
                          <p className="num text-[13px] font-medium text-ink">
                            {formatBRL(p.precoVendaTotal.toString())}
                          </p>
                        )}
                      </td>
                      <td className="num px-3.5 py-3.5 text-right text-[13px] font-medium text-brand">
                        {Number(p.markupAplicado).toFixed(3)}×
                      </td>
                      <td className="px-3.5 py-3.5 text-center">
                        <span className="inline-flex">
                          <StatusBadge status={p.status} />
                        </span>
                      </td>
                      <td className="num px-3.5 py-3.5 text-center text-[13px] text-muted-fg">
                        {p.itens.length}
                      </td>
                      <td className="py-3.5 pl-3.5 pr-0 text-right" onClick={(e) => e.stopPropagation()}>
                        <ProjetoActionsDropdown
                          id={p.id}
                          status={p.status}
                          precoVenda={p.precoVendaTotal.toString()}
                          desconto={p.desconto ? Number(p.desconto) : null}
                          userRole={userRole}
                          nomeProjeto={p.nome}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
