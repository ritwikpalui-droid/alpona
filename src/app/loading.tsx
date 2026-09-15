/**
 * The route-level fallback Next shows while a page's own data fetch is in
 * flight during a client-side navigation. Added after QA found some
 * transitions on the free-tier host (a cold instance, or just a slower
 * server-side query) taking several seconds with absolutely nothing on
 * screen to say so — long enough that a real visitor could reasonably
 * conclude a button they tapped (e.g. "Back to Alpona" on a not-found page)
 * had simply done nothing, and give up before it resolved on its own.
 * Deliberately quiet and on-brand rather than a generic spinner overlay.
 */
export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper">
      <div className="flex items-center gap-2 text-ink-3">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-3" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-3" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-3" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
