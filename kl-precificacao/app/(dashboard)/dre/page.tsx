import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatBRL, formatPercent } from "@/lib/markup"
import { criarDRE, ativarDRE } from "@/actions/dre"
import { BarChart3, CheckCircle, Clock } from "lucide-react"

export default async function DREPage() {
  const session = await getSession()
  const isAdmin = session?.role === "ADMIN"

  const parametros = await prisma.dREParametros.findMany({
    orderBy: { criadoEm: "desc" },
  })

  const ativo = parametros.find((p) => p.ativo)

  return (
    <div>
      <Header
        title="Parâmetros DRE"
        subtitle="Demonstração de Resultado do Exercício — base de cálculo de todos os projetos"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* DRE Ativa */}
        <div className="xl:col-span-2 space-y-4">
          {ativo && (
            <Card className="border-0 shadow-sm border-l-4 border-l-[#f59e0b]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold text-[#0f2744]">
                      DRE {ativo.exercicio}
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                      Ativa
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Custos Fixos", value: formatPercent(ativo.pctCustoFixo.toString()), desc: "Desp. Adm. + Financeiras + Operacionais" },
                    { label: "Impostos", value: formatPercent(ativo.pctCustoVariavel.toString()), desc: "Gastos variáveis sobre o faturamento" },
                    { label: "Salários", value: formatPercent(ativo.pctSalarios.toString()), desc: "Folha de pagamento proporcional" },
                    { label: "Faturamento Est.", value: ativo.faturamentoEstimado ? formatBRL(ativo.faturamentoEstimado.toString()) : "—", desc: "Referência anual" },
                  ].map((item) => (
                    <div key={item.label} className="bg-[#f0f4f8] rounded-xl p-4">
                      <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                      <p className="text-xl font-bold text-[#0f2744]">{item.value}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-[#0f2744]/5 rounded-xl">
                  <p className="text-xs font-semibold text-[#0f2744] mb-2">Markup mínimo (sem margem)</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#0f2744]">
                      {(1 / (1 - (Number(ativo.pctCustoFixo) + Number(ativo.pctCustoVariavel) + Number(ativo.pctSalarios)))).toFixed(4)}×
                    </span>
                    <span className="text-sm text-slate-500">sobre o custo direto (apenas para cobrir custos)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#0f2744]">Histórico de Versões</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {parametros.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-400">Nenhum parâmetro cadastrado ainda.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {parametros.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: p.ativo ? "#dcfce7" : "#f1f5f9" }}>
                        {p.ativo
                          ? <CheckCircle className="w-4 h-4 text-green-600" />
                          : <Clock className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#0f2744]">Exercício {p.exercicio}</span>
                          {p.ativo && (
                            <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Ativa</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          CF: {formatPercent(p.pctCustoFixo.toString())} · CV: {formatPercent(p.pctCustoVariavel.toString())} · Sal: {formatPercent(p.pctSalarios.toString())}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(p.criadoEm).toLocaleDateString("pt-BR")}
                      </div>
                      {isAdmin && !p.ativo && (
                        <form action={async () => { "use server"; await ativarDRE(p.id) }}>
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="text-xs border-[#0f2744]/20 text-[#0f2744] hover:bg-[#0f2744] hover:text-white"
                          >
                            Ativar
                          </Button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulário */}
        {isAdmin && (
          <div>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0f2744]/10 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-[#0f2744]" />
                  </div>
                  <CardTitle className="text-base font-semibold text-[#0f2744]">Nova Versão DRE</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <form action={async (f: FormData) => { "use server"; await criarDRE(f) }} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#0f2744]">Exercício *</Label>
                    <Input name="exercicio" placeholder="2026" className="h-10" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#0f2744]">% Custos Fixos *</Label>
                    <div className="relative">
                      <Input name="pctCustoFixo" type="number" step="0.0001" placeholder="20.0826" className="h-10 pr-7" required />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Atual: 20,0826%</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#0f2744]">% Impostos (Var.) *</Label>
                    <div className="relative">
                      <Input name="pctCustoVariavel" type="number" step="0.0001" placeholder="0.94" className="h-10 pr-7" required />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Atual: 0,94%</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#0f2744]">% Salários *</Label>
                    <div className="relative">
                      <Input name="pctSalarios" type="number" step="0.0001" placeholder="0.8443" className="h-10 pr-7" required />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Atual: 0,84%</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-[#0f2744]">Faturamento Estimado (R$)</Label>
                    <Input name="faturamentoEstimado" type="number" placeholder="10100427.97" className="h-10" />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#0f2744] hover:bg-[#1a3a5c] text-white"
                  >
                    Criar Nova Versão
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
