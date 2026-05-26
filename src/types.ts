export type TelegramTextEntity =
  | string
  | {
      type?: string
      text?: string
    }

export type TelegramMessage = {
  id?: number | string
  type?: string
  date?: string
  date_unixtime?: string | number
  from?: string
  from_id?: string
  text?: string | TelegramTextEntity[]
  text_entities?: TelegramTextEntity[]
  media_type?: string
  mime_type?: string
  file_name?: string
  photo?: string
  file?: string
  sticker_emoji?: string
  edited?: string | boolean
  forwarded_from?: string
  reply_to_message_id?: number | string
}

export type TelegramExport = {
  name?: string
  type?: string
  id?: number | string
  messages?: TelegramMessage[]
}

export type NormalizedMessage = {
  id: number | string
  date: Date
  timestamp: number
  sender: string
  senderId?: string
  text: string
  textLength: number
  wordCount: number
  charCount: number
  hasText: boolean
  mediaType: string | null
  isPhoto: boolean
  isSticker: boolean
  isVideo: boolean
  isVoice: boolean
  isAudio: boolean
  isFile: boolean
  isForwarded: boolean
  isEdited: boolean
  replyToMessageId?: number | string
  stickerEmoji?: string
}

export type ParsedTelegramChat = {
  chatName: string
  chatType: string
  chatId?: number | string
  participants: string[]
  senderIds: Record<string, string | undefined>
  messages: NormalizedMessage[]
}

export type SenderStats = {
  sender: string
  messageCount: number
  textMessageCount: number
  wordCount: number
  avgWordsPerTextMessage: number
  avgCharsPerMessage: number
  photos: number
  stickers: number
  videos: number
  voice: number
  audio: number
  files: number
  edited: number
  forwarded: number
}

export type SummaryMetrics = {
  totalMessages: number
  totalActiveDays: number
  totalCalendarDays: number
  activeDayPercentage: number
  avgMessagesPerActiveDay: number
  avgMessagesPerCalendarDay: number
  totalPhotos: number
  totalStickers: number
  totalVideos: number
  totalVoiceMessages: number
  totalEditedMessages: number
  totalForwardedMessages: number
  totalWords: number
  avgWordsPerMessage: number
  dateRange: {
    start: Date
    end: Date
  }
  perSender: SenderStats[]
}

export type TimePoint = {
  label: string
  timestamp: number
  value: number
}

export type MultiSeriesPoint = {
  label: string
  timestamp: number
  values: Record<string, number>
}

export type DayMetricKey = 'all' | 'text' | 'media' | 'words'

export type CalendarDayStat = {
  key: string
  date: Date
  totalMessages: number
  textMessages: number
  mediaMessages: number
  wordCount: number
  mediaCount: number
  senderSplit: Record<string, number>
}

export type ConversationSession = {
  id: number
  start: Date
  end: Date
  durationMs: number
  messageCount: number
  senderSplit: Record<string, number>
}

export type SessionStats = {
  sessions: ConversationSession[]
  totalSessions: number
  avgMessagesPerSession: number
  medianSessionLengthMs: number
  longestSessionByDuration?: ConversationSession
  biggestSessionByMessages?: ConversationSession
}

export type ResponseSample = {
  sender: string
  timestamp: number
  date: Date
  responseTimeMs: number
}

export type SenderResponseStats = {
  sender: string
  count: number
  medianMs: number
  averageMs: number
  p75Ms: number
}

export type ResponseTimeStats = {
  samples: ResponseSample[]
  quickSamples: ResponseSample[]
  bySender: SenderResponseStats[]
}

export type StreakSummary = {
  longestDailyStreak: number
  currentOrRecentStreak: number
  streakTimeline: Array<{ date: string; length: number }>
  longestGaps: Array<{ start: string; end: string; days: number }>
  busiestDays: Array<{ date: string; count: number }>
  busiestMonths: Array<{ month: string; count: number }>
  quietestMonths: Array<{ month: string; count: number }>
}

export type TextStats = {
  totalWords: number
  avgWordsPerMessage: number
  questionMarks: number
  exclamationMarks: number
  emojiCount: number
  topWordsOverall: Array<{ word: string; count: number }>
  topWordsBySender: Record<string, Array<{ word: string; count: number }>>
  topEmojis: Array<{ emoji: string; count: number }>
  scriptEstimate: 'Cyrillic-heavy' | 'Latin-heavy' | 'Mixed'
  longestMessageBySender: Record<
    string,
    { length: number; text: string; date: string; id: number | string }
  >
}

export type ActivityEra = {
  month: string
  label: 'quiet period' | 'active period' | 'peak period' | 'comeback period'
  value: number
}

export type DashboardAnalytics = {
  summary: SummaryMetrics
  monthlyMessages: TimePoint[]
  yearlyMessages: TimePoint[]
  cumulativeMessages: TimePoint[]
  rolling30DayAverage: TimePoint[]
  senderMonthlyMessages: MultiSeriesPoint[]
  senderMonthlyShare: MultiSeriesPoint[]
  calendarHeatmap: CalendarDayStat[]
  weekdayCounts: Record<string, number>
  hourCounts: Record<string, number>
  weekdayHourMatrix: Array<[number, number, number]>
  mediaBreakdown: Array<{ label: string; value: number }>
  mediaByMonth: MultiSeriesPoint[]
  stickerEmojiTop: Array<{ emoji: string; count: number }>
  sessionStats: SessionStats
  sessionsPerMonth: TimePoint[]
  averageSessionLengthByMonth: TimePoint[]
  responseTimes: ResponseTimeStats
  streaks: StreakSummary
  textStats: TextStats
  eras: ActivityEra[]
  generatedSummary: string
}
