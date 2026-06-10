"use client"

import { useState } from "react"
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
import { aplicarDesconto, emitirProjeto, marcarVendido, deletarProjeto } from "@/actions/projetos"
import { formatBRL } from "@/lib/markup"
import { MoreHorizontal, ExternalLink, Pencil, FileText, Tag, Loader2, SendHorizonal, ShoppingCart, Trash2, XCircle } from "lucide-react"
import CancelarProjetoDialog from "./CancelarProjetoDialog"

interface Props {
  id: string
  status: string
  precoVenda: string
  desconto: number | null
  userRole: string
  nomeProjeto: string
}

export default function ProjetoActionsDropdown({ id, status, precoVenda, desconto, userRole, nomeProjeto }: Props) {
  const router = useRouter()
  const [discountOpen, setDiscountOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [pct, setPct] = useState("")
  const [saving, setSaving] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const abrirDesconto = () => {
    setPct(desconto !== null ? String(desconto) : "")
    setDiscountOpen(true)
  }

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

  const handleDeletar = async () => {
    setLoadingAction("deletar")
    try {
      const result = await deletarProjeto(id)
      if (result?.error) toast.error(result.error)
      else { toast.success("Projeto deletado."); setDeleteOpen(false); router.refresh() }
    } catch {
      toast.error("Erro ao deletar projeto.")
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
            className="h-8 w-8 text-muted-fg hover:bg-surface-2 hover:text-ink"
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
              className="text-[#2E7D52] focus:text-[#2E7D52]"
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
              className="text-[#2B6BBF] focus:text-[#2B6BBF]"
            >
              {loadingAction === "vendido"
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <ShoppingCart className="w-4 h-4 mr-2" />}
              Marcar como Vendido
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => toast.info("Geração de relatório em breve.")}
            className="text-ink-soft"
          >
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório PDF
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            onClick={abrirDesconto}
            className="text-ink-soft"
          >
            <Tag className="w-4 h-4 mr-2" />
            Descontos
            {desconto !== null && (
              <span className="num ml-auto rounded bg-brand-bg px-1.5 py-0.5 text-xs font-medium text-brand">
                {desconto}%
              </span>
            )}
          </DropdownMenuItem>

          {userRole === "ADMIN" && (
            <>
              <DropdownMenuSeparator />
              {(status === "RASCUNHO" || status === "EMITIDO") && (
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  onClick={() => setCancelOpen(true)}
                  className="text-[#BC4A2B] focus:text-[#BC4A2B] focus:bg-surface-2"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar projeto
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive focus:bg-surface-2"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar projeto
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CancelarProjetoDialog
        id={id}
        nomeProjeto={nomeProjeto}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Deletar projeto</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-ink-soft">
              Tem certeza que deseja deletar o projeto{" "}
              <span className="font-semibold text-ink">{nomeProjeto}</span>?
            </p>
            <p className="mt-2 text-xs text-muted-fg">
              Esta ação é irreversível. Todos os itens e quadros associados serão removidos.
            </p>
          </div>
          <DialogFooter className="flex-row items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={loadingAction === "deletar"}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeletar}
              disabled={loadingAction === "deletar"}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {loadingAction === "deletar" && <Loader2 className="w-4 h-4 animate-spin" />}
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-ink">Aplicar desconto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-surface-2 p-4">
              <p className="mb-1 text-xs text-muted-fg">Preço de venda base</p>
              <p className="num text-xl font-medium text-ink">{formatBRL(precoVenda)}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-ink">Desconto (%)</Label>
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
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-fg">%</span>
              </div>
            </div>

            {precoComDesconto !== null && valorDesconto !== null && (
              <div className="space-y-1 rounded-lg border border-line bg-surface-2 p-4">
                <p className="text-xs text-muted-fg">Preço com desconto</p>
                <p className="num text-2xl font-medium" style={{ color: "#2E7D52" }}>
                  {formatBRL(precoComDesconto.toFixed(2))}
                </p>
                <p className="num text-xs text-muted-fg">
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
                className="mr-auto border-line text-destructive hover:bg-surface-2 text-xs"
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
              className="gap-2 bg-brand text-white hover:bg-brand-hover"
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
