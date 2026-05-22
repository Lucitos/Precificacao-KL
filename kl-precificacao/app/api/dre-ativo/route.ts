import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const dre = await prisma.dREParametros.findFirst({ where: { ativo: true } })
  if (!dre) return NextResponse.json(null)
  return NextResponse.json({
    pctCustoFixo: dre.pctCustoFixo.toString(),
    pctCustoVariavel: dre.pctCustoVariavel.toString(),
    pctSalarios: dre.pctSalarios.toString(),
  })
}
