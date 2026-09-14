import type { Box } from '../types'

/**
 * Where the idol goes, INSIDE each pandal — hand-marked by eye against the
 * actual image, normalised 0–1 to that pandal's own `content` bbox (see
 * `AutoAnchors` in anchors.generated.ts). This is the one piece of the
 * placement system that genuinely needs a human (or a careful look) rather
 * than pixel math: "where is the architectural opening" isn't something
 * alpha-channel analysis alone can answer — a solid silhouette and a
 * silhouette-with-a-hole-in-it look identical to a bounding-box computation.
 *
 * Measured consequence of NOT having this: on `terracotta`, the idol
 * (`sabeki`) rendered 2.4× wider than the carved niche and with her feet
 * 30px below its floor — she wasn't standing in the doorway, she was
 * plastered over it. This map is what `slotToCanvas` uses to fix that.
 *
 * Entries below cover the pandals inspected directly. Anything missing
 * falls back to `DEFAULT_SLOT` — a generic centred lower-middle opening,
 * good enough not to look broken, but worth hand-checking before it's
 * treated as final the way the ones below have been.
 */
export const PANDAL_SLOT: Record<string, Box> = {
  terracotta: { x: 0.44, y: 0.30, w: 0.17, h: 0.58 },
  'bengali-temple': { x: 0.24, y: 0.50, w: 0.40, h: 0.40 },
  toran: { x: 0.12, y: 0.32, w: 0.76, h: 0.68 },
  bamboo: { x: 0.26, y: 0.36, w: 0.48, h: 0.35 },
  minimal: { x: 0.18, y: 0.10, w: 0.64, h: 0.78 },
  'royal-palace': { x: 0.40, y: 0.58, w: 0.22, h: 0.42 },
  ruins: { x: 0.26, y: 0.40, w: 0.42, h: 0.55 },
  wooden: { x: 0.28, y: 0.32, w: 0.46, h: 0.58 },
  'zamindar-mansion': { x: 0.35, y: 0.40, w: 0.27, h: 0.46 },
  monastery: { x: 0.34, y: 0.62, w: 0.32, h: 0.34 },
  geometric: { x: 0.30, y: 0.83, w: 0.36, h: 0.17 },
  'floral-structure': { x: 0.30, y: 0.28, w: 0.38, h: 0.38 },
}

export const DEFAULT_SLOT: Box = { x: 0.30, y: 0.50, w: 0.40, h: 0.42 }
