import { H, W } from './art/palette'

/**
 * Export happens entirely in the browser: serialise the live SVG, draw it to a
 * canvas, add the card chrome, hand back a PNG. No server render, so a Reel
 * sending 50,000 people at once costs nothing in compute (§37, §38).
 */

export type ShareFormat = 'story' | 'square' | 'wide'

export const FORMATS: Record<ShareFormat, { w: number; h: number; label: string; hint: string }> = {
  story: { w: 1080, h: 1920, label: '9:16', hint: 'Stories, Reels, WhatsApp Status' },
  square: { w: 1080, h: 1080, label: '1:1', hint: 'Instagram, Facebook posts' },
  wide: { w: 1920, h: 1080, label: '16:9', hint: 'Desktop wallpaper, YouTube' },
}

export const PAPER = '#F1EBE0'
const INK = '#23201B'
const INK_3 = '#8A8071'

/** The one whole-category group the gift video still ever isolates as a
 *  block — see `data-anim` in SceneCanvas.tsx. Flowers/decor/ambience used
 *  to be isolatable the same way, but a category layer is one asset's
 *  entire pre-authored composition (a hut, a full tree, a scatter of many
 *  petals) with no per-piece addressability: animating the whole group as
 *  one rigid body meant "the entire tree slides sideways," not "alive."
 *  Only `lighting` is still treated this way, and only for a brightness
 *  pulse (see `renderGiftVideo`) — never a translate/rotate, since a colour
 *  wash sliding or swinging makes no more physical sense than a tree doing
 *  the same. Genuinely independent objects (a lantern, a bird) are
 *  isolated individually instead — see `serializeExtra`/`loadArtworkExtra`. */
export type AnimLayer = 'lighting'

function serialize(svg: SVGSVGElement, opts?: { isolate?: AnimLayer }): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(W))
  clone.setAttribute('height', String(H))
  clone.setAttribute('viewBox', `0 0 ${W} ${H}`)
  // Ambient motion classes have no meaning in a still frame.
  clone.querySelectorAll('.alive').forEach(el => el.classList.remove('alive'))

  if (opts?.isolate) {
    // Keep ONLY the lighting group — remove the still "chrome" too, so
    // this rasterises as a transparent picture of just the lighting wash
    // at its real in-scene position, ready to be pulsed in brightness.
    clone.querySelectorAll('[data-anim]').forEach(el => {
      if (el.getAttribute('data-anim') !== opts.isolate) el.remove()
    })
  }

  // The watercolour filter set (wc-soft/wc-rough/glow/…) lives exactly once,
  // globally, in the root layout — not inside this canvas. A standalone
  // exported SVG can't reach across to a sibling element for its url(#id)
  // references, so without this it would rasterise completely unfiltered.
  // Cloning the shared <defs> into this one self-contained copy is what
  // keeps the exported PNG looking like the on-screen artwork.
  const sharedDefs = document.querySelector('body > svg[aria-hidden] defs')
  if (sharedDefs) {
    clone.insertBefore(sharedDefs.cloneNode(true), clone.firstChild)
  }

  return new XMLSerializer().serializeToString(clone)
}

/** The still "chrome" only — sky, world, the pandal/idol, the atmospheric
 *  washes, and every category-level flowers/decor/ambience layer — with
 *  the lighting layer AND every individually-placed extra (`data-extra-id`
 *  — see `Extra` in SceneCanvas.tsx) removed. This is what the gift video
 *  draws its moving overlays onto; without dropping an extra here first,
 *  a swaying lantern would be baked into the background AND drawn again on
 *  top of itself as it moves, ghosting where it started. */
