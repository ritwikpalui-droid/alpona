import type { ReactNode } from 'react'
import type { Rng } from './rng'

export type CategoryId =
  | 'world' | 'pandal' | 'durga' | 'lighting'
  | 'flowers' | 'decor' | 'sky' | 'ambience' | 'sound'

export type Terrain =
  | 'river' | 'urban' | 'mountain' | 'forest' | 'sea'
  | 'plain' | 'rooftop' | 'interior' | 'space'

export type TimeOfDay = 'dawn' | 'day' | 'golden' | 'dusk' | 'night'

export type Mood =
  | 'serene' | 'festive' | 'grand' | 'intimate'
  | 'mystic' | 'dramatic' | 'nostalgic'

export interface AssetMeta {
  terrain: Terrain[]
  timeOfDay: TimeOfDay[]
  mood: Mood[]
  /** Visual busyness, 1 (whisper) – 5 (loud). Guards against an overcrowded scene. */
  intensity: 1 | 2 | 3 | 4 | 5
  tags: string[]
}

export interface Box { x: number; y: number; w: number; h: number }

/**
 * How an asset is painted. `proc` is the shipped placeholder language; `image`
 * is the drop-in slot for real painted artwork, one asset at a time.
 *
 * `w`/`h` are the source file's own natural pixel dimensions (not where it
 * ends up on screen) — used to fit the image into its category's box
 * (see CATEGORY_BOX in art/palette.ts) without stretching or cropping it,
 * since different paintings of e.g. the same pandal category will have
 * different natural proportions (a tall temple vs. a wide bamboo structure).
 */
export type Art =
  | { kind: 'proc'; draw: (r: Rng, box: Box, scene: SceneContext) => ReactNode }
  | { kind: 'image'; src: string; w: number; h: number }

/** What the rest of the scene looks like, for assets that react to it. */
export interface SceneContext {
  timeOfDay: TimeOfDay
  /** Dominant pigment of the current lighting, for cast-colour on other layers. */
  lightTint: string
  isNight: boolean
  isWet: boolean
  /**
   * Where the light is coming FROM, normalised 0–1 on the canvas (x: left→
   * right, y: top→bottom, so a low sun is a small y). Drives shadow offset/
   * skew and the directional light wash — a single shared value so every
   * grounded object is lit and shadowed consistently, instead of each
   * layer guessing independently.
   */
  light: { x: number; y: number }
}

export interface Asset {
  id: string
  category: CategoryId
  name: string
  subtitle?: string
  /** 2–4 pigments. Drives the placeholder art *and* the option card swatch. */
  palette: string[]
  meta: AssetMeta
  affinity?: { boost?: string[]; avoid?: string[] }
  art?: Art
  /** Soundscape assets only — parameters for the WebAudio synth. */
  sound?: SoundSpec
}

export interface SoundSpec {
  dhak?: number      // 0–1 drum presence
  rain?: number
  water?: number
  wind?: number
  crowd?: number
  bells?: number
  insects?: number
  conch?: number
  /** Base pad tone in Hz, or 0 for none. */
  drone?: number
}

/** A scene is just category → asset id. Small, serialisable, URL-safe. */
export type Scene = Partial<Record<CategoryId, string>>

/**
 * A user's manual nudge on top of the automatic placement — "move it a
 * little left," "make her a bit bigger." `dx`/`dy` are canvas units (the
 * 1000×1500 space), added to the auto-computed ground point; `scale`
 * multiplies the auto-computed size. Anchored at the object's own ground
 * point (see `placeOnGround` in art/palette.ts), so scaling grows an object
 * from where it stands rather than from a corner — resizing a pandal
 * doesn't walk its base off the ground it was just placed on.
 */
export interface LayerAdjust { dx: number; dy: number; scale: number }
/** Which layers can be manually dragged/resized. Pandal/durga go through
 *  the anchor-based `placeOnGround` (see art/palette.ts); lighting, flowers,
 *  decor and ambience are simpler full-layer nudges (see `AdjustableLayer`
 *  in SceneCanvas.tsx) since they're a whole-canvas effect or scatter, not a
 *  single grounded figure. */
export type AdjustableLayerId = 'pandal' | 'durga' | 'lighting' | 'flowers' | 'decor' | 'ambience'
export type SceneAdjust = Partial<Record<AdjustableLayerId, LayerAdjust>>

/**
 * One user-placed small motif — a flower sprig, a lantern, a bird, a diya —
 * "add more, put it where I want, make it whatever size and colour" rather
 * than a single fixed full-canvas scatter. `motif` keys into the `MOTIFS`
 * registry (src/lib/art/motifs.tsx). `color`, when the motif is colorable,
 * is chosen per-instance — "this tree in red, that one in lavender" needs
 * the same motif rendered differently per placement, not a global choice.
 * `x`/`y` are direct canvas coordinates (unlike `LayerAdjust`, there's no
 * "ground point" for a floating flower or light string to anchor to).
 */
export interface ExtraPlacement { id: string; motif: string; x: number; y: number; scale: number; color?: string }

export type MatchLabel =
  | 'PERFECT MATCH' | 'WORKS BEAUTIFULLY' | 'INTERESTING' | 'UNEXPECTED'

export interface ScoredAsset {
  asset: Asset
  score: number
  label: MatchLabel
}

export interface Category {
  id: CategoryId
  index: number
  /** Shown above the picker, e.g. "Where should your Puja live?" */
  question: string
  /** One-word label for the progress rail and Change chips. */
  label: string
  /** Set true for categories the user may skip. */
  optional?: boolean
  assets: Asset[]
}

export interface PublishedWorld {
  id: string
  scene: Scene
  /** The creator's manual pandal/idol placement, if they made one — carried
   *  through publish so the gallery and share cards show what they actually
   *  arranged, not the auto-placement recomputed from scratch. */
  adjust?: SceneAdjust
  /** Any extra flowers/lights the creator placed by hand. */
  extras?: ExtraPlacement[]
  title: string
  nickname: string
  description?: string
  votes: number
  createdAt: number
  /** Vote timestamps within the trending window, for decay scoring. */
  recentVotes: number
  editorsPick?: boolean
  removed?: boolean
  reports?: number
}
