import ReactECharts from 'echarts-for-react'
import { formatDistanceStrict } from 'date-fns'
import type { ResponseTimeStats } from '../../types'
import ChartCard from '../ChartCard'

type ResponseTimeChartProps = {
  responseTimes: ResponseTimeStats
  labelMap: Record<string, string>
}

function bucketMs(ms: number): string {
  const minutes = ms / 60000
  if (minutes < 1) return '<1m'
  if (minutes < 5) return '1-5m'
  if (minutes < 15) return '5-15m'
  if (minutes < 60) return '15-60m'
  if (minutes < 240) return '1-4h'
  return '4h+'
}

export default function ResponseTimeChart({ responseTimes, labelMap }: ResponseTimeChartProps) {
  const buckets = ['<1m', '1-5m', '5-15m', '15-60m', '1-4h', '4h+']
  const counts = Object.fromEntries(buckets.map((bucket) => [bucket, 0]))
  responseTimes.quickSamples.forEach((sample) => {
    counts[bucketMs(sample.responseTimeMs)] += 1
  })

  const fastest = [...responseTimes.quickSamples]
    .sort((a, b) => a.responseTimeMs - b.responseTimeMs)
    .slice(0, 8)

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Quick response stats" description="Only sender switches are counted. Quick-reply stats ignore gaps above 24 hours.">
        <div className="grid gap-3 md:grid-cols-2">
          {responseTimes.bySender.map((stat) => (
            <div key={stat.sender} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{labelMap[stat.sender] ?? stat.sender}</p>
              <p className="mt-3 text-sm text-slate-300">Median: {formatDistanceStrict(0, stat.medianMs)}</p>
              <p className="mt-1 text-sm text-slate-300">Average: {formatDistanceStrict(0, stat.averageMs)}</p>
              <p className="mt-1 text-sm text-slate-300">75th percentile: {formatDistanceStrict(0, stat.p75Ms)}</p>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Response time distribution" description="How often replies land immediately versus after a longer pause.">
        <ReactECharts
          style={{ height: 320 }}
          option={{
            tooltip: { trigger: 'axis' },
            xAxis: {
              type: 'category',
              data: buckets,
              axisLabel: { color: '#cbd5e1' },
            },
            yAxis: {
              type: 'value',
              axisLabel: { color: '#cbd5e1' },
              splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
            },
            series: [
              {
                type: 'bar',
                data: buckets.map((bucket) => counts[bucket]),
                itemStyle: { color: '#38bdf8', borderRadius: [8, 8, 0, 0] },
              },
            ],
          }}
        />
      </ChartCard>

      <ChartCard title="Fastest reply examples" description="Dates only, no message text shown.">
        <div className="space-y-3">
          {fastest.map((sample, index) => (
            <div key={`${sample.timestamp}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-white">{labelMap[sample.sender] ?? sample.sender}</p>
              <p className="mt-1 text-sm text-slate-300">{sample.date.toLocaleString()}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-200">
                {formatDistanceStrict(0, sample.responseTimeMs)}
              </p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
