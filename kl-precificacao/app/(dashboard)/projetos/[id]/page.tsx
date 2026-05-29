import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/ui/section"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatBRL, formatPercent } from "@/lib/markup"
import { cancelarProjeto, duplicarProjeto, emitirProjeto, marcarVendido } from "@/actions/projetos"
import DeleteProjetoButton from "@/components/projetos/DeleteProjetoButton"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ArrowLeft, Copy, Trash2,
  Pencil, LayoutGrid, Tag, SendHorizonal, ShoppingCart,
} from "lucide-react"

const thClass = "py-2.5 text-[11px] font-medium text-muted-fg"

function ItemRow({ item }: { item: { id: string; componente: { descricao: string; codigoFabricante: string }; quantidade: { toString(): string }; precoCustoUnitario: { toString(): string }; precoCustoTotal: { toString(): string } } }) {
  return (
    <tr className="border-t border-line transition-colors hover:bg-surface-2">
      <td className="py-2.5 pl-0 pr-3">
        <p className="text-[13px] font-medium leading-snug text-ink">{item.componente.descricao}</p>
        <p className="num mt-0.5 text-[11px] text-muted-fg">{item.componente.codigoFabricante}</p>
      </td>
      <td className="num px-3 py-2.5 text-center text-[13px] text-ink-soft">
        {Number(item.quantidade).toFixed(0)}
      </td>
      <td className="num px-3 py-2.5 text-right text-[13px] text-muted-fg">
        {formatBRL(item.precoCustoUnitario.toString())}
      </td>
      <td className="num py-2.5 pl-3 pr-0 text-right text-[13px] font-medium text-ink">
        {formatBRL(item.precoCustoTotal.toString())}
      </td>
    </tr>
  )
}

function ItensHead() {
  return (
    <thead>
      <tr className="border-t border-line">
        <th className={cn(thClass, "pl-0 pr-3 text-left")}>Componente</th>
        <th className={cn(thClass, "px-3 text-center")}>Qtd</th>
        <th className={cn(thClass, "px-3 text-right")}>Unitário</th>
        <th className={cn(thClass, "pl-3 pr-0 text-right")}>Total</th>
      </tr>
    </thead>
  )
}

