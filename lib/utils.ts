import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number) {
  const clamped = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(clamped / 60)
  const secs = clamped % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function generateId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function safeDate(date: unknown): Date | null {
  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function safeParseInt(value: unknown, fallback: number, min?: number, max?: number): number {
  const parsed = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  const clamped = Number.isFinite(parsed) ? parsed : fallback
  if (min !== undefined && clamped < min) return min
  if (max !== undefined && clamped > max) return max
  return clamped
}

export function safeParseFloat(value: unknown, fallback: number, min?: number, max?: number): number {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
  const clamped = Number.isFinite(parsed) ? parsed : fallback
  if (min !== undefined && clamped < min) return min
  if (max !== undefined && clamped > max) return max
  return clamped
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function formatMinutes(minutes: number): string {
  const m = Math.round(minutes)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const remainder = m % 60
  return remainder > 0 ? `${h}h ${remainder}m` : `${h}h`
}

export function isStorageQuotaSafe(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function safeString(val: unknown, fallback = '', maxLength = 1000): string {
  if (typeof val === 'string') return val.slice(0, maxLength)
  return fallback
}
