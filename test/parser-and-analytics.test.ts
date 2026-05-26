import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { computeSummaryMetrics } from '../src/analytics/metrics'
import { computeResponseTimes } from '../src/analytics/responseTimes'
import { computeSessions } from '../src/analytics/sessions'
import { computeStreaks } from '../src/analytics/streaks'
import { computeTextStats } from '../src/analytics/textStats'
import { parseTelegramExport } from '../src/parser/telegramParser'
import type { TelegramExport } from '../src/types'

const testDir = dirname(fileURLToPath(import.meta.url))

function fixture(name: string): TelegramExport {
  return JSON.parse(readFileSync(resolve(testDir, 'fixtures', name), 'utf8'))
}

describe('telegram parser', () => {
  it('parses simple string messages', () => {
    const parsed = parseTelegramExport(fixture('simple-string.json'))
    expect(parsed.messages).toHaveLength(3)
    expect(parsed.messages[0].text).toBe('Hello there')
    expect(parsed.messages[2].wordCount).toBe(4)
    expect(parsed.participants).toEqual(['Alice', 'Bob'])
  })

  it('joins array-based text entities into one text string', () => {
    const parsed = parseTelegramExport(fixture('text-array.json'))
    expect(parsed.messages[0].text).toBe('Check this out')
    expect(parsed.messages[0].wordCount).toBe(3)
  })

  it('keeps media-only messages without crashing', () => {
    const parsed = parseTelegramExport(fixture('media-only.json'))
    expect(parsed.messages[0].hasText).toBe(false)
    expect(parsed.messages[0].isPhoto).toBe(true)
    expect(parsed.messages[1].isSticker).toBe(true)
    expect(parsed.messages[1].stickerEmoji).toBe('😂')
  })

  it('handles forwarded, edited, voice, and missing optional fields', () => {
    const parsed = parseTelegramExport(fixture('mixed-edge.json'))
    expect(parsed.messages).toHaveLength(6)
    expect(parsed.messages[1].isEdited).toBe(true)
    expect(parsed.messages[2].isForwarded).toBe(true)
    expect(parsed.messages[3].isVoice).toBe(true)
    expect(parsed.messages[3].hasText).toBe(false)
  })

  it('throws on unsupported formats', () => {
    expect(() => parseTelegramExport({ foo: 'bar' })).toThrow(/messages array/i)
  })
})

describe('analytics', () => {
  const parsed = parseTelegramExport(fixture('mixed-edge.json'))

  it('computes sender and media summary stats', () => {
    const summary = computeSummaryMetrics(parsed.messages)
    expect(summary.totalMessages).toBe(6)
    expect(summary.totalVoiceMessages).toBe(1)
    expect(summary.totalEditedMessages).toBe(1)
    expect(summary.totalForwardedMessages).toBe(1)
    expect(summary.totalActiveDays).toBe(3)
    expect(summary.perSender.find((sender) => sender.sender === 'Alice')?.messageCount).toBe(3)
  })

  it('computes response times only when sender changes', () => {
    const responseTimes = computeResponseTimes(parsed.messages)
    expect(responseTimes.samples).toHaveLength(5)
    expect(responseTimes.bySender.find((sender) => sender.sender === 'Bob')?.count).toBeGreaterThan(0)
  })

  it('computes conversation sessions with a 30-minute gap split', () => {
    const sessions = computeSessions(parsed.messages)
    expect(sessions.totalSessions).toBe(4)
    expect(sessions.biggestSessionByMessages?.messageCount).toBe(2)
  })

  it('computes daily streaks and gaps', () => {
    const streaks = computeStreaks(parsed.messages)
    expect(streaks.longestDailyStreak).toBe(2)
    expect(streaks.longestGaps[0]?.days).toBe(1)
  })

  it('computes text-level analytics safely', () => {
    const textStats = computeTextStats(parsed.messages)
    expect(textStats.totalWords).toBeGreaterThan(0)
    expect(textStats.questionMarks).toBe(2)
    expect(textStats.exclamationMarks).toBe(3)
  })
})
