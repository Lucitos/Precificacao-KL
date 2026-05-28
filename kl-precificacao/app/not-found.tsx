import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F7F4" }}>
      <div className="text-center max-w-sm px-6">
        <p className="text-[80px] font-extrabold tracking-[-0.04em] leading-none" style={{ color: "#E87722" }}>
          404
        </p>
        <h1 className="text-[22px] font-extrabold mt-4 mb-2 tracking-[-0.02em]" style={{ color: "#1C2B30" }}>
          Página não encontrada
        </h1>
        <p className="text-[14px] mb-7" style={{ color: "#5F7177" }}>
          O recurso que você está buscando não existe ou foi removido.
        </p>
        <Link
          href="/"
          className="inline-flex items-center h-[44px] px-6 rounded-lg text-[12px] font-bold uppercase tracking-[0.04em] text-white transition-all"
          style={{ background: "#E87722", boxShadow: "0 2px 8px rgba(232,119,34,0.25)" }}
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
