import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "KL Engenharia — Sistema de Precificação",
  description: "Sistema de precificação de quadros elétricos da KL Engenharia Elétrica",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full`}>
      <body className="h-full antialiased bg-[#f0f4f8] text-[#0f172a]">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
