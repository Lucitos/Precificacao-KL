import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function gerarNumeroReferencia(count: number): string {
  const ano = new Date().getFullYear()
  const seq = String(count + 1).padStart(4, "0")
  return `KL-${ano}-${seq}`
}
