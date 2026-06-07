import {
  addDays,
  format,
  isToday as dfIsToday,
  parseISO,
  startOfWeek,
  differenceInCalendarDays,
} from 'date-fns'
import { fr } from 'date-fns/locale'

export { addDays }

export const ISO = 'yyyy-MM-dd'

export function toISO(d: Date): string {
  return format(d, ISO)
}

export function fromISO(s: string): Date {
  return parseISO(s)
}

/** Monday-based week start for a given date */
export function weekStart(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 })
}

export function weekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function dayName(d: Date): string {
  return format(d, 'EEEE', { locale: fr })
}

export function dayNum(d: Date): string {
  return format(d, 'd', { locale: fr })
}

export function monthLabel(d: Date): string {
  return format(d, 'MMMM', { locale: fr })
}

export function weekLabel(start: Date): string {
  const end = addDays(start, 6)
  if (format(start, 'MMM', { locale: fr }) === format(end, 'MMM', { locale: fr })) {
    return `${format(start, 'd', { locale: fr })} – ${format(end, 'd MMMM yyyy', { locale: fr })}`
  }
  return `${format(start, 'd MMM', { locale: fr })} – ${format(end, 'd MMM yyyy', { locale: fr })}`
}

export function isToday(s: string): boolean {
  return dfIsToday(parseISO(s))
}

/** Days until expiry from today (negative = past) */
export function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date())
}

export function shiftWeek(start: Date, weeks: number): Date {
  return addDays(start, weeks * 7)
}

export function prettyDate(iso: string): string {
  return format(parseISO(iso), 'EEEE d MMMM', { locale: fr })
}
