const EN_STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'to',
  'of',
  'in',
  'on',
  'for',
  'is',
  'it',
  'i',
  'you',
  'we',
  'he',
  'she',
  'they',
  'this',
  'that',
  'with',
  'at',
  'be',
  'are',
  'was',
  'were',
  'but',
  'so',
  'if',
  'my',
  'your',
  'me',
  'do',
  'did',
  'not',
])

const RU_STOPWORDS = new Set([
  'и',
  'в',
  'во',
  'не',
  'что',
  'он',
  'на',
  'я',
  'с',
  'со',
  'как',
  'а',
  'то',
  'все',
  'она',
  'так',
  'его',
  'но',
  'да',
  'ты',
  'к',
  'у',
  'же',
  'вы',
  'за',
  'бы',
  'по',
  'ее',
  'мне',
  'мои',
  'мой',
  'мы',
])

const UK_STOPWORDS = new Set([
  'і',
  'в',
  'у',
  'не',
  'що',
  'він',
  'на',
  'я',
  'з',
  'як',
  'а',
  'то',
  'все',
  'вона',
  'так',
  'його',
  'але',
  'ти',
  'до',
  'за',
  'по',
  'ми',
  'це',
  'мене',
  'тобі',
  'мій',
  'мої',
])

const STOPWORDS = new Set([...EN_STOPWORDS, ...RU_STOPWORDS, ...UK_STOPWORDS])

export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

export function splitWords(input: string): string[] {
  return normalizeWhitespace(input)
    .toLowerCase()
    .match(/[\p{L}\p{N}'-]+/gu)?.filter(Boolean) ?? []
}

export function countWords(input: string): number {
  return splitWords(input).length
}

export function topWords(texts: string[], limit = 12): Array<{ word: string; count: number }> {
  const counts = new Map<string, number>()

  for (const text of texts) {
    for (const word of splitWords(text)) {
      if (word.length < 2 || STOPWORDS.has(word)) {
        continue
      }
      counts.set(word, (counts.get(word) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
}

export function topEmojis(texts: string[], limit = 12): Array<{ emoji: string; count: number }> {
  const counts = new Map<string, number>()
  const regex = /\p{Extended_Pictographic}/gu

  for (const text of texts) {
    for (const match of text.match(regex) ?? []) {
      counts.set(match, (counts.get(match) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([emoji, count]) => ({ emoji, count }))
}

export function detectScriptBalance(texts: string[]): 'Cyrillic-heavy' | 'Latin-heavy' | 'Mixed' {
  let cyrillic = 0
  let latin = 0

  for (const text of texts) {
    cyrillic += (text.match(/[\p{Script=Cyrillic}]/gu) ?? []).length
    latin += (text.match(/[\p{Script=Latin}]/gu) ?? []).length
  }

  if (cyrillic > latin * 1.35) {
    return 'Cyrillic-heavy'
  }
  if (latin > cyrillic * 1.35) {
    return 'Latin-heavy'
  }
  return 'Mixed'
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

export function toCsvRow(values: Array<string | number | boolean | null | undefined>): string {
  return values
    .map((value) => {
      const normalized = String(value ?? '')
      if (/[",\n]/.test(normalized)) {
        return `"${normalized.replaceAll('"', '""')}"`
      }
      return normalized
    })
    .join(',')
}
