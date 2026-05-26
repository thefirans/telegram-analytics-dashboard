import ReactECharts from 'echarts-for-react'
import type { StreakSummary } from '../../types'
import ChartCard from '../ChartCard'

type StreaksAndGapsProps = {
  streaks: StreakSummary
}

export default function StreaksAndGaps({ streaks }: StreaksAndGapsProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Streak timeline" description="Length of the active daily streak as the chat progressed.">
        <ReactECharts
          style={{ height: 320 }}
          option={{
            tooltip: { trigger: 'axis' },
            xAxis: {
              type: 'category',
              data: streaks.streakTimeline.map((point) => point.date),
              axisLabel: { show: false, color: '#cbd5e1' },
            },
            yAxis: {
              type: 'value',
              axisLabel: { color: '#cbd5e1' },
              splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
            },
            series: [
              {
                type: 'line',
                smooth: true,
                data: streaks.streakTimeline.map((point) => point.length),
                lineStyle: { color: '#34d399', width: 3 },
                areaStyle: { color: 'rgba(52,211,153,0.16)' },
                symbol: 'none',
              },
            ],
          }}
        />
      </ChartCard>

      <ChartCard title="Longest silence gaps" description="The widest inactive windows between active days.">
        <div className="space-y-3">
          {streaks.longestGaps.map((gap) => (
            <div key={`${gap.start}-${gap.end}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-white">{gap.days} days</p>
              <p className="mt-1 text-sm text-slate-300">
                {gap.start} → {gap.end}
              </p>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Top 10 busiest days" description="Useful for spotting spikes without opening raw text.">
        <div className="space-y-3">
          {streaks.busiestDays.map((day) => (
            <div key={day.date} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-white">{day.date}</p>
              <p className="mt-1 text-sm text-slate-300">{day.count.toLocaleString()} messages</p>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Top 10 quietest months" description="Counts start after the chat begins, including zero-volume months.">
        <div className="space-y-3">
          {streaks.quietestMonths.map((month) => (
            <div key={month.month} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-white">{month.month}</p>
              <p className="mt-1 text-sm text-slate-300">{month.count.toLocaleString()} messages</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