function serializeChrome(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(W))
  clone.setAttribute('height', String(H))
  clone.setAttribute('viewBox', `0 0 ${W} ${H}`)
  clone.querySelectorAll('.alive').forEach(el => el.classList.remove('alive'))
  clone.querySelectorAll('[data-anim="lighting"], [data-extra-id]').forEach(el => el.remove())
  const sharedDefs = document.querySelector('body > svg[aria-hidden] defs')
  if (sharedDefs) {
    clone.insertBefore(sharedDefs.cloneNode(true), clone.firstChild)
  }
  return new XMLSerializer().serializeToString(clone)
}

/** One individually-placed extra (a lantern, a bird, a flower sprig — see
 *  `ExtraPlacement`), isolated by its own id: transparent everywhere else,
 *  at its real in-scene position. Every OTHER extra and the whole "chrome"
 *  background are removed, so this is safe to nudge/rotate/fade on its own
 *  without disturbing (or duplicating) anything else in the scene. */
function serializeExtra(svg: SVGSVGElement, id: string): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(W))
  clone.setAttribute('height', String(H))
  clone.setAttribute('viewBox', `0 0 ${W} ${H}`)
  clone.querySelectorAll('.alive').forEach(el => el.classList.remove('alive'))
  clone.querySelectorAll('[data-anim]').forEach(el => el.remove())
  clone.querySelectorAll('[data-extra-id]').forEach(el => {
    if (el.getAttribute('data-extra-id') !== id) el.remove()
  })
  const sharedDefs = document.querySelector('body > svg[aria-hidden] defs')
  if (sharedDefs) {
    clone.insertBefore(sharedDefs.cloneNode(true), clone.firstChild)
  }
  return new XMLSerializer().serializeToString(clone)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not rasterise the artwork.'))
    img.src = src
  })
}

export function loadArtwork(svg: SVGSVGElement): Promise<HTMLImageElement> {
  return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialize(svg)))
}

/** See `serializeChrome` — the still background the gift video animates on top of. */
export function loadArtworkChrome(svg: SVGSVGElement): Promise<HTMLImageElement> {
  return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serializeChrome(svg)))
}

/** One isolated, transparent-everywhere-else animated group — see `AnimLayer`. */
export function loadArtworkLayer(svg: SVGSVGElement, layer: AnimLayer): Promise<HTMLImageElement> {
  return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialize(svg, { isolate: layer })))
}

/** See `serializeExtra` — one individually-placed extra, isolated on its own. */
export function loadArtworkExtra(svg: SVGSVGElement, id: string): Promise<HTMLImageElement> {
  return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serializeExtra(svg, id)))
}

/** Greedy word-wrap at the current `ctx.font` — canvas text has no native
 *  wrapping, and a gift message (unlike a title) is long enough to need
 *  more than one line. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word
    if (ctx.measureText(attempt).width <= maxWidth || !line) {
      line = attempt
    } else {
      lines.push(line)
      line = word
      if (lines.length === maxLines - 1) break
    }
  }
  if (line) lines.push(line)
  // Ellipsis on the last line if the message ran longer than the space allows.
  const consumed = lines.join(' ').length
  if (consumed < text.trim().length && lines.length === maxLines) {
    let last = lines[maxLines - 1]
    while (ctx.measureText(last + '…').width > maxWidth && last.length > 1) last = last.slice(0, -1)
    lines[maxLines - 1] = last + '…'
  }
  return lines
}

/** The "cover" fit's own geometry — shared with anything that needs to place
 *  a mark at a specific point of the SOURCE image once it's been cover-fit
 *  into a destination rect (see `sceneToCard` in giftVideo.ts, which uses
 *  this to find where a placed flower/butterfly extra ends up on the card). */
export interface CoverFit { sx: number; sy: number; sw: number; sh: number; scale: number }

export function coverFit(img: { width: number; height: number }, dw: number, dh: number, focusY = 0.54): CoverFit {
  const scale = Math.max(dw / img.width, dh / img.height)
  const sw = dw / scale
  const sh = dh / scale
  const sx = (img.width - sw) / 2
  const sy = Math.max(0, Math.min(img.height - sh, img.height * focusY - sh / 2))
  return { sx, sy, sw, sh, scale }
}

