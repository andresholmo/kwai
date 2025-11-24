import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata valor para moeda brasileira
 * A API do Kwai retorna valores em MICRO-REAIS (1/1.000.000 de real)
 * Exemplo: 70000 na API = R$ 0,07
 */
export function formatCurrencyBRL(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === "") return "-";

  // Converter para número se for string
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  // Se não for número válido
  if (isNaN(numValue)) return "-";

  // Se for 0
  if (numValue === 0) return "R$ 0,00";

  // Dividir por 1.000.000 (API retorna em micro-reais)
  const valueInReais = numValue / 1000000;

  // Formatar
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valueInReais);
}

/**
 * Formata valor para moeda brasileira - versão para valores que JÁ estão em reais
 * Usar quando souber que o valor não está em micro-reais
 */
export function formatCurrencyBRLDirect(
  value: number | null | undefined
): string {
  if (value === null || value === undefined) return "-";
  if (value === 0) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata número com separador brasileiro
 */
export function formatNumberPT(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR").format(value);
}

/**
 * Converte micro-reais para reais
 */
export function microToReais(microValue: number): number {
  return microValue / 1000000;
}

/**
 * Converte reais para micro-reais (para enviar à API)
 */
export function reaisToMicro(reaisValue: number): number {
  return Math.round(reaisValue * 1000000);
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
