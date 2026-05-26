import { format, startOfMonth } from 'date-fns'
import type { ConversationSession, NormalizedMessage, SessionStats, TimePoint } from '../types'

const THIRTY_MINUTES = 30 * 60 * 1000

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

export function computeSessions(messages: NormalizedMessage[]): SessionStats {
  const sessions: ConversationSession[] = []
  let current: ConversationSession | null = null

  for (const message of messages) {
    const previousTimestamp = current?.end.getTime()
    const startsNewSession =
      !current || previousTimestamp === undefined || message.timestamp - previousTimestamp > THIRTY_MINUTES

    if (startsNewSession) {
      if (current) sessions.push(current)
      current = {
        id: sessions.length + 1,
        start: message.date,
        end: message.date,
        durationMs: 0,
        messageCount: 0,
        senderSplit: {},
      }
    }

    if (!current) continue
    current.end = message.date
    current.durationMs = current.end.getTime() - current.start.getTime()
    current.messageCount += 1
    current.senderSplit[message.sender] = (current.senderSplit[message.sender] ?? 0) + 1
  }

  if (current) {
    sessions.push(current)
  }

  return {
    sessions,
    totalSessions: sessions.length,
    avgMessagesPerSession: sessions.length
      ? sessions.reduce((sum, session) => sum + session.messageCount, 0) / sessions.length
      : 0,
    medianSessionLengthMs: median(sessions.map((session) => session.durationMs)),
    longestSessionByDuration: [...sessions].sort((a, b) => b.durationMs - a.durationMs)[0],
    biggestSessionByMessages: [...sessions].sort((a, b) => b.messageCount - a.messageCount)[0],
  }
}

export function getSessionsPerMonth(sessionStats: SessionStats): TimePoint[] {
  const map = new Map<string, TimePoint>()
  for (const session of sessionStats.sessions) {
    const month = startOfMonth(session.start)
    const key = format(month, 'yyyy-MM')
    if (!map.has(key)) {
      map.set(key, { label: key, timestamp: month.getTime(), value: 0 })
    }
    map.get(key)!.value += 1
  }
  return [...map.values()].sort((a, b) => a.timestamp - b.timestamp)
}

export function getAverageSessionLengthByMonth(sessionStats: SessionStats): TimePoint[] {
  const map = new Map<string, { total: number; count: number; timestamp: number }>()
  for (const session of sessionStats.sessions) {
    const month = startOfMonth(session.start)
    const key = format(month, 'yyyy-MM')
    const current = map.get(key) ?? { total: 0, count: 0, timestamp: month.getTime() }
    current.total += session.durationMs / 60000
    current.count += 1
    map.set(key, current)
  }

  return [...map.entries()]
    .map(([label, value]) => ({
      label,
      timestamp: value.timestamp,
      value: value.count ? value.total / value.count : 0,
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
}