/** Draws `img` into the target rect, cropping to fill and keeping the idol in frame. */
export function drawCover(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number, focusY = 0.54,
) {
  const { sx, sy, sw, sh } = coverFit(img, dw, dh, focusY)
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number, start: number, family: string): number {
  let size = start
  for (;;) {
    ctx.font = `${size}px ${family}`
    if (ctx.measureText(text).width <= max || size <= start * 0.5) return size
    size -= 2
  }
}

export interface CardMeta {
  title: string
  nickname?: string
  votes?: number
  siteName?: string
}

/**
 * The share card. Artwork gets the top 84% of a story card and a plain paper
 * strip carries the title — no branding laid over the picture (§25).
 */
export async function renderShareCard(
  svg: SVGSVGElement, format: ShareFormat, meta: CardMeta,
): Promise<Blob> {
  const { w, h } = FORMATS[format]
  const img = await loadArtwork(svg)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, w, h)

  const stripH = format === 'story' ? 300 : format === 'square' ? 168 : 150
  const artH = h - stripH
  drawCover(ctx, img, 0, 0, w, artH, format === 'wide' ? 0.5 : 0.54)

  // A hairline, not a border — the artwork should not look boxed.
  ctx.fillStyle = 'rgba(35,32,27,0.10)'
  ctx.fillRect(0, artH, w, 1)

  const serif = 'Georgia, "Times New Roman", serif'
  const sans = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  const pad = format === 'wide' ? 56 : 64
  const midY = artH + stripH / 2

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  // Title
  const titleMax = w - pad * 2 - (format === 'story' ? 0 : 260)
  const titleSize = fitText(ctx, meta.title, titleMax, format === 'story' ? 76 : 54, serif)
  ctx.fillStyle = INK
  ctx.font = `${titleSize}px ${serif}`
  ctx.fillText(meta.title, pad, midY + (format === 'story' ? -8 : 6))

  // Byline + votes
  const sub = [meta.nickname ? `by ${meta.nickname}` : null,
    meta.votes != null ? `${meta.votes.toLocaleString('en-IN')} votes` : null]
    .filter(Boolean).join('   ·   ')
  if (sub) {
    ctx.fillStyle = INK_3
    ctx.font = `500 ${format === 'story' ? 32 : 26}px ${sans}`
    ctx.fillText(sub, pad, midY + (format === 'story' ? 48 : 48))
  }

  // Minimal wordmark + CTA, kept to the strip
  const brand = meta.siteName ?? 'ALPONA'
  ctx.font = `500 ${format === 'story' ? 24 : 20}px ${sans}`
  ctx.fillStyle = INK_3
  if (format === 'story') {
    ctx.letterSpacing = '3px'
    ctx.fillText(brand, pad, artH + 64)
    ctx.letterSpacing = '0px'
    const cta = 'Build yours  →'
    ctx.textAlign = 'right'
    ctx.font = `500 28px ${sans}`
    ctx.fillStyle = INK
    const ctaW = ctx.measureText(cta).width
    ctx.fillStyle = 'rgba(35,32,27,0.06)'
    roundRect(ctx, w - pad - ctaW - 44, midY + 6, ctaW + 44, 66, 33)
    ctx.fill()
    ctx.fillStyle = INK
    ctx.fillText(cta, w - pad - 22, midY + 49)
    ctx.textAlign = 'left'
  } else {
    ctx.textAlign = 'right'
    ctx.letterSpacing = '2px'
    ctx.fillText(brand, w - pad, midY - 8)
    ctx.letterSpacing = '0px'
    ctx.font = `500 22px ${sans}`
    ctx.fillStyle = INK
    ctx.fillText('Build yours →', w - pad, midY + 30)
    ctx.textAlign = 'left'
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not create the image.')), 'image/png', 0.94)
  })
}

