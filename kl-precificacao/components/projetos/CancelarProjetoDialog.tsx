"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, XCircle } from "lucide-react"
import { cancelarProjeto } from "@/actions/projetos"
import { MOTIVOS_CANCELAMENTO } from "@/lib/cancelamento"

interface Props {
  id: string
  nomeProjeto: string
  /** Controlado externamente (ex.: a partir do dropdown de ações). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Renderiza um botão de disparo próprio quando não há controle externo. */
  withTrigger?: boolean
}

export default function CancelarProjetoDialog({
  id,
  nomeProjeto,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  withTrigger = false,
}: Props) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [nota, setNota] = useState("")
  const [saving, setSaving] = useState(false)

  const controlled = openProp !== undefined
  const open = controlled ? openProp : internalOpen
  const setOpen = (v: boolean) => {
    if (controlled) onOpenChangeProp?.(v)
    else setInternalOpen(v)
  }

  const handleCancelar = async () => {
    if (!motivo) {
      toast.error("Selecione um motivo de cancelamento.")
      return
    }
    setSaving(true)
    try {
      const result = await cancelarProjeto(id, motivo, nota.trim() || undefined)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Projeto cancelado.")
        setOpen(false)
        setMotivo("")
        setNota("")
        router.refresh()
      }
    } catch {
      toast.error("Erro ao cancelar projeto.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {withTrigger && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          style={{ borderColor: "rgba(188,74,43,0.3)", color: "#BC4A2B" }}
          onClick={() => setOpen(true)}
        >
          <XCircle className="h-3.5 w-3.5" /> Cancelar
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-ink">Cancelar projeto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-ink-soft">
              Você está cancelando o projeto{" "}
              <span className="font-semibold text-ink">{nomeProjeto}</span>.
            </p>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-ink">Motivo</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Selecione um motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_CANCELAMENTO.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-ink">Observação (opcional)</Label>
              <Textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Detalhes adicionais sobre o cancelamento…"
                className="min-h-20"
              />
            </div>
          </div>

          <DialogFooter className="flex-row items-center gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Voltar
            </Button>
            <Button
              onClick={handleCancelar}
              disabled={saving}
              className="gap-2 bg-red-600 text-white hover:bg-red-700"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Cancelar projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
