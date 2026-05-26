import { format } from 'date-fns'
import {
  eachDayOfInterval,
  enumerateMonths,
  enumerateYears,
  startOfDay,
  startOfMonth,
} from '../utils/date'
import type {
  ActivityEra,
  CalendarDayStat,
  MultiSeriesPoint,
  NormalizedMessage,
  TimePoint,
} from '../types'

function makePointMap<T extends { label: string; timestamp: number; value: number }>(
  dates: Date[],
  labelFormat: string,
): T[] {
  return dates.map((date) => ({
    label: format(date, labelFormat),
    timestamp: date.getTime(),
    value: 0,
  })) as T[]
}

export function getMonthlyMessages(messages: NormalizedMessage[]): TimePoint[] {
  const months = makePointMap<TimePoint>(
    enumerateMonths(messages[0].date, messages[messages.length - 1].date),
    'yyyy-MM',
  )
  const index = new Map(months.map((point, i) => [point.label, i]))
  for (const message of messages) {
    const key = format(startOfMonth(message.date), 'yyyy-MM')
    const pointIndex = index.get(key)
    if (pointIndex !== undefined) months[pointIndex].value += 1
  }
  return months
}

export function getYearlyMessages(messages: NormalizedMessage[]): TimePoint[] {
  const years = makePointMap<TimePoint>(
    enumerateYears(messages[0].date, messages[messages.length - 1].date),
    'yyyy',
  )
  const index = new Map(years.map((point, i) => [point.label, i]))
  for (const message of messages) {
    const key = format(message.date, 'yyyy')
    const pointIndex = index.get(key)
    if (pointIndex !== undefined) years[pointIndex].value += 1
  }
  return years
}

export function getCumulativeMessages(monthlyMessages: TimePoint[]): TimePoint[] {
  let total = 0
  return monthlyMessages.map((point) => {
    total += point.value
    return { ...point, value: total }
  })
}

export function getRolling30DayAverage(messages: NormalizedMessage[]): TimePoint[] {
  const days = eachDayOfInterval({
    start: startOfDay(messages[0].date),
    end: startOfDay(messages[messages.length - 1].date),
  })
  const dailyCounts = new Map<string, number>()
  for (const message of messages) {
    const key = format(startOfDay(message.date), 'yyyy-MM-dd')
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1)
  }

  const values = days.map((day) => dailyCounts.get(format(day, 'yyyy-MM-dd')) ?? 0)

  return days.map((day, index) => {
    const slice = values.slice(Math.max(0, index - 29), index + 1)
    const average = slice.reduce((sum, value) => sum + value, 0) / slice.length
    return {
      label: format(day, 'yyyy-MM-dd'),
      timestamp: day.getTime(),
      value: average,
    }
  })
}

export function getSenderMonthlySeries(messages: NormalizedMessage[]): MultiSeriesPoint[] {
  const months = enumerateMonths(messages[0].date, messages[messages.length - 1].date)
  const senders = [...new Set(messages.map((message) => message.sender))]
  const points = months.map((month) => ({
    label: format(month, 'yyyy-MM'),
    timestamp: month.getTime(),
    values: Object.fromEntries(senders.map((sender) => [sender, 0])),
  }))

  const index = new Map(points.map((point, i) => [point.label, i]))
  for (const message of messages) {
    const key = format(startOfMonth(message.date), 'yyyy-MM')
    const pointIndex = index.get(key)
    if (pointIndex !== undefined) {
      points[pointIndex].values[message.sender] += 1
    }
  }
  return points
}

export function getSenderMonthlyShare(senderMonthly: MultiSeriesPoint[]): MultiSeriesPoint[] {
  return senderMonthly.map((point) => {
    const total = Object.values(point.values).reduce((sum, value) => sum + value, 0)
    const values = Object.fromEntries(
      Object.entries(point.values).map(([sender, value]) => [sender, total ? (value / total) * 100 : 0]),
    )
    return { ...point, values }
  })
}

