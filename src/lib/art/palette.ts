import type { Box, CategoryId } from '../types'

/** The restrained pigment box. The interface borrows from it; the artwork lives in it. */
export const P = {
  paper: '#F2ECE1',
  paperDeep: '#E6DCC9',
  cream: '#EFE4CE',
  ink: '#2A2621',
  inkSoft: '#5C5346',

  vermilion: '#C0402A',
  red: '#A63528',
  marigold: '#E0912F',
  amber: '#D9A441',
  gold: '#B8913F',

  rose: '#D08C8C',
  pink: '#E0A8AE',

  indigo: '#33415E',
  blue: '#4A6B8A',
  slate: '#7A8699',
  violet: '#6B5B8A',

  teal: '#46786F',
  green: '#5E7A4E',
  moss: '#7A8A5C',

  earth: '#8A6A4F',
  terracotta: '#B36A47',
  clay: '#C08055',
} as const

/** Canvas geometry. Native 9:16 — the share card is not a re-crop. */
export const W = 1000
export const H = 1500
export const HORIZON = 840

/**
 * Where a painted (non-procedural) asset in each category is placed on the
 * 1000×1500 canvas, before being fitted (see `contain` below) to its own
 * aspect ratio within that box. Object-like categories only — world/sky are
 * full-bleed backgrounds handled separately (Layer renders those at 0,0,W,H).
 * These are generous by design: better an artist has room than a cramped box
 * that forces awkward crops. Expect to nudge these once real art exists.
 */
export const CATEGORY_BOX: Partial<Record<CategoryId, Box>> = {
  // Wide and tall: a temple spire needs height, a bamboo structure needs width.
  pandal: { x: 100, y: 260, w: 800, h: 880 },
  // Sits inside/in front of the pandal box, roughly centred, room for a crown
  // and the fan of arms without touching the pandal box's own edges.
  durga: { x: 300, y: 560, w: 400, h: 560 },
  // Flowers/decor/ambience are scattered across the whole frame, not confined
  // to a region — those stay full-canvas, painted with real transparency,
  // whenever their turn comes.
}

/**
 * Fits a `naturalW`×`naturalH` image inside `box` without stretching or
 * cropping it (letterboxed, centred) — the same idea as CSS `object-fit:
 * contain`. Returns the <image> element's own x/y/width/height.
 *
 * Kept as the fallback for any image asset with no `AutoAnchors` entry yet.
 * Its flaw is exactly what `placeOnGround` below exists to fix: it centres
 * the FILE, including whatever transparent padding the source image
 * happens to carry — which is why, measured across the real asset library,
 * idols float 20–140px above the ground by an amount that has nothing to
 * do with the artwork and everything to do with how tightly each Flow
 * generation happened to get cropped.
 */
export function contain(box: Box, naturalW: number, naturalH: number): Box {
  const scale = Math.min(box.w / naturalW, box.h / naturalH)
  const w = naturalW * scale
  const h = naturalH * scale
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h }
}

/**
 * The phone crop. `SceneCanvas`'s outer <svg> is 1000×1500 (2:3) rendered
 * with `preserveAspectRatio="xMidYMid slice"` into whatever aspect ratio
 * the viewport actually is — on a typical phone (~9:19.5) that's NARROWER
 * than 2:3, so the viewBox is scaled to cover the viewport's height and the
 * sides are cropped. Measured: only x∈[153,847] survives on a 390×844
 * screen — 693 of the 1000 canvas units. Anything placed outside this box
 * may exist on the canvas but never actually be seen.
 */
export const SAFE: Box = { x: 180, y: 300, w: 640, h: 900 }

/**
 * Hard cap on a pandal's rendered (painted-content) width. Measured across
 * the current library: 7 of 12 pandals fill 90–100% of the visible frame
 * width, which is the single strongest predictor of "this reads as a
 * sticker on a background" — when the object fills the whole visible
 * width, there is no world left for the eye to place it into. 440px of a
 * ~693px visible frame leaves a third of the world visible on each side.
 */
export const PANDAL_MAX_W = 440

export interface Placement { tx: number; ty: number; s: number }

/**
 * Places an asset by its PAINTED CONTENT and its GROUND-CONTACT FOOT
 * (both measured from the real alpha channel — see `AutoAnchors` in
 * anchors.generated.ts), not by the source file's own W/H. Scales so the
 * content fits within `targetW`×`maxH`, then translates so the foot's
 * centre lands exactly at `(groundCx, groundY)`.
 *
 * This is what makes two idols with different transparent padding stand
 * on the same line, and what makes a "solid slab" pandal and an "open
 * frame" pandal both read as occupying the same plot rather than one of
 * them swallowing it.
 */
export function placeOnGround(
  content: Box, foot: { cx: number; w: number }, naturalW: number, naturalH: number,
  groundCx: number, groundY: number, targetW: number, maxH: number,
  /** A user's manual nudge (see `LayerAdjust` in types.ts). Applied at the
   * GROUND POINT, not as a naive post-multiply on the transform — moving
   * shifts where the object stands, and scaling grows it from that same
   * standing point, so a resize never walks the base off its own ground. */
  adjust?: { dx: number; dy: number; scale: number },
): Placement {
  const contentW = content.w * naturalW
  const contentH = content.h * naturalH
  const s = Math.min(targetW / contentW, maxH / contentH) * (adjust?.scale ?? 1)
  const footX = (content.x + foot.cx * content.w) * naturalW
  const footY = (content.y + content.h) * naturalH
  const gx = groundCx + (adjust?.dx ?? 0)
  const gy = groundY + (adjust?.dy ?? 0)
  return { tx: gx - footX * s, ty: gy - footY * s, s }
}

/** Maps a normalised (0–1, in the PARENT's own content space) rect into
 * canvas coordinates, given the parent's own placement and content box —
 * e.g. a pandal's hand-marked idol "slot" (its architectural opening) → the
 * actual canvas rectangle the idol should be placed into, once the pandal
 * itself has been scaled and translated onto the ground. */
export function slotToCanvas(parent: Placement, content: Box, naturalW: number, naturalH: number, slot: Box): Box {
  const sx = (content.x + slot.x * content.w) * naturalW
  const sy = (content.y + slot.y * content.h) * naturalH
  const sw = slot.w * content.w * naturalW
  const sh = slot.h * content.h * naturalH
  return {
    x: parent.tx + sx * parent.s, y: parent.ty + sy * parent.s,
    w: sw * parent.s, h: sh * parent.s,
  }
}
