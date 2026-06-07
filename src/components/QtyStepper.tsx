import { Minus, Plus } from 'lucide-react'
import { formatQty } from '../lib/shopping'

interface Props {
  value: number
  onChange: (v: number) => void
  step?: number
  suffix?: string
  compact?: boolean
}

export function QtyStepper({ value, onChange, step = 1, suffix, compact }: Props) {
  const dec = () => onChange(Math.max(0, Math.round((value - step) * 100) / 100))
  const inc = () => onChange(Math.round((value + step) * 100) / 100)
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-line bg-card ${
        compact ? 'p-0.5' : 'p-1'
      }`}
    >
      <button
        type="button"
        onClick={dec}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-paper hover:text-tomato active:scale-90"
        aria-label="Diminuer"
      >
        <Minus size={15} />
      </button>
      <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums">
        {formatQty(value)}
        {suffix && <span className="ml-0.5 text-xs font-medium text-muted">{suffix}</span>}
      </span>
      <button
        type="button"
        onClick={inc}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-paper hover:text-herb active:scale-90"
        aria-label="Augmenter"
      >
        <Plus size={15} />
      </button>
    </div>
  )
}
