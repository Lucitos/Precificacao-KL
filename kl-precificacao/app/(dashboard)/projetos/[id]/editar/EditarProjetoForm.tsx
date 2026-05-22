"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { atualizarProjeto, type QuadroInput } from "@/actions/projetos"
import { calcularPrecificacao, formatBRL, formatPercent } from "@/lib/markup"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  ArrowLeft, Search, Plus, Trash2, CheckCircle,
  AlertTriangle, XCircle, Zap, Loader2, Save, LayoutGrid,
} from "lucide-react"
import Link from "next/link"

interface Componente {
  id: string
  codigoFabricante: string
  descricao: string
  fabricante: string | null
  categoria: string | null
  unidadeMedida: string
  precoCusto: string
}

export interface ItemLista {
  localId: string
  quadroLocalId: string
  componenteId: string
  codigoFabricante: string
  descricao: string
  unidadeMedida: string
  quantidade: number
  quantidadeStr: string
  precoCustoUnitario: number
}

export interface QuadroLocal {
  localId: string
  nome: string
  quantidade: number
  quantidadeStr: string
  busca: string
}

interface DRESnapshot {
  pctCustoFixo: string
  pctCustoVariavel: string
  pctSalarios: string
}

interface Props {
  id: string
  numeroReferencia: string
  initialNome: string
  initialCliente: string
  initialDescricao: string
  initialMargem: number
  initialQuadros: QuadroLocal[]
  initialItens: ItemLista[]
}

let _idCounter = 0
const nextId = () => `local-${Date.now()}-${++_idCounter}`

