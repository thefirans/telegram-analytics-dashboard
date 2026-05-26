import ReactECharts from 'echarts-for-react'
import type { TimePoint } from '../../types'
import ChartCard from '../ChartCard'

type MonthlyTimelineProps = {
  monthlyMessages: TimePoint[]
  yearlyMessages: TimePoint[]
  cumulativeMessages: TimePoint[]
  rolling30DayAverage: TimePoint[]
}

const baseAxis = {
  axisLine: { lineStyle: { color: 'rgba(148,163,184,0.35)' } },
  axisLabel: { color: '#cbd5e1' },
  splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
}

export default function MonthlyTimeline({
  monthlyMessages,
  yearlyMessages,
  cumulativeMessages,
  rolling30DayAverage,
}: MonthlyTimelineProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Messages per month" description="The long arc of the chat, month by month.">
        <ReactECharts
          style={{ height: 320 }}
          option={{
            grid: { left: 24, right: 12, top: 20, bottom: 40 },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: monthlyMessages.map((point) => point.label), ...baseAxis },
            yAxis: { type: 'value', ...baseAxis },
            series: [
              {
                type: 'bar',
                data: monthlyMessages.map((point) => point.value),
                itemStyle: { color: '#22d3ee', borderRadius: [8, 8, 0, 0] },
              },
            ],
          }}
        />
      </ChartCard>

      <ChartCard title="Messages per year" description="Big seasonal swings are easier to read at yearly resolution.">
        <ReactECharts
          style={{ height: 320 }}
          option={{
            grid: { left: 24, right: 12, top: 20, bottom: 40 },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: yearlyMessages.map((point) => point.label), ...baseAxis },
            yAxis: { type: 'value', ...baseAxis },
            series: [
              {
                type: 'bar',
                data: yearlyMessages.map((point) => point.value),
                itemStyle: { color: '#34d399', borderRadius: [8, 8, 0, 0] },
              },
            ],
          }}
        />
      </ChartCard>

      <ChartCard title="Cumulative messages" description="Total conversation volume since the first recorded message.">
        <ReactECharts
          style={{ height: 320 }}
          option={{
            grid: { left: 24, right: 12, top: 20, bottom: 40 },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: cumulativeMessages.map((point) => point.label), ...baseAxis },
            yAxis: { type: 'value', ...baseAxis },
            series: [
              {
                type: 'line',
                smooth: true,
                data: cumulativeMessages.map((point) => point.value),
                lineStyle: { color: '#818cf8', width: 3 },
                areaStyle: { color: 'rgba(129,140,248,0.18)' },
                symbol: 'none',
              },
            ],
          }}
        />
      </ChartCard>

      <ChartCard title="Rolling 30-day average" description="Short-term activity smoothed across the last 30 days.">
        <ReactECharts
          style={{ height: 320 }}
          option={{
            grid: { left: 24, right: 12, top: 20, bottom: 40 },
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: rolling30DayAverage.map((point) => point.label), ...baseAxis, axisLabel: { show: false } },
            yAxis: { type: 'value', ...baseAxis },
            series: [
              {
                type: 'line',
                smooth: true,
                data: rolling30DayAverage.map((point) => Number(point.value.toFixed(2))),
                lineStyle: { color: '#f59e0b', width: 3 },
                areaStyle: { color: 'rgba(245,158,11,0.16)' },
                symbol: 'none',
              },
            ],
          }}
        />
      </ChartCard>
    </div>
  )
}
