import { useRef, useState } from 'react'
import { formatBytes } from '../utils/text'

type FileUploadProps = {
  isLoading: boolean
  progressLabel: string
  currentFile?: { name: string; size: number }
  error?: string | null
  onFileSelected: (file: File) => void
}

export default function FileUpload({
  isLoading,
  progressLabel,
  currentFile,
  error,
  onFileSelected,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-16">
      <div className="glass-panel overflow-hidden rounded-[36px]">
        <div className="grid gap-8 bg-[linear-gradient(135deg,rgba(15,23,42,0.35),rgba(16,185,129,0.06))] p-6 md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-200">
              Local-Only Dashboard
            </p>
            <h1 className="max-w-xl font-[var(--font-display)] text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Telegram chat analytics for screenshots, not servers.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300/90 md:text-lg">
              Upload a Telegram Desktop <code className="rounded bg-white/10 px-1.5 py-0.5">result.json</code> file,
              parse everything in the browser, and get a long-form data story without uploading a single message.
            </p>
            <p className="mt-4 text-sm font-medium text-emerald-200">
              Your file stays in your browser. Nothing is uploaded.
            </p>
          </div>

          <div
            className={`rounded-[28px] border border-dashed p-5 transition ${
              isDragging
                ? 'border-cyan-300 bg-cyan-300/10'
                : 'border-white/15 bg-slate-950/40'
            }`}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              const file = event.dataTransfer.files?.[0]
              if (file) onFileSelected(file)
            }}
          >
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Upload</p>
            <p className="mt-3 text-2xl font-semibold text-white">Drop `result.json` here</p>
            <p className="mt-2 text-sm text-slate-300/80">Handles Telegram Desktop exports entirely client-side.</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                disabled={isLoading}
              >
                Choose JSON file
              </button>
              {currentFile ? (
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                  {currentFile.name} • {formatBytes(currentFile.size)}
                </div>
              ) : null}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onFileSelected(file)
              }}
            />

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
              <p className="mt-2 text-sm text-slate-200">{isLoading ? progressLabel : 'Waiting for a Telegram export file.'}</p>
              {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
