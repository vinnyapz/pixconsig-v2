import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

// Helper to get name from entity that can be string or object with name
export function getEntityName(entity: string | { name?: string } | null | undefined, fallback = '-'): string {
  if (!entity) return fallback
  if (typeof entity === 'string') return entity
  return entity.name || fallback
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "")
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "").substring(0, 15)
}

export function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4")
      .replace(/-$/, "")
      .replace(/\.-$/, "")
      .substring(0, 14)
  }
  return digits
    .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5")
    .replace(/-$/, "")
    .substring(0, 18)
}

export function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, "")
  return digits
    .replace(/(\d{5})(\d{0,3})/, "$1-$2")
    .replace(/-$/, "")
    .substring(0, 9)
}

export function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat('pt-BR').format(parseInt(digits));
}
