import type { PublishedWorld, Scene } from '../types'
import type { Board, ListQuery, ListResult, Store } from './types'
import { surprise } from '../compat'
import { generateTitle } from '../title'
import { rng } from '../rng'

/**
 * In-memory adapter. Correct, fast, and ₹0 — but process-local, so it resets
 * on redeploy and does not share state between serverless instances. It exists
 * so the whole product runs today with no database bill; swap in a real Store
 * (Postgres/D1/KV) behind the same interface before promoting the leaderboard.
 */

const TRENDING_WINDOW_MS = 36 * 60 * 60 * 1000
const AUTO_HIDE_REPORTS = 4

interface Row extends PublishedWorld {
  voters: Set<string>
  reporters: Set<string>
  voteTimes: number[]
}

/**
 * Next's App Router compiles Server Components and Route Handlers as separate
 * module graphs ("layers"), so a plain module-level `const rows = new Map()`
 * is instantiated once per layer, not once per process — a world published
 * via the `/api/publish` route handler would then be invisible to the
 * `/w/[id]` Server Component reading a *different* copy of this same map.
 * (Confirmed: reproduces under `next start`, not just dev — this is not an
 * HMR artifact.) `globalThis` is the one thing every layer genuinely shares
 * within a process, so the state lives there instead — the same pattern used
 * to keep a single Prisma Client across Next.js's module duplication.
 */
interface StoreState { rows: Map<string, Row>; votesByVoter: Map<string, Set<string>> }
const GLOBAL_KEY = Symbol.for('alpona.memory-store.v1')
const state: StoreState = ((globalThis as Record<symbol, unknown>)[GLOBAL_KEY] ??= {
  rows: new Map<string, Row>(),
  votesByVoter: new Map<string, Set<string>>(),
}) as StoreState
const { rows, votesByVoter } = state

function id(seed: number): string {
  // Short, URL-friendly, no ambiguous characters.
  const alphabet = '23456789abcdefghjkmnpqrstuvwxyz'
  let n = seed >>> 0, out = ''
  for (let i = 0; i < 7; i++) { out += alphabet[n % alphabet.length]; n = Math.floor(n / alphabet.length) + 977 }
  return out
}

function trendingScore(w: Row, now: number): number {
  const recent = w.voteTimes.filter(t => now - t < TRENDING_WINDOW_MS).length
  const ageHours = Math.max(0.5, (now - w.createdAt) / 3600000)
  return (recent + w.votes * 0.12) / Math.pow(ageHours + 2, 1.5)
}

function toPublic(w: Row, now = Date.now()): PublishedWorld {
  return {
    id: w.id, scene: w.scene, adjust: w.adjust, extras: w.extras, title: w.title, nickname: w.nickname,
    description: w.description, votes: w.votes, createdAt: w.createdAt,
    recentVotes: w.voteTimes.filter(t => now - t < TRENDING_WINDOW_MS).length,
    editorsPick: w.editorsPick, reports: w.reporters.size,
  }
}

/* ------------------------------ seed ------------------------------ *
 * A brand-new gallery is the fastest way to make a social product look
 * dead. These are generated through the same compatibility engine the
 * user's Surprise Me uses, so they are plausible, varied and on-brand.
 * ------------------------------------------------------------------ */

const NICKS = ['Arko', 'Moumita', 'Rito', 'Shreya', 'Anik', 'Piu', 'Debo', 'Titir',
  'Bappa', 'Rimi', 'Shomu', 'Jhilik', 'Neel', 'Ishan', 'Trina', 'Kaku']

const FEATURED: Array<{ scene: Scene; title: string; nick: string; votes: number; note?: string }> = [
  { scene: { world: 'ganga-ghat', pandal: 'bengali-temple', durga: 'sabeki', lighting: 'moonlight', flowers: 'floating', decor: 'floating-lights', sky: 'full-moon', ambience: 'floating-diyas', sound: 'ghat-dhak' },
    title: 'Moonlight at the Ganga', nick: 'Arko', votes: 2481 },
  { scene: { world: 'himalaya', pandal: 'monastery', durga: 'serene', lighting: 'sunrise', flowers: 'white-flowers', decor: 'bells', sky: 'mist-sky', ambience: 'birds', sound: 'temple-bells' },
    title: 'Durga Above the Clouds', nick: 'Moumita', votes: 2193 },
  { scene: { world: 'forest', pandal: 'bamboo', durga: 'village-durga', lighting: 'diya', flowers: 'shiuli', decor: 'diyas', sky: 'deep-blue-night', ambience: 'fireflies', sound: 'forest-dhak' },
    title: 'The Forest Puja', nick: 'R', votes: 1874 },
  { scene: { world: 'rainy-kolkata', pandal: 'zamindar-mansion', durga: 'ekchala', lighting: 'rainy-night', flowers: 'marigold', decor: 'dhunuchi', sky: 'monsoon', ambience: 'rain-veil', sound: 'rain-dhak' },
    title: 'Midnight in North Kolkata', nick: 'Titir', votes: 1602 },
  { scene: { world: 'village', pandal: 'terracotta', durga: 'terracotta-idol', lighting: 'golden-hour', flowers: 'shiuli', decor: 'alpana', sky: 'golden-morning', ambience: 'falling-leaves', sound: 'shiuli-morning' },
    title: 'The Shiuli Puja', nick: 'Piu', votes: 1447 },
]

