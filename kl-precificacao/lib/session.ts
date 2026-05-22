import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { cache } from "react"

const getSecret = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "fallback-secret-change-me")

export async function createSession(userId: string, role: string, name: string) {
  const token = await new SignJWT({ userId, role, name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .setIssuedAt()
    .sign(getSecret())

  const store = await cookies()
  store.set("kl_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
  })
}

export const getSession = cache(async (): Promise<{ userId: string; role: string; name: string } | null> => {
  const store = await cookies()
  const token = store.get("kl_session")?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as { userId: string; role: string; name: string }
  } catch {
    return null
  }
})

export async function deleteSession() {
  const store = await cookies()
  store.delete("kl_session")
}
