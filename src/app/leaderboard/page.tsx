import type { Metadata } from 'next'
import Header from '@/components/Header'
import Countdown from '@/components/Countdown'
import LeaderboardClient from '@/components/gallery/LeaderboardClient'
import { store } from '@/lib/store'
import { getVoter } from '@/lib/server/voter'

export const metadata: Metadata = {
  title: 'Leaderboard — Puja World 2026',
  description: 'The most-loved, most-trending and most-voted imagined Durga Puja worlds of 2026. See who is #1 — and see if you can beat them.',
}

export default async function LeaderboardPage() {
  const voter = await getVoter()
  const [result, voted] = await Promise.all([
    store.list({ board: 'overall', limit: 30 }),
    store.votedIds(voter.id),
  ])

  return (
    <div className="min-h-dvh bg-paper">
      <Header />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="eyebrow mb-2">🏆 Puja Worlds 2026</p>
        <h1 className="display mb-2 text-[30px] sm:text-[38px]">The Leaderboard</h1>
        <Countdown className="mb-8 block" />
        <LeaderboardClient initialWorlds={result.worlds} initialVoted={voted} />
      </div>
    </div>
  )
}
