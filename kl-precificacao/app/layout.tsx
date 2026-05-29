import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "KL Engenharia — Sistema de Precificação",
  description: "Sistema de precificação de quadros elétricos da KL Engenharia Elétrica",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} h-full`}>
      <body className="h-full antialiased bg-[#F8F7F4] text-[#1C2B30]">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
