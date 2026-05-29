"use client"

import { useActionState } from "react"
import { login } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Check } from "lucide-react"
import Image from "next/image"

const FEATURES = [
  { label: "Margem protegida", desc: "Markup automático via DRE" },
  { label: "Rastreável", desc: "Histórico completo de orçamentos" },
  { label: "Tempo real", desc: "Precificação à medida que você monta" },
]

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, { error: "" })

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Painel de marca */}
      <div className="relative hidden w-[400px] flex-shrink-0 flex-col overflow-hidden bg-dark px-10 py-10 text-white lg:flex">
        <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(218,106,30,0.14) 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center gap-2.5">
            <Image src="/kl-logo.png" alt="KL Engenharia" width={34} height={34} className="rounded-md" />
            <div className="leading-tight">
              <p className="text-[14px] font-semibold tracking-[-0.01em] text-white">KL Engenharia</p>
              <p className="text-[10px] text-white/35">Elétrica · Precificação</p>
            </div>
          </div>

          <div className="mt-16">
            <p className="mb-3 text-[12px] font-medium text-brand-bright">Sistema de Precificação</p>
            <h2 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.025em] text-white">
              Precifique com<br />precisão total.
            </h2>
            <p className="mt-3 max-w-[300px] text-[13px] leading-relaxed text-white/45">
              Motor de markup baseado na DRE, catálogo de insumos e controle de projetos em tempo real.
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-8">
            {FEATURES.map(({ label, desc }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-bright">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-[12px] font-medium text-white/85">{label}</span>
                <span className="text-[11px] text-white/35">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-[380px]">
          <div className="mb-7">
            <h1 className="text-[23px] font-semibold tracking-[-0.025em] text-ink">Entrar na sua conta</h1>
            <p className="mt-1 text-[13px] text-ink-soft">Bem-vindo de volta.</p>
          </div>

          <form action={action} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-[13px] font-medium text-ink-soft">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com.br"
                required
                autoComplete="email"
                className="h-10 text-[14px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-[13px] font-medium text-ink-soft">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-10 text-[14px]"
              />
            </div>

            {state?.error && (
              <div
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-[13px]"
                style={{ background: "rgba(188,74,43,0.10)", color: "#BC4A2B" }}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="mt-1 h-11 w-full bg-brand text-[14px] font-medium text-white hover:bg-brand-hover"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Entrando…
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-[11px] text-muted-fg">
            © {new Date().getFullYear()} KL Engenharia Elétrica · Versão 2.0
          </p>
        </div>
      </div>
    </div>
  )
}
