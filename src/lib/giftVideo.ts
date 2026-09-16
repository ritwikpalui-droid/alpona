import {
  artworkRect, clipArtwork, coverFit, drawCover, drawGiftCardChrome, FORMATS, loadArtworkChrome, loadArtworkExtra,
  loadArtworkLayer, PAPER, type ArtworkRect, type CardTemplateId, type GiftCardMeta, type ShareFormat,
} from './export'
import { captureAudioStream, playSound, stopSound } from './audio'
import type { ExtraPlacement, SoundSpec } from './types'

/**
 * The animated gift card. The still "chrome" (sky, world, the pandal/idol,
 * category-level flowers/decor/ambience art) never moves — that art is one
 * asset's whole pre-authored composition (a hut, a full tree, a scatter of
 * many petals) with no per-piece addressability, so an earlier version that
 * rigid-translated the whole group produced "the entire tree slides
 * sideways," which is exactly backwards: nothing in the real world moves
 * like that. Motion here is scoped to what can actually justify it:
 *
 * - Individually PLACED extras (a lantern, a bird, a flower sprig the
 *   creator dropped in with the Elements picker — see `ExtraPlacement`) are
 *   each isolated on their own (`loadArtworkExtra`) and animated according
 *   to their own physical nature (`MOTIF_BEHAVIOR` below) — a lantern
 *   swings on its chain, a bird bobs, a boat rocks on water, a hut doesn't
 *   move at all. One rule per kind of object, not one generic shake.
 * - The Lighting category layer gets a brightness pulse only (never a
 *   translate/rotate — a colour wash sliding around makes no more sense
 *   than a tree doing the same), so a flame/bulb/glow choice reads as
 *   flickering rather than just sitting there.
 *
 * A true `.gif` can't carry sound, and encoding one frame-by-frame in JS is
 * slow and heavy for what is otherwise a few seconds of video — recording
 * straight to WebM (or MP4 where WebM isn't supported) via `MediaRecorder`
 * gets motion AND music in one native, hardware-accelerated pass instead.
 *
 * Performance note: every isolated layer is baked to a plain bitmap ONCE
 * before recording starts, and the per-frame loop only does cheap same-size
 * canvas blits plus a translate/rotate — redrawing filtered SVG images and
 * a full text layout from scratch on every frame was slow enough to starve
 * the browser's own `canvas.captureStream()` frame-grab timer, producing a
 * technically-valid but almost totally empty recording despite the canvas
 * visibly animating on screen the whole time.
 */

export function canRecordVideo(): boolean {
  return typeof window !== 'undefined'
    && typeof MediaRecorder !== 'undefined'
    && typeof HTMLCanvasElement !== 'undefined'
    && typeof (HTMLCanvasElement.prototype as unknown as { captureStream?: unknown }).captureStream === 'function'
}

/** Whether this browser can pull an audio track out of a playing
 *  `<audio>` element — the mechanism behind "add music from your own
 *  file." Chromium and Firefox support it; where it's missing the upload
 *  option simply isn't offered (see the `videoCapable`-style gate in
 *  Reveal.tsx) rather than failing silently mid-recording. */
export function canUseCustomAudioFile(): boolean {
  return typeof window !== 'undefined' && typeof HTMLMediaElement !== 'undefined'
    && typeof (HTMLMediaElement.prototype as unknown as { captureStream?: unknown }).captureStream === 'function'
}

interface MimeChoice { mimeType: string; ext: string }

const CANDIDATES: MimeChoice[] = [
  { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
  { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
  { mimeType: 'video/webm', ext: 'webm' },
  { mimeType: 'video/mp4', ext: 'mp4' },
]

function pickMimeType(): MimeChoice | null {
  for (const c of CANDIDATES) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) return c
  }
  return null
}

export interface GiftVideoResult { blob: Blob; ext: string; mimeType: string }

export interface GiftVideoOptions {
  template?: CardTemplateId
  /** A user-supplied track to use instead of the scene's own synthesised
   *  soundscape. Falls back to `sound` (or silence) if this browser can't
   *  capture audio from a media element — see `canUseCustomAudioFile`. */
  customAudio?: File | null
  /** Where in `customAudio` to start playing, in seconds — the video is
   *  only `GIFT_VIDEO_SECONDS` long, so for anything longer than that the
   *  person picking the track gets to choose which few seconds of it
   *  actually plays, rather than always the very beginning. Ignored (and
   *  harmless) if `customAudio` is shorter than the clip or isn't set. */
  customAudioStartSec?: number
}

