"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { aplicarDesconto, emitirProjeto, marcarVendido } from "@/actions/projetos"
import { formatBRL } from "@/lib/markup"
import { MoreHorizontal, ExternalLink, Pencil, FileText, Tag, Loader2, SendHorizonal, ShoppingCart } from "lucide-react"

interface Props {
  id: string
  status: string
  precoVenda: string
  desconto: number | null
}

export default function ProjetoActionsDropdown({ id, status, precoVenda, desconto }: Props) {
  const router = useRouter()
  const [discountOpen, setDiscountOpen] = useState(false)
  const [pct, setPct] = useState("")
  const [saving, setSaving] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  useEffect(() => {
    if (discountOpen) {
      setPct(desconto !== null ? String(desconto) : "")
    }
  }, [discountOpen, desconto])

  const precoBase = Number(precoVenda)
  const pctNum = pct !== "" ? Number(pct) : null
  const precoComDesconto =
    pctNum !== null && !isNaN(pctNum) && pctNum > 0
      ? precoBase * (1 - pctNum / 100)
      : null
  const valorDesconto =
    precoComDesconto !== null ? precoBase - precoComDesconto : null

  const salvar = async (valor: number | null) => {
    if (valor !== null && (isNaN(valor) || valor < 0 || valor >= 100)) {
      toast.error("Desconto deve ser entre 0 e 99.99%")
      return
    }
    setSaving(true)
    try {
      const result = await aplicarDesconto(id, valor)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(valor ? `Desconto de ${valor}% aplicado!` : "Desconto removido.")
        setDiscountOpen(false)
        router.refresh()
      }
    } catch {
      toast.error("Erro ao aplicar desconto.")
    } finally {
      setSaving(false)
    }
  }

  const handleEmitir = async () => {
    setLoadingAction("emitir")
    try {
      const result = await emitirProjeto(id)
      if (result?.error) toast.error(result.error)
      else { toast.success("Projeto emitido!"); router.refresh() }
    } catch {
      toast.error("Erro ao emitir projeto.")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleVendido = async () => {
    setLoadingAction("vendido")
    try {
      const result = await marcarVendido(id)
      if (result?.error) toast.error(result.error)
      else { toast.success("Projeto marcado como vendido!"); router.refresh() }
    } catch {
      toast.error("Erro ao marcar como vendido.")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-[#0f2744] hover:bg-slate-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => router.push(`/projetos/${id}`)}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver detalhes
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => router.push(`/projetos/${id}/editar`)}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {status === "RASCUNHO" && (
            <DropdownMenuItem
              onClick={handleEmitir}
              disabled={loadingAction === "emitir"}
              className="text-green-700 focus:text-green-700"
            >
              {loadingAction === "emitir"
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <SendHorizonal className="w-4 h-4 mr-2" />}
              Emitir Projeto
            </DropdownMenuItem>
          )}

          {status === "EMITIDO" && (
            <DropdownMenuItem
              onClick={handleVendido}
              disabled={loadingAction === "vendido"}
              className="text-blue-700 focus:text-blue-700"
            >
              {loadingAction === "vendido"
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <ShoppingCart className="w-4 h-4 mr-2" />}
              Marcar como Vendido
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => toast.info("Geração de relatório em breve.")}
            className="text-slate-600"
          >
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório PDF
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={() => setDiscountOpen(true)}
            className="text-slate-600"
          >
            <Tag className="w-4 h-4 mr-2" />
            Descontos
            {desconto !== null && (
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                {desconto}%
              </span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#0f2744]">Aplicar Desconto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-[#f0f4f8] rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Preço de Venda Base</p>
              <p className="text-xl font-bold text-[#0f2744]">{formatBRL(precoVenda)}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#0f2744]">Desconto (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="99.99"
                  step="0.5"
                  value={pct}
                  onChange={(e) => setPct(e.target.value)}
                  placeholder="0.00"
                  className="h-10 pr-7"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
              </div>
            </div>

            {precoComDesconto !== null && valorDesconto !== null && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1">
                <p className="text-xs text-slate-500">Preço com Desconto</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatBRL(precoComDesconto.toFixed(2))}
                </p>
                <p className="text-xs text-slate-400">
                  Redução de {formatBRL(valorDesconto.toFixed(2))}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-row items-center gap-2">
            {desconto !== null && (
              <Button
                variant="outline"
                onClick={() => salvar(null)}
                disabled={saving}
                className="mr-auto text-red-600 border-red-200 hover:bg-red-50 text-xs"
              >
                Remover Desconto
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setDiscountOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => salvar(pctNum)}
              disabled={saving}
              className="bg-[#0f2744] hover:bg-[#1a3a5c] text-white gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
