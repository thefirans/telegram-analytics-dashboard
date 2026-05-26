import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
} from 'date-fns'

export {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
}

export function parseTelegramDate(value?: string, unixTime?: string | number): Date | null {
  if (value) {
    const parsed = parseISO(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  if (unixTime !== undefined) {
    const numeric = Number(unixTime)
    if (Number.isFinite(numeric)) {
      return new Date(numeric * 1000)
    }
  }

  return null
}

export function enumerateMonths(start: Date, end: Date): Date[] {
  const months: Date[] = []
  let cursor = startOfMonth(start)
  const last = startOfMonth(end)

  while (cursor <= last) {
    months.push(cursor)
    cursor = addDays(endOfMonth(cursor), 1)
  }

  return months
}

export function enumerateYears(start: Date, end: Date): Date[] {
  const years: Date[] = []
  let cursor = startOfYear(start)
  const last = startOfYear(end)

  while (cursor <= last) {
    years.push(cursor)
    cursor = addDays(endOfYear(cursor), 1)
  }

  return years
}
