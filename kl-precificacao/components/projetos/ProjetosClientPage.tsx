"use client"

import { useState, useRef } from "react"
import { formatBRL } from "@/lib/markup"
import { STATUS, statusStyle } from "@/lib/status"
import { StatusBadge } from "@/components/ui/status-badge"
import { Panel } from "@/components/ui/panel"
import ProjetoActionsDropdown from "./ProjetoActionsDropdown"
import { Search, FolderOpen } from "lucide-react"
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
}

const STATUS_OPTS = ["TODOS", "EMITIDO", "VENDIDO", "RASCUNHO", "CANCELADO"] as const
const FILTRO_LABELS: Record<string, string> = {
  TODOS: "Todos", EMITIDO: "Emitidos", VENDIDO: "Vendidos", RASCUNHO: "Rascunhos", CANCELADO: "Cancelados",
}

export default function ProjetosClientPage({ projetos, userRole }: { projetos: Projeto[]; userRole: string }) {
  const [busca, setBusca] = useState("")
  const [filtro, setFiltro] = useState<typeof STATUS_OPTS[number]>("TODOS")
  const tableRef = useRef<HTMLDivElement>(null)

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

  const filtrados = projetos.filter((p) => {
    const q = busca.toLowerCase()
    return (
      (!busca || p.nome.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q) || p.numeroReferencia.toLowerCase().includes(q))
      && (filtro === "TODOS" || p.status === filtro)
    )
  })

  return (
    <div>
      {/* Resumo */}
      <div className="mb-6 grid grid-cols-[1fr_340px] gap-6">
        <Panel className="grid grid-cols-4 overflow-hidden">
          {stats.map((s, i) => (
            <div key={s.l} className={cn("px-5 py-4", i > 0 && "border-l border-line")}>
              <p className="num text-[26px] font-medium leading-none tracking-[-0.03em] text-ink">{s.v}</p>
              <p className="mt-2 text-[12px] text-muted-fg">{s.l}</p>
            </div>
          ))}
        </Panel>

        <Panel className="flex flex-col justify-center px-5 py-4">
          <p className="text-[12px] text-muted-fg">Valor emitido + vendido</p>
          <p className="num mt-1.5 text-[22px] font-medium tracking-[-0.02em] text-brand">
            {formatBRL(totalEmitido)}
          </p>
          {/* Barra de distribuição */}
          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-surface-2">
            {distribuicao.map((d) =>
              d.value > 0 ? (
                <span
                  key={d.key}
                  style={{ width: `${(d.value / totalDist) * 100}%`, background: statusStyle(d.key).color }}
                />
              ) : null
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {distribuicao.map((d) => (
              <div key={d.key} className="flex items-center gap-1.5">
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: statusStyle(d.key).color }} />
                <span className="text-[11px] text-ink-soft">{d.label}</span>
                <span className="num ml-auto text-[11px] font-medium text-ink">{d.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex items-center gap-2.5">
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

      {/* Tabela */}
      <Panel ref={tableRef} className="overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-muted-fg">
              <FolderOpen className="h-6 w-6" />
            </div>
            <p className="text-[14px] font-medium text-ink-soft">Nenhum projeto encontrado</p>
            <p className="mt-1 text-[13px] text-muted-fg">
              {busca ? `Sem resultados para "${busca}"` : "Crie o primeiro projeto"}
            </p>
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
                        i === 0 && "pl-5",
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
                      <td className="px-3.5 py-3.5 pl-5">
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
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
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
      </Panel>
    </div>
  )
}
