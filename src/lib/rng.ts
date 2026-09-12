/**
 * Deterministic RNG. Every asset seeds from its own id, so a scene paints
 * identically on every render and on every device — no re-jitter, no layout
 * shift, and a published world looks the same to its creator and its voters.
 */
export interface Rng {
  (): number
  range(min: number, max: number): number
  int(min: number, max: number): number
  pick<T>(xs: readonly T[]): T
  /** ±amount around 0, for hand-drawn wobble. */
  jitter(amount: number): number
  fork(salt: string): Rng
}

function hash(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function rng(seed: string): Rng {
  let s = hash(seed) || 1
  const next = (() => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }) as Rng

  next.range = (min, max) => min + next() * (max - min)
  next.int = (min, max) => Math.floor(next.range(min, max + 1))
  next.pick = (xs) => xs[Math.floor(next() * xs.length)]
  next.jitter = (amount) => (next() - 0.5) * 2 * amount
  next.fork = (salt) => rng(seed + ':' + salt)
  return next
}
