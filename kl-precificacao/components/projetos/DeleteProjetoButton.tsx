"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { deletarProjeto } from "@/actions/projetos"
import { Trash2, Loader2 } from "lucide-react"

export default function DeleteProjetoButton({ id, nome }: { id: string; nome: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDeletar = async () => {
    setLoading(true)
    try {
      const result = await deletarProjeto(id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Projeto deletado.")
        router.push("/projetos")
      }
    } catch {
      toast.error("Erro ao deletar projeto.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 border-line text-destructive hover:bg-surface-2"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="w-3.5 h-3.5" /> Deletar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Deletar projeto</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-ink-soft">
              Tem certeza que deseja deletar o projeto{" "}
              <span className="font-semibold text-ink">{nome}</span>?
            </p>
            <p className="mt-2 text-xs text-muted-fg">
              Esta ação é irreversível. Todos os itens e quadros associados serão removidos.
            </p>
          </div>
          <DialogFooter className="flex-row items-center gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeletar}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
