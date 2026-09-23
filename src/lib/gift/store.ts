import type { ImpressionBuild, PublishedImpression } from './types'

/**
 * In-memory, exactly like `../store/memory.ts` — same tradeoff (correct,
 * free, resets on redeploy), same reason for existing (ship today with no
 * database bill). A gift link has no voting/leaderboard, so this is a much
 * smaller interface than the world `Store` — copying that TYPE would have
 * dragged in ranking machinery this doesn't need; copying the PATTERN
 * (this file) is the right amount of reuse.
 */

interface GiftStoreState { rows: Map<string, PublishedImpression> }
const GLOBAL_KEY = Symbol.for('alpona.gift-store.v1')
const state: GiftStoreState = ((globalThis as Record<symbol, unknown>)[GLOBAL_KEY] ??= {
  rows: new Map<string, PublishedImpression>(),
}) as GiftStoreState
const { rows } = state

function id(seed: number): string {
  const alphabet = '23456789abcdefghjkmnpqrstuvwxyz'
  let n = seed >>> 0, out = ''
  for (let i = 0; i < 7; i++) { out += alphabet[n % alphabet.length]; n = Math.floor(n / alphabet.length) + 977 }
  return out
}

export interface PublishGiftInput {
  build: ImpressionBuild
  title: string
  nickname: string
  message?: string
  recipient?: string
  soundId?: string
}

export const giftStore = {
  async publish(input: PublishGiftInput): Promise<PublishedImpression> {
    const now = Date.now()
    const rowId = id(now ^ Math.floor(Math.random() * 0xffffff))
    const row: PublishedImpression = { id: rowId, createdAt: now, ...input }
    rows.set(rowId, row)
    return row
  },

  async get(giftId: string): Promise<PublishedImpression | null> {
    return rows.get(giftId) ?? null
  },
}
