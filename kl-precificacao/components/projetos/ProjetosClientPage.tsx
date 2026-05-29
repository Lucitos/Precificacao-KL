"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { formatBRL } from "@/lib/markup"
import ProjetoActionsDropdown from "./ProjetoActionsDropdown"
import { Search, FolderOpen } from "lucide-react"

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
const STATUS_LABELS: Record<string, string> = {
  TODOS: "Todos", EMITIDO: "Emitidos", VENDIDO: "Vendidos", RASCUNHO: "Rascunhos", CANCELADO: "Cancelados",
}
const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  RASCUNHO:  { bg: "#F9FAFB", color: "#6B7280", border: "rgba(0,0,0,0.1)" },
  EMITIDO:   { bg: "#F0FDF4", color: "#16A34A", border: "rgba(22,163,74,0.2)" },
  VENDIDO:   { bg: "#EFF6FF", color: "#2563EB", border: "rgba(37,99,235,0.2)" },
  CANCELADO: { bg: "#FEF2F2", color: "#DC2626", border: "rgba(220,38,38,0.2)" },
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center w-[160px] h-[160px] rounded-full"
        style={{ background: "#F3F4F6" }}>
        <p className="text-[11px] text-center" style={{ color: "#9AABAE" }}>Sem dados</p>
      </div>
    )
  }

  const cx = 80, cy = 80, r = 60, innerR = 38
  let cumulative = 0
  const slices = data
    .filter(d => d.value > 0)
    .map(d => {
      const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2
      cumulative += d.value
      const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2
      const x1 = cx + r * Math.cos(startAngle)
      const y1 = cy + r * Math.sin(startAngle)
      const x2 = cx + r * Math.cos(endAngle)
      const y2 = cy + r * Math.sin(endAngle)
      const ix1 = cx + innerR * Math.cos(endAngle)
      const iy1 = cy + innerR * Math.sin(endAngle)
      const ix2 = cx + innerR * Math.cos(startAngle)
      const iy2 = cy + innerR * Math.sin(startAngle)
      const largeArc = (d.value / total) > 0.5 ? 1 : 0
      return {
        ...d,
        path: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`,
      }
    })

  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={2} />
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 22, fontWeight: 800, fill: "#1C2B30" }}>
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: 10, fill: "#9AABAE" }}>projetos</text>
    </svg>
  )
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

  const pizzaData = [
    { label: "Emitidos",  value: contagem.emitidos,  color: "#16A34A" },
    { label: "Vendidos",  value: contagem.vendidos,  color: "#2563EB" },
    { label: "Cancelados",value: contagem.cancelados, color: "#DC2626" },
    { label: "Rascunhos", value: contagem.rascunhos, color: "#D1D5DB" },
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
      {/* Summary strip + Pizza chart */}
      <div className="flex gap-4 mb-5">
        {/* Summary cards */}
        <div className="flex-1 grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { l: "Total",      v: projetos.length,        color: "#1C2B30" },
            { l: "Emitidos",   v: contagem.emitidos,      color: "#16A34A" },
            { l: "Vendidos",   v: contagem.vendidos,      color: "#2563EB" },
            { l: "Rascunhos",  v: contagem.rascunhos,     color: "#D97706" },
          ].map(({ l, v, color }) => (
            <div
              key={l}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}
            >
              <span className="text-[20px] font-extrabold" style={{ color }}>{v}</span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.05em]" style={{ color: "#9AABAE" }}>{l}</span>
            </div>
          ))}
          <div
            className="col-span-4 flex items-center gap-2 px-4 py-2.5 rounded-lg"
            style={{ background: "#FEF3E9", border: "1px solid rgba(232,119,34,0.2)" }}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.05em]" style={{ color: "#9AABAE" }}>Valor emitido + vendido:</span>
            <span className="text-[16px] font-extrabold" style={{ color: "#E87722" }}>{formatBRL(totalEmitido)}</span>
          </div>
        </div>

        {/* Pizza chart */}
        <div
          className="flex items-center gap-5 px-5 py-4 rounded-xl flex-shrink-0"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        >
          <DonutChart data={pizzaData} />
          <div className="flex flex-col gap-2">
            {pizzaData.map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-[12px]" style={{ color: "#5F7177" }}>{d.label}</span>
                <span className="text-[12px] font-bold ml-auto pl-3" style={{ color: "#1C2B30" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 mb-4 items-center">
        <div className="relative flex-1 max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px]" style={{ color: "#9AABAE" }} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar projeto, cliente ou referência..."
            className="w-full h-[42px] pl-9 pr-3 rounded-lg text-[13px] font-medium outline-none transition-colors"
            style={{
              background: "#fff",
              border: "1.5px solid rgba(0,0,0,0.1)",
              fontFamily: "inherit",
              color: "#1C2B30",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#E87722")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
          />
        </div>
        <div className="flex gap-1">
          {STATUS_OPTS.map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className="h-[42px] px-3.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.05em] transition-all"
              style={{
                border: `1.5px solid ${filtro === s ? "#E87722" : "rgba(0,0,0,0.1)"}`,
                background: filtro === s ? "#FEF3E9" : "#fff",
                color: filtro === s ? "#E87722" : "#5F7177",
                fontFamily: "inherit",
              }}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        className="rounded-xl overflow-hidden"
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div
              className="w-13 h-13 rounded-xl flex items-center justify-center mb-3.5"
              style={{ background: "#F8F7F4", color: "#9AABAE" }}
            >
              <FolderOpen className="w-6 h-6" />
            </div>
            <p className="text-[15px] font-bold" style={{ color: "#5F7177" }}>Nenhum projeto encontrado</p>
            <p className="text-[13px] mt-1" style={{ color: "#9AABAE" }}>
              {busca ? `Sem resultados para "${busca}"` : "Crie o primeiro projeto"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8F7F4", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  {["Referência / Projeto", "Cliente", "Custo Direto", "Preço Final", "Markup", "Status", "Itens", ""].map((h, i) => (
                    <th
                      key={h + i}
                      style={{
                        padding: i === 0 ? "11px 22px" : "11px 14px",
                        textAlign: i >= 2 && i <= 4 ? "right" : i === 5 || i === 6 ? "center" : "left",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#9AABAE",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p, i) => {
                  const sc = STATUS_COLORS[p.status] ?? STATUS_COLORS.RASCUNHO
                  const hasDesconto = p.desconto !== null && Number(p.desconto) > 0
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: i < filtrados.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                        cursor: "pointer",
                        transition: "background 100ms",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F8F7F4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => window.location.href = `/projetos/${p.id}`}
                    >
                      <td style={{ padding: "14px 22px" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1C2B30" }}>{p.nome}</p>
                        <p style={{ fontSize: 11, color: "#9AABAE", marginTop: 2, fontFamily: "monospace" }}>{p.numeroReferencia}</p>
                      </td>
                      <td style={{ padding: "14px", maxWidth: 160 }}>
                        <p style={{ fontSize: 13, color: "#5F7177", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.cliente}</p>
                      </td>
                      <td style={{ padding: "14px", textAlign: "right" }}>
                        <p style={{ fontSize: 13, color: "#9AABAE" }}>{formatBRL(p.custoDiretoTotal.toString())}</p>
                      </td>
                      <td style={{ padding: "14px", textAlign: "right" }}>
                        {hasDesconto ? (
                          <>
                            <p style={{ fontSize: 11, color: "#9AABAE", textDecoration: "line-through" }}>{formatBRL(p.precoVendaTotal.toString())}</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}>
                              {formatBRL((Number(p.precoVendaTotal) * (1 - Number(p.desconto) / 100)).toFixed(2))}
                            </p>
                          </>
                        ) : (
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#1C2B30" }}>{formatBRL(p.precoVendaTotal.toString())}</p>
                        )}
                      </td>
                      <td style={{ padding: "14px", textAlign: "right" }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#E87722" }}>{Number(p.markupAplicado).toFixed(3)}×</p>
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <span
                          className="inline-flex items-center h-[22px] px-[9px] rounded-[6px] text-[10px] font-bold uppercase tracking-[0.06em]"
                          style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                        >
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <span style={{ fontSize: 13, color: "#9AABAE" }}>{p.itens.length}</span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
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