const DURATION_MS = 6000
export const GIFT_VIDEO_SECONDS = DURATION_MS / 1000
const FPS = 24

/* ------------------------------------------------------------------ */
/* How each individually-placed motif is allowed to move — one rule per   */
/* object's actual nature, not a generic transform applied to everything. */
/* ------------------------------------------------------------------ */

type MotionKind = 'static' | 'sway' | 'bob' | 'flutter' | 'rock' | 'pendulum'
interface MotifBehavior { motion: MotionKind; blinks: boolean }

/**
 * Keyed on `MOTIFS` ids (src/lib/art/motifs.tsx). `blinks` is independent
 * of `motion` — a diya sits still but its flame flickers; a chandelier
 * both swings AND flickers; a bird moves but never blinks.
 *   - static:   never moves — a fixed structure (hut/house) or a large
 *               rooted one (a whole tree can't rigid-translate credibly)
 *   - sway:     a flexible stem bending in a light breeze — rotates in
 *               place, rooted, never lifts
 *   - bob:      a small creature's light vertical bounce
 *   - flutter:  an erratic two-axis drift (wings)
 *   - rock:     rise/fall plus a slight roll, as if riding water
 *   - pendulum: rotation only around its own hanging point — it never
 *               actually leaves where it's mounted
 */
const MOTIF_BEHAVIOR: Record<string, MotifBehavior> = {
  'flower-sprig': { motion: 'sway', blinks: false },
  'flowering-tree': { motion: 'static', blinks: false },
  'light-string': { motion: 'static', blinks: true },
  lantern: { motion: 'pendulum', blinks: true },
  diya: { motion: 'static', blinks: true },
  bird: { motion: 'bob', blinks: false },
  butterfly: { motion: 'flutter', blinks: false },
  hut: { motion: 'static', blinks: false },
  house: { motion: 'static', blinks: false },
  boat: { motion: 'rock', blinks: false },
  'chandelier-crystal': { motion: 'pendulum', blinks: true },
  'chandelier-brass': { motion: 'pendulum', blinks: true },
  'chandelier-diya': { motion: 'pendulum', blinks: true },
  'chandelier-lanterns': { motion: 'pendulum', blinks: true },
  'chandelier-pendant': { motion: 'pendulum', blinks: true },
}
const DEFAULT_BEHAVIOR: MotifBehavior = { motion: 'static', blinks: false }

function behaviorFor(motif: string): MotifBehavior {
  return MOTIF_BEHAVIOR[motif] ?? DEFAULT_BEHAVIOR
}

/** A stable per-instance phase from a placement's own id, so five lanterns
 *  don't all swing/blink in identical lockstep. */
function seedFrom(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return (hash % 1000) / 1000 * Math.PI * 2
}

interface Pose { dx: number; dy: number; rotate: number }
const IDENTITY_POSE: Pose = { dx: 0, dy: 0, rotate: 0 }
// Rotate is always 0 wherever this is used, so the pivot is mathematically
// irrelevant (translate(p) · rotate(0) · translate(-p) is the identity for
// any p) — a fixed placeholder, not a real anchor point.
const ZERO_PIVOT = { x: 0, y: 0 }

function poseFor(motion: MotionKind, t: number, seed: number): Pose {
  switch (motion) {
    case 'sway': {
      const w = 1.7 + (seed % 1)
      return { dx: Math.sin(t * w + seed) * 5, dy: 0, rotate: Math.sin(t * w + seed) * 0.05 }
    }
    case 'bob': {
      const w = 3.4 + (seed % 1) * 0.6
      return { dx: 0, dy: -Math.abs(Math.sin(t * w + seed)) * 7, rotate: Math.sin(t * w * 0.5 + seed) * 0.025 }
    }
    case 'flutter': {
      const w1 = 3.8 + (seed % 1) * 0.5
      const w2 = 2.6 + (seed % 1) * 0.7
      return { dx: Math.sin(t * w1 + seed) * 8, dy: Math.cos(t * w2 + seed * 1.3) * 6, rotate: Math.sin(t * w1 * 0.7 + seed) * 0.09 }
    }
    case 'rock': {
      const w = 1.1 + (seed % 1) * 0.25
      return { dx: 0, dy: Math.sin(t * w + seed) * 6, rotate: Math.sin(t * w + seed + 0.6) * 0.035 }
    }
    case 'pendulum': {
      const w = 1.25 + (seed % 1) * 0.3
      return { dx: 0, dy: 0, rotate: Math.sin(t * w + seed) * 0.06 }
    }
    case 'static':
    default:
      return IDENTITY_POSE
  }
}

