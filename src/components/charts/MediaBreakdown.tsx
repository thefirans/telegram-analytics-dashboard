import ReactECharts from 'echarts-for-react'
import type { MultiSeriesPoint, SenderStats } from '../../types'
import ChartCard from '../ChartCard'

type MediaBreakdownProps = {
  mediaBreakdown: Array<{ label: string; value: number }>
  mediaByMonth: MultiSeriesPoint[]
  perSender: SenderStats[]
  stickerEmojiTop: Array<{ emoji: string; count: number }>
  labelMap: Record<string, string>
}

const palette = ['#22d3ee', '#34d399', '#818cf8', '#f59e0b', '#f472b6', '#94a3b8']

export default function MediaBreakdown({
  mediaBreakdown,
  mediaByMonth,
  perSender,
  stickerEmojiTop,
  labelMap,
}: MediaBreakdownProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Media type breakdown" description="Photos and stickers usually dominate Telegram exports.">
        <ReactECharts
          style={{ height: 340 }}
          option={{
            tooltip: { trigger: 'item' },
            legend: { bottom: 0, textStyle: { color: '#cbd5e1' } },
            series: [
              {
                type: 'pie',
                radius: ['42%', '72%'],
                itemStyle: { borderColor: '#08111f', borderWidth: 4 },
                label: { color: '#e2e8f0' },
                data: mediaBreakdown.map((entry, index) => ({
                  name: entry.label,
                  value: entry.value,
                  itemStyle: { color: palette[index % palette.length] },
                })),
              },
            ],
          }}
        />
      </ChartCard>

      <ChartCard title="Media over time" description="Monthly media cadence by type.">
        <ReactECharts
          style={{ height: 340 }}
          option={{
            tooltip: { trigger: 'axis' },
            legend: { textStyle: { color: '#cbd5e1' } },
            grid: { left: 24, right: 12, top: 44, bottom: 40 },
            xAxis: {
              type: 'category',
              data: mediaByMonth.map((point) => point.label),
              axisLabel: { color: '#cbd5e1' },
            },
            yAxis: {
              type: 'value',
              axisLabel: { color: '#cbd5e1' },
              splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
            },
            series: Object.keys(mediaByMonth[0]?.values ?? {}).map((label, index) => ({
              name: label,
              type: 'line',
              smooth: true,
              data: mediaByMonth.map((point) => point.values[label] ?? 0),
              lineStyle: { color: palette[index % palette.length], width: 3 },
              symbol: 'none',
            })),
          }}
        />
      </ChartCard>

      <ChartCard title="Media by sender" description="Who drove photos, stickers, video, and voice activity.">
        <ReactECharts
          style={{ height: 360 }}
          option={{
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { textStyle: { color: '#cbd5e1' } },
            grid: { left: 72, right: 12, top: 44, bottom: 24 },
            xAxis: {
              type: 'value',
              axisLabel: { color: '#cbd5e1' },
              splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
            },
            yAxis: {
              type: 'category',
              data: perSender.map((sender) => labelMap[sender.sender] ?? sender.sender),
              axisLabel: { color: '#cbd5e1' },
            },
            series: [
              { name: 'Photos', type: 'bar', stack: 'media', data: perSender.map((sender) => sender.photos), itemStyle: { color: palette[0] } },
              { name: 'Stickers', type: 'bar', stack: 'media', data: perSender.map((sender) => sender.stickers), itemStyle: { color: palette[1] } },
              { name: 'Videos', type: 'bar', stack: 'media', data: perSender.map((sender) => sender.videos), itemStyle: { color: palette[2] } },
              { name: 'Voice', type: 'bar', stack: 'media', data: perSender.map((sender) => sender.voice), itemStyle: { color: palette[3] } },
            ],
          }}
        />
      </ChartCard>

      <ChartCard title="Top sticker emojis" description="Only visible when Telegram included sticker emoji metadata.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {stickerEmojiTop.length ? (
            stickerEmojiTop.map((entry) => (
              <div key={entry.emoji} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-3xl">{entry.emoji}</div>
                <div className="mt-2 text-sm font-semibold text-white">{entry.count.toLocaleString()}</div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-sm text-slate-300/75">No sticker emoji metadata was found in this export.</p>
          )}
        </div>
      </ChartCard>
    </div>
  )
}
