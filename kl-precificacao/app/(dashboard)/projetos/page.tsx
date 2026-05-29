import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Header } from "@/components/layout/Header"
import Link from "next/link"
import { Plus } from "lucide-react"
import ProjetosClientPage from "@/components/projetos/ProjetosClientPage"

export default async function ProjetosPage() {
  const session = await getSession()
  const projetos = await prisma.projeto.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      responsavel: { select: { name: true } },
      itens: { select: { id: true } },
    },
  })

  return (
    <div>
      <Header
        eyebrow="Projetos"
        title="Todos os projetos"
        subtitle={`${projetos.length} projeto${projetos.length !== 1 ? "s" : ""} cadastrado${projetos.length !== 1 ? "s" : ""}`}
        actions={
          <Link
            href="/projetos/novo"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-hover"
          >
            <Plus className="h-4 w-4" />
            Novo projeto
          </Link>
        }
      />
      <ProjetosClientPage projetos={projetos} userRole={session?.role ?? ""} />
    </div>
  )
}
