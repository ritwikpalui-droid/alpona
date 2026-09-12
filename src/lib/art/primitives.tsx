import { useId, type ReactNode } from 'react'
import type { Rng } from '../rng'

/* ------------------------------------------------------------------ *
 * Geometry
 * ------------------------------------------------------------------ */

export type Pt = [number, number]

/** Catmull-Rom through the points, emitted as cubic béziers. Closed or open. */
export function smooth(pts: Pt[], close = false): string {
  if (pts.length < 2) return ''
  const p = close ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]]
  let d = `M ${p[1][0].toFixed(1)} ${p[1][1].toFixed(1)}`
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2]
    const c1x = x1 + (x2 - x0) / 6, c1y = y1 + (y2 - y0) / 6
    const c2x = x2 - (x3 - x1) / 6, c2y = y2 - (y3 - y1) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  return close ? d + ' Z' : d
}

/**
 * An organic closed shape — the workhorse. Never a perfect ellipse: radii wobble
 * point to point, which is what stops the scene reading as vector clip-art.
 */
export function blob(r: Rng, cx: number, cy: number, rx: number, ry: number, sides = 9, wobble = 0.2): string {
  const pts: Pt[] = []
  const start = r() * Math.PI * 2
  for (let i = 0; i < sides; i++) {
    const a = start + (i / sides) * Math.PI * 2 + r.jitter(0.12)
    const k = 1 + r.jitter(wobble)
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k])
  }
  return smooth(pts, true)
}

/** A ridge / bank / horizon: a wandering line between two x positions. */
export function ridge(r: Rng, x1: number, x2: number, y: number, amp: number, steps = 7): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push([x1 + (x2 - x1) * t, y + r.jitter(amp) - Math.sin(t * Math.PI) * amp * 0.4])
  }
  return pts
}

/* ------------------------------------------------------------------ *
 * Painting primitives
 *
 * Every asset in the catalogue is built from these three. That is what
 * makes a mountain and a shiuli flower look painted by the same hand —
 * coherence is structural, not a matter of remembering to be consistent.
 * ------------------------------------------------------------------ */

interface WashProps {
  d: string
  color: string
  /** Pigment strength. Real watercolour rarely exceeds ~0.7 in a single pass. */
  opacity?: number
  /** Dries darker at the rim, like a real wash pooling as it sets. */
  rim?: boolean
  children?: ReactNode
}

export function Wash({ d, color, opacity = 0.42, rim = true }: WashProps) {
  return (
    <>
      <path d={d} fill={color} opacity={opacity} />
      {rim && (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
          opacity={Math.min(0.55, opacity + 0.18)}
          strokeLinejoin="round"
        />
      )}
    </>
  )
}

/**
 * A second, offset pass of the same pigment. Where two washes overlap the
 * colour deepens — the granulation that separates watercolour from flat fill.
 */
export function Pool({ r, cx, cy, rx, ry, color, opacity = 0.3 }: {
  r: Rng; cx: number; cy: number; rx: number; ry: number; color: string; opacity?: number
}) {
  return <path d={blob(r, cx, cy, rx, ry, 7, 0.3)} fill={color} opacity={opacity} />
}

/**
 * Charcoal contour. Drawn twice with independent wobble at low opacity, which
 * reads as a searching hand-drawn line rather than a traced outline.
 */
export function Ink({ pts, close = false, width = 2.2, opacity = 0.62, color = '#2A2621', r }: {
  pts: Pt[]; close?: boolean; width?: number; opacity?: number; color?: string; r: Rng
}) {
  const pass = (amt: number) => smooth(pts.map(([x, y]) => [x + r.jitter(amt), y + r.jitter(amt)] as Pt), close)
  return (
    <g stroke={color} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={pass(1.6)} strokeWidth={width} opacity={opacity} />
      <path d={pass(2.6)} strokeWidth={width * 0.6} opacity={opacity * 0.45} />
    </g>
  )
}

/** Pigment granules — the dust a loaded brush drops. Cheap, adds a lot. */
export function Specks({ r, box, n = 14, color, size = 3, opacity = 0.3 }: {
  r: Rng; box: { x: number; y: number; w: number; h: number }
  n?: number; color: string; size?: number; opacity?: number
}) {
  return (
    <g fill={color} opacity={opacity}>
      {Array.from({ length: n }, (_, i) => (
        <circle
          key={i}
          cx={box.x + r() * box.w}
          cy={box.y + r() * box.h}
          r={r.range(size * 0.3, size)}
        />
      ))}
    </g>
  )
}

/* ------------------------------------------------------------------ *
 * Shared filter set
 *
 * Filters are applied to whole LAYERS, never to individual paths — one
 * turbulence pass per layer instead of one per blob. That is the
 * difference between smooth and janky on a mid-range Android.
 * ------------------------------------------------------------------ */

export const EDGE = {
  soft: 'url(#wc-soft)',
  rough: 'url(#wc-rough)',
  none: undefined,
} as const

export function ArtDefs() {
  return (
    <defs>
      {/* Gentle bleed — idols, architecture, anything that needs to stay legible */}
      <filter id="wc-soft" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves={3} seed={7} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={7} xChannelSelector="R" yChannelSelector="G" />
      </filter>

      {/* Loose bleed — skies, foliage, water, anything that should feel wet */}
      <filter id="wc-rough" x="-18%" y="-18%" width="136%" height="136%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.017" numOctaves={4} seed={19} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={18} xChannelSelector="R" yChannelSelector="G" />
      </filter>

      {/* Cold-press paper tooth, laid over the finished scene */}
      <filter id="paper-grain" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={4} seed={3} />
        <feColorMatrix type="saturate" values="0" />
      </filter>

      {/* Soft halo for lamps, moon, fireflies */}
      <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <filter id="glow-tight" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
      <filter id="blur-lg" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="26" />
      </filter>
    </defs>
  )
}

/** The paper the whole thing is painted on. */
export function Paper({ tone = '#F2ECE1' }: { tone?: string }) {
  return (
    <>
      <rect width="1000" height="1500" fill={tone} />
      <rect width="1000" height="1500" filter="url(#paper-grain)" opacity={0.05} style={{ mixBlendMode: 'multiply' }} />
    </>
  )
}

/**
 * Warm bloom at the edges — the way a wet sheet stains toward its border.
 *
 * The gradient id is per-instance (via useId): `strength` and `color` vary
 * with the scene, so when several SceneCanvases share one page — an option
 * rail, a gallery grid — a fixed id would mean every instance renders with
 * whichever vignette happened to land first in the DOM.
 */
export function Vignette({ color = '#5A4A38', strength = 0.16 }: { color?: string; strength?: number }) {
  const id = `vig-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <>
      <defs>
        <radialGradient id={id} cx="50%" cy="46%" r="72%">
          <stop offset="55%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity={strength} />
        </radialGradient>
      </defs>
      <rect width="1000" height="1500" fill={`url(#${id})`} style={{ mixBlendMode: 'multiply' }} />
    </>
  )
}
