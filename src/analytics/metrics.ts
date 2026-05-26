import { differenceInCalendarDays, format, startOfDay } from '../utils/date'
import type { NormalizedMessage, SummaryMetrics } from '../types'

export function computeSummaryMetrics(messages: NormalizedMessage[]): SummaryMetrics {
  const start = messages[0].date
  const end = messages[messages.length - 1].date
  const activeDays = new Set(messages.map((message) => format(startOfDay(message.date), 'yyyy-MM-dd')))
  const perSenderMap = new Map<string, SummaryMetrics['perSender'][number]>()

  let totalPhotos = 0
  let totalStickers = 0
  let totalVideos = 0
  let totalVoiceMessages = 0
  let totalEditedMessages = 0
  let totalForwardedMessages = 0
  let totalWords = 0

  for (const message of messages) {
    totalPhotos += Number(message.isPhoto)
    totalStickers += Number(message.isSticker)
    totalVideos += Number(message.isVideo)
    totalVoiceMessages += Number(message.isVoice)
    totalEditedMessages += Number(message.isEdited)
    totalForwardedMessages += Number(message.isForwarded)
    totalWords += message.wordCount

    const senderStat =
      perSenderMap.get(message.sender) ??
      {
        sender: message.sender,
        messageCount: 0,
        textMessageCount: 0,
        wordCount: 0,
        avgWordsPerTextMessage: 0,
        avgCharsPerMessage: 0,
        photos: 0,
        stickers: 0,
        videos: 0,
        voice: 0,
        audio: 0,
        files: 0,
        edited: 0,
        forwarded: 0,
      }

    senderStat.messageCount += 1
    senderStat.textMessageCount += Number(message.hasText)
    senderStat.wordCount += message.wordCount
    senderStat.avgCharsPerMessage += message.charCount
    senderStat.photos += Number(message.isPhoto)
    senderStat.stickers += Number(message.isSticker)
    senderStat.videos += Number(message.isVideo)
    senderStat.voice += Number(message.isVoice)
    senderStat.audio += Number(message.isAudio)
    senderStat.files += Number(message.isFile)
    senderStat.edited += Number(message.isEdited)
    senderStat.forwarded += Number(message.isForwarded)

    perSenderMap.set(message.sender, senderStat)
  }

  const totalCalendarDays = differenceInCalendarDays(end, start) + 1
  const perSender = [...perSenderMap.values()].map((stat) => ({
    ...stat,
    avgWordsPerTextMessage: stat.textMessageCount ? stat.wordCount / stat.textMessageCount : 0,
    avgCharsPerMessage: stat.messageCount ? stat.avgCharsPerMessage / stat.messageCount : 0,
  }))

  return {
    totalMessages: messages.length,
    totalActiveDays: activeDays.size,
    totalCalendarDays,
    activeDayPercentage: totalCalendarDays ? (activeDays.size / totalCalendarDays) * 100 : 0,
    avgMessagesPerActiveDay: activeDays.size ? messages.length / activeDays.size : 0,
    avgMessagesPerCalendarDay: totalCalendarDays ? messages.length / totalCalendarDays : 0,
    totalPhotos,
    totalStickers,
    totalVideos,
    totalVoiceMessages,
    totalEditedMessages,
    totalForwardedMessages,
    totalWords,
    avgWordsPerMessage: messages.length ? totalWords / messages.length : 0,
    dateRange: { start, end },
    perSender,
  }
}
