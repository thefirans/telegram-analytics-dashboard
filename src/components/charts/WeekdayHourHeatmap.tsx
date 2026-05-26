import ReactECharts from 'echarts-for-react'
import { useMemo, useState } from 'react'
import { getWeekdayHourBreakdown } from '../../analytics/timeSeries'
import type { NormalizedMessage } from '../../types'
import ChartCard from '../ChartCard'

type WeekdayHourHeatmapProps = {
  messages: NormalizedMessage[]
  labelMap: Record<string, string>
}

export default function WeekdayHourHeatmap({ messages, labelMap }: WeekdayHourHeatmapProps) {
  const senders = useMemo(() => ['all', ...new Set(messages.map((message) => message.sender))], [messages])
  const [senderFilter, setSenderFilter] = useState<string>('all')
  const { weekdayCounts, hourCounts, weekdayHourMatrix } = useMemo(
    () => getWeekdayHourBreakdown(messages, senderFilter as string | 'all'),
    [messages, senderFilter],
  )
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard
        title="Weekday and hour behavior"
        description="When this chat tends to wake up, separate by participant if needed."
        actions={
          <select
            value={senderFilter}
            onChange={(event) => setSenderFilter(event.target.value)}
            className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none"
          >
            {senders.map((sender) => (
              <option key={sender} value={sender}>
                {sender === 'all' ? 'All senders' : labelMap[sender] ?? sender}
              </option>
            ))}
          </select>
        }
      >
        <ReactECharts
          style={{ height: 360 }}
          option={{
            tooltip: { trigger: 'axis' },
            grid: { left: 24, right: 12, top: 20, bottom: 40 },
            xAxis: {
              type: 'category',
              data: Object.keys(weekdayCounts),
              axisLabel: { color: '#cbd5e1' },
              axisLine: { lineStyle: { color: 'rgba(148,163,184,0.35)' } },
            },
            yAxis: {
              type: 'value',
              axisLabel: { color: '#cbd5e1' },
              axisLine: { lineStyle: { color: 'rgba(148,163,184,0.35)' } },
              splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
            },
            series: [
              {
                type: 'bar',
                data: Object.values(weekdayCounts),
                itemStyle: { color: '#38bdf8', borderRadius: [8, 8, 0, 0] },
              },
            ],
          }}
        />
        <ReactECharts
          style={{ height: 280 }}
          option={{
            tooltip: { trigger: 'axis' },
            grid: { left: 24, right: 12, top: 20, bottom: 40 },
            xAxis: {
              type: 'category',
              data: Object.keys(hourCounts),
              axisLabel: { color: '#cbd5e1' },
              axisLine: { lineStyle: { color: 'rgba(148,163,184,0.35)' } },
            },
            yAxis: {
              type: 'value',
              axisLabel: { color: '#cbd5e1' },
              axisLine: { lineStyle: { color: 'rgba(148,163,184,0.35)' } },
              splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
            },
            series: [
              {
                type: 'line',
                smooth: true,
                data: Object.values(hourCounts),
                lineStyle: { color: '#f472b6', width: 3 },
                areaStyle: { color: 'rgba(244,114,182,0.16)' },
                symbol: 'none',
              },
            ],
          }}
        />
      </ChartCard>

      <ChartCard title="Weekday × hour heatmap" description="Dense zones reveal habitual windows of activity.">
        <ReactECharts
          style={{ height: 680 }}
          option={{
            tooltip: {
              formatter: (params: { value: [number, number, number] }) =>
                `${weekdays[params.value[1]]} ${String(params.value[0]).padStart(2, '0')}:00<br/>${params.value[2]} messages`,
            },
            grid: { left: 48, right: 12, top: 20, bottom: 24 },
            xAxis: {
              type: 'category',
              data: Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0')),
              splitArea: { show: true },
              axisLabel: { color: '#cbd5e1' },
            },
            yAxis: {
              type: 'category',
              data: weekdays,
              splitArea: { show: true },
              axisLabel: { color: '#cbd5e1' },
            },
            visualMap: {
              min: 0,
              max: Math.max(...weekdayHourMatrix.map((entry) => entry[2]), 1),
              calculable: false,
              orient: 'horizontal',
              left: 'center',
              bottom: 0,
              inRange: { color: ['#0f172a', '#155e75', '#0891b2', '#67e8f9'] },
              textStyle: { color: '#cbd5e1' },
            },
            series: [
              {
                type: 'heatmap',
                data: weekdayHourMatrix,
                label: { show: false },
              },
            ],
          }}
        />
      </ChartCard>
    </div>
  )
}