function seed(): void {
  if (rows.size) return
  const now = Date.now()
  const r = rng('seed-gallery-2026')

  FEATURED.forEach((f, i) => {
    const createdAt = now - (7 - i) * 26 * 3600000
    const rowId = id(1000 + i * 37)
    const voteTimes = Array.from({ length: Math.min(f.votes, 120) }, () => createdAt + r() * (now - createdAt))
    rows.set(rowId, {
      id: rowId, scene: f.scene, title: f.title, nickname: f.nick, votes: f.votes,
      createdAt, recentVotes: 0, voters: new Set(), reporters: new Set(), voteTimes,
      editorsPick: i === 1,
    })
  })

  for (let i = 0; i < 17; i++) {
    const scene = surprise(() => r())
    const rowId = id(5000 + i * 91)
    const ageH = r.range(1, 120)
    const createdAt = now - ageH * 3600000
    // Younger worlds get proportionally more of their votes in the last day —
    // that is what makes the trending board differ from the overall board.
    const votes = Math.floor(r.range(12, 900) * (1 - ageH / 400))
    const voteTimes = Array.from({ length: Math.min(Math.max(votes, 1), 90) },
      () => createdAt + Math.pow(r(), 0.55) * (now - createdAt))
    rows.set(rowId, {
      id: rowId, scene, title: generateTitle(scene), nickname: r.pick(NICKS),
      votes: Math.max(3, votes), createdAt, recentVotes: 0,
      voters: new Set(), reporters: new Set(), voteTimes,
    })
  }
}

function visible(): Row[] {
  seed()
  return [...rows.values()].filter(w => !w.removed && w.reporters.size < AUTO_HIDE_REPORTS)
}

function sorted(board: Board): Row[] {
  const now = Date.now()
  const all = visible()
  switch (board) {
    case 'trending': return all.sort((a, b) => trendingScore(b, now) - trendingScore(a, now))
    case 'recent': return all.sort((a, b) => b.createdAt - a.createdAt)
    case 'loved':
    case 'overall':
    default: return all.sort((a, b) => b.votes - a.votes || b.createdAt - a.createdAt)
  }
}

export const memoryStore: Store = {
  async publish({ scene, title, nickname, description, adjust, extras }) {
    seed()
    const now = Date.now()
    const rowId = id(now ^ Math.floor(Math.random() * 0xffffff))
    const row: Row = {
      id: rowId, scene, adjust, extras, title, nickname, description, votes: 0, createdAt: now,
      recentVotes: 0, voters: new Set(), reporters: new Set(), voteTimes: [],
    }
    rows.set(rowId, row)
    return toPublic(row)
  },

  async get(id) {
    seed()
    const w = rows.get(id)
    if (!w || w.removed || w.reporters.size >= AUTO_HIDE_REPORTS) return null
    return toPublic(w)
  },

  async list({ board, limit = 24, cursor = 0 }: ListQuery): Promise<ListResult> {
    const all = sorted(board)
    const page = all.slice(cursor, cursor + limit)
    return {
      worlds: page.map(w => toPublic(w)),
      nextCursor: cursor + limit < all.length ? cursor + limit : null,
      total: all.length,
    }
  },

  async vote(id, voterId) {
    seed()
    const w = rows.get(id)
    if (!w) throw new Error('not_found')
    if (w.voters.has(voterId)) return { world: toPublic(w), counted: false }
    w.voters.add(voterId)
    w.votes += 1
    w.voteTimes.push(Date.now())
    const set = votesByVoter.get(voterId) ?? new Set()
    set.add(id)
    votesByVoter.set(voterId, set)
    return { world: toPublic(w), counted: true }
  },

  async unvote(id, voterId) {
    seed()
    const w = rows.get(id)
    if (!w) throw new Error('not_found')
    if (!w.voters.has(voterId)) return { world: toPublic(w), counted: false }
    w.voters.delete(voterId)
    w.votes = Math.max(0, w.votes - 1)
    // voteTimes has no per-voter mapping — dropping the most recent entry is
    // a fine approximation for the trending heuristic (vote/unvote pairs
    // happen close together in time for whoever's toggling).
    w.voteTimes.pop()
    votesByVoter.get(voterId)?.delete(id)
    return { world: toPublic(w), counted: true }
  },

  async hasVoted(id, voterId) {
    seed()
    return rows.get(id)?.voters.has(voterId) ?? false
  },

  async votedIds(voterId) {
    return [...(votesByVoter.get(voterId) ?? [])]
  },

  async report(id, voterId) {
    seed()
    rows.get(id)?.reporters.add(voterId)
  },

  async rank(id) {
    const i = sorted('overall').findIndex(w => w.id === id)
    return i === -1 ? null : i + 1
  },

  async gapToNext(id) {
    const all = sorted('overall')
    const i = all.findIndex(w => w.id === id)
    if (i <= 0) return null
    return { places: 1, votes: Math.max(1, all[i - 1].votes - all[i].votes + 1) }
  },
}
