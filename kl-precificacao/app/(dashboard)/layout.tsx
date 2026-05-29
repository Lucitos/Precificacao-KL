import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { Sidebar } from "@/components/layout/Sidebar"
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
    <div className="flex h-screen overflow-hidden bg-paper">
      <Sidebar
        userName={session.name}
        userRole={session.role}
        dreExercicio={dreExercicio}
        dreSummary={dreSummary}
      />
      <main className="flex-1 overflow-y-auto bg-paper">
        <div className="mx-auto max-w-[1180px] px-9 py-8">{children}</div>
      </main>
    </div>
  )
}
