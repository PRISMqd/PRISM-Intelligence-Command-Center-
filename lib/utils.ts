import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, differenceInDays, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function daysSince(date: string | Date): number {
  return differenceInDays(new Date(), new Date(date))
}

export function formatScore(score: number, decimals = 2): string {
  return score.toFixed(decimals)
}

export function formatPercent(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export function getBadgeColorClasses(color: 'green' | 'amber' | 'red' | 'gray'): string {
  switch (color) {
    case 'green': return 'bg-green-100 text-green-800 border-green-200'
    case 'amber': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'red': return 'bg-red-100 text-red-800 border-red-200'
    case 'gray': return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function getScoreColorClasses(score: number, thresholds: { green: number, amber: number }): string {
  if (score >= thresholds.green) return 'text-green-700 bg-green-50'
  if (score >= thresholds.amber) return 'text-amber-700 bg-amber-50'
  return 'text-red-700 bg-red-50'
}
