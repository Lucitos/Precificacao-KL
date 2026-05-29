import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { TopBar } from "@/components/layout/TopBar"
import { prisma } from "@/lib/db"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  const dre = await prisma.dREParametros.findFirst({ where: { ativo: true } })
  const dreExercicio = dre?.exercicio ?? undefined
  const dreSummary = dre
    ? `CF ${(Number(dre.pctCustoFixo) * 100).toFixed(2)}% · CV ${(Number(dre.pctCustoVariavel) * 100).toFixed(2)}% · Sal ${(Number(dre.pctSalarios) * 100).toFixed(2)}%`
    : undefined

  return (
    <div className="min-h-screen bg-paper">
      <TopBar
        userName={session.name}
        userRole={session.role}
        dreExercicio={dreExercicio}
        dreSummary={dreSummary}
      />
      <main>
        <div className="mx-auto max-w-[1180px] px-9 py-8">{children}</div>
      </main>
    </div>
  )
}
