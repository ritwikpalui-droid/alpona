import type { Asset, CategoryId, MatchLabel, Scene, ScoredAsset } from './types'
import { CATEGORY_ORDER, getAsset, getCategory } from './assets'

/**
 * Compatibility by tag affinity, not by an N×N lookup table.
 *
 * Each asset declares only what it *is*. A candidate is scored against the
 * profile of everything already chosen. Adding an asset means tagging it —
 * no existing file changes. That is the whole point (brief §59).
 */

const WEIGHTS = { terrain: 0.34, time: 0.26, mood: 0.22, tags: 0.18 }

interface Profile {
  terrain: Set<string>
  time: Set<string>
  mood: Set<string>
  tags: Set<string>
  /** What the already-chosen assets actively want alongside them. */
  boost: Set<string>
  avoid: Set<string>
  intensity: number
  count: number
}

function profile(scene: Scene, skip?: CategoryId): Profile {
  const p: Profile = {
    terrain: new Set(), time: new Set(), mood: new Set(), tags: new Set(),
    boost: new Set(), avoid: new Set(), intensity: 0, count: 0,
  }
  for (const cat of CATEGORY_ORDER) {
    if (cat === skip) continue
    const a = getAsset(cat, scene[cat])
    if (!a) continue
    p.count++
    p.intensity += a.meta.intensity
    // The world decides the terrain; nothing else gets a vote on it.
    if (cat === 'world') a.meta.terrain.forEach(t => p.terrain.add(t))
    // Light and sky decide the hour. Other layers only follow.
    if (cat === 'lighting' || cat === 'sky') a.meta.timeOfDay.forEach(t => p.time.add(t))
    a.meta.mood.forEach(m => p.mood.add(m))
    a.meta.tags.forEach(t => p.tags.add(t))
    a.affinity?.boost?.forEach(t => p.boost.add(t))
    a.affinity?.avoid?.forEach(t => p.avoid.add(t))
  }
  return p
}

function overlap(a: readonly string[], b: Set<string>): number {
  let n = 0
  for (const x of a) if (b.has(x)) n++
  return n
}

export function scoreAsset(asset: Asset, p: Profile): number {
  // Terrain: an asset listing no terrain is universal, which is a virtue.
  const terrain = p.terrain.size === 0 ? 0.6
    : asset.meta.terrain.length === 0 ? 0.72
      : overlap(asset.meta.terrain, p.terrain) > 0 ? 1 : 0.12

  const time = p.time.size === 0 ? 0.6
    : asset.meta.timeOfDay.length === 0 ? 0.72
      : 0.1 + 0.9 * Math.min(1, overlap(asset.meta.timeOfDay, p.time) / Math.min(asset.meta.timeOfDay.length, p.time.size))

  const mood = p.mood.size === 0 ? 0.6
    : 0.22 + 0.78 * Math.min(1, overlap(asset.meta.mood, p.mood) / Math.min(asset.meta.mood.length || 1, p.mood.size))

  const tags = p.tags.size === 0 ? 0.5
    : Math.min(1, overlap(asset.meta.tags, p.tags) / 2.4)

  let s = terrain * WEIGHTS.terrain + time * WEIGHTS.time + mood * WEIGHTS.mood + tags * WEIGHTS.tags

  // Explicit wants, in both directions.
  if (overlap(asset.meta.tags, p.boost) > 0) s += 0.14
  if (overlap(asset.meta.tags, p.avoid) > 0) s -= 0.24
  if (asset.affinity?.boost && overlap(asset.affinity.boost, p.tags) > 0) s += 0.12
  if (asset.affinity?.avoid && overlap(asset.affinity.avoid, p.tags) > 0) s -= 0.22

  // Crowding guard: a busy scene stops recommending more busyness.
  const avg = p.count ? p.intensity / p.count : 2.5
  if (avg > 3.2 && asset.meta.intensity >= 4) s -= 0.1 * (avg - 3.2)
  if (avg < 2.2 && asset.meta.intensity <= 2) s += 0.04

  return Math.max(0, Math.min(1, s))
}

export function labelFor(score: number): MatchLabel {
  if (score >= 0.78) return 'PERFECT MATCH'
  if (score >= 0.55) return 'WORKS BEAUTIFULLY'
  if (score >= 0.32) return 'INTERESTING'
  return 'UNEXPECTED'
}

/**
 * Ranked options for one category. Nothing is ever removed — the brief is
 * explicit that odd combinations stay reachable, they just sort lower.
 */
export function rankOptions(category: CategoryId, scene: Scene): ScoredAsset[] {
  const p = profile(scene, category)
  return getCategory(category).assets
    .map(asset => {
      const score = scoreAsset(asset, p)
      return { asset, score, label: labelFor(score) }
    })
    .sort((a, b) => b.score - a.score)
}

/** True once enough context exists for a match label to mean anything. */
export function hasContext(scene: Scene, category: CategoryId): boolean {
  return CATEGORY_ORDER.some(c => c !== category && scene[c])
}

/* ------------------------------------------------------------------ *
 * Surprise Me — weighted sampling over the same scores, never uniform
 * random. Bias toward good without producing the same scene every time.
 * ------------------------------------------------------------------ */

function sample(options: ScoredAsset[], rnd: () => number, sharpness = 3.5): Asset {
  const pool = options.slice(0, Math.max(4, Math.ceil(options.length * 0.6)))
  const weights = pool.map(o => Math.pow(Math.max(o.score, 0.05), sharpness))
  const total = weights.reduce((a, b) => a + b, 0)
  let t = rnd() * total
  for (let i = 0; i < pool.length; i++) {
    t -= weights[i]
    if (t <= 0) return pool[i].asset
  }
  return pool[pool.length - 1].asset
}

/** Builds a whole scene, each layer chosen in the light of the last. */
export function surprise(rnd: () => number = Math.random, seed: Scene = {}): Scene {
  const scene: Scene = { ...seed }
  for (const cat of CATEGORY_ORDER) {
    if (scene[cat]) continue
    scene[cat] = sample(rankOptions(cat, scene), rnd).id
  }
  return scene
}

/** Re-roll exactly one layer, holding everything else still. */
export function rerollOne(scene: Scene, category: CategoryId, rnd: () => number = Math.random): Scene {
  const without: Scene = { ...scene }
  delete without[category]
  const options = rankOptions(category, without).filter(o => o.asset.id !== scene[category])
  if (!options.length) return scene
  return { ...scene, [category]: sample(options, rnd).id }
}