export default function EditarProjetoForm({
  id, numeroReferencia, initialNome, initialCliente, initialDescricao,
  initialMargem, initialQuadros, initialItens,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(initialNome)
  const [cliente, setCliente] = useState(initialCliente)
  const [descricao, setDescricao] = useState(initialDescricao)
  const [margem, setMargem] = useState(initialMargem)
  const [quadros, setQuadros] = useState<QuadroLocal[]>(
    initialQuadros.length > 0
      ? initialQuadros
      : [{ localId: nextId(), nome: "", quantidade: 1, quantidadeStr: "1", busca: "" }]
  )
  const [itens, setItens] = useState<ItemLista[]>(initialItens)
  const [todosComponentes, setTodosComponentes] = useState<Componente[]>([])
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(true)
  const [dre, setDre] = useState<DRESnapshot | null>(null)

  useEffect(() => {
    fetch("/api/dre-ativo")
      .then((r) => r.json())
      .then((data) => { if (data) setDre(data) })
      .catch(() => {})

    fetch("/api/componentes?all=1")
      .then((r) => r.json())
      .then((data) => { setTodosComponentes(data); setCarregandoCatalogo(false) })
      .catch(() => setCarregandoCatalogo(false))
  }, [])

  const getResultados = (busca: string): Componente[] => {
    if (busca.length < 2) return []
    const termo = busca.toLowerCase()
    return todosComponentes
      .filter(
        (c) =>
          c.descricao.toLowerCase().includes(termo) ||
          c.codigoFabricante.toLowerCase().includes(termo) ||
          (c.fabricante?.toLowerCase().includes(termo) ?? false)
      )
      .slice(0, 15)
  }

  const adicionarQuadro = () => {
    setQuadros((prev) => [
      ...prev,
      { localId: nextId(), nome: "", quantidade: 1, quantidadeStr: "1", busca: "" },
    ])
  }

  const removerQuadro = (localId: string) => {
    setQuadros((prev) => prev.filter((q) => q.localId !== localId))
    setItens((prev) => prev.filter((i) => i.quadroLocalId !== localId))
  }

  const handleQuadroNome = (localId: string, nome: string) =>
    setQuadros((prev) => prev.map((q) => q.localId === localId ? { ...q, nome } : q))

  const handleQuadroQtyChange = (localId: string, value: string) => {
    setQuadros((prev) =>
      prev.map((q) => {
        if (q.localId !== localId) return q
        const qty = Number(value)
        return { ...q, quantidadeStr: value, quantidade: value !== "" && !isNaN(qty) && qty > 0 ? qty : q.quantidade }
      })
    )
  }

  const handleQuadroQtyBlur = (localId: string) => {
    setQuadros((prev) =>
      prev.map((q) => {
        if (q.localId !== localId) return q
        const qty = Number(q.quantidadeStr)
        if (!q.quantidadeStr || isNaN(qty) || qty <= 0) return { ...q, quantidadeStr: "1", quantidade: 1 }
        return { ...q, quantidadeStr: String(qty) }
      })
    )
  }

  const handleQuadroBusca = (localId: string, busca: string) =>
    setQuadros((prev) => prev.map((q) => q.localId === localId ? { ...q, busca } : q))

  const adicionarItem = (comp: Componente, quadroLocalId: string) => {
    setItens((prev) => {
      const existe = prev.find((i) => i.quadroLocalId === quadroLocalId && i.componenteId === comp.id)
      if (existe) {
        const novaQtd = existe.quantidade + 1
        return prev.map((i) =>
          i.localId === existe.localId ? { ...i, quantidade: novaQtd, quantidadeStr: String(novaQtd) } : i
        )
      }
      return [
        ...prev,
        {
          localId: nextId(),
          quadroLocalId,
          componenteId: comp.id,
          codigoFabricante: comp.codigoFabricante,
          descricao: comp.descricao,
          unidadeMedida: comp.unidadeMedida,
          quantidade: 1,
          quantidadeStr: "1",
          precoCustoUnitario: Number(comp.precoCusto),
        },
      ]
    })
    setQuadros((prev) => prev.map((q) => q.localId === quadroLocalId ? { ...q, busca: "" } : q))
  }

  const removerItem = (localId: string) =>
    setItens((prev) => prev.filter((i) => i.localId !== localId))

  const handleQtyChange = (localId: string, value: string) => {
    setItens((prev) =>
      prev.map((i) => {
        if (i.localId !== localId) return i
        const qty = Number(value)
        return { ...i, quantidadeStr: value, quantidade: value !== "" && !isNaN(qty) && qty > 0 ? qty : i.quantidade }
      })
    )
  }

  const handleQtyBlur = (localId: string) => {
    setItens((prev) =>
      prev.map((i) => {
        if (i.localId !== localId) return i
        const qty = Number(i.quantidadeStr)
        if (!i.quantidadeStr || isNaN(qty) || qty <= 0) return { ...i, quantidadeStr: "1", quantidade: 1 }
        return { ...i, quantidadeStr: String(qty) }
      })
    )
  }

  const custoDireto = quadros.reduce((acc, quadro) => {
    const quadroItens = itens.filter((i) => i.quadroLocalId === quadro.localId)
    const quadroCusto = quadroItens.reduce((qacc, i) => qacc + i.quantidade * i.precoCustoUnitario, 0)
    return acc + quadroCusto * quadro.quantidade
  }, 0)
  const resultado = dre
    ? calcularPrecificacao(custoDireto, margem / 100, {
        pctCustoFixo: dre.pctCustoFixo,
        pctCustoVariavel: dre.pctCustoVariavel,
        pctSalarios: dre.pctSalarios,
      })
    : null

  const viColor =
    !resultado ? "text-slate-400"
    : resultado.viStatus === "verde" ? "text-green-600"
    : resultado.viStatus === "amarelo" ? "text-amber-500"
    : "text-red-600"

  const viIcon =
    !resultado ? null
    : resultado.viStatus === "verde" ? <CheckCircle className="w-5 h-5 text-green-600" />
    : resultado.viStatus === "amarelo" ? <AlertTriangle className="w-5 h-5 text-amber-500" />
    : <XCircle className="w-5 h-5 text-red-600" />

  const handleSalvar = async (emitir: boolean) => {
    if (!nome || !cliente) { toast.error("Preencha nome e cliente."); return }
    if (itens.length === 0) { toast.error("Adicione ao menos um insumo."); return }
    setLoading(true)
    try {
      const quadrosInput: QuadroInput[] = quadros.map((q, idx) => ({
        nome: q.nome.trim() || `Quadro ${idx + 1}`,
        quantidade: q.quantidade,
        ordem: idx,
        itens: itens
          .filter((i) => i.quadroLocalId === q.localId)
          .map((i) => ({
            componenteId: i.componenteId,
            quantidade: i.quantidade,
            precoCustoUnitario: i.precoCustoUnitario,
          })),
      }))
      const result = await atualizarProjeto(id, nome, cliente, descricao, margem / 100, emitir, quadrosInput)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(emitir ? "Projeto emitido com sucesso!" : "Rascunho salvo!")
        router.push(`/projetos/${id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header
        title="Editar Projeto"
        subtitle={`${numeroReferencia} · ${cliente || "—"}`}
        actions={
          <Link href={`/projetos/${id}`}>
            <Button variant="outline" className="gap-2 border-slate-200 text-slate-600">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </Link>
        }
      />

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          {/* Dados básicos */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#0f2744]">Dados do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#0f2744]">Nome do Projeto *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#0f2744]">Cliente *</Label>
                <Input value={cliente} onChange={(e) => setCliente(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm font-medium text-[#0f2744]">Descrição</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes adicionais (opcional)"
                  className="h-10"
                />
              </div>
              <div className="space-y-3 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-[#0f2744]">Margem de Lucro</Label>
                  <span className="text-2xl font-bold text-[#0f2744]">{margem}%</span>
                </div>
                <input
                  type="range" min={5} max={80} step={1}
                  value={margem}
                  onChange={(e) => setMargem(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200"
                  style={{ accentColor: "#0f2744" }}
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>5%</span><span>40%</span><span>80%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quadros */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{quadros.length} quadro{quadros.length !== 1 ? "s" : ""} · {itens.length} insumo{itens.length !== 1 ? "s" : ""}</p>
            <Button
              onClick={adicionarQuadro}
              variant="outline"
              size="sm"
              className="gap-1.5 border-[#0f2744]/30 text-[#0f2744] hover:bg-[#0f2744]/5"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Quadro
            </Button>
          </div>

          {quadros.map((quadro, qIdx) => {
            const quadroItens = itens.filter((i) => i.quadroLocalId === quadro.localId)
            const resultados = getResultados(quadro.busca)
            const subtotal = quadroItens.reduce((acc, i) => acc + i.quantidade * i.precoCustoUnitario, 0) * quadro.quantidade

            return (
              <Card key={quadro.localId} className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0f2744]/10 flex-shrink-0">
                      <LayoutGrid className="w-3.5 h-3.5 text-[#0f2744]" />
                    </div>
                    <Input
                      value={quadro.nome}
                      onChange={(e) => handleQuadroNome(quadro.localId, e.target.value)}
                      placeholder={`Quadro ${qIdx + 1} (ex: QD Principal)`}
                      className="h-9 flex-1 font-semibold text-[#0f2744] border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#0f2744]"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-slate-400">Qtd:</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={quadro.quantidadeStr}
                        onChange={(e) => handleQuadroQtyChange(quadro.localId, e.target.value)}
                        onBlur={() => handleQuadroQtyBlur(quadro.localId)}
                        className="w-14 h-8 text-center text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f2744] bg-white"
                      />
                    </div>
                    {quadros.length > 1 && (
                      <button
                        onClick={() => removerQuadro(quadro.localId)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {subtotal > 0 && (
                    <p className="text-xs text-slate-400 mt-1 ml-10">
                      {quadroItens.length} insumo{quadroItens.length !== 1 ? "s" : ""} · subtotal {formatBRL(subtotal)}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={quadro.busca}
                      onChange={(e) => handleQuadroBusca(quadro.localId, e.target.value)}
                      placeholder="Buscar insumo por nome, código ou fabricante..."
                      className="h-10 pl-9 pr-9"
                    />
                    {carregandoCatalogo && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                    )}
                  </div>

                  {resultados.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-lg bg-white">
                      {resultados.map((comp) => (
                        <button
                          key={comp.id}
                          onClick={() => adicionarItem(comp, quadro.localId)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f0f4f8] text-left transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0f2744] truncate">{comp.descricao}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {comp.codigoFabricante}
                              {comp.fabricante && ` · ${comp.fabricante}`}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-semibold text-[#0f2744]">{formatBRL(comp.precoCusto)}</p>
                            <p className="text-xs text-slate-400">{comp.unidadeMedida}</p>
                          </div>
                          <Plus className="w-4 h-4 text-[#f59e0b] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}

                  {quadroItens.length > 0 && (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400">Descrição</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-400">Qtd</th>
                            <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400">Unit.</th>
                            <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-400">Total</th>
                            <th className="px-3 py-2.5" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {quadroItens.map((item) => (
                            <tr key={item.localId} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5">
                                <p className="text-sm font-medium text-[#0f2744] leading-snug">{item.descricao}</p>
                                <p className="text-xs text-slate-400 font-mono">{item.codigoFabricante}</p>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantidadeStr}
                                  onChange={(e) => handleQtyChange(item.localId, e.target.value)}
                                  onBlur={() => handleQtyBlur(item.localId)}
                                  className="w-16 h-8 text-center text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0f2744] bg-white"
                                />
                              </td>
                              <td className="px-3 py-2.5 text-right text-sm text-slate-600">
                                {formatBRL(item.precoCustoUnitario)}
                              </td>
                              <td className="px-3 py-2.5 text-right text-sm font-semibold text-[#0f2744]">
                                {formatBRL(item.quantidade * item.precoCustoUnitario)}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  onClick={() => removerItem(item.localId)}
                                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {quadroItens.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-xl">
                      Busque e adicione insumos acima
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleSalvar(false)}
              disabled={loading}
              variant="outline"
              className="gap-2 border-slate-200 text-slate-600 hover:text-[#0f2744]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Rascunho
            </Button>
            <Button
              onClick={() => handleSalvar(true)}
              disabled={loading}
              className="flex-1 bg-[#0f2744] hover:bg-[#1a3a5c] text-white gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Salvar e Emitir
            </Button>
          </div>
        </div>

        {/* Painel de precificação */}
        <div className="w-72 flex-shrink-0">
          <Card className="border-0 shadow-sm bg-[#0f2744] text-white sticky top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#f59e0b]" fill="currentColor" />
                <CardTitle className="text-sm text-white font-semibold">Precificação</CardTitle>
              </div>
              <p className="text-xs text-blue-200/60 mt-0.5">Margem: {margem}%</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-blue-200/70">Custo Direto</span>
                <span className="font-semibold">{formatBRL(custoDireto)}</span>
              </div>
              {resultado && (
                <>
                  <div className="flex justify-between py-1.5">
                    <span className="text-blue-200/60 text-xs">Custos Fixos ({formatPercent(dre?.pctCustoFixo ?? "0")})</span>
                    <span className="text-xs">{formatBRL(resultado.custoFixoValor)}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-blue-200/60 text-xs">Impostos ({formatPercent(dre?.pctCustoVariavel ?? "0")})</span>
                    <span className="text-xs">{formatBRL(resultado.custoVariavelValor)}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-blue-200/60 text-xs">Salários ({formatPercent(dre?.pctSalarios ?? "0")})</span>
                    <span className="text-xs">{formatBRL(resultado.salariosValor)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/10">
                    <span className="text-blue-200/60 text-xs">Margem ({margem}%)</span>
                    <span className="text-xs">{formatBRL(resultado.margemValor)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-semibold text-[#f59e0b]">Preço de Venda</span>
                    <span className="font-bold text-[#f59e0b] text-base">{formatBRL(resultado.precoVenda)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-t border-white/10">
                    <span className="text-blue-200/60 text-xs">Markup</span>
                    <span className="font-semibold text-xs">{Number(resultado.markup).toFixed(4)}×</span>
                  </div>
                  <div className="flex items-center justify-between py-2 bg-white/5 rounded-xl px-3 mt-2">
                    <span className="text-xs font-semibold">Indicador VI</span>
                    <div className="flex items-center gap-1.5">
                      {viIcon}
                      <span className={`font-bold text-base ${viColor}`}>{Number(resultado.vi).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
              {!dre && (
                <p className="text-xs text-red-300 text-center py-2">Nenhum DRE ativo. Configure em Parâmetros DRE.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
