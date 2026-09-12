import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import SceneCanvas from '@/components/SceneCanvas'
import VoteButton from '@/components/gallery/VoteButton'
import { CATEGORIES, getAsset } from '@/lib/assets'
import { store } from '@/lib/store'
import { getVoter } from '@/lib/server/voter'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const world = await store.get(id)
  if (!world) return { title: 'Puja World not found' }

  const description = world.description
    || `A Puja World imagined by ${world.nickname}: ${describeScene(world)}. ${world.votes.toLocaleString('en-IN')} votes so far.`

  return {
    title: world.title,
    description,
    alternates: { canonical: `/w/${world.id}` },
    openGraph: {
      title: `${world.title} · Puja World 2026`,
      description,
      type: 'article',
      images: [{ url: `/w/${world.id}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/w/${world.id}/opengraph-image`],
    },
  }
}

function describeScene(world: { scene: Record<string, string | undefined> }): string {
  const bits = ['world', 'pandal', 'durga', 'lighting'].map(c => getAsset(c as never, world.scene[c])?.name).filter(Boolean)
  return bits.join(', ')
}

export default async function WorldPage({ params }: Props) {
  const { id } = await params
  const [world, voter] = await Promise.all([store.get(id), getVoter()])
  if (!world) notFound()

  const [voted, rank] = await Promise.all([store.hasVoted(id, voter.id), store.rank(id)])

  const layers = CATEGORIES
    .map(c => ({ cat: c, asset: getAsset(c.id, world.scene[c.id]) }))
    .filter((x): x is { cat: typeof x.cat; asset: NonNullable<typeof x.asset> } => Boolean(x.asset))

  return (
    <div className="min-h-dvh bg-paper">
      <Header />
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-3xl bg-paper-2 ring-1 ring-ink/10">
            <SceneCanvas scene={world.scene} alive className="aspect-[4/5] w-full" title={world.title} />
          </div>

          <div className="flex flex-col">
            {rank && (
              <p className="eyebrow mb-2 text-ink-3">
                {rank <= 10 ? `#${rank} on the leaderboard` : `Rank #${rank}`}
              </p>
            )}
            <h1 className="display mb-2 text-balance text-[30px] leading-tight sm:text-[38px]">{world.title}</h1>
            <p className="mb-6 text-[14px] text-ink-2">by {world.nickname}</p>

            {world.description && (
              <p className="mb-6 max-w-[48ch] text-[14.5px] leading-relaxed text-ink-2">{world.description}</p>
            )}

            <div className="mb-8 flex items-center gap-3">
              <VoteButton id={world.id} votes={world.votes} voted={voted} />
              <span className="text-[12.5px] text-ink-3">Published {new Date(world.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            </div>

            <div className="mb-8">
              <p className="eyebrow mb-3">What&rsquo;s in this world</p>
              <div className="flex flex-wrap gap-1.5">
                {layers.map(({ cat, asset }) => (
                  <span key={cat.id} className="rounded-full border border-ink/12 bg-paper-2/60 px-3 py-1 text-[11.5px] text-ink-2">
                    <span className="text-ink-3">{cat.label}</span> · {asset.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-auto rounded-2xl border border-ink/12 bg-paper-2/50 p-5">
              <p className="display mb-2 text-[17px]">Think you can build something better?</p>
              <Link href="/create" className="inline-block rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-medium text-paper transition-transform hover:scale-[1.02]">
                Create mine →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