export interface GiftCardMeta {
  /** The card's own headline — e.g. "Shubho Bijoya" — printed above the
   *  message. Empty for the occasion-less "Just Because" card. */
  greeting: string
  recipient?: string
  message: string
  from?: string
}

export type CardTemplateId = 'classic' | 'framed' | 'royal'

export const CARD_TEMPLATES: { id: CardTemplateId; label: string; hint: string }[] = [
  { id: 'classic', label: 'Classic', hint: 'Full-bleed art, the message set right over it' },
  { id: 'framed', label: 'Framed', hint: 'A bordered keepsake photograph, gold double rule' },
  { id: 'royal', label: 'Golden', hint: 'A gilded ornamental border, greeting centred' },
]

export interface ArtworkRect { x: number; y: number; w: number; h: number; radius: number }

/** Where the photo itself sits for a given template — full-bleed for
 *  `classic`/`royal`, a bordered inset for `framed`. Shared by the still
 *  card and every frame of the animated one, so the photo and anything
 *  that has to line up with it (the swaying/blinking overlays in
 *  giftVideo.ts) agree on exactly the same rectangle. */
export function artworkRect(w: number, h: number, template: CardTemplateId): ArtworkRect {
  if (template === 'framed') {
    const m = Math.round(Math.min(w, h) * 0.055)
    return { x: m, y: m, w: w - m * 2, h: h - m * 2, radius: Math.round(m * 0.4) }
  }
  return { x: 0, y: 0, w, h, radius: 0 }
}

/** Clips subsequent drawing to the photo rect — a plain rectangle for the
 *  full-bleed templates, a rounded inset for `framed`. Caller owns the
 *  save/restore around this. */
export function clipArtwork(ctx: CanvasRenderingContext2D, rect: ArtworkRect) {
  ctx.beginPath()
  if (rect.radius) roundRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.radius)
  else ctx.rect(rect.x, rect.y, rect.w, rect.h)
  ctx.clip()
}

/** The gilded frame each template draws around its photo — nothing for
 *  `classic`, a tight double gold rule hugging the inset for `framed`, a
 *  wider ornamental double rule near the card's own edge for `royal`.
 *  Drawn AFTER the photo (and, in the video, every animated overlay), so
 *  it sits crisp on top instead of half-buried under the next layer. */
function paintArtworkBorder(ctx: CanvasRenderingContext2D, w: number, h: number, rect: ArtworkRect, template: CardTemplateId) {
  const gold = '#D9A441'
  if (template === 'framed') {
    ctx.save()
    ctx.strokeStyle = gold
    ctx.globalAlpha = 0.9
    ctx.lineWidth = 3
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.radius)
    ctx.stroke()
    ctx.globalAlpha = 0.4
    ctx.lineWidth = 1
    roundRect(ctx, rect.x - 8, rect.y - 8, rect.w + 16, rect.h + 16, rect.radius + 6)
    ctx.stroke()
    ctx.restore()
  } else if (template === 'royal') {
    const inset = Math.round(Math.min(w, h) * 0.032)
    ctx.save()
    ctx.strokeStyle = gold
    ctx.globalAlpha = 0.85
    ctx.lineWidth = 4
    roundRect(ctx, inset, inset, w - inset * 2, h - inset * 2, 20)
    ctx.stroke()
    ctx.globalAlpha = 0.45
    ctx.lineWidth = 1.5
    roundRect(ctx, inset + 11, inset + 11, w - (inset + 11) * 2, h - (inset + 11) * 2, 13)
    ctx.stroke()
    ctx.restore()
  }
}

/** A single wavy stroke, not a ruler-straight rule — the same "a hand drew
 *  this" idea every procedural asset in the app already uses, just done in
 *  plain canvas since the export pipeline doesn't have SVG Ink/Wash to call. */
