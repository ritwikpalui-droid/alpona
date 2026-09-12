import type { Scene, SceneContext, TimeOfDay } from './types'
import { CATEGORIES, CATEGORY_ORDER, getAsset } from './assets'

/**
 * What the scene as a whole is doing. Derived, never stored — so a layer can
 * react to the light without any extra plumbing through the component tree.
 */
export function sceneContext(scene: Scene): SceneContext {
  const light = getAsset('lighting', scene.lighting)
  const sky = getAsset('sky', scene.sky)
  const timeOfDay: TimeOfDay = light?.meta.timeOfDay[0] ?? sky?.meta.timeOfDay[0] ?? 'golden'
  const lightTint = light?.palette[0] ?? '#D9A441'

  const tags = new Set<string>()
  for (const c of CATEGORY_ORDER) getAsset(c, scene[c])?.meta.tags.forEach(t => tags.add(t))

  return {
    timeOfDay,
    lightTint,
    isNight: timeOfDay === 'night' || tags.has('night'),
    isWet: tags.has('rain') || tags.has('wet') || tags.has('monsoon'),
  }
}

export function isComplete(scene: Scene): boolean {
  return CATEGORIES.every(c => c.optional || scene[c.id])
}

export function filledCount(scene: Scene): number {
  return CATEGORY_ORDER.filter(c => scene[c]).length
}

/** First step still waiting for an answer, for "Continue your Puja". */
export function nextStepIndex(scene: Scene): number {
  const i = CATEGORIES.findIndex(c => !scene[c.id])
  return i === -1 ? CATEGORIES.length - 1 : i
}

/* ---------------- persistence: a five-minute creation must survive a refresh ---- */

const DRAFT_KEY = 'pw.draft.v1'

export interface Draft { scene: Scene; step: number; title?: string; savedAt: number }

export function saveDraft(d: Omit<Draft, 'savedAt'>): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, savedAt: Date.now() }))
  } catch { /* private mode, quota — never block creation on storage */ }
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as Draft
    return d && typeof d === 'object' && d.scene ? d : null
  } catch { return null }
}

export function clearDraft(): void {
  try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
}

/* ---------------- URL-safe encoding, for share previews and debugging -------- */

export function encodeScene(scene: Scene): string {
  return CATEGORY_ORDER.map(c => scene[c] ?? '').join('.')
}

export function decodeScene(s: string): Scene {
  const parts = s.split('.')
  const scene: Scene = {}
  CATEGORY_ORDER.forEach((c, i) => {
    const v = parts[i]
    if (v && getAsset(c, v)) scene[c] = v
  })
  return scene
}
