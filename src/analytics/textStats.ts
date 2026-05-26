import type { NormalizedMessage, TextStats } from '../types'
import { detectScriptBalance, topEmojis, topWords } from '../utils/text'

export function computeTextStats(messages: NormalizedMessage[]): TextStats {
  const texts = messages.filter((message) => message.hasText).map((message) => message.text)
  const bySender = [...new Set(messages.map((message) => message.sender))]
  const questionMarks = texts.reduce((sum, text) => sum + (text.match(/\?/g) ?? []).length, 0)
  const exclamationMarks = texts.reduce((sum, text) => sum + (text.match(/!/g) ?? []).length, 0)
  const emojiRows = topEmojis(texts, 24)
  const emojiCount = emojiRows.reduce((sum, row) => sum + row.count, 0)

  const longestMessageBySender = Object.fromEntries(
    bySender.map((sender) => {
      const longest = messages
        .filter((message) => message.sender === sender)
        .sort((a, b) => b.charCount - a.charCount)[0]

      return [
        sender,
        {
          length: longest?.charCount ?? 0,
          text: longest?.text ?? '',
          date: longest ? longest.date.toISOString() : '',
          id: longest?.id ?? '',
        },
      ]
    }),
  )

  return {
    totalWords: messages.reduce((sum, message) => sum + message.wordCount, 0),
    avgWordsPerMessage: messages.length
      ? messages.reduce((sum, message) => sum + message.wordCount, 0) / messages.length
      : 0,
    questionMarks,
    exclamationMarks,
    emojiCount,
    topWordsOverall: topWords(texts),
    topWordsBySender: Object.fromEntries(
      bySender.map((sender) => [
        sender,
        topWords(
          messages.filter((message) => message.sender === sender && message.hasText).map((message) => message.text),
        ),
      ]),
    ),
    topEmojis: emojiRows,
    scriptEstimate: detectScriptBalance(texts),
    longestMessageBySender,
  }
}
