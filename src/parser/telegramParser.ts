import { parseTelegramDate } from '../utils/date'
import { countWords, normalizeWhitespace } from '../utils/text'
import type { NormalizedMessage, ParsedTelegramChat, TelegramExport, TelegramTextEntity } from '../types'

function entityTextToString(entity: TelegramTextEntity): string {
  if (typeof entity === 'string') {
    return entity
  }
  return entity?.text ?? ''
}

export function extractTelegramText(input: unknown): string {
  if (typeof input === 'string') {
    return normalizeWhitespace(input)
  }

  if (Array.isArray(input)) {
    return normalizeWhitespace(input.map(entityTextToString).join(''))
  }

  return ''
}

function detectMedia(message: Record<string, unknown>) {
  const mediaType = typeof message.media_type === 'string' ? message.media_type : null
  const mimeType = typeof message.mime_type === 'string' ? message.mime_type : ''
  const fileName = typeof message.file_name === 'string' ? message.file_name.toLowerCase() : ''
  const hasPhoto = typeof message.photo === 'string' && message.photo.length > 0
  const hasFile = typeof message.file === 'string' && message.file.length > 0

  const isSticker =
    mediaType === 'sticker' || Boolean(message.sticker_emoji) || fileName.endsWith('.webp')
  const isPhoto = mediaType === 'photo' || hasPhoto
  const isVoice = mediaType === 'voice_message'
  const isVideo = mediaType === 'video_file' || mimeType.startsWith('video/')
  const isAudio = mediaType === 'audio_file' || mimeType.startsWith('audio/')
  const isFile = hasFile || mediaType === 'file'

  return {
    mediaType: mediaType ?? (isPhoto ? 'photo' : isSticker ? 'sticker' : isVideo ? 'video_file' : isVoice ? 'voice_message' : isAudio ? 'audio_file' : isFile ? 'file' : null),
    isPhoto,
    isSticker,
    isVideo,
    isVoice,
    isAudio,
    isFile,
  }
}

export function normalizeTelegramMessage(message: Record<string, unknown>): NormalizedMessage | null {
  if (!message || message.type !== 'message') {
    return null
  }

  const date = parseTelegramDate(
    typeof message.date === 'string' ? message.date : undefined,
    typeof message.date_unixtime === 'string' || typeof message.date_unixtime === 'number'
      ? message.date_unixtime
      : undefined,
  )

  if (!date) {
    return null
  }

  const text = extractTelegramText(message.text)
  const media = detectMedia(message)
  const sender = typeof message.from === 'string' && message.from.trim() ? message.from : 'Unknown'

  return {
    id: typeof message.id === 'number' || typeof message.id === 'string' ? message.id : date.getTime(),
    date,
    timestamp: date.getTime(),
    sender,
    senderId: typeof message.from_id === 'string' ? message.from_id : undefined,
    text,
    textLength: text.length,
    wordCount: countWords(text),
    charCount: [...text].length,
    hasText: text.length > 0,
    mediaType: media.mediaType,
    isPhoto: media.isPhoto,
    isSticker: media.isSticker,
    isVideo: media.isVideo,
    isVoice: media.isVoice,
    isAudio: media.isAudio,
    isFile: media.isFile,
    isForwarded: Boolean(message.forwarded_from),
    isEdited: Boolean(message.edited),
    replyToMessageId:
      typeof message.reply_to_message_id === 'number' || typeof message.reply_to_message_id === 'string'
        ? message.reply_to_message_id
        : undefined,
    stickerEmoji: typeof message.sticker_emoji === 'string' ? message.sticker_emoji : undefined,
  }
}

export function parseTelegramExport(raw: unknown): ParsedTelegramChat {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Unsupported format. Expected a Telegram export JSON object.')
  }

  const exportData = raw as TelegramExport
  if (!Array.isArray(exportData.messages)) {
    throw new Error('Unsupported format. Telegram export must include a messages array.')
  }

  const messages = exportData.messages
    .map((message) => normalizeTelegramMessage(message as Record<string, unknown>))
    .filter((message): message is NormalizedMessage => Boolean(message))
    .sort((a, b) => a.timestamp - b.timestamp)

  if (messages.length === 0) {
    throw new Error('No valid messages found in this export.')
  }

  const participants = [...new Set(messages.map((message) => message.sender))]
  const senderIds = Object.fromEntries(
    participants.map((sender) => [
      sender,
      messages.find((message) => message.sender === sender)?.senderId,
    ]),
  )

  return {
    chatName: typeof exportData.name === 'string' && exportData.name.trim() ? exportData.name : 'Telegram Chat',
    chatType: typeof exportData.type === 'string' ? exportData.type : 'chat',
    chatId: exportData.id,
    participants,
    senderIds,
    messages,
  }
}
