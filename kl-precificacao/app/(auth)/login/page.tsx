"use client"

import { useActionState } from "react"
import { login } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Zap, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, { error: "" })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1e33] via-[#0f2744] to-[#1a3a5c] p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#f59e0b]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#f59e0b]/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f59e0b] mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-[#0f2744]" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">KL Engenharia</h1>
          <p className="text-sm text-blue-200/70 mt-1">Sistema de Precificação</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#0f2744]">Entrar</h2>
            <p className="text-sm text-slate-500 mt-1">Acesse sua conta para continuar</p>
          </div>

          <form action={action} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#0f2744] font-medium text-sm">
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="h-11 border-slate-200 focus:border-[#0f2744] focus:ring-[#0f2744]/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#0f2744] font-medium text-sm">
                Senha
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11 border-slate-200 focus:border-[#0f2744] focus:ring-[#0f2744]/20"
              />
            </div>

            {state?.error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full h-11 bg-[#0f2744] hover:bg-[#1a3a5c] text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
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
          </form>
        </div>

        <p className="text-center text-xs text-blue-200/40 mt-6">
          © {new Date().getFullYear()} KL Engenharia Elétrica. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
