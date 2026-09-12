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

const PAPER = '#F1EBE0'
const INK = '#23201B'
const INK_3 = '#8A8071'

function serialize(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(W))
  clone.setAttribute('height', String(H))
  clone.setAttribute('viewBox', `0 0 ${W} ${H}`)
  // Ambient motion classes have no meaning in a still frame.
  clone.querySelectorAll('.alive').forEach(el => el.classList.remove('alive'))
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

/** Draws `img` into the target rect, cropping to fill and keeping the idol in frame. */
function drawCover(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number, focusY = 0.54,
) {
  const scale = Math.max(dw / img.width, dh / img.height)
  const sw = dw / scale
  const sh = dh / scale
  const sx = (img.width - sw) / 2
  const sy = Math.max(0, Math.min(img.height - sh, img.height * focusY - sh / 2))
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialize(svg))
  const img = await loadImage(svgUrl)

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
  const brand = meta.siteName ?? 'PUJA WORLD 2026'
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
  const file = new File([blob], 'puja-world.png', { type: 'image/png' })
  if (canShareFiles()) {
    try {
      await navigator.share({ files: [file], title: meta.title, text: `${meta.title} — my Puja World 2026`, url })
      return 'shared'
    } catch (err) {
      // AbortError means the user closed the sheet; do not fall back to a download.
      if ((err as Error)?.name === 'AbortError') return 'shared'
    }
  }
  downloadBlob(blob, `puja-world-${meta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.png`)
  return 'downloaded'
}
