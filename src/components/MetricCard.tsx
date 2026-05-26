type MetricCardProps = {
  label: string
  value: string
  tone?: 'default' | 'accent'
  sublabel?: string
}

export default function MetricCard({ label, value, tone = 'default', sublabel }: MetricCardProps) {
  return (
    <article
      className={`glass-panel rounded-3xl p-4 md:p-5 ${
        tone === 'accent' ? 'bg-cyan-400/10 ring-1 ring-cyan-300/20' : ''
      }`}
    >
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {value}
      </p>
      {sublabel ? <p className="mt-2 text-sm text-slate-300/80">{sublabel}</p> : null}
    </article>
  )
}
