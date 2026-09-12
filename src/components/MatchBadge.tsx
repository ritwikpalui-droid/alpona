import type { MatchLabel } from '@/lib/types'

const TONE: Record<MatchLabel, string> = {
  'PERFECT MATCH': 'text-teal border-teal/35 bg-teal/8',
  'WORKS BEAUTIFULLY': 'text-gold border-gold/35 bg-gold/8',
  INTERESTING: 'text-ink-2 border-ink/18 bg-ink/4',
  UNEXPECTED: 'text-clay border-clay/30 bg-clay/6',
}

/** The compatibility label (§15). Guidance, never a lock. */
export default function MatchBadge({ label, className = '' }: { label: MatchLabel; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-[3px] text-[9px] font-medium uppercase tracking-[0.12em] ${TONE[label]} ${className}`}
    >
      {label}
    </span>
  )
}
