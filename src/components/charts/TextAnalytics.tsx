import type { TextStats } from '../../types'
import ChartCard from '../ChartCard'

type TextAnalyticsProps = {
  textStats: TextStats
  labelMap: Record<string, string>
  allowSnippets: boolean
}

export default function TextAnalytics({ textStats, labelMap, allowSnippets }: TextAnalyticsProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Top words overall" description="Stopwords are filtered for English, Russian, and Ukrainian.">
        <div className="flex flex-wrap gap-2">
          {textStats.topWordsOverall.map((entry) => (
            <span key={entry.word} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-100">
              {entry.word} <span className="text-slate-400">{entry.count}</span>
            </span>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Top emojis" description="Combined emoji frequency across text and sticker captions.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {textStats.topEmojis.map((entry) => (
            <div key={entry.emoji} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-3xl">{entry.emoji}</div>
              <div className="mt-2 text-sm font-semibold text-white">{entry.count.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Top words by sender" description="Side-by-side lexical fingerprints of the participants.">
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(textStats.topWordsBySender).map(([sender, entries]) => (
            <div key={sender} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{labelMap[sender] ?? sender}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {entries.map((entry) => (
                  <span key={entry.word} className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-200">
                    {entry.word} {entry.count}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Longest messages by sender" description="Content stays hidden unless snippets are explicitly enabled.">
        <div className="space-y-3">
          {Object.entries(textStats.longestMessageBySender).map(([sender, item]) => (
            <div key={sender} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{labelMap[sender] ?? sender}</p>
              <p className="mt-1 text-sm text-slate-300">{item.length.toLocaleString()} characters</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{item.date ? new Date(item.date).toLocaleDateString() : 'No text message'}</p>
              {allowSnippets && item.text ? (
                <p className="mt-3 rounded-2xl bg-slate-950/60 p-3 text-sm leading-6 text-slate-200">{item.text.slice(0, 320)}</p>
              ) : null}
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
