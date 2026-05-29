import { getSession } from "@/lib/session"
import { Header } from "@/components/layout/Header"
import { SectionHeading } from "@/components/ui/section"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Button } from "@/components/ui/button"
import { logout } from "@/actions/auth"
import { LogOut } from "lucide-react"

export default async function ConfiguracoesPage() {
  const session = await getSession()
  const cargo = session?.role === "ADMIN" ? "Administrador" : "Orçamentista"

  return (
    <div className="max-w-[680px]">
      <Header eyebrow="Conta" title="Configurações" subtitle="Preferências do sistema e da sua conta." />

      {/* Aparência */}
      <section className="mb-10">
        <SectionHeading title="Aparência" description="Tema da interface em todo o sistema." />
        <div className="flex items-center justify-between gap-4 py-1">
          <div>
            <p className="text-[13px] font-medium text-ink">Modo de cor</p>
            <p className="mt-0.5 text-[12px] text-muted-fg">Claro, escuro ou seguir o sistema.</p>
          </div>
          <ThemeToggle variant="full" />
        </div>
      </section>

      {/* Conta */}
      <section>
        <SectionHeading title="Conta" />
        <dl className="divide-y divide-line">
          <div className="flex items-center justify-between py-3">
            <dt className="text-[12px] text-muted-fg">Nome</dt>
            <dd className="text-[13px] font-medium text-ink">{session?.name}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-[12px] text-muted-fg">Perfil</dt>
            <dd className="text-[13px] font-medium text-ink">{cargo}</dd>
          </div>
        </dl>
        <form action={logout} className="mt-5">
          <Button type="submit" variant="outline" size="sm" className="h-9 gap-1.5 border-line text-destructive hover:bg-surface-2">
            <LogOut className="h-3.5 w-3.5" /> Sair da conta
          </Button>
        </form>
      </section>
    </div>
  )
}
