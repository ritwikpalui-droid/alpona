'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Board } from '@/lib/store'
import type { PublishedWorld } from '@/lib/types'
import { fetchWorlds } from '@/lib/client/api'
import WorldCard from './WorldCard'
import SceneCanvas from '@/components/SceneCanvas'
import VoteButton from './VoteButton'

const TABS: Array<{ id: Board; label: string; hint: string }> = [
  { id: 'overall', label: '🏆 Overall', hint: 'Most votes, all time' },
  { id: 'trending', label: '🔥 Trending', hint: 'Fastest-growing right now' },
  { id: 'loved', label: '❤️ Most Loved', hint: 'Highest vote count' },
]

export default function LeaderboardClient({
  initialWorlds, initialVoted,
}: { initialWorlds: PublishedWorld[]; initialVoted: string[] }) {
  const [board, setBoard] = useState<Board>('overall')
  const [worlds, setWorlds] = useState(initialWorlds)
  const [voted, setVoted] = useState(new Set(initialVoted))
  const [loading, setLoading] = useState(false)

  const switchBoard = async (b: Board) => {
    if (b === board) return
    setBoard(b); setLoading(true)
    try {
      const res = await fetchWorlds(b, 0, 30)
      setWorlds(res.worlds); setVoted(new Set(res.voted))
    } finally { setLoading(false) }
  }

  const champion = worlds[0]
  const rest = worlds.slice(1)

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchBoard(t.id)}
            className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
              board === t.id ? 'border-ink bg-ink text-paper' : 'border-ink/14 text-ink-2 hover:border-ink/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-paper-3/60" />)}
        </div>
      ) : (
        <>
          {champion && (
            <div className="mb-8 overflow-hidden rounded-3xl bg-ink text-paper">
              <div className="grid sm:grid-cols-2">
                <div className="relative aspect-[4/5] sm:aspect-auto">
                  <SceneCanvas scene={champion.scene} alive className="h-full w-full" title={champion.title} />
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-9">
                  <p className="eyebrow mb-3 text-paper/60">#1 · {TABS.find(t => t.id === board)?.label}</p>
                  <h2 className="display mb-2 text-balance text-[26px] leading-tight sm:text-[32px]">{champion.title}</h2>
                  <p className="mb-5 text-[13.5px] text-paper/70">by {champion.nickname}</p>
                  <div className="mb-6 flex items-center gap-3">
                    <VoteButton id={champion.id} votes={champion.votes} voted={voted.has(champion.id)} />
                    <Link href={`/w/${champion.id}`} className="text-[13px] text-paper/70 underline-offset-4 hover:text-paper hover:underline">
                      View full world →
                    </Link>
                  </div>
                  <div className="rounded-2xl border border-paper/20 p-4">
                    <p className="display mb-2 text-[16px]">🥇 Can you beat this?</p>
                    <Link href="/create" className="inline-block rounded-full bg-paper px-5 py-2.5 text-[13px] font-medium text-ink transition-transform hover:scale-[1.02]">
                      Create your own Puja World
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {rest.map((w, i) => (
              <WorldCard key={w.id} world={w} voted={voted.has(w.id)} rank={i + 2} />
            ))}
          </div>

          {worlds.length === 0 && (
            <p className="py-16 text-center text-[13.5px] text-ink-2">No worlds here yet — be the first to publish one.</p>
          )}
        </>
      )}
    </div>
  )
}
