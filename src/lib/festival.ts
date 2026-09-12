/**
 * Seasonal framing (§50). Every date is configurable through environment
 * variables so the countdown can be corrected without a code change.
 * Defaults are the 2026 Puja dates — confirm against the panjika before launch.
 */

function date(env: string | undefined, fallback: string): number {
  const t = Date.parse(env ?? fallback)
  return Number.isNaN(t) ? Date.parse(fallback) : t
}

export const FESTIVAL = {
  year: 2026,
  name: 'Puja World 2026',
  /** Creation and voting open. */
  opensAt: date(process.env.NEXT_PUBLIC_PUJA_OPENS, '2026-10-10T00:00:00+05:30'),
  /** The "final days to vote" push begins. */
  finalDaysAt: date(process.env.NEXT_PUBLIC_PUJA_FINAL_DAYS, '2026-10-18T00:00:00+05:30'),
  /** Voting closes. */
  closesAt: date(process.env.NEXT_PUBLIC_PUJA_CLOSES, '2026-10-20T23:59:00+05:30'),
} as const

export type Phase = 'before' | 'open' | 'final' | 'closed'

export function phase(now = Date.now()): Phase {
  if (now < FESTIVAL.opensAt) return 'before'
  if (now < FESTIVAL.finalDaysAt) return 'open'
  if (now < FESTIVAL.closesAt) return 'final'
  return 'closed'
}

export function phaseLine(now = Date.now()): string {
  switch (phase(now)) {
    case 'before': return 'The festival is coming'
    case 'open': return 'The festival has begun'
    case 'final': return 'Final days to vote'
    case 'closed': return 'Voting has closed'
  }
}

export function countdownTo(now = Date.now()): { label: string; target: number } | null {
  const p = phase(now)
  if (p === 'before') return { label: 'Opens in', target: FESTIVAL.opensAt }
  if (p === 'open' || p === 'final') return { label: 'Voting closes in', target: FESTIVAL.closesAt }
  return null
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return '—'
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
