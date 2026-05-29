"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { atualizarProjeto, type QuadroInput } from "@/actions/projetos"
import { calcularPrecificacao, formatBRL, formatPercent } from "@/lib/markup"
import { Header } from "@/components/layout/Header"
import { SectionHeading } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  ArrowLeft, Search, Plus, Trash2,
  Loader2, Save, LayoutGrid, Check,
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

  const inputMini = "h-8 w-14 rounded-md border border-line bg-surface text-center text-[13px] text-ink outline-none focus:border-brand"

  return (
    <div>
      <Header
        eyebrow="Projetos"
        title="Editar projeto"
        subtitle={`${numeroReferencia} · ${cliente || "—"}`}
        actions={
          <Link
            href={`/projetos/${id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        }
      />

      <div className="flex gap-6">
        <div className="min-w-0 flex-1 space-y-6">
          {/* Dados básicos */}
          <section>
            <SectionHeading title="Dados do projeto" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-ink">Nome do projeto *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-ink">Cliente *</Label>
                <Input value={cliente} onChange={(e) => setCliente(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[13px] font-medium text-ink">Descrição</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes adicionais (opcional)"
                  className="h-10"
                />
              </div>
              <div className="space-y-3 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] font-medium text-ink">Margem de lucro</Label>
                  <span className="num text-[22px] font-medium text-ink">{margem}%</span>
                </div>
                <input
                  type="range" min={5} max={80} step={1}
                  value={margem}
                  onChange={(e) => setMargem(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <div className="num flex justify-between text-[11px] text-muted-fg">
                  <span>5%</span><span>40%</span><span>80%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Quadros */}
          <div className="flex items-center justify-between">
            <p className="num text-[13px] text-muted-fg">{quadros.length} quadro{quadros.length !== 1 ? "s" : ""} · {itens.length} insumo{itens.length !== 1 ? "s" : ""}</p>
            <Button onClick={adicionarQuadro} variant="outline" size="sm" className="gap-1.5 border-line text-ink hover:bg-surface-2">
              <Plus className="h-3.5 w-3.5" /> Adicionar quadro
            </Button>
          </div>

          {quadros.map((quadro, qIdx) => {
            const quadroItens = itens.filter((i) => i.quadroLocalId === quadro.localId)
            const resultados = getResultados(quadro.busca)
            const subtotal = quadroItens.reduce((acc, i) => acc + i.quantidade * i.precoCustoUnitario, 0) * quadro.quantidade

            return (
              <div key={quadro.localId} className="rounded-lg border border-line">
                <div className="border-b border-line p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-2">
                      <LayoutGrid className="h-3.5 w-3.5 text-ink-soft" />
                    </div>
                    <Input
                      value={quadro.nome}
                      onChange={(e) => handleQuadroNome(quadro.localId, e.target.value)}
                      placeholder={`Quadro ${qIdx + 1} (ex: QD Principal)`}
                      className="h-9 flex-1 rounded-none border-0 border-b border-line px-0 font-semibold text-ink focus-visible:border-brand focus-visible:ring-0"
                    />
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <span className="text-[12px] text-muted-fg">Qtd:</span>
                      <input
                        type="number" min="1" step="1"
                        value={quadro.quantidadeStr}
                        onChange={(e) => handleQuadroQtyChange(quadro.localId, e.target.value)}
                        onBlur={() => handleQuadroQtyBlur(quadro.localId)}
                        className={cn(inputMini, "num")}
                      />
                    </div>
                    {quadros.length > 1 && (
                      <button
                        onClick={() => removerQuadro(quadro.localId)}
                        className="flex-shrink-0 rounded-md p-1.5 text-muted-fg transition-colors hover:bg-surface-2 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {subtotal > 0 && (
                    <p className="num ml-10 mt-1 text-[11px] text-muted-fg">
                      {quadroItens.length} insumo{quadroItens.length !== 1 ? "s" : ""} · subtotal {formatBRL(subtotal)}
                    </p>
                  )}
                </div>

                <div className="space-y-3 p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
                    <Input
                      value={quadro.busca}
                      onChange={(e) => handleQuadroBusca(quadro.localId, e.target.value)}
                      placeholder="Buscar insumo por nome, código ou fabricante…"
                      className="h-10 pl-9 pr-9"
                    />
                    {carregandoCatalogo && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-fg" />
                    )}
                  </div>

                  {resultados.length > 0 && (
                    <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                      {resultados.map((comp) => (
                        <button
                          key={comp.id}
                          onClick={() => adicionarItem(comp, quadro.localId)}
                          className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-ink">{comp.descricao}</p>
                            <p className="num mt-0.5 text-[11px] text-muted-fg">
                              {comp.codigoFabricante}
                              {comp.fabricante && ` · ${comp.fabricante}`}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="num text-[13px] font-medium text-ink">{formatBRL(comp.precoCusto)}</p>
                            <p className="text-[11px] text-muted-fg">{comp.unidadeMedida}</p>
                          </div>
                          <Plus className="h-4 w-4 flex-shrink-0 text-brand opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  )}

                  {quadroItens.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-line">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-line bg-surface-2">
                            <th className="px-3 py-2 text-left text-[11px] font-medium text-muted-fg">Descrição</th>
                            <th className="px-3 py-2 text-center text-[11px] font-medium text-muted-fg">Qtd</th>
                            <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-fg">Unit.</th>
                            <th className="px-3 py-2 text-right text-[11px] font-medium text-muted-fg">Total</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {quadroItens.map((item) => (
                            <tr key={item.localId} className="border-t border-line hover:bg-surface-2">
                              <td className="px-3 py-2.5">
                                <p className="text-[13px] font-medium leading-snug text-ink">{item.descricao}</p>
                                <p className="num text-[11px] text-muted-fg">{item.codigoFabricante}</p>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <input
                                  type="number" min="1" step="1"
                                  value={item.quantidadeStr}
                                  onChange={(e) => handleQtyChange(item.localId, e.target.value)}
                                  onBlur={() => handleQtyBlur(item.localId)}
                                  className={cn(inputMini, "num w-16")}
                                />
                              </td>
                              <td className="num px-3 py-2.5 text-right text-[13px] text-muted-fg">
                                {formatBRL(item.precoCustoUnitario)}
                              </td>
                              <td className="num px-3 py-2.5 text-right text-[13px] font-medium text-ink">
                                {formatBRL(item.quantidade * item.precoCustoUnitario)}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  onClick={() => removerItem(item.localId)}
                                  className="rounded-md p-1.5 text-muted-fg transition-colors hover:bg-surface-2 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {quadroItens.length === 0 && (
                    <p className="rounded-lg border border-dashed border-line py-4 text-center text-[13px] text-muted-fg">
                      Busque e adicione insumos acima
                    </p>
                  )}
                </div>
              </div>
            )
          })}

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleSalvar(false)}
              disabled={loading}
              variant="outline"
              className="gap-2 border-line text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar rascunho
            </Button>
            <Button
              onClick={() => handleSalvar(true)}
              disabled={loading}
              className="flex-1 gap-2 bg-brand text-white hover:bg-brand-hover"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar e emitir
            </Button>
          </div>
        </div>

        {/* Painel de precificação (escuro) */}
        <div className="w-72 flex-shrink-0">
          <div className="sticky top-2 overflow-hidden rounded-lg bg-dark text-white">
            <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative border-b border-white/[0.08] px-4 py-3.5">
              <p className="text-[13px] font-semibold text-white">Precificação</p>
              <p className="num mt-0.5 text-[12px] text-white/45">Margem {margem}%</p>
            </div>
            <div className="relative px-4 py-3 text-[13px]">
              <div className="flex justify-between border-b border-white/[0.08] py-2">
                <span className="text-white/55">Custo direto</span>
                <span className="num font-medium text-white">{formatBRL(custoDireto)}</span>
              </div>
              {resultado && (
                <>
                  {[
                    { l: `Custos fixos (${formatPercent(dre?.pctCustoFixo ?? "0")})`, v: resultado.custoFixoValor },
                    { l: `Impostos (${formatPercent(dre?.pctCustoVariavel ?? "0")})`, v: resultado.custoVariavelValor },
                    { l: `Salários (${formatPercent(dre?.pctSalarios ?? "0")})`, v: resultado.salariosValor },
                    { l: `Margem (${margem}%)`, v: resultado.margemValor },
                  ].map((row) => (
                    <div key={row.l} className="flex justify-between py-1.5">
                      <span className="text-[11px] text-white/50">{row.l}</span>
                      <span className="num text-[12px] text-white/85">{formatBRL(row.v)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-white/[0.08] py-2">
                    <span className="text-[12px] font-medium text-brand-bright">Preço de venda</span>
                    <span className="num text-[16px] font-medium text-brand-bright">{formatBRL(resultado.precoVenda)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[11px] text-white/50">Markup</span>
                    <span className="num text-[12px] text-white/80">{Number(resultado.markup).toFixed(4)}×</span>
                  </div>
                </>
              )}
              {!dre && (
                <p className="py-2 text-center text-[12px]" style={{ color: "#E8896B" }}>
                  Nenhum DRE ativo. Configure em Parâmetros DRE.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
