'use client'

import { useState } from 'react'
import { castUnvote, castVote } from '@/lib/client/api'

/**
 * Voting (§22): one tap, optimistic, no login wall. Tapping again un-votes —
 * a heart that only ever fills and never empties reads as broken, not as a
 * feature, and this is still one shared rate-limit bucket either direction
 * so toggling back and forth isn't a spam vector.
 */
export default function VoteButton({
  id, votes, voted, size = 'md', onVoted,
}: {
  id: string
  votes: number
  voted: boolean
  size?: 'sm' | 'md'
  onVoted?: (result: { votes: number; rank: number | null; gap: { places: number; votes: number } | null }) => void
}) {
  const [count, setCount] = useState(votes)
  const [has, setHas] = useState(voted)
  const [busy, setBusy] = useState(false)
  const [justVoted, setJustVoted] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    const wasVoted = has
    setBusy(true)
    setHas(!wasVoted)
    setCount(c => c + (wasVoted ? -1 : 1))
    if (!wasVoted) {
      setJustVoted(true)
      setTimeout(() => setJustVoted(false), 500)
    }
    try {
      const res = wasVoted ? await castUnvote(id) : await castVote(id)
      setCount(res.votes)
      // `counted: false` just means the server already agreed with the
      // direction we're toggling to (e.g. a duplicate tap) — not a failure —
      // so the optimistic `has` set above already matches. Nothing to redo.
      onVoted?.({ votes: res.votes, rank: res.rank, gap: res.gap })
    } catch {
      // Roll back the optimistic change; a real anonymous voter rarely gets
      // rejected, and leaving the button in the wrong state reads as broken.
      setHas(wasVoted)
      setCount(votes)
    } finally {
      setBusy(false)
    }
  }

  const dims = size === 'sm' ? 'h-8 px-2.5 text-[12px]' : 'h-11 px-4 text-[13.5px]'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={has}
      aria-label={has ? `${count} votes — tap to remove your vote` : `Vote for this Alpona, ${count} votes so far`}
      className={[
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium transition-all duration-300',
        dims,
        has
          ? 'border-vermilion/25 bg-vermilion/10 text-vermilion'
          : 'border-ink/14 bg-paper/80 text-ink-2 hover:border-ink/30 hover:text-ink active:scale-95',
      ].join(' ')}
    >
      <span className={justVoted ? 'inline-block animate-[heartbeat_0.5s_ease]' : 'inline-block'} aria-hidden>
        {has ? '❤️' : '🤍'}
      </span>
      <span className="tabular-nums">{count.toLocaleString('en-IN')}</span>
    </button>
  )
}
