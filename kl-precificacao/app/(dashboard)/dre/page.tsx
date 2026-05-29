import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Header } from "@/components/layout/Header"
import { SectionHeading } from "@/components/ui/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatBRL, formatPercent } from "@/lib/markup"
import { criarDRE, ativarDRE } from "@/actions/dre"
import { cn } from "@/lib/utils"

export default async function DREPage() {
  const session = await getSession()
  const isAdmin = session?.role === "ADMIN"

  const parametros = await prisma.dREParametros.findMany({
    orderBy: { criadoEm: "desc" },
  })

  const ativo = parametros.find((p) => p.ativo)
  const ATIVO_COR = "#2E7D52"

  return (
    <div>
      <Header
        eyebrow="Base de cálculo"
        title="Parâmetros DRE"
        subtitle="Demonstração de Resultado do Exercício — base de cálculo de todos os projetos"
      />

      <div className="grid grid-cols-1 gap-x-10 gap-y-10 xl:grid-cols-3">
        {/* DRE ativa + histórico */}
        <div className="space-y-10 xl:col-span-2">
          {ativo && (
            <section>
              <SectionHeading
                title={`DRE ${ativo.exercicio}`}
                action={
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium"
                    style={{ color: ATIVO_COR, background: "rgba(46,125,82,0.1)" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: ATIVO_COR }} />
                    Ativa
                  </span>
                }
              />
              <div className="grid grid-cols-4 border-y border-line">
                {[
                  { label: "Custos fixos", value: formatPercent(ativo.pctCustoFixo.toString()), desc: "Adm. + financeiras + operacionais" },
                  { label: "Impostos", value: formatPercent(ativo.pctCustoVariavel.toString()), desc: "Variáveis sobre faturamento" },
                  { label: "Salários", value: formatPercent(ativo.pctSalarios.toString()), desc: "Folha proporcional" },
                  { label: "Faturamento est.", value: ativo.faturamentoEstimado ? formatBRL(ativo.faturamentoEstimado.toString()) : "—", desc: "Referência anual" },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className={cn("py-4", i > 0 && "border-l border-line", i === 0 ? "pr-4" : i === 3 ? "pl-4" : "px-4")}
                  >
                    <p className="text-[12px] text-muted-fg">{item.label}</p>
                    <p className="num mt-1.5 text-[18px] font-medium tracking-[-0.02em] text-ink">{item.value}</p>
                    <p className="mt-1 text-[11px] leading-tight text-muted-fg">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-baseline gap-3 border-t-2 border-line-strong pt-4">
                <span className="num text-[26px] font-medium tracking-[-0.02em] text-brand">
                  {(1 / (1 - (Number(ativo.pctCustoFixo) + Number(ativo.pctCustoVariavel) + Number(ativo.pctSalarios)))).toFixed(4)}×
                </span>
                <span className="text-[13px] text-ink-soft">
                  markup mínimo sobre o custo direto — apenas para cobrir custos
                </span>
              </div>
            </section>
          )}

          {/* Histórico */}
          <section>
            <SectionHeading title="Histórico de versões" />
            {parametros.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-muted-fg">Nenhum parâmetro cadastrado ainda.</p>
            ) : (
              <div className="divide-y divide-line">
                {parametros.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-3.5">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ background: p.ativo ? ATIVO_COR : "var(--muted)" }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-ink">Exercício {p.exercicio}</span>
                        {p.ativo && (
                          <span className="text-[11px] font-medium" style={{ color: ATIVO_COR }}>Ativa</span>
                        )}
                      </div>
                      <p className="num mt-0.5 text-[11px] text-muted-fg">
                        CF {formatPercent(p.pctCustoFixo.toString())} · CV {formatPercent(p.pctCustoVariavel.toString())} · Sal {formatPercent(p.pctSalarios.toString())}
                      </p>
                    </div>
                    <span className="num text-[11px] text-muted-fg">
                      {new Date(p.criadoEm).toLocaleDateString("pt-BR")}
                    </span>
                    {isAdmin && !p.ativo && (
                      <form action={async () => { "use server"; await ativarDRE(p.id) }}>
                        <Button type="submit" variant="outline" size="sm" className="h-8 border-line text-[12px] text-ink hover:bg-surface-2">
                          Ativar
                        </Button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Formulário */}
        {isAdmin && (
          <section>
            <SectionHeading title="Nova versão" />
            <form action={async (f: FormData) => { "use server"; await criarDRE(f) }} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-ink">Exercício *</Label>
                <Input name="exercicio" placeholder="2026" className="h-10" required />
              </div>
              {[
                { name: "pctCustoFixo", label: "% Custos fixos *", placeholder: "20.0826", atual: "20,0826%" },
                { name: "pctCustoVariavel", label: "% Impostos (var.) *", placeholder: "0.94", atual: "0,94%" },
                { name: "pctSalarios", label: "% Salários *", placeholder: "0.8443", atual: "0,84%" },
              ].map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-ink">{f.label}</Label>
                  <div className="relative">
                    <Input name={f.name} type="number" step="0.0001" placeholder={f.placeholder} className="h-10 pr-7" required />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-fg">%</span>
                  </div>
                  <p className="num text-[11px] text-muted-fg">Atual: {f.atual}</p>
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-ink">Faturamento estimado (R$)</Label>
                <Input name="faturamentoEstimado" type="number" placeholder="10100427.97" className="h-10" />
              </div>
              <Button type="submit" className="w-full bg-brand text-white hover:bg-brand-hover">
                Criar nova versão
              </Button>
            </form>
          </section>
        )}
      </div>
    </div>
  )
}
