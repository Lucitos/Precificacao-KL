"use client"

import { useState, useTransition } from "react"
import { atualizarPreco } from "@/actions/insumos"
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
import { toast } from "sonner"
import { Pencil } from "lucide-react"

interface Props {
  componenteId: string
  descricao: string
  precoAtual: string
}

export function AtualizarPrecoDialog({ componenteId, descricao, precoAtual }: Props) {
  const [open, setOpen] = useState(false)
  const [novoPreco, setNovoPreco] = useState(precoAtual)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await atualizarPreco(componenteId, novoPreco)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Preço atualizado com sucesso!")
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs border-slate-200 text-slate-500 hover:text-[#0f2744] hover:border-[#0f2744]/30 gap-1"
        >
          <Pencil className="w-3 h-3" />
          Preço
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0f2744]">Atualizar Preço</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 -mt-2 leading-snug">{descricao}</p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#0f2744]">Preço de Custo Atual</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
              <Input
                value={novoPreco}
                onChange={(e) => setNovoPreco(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                className="h-10 pl-9"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-[#0f2744] hover:bg-[#1a3a5c] text-white"
            >
              {isPending ? "Salvando..." : "Salvar Preço"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