function wobblyLine(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, amp: number, color: string, width: number, opacity: number) {
  const n = 8
  ctx.beginPath()
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const x = x0 + (x1 - x0) * t
    const yy = y + Math.sin(t * Math.PI * 2.4 + 1.1) * amp + Math.sin(t * Math.PI * 5.3) * amp * 0.3
    if (i === 0) ctx.moveTo(x, yy)
    else ctx.lineTo(x, yy)
  }
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = opacity
  ctx.stroke()
  ctx.restore()
}

/** A photo-corner bracket — a small L opening toward the card's centre. */
function cornerMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, dx: 1 | -1, dy: 1 | -1, color: string, opacity: number) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x, y + size * dy)
  ctx.lineTo(x, y)
  ctx.lineTo(x + size * dx, y)
  ctx.strokeStyle = color
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.globalAlpha = opacity
  ctx.stroke()
  ctx.restore()
}

/** A tiny six-petal marigold mark — a full Bloom would need the SVG
 *  primitives; this is the same gesture in six filled arcs. */
function marigoldMark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, opacity: number) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = color
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    ctx.beginPath()
    ctx.ellipse(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.55, r * 0.32, a, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(x, y, r * 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * The gift card — full-bleed artwork with the message set directly over it
 * under a soft scrim, photo-corner marks, and a hand-wobbled rule, instead
 * of a photo pasted above a flat caption strip (the "very regular" template
 * this replaces, which was the gallery share card's own layout in different
 * words). No "Build yours" pitch here — the point of this one is the
 * person receiving it, not the person who made it. `template` picks one of
 * `CARD_TEMPLATES` — see `artworkRect`/`drawGiftCardChrome` for what
 * actually differs between them.
 */
export async function renderGiftCard(
  svg: SVGSVGElement, format: ShareFormat, meta: GiftCardMeta, template: CardTemplateId = 'classic',
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  drawGiftCardFrame(canvas, format, await loadArtwork(svg), meta, template)
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not create the image.')), 'image/png', 0.94)
  })
}

/**
 * The still-card orchestrator: paint the one flattened photo into its
 * template's rect, then hand off to `drawGiftCardChrome` for the border,
 * scrim, and text. The animated video (see `renderGiftVideo`) doesn't call
 * this directly — it paints several images (a still "chrome" background
 * plus the swaying/blinking overlays) into the same rect itself, then
 * calls `drawGiftCardChrome` too, so both end up with an identical frame.
 */
export function drawGiftCardFrame(
  canvas: HTMLCanvasElement, format: ShareFormat, img: HTMLImageElement,
  meta: GiftCardMeta, template: CardTemplateId = 'classic',
): CanvasRenderingContext2D {
  const { w, h } = FORMATS[format]
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, w, h)

  const rect = artworkRect(w, h, template)
  ctx.save()
  clipArtwork(ctx, rect)
  drawCover(ctx, img, rect.x, rect.y, rect.w, rect.h, format === 'wide' ? 0.48 : 0.5)
  ctx.restore()

  drawGiftCardChrome(ctx, w, h, format, meta, template, rect)
  return ctx
}

/**
 * Everything on top of the photo: the border for this template (nothing for
 * `classic`), the scrim the message sits on, the corner ornaments, and the
 * greeting/recipient/message/signature/credit text — `classic`/`framed`
 * left-aligned in a bottom scrim, `royal` centred inside its own wider
 * gilded border. Shared by the still card and every frame of the video.
 */
