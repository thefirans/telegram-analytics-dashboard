import type { DashboardAnalytics, NormalizedMessage } from '../types'
import { computeSummaryMetrics } from './metrics'
import { computeResponseTimes } from './responseTimes'
import { computeSessions, getAverageSessionLengthByMonth, getSessionsPerMonth } from './sessions'
import { computeStreaks } from './streaks'
import { computeTextStats } from './textStats'
import {
  detectActivityEras,
  getCalendarHeatmap,
  getCumulativeMessages,
  getMediaBreakdown,
  getMediaByMonth,
  getMonthlyMessages,
  getRolling30DayAverage,
  getSenderMonthlySeries,
  getSenderMonthlyShare,
  getWeekdayHourBreakdown,
  getYearlyMessages,
} from './timeSeries'

function buildNarrative(analytics: DashboardAnalytics): string {
  const topYear = [...analytics.yearlyMessages].sort((a, b) => b.value - a.value)[0]
  const topSender = [...analytics.summary.perSender].sort((a, b) => b.messageCount - a.messageCount)[0]
  const topWordSender = [...analytics.summary.perSender].sort((a, b) => b.wordCount - a.wordCount)[0]
  const topHour = Object.entries(analytics.hourCounts).sort((a, b) => b[1] - a[1])[0]

  return `This chat spans ${analytics.summary.totalCalendarDays} days with ${analytics.summary.totalMessages.toLocaleString()} messages. ${
    topYear ? `The most active year was ${topYear.label}. ` : ''
  }${topSender ? `${topSender.sender} sent more messages overall. ` : ''}${
    topWordSender ? `${topWordSender.sender} wrote the most words. ` : ''
  }${topHour ? `The busiest hour was ${topHour[0]}:00.` : ''}`
}

export function computeDashboardAnalytics(messages: NormalizedMessage[]): DashboardAnalytics {
  const summary = computeSummaryMetrics(messages)
  const monthlyMessages = getMonthlyMessages(messages)
  const yearlyMessages = getYearlyMessages(messages)
  const cumulativeMessages = getCumulativeMessages(monthlyMessages)
  const rolling30DayAverage = getRolling30DayAverage(messages)
  const senderMonthlyMessages = getSenderMonthlySeries(messages)
  const senderMonthlyShare = getSenderMonthlyShare(senderMonthlyMessages)
  const calendarHeatmap = getCalendarHeatmap(messages)
  const { weekdayCounts, hourCounts, weekdayHourMatrix } = getWeekdayHourBreakdown(messages)
  const mediaBreakdown = getMediaBreakdown(messages)
  const mediaByMonth = getMediaByMonth(messages)
  const sessionStats = computeSessions(messages)
  const sessionsPerMonth = getSessionsPerMonth(sessionStats)
  const averageSessionLengthByMonth = getAverageSessionLengthByMonth(sessionStats)
  const responseTimes = computeResponseTimes(messages)
  const streaks = computeStreaks(messages)
  const textStats = computeTextStats(messages)
  const eras = detectActivityEras(monthlyMessages)
  const stickerCounts = new Map<string, number>()
  for (const message of messages) {
    if (message.stickerEmoji) {
      stickerCounts.set(message.stickerEmoji, (stickerCounts.get(message.stickerEmoji) ?? 0) + 1)
    }
  }
  const stickerEmojiTop = [...stickerCounts.entries()]
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)

  const analytics = {
    summary,
    monthlyMessages,
    yearlyMessages,
    cumulativeMessages,
    rolling30DayAverage,
    senderMonthlyMessages,
    senderMonthlyShare,
    calendarHeatmap,
    weekdayCounts,
    hourCounts,
    weekdayHourMatrix,
    mediaBreakdown,
    mediaByMonth,
    stickerEmojiTop,
    sessionStats,
    sessionsPerMonth,
    averageSessionLengthByMonth,
    responseTimes,
    streaks,
    textStats,
    eras,
    generatedSummary: '',
  } satisfies DashboardAnalytics

  analytics.generatedSummary = buildNarrative(analytics)
  return analytics
}
