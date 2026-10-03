import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)}, ${formatTime(dateStr)}`
}

export function isLowStock(currentStock: number, minimumStock: number): boolean {
  return currentStock <= minimumStock
}

export function generateSKU(name: string, category: string): string {
  const cat = category.slice(0, 3).toUpperCase().replace(/\s/g, '')
  const prod = name.slice(0, 4).toUpperCase().replace(/\s/g, '')
  const rand = Math.floor(Math.random() * 900 + 100)
  return `${cat}-${prod}-${rand}`
}
