import Link from 'next/link'

/**
 * Deliberately not a navigation bar (§2). A wordmark, two words, a hairline.
 * On a phone it occupies 52px and then gets out of the way.
 */
export default function Header({ variant = 'default' }: { variant?: 'default' | 'quiet' }) {
  return (
    <header className={`sticky top-0 z-40 ${variant === 'quiet' ? '' : 'bg-paper/85 backdrop-blur-md'}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <Link href="/" className="group flex items-baseline gap-2" aria-label="Puja World 2026, home">
          <span className="display text-[17px] tracking-tight text-ink">Puja World</span>
          <span className="eyebrow text-[10px] text-ink-3 transition-colors group-hover:text-ink-2">2026</span>
        </Link>
        <nav className="flex items-center gap-1 text-[13px]">
          <Link href="/gallery" className="rounded-full px-3 py-2 text-ink-2 transition-colors hover:text-ink">Gallery</Link>
          <Link href="/leaderboard" className="rounded-full px-3 py-2 text-ink-2 transition-colors hover:text-ink">Leaderboard</Link>
          <Link
            href="/create"
            className="ml-1 rounded-full bg-ink px-4 py-2 font-medium text-paper transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            Create
          </Link>
        </nav>
      </div>
      <div className="h-px bg-ink/8" />
    </header>
  )
}