/** Two overlapping frequencies rather than one smooth fade — reads as a
 *  flame/bulb genuinely flickering rather than gently breathing. Swings
 *  most of the way to fully off: several lighting choices (diya, warm
 *  festival, rainy night, spotlight) sit low in the scene, right where the
 *  bottom text scrim is heaviest, which mutes whatever contrast reaches the
 *  final frame — a wide swing here is what still reads as a real flicker
 *  once that scrim has had its say, instead of vanishing into it.
 *
 *  A WEIGHTED SUM of the two 0..1 oscillators, not a product: a product of
 *  two terms that each range 0..1 is bounded below by 0 but, critically,
 *  `0.5 + 0.5·A·B` is bounded BELOW at 0.5 regardless of B whenever A hits
 *  0 — the floor this file used to clamp to below that was dead code, and
 *  the real swing was only ever [0.5, 1]. A sum of the two (each weighted,
 *  weights summing to 1) actually reaches down near 0 when both happen to
 *  be low together, which is what a floor further down can then use. */
function blinkAlpha(t: number, seed: number): number {
  const slow = 0.5 + 0.5 * Math.sin(t * 3.3 + seed)
  const fast = 0.5 + 0.5 * Math.sin(t * 8.7 + seed * 1.7)
  const combined = slow * 0.65 + fast * 0.35
  return 0.12 + 0.88 * combined
}

/** Cover-fits `img` into `rect` on its own `w`×`h` canvas, once — everywhere
 *  outside `rect` (and, for `framed`, outside its rounded inset) stays
 *  transparent. What the per-frame loop actually draws from. */
function bakeLayer(img: HTMLImageElement, rect: ArtworkRect, format: ShareFormat, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const cx = c.getContext('2d')
  if (!cx) throw new Error('Canvas is unavailable in this browser.')
  cx.save()
  clipArtwork(cx, rect)
  drawCover(cx, img, rect.x, rect.y, rect.w, rect.h, format === 'wide' ? 0.48 : 0.5)
  cx.restore()
  return c
}

/** Draws a pre-baked bitmap with a small pose (translate+rotate) around a
 *  given card-space pivot, and an optional alpha — the one shared routine
 *  behind every kind of per-object motion above. */
function drawPosedBitmap(
  ctx: CanvasRenderingContext2D, bitmap: HTMLCanvasElement, pivot: { x: number; y: number }, pose: Pose, alpha = 1,
) {
  ctx.save()
  if (alpha !== 1) ctx.globalAlpha = alpha
  ctx.translate(pivot.x + pose.dx, pivot.y + pose.dy)
  ctx.rotate(pose.rotate)
  ctx.translate(-pivot.x, -pivot.y)
  ctx.drawImage(bitmap, 0, 0)
  ctx.restore()
}

interface BakedExtra {
  bitmap: HTMLCanvasElement
  pivot: { x: number; y: number }
  behavior: MotifBehavior
  seed: number
}

