'use client'

import { useState } from 'react'
import { castVote } from '@/lib/client/api'

/**
 * Voting (§22): one tap, optimistic, no login wall. The server is the source
 * of truth for whether it counted — the heart fills either way so a repeat
 * tap never feels like a rejection, it just stops incrementing.
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

  const cast = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (has || busy) return
    setBusy(true)
    setHas(true)
    setCount(c => c + 1)
    setJustVoted(true)
    setTimeout(() => setJustVoted(false), 500)
    try {
      const res = await castVote(id)
      setCount(res.votes)
      if (!res.counted) setHas(true) // already voted server-side; keep the filled state
      onVoted?.({ votes: res.votes, rank: res.rank, gap: res.gap })
    } catch {
      // Roll back only the optimistic increment; a real anonymous voter rarely
      // gets rejected, and re-showing an empty heart reads as a broken button.
      setCount(c => Math.max(votes, c - 1))
    } finally {
      setBusy(false)
    }
  }

  const dims = size === 'sm' ? 'h-8 px-2.5 text-[12px]' : 'h-11 px-4 text-[13.5px]'

  return (
    <button
      type="button"
      onClick={cast}
      disabled={busy && !has}
      aria-pressed={has}
      aria-label={has ? `${count} votes, you voted` : `Vote for this Puja World, ${count} votes so far`}
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
