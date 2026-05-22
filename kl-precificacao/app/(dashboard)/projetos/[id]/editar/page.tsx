import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import EditarProjetoForm, { type QuadroLocal, type ItemLista } from "./EditarProjetoForm"

export default async function EditarProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const projeto = await prisma.projeto.findUnique({
    where: { id },
    include: {
      quadros: {
        include: {
          itens: {
            include: { componente: { select: { codigoFabricante: true, descricao: true, unidadeMedida: true } } },
            orderBy: { componente: { descricao: "asc" } },
          },
        },
        orderBy: { ordem: "asc" },
      },
      itens: {
        where: { quadroId: null },
        include: { componente: { select: { codigoFabricante: true, descricao: true, unidadeMedida: true } } },
        orderBy: { componente: { descricao: "asc" } },
      },
    },
  })

  if (!projeto) notFound()

  let initialQuadros: QuadroLocal[]
  let initialItens: ItemLista[]

  if (projeto.quadros.length > 0) {
    initialQuadros = projeto.quadros.map((q) => ({
      localId: q.id,
      nome: q.nome,
      quantidade: q.quantidade,
      quantidadeStr: String(q.quantidade),
      busca: "",
    }))
    initialItens = projeto.quadros.flatMap((q) =>
      q.itens.map((item) => ({
        localId: item.id,
        quadroLocalId: q.id,
        componenteId: item.componenteId,
        codigoFabricante: item.componente.codigoFabricante,
        descricao: item.componente.descricao,
        unidadeMedida: item.componente.unidadeMedida,
        quantidade: Number(item.quantidade),
        quantidadeStr: String(Math.round(Number(item.quantidade))),
        precoCustoUnitario: Number(item.precoCustoUnitario),
      }))
    )
  } else {
    const defaultId = "default-quadro"
    initialQuadros = [{ localId: defaultId, nome: "Geral", quantidade: 1, quantidadeStr: "1", busca: "" }]
    initialItens = projeto.itens.map((item) => ({
      localId: item.id,
      quadroLocalId: defaultId,
      componenteId: item.componenteId,
      codigoFabricante: item.componente.codigoFabricante,
      descricao: item.componente.descricao,
      unidadeMedida: item.componente.unidadeMedida,
      quantidade: Number(item.quantidade),
      quantidadeStr: String(Math.round(Number(item.quantidade))),
      precoCustoUnitario: Number(item.precoCustoUnitario),
    }))
  }

  return (
    <EditarProjetoForm
      id={projeto.id}
      numeroReferencia={projeto.numeroReferencia}
      initialNome={projeto.nome}
      initialCliente={projeto.cliente}
      initialDescricao={projeto.descricao ?? ""}
      initialMargem={Math.round(Number(projeto.margemAplicada) * 100)}
      initialQuadros={initialQuadros}
      initialItens={initialItens}
    />
  )
}
