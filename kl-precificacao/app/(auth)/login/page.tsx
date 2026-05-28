"use client"

import { useActionState } from "react"
import { login } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, { error: "" })

  return (
    <div className="min-h-screen flex" style={{ background: "#F8F7F4" }}>
      {/* Left brand panel */}
      <div
        className="w-[420px] flex-shrink-0 flex flex-col px-11 py-12 relative overflow-hidden"
        style={{ background: "#0A2530" }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M0 30h60M30 0v60' stroke='rgba(255,255,255,0.025)' stroke-width='1'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-60px", right: "-60px",
            width: 320, height: 320, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,119,34,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <Image src="/kl-logo.png" alt="KL Engenharia" width={42} height={42} className="rounded-xl" />
            <div>
              <p className="text-[14px] font-extrabold text-white tracking-[0.01em]">KL ENGENHARIA</p>
              <p className="text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
                ELÉTRICA
              </p>
            </div>
          </div>

          {/* Hero copy */}
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.1em] mb-3"
              style={{ color: "#E87722" }}
            >
              Sistema de Precificação
            </p>
            <h2
              className="text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em] mb-4 text-white"
            >
              Precifique com<br />
              <span style={{ color: "#F5A623" }}>precisão total.</span>
            </h2>
            <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Motor de markup baseado na DRE, catálogo de insumos e controle de projetos em tempo real.
            </p>
          </div>

          {/* Feature list */}
          <div className="mt-auto pt-10 flex flex-col gap-3.5">
            {[
              { label: "Margem protegida", desc: "Markup automático via DRE" },
              { label: "Rastreável", desc: "Histórico completo de orçamentos" },
              { label: "Tempo real", desc: "Precificação calculada à medida que você monta" },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-[5px] flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(232,119,34,0.2)", color: "#E87722" }}
                >
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <div>
                  <span className="text-[12px] font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>{label}</span>
                  <span className="text-[11px] ml-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-9">
            <h1
              className="text-[26px] font-extrabold tracking-[-0.02em] mb-2"
              style={{ color: "#1C2B30" }}
            >
              Entrar na sua conta
            </h1>
            <p className="text-[14px]" style={{ color: "#5F7177" }}>
              Bem-vindo de volta.
            </p>
          </div>

          <form action={action} className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="email"
                className="text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ color: "#5F7177" }}
              >
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com.br"
                required
                autoComplete="email"
                className="h-11 text-[14px] font-medium rounded-lg"
                style={{
                  border: "1.5px solid rgba(0,0,0,0.12)",
                  fontFamily: "inherit",
                  color: "#1C2B30",
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="password"
                className="text-[11px] font-bold uppercase tracking-[0.06em]"
                style={{ color: "#5F7177" }}
              >
                Senha
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11 text-[14px] font-medium rounded-lg"
                style={{
                  border: "1.5px solid rgba(0,0,0,0.12)",
                  fontFamily: "inherit",
                  color: "#1C2B30",
                }}
              />
            </div>

            {state?.error && (
              <div
                className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-lg"
                style={{ background: "#FEF2F2", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626" }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {state.error}
              </div>
            )}

            <div className="mt-1">
              <Button
                type="submit"
                disabled={pending}
                className="w-full h-[46px] text-[12px] font-bold uppercase tracking-[0.04em] rounded-lg transition-all"
                style={{
                  background: pending ? "#D4660F" : "#E87722",
                  color: "#fff",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(232,119,34,0.25)",
                  fontFamily: "inherit",
                }}
              >
                {pending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </Button>
            </div>
          </form>

          <p className="text-center text-[11px] mt-8" style={{ color: "#9AABAE" }}>
            © {new Date().getFullYear()} KL Engenharia Elétrica · Versão 2.0
          </p>
        </div>
      </div>
    </div>
  )
}
