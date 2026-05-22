import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? ""
  const all = request.nextUrl.searchParams.get("all") === "1"

  if (!all && q.length < 2) return NextResponse.json([])

  const componentes = await prisma.componente.findMany({
    where: {
      ativo: true,
      ...(!all && q
        ? {
            OR: [
              { descricao: { contains: q, mode: "insensitive" } },
              { codigoFabricante: { contains: q, mode: "insensitive" } },
              { fabricante: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      precos: { where: { vigenteAte: null }, take: 1 },
    },
    ...(all ? {} : { take: 15 }),
    orderBy: { descricao: "asc" },
  })

  return NextResponse.json(
    componentes.map((c) => ({
      id: c.id,
      codigoFabricante: c.codigoFabricante,
      descricao: c.descricao,
      fabricante: c.fabricante,
      categoria: c.categoria,
      unidadeMedida: c.unidadeMedida,
      precoCusto: c.precos[0]?.precoCusto?.toString() ?? "0",
    }))
  )
}
