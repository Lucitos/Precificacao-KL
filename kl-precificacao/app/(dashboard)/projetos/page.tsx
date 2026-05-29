import { prisma } from "@/lib/db"
import { getSession } from "@/lib/session"
import { Header } from "@/components/layout/Header"
import Link from "next/link"
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
        title="Todos os Projetos"
        subtitle={`${projetos.length} projeto${projetos.length !== 1 ? "s" : ""} cadastrado${projetos.length !== 1 ? "s" : ""}`}
        actions={
          <Link href="/projetos/novo">
            <button
              className="inline-flex items-center gap-1.5 h-[46px] px-5 rounded-lg text-[12px] font-bold uppercase tracking-[0.04em] text-white transition-all"
              style={{ background: "#E87722", boxShadow: "0 2px 8px rgba(232,119,34,0.25)", fontFamily: "inherit" }}
            >
              <span className="text-lg leading-none">+</span>
              Novo Projeto
            </button>
          </Link>
        }
      />
      <ProjetosClientPage projetos={projetos} userRole={session?.role ?? ""} />
    </div>
  )
}
