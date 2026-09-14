'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Board } from '@/lib/store'
import type { PublishedWorld } from '@/lib/types'
import { fetchWorlds } from '@/lib/client/api'
import WorldCard from './WorldCard'

const TABS: Array<{ id: Board; label: string }> = [
  { id: 'trending', label: '🔥 Trending' },
  { id: 'overall', label: '🏆 Overall' },
  { id: 'loved', label: '❤️ Most Loved' },
  { id: 'recent', label: '🆕 Newest' },
]

export default function GalleryClient({
  initialWorlds, initialVoted, initialBoard, initialCursor,
}: {
  initialWorlds: PublishedWorld[]
  initialVoted: string[]
  initialBoard: Board
  initialCursor: number | null
}) {
  const [board, setBoard] = useState<Board>(initialBoard)
  const [worlds, setWorlds] = useState(initialWorlds)
  const [voted, setVoted] = useState(new Set(initialVoted))
  const [cursor, setCursor] = useState(initialCursor)
  const [loading, setLoading] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)

  const switchBoard = useCallback(async (b: Board) => {
    if (b === board) return
    setBoard(b); setLoading(true)
    try {
      const res = await fetchWorlds(b)
      setWorlds(res.worlds); setCursor(res.nextCursor); setVoted(new Set(res.voted))
    } finally { setLoading(false) }
  }, [board])

  const loadMore = useCallback(async () => {
    if (cursor == null || loading) return
    setLoading(true)
    try {
      const res = await fetchWorlds(board, cursor)
      setWorlds(w => [...w, ...res.worlds]); setCursor(res.nextCursor)
    } finally { setLoading(false) }
  }, [board, cursor, loading])

  // Lazy-load the next page only when the sentinel actually nears the viewport —
  // a spike in traffic should not mean fetching the whole gallery up front.
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) void loadMore()
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore])

  return (
    <div>
      <div className="rail -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchBoard(t.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
              board === t.id ? 'border-ink bg-ink text-paper' : 'border-ink/14 text-ink-2 hover:border-ink/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {worlds.length === 0 && !loading ? (
        <div className="rounded-3xl border border-dashed border-ink/16 py-20 text-center">
          <p className="display mb-2 text-[20px]">Nothing here yet</p>
          <p className="mb-5 text-[13.5px] text-ink-2">Be the first to publish an Alpona in this view.</p>
          <Link href="/create" className="inline-block rounded-full bg-ink px-6 py-3 text-[13.5px] font-medium text-paper">Create mine →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {worlds.map(w => <WorldCard key={w.id} world={w} voted={voted.has(w.id)} />)}
        </div>
      )}

      <div ref={sentinel} className="h-1" />
      {loading && (
        <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-paper-3/60" />
          ))}
        </div>
      )}
      {cursor == null && worlds.length > 0 && (
        <p className="mt-8 text-center text-[12.5px] text-ink-3">That&rsquo;s everyone, for now.</p>
      )}
    </div>
  )
}