export function drawGiftCardChrome(
  ctx: CanvasRenderingContext2D, w: number, h: number, format: ShareFormat,
  meta: GiftCardMeta, template: CardTemplateId, rect: ArtworkRect,
) {
  const gold = '#D9A441'
  const serif = 'Georgia, "Times New Roman", serif'
  const sans = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  const paperText = '#F4EEE2'
  const paperDim = 'rgba(244,238,226,0.72)'
  const centered = template === 'royal'

  // The scrim the message sits on, sized to the PHOTO rect — for `framed`
  // that's only the bottom of the inset, not the paper margin around it.
  const scrimTop = rect.y + rect.h * (format === 'wide' ? 0.42 : 0.5)
  const scrim = ctx.createLinearGradient(0, scrimTop, 0, rect.y + rect.h)
  scrim.addColorStop(0, 'rgba(20,17,12,0)')
  scrim.addColorStop(0.45, 'rgba(20,17,12,0.42)')
  scrim.addColorStop(1, 'rgba(20,17,12,0.86)')
  const topVignette = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h * 0.16)
  topVignette.addColorStop(0, 'rgba(20,17,12,0.28)')
  topVignette.addColorStop(1, 'rgba(20,17,12,0)')

  ctx.save()
  clipArtwork(ctx, rect)
  ctx.fillStyle = scrim
  ctx.fillRect(rect.x, scrimTop, rect.w, rect.y + rect.h - scrimTop)
  ctx.fillStyle = topVignette
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h * 0.16)
  ctx.restore()

  paintArtworkBorder(ctx, w, h, rect, template)

  const basePad = format === 'wide' ? 72 : 68
  const pad = rect.x + basePad
  const textW = rect.w - basePad * 2

  if (centered) {
    // Marigold ornaments at the card's own corners, outside the wider
    // `royal` border, instead of the plain L-brackets the other two use
    // right at the photo edge.
    const r = format === 'wide' ? 12 : 10
    const om = Math.round(Math.min(w, h) * 0.032) + 20
    marigoldMark(ctx, om, om, r, gold, 0.85)
    marigoldMark(ctx, w - om, om, r, gold, 0.85)
    marigoldMark(ctx, om, h - om, r, gold, 0.7)
    marigoldMark(ctx, w - om, h - om, r, gold, 0.7)
  } else {
    // Photo-corner marks — a frame, not a border.
    const cs = format === 'wide' ? 44 : 40
    const cm = format === 'wide' ? 30 : 26
    cornerMark(ctx, rect.x + cm, rect.y + cm, cs, 1, 1, paperText, 0.55)
    cornerMark(ctx, rect.x + rect.w - cm, rect.y + cm, cs, -1, 1, paperText, 0.55)
    cornerMark(ctx, rect.x + cm, rect.y + rect.h - cm, cs, 1, -1, paperText, 0.4)
    cornerMark(ctx, rect.x + rect.w - cm, rect.y + rect.h - cm, cs, -1, -1, paperText, 0.4)
  }

  let y = rect.y + rect.h - (format === 'story' ? 430 : format === 'square' ? 290 : 250)
  const tx = centered ? rect.x + rect.w / 2 : pad

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = centered ? 'center' : 'left'

  if (meta.greeting) {
    const greetSize = format === 'story' ? 60 : format === 'square' ? 46 : 42
    ctx.fillStyle = paperText
    ctx.font = `${centered ? '600 ' : ''}${greetSize}px ${serif}`
    ctx.fillText(meta.greeting, tx, y)
    y += greetSize * 0.42
    const lineW = Math.min(220, textW * 0.28)
    wobblyLine(ctx, centered ? tx - lineW / 2 : pad, centered ? tx + lineW / 2 : pad + lineW, y, 3, gold, 2.4, 0.7)
    y += format === 'story' ? 46 : 34
  }

  if (meta.recipient) {
    const forSize = format === 'story' ? 27 : 23
    ctx.fillStyle = gold
    ctx.font = `600 ${forSize}px ${sans}`
    ctx.fillText(`For ${meta.recipient}`, tx, y)
    y += forSize + (format === 'story' ? 28 : 20)
  }

  const msgSize = format === 'story' ? 33 : format === 'square' ? 28 : 26
  const lineHeight = msgSize * 1.48
  ctx.font = `${msgSize}px ${sans}`
  ctx.fillStyle = paperText
  const maxLines = format === 'wide' ? 2 : format === 'story' ? 4 : 3
  const lines = wrapText(ctx, meta.message, textW, maxLines)
  for (const line of lines) {
    ctx.fillText(line, tx, y)
    y += lineHeight
  }

  if (meta.from) {
    y += format === 'story' ? 16 : 10
    if (centered) {
      ctx.font = `italic ${format === 'story' ? 27 : 23}px ${serif}`
      ctx.fillStyle = paperDim
      ctx.fillText(`— ${meta.from}`, tx, y)
    } else {
      marigoldMark(ctx, pad + 8, y - 8, 7, gold, 0.8)
      ctx.font = `italic ${format === 'story' ? 27 : 23}px ${serif}`
      ctx.fillStyle = paperDim
      ctx.fillText(`— ${meta.from}`, pad + 28, y)
    }
  }

  // A small, deliberately quiet credit — this card is for the recipient,
  // not a growth-loop CTA the way the gallery share card's is.
  ctx.font = `500 ${format === 'story' ? 17 : 14}px ${sans}`
  ctx.fillStyle = paperDim
  ctx.textAlign = centered ? 'center' : 'right'
  ctx.letterSpacing = '1.5px'
  ctx.fillText('ALPONA', centered ? tx : rect.x + rect.w - basePad, rect.y + rect.h - (format === 'story' ? 40 : 28))
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'left'
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false
  try {
    return navigator.canShare({ files: [new File([new Blob(['x'])], 'x.png', { type: 'image/png' })] })
  } catch { return false }
}

