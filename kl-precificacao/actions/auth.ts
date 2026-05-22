"use server"

import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { createSession, deleteSession } from "@/lib/session"

export async function login(_prevState: { error: string }, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { error: "Credenciais inválidas." }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { error: "Credenciais inválidas." }

  await createSession(user.id, user.role, user.name)
  redirect("/")
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}