export default async function ProjetoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  const isAdmin = session?.role === "ADMIN"

  const projeto = await prisma.projeto.findUnique({
    where: { id },
    include: {
      responsavel: { select: { name: true } },
      quadros: {
        include: {
          itens: {
            include: { componente: { select: { descricao: true, codigoFabricante: true, categoria: true } } },
            orderBy: { componente: { descricao: "asc" } },
          },
        },
        orderBy: { ordem: "asc" },
      },
      itens: {
        where: { quadroId: null },
        include: { componente: { select: { descricao: true, codigoFabricante: true, categoria: true } } },
        orderBy: { componente: { descricao: "asc" } },
      },
    },
  })

  if (!projeto) notFound()

  const snap = projeto.dreSnapshot as {
    exercicio: string
    pctCustoFixo: string
    pctCustoVariavel: string
    pctSalarios: string
    faturamentoEstimado?: string
  }

  const totalItens =
    projeto.quadros.reduce((acc, q) => acc + q.itens.length, 0) + projeto.itens.length

  const hasQuadros = projeto.quadros.length > 0

  const custoDiretoCalculado = hasQuadros
    ? projeto.quadros.reduce((acc, q) => {
        const quadroCusto = q.itens.reduce((qacc, i) => qacc + Number(i.precoCustoTotal), 0)
        return acc + quadroCusto * q.quantidade
      }, 0) + projeto.itens.reduce((acc, i) => acc + Number(i.precoCustoTotal), 0)
    : projeto.itens.reduce((acc, i) => acc + Number(i.precoCustoTotal), 0)

  return (
    <div>
      <Header
        eyebrow="Projeto"
        title={projeto.nome}
        subtitle={`${projeto.numeroReferencia} · ${projeto.cliente}`}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/projetos">
              <Button variant="outline" size="sm" className="h-9 gap-1.5 border-line text-ink-soft">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
            </Link>
            <Link href={`/projetos/${projeto.id}/editar`}>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 border-line text-ink hover:bg-surface-2">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
            </Link>
            <form action={async () => { "use server"; await duplicarProjeto(projeto.id) }}>
              <Button type="submit" variant="outline" size="sm" className="h-9 gap-1.5 border-line text-ink-soft hover:text-ink">
                <Copy className="h-3.5 w-3.5" /> Duplicar
              </Button>
            </form>
            {projeto.status === "RASCUNHO" && (
              <form action={async () => { "use server"; await emitirProjeto(projeto.id) }}>
                <Button type="submit" size="sm" className="h-9 gap-1.5 border-0 bg-brand text-white hover:bg-brand-hover">
                  <SendHorizonal className="h-3.5 w-3.5" /> Emitir
                </Button>
              </form>
            )}
            {projeto.status === "EMITIDO" && (
              <form action={async () => { "use server"; await marcarVendido(projeto.id) }}>
                <Button type="submit" size="sm" className="h-9 gap-1.5 border-0 text-white hover:opacity-90" style={{ background: "#2B6BBF" }}>
                  <ShoppingCart className="h-3.5 w-3.5" /> Marcar vendido
                </Button>
              </form>
            )}
            {isAdmin && projeto.status !== "CANCELADO" && (
              <form action={async () => { "use server"; await cancelarProjeto(projeto.id) }}>
                <Button type="submit" variant="outline" size="sm" className="h-9 gap-1.5" style={{ borderColor: "rgba(188,74,43,0.3)", color: "#BC4A2B" }}>
                  <Trash2 className="h-3.5 w-3.5" /> Cancelar
                </Button>
              </form>
            )}
            {isAdmin && <DeleteProjetoButton id={projeto.id} nome={projeto.nome} />}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 xl:grid-cols-3">
        {/* Itens */}
        <div className="xl:col-span-2">
          <SectionHeading
            title={`Itens do projeto · ${totalItens}`}
            action={<StatusBadge status={projeto.status} />}
          />

          {hasQuadros ? (
              <div>
                {projeto.quadros.map((quadro) => {
                  const subtotal = quadro.itens.reduce(
                    (acc, i) => acc + Number(i.precoCustoTotal), 0
                  ) * quadro.quantidade
                  return (
                    <div key={quadro.id}>
                      <div className="flex items-center gap-2 border-t border-line px-0 pb-2 pt-4">
                        <LayoutGrid className="h-3.5 w-3.5 text-muted-fg" />
                        <span className="text-[13px] font-medium text-ink">{quadro.nome}</span>
                        {quadro.quantidade > 1 && (
                          <span className="num rounded bg-brand-bg px-1.5 py-0.5 text-[11px] font-medium text-brand">
                            ×{quadro.quantidade}
                          </span>
                        )}
                        <span className="num ml-auto text-[11px] text-muted-fg">
                          {quadro.itens.length} insumo{quadro.itens.length !== 1 ? "s" : ""} · {formatBRL(subtotal)}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <ItensHead />
                          <tbody>
                            {quadro.itens.map((item) => (
                              <ItemRow key={item.id} item={item} />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}

                {projeto.itens.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 border-t border-line px-0 pb-2 pt-4">
                      <span className="text-[13px] font-medium text-ink">Itens gerais</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <ItensHead />
                        <tbody>
                          {projeto.itens.map((item) => (
                            <ItemRow key={item.id} item={item} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t-2 border-line-strong px-0 py-3">
                  <span className="text-[13px] font-medium text-ink">Total custo direto</span>
                  <span className="num text-[15px] font-semibold text-ink">{formatBRL(custoDiretoCalculado)}</span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <ItensHead />
                  <tbody>
                    {projeto.itens.map((item) => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-line-strong">
                      <td colSpan={3} className="py-3 pl-0 text-[13px] font-medium text-ink">
                        Total custo direto
                      </td>
                      <td className="num py-3 pl-3 pr-0 text-right text-[15px] font-semibold text-ink">
                        {formatBRL(custoDiretoCalculado)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Resultado da precificação (escuro) */}
          <div className="relative overflow-hidden rounded-lg bg-dark text-white">
            <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative border-b border-white/[0.08] px-5 py-3.5">
              <p className="text-[13px] font-semibold text-white">Resultado da precificação</p>
              <p className="num mt-0.5 text-[12px] text-white/45">
                Margem {(Number(projeto.margemAplicada) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="relative px-5 py-3">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[12px] text-white/50">Custo direto</span>
                <span className="num text-[13px] text-white">{formatBRL(custoDiretoCalculado)}</span>
              </div>
              <div className="my-1 h-px bg-white/[0.08]" />
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[12px] font-medium text-brand-bright">Preço de venda</span>
                <span
                  className={cn(
                    "num font-medium",
                    projeto.desconto ? "text-[13px] text-white/40 line-through" : "text-[18px] text-brand-bright"
                  )}
                >
                  {formatBRL(projeto.precoVendaTotal.toString())}
                </span>
              </div>
              {projeto.desconto && (
                <>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="flex items-center gap-1 text-[11px] text-white/50">
                      <Tag className="h-3 w-3" />
                      Desconto ({Number(projeto.desconto).toFixed(2)}%)
                    </span>
                    <span className="num text-[12px]" style={{ color: "#E8896B" }}>
                      −{formatBRL((Number(projeto.precoVendaTotal) * Number(projeto.desconto) / 100).toFixed(2))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/[0.08] py-2">
                    <span className="text-[12px] font-medium" style={{ color: "#6FC79A" }}>Preço final</span>
                    <span className="num text-[18px] font-medium" style={{ color: "#6FC79A" }}>
                      {formatBRL((Number(projeto.precoVendaTotal) * (1 - Number(projeto.desconto) / 100)).toFixed(2))}
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[12px] text-white/50">Markup</span>
                <span className="num text-[12px] text-white/80">{Number(projeto.markupAplicado).toFixed(4)}×</span>
              </div>
            </div>
          </div>

          {/* DRE aplicada */}
          <section>
            <SectionHeading
              title={`DRE aplicada · ${snap.exercicio}`}
              description="Parâmetros congelados na emissão"
            />
            <div className="divide-y divide-line">
              {[
                { label: "Custos fixos", value: formatPercent(snap.pctCustoFixo) },
                { label: "Impostos", value: formatPercent(snap.pctCustoVariavel) },
                { label: "Salários", value: formatPercent(snap.pctSalarios) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-ink-soft">{label}</span>
                  <span className="num text-[13px] font-medium text-ink">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Metadados */}
          <section>
            <SectionHeading title="Detalhes" />
            <div className="divide-y divide-line">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[12px] text-muted-fg">Responsável</span>
                <span className="text-[12px] font-medium text-ink">{projeto.responsavel.name}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[12px] text-muted-fg">Criado em</span>
                <span className="num text-[12px] font-medium text-ink">
                  {new Date(projeto.criadoEm).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {projeto.emitidoEm && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-muted-fg">Emitido em</span>
                  <span className="num text-[12px] font-medium text-ink">
                    {new Date(projeto.emitidoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
