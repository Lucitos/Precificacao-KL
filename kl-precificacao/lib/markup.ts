import Decimal from "decimal.js"

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export interface DREParams {
  pctCustoFixo: string | number
  pctCustoVariavel: string | number
  pctSalarios: string | number
}

export interface ResultadoPrecificacao {
  markup: string
  precoVenda: string
  custoDireto: string
  custoFixoValor: string
  custoVariavelValor: string
  salariosValor: string
  margemValor: string
  vi: string
  soma: string
  viStatus: "verde" | "amarelo" | "vermelho"
}

export function calcularPrecificacao(
  custoDireto: string | number,
  margemDesejada: string | number,
  dre: DREParams
): ResultadoPrecificacao {
  const custo = new Decimal(custoDireto || 0)
  const margem = new Decimal(margemDesejada || 0)
  const cf = new Decimal(dre.pctCustoFixo)
  const cv = new Decimal(dre.pctCustoVariavel)
  const sal = new Decimal(dre.pctSalarios)

  const soma = cf.plus(cv).plus(sal).plus(margem)
  const markup = new Decimal(1).div(new Decimal(1).minus(soma))
  const precoVenda = custo.times(markup).toDecimalPlaces(2)

  const custoFixoValor = precoVenda.times(cf).toDecimalPlaces(2)
  const custoVariavelValor = precoVenda.times(cv).toDecimalPlaces(2)
  const salariosValor = precoVenda.times(sal).toDecimalPlaces(2)
  const margemValor = precoVenda.times(margem).toDecimalPlaces(2)

  const somaBase = cf.plus(cv).plus(sal)
  const markupMinimo = new Decimal(1).div(new Decimal(1).minus(somaBase))
  const precoMinimo = custo.times(markupMinimo).toDecimalPlaces(2)
  const vi = precoMinimo.isZero()
    ? new Decimal(1)
    : precoVenda.div(precoMinimo).toDecimalPlaces(4)

  let viStatus: "verde" | "amarelo" | "vermelho" = "verde"
  if (vi.lessThan("0.95")) viStatus = "vermelho"
  else if (vi.lessThan("1.10")) viStatus = "amarelo"

  return {
    markup: markup.toDecimalPlaces(6).toString(),
    precoVenda: precoVenda.toString(),
    custoDireto: custo.toDecimalPlaces(2).toString(),
    custoFixoValor: custoFixoValor.toString(),
    custoVariavelValor: custoVariavelValor.toString(),
    salariosValor: salariosValor.toString(),
    margemValor: margemValor.toString(),
    vi: vi.toString(),
    soma: soma.toDecimalPlaces(6).toString(),
    viStatus,
  }
}

export function formatBRL(value: string | number): string {
  return new Decimal(value || 0).toNumber().toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })
}

export function formatPercent(value: string | number): string {
  return (new Decimal(value || 0).times(100).toDecimalPlaces(4).toNumber()).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }) + "%"
}
