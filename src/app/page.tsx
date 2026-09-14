import Link from 'next/link'
import Header from '@/components/Header'
import Countdown from '@/components/Countdown'
import SceneCanvas from '@/components/SceneCanvas'
import WorldCard from '@/components/gallery/WorldCard'
import { store } from '@/lib/store'
import { getVoter } from '@/lib/server/voter'

const HERO_SCENE = {
  world: 'ganga-ghat', pandal: 'bengali-temple', durga: 'sabeki',
  lighting: 'golden-hour', flowers: 'shiuli', sky: 'golden-morning',
  ambience: 'floating-diyas',
}

export default async function Home() {
  const voter = await getVoter()
  const [trending, top, voted] = await Promise.all([
    store.list({ board: 'trending', limit: 6 }),
    store.list({ board: 'overall', limit: 3 }),
    store.votedIds(voter.id),
  ])
  const votedSet = new Set(voted)

  return (
    <div className="min-h-dvh bg-paper">
      <Header />

      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.9]">
          {/* Not `alive`: this backdrop is mostly obscured by the gradient and
              headline anyway, and a large, CSS-scaled, filter-heavy SVG with
              continuous ambient animation is exactly the combination that
              causes visible lag/flicker on a mid-range phone. A still scene
              keeps the mood without the cost. */}
          <SceneCanvas scene={HERO_SCENE} className="h-full w-full scale-110" title="An Alpona, imagined" />
          <div className="absolute inset-0 bg-gradient-to-b from-paper/10 via-paper/55 to-paper" />
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pb-20 pt-[15vh] text-center sm:pb-28 sm:pt-[20vh]">
          <Countdown className="fade-up mb-5" />
          <h1 className="display fade-up text-balance text-[13vw] leading-[0.98] tracking-tight text-ink sm:text-[64px] lg:text-[76px]" style={{ animationDelay: '0.08s' }}>
            This Puja,<br />build your own world.
          </h1>
          <p className="fade-up mt-6 max-w-[36ch] text-balance text-[15.5px] leading-relaxed text-ink-2 sm:text-[17px]" style={{ animationDelay: '0.18s' }}>
            Choose a place. Choose a pandal. Choose her. Then bring the whole scene to life — and see if it can beat the rest.
          </p>

          <div className="fade-up mt-9 flex w-full max-w-sm flex-col items-center gap-3 sm:w-auto sm:flex-row" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/create"
              className="w-full rounded-full bg-ink px-8 py-4 text-center text-[14.5px] font-medium tracking-wide text-paper transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
            >
              CREATE MY PUJA
            </Link>
            <Link
              href="/gallery"
              className="w-full rounded-full border border-ink/18 px-8 py-4 text-center text-[14.5px] text-ink-2 transition-colors hover:border-ink/35 hover:text-ink sm:w-auto"
            >
              Explore Alponas
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- people building */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Right now</p>
            <h2 className="display text-[26px] sm:text-[32px]">People are building</h2>
          </div>
          <Link href="/gallery" className="hidden shrink-0 text-[13.5px] text-ink-2 underline-offset-4 hover:text-ink hover:underline sm:block">
            See the full gallery →
          </Link>
        </div>
        <div className="rail -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {trending.worlds.map(w => (
            <div key={w.id} className="w-[62vw] shrink-0 sm:w-auto">
              <WorldCard world={w} voted={votedSet.has(w.id)} />
            </div>
          ))}
        </div>
        <Link href="/gallery" className="mt-6 block text-center text-[13.5px] text-ink-2 underline-offset-4 hover:text-ink hover:underline sm:hidden">
          See the full gallery →
        </Link>
      </section>

      {/* ----------------------------------------------------- leaderboard */}
      <section className="border-y border-ink/8 bg-paper-2/60">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="mb-7 text-center">
            <p className="eyebrow mb-2">🏆 This year&apos;s best Alponas</p>
            <h2 className="display text-[26px] sm:text-[32px]">Can you make it to #1?</h2>
          </div>
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
            {top.worlds.map((w, i) => (
              <WorldCard key={w.id} world={w} voted={votedSet.has(w.id)} rank={i + 1} size="lg" />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/leaderboard" className="text-[13.5px] font-medium text-ink underline-offset-4 hover:underline">
              View the full leaderboard →
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- how it works */}
      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="eyebrow mb-2 text-center">How it works</p>
        <h2 className="display mb-10 text-center text-[26px] sm:text-[32px]">Four choices, one world</h2>
        <div className="grid gap-8 sm:grid-cols-4 sm:gap-6">
          {[
            ['01', 'Choose your world', 'A ghat, a mountain, a rain-soaked street — the place your Puja happens.'],
            ['02', 'Build your Puja', 'Pandal, Durga, light, flowers — the scene paints itself as you choose.'],
            ['03', 'Publish it', 'Give it a name, a nickname, and let it into the gallery.'],
            ['04', 'Get votes', 'Share it. Climb the leaderboard. See who else is building.'],
          ].map(([n, t, d]) => (
            <div key={n}>
              <p className="eyebrow mb-3 text-ink-3">{n}</p>
              <h3 className="display mb-1.5 text-[18px]">{t}</h3>
              <p className="text-[13.5px] leading-relaxed text-ink-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden border-t border-ink/8">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center sm:py-28">
          <h2 className="display text-balance text-[30px] leading-tight sm:text-[42px]">
            Your Puja is waiting.
          </h2>
          <Link
            href="/create"
            className="mt-8 inline-block rounded-full bg-ink px-9 py-4 text-[14.5px] font-medium tracking-wide text-paper transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            BUILD YOURS →
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink/8 px-5 py-8 text-center text-[12px] text-ink-3 sm:px-8">
        Alpona — an independent, unofficial creative project for Durga Puja.
      </footer>
    </div>
  )
}
