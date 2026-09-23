/**
 * Token bucket, in memory. Genuine users never see it; scripted voting hits it
 * immediately. Deliberately not a CAPTCHA — the brief wants frictionless
 * participation (§22) with reasonable protection (§46), not a wall.
 */

interface Bucket { tokens: number; last: number }

// See the matching comment in lib/store/memory.ts: Next's App Router can
// instantiate this module more than once per process across bundling layers,
// so the map lives on globalThis to guarantee every caller shares one bucket
// per key rather than one per layer.
const GLOBAL_KEY = Symbol.for('alpona.ratelimit.v1')
const buckets: Map<string, Bucket> =
  ((globalThis as Record<symbol, unknown>)[GLOBAL_KEY] ??= new Map<string, Bucket>()) as Map<string, Bucket>

export interface Limit { capacity: number; refillPerSec: number }

export const LIMITS = {
  /** Voting: a burst of 8, then one every 4s. Pandal-hopping a gallery is fine. */
  vote: { capacity: 8, refillPerSec: 0.25 } satisfies Limit,
  /** Publishing is rare and expensive: 3, then one every 10 minutes. */
  publish: { capacity: 3, refillPerSec: 1 / 600 } satisfies Limit,
  report: { capacity: 5, refillPerSec: 1 / 120 } satisfies Limit,
  /** Same shape as `publish` — a gift link is just as rare/expensive to mint. */
  giftPublish: { capacity: 3, refillPerSec: 1 / 600 } satisfies Limit,
} as const

export function take(key: string, limit: Limit, cost = 1): boolean {
  const now = Date.now()
  const b = buckets.get(key) ?? { tokens: limit.capacity, last: now }
  b.tokens = Math.min(limit.capacity, b.tokens + ((now - b.last) / 1000) * limit.refillPerSec)
  b.last = now
  if (b.tokens < cost) { buckets.set(key, b); return false }
  b.tokens -= cost
  buckets.set(key, b)
  return true
}

// Keep the map from growing without bound in a long-lived process.
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const cutoff = Date.now() - 3600_000
    for (const [k, b] of buckets) if (b.last < cutoff) buckets.delete(k)
  }, 600_000)
  if (typeof timer === 'object' && 'unref' in timer) (timer as { unref: () => void }).unref()
}
