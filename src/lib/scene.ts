import type { ExtraPlacement, Scene, SceneAdjust, SceneContext, TimeOfDay } from './types'
import { CATEGORIES, CATEGORY_ORDER, getAsset } from './assets'

/**
 * Where each lighting choice's key light comes from, normalised 0–1 on the
 * canvas. Hand-picked per asset (a low golden sun sits low and to one
 * side; a diya's glow comes from ground level; a spotlight is near-
 * overhead) rather than derived, since "where is the light" is an art
 * direction call the asset's palette/timeOfDay fields don't encode.
 */
const LIGHT_DIRECTION: Record<string, { x: number; y: number }> = {
  'golden-hour': { x: 0.16, y: 0.38 },
  sunrise: { x: 0.82, y: 0.34 },
  'blue-hour': { x: 0.5, y: 0.16 },
  moonlight: { x: 0.72, y: 0.14 },
  'deep-night': { x: 0.5, y: 0.1 },
  diya: { x: 0.5, y: 0.82 },
  'fairy-lights': { x: 0.5, y: 0.45 },
  'warm-festival': { x: 0.28, y: 0.3 },
  'neon-kolkata': { x: 0.62, y: 0.4 },
  spotlight: { x: 0.5, y: 0.06 },
  'rainy-night': { x: 0.5, y: 0.2 },
  'misty-cinematic': { x: 0.5, y: 0.24 },
}
const DEFAULT_LIGHT_DIRECTION = { x: 0.3, y: 0.25 }

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
    light: (scene.lighting ? LIGHT_DIRECTION[scene.lighting] : undefined) ?? DEFAULT_LIGHT_DIRECTION,
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

export interface Draft {
  scene: Scene; step: number; title?: string
  adjust?: SceneAdjust; extras?: ExtraPlacement[]
  savedAt: number
}

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