export function getCalendarHeatmap(messages: NormalizedMessage[]): CalendarDayStat[] {
  const days = eachDayOfInterval({
    start: startOfDay(messages[0].date),
    end: startOfDay(messages[messages.length - 1].date),
  })
  const map = new Map<string, CalendarDayStat>()

  for (const day of days) {
    const key = format(day, 'yyyy-MM-dd')
    map.set(key, {
      key,
      date: day,
      totalMessages: 0,
      textMessages: 0,
      mediaMessages: 0,
      wordCount: 0,
      mediaCount: 0,
      senderSplit: {},
    })
  }

  for (const message of messages) {
    const key = format(startOfDay(message.date), 'yyyy-MM-dd')
    const stat = map.get(key)
    if (!stat) continue
    stat.totalMessages += 1
    stat.textMessages += Number(message.hasText)
    const isMedia = Number(
      message.isPhoto || message.isSticker || message.isVideo || message.isVoice || message.isAudio || message.isFile,
    )
    stat.mediaMessages += isMedia
    stat.wordCount += message.wordCount
    stat.mediaCount += isMedia
    stat.senderSplit[message.sender] = (stat.senderSplit[message.sender] ?? 0) + 1
  }

  return [...map.values()]
}

export function getWeekdayHourBreakdown(
  messages: NormalizedMessage[],
  sender: string | 'all' = 'all',
) {
  const filtered = sender === 'all' ? messages : messages.filter((message) => message.sender === sender)
  const weekdayCounts: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  }
  const hourCounts = Object.fromEntries(Array.from({ length: 24 }, (_, hour) => [String(hour).padStart(2, '0'), 0]))
  const matrix = Array.from({ length: 7 * 24 }, () => 0)
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  for (const message of filtered) {
    const day = message.date.getDay()
    const hour = message.date.getHours()
    const label = weekdayLabels[day]
    if (label !== 'Sun') {
      weekdayCounts[label] += 1
    } else {
      weekdayCounts.Sun += 1
    }
    hourCounts[String(hour).padStart(2, '0')] += 1
    matrix[day * 24 + hour] += 1
  }

  return {
    weekdayCounts,
    hourCounts,
    weekdayHourMatrix: Array.from({ length: 7 }, (_, day) =>
      Array.from({ length: 24 }, (_, hour) => [hour, day, matrix[day * 24 + hour]] as [number, number, number]),
    ).flat(),
  }
}

export function getMediaBreakdown(messages: NormalizedMessage[]) {
  return [
    { label: 'Photos', value: messages.filter((message) => message.isPhoto).length },
    { label: 'Stickers', value: messages.filter((message) => message.isSticker).length },
    { label: 'Videos', value: messages.filter((message) => message.isVideo).length },
    { label: 'Voice', value: messages.filter((message) => message.isVoice).length },
    { label: 'Audio', value: messages.filter((message) => message.isAudio).length },
    { label: 'Files', value: messages.filter((message) => message.isFile).length },
  ]
}

export function getMediaByMonth(messages: NormalizedMessage[]): MultiSeriesPoint[] {
  const months = enumerateMonths(messages[0].date, messages[messages.length - 1].date)
  const labels = ['Photos', 'Stickers', 'Videos', 'Voice']
  const points = months.map((month) => ({
    label: format(month, 'yyyy-MM'),
    timestamp: month.getTime(),
    values: Object.fromEntries(labels.map((label) => [label, 0])),
  }))

  const index = new Map(points.map((point, i) => [point.label, i]))
  for (const message of messages) {
    const key = format(startOfMonth(message.date), 'yyyy-MM')
    const pointIndex = index.get(key)
    if (pointIndex === undefined) continue
    if (message.isPhoto) points[pointIndex].values.Photos += 1
    if (message.isSticker) points[pointIndex].values.Stickers += 1
    if (message.isVideo) points[pointIndex].values.Videos += 1
    if (message.isVoice) points[pointIndex].values.Voice += 1
  }

  return points
}

export function detectActivityEras(monthlyMessages: TimePoint[]): ActivityEra[] {
  const values = monthlyMessages.map((point) => point.value)
  const sorted = [...values].sort((a, b) => a - b)
  const quantile = (q: number) => sorted[Math.floor((sorted.length - 1) * q)] ?? 0
  const q25 = quantile(0.25)
  const q60 = quantile(0.6)
  const q85 = quantile(0.85)

  return monthlyMessages.map((point, index) => {
    const previous = monthlyMessages[index - 1]?.value ?? point.value
    const rising = point.value > previous * 1.4 && point.value > q60
    let label: ActivityEra['label'] = 'active period'
    if (point.value <= q25) label = 'quiet period'
    else if (point.value >= q85) label = 'peak period'
    else if (rising) label = 'comeback period'
    return { month: point.label, label, value: point.value }
  })
}
