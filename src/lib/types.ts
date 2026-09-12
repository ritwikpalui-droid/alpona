import type { ReactNode } from 'react'
import type { Rng } from './rng'

export type CategoryId =
  | 'world' | 'pandal' | 'durga' | 'lighting'
  | 'flowers' | 'decor' | 'sky' | 'ambience' | 'sound'

export type Terrain =
  | 'river' | 'urban' | 'mountain' | 'forest' | 'sea'
  | 'plain' | 'rooftop' | 'interior'

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
