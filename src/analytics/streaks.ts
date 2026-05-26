import { format, startOfDay, startOfMonth } from 'date-fns'
import { differenceInCalendarDays, eachDayOfInterval } from '../utils/date'
import type { NormalizedMessage, StreakSummary } from '../types'

export function computeStreaks(messages: NormalizedMessage[]): StreakSummary {
  const activeDays = [...new Set(messages.map((message) => format(startOfDay(message.date), 'yyyy-MM-dd')))]
    .map((day) => new Date(day))
    .sort((a, b) => a.getTime() - b.getTime())

  let longestDailyStreak = 0
  let currentStreak = 0
  const streakTimeline: Array<{ date: string; length: number }> = []

  for (let index = 0; index < activeDays.length; index += 1) {
    const previous = activeDays[index - 1]
    const current = activeDays[index]
    currentStreak = previous && differenceInCalendarDays(current, previous) === 1 ? currentStreak + 1 : 1
    longestDailyStreak = Math.max(longestDailyStreak, currentStreak)
    streakTimeline.push({ date: format(current, 'yyyy-MM-dd'), length: currentStreak })
  }

  const longestGaps: Array<{ start: string; end: string; days: number }> = []
  for (let index = 1; index < activeDays.length; index += 1) {
    const previous = activeDays[index - 1]
    const current = activeDays[index]
    const gapDays = differenceInCalendarDays(current, previous) - 1
    if (gapDays > 0) {
      longestGaps.push({
        start: format(previous, 'yyyy-MM-dd'),
        end: format(current, 'yyyy-MM-dd'),
        days: gapDays,
      })
    }
  }

  const dayCounts = new Map<string, number>()
  const monthCounts = new Map<string, number>()

  for (const message of messages) {
    const dayKey = format(startOfDay(message.date), 'yyyy-MM-dd')
    dayCounts.set(dayKey, (dayCounts.get(dayKey) ?? 0) + 1)
    const monthKey = format(startOfMonth(message.date), 'yyyy-MM')
    monthCounts.set(monthKey, (monthCounts.get(monthKey) ?? 0) + 1)
  }

  const monthsCovered = eachDayOfInterval({
    start: startOfMonth(messages[0].date),
    end: startOfMonth(messages[messages.length - 1].date),
  }).filter((date) => date.getDate() === 1)

  for (const month of monthsCovered) {
    const key = format(month, 'yyyy-MM')
    if (!monthCounts.has(key)) {
      monthCounts.set(key, 0)
    }
  }

  return {
    longestDailyStreak,
    currentOrRecentStreak: streakTimeline[streakTimeline.length - 1]?.length ?? 0,
    streakTimeline,
    longestGaps: [...longestGaps].sort((a, b) => b.days - a.days).slice(0, 10),
    busiestDays: [...dayCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([date, count]) => ({ date, count })),
    busiestMonths: [...monthCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([month, count]) => ({ month, count })),
    quietestMonths: [...monthCounts.entries()]
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([month, count]) => ({ month, count })),
  }
}
