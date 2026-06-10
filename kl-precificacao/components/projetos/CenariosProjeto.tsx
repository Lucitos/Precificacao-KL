"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
import { SectionHeading } from "@/components/ui/section"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { formatBRL, formatPercent } from "@/lib/markup"
import {
  criarCenario,
  deletarCenario,
  type CenarioDTO,
} from "@/actions/cenarios"

interface Coluna {
  id: string | null
  nome: string
  margemAplicada: string
  markupAplicado: string
  precoVendaTotal: string
  vi: string
}

function viColor(vi: string) {
  const n = Number(vi)
  if (n < 0.95) return "#BC4A2B"
  if (n < 1.1) return "#B07A1E"
  return "#2F7A4E"
}

export function CenariosProjeto({
  projetoId,
  atual,
  cenariosIniciais,
}: {
  projetoId: string
  atual: {
    margemAplicada: string
    markupAplicado: string
    precoVendaTotal: string
    vi: string
  }
  cenariosIniciais: CenarioDTO[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [margem, setMargem] = useState("")
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const colunas: Coluna[] = [
    { id: null, nome: "Projeto atual", ...atual },
    ...cenariosIniciais.map((c) => ({
      id: c.id,
      nome: c.nome,
      margemAplicada: c.margemAplicada,
      markupAplicado: c.markupAplicado,
      precoVendaTotal: c.precoVendaTotal,
      vi: c.vi,
    })),
  ]

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const margemNum = Number(margem.replace(",", "."))
    startTransition(async () => {
      const result = await criarCenario(projetoId, nome, margemNum)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Cenário salvo.")
        setOpen(false)
        setNome("")
        setMargem("")
        router.refresh()
      }
    })
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    startTransition(async () => {
      const result = await deletarCenario(id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Cenário removido.")
        router.refresh()
      }
      setDeletingId(null)
    })
  }

  return (
    <section>
      <SectionHeading
        title={`Cenários · ${cenariosIniciais.length}`}
        description="Compare a precificação atual com simulações de margem"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 border-line px-2 text-xs text-ink-soft hover:bg-surface-2 hover:text-ink"
              >
                <Plus className="h-3 w-3" /> Salvar cenário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-ink">Salvar cenário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-ink">Nome</Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Ex.: Margem agressiva"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-ink">Margem (%)</Label>
                  <Input
                    value={margem}
                    onChange={(e) => setMargem(e.target.value)}
                    required
                    inputMode="decimal"
                    placeholder="Ex.: 20"
                    className="num h-9"
                  />
                  <p className="text-[11px] text-muted-fg">
                    Recalcula o preço usando o custo direto e a DRE do projeto.
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-brand text-white hover:bg-brand-hover"
                  >
                    {isPending ? "Salvando..." : "Salvar cenário"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-line">
              <th className="py-2.5 pl-0 pr-3 text-left text-[11px] font-medium text-muted-fg">
                Indicador
              </th>
              {colunas.map((col) => (
                <th
                  key={col.id ?? "atual"}
                  className="px-3 py-2.5 text-right text-[11px] font-medium text-muted-fg"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="truncate text-ink-soft">{col.nome}</span>
                    {col.id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(col.id!)}
                        disabled={isPending && deletingId === col.id}
                        className="text-muted-fg transition-colors hover:text-[#BC4A2B] disabled:opacity-50"
                        aria-label={`Remover cenário ${col.nome}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line">
              <td className="py-2.5 pl-0 pr-3 text-[13px] text-ink-soft">Margem</td>
              {colunas.map((col) => (
                <td
                  key={col.id ?? "atual"}
                  className="num px-3 py-2.5 text-right text-[13px] text-ink"
                >
                  {formatPercent(col.margemAplicada)}
                </td>
              ))}
            </tr>
            <tr className="border-t border-line">
              <td className="py-2.5 pl-0 pr-3 text-[13px] text-ink-soft">Markup</td>
              {colunas.map((col) => (
                <td
                  key={col.id ?? "atual"}
                  className="num px-3 py-2.5 text-right text-[13px] text-ink"
                >
                  {Number(col.markupAplicado).toFixed(4)}×
                </td>
              ))}
            </tr>
            <tr className="border-t border-line">
              <td className="py-2.5 pl-0 pr-3 text-[13px] font-medium text-ink">
                Preço de venda
              </td>
              {colunas.map((col) => (
                <td
                  key={col.id ?? "atual"}
                  className="num px-3 py-2.5 text-right text-[13px] font-semibold text-ink"
                >
                  {formatBRL(col.precoVendaTotal)}
                </td>
              ))}
            </tr>
            <tr className="border-t border-line">
              <td className="py-2.5 pl-0 pr-3 text-[13px] text-ink-soft">VI</td>
              {colunas.map((col) => (
                <td
                  key={col.id ?? "atual"}
                  className="num px-3 py-2.5 text-right text-[13px] font-medium"
                  style={{ color: viColor(col.vi) }}
                >
                  {Number(col.vi).toFixed(4)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {cenariosIniciais.length === 0 && (
        <p className="mt-3 text-[12px] text-muted-fg">
          Nenhum cenário salvo. Use “Salvar cenário” para comparar margens.
        </p>
      )}
    </section>
  )
}
