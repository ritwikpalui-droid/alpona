/**
 * Google AdSense wiring — entirely env-driven, and entirely absent from the
 * DOM (no script tag, no reserved space, nothing) until real IDs are set.
 * That matters more than usual here: the whole point of putting ads only on
 * the Gallery and Leaderboard (browsing/discovery pages) and NEVER on
 * `/create` or the Reveal/gift-card flow (the actual craft — see AdSlot's
 * own doc comment) is that making and gifting an Alpona should never feel
 * like it costs the maker anything. An ad slot that silently renders blank
 * because a slot id is missing would be worse than no ad slot at all — it'd
 * reserve layout space for nothing — so every call site checks
 * `adsenseClientId()` before rendering.
 */

export function adsenseClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || undefined
}

/** Per-placement ad unit ids, created one at a time in the AdSense
 *  dashboard once the account is approved — there is no such thing as a
 *  generic slot id, so each spot names its own env var explicitly rather
 *  than sharing one. */
export function adsenseSlot(placement: 'gallery' | 'leaderboard'): string | undefined {
  const key = placement === 'gallery' ? 'NEXT_PUBLIC_ADSENSE_SLOT_GALLERY' : 'NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD'
  return process.env[key] || undefined
}
