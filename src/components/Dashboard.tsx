import { formatDistanceStrict } from 'date-fns'
import { startTransition, useMemo, useRef, useState } from 'react'
import { computeDashboardAnalytics } from '../analytics'
import { parseTelegramExport } from '../parser/telegramParser'
import type { ParsedTelegramChat } from '../types'
import { exportElementPdf, exportElementPng, exportMessagesCsv, exportStatsJson } from '../utils/export'
import FileUpload from './FileUpload'
import ChartCard from './ChartCard'
import MetricCard from './MetricCard'
import CalendarHeatmap from './charts/CalendarHeatmap'
import MediaBreakdown from './charts/MediaBreakdown'
import MonthlyTimeline from './charts/MonthlyTimeline'
import ResponseTimeChart from './charts/ResponseTimeChart'
import SenderComparison from './charts/SenderComparison'
import StreaksAndGaps from './charts/StreaksAndGaps'
import TextAnalytics from './charts/TextAnalytics'
import WeekdayHourHeatmap from './charts/WeekdayHourHeatmap'
import ReactECharts from 'echarts-for-react'

const formatNumber = (value: number, digits = 0) =>
  Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value)

export default function Dashboard() {
  const [chat, setChat] = useState<ParsedTelegramChat | null>(null)
  const [currentFile, setCurrentFile] = useState<{ name: string; size: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progressLabel, setProgressLabel] = useState('Waiting for a Telegram export file.')
  const [error, setError] = useState<string | null>(null)
  const [allowSnippets, setAllowSnippets] = useState(false)
  const [anonymize, setAnonymize] = useState(false)
  const [showRawTextWarning, setShowRawTextWarning] = useState(false)
  const dashboardRef = useRef<HTMLDivElement | null>(null)

  const analytics = useMemo(() => (chat ? computeDashboardAnalytics(chat.messages) : null), [chat])

  const labelMap = useMemo(() => {
    if (!chat) return {}
    return Object.fromEntries(
      chat.participants.map((participant, index) => [
        participant,
        anonymize ? `Person ${String.fromCharCode(65 + index)}` : participant,
      ]),
    )
  }, [chat, anonymize])

  async function handleFileSelected(file: File) {
    setError(null)
    setIsLoading(true)
    setCurrentFile({ name: file.name, size: file.size })
    setProgressLabel('Reading file from disk...')

    try {
      const text = await file.text()
      setProgressLabel('Parsing JSON...')
      await Promise.resolve()

      let raw: unknown
      try {
        raw = JSON.parse(text)
      } catch {
        throw new Error('This file is not valid JSON.')
      }

      setProgressLabel('Normalizing Telegram messages...')
      await Promise.resolve()
      const parsed = parseTelegramExport(raw)

      startTransition(() => {
        setChat(parsed)
      })
      setProgressLabel(`Loaded ${parsed.messages.length.toLocaleString()} messages.`)
    } catch (caught) {
      setChat(null)
      setError(caught instanceof Error ? caught.message : 'Unsupported format.')
      setProgressLabel('Upload failed.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!chat || !analytics) {
    return (
      <main className="min-h-screen">
        <FileUpload
          isLoading={isLoading}
          progressLabel={progressLabel}
          error={error}
          currentFile={currentFile ?? undefined}
          onFileSelected={handleFileSelected}
        />
      </main>
    )
  }

  const displayChatName = anonymize ? 'Telegram Chat' : chat.chatName

  return (
    <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div ref={dashboardRef} className="mx-auto max-w-[1500px] space-y-8" id="dashboard-root">
        <section className="glass-panel overflow-hidden rounded-[36px] p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">Telegram chat dashboard</p>
              <h1 className="mt-3 font-[var(--font-display)] text-4xl font-semibold tracking-tight text-white md:text-6xl">
                {displayChatName}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300/90 md:text-lg">
                {analytics.generatedSummary}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                  {analytics.summary.dateRange.start.toLocaleDateString()} → {analytics.summary.dateRange.end.toLocaleDateString()}
                </span>
                {currentFile ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                    {currentFile.name} • {(currentFile.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                ) : null}
                <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
                  Your file stays in your browser. Nothing is uploaded.
                </span>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Privacy controls</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setAnonymize((value) => !value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      anonymize ? 'bg-cyan-300 text-slate-950' : 'bg-white/10 text-slate-100'
                    }`}
                  >
                    {anonymize ? 'Anonymize on' : 'Anonymize off'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!allowSnippets && !showRawTextWarning) {
                        setShowRawTextWarning(true)
                        return
                      }
                      setAllowSnippets((value) => !value)
                      setShowRawTextWarning(false)
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      allowSnippets ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-slate-100'
                    }`}
                  >
                    {allowSnippets ? 'Hide snippets' : 'Allow message snippets'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChat(null)
                      setCurrentFile(null)
                    }}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
                  >
                    Upload another file
                  </button>
                </div>
                {showRawTextWarning ? (
                  <p className="mt-3 text-sm text-amber-200">
                    Warning: enabling snippets will reveal raw message text in the dashboard. Click the toggle again to confirm.
                  </p>
                ) : null}
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Export</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => dashboardRef.current && exportElementPng(dashboardRef.current)}
                    className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
                  >
                    Export PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => dashboardRef.current && exportElementPdf(dashboardRef.current)}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
                  >
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => exportStatsJson(analytics)}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
                  >
                    Export stats JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => exportMessagesCsv(chat.messages)}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-slate-100"
                  >
                    Export normalized CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="section-title">Summary</h2>
            <p className="section-copy mt-2">High-level chat stats, media volume, active days, and participant split.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total messages" value={formatNumber(analytics.summary.totalMessages)} tone="accent" />
            <MetricCard label="Active days" value={formatNumber(analytics.summary.totalActiveDays)} sublabel={`${formatNumber(analytics.summary.activeDayPercentage, 1)}% of calendar span`} />
            <MetricCard label="Calendar span" value={`${formatNumber(analytics.summary.totalCalendarDays)} days`} />
            <MetricCard label="Participants" value={String(chat.participants.length)} sublabel={chat.participants.map((participant) => labelMap[participant] ?? participant).join(' • ')} />
            <MetricCard label="Avg / active day" value={formatNumber(analytics.summary.avgMessagesPerActiveDay, 1)} />
            <MetricCard label="Avg / calendar day" value={formatNumber(analytics.summary.avgMessagesPerCalendarDay, 1)} />
            <MetricCard label="Photos" value={formatNumber(analytics.summary.totalPhotos)} />
            <MetricCard label="Stickers" value={formatNumber(analytics.summary.totalStickers)} />
            <MetricCard label="Videos" value={formatNumber(analytics.summary.totalVideos)} />
            <MetricCard label="Voice messages" value={formatNumber(analytics.summary.totalVoiceMessages)} />
            <MetricCard label="Edited" value={formatNumber(analytics.summary.totalEditedMessages)} />
            <MetricCard label="Forwarded" value={formatNumber(analytics.summary.totalForwardedMessages)} />
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="section-title">Friendship timeline</h2>
            <p className="section-copy mt-2">Monthly, yearly, cumulative, and smoothed activity trends.</p>
          </div>
          <MonthlyTimeline
            monthlyMessages={analytics.monthlyMessages}
            yearlyMessages={analytics.yearlyMessages}
            cumulativeMessages={analytics.cumulativeMessages}
            rolling30DayAverage={analytics.rolling30DayAverage}
          />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="section-title">Sender comparison</h2>
            <p className="section-copy mt-2">Who sent more, who wrote more, and how the split changed over time.</p>
          </div>
          <SenderComparison
            perSender={analytics.summary.perSender}
            senderMonthlyMessages={analytics.senderMonthlyMessages}
            senderMonthlyShare={analytics.senderMonthlyShare}
            labelMap={labelMap}
          />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="section-title">Calendar heatmap</h2>
            <p className="section-copy mt-2">A GitHub-style view of every day in the chat.</p>
          </div>
          <CalendarHeatmap days={analytics.calendarHeatmap} labelMap={labelMap} />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="section-title">Weekday and hour behavior</h2>
            <p className="section-copy mt-2">Weekly rhythm, nightly peaks, and dense windows of activity.</p>
          </div>
          <WeekdayHourHeatmap messages={chat.messages} labelMap={labelMap} />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="section-title">Media analysis</h2>
            <p className="section-copy mt-2">Photos, stickers, video, voice, and the most-used sticker emojis.</p>
          </div>
          <MediaBreakdown
            mediaBreakdown={analytics.mediaBreakdown}
            mediaByMonth={analytics.mediaByMonth}
            perSender={analytics.summary.perSender}
            stickerEmojiTop={analytics.stickerEmojiTop}
            labelMap={labelMap}
          />
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="section-title">Conversation rhythm</h2>
            <p className="section-copy mt-2">Sessions start when the silence between two messages exceeds 30 minutes.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Sessions" value={formatNumber(analytics.sessionStats.totalSessions)} />
            <MetricCard label="Avg msgs / session" value={formatNumber(analytics.sessionStats.avgMessagesPerSession, 1)} />
            <MetricCard label="Median session" value={formatDistanceStrict(0, analytics.sessionStats.medianSessionLengthMs || 0)} />
            <MetricCard
              label="Longest session"
              value={analytics.sessionStats.longestSessionByDuration ? formatDistanceStrict(0, analytics.sessionStats.longestSessionByDuration.durationMs) : '0m'}
              sublabel={analytics.sessionStats.longestSessionByDuration ? `${analytics.sessionStats.longestSessionByDuration.messageCount} messages` : undefined}
            />
            <MetricCard
              label="Biggest session"
              value={formatNumber(analytics.sessionStats.biggestSessionByMessages?.messageCount ?? 0)}
              sublabel={analytics.sessionStats.biggestSessionByMessages ? formatDistanceStrict(0, analytics.sessionStats.biggestSessionByMessages.durationMs) : undefined}
            />
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard title="Sessions per month" description="How often the chat broke into distinct bursts.">
              <ReactECharts
                style={{ height: 320 }}
                option={{
                  tooltip: { trigger: 'axis' },
                  xAxis: { type: 'category', data: analytics.sessionsPerMonth.map((point) => point.label), axisLabel: { color: '#cbd5e1' } },
                  yAxis: { type: 'value', axisLabel: { color: '#cbd5e1' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } } },
                  series: [{ type: 'bar', data: analytics.sessionsPerMonth.map((point) => point.value), itemStyle: { color: '#2dd4bf', borderRadius: [8, 8, 0, 0] } }],
                }}
              />
            </ChartCard>
            <ChartCard title="Average session length over time" description="Monthly mean session duration in minutes.">
              <ReactECharts
                style={{ height: 320 }}
                option={{
                  tooltip: { trigger: 'axis' },
                  xAxis: { type: 'category', data: analytics.averageSessionLengthByMonth.map((point) => point.label), axisLabel: { color: '#cbd5e1' } },
                  yAxis: { type: 'value', axisLabel: { color: '#cbd5e1' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } } },
                  series: [{ type: 'line', smooth: true, data: analytics.averageSessionLengthByMonth.map((point) => Number(point.value.toFixed(1))), lineStyle: { color: '#f59e0b', width: 3 }, areaStyle: { color: 'rgba(245,158,11,0.16)' }, symbol: 'none' }],
                }}
              />
            </ChartCard>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="section-title">Response times</h2>
            <p className="section-copy mt-2">Approximate turn-taking speed between the two participants.</p>
          </div>
          <ResponseTimeChart responseTimes={analytics.responseTimes} labelMap={labelMap} />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="section-title">Streaks and gaps</h2>
            <p className="section-copy mt-2">Longest daily runs, major pauses, and extreme months.</p>
          </div>
          <StreaksAndGaps streaks={analytics.streaks} />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="section-title">Text analytics</h2>
            <p className="section-copy mt-2">
              Privacy-safe text stats by default, with raw snippets hidden unless explicitly enabled.
            </p>
          </div>
          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Total words" value={formatNumber(analytics.textStats.totalWords)} />
            <MetricCard label="Avg words / message" value={formatNumber(analytics.textStats.avgWordsPerMessage, 1)} />
            <MetricCard label="Question marks" value={formatNumber(analytics.textStats.questionMarks)} />
            <MetricCard label="Exclamation marks" value={formatNumber(analytics.textStats.exclamationMarks)} />
            <MetricCard label="Script estimate" value={analytics.textStats.scriptEstimate} />
          </div>
          <TextAnalytics textStats={analytics.textStats} labelMap={labelMap} allowSnippets={allowSnippets} />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="section-title">Friendship eras</h2>
            <p className="section-copy mt-2">Activity-labeled periods derived from monthly quantiles and rebound detection.</p>
          </div>
          <ChartCard title="Activity eras" description="Activity labels stay descriptive, not emotional.">
            <div className="flex flex-wrap gap-3">
              {analytics.eras.map((era) => (
                <div
                  key={era.month}
                  className={`rounded-full px-4 py-2 text-sm ${
                    era.label === 'peak period'
                      ? 'bg-fuchsia-400/20 text-fuchsia-100'
                      : era.label === 'comeback period'
                        ? 'bg-amber-300/20 text-amber-100'
                        : era.label === 'quiet period'
                          ? 'bg-slate-600/30 text-slate-200'
                          : 'bg-cyan-300/15 text-cyan-100'
                  }`}
                >
                  {era.month} • {era.label} • {era.value.toLocaleString()}
                </div>
              ))}
            </div>
          </ChartCard>
        </section>
      </div>
    </main>
  )
}
