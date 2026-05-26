import { jsPDF } from 'jspdf'
import { toBlob, toPng } from 'html-to-image'
import type { DashboardAnalytics, NormalizedMessage } from '../types'
import { toCsvRow } from './text'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportStatsJson(analytics: DashboardAnalytics) {
  downloadBlob(
    new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' }),
    'telegram-chat-stats.json',
  )
}

export function exportMessagesCsv(messages: NormalizedMessage[]) {
  const rows = [
    toCsvRow([
      'id',
      'date',
      'timestamp',
      'sender',
      'senderId',
      'text',
      'textLength',
      'wordCount',
      'charCount',
      'hasText',
      'mediaType',
      'isPhoto',
      'isSticker',
      'isVideo',
      'isVoice',
      'isAudio',
      'isFile',
      'isForwarded',
      'isEdited',
      'replyToMessageId',
      'stickerEmoji',
    ]),
    ...messages.map((message) =>
      toCsvRow([
        message.id,
        message.date.toISOString(),
        message.timestamp,
        message.sender,
        message.senderId,
        message.text,
        message.textLength,
        message.wordCount,
        message.charCount,
        message.hasText,
        message.mediaType,
        message.isPhoto,
        message.isSticker,
        message.isVideo,
        message.isVoice,
        message.isAudio,
        message.isFile,
        message.isForwarded,
        message.isEdited,
        message.replyToMessageId,
        message.stickerEmoji,
      ]),
    ),
  ]

  downloadBlob(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }), 'telegram-normalized-messages.csv')
}

export async function exportElementPng(element: HTMLElement) {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#08111f',
  })

  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = 'telegram-dashboard.png'
  anchor.click()
}

export async function exportElementPdf(element: HTMLElement) {
  const blob = await toBlob(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#08111f',
  })
  if (!blob) return

  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [element.clientWidth, element.clientHeight],
  })
  pdf.addImage(dataUrl, 'PNG', 0, 0, element.clientWidth, element.clientHeight)
  pdf.save('telegram-dashboard.pdf')
}