export async function renderGiftVideo(
  svg: SVGSVGElement, format: ShareFormat, meta: GiftCardMeta, extras: ExtraPlacement[],
  sound: SoundSpec | undefined, opts: GiftVideoOptions = {},
): Promise<GiftVideoResult> {
  const mime = pickMimeType()
  if (!mime) throw new Error('This browser cannot record a video.')

  const template = opts.template ?? 'classic'
  const { w, h } = FORMATS[format]
  const rect = artworkRect(w, h, template)
  const focusY = format === 'wide' ? 0.48 : 0.5

  // Rasterise the still background, the lighting wash, and each individually
  // placed extra — all once, up front. Every `serialize*` variant sets the
  // same explicit width/height (see export.ts), so `coverFit` gives the
  // identical mapping regardless of which loaded image it's measured against.
  const [chromeImg, lightingImg, ...extraImgs] = await Promise.all([
    loadArtworkChrome(svg),
    loadArtworkLayer(svg, 'lighting'),
    ...extras.map(p => loadArtworkExtra(svg, p.id)),
  ])

  const chromeBase = bakeLayer(chromeImg, rect, format, w, h)
  const lightingBase = bakeLayer(lightingImg, rect, format, w, h)

  const fit = coverFit(chromeImg, rect.w, rect.h, focusY)
  const sceneToCard = (sx: number, sy: number) => ({ x: rect.x + (sx - fit.sx) * fit.scale, y: rect.y + (sy - fit.sy) * fit.scale })

  const bakedExtras: BakedExtra[] = extras.map((p, i) => ({
    bitmap: bakeLayer(extraImgs[i], rect, format, w, h),
    pivot: sceneToCard(p.x, p.y),
    behavior: behaviorFor(p.motif),
    seed: seedFrom(p.id),
  }))

  const overlay = document.createElement('canvas')
  overlay.width = w
  overlay.height = h
  const overlayCtx = overlay.getContext('2d')
  if (!overlayCtx) throw new Error('Canvas is unavailable in this browser.')
  drawGiftCardChrome(overlayCtx, w, h, format, meta, template, rect)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')

  const stream = (canvas as HTMLCanvasElement & { captureStream(fps?: number): MediaStream }).captureStream(FPS)
  const tracks = stream.getVideoTracks() as MediaStreamTrack[]

  // Custom audio wins outright over the scene's synthesised soundscape —
  // the person picked a specific track, not "also play this."
  let audioEl: HTMLAudioElement | null = null
  let customAudioUrl: string | null = null
  let usingCustomAudio = false
  if (opts.customAudio && canUseCustomAudioFile()) {
    customAudioUrl = URL.createObjectURL(opts.customAudio)
    audioEl = new Audio(customAudioUrl)
    audioEl.loop = true
    try {
      // `currentTime` before metadata has loaded is silently clamped to 0
      // in most browsers — the seek to the chosen start point only sticks
      // once the file's real duration is known.
      await new Promise<void>((resolve, reject) => {
        audioEl!.addEventListener('loadedmetadata', () => resolve(), { once: true })
        audioEl!.addEventListener('error', () => reject(new Error('audio failed to load')), { once: true })
      })
      const start = opts.customAudioStartSec ?? 0
      if (start > 0 && Number.isFinite(audioEl.duration)) {
        audioEl.currentTime = Math.max(0, Math.min(start, Math.max(0, audioEl.duration - 0.25)))
      }
      await audioEl.play()
      usingCustomAudio = true
      tracks.push(...(audioEl as HTMLAudioElement & { captureStream(): MediaStream }).captureStream().getAudioTracks())
    } catch {
      // Playback failed (bad/unsupported file) — fall through to the
      // scene's own soundscape instead of recording a silent video.
      audioEl = null
    }
  }
  const usingSynthSound = !usingCustomAudio
    && !!sound && Object.values(sound).some(v => typeof v === 'number' && v > 0)
  if (usingSynthSound) {
    await playSound(sound)
    tracks.push(...captureAudioStream().getAudioTracks())
  }

  const recorder = new MediaRecorder(new MediaStream(tracks), { mimeType: mime.mimeType })
  const chunks: Blob[] = []
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

  const finished = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve()
    recorder.onerror = () => reject(new Error('Recording failed.'))
  })

  let raf = 0
  const start = performance.now()

  const paint = () => {
    const t = (performance.now() - start) / 1000

    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    clipArtwork(ctx, rect)
    ctx.drawImage(chromeBase, 0, 0)

    for (const e of bakedExtras) {
      const pose = poseFor(e.behavior.motion, t, e.seed)
      const alpha = e.behavior.blinks ? blinkAlpha(t, e.seed) : 1
      drawPosedBitmap(ctx, e.bitmap, e.pivot, pose, alpha)
    }

    // The lighting wash: brightness only, never a translate/rotate — see
    // the file-level note on why a colour wash never "swings."
    drawPosedBitmap(ctx, lightingBase, ZERO_PIVOT, IDENTITY_POSE, blinkAlpha(t, 0))

    ctx.restore() // end clipArtwork

    ctx.drawImage(overlay, 0, 0)

    if (performance.now() - start < DURATION_MS) {
      raf = requestAnimationFrame(paint)
    } else {
      recorder.stop()
    }
  }

  recorder.start()
  raf = requestAnimationFrame(paint)

  try {
    await finished
  } finally {
    cancelAnimationFrame(raf)
    if (usingSynthSound) stopSound()
    if (audioEl) audioEl.pause()
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl)
  }

  return { blob: new Blob(chunks, { type: mime.mimeType }), ext: mime.ext, mimeType: mime.mimeType }
}