/** Native share sheet where available — that is the whole growth loop on mobile. */
export async function shareCard(blob: Blob, meta: CardMeta, url?: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], 'alpona.png', { type: 'image/png' })
  if (canShareFiles()) {
    try {
      await navigator.share({ files: [file], title: meta.title, text: `${meta.title} — my Alpona`, url })
      return 'shared'
    } catch (err) {
      // AbortError means the user closed the sheet; do not fall back to a download.
      if ((err as Error)?.name === 'AbortError') return 'shared'
    }
  }
  downloadBlob(blob, `alpona-${meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.png`)
  return 'downloaded'
}

/** Same idea as `shareCard`, but for a gift card — the share sheet's own
 *  title/text should read as "a card for someone," not "look what I made." */
export function giftCardFilename(meta: GiftCardMeta, ext: string): string {
  const slug = (meta.recipient || meta.greeting || 'card').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  return `alpona-card-${slug}.${ext}`
}

/**
 * Opens the native share sheet directly — Instagram, WhatsApp, Facebook and
 * whatever else is installed all show up there as targets already, since
 * they each register as a share target for images/video on the device.
 * There's no web API that hands a raw file to one specific app by name
 * (and no public link for a gift card to build a "share to WhatsApp" web
 * intent around, the way the published gallery card can) — the OS picker
 * *is* the "choose where this goes" step. Throws instead of silently
 * downloading, so the caller can offer an explicit, separate Save action
 * rather than the two being conflated into one button.
 */
export async function shareGiftCard(blob: Blob, meta: GiftCardMeta, ext: string): Promise<void> {
  const file = new File([blob], giftCardFilename(meta, ext), { type: blob.type || 'image/png' })
  if (!canShareFiles() || !navigator.canShare({ files: [file] })) {
    throw new Error('Sharing directly isn’t available on this device — try Save instead.')
  }
  const title = meta.recipient ? `A card for ${meta.recipient}` : (meta.greeting || 'An Alpona card')
  try {
    await navigator.share({ files: [file], title, text: meta.message })
  } catch (err) {
    // AbortError just means the user closed the sheet without picking anything.
    if ((err as Error)?.name === 'AbortError') return
    // Some mobile browsers reject `share()` itself for a video file even
    // after `canShare()` said yes (seen as a bare "Permission denied" —
    // that's the browser's own DOMException message, not anything this app
    // wrote). Re-throwing the raw error surfaced that exact confusing
    // native text to the person sharing; wrapping it means they always see
    // something they can act on instead.
    throw new Error('Couldn’t open the share sheet for this — try Save instead.')
  }
}
