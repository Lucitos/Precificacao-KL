"use client"

import { useActionState } from "react"
import { criarInsumo } from "@/actions/insumos"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useEffect } from "react"
import { ArrowLeft, CheckCircle } from "lucide-react"

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
        title="Novo Insumo"
        subtitle="Adicione um componente ao catálogo"
        actions={
          <Link href="/insumos">
            <Button variant="outline" className="gap-2 border-slate-200 text-slate-600 hover:text-[#0f2744]">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="max-w-2xl">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <form action={action} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-sm font-medium text-[#0f2744]">
                    Descrição do Componente *
                  </Label>
                  <Input
                    name="descricao"
                    placeholder="Ex: DISJUNTOR EM CAIXA MOLDADA AGW250 125A 3 POLOS"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#0f2744]">
                    Código do Fabricante *
                  </Label>
                  <Input
                    name="codigoFabricante"
                    placeholder="Ex: 12775103"
                    className="h-10 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#0f2744]">
                    Preço de Custo (R$) *
                  </Label>
                  <Input
                    name="precoCusto"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="220.19"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#0f2744]">Fabricante</Label>
                  <Input name="fabricante" placeholder="Ex: WEG, Schneider, ABB" className="h-10" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#0f2744]">Categoria</Label>
                  <Select name="categoria">
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#0f2744]">Unidade de Medida</Label>
                  <Select name="unidadeMedida" defaultValue="Unidade">
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={pending}
                  className="bg-[#0f2744] hover:bg-[#1a3a5c] text-white gap-2"
                >
                  {pending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Cadastrar Insumo
                    </>
                  )}
                </Button>
                <Link href="/insumos">
                  <Button variant="outline" className="border-slate-200 text-slate-600">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
