import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import type { CalendarDayStat, DayMetricKey } from '../../types'
import ChartCard from '../ChartCard'

type CalendarHeatmapProps = {
  days: CalendarDayStat[]
  labelMap: Record<string, string>
}

const metricOptions: Array<{ key: DayMetricKey; label: string }> = [
  { key: 'all', label: 'All messages' },
  { key: 'text', label: 'Text messages' },
  { key: 'media', label: 'Photos / media' },
  { key: 'words', label: 'Words' },
]

function metricValue(day: CalendarDayStat, metric: DayMetricKey) {
  if (metric === 'text') return day.textMessages
  if (metric === 'media') return day.mediaMessages
  if (metric === 'words') return day.wordCount
  return day.totalMessages
}

export default function CalendarHeatmap({ days, labelMap }: CalendarHeatmapProps) {
  const [metric, setMetric] = useState<DayMetricKey>('all')
  const maxValue = Math.max(...days.map((day) => metricValue(day, metric)), 0)
  const topDays = useMemo(
    () =>
      [...days]
        .sort((a, b) => metricValue(b, metric) - metricValue(a, metric))
        .slice(0, 10),
    [days, metric],
  )

  return (
    <ChartCard
      title="Calendar heatmap"
      description="Every day in the chat, with color intensity tied to the selected metric."
      actions={
        <div className="flex flex-wrap gap-2">
          {metricOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setMetric(option.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                metric === option.key ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="overflow-x-auto">
          <div className="grid min-w-[760px] grid-flow-col grid-rows-7 gap-1">
            {days.map((day) => {
              const value = metricValue(day, metric)
              const opacity = maxValue ? 0.12 + (value / maxValue) * 0.88 : 0.08
              const senderSplit = Object.entries(day.senderSplit)
                .map(([sender, count]) => `${labelMap[sender] ?? sender}: ${count}`)
                .join(' • ')
              return (
                <div
                  key={day.key}
                  title={`${format(day.date, 'PPP')}\nMessages: ${day.totalMessages}\n${senderSplit || 'No messages'}\nMedia: ${day.mediaCount}`}
                  className="h-4 w-4 rounded-[4px]"
                  style={{
                    backgroundColor:
                      value === 0 ? 'rgba(148,163,184,0.08)' : `rgba(34,211,238,${opacity.toFixed(2)})`,
                  }}
                />
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Top 10 busiest days</p>
          {topDays.map((day) => (
            <div key={day.key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-white">{format(day.date, 'PPP')}</p>
              <p className="mt-1 text-sm text-slate-300">{metricValue(day, metric).toLocaleString()} selected metric</p>
              <p className="mt-1 text-xs text-slate-400">
                {Object.entries(day.senderSplit)
                  .map(([sender, count]) => `${labelMap[sender] ?? sender}: ${count}`)
                  .join(' • ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  )
}
