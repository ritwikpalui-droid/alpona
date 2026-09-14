import Link from 'next/link'
import type { PublishedWorld } from '@/lib/types'
import SceneCanvas from '@/components/SceneCanvas'
import VoteButton from './VoteButton'

/**
 * The gallery unit. The artwork is the hero (§20) — title and votes sit
 * underneath as a caption, never over the picture.
 */
export default function WorldCard({
  world, voted, rank, size = 'md', eager = false,
}: {
  world: PublishedWorld
  voted: boolean
  /** Shown as a corner medallion on leaderboards; omitted in the plain gallery. */
  rank?: number
  size?: 'md' | 'lg'
  eager?: boolean
}) {
  return (
    <Link
      href={`/w/${world.id}`}
      className="group block overflow-hidden rounded-2xl bg-paper ring-1 ring-ink/10 transition-shadow duration-300 hover:ring-ink/25"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-2">
        {rank != null && (
          <span className="absolute left-2.5 top-2.5 z-10 grid h-7 min-w-7 place-items-center rounded-full bg-ink/85 px-1.5 text-[12px] font-medium text-paper backdrop-blur">
            #{rank}
          </span>
        )}
        {world.editorsPick && (
          <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-marigold/90 px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-wide text-paper">
            Editor&rsquo;s pick
          </span>
        )}
        <div className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.24,1)] group-hover:scale-[1.035]">
          <SceneCanvas scene={world.scene} adjust={world.adjust} extras={world.extras} className="h-full w-full" title={world.title} variant={eager ? 'full' : 'thumb'} />
        </div>
      </div>
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className={`truncate font-medium text-ink ${size === 'lg' ? 'text-[15px]' : 'text-[13.5px]'}`}>{world.title}</p>
          <p className="truncate text-[11.5px] text-ink-3">by {world.nickname}</p>
        </div>
        <VoteButton id={world.id} votes={world.votes} voted={voted} size="sm" />
      </div>
    </Link>
  )
}
