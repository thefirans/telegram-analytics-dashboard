import type { NormalizedMessage, ResponseSample, ResponseTimeStats, SenderResponseStats } from '../types'

const QUICK_REPLY_LIMIT_MS = 24 * 60 * 60 * 1000

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * p))
  return sorted[index]
}

function summarizeSender(sender: string, samples: ResponseSample[]): SenderResponseStats {
  const values = samples.map((sample) => sample.responseTimeMs)
  return {
    sender,
    count: values.length,
    medianMs: percentile(values, 0.5),
    averageMs: values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1),
    p75Ms: percentile(values, 0.75),
  }
}

export function computeResponseTimes(messages: NormalizedMessage[]): ResponseTimeStats {
  const samples: ResponseSample[] = []

  for (let index = 1; index < messages.length; index += 1) {
    const previous = messages[index - 1]
    const current = messages[index]
    if (previous.sender === current.sender) {
      continue
    }

    samples.push({
      sender: current.sender,
      timestamp: current.timestamp,
      date: current.date,
      responseTimeMs: current.timestamp - previous.timestamp,
    })
  }

  const quickSamples = samples.filter((sample) => sample.responseTimeMs <= QUICK_REPLY_LIMIT_MS)
  const senders = [...new Set(quickSamples.map((sample) => sample.sender))]
  const bySender = senders.map((sender) => summarizeSender(sender, quickSamples.filter((sample) => sample.sender === sender)))

  return {
    samples,
    quickSamples,
    bySender,
  }
}
