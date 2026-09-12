import type { Metadata } from 'next'
import Header from '@/components/Header'
import GalleryClient from '@/components/gallery/GalleryClient'
import { store } from '@/lib/store'
import { getVoter } from '@/lib/server/voter'

export const metadata: Metadata = {
  title: 'Gallery — Puja World 2026',
  description: 'Browse imagined Durga Puja worlds built by the community: watercolour ghats, pandals and Durgas, each one a scene someone composed themselves.',
}

export default async function GalleryPage() {
  const voter = await getVoter()
  const [result, voted] = await Promise.all([
    store.list({ board: 'trending', limit: 24 }),
    store.votedIds(voter.id),
  ])

  return (
    <div className="min-h-dvh bg-paper">
      <Header />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="eyebrow mb-2">Gallery</p>
        <h1 className="display mb-8 text-[30px] sm:text-[38px]">Puja Worlds, built by everyone</h1>
        <GalleryClient
          initialWorlds={result.worlds}
          initialVoted={voted}
          initialBoard="trending"
          initialCursor={result.nextCursor}
        />
      </div>
    </div>
  )
}
