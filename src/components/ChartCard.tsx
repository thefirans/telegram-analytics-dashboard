import type { ReactNode } from 'react'

type ChartCardProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export default function ChartCard({ title, description, actions, children }: ChartCardProps) {
  return (
    <section className="glass-panel rounded-[28px] p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-[var(--font-display)] text-lg font-semibold text-white md:text-xl">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-300/80">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}
