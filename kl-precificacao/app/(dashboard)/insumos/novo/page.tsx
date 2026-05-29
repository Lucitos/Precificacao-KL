"use client"

import { useActionState } from "react"
import { criarInsumo } from "@/actions/insumos"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useEffect } from "react"
import { ArrowLeft, Check } from "lucide-react"

const CATEGORIAS = [
  "Disjuntor",
  "Disjuntor-Motor",
  "Contator",
  "Minicontator",
  "Bloco de Contato",
  "Bobina",
  "Barramento",
  "Borne",
  "DR / DPS",
  "Fonte de Alimentação",
  "Quadro / Caixa",
  "Material Auxiliar",
  "Ferramenta",
  "EPI",
  "Outros",
]

const UNIDADES = ["Unidade", "Metro", "Par", "Conjunto", "Caixa", "kg", "Litro"]

export default function NovoInsumoPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(criarInsumo, { error: "" })

  useEffect(() => {
    if (state?.success) {
      toast.success("Insumo cadastrado com sucesso!")
      router.push("/insumos")
    }
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state, router])

  return (
    <div>
      <Header
        eyebrow="Catálogo"
        title="Novo insumo"
        subtitle="Adicione um componente ao catálogo"
        actions={
          <Link
            href="/insumos"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line px-3 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        }
      />

      <div className="max-w-2xl">
        <form action={action} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[13px] font-medium text-ink">Descrição do componente *</Label>
              <Input
                name="descricao"
                placeholder="Ex: DISJUNTOR EM CAIXA MOLDADA AGW250 125A 3 POLOS"
                className="h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-ink">Código do fabricante *</Label>
              <Input name="codigoFabricante" placeholder="Ex: 12775103" className="num h-10" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-ink">Preço de custo (R$) *</Label>
              <Input name="precoCusto" type="number" step="0.01" min="0" placeholder="220.19" className="num h-10" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-ink">Fabricante</Label>
              <Input name="fabricante" placeholder="Ex: WEG, Schneider, ABB" className="h-10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-ink">Categoria</Label>
              <Select name="categoria">
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium text-ink">Unidade de medida</Label>
              <Select name="unidadeMedida" defaultValue="Unidade">
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 border-t border-line pt-4">
            <Button type="submit" disabled={pending} className="gap-2 bg-brand text-white hover:bg-brand-hover">
              {pending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Salvando…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Cadastrar insumo
                </>
              )}
            </Button>
            <Link
              href="/insumos"
              className="inline-flex h-9 items-center rounded-md border border-line px-4 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-2"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
