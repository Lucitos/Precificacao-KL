import { prisma } from "@/lib/db"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatBRL } from "@/lib/markup"
import ProjetoActionsDropdown from "@/components/projetos/ProjetoActionsDropdown"
import Link from "next/link"
import { Plus, FolderOpen } from "lucide-react"

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

function VIBadge({ vi }: { vi: number }) {
  if (vi >= 1.1) return <span className="text-xs font-bold text-green-600">{vi.toFixed(2)}</span>
  if (vi >= 0.95) return <span className="text-xs font-bold text-amber-600">{vi.toFixed(2)}</span>
  return <span className="text-xs font-bold text-red-600">{vi.toFixed(2)}</span>
}

export default async function ProjetosPage() {
  const projetos = await prisma.projeto.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      responsavel: { select: { name: true } },
      itens: { select: { id: true } },
    },
  })

  return (
    <div>
      <Header
        title="Projetos"
        subtitle={`${projetos.length} projeto${projetos.length !== 1 ? "s" : ""} cadastrado${projetos.length !== 1 ? "s" : ""}`}
        actions={
          <Link href="/projetos/novo">
            <Button className="bg-[#0f2744] hover:bg-[#1a3a5c] text-white gap-2">
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          </Link>
        }
      />

      {projetos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0f2744]/10 flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-[#0f2744]/40" />
          </div>
          <p className="text-lg font-semibold text-[#0f2744]">Nenhum projeto ainda</p>
          <p className="text-sm text-slate-500 mt-1 mb-6">Crie seu primeiro projeto de precificação</p>
          <Link href="/projetos/novo">
            <Button className="bg-[#0f2744] hover:bg-[#1a3a5c] text-white gap-2">
              <Plus className="w-4 h-4" />
              Novo Projeto
            </Button>
          </Link>
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Referência / Projeto
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Custo Direto
                    </th>
                    <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Preço Final
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Markup
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      VI
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Itens
                    </th>
                    <th className="px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {projetos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-[#0f2744]">{p.nome}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{p.numeroReferencia}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-slate-700">{p.cliente}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm text-slate-600">{formatBRL(p.custoDiretoTotal.toString())}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {p.desconto ? (
                          <>
                            <p className="text-xs text-slate-400 line-through">
                              {formatBRL(p.precoVendaTotal.toString())}
                            </p>
                            <p className="text-sm font-semibold text-green-700">
                              {formatBRL((Number(p.precoVendaTotal) * (1 - Number(p.desconto) / 100)).toFixed(2))}
                            </p>
                            <p className="text-[10px] text-amber-600">-{Number(p.desconto).toFixed(2)}%</p>
                          </>
                        ) : (
                          <p className="text-sm font-semibold text-[#0f2744]">
                            {formatBRL(p.precoVendaTotal.toString())}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-bold text-[#0f2744]">
                          {Number(p.markupAplicado).toFixed(2)}×
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <VIBadge vi={Number(p.vi)} />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={`text-xs border ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm text-slate-500">{p.itens.length}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <ProjetoActionsDropdown
                          id={p.id}
                          status={p.status}
                          precoVenda={p.precoVendaTotal.toString()}
                          desconto={p.desconto ? Number(p.desconto) : null}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
