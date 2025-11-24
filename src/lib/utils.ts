import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata valor para moeda brasileira
 * A API do Kwai retorna valores em REAIS (ex: 0.07)
 * NÃO multiplicar nem dividir - apenas formatar
 */
export function formatCurrencyBRL(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === "") return "-";

  // Converter para número se for string
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  // Se não for número válido
  if (isNaN(numValue)) return "-";

  // Formatar diretamente - SEM multiplicar ou dividir
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Formata número com separador brasileiro
 */
export function formatNumberPT(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR").format(value);
}

/**
 * Converte valor em reais para centavos (para enviar à API se necessário)
 */
export function toCents(valueInReais: number): number {
  return Math.round(valueInReais * 100);
}

/**
 * Converte centavos para reais (use apenas se souber que o valor está em centavos)
 */
export function toReais(valueInCents: number): number {
  return valueInCents / 100;
}

export function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
