import ReactECharts from 'echarts-for-react'
import type { MultiSeriesPoint, SenderStats } from '../../types'
import ChartCard from '../ChartCard'

type SenderComparisonProps = {
  perSender: SenderStats[]
  senderMonthlyMessages: MultiSeriesPoint[]
  senderMonthlyShare: MultiSeriesPoint[]
  labelMap: Record<string, string>
}

const palette = ['#22d3ee', '#f59e0b', '#818cf8', '#34d399']

export default function SenderComparison({
  perSender,
  senderMonthlyMessages,
  senderMonthlyShare,
  labelMap,
}: SenderComparisonProps) {
  const senders = perSender.map((sender) => sender.sender)

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Messages by sender" description="Raw contribution split across participants.">
        <ReactECharts
          style={{ height: 320 }}
          option={{
            tooltip: { trigger: 'axis' },
            xAxis: {
              type: 'category',
              data: senders.map((sender) => labelMap[sender] ?? sender),
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
                data: perSender.map((sender) => sender.messageCount),
                itemStyle: {
                  color: (params: { dataIndex: number }) => palette[params.dataIndex % palette.length],
                  borderRadius: [8, 8, 0, 0],
                },
              },
            ],
          }}
        />
      </ChartCard>

      <ChartCard title="Words by sender" description="Useful when one person sends fewer but longer messages.">
        <ReactECharts
          style={{ height: 320 }}
          option={{
            tooltip: { trigger: 'axis' },
            xAxis: {
              type: 'category',
              data: senders.map((sender) => labelMap[sender] ?? sender),
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
                data: perSender.map((sender) => sender.wordCount),
                itemStyle: {
                  color: (params: { dataIndex: number }) => palette[(params.dataIndex + 1) % palette.length],
                  borderRadius: [8, 8, 0, 0],
                },
              },
            ],
          }}
        />
      </ChartCard>

      <ChartCard title="Monthly sender split" description="Stacked timeline of who drove each month’s volume.">
        <ReactECharts
          style={{ height: 360 }}
          option={{
            tooltip: { trigger: 'axis' },
            legend: { textStyle: { color: '#cbd5e1' } },
            grid: { left: 24, right: 12, top: 44, bottom: 40 },
            xAxis: {
              type: 'category',
              data: senderMonthlyMessages.map((point) => point.label),
              axisLabel: { color: '#cbd5e1' },
            },
            yAxis: {
              type: 'value',
              axisLabel: { color: '#cbd5e1' },
              splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
            },
            series: senders.map((sender, index) => ({
              name: labelMap[sender] ?? sender,
              type: 'bar',
              stack: 'sender',
              data: senderMonthlyMessages.map((point) => point.values[sender] ?? 0),
              itemStyle: { color: palette[index % palette.length] },
            })),
          }}
        />
      </ChartCard>

      <ChartCard title="Sender share over time" description="Relative share of messages per month.">
        <ReactECharts
          style={{ height: 360 }}
          option={{
            tooltip: { trigger: 'axis' },
            legend: { textStyle: { color: '#cbd5e1' } },
            grid: { left: 24, right: 12, top: 44, bottom: 40 },
            xAxis: {
              type: 'category',
              data: senderMonthlyShare.map((point) => point.label),
              axisLabel: { color: '#cbd5e1' },
            },
            yAxis: {
              type: 'value',
              axisLabel: { color: '#cbd5e1', formatter: '{value}%' },
              splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
            },
            series: senders.map((sender, index) => ({
              name: labelMap[sender] ?? sender,
              type: 'line',
              smooth: true,
              data: senderMonthlyShare.map((point) => Number((point.values[sender] ?? 0).toFixed(1))),
              lineStyle: { color: palette[index % palette.length], width: 3 },
              symbol: 'none',
            })),
          }}
        />
      </ChartCard>
    </div>
  )
}
