import type { Rng } from '../rng'
import { blob, Ink, ridge, smooth, Specks, Wash, type Pt } from './primitives'
import { P, W } from './palette'

/** Flat earth plane below the horizon. */
export function Ground({ r, y, color, second }: { r: Rng; y: number; color: string; second?: string }) {
  const top = ridge(r, -40, W + 40, y, 14, 9)
  const d = smooth([...top, [W + 40, 1540], [-40, 1540]] as Pt[], true)
  return (
    <g>
      <Wash d={d} color={color} opacity={0.36} />
      {second && <Wash d={blob(r, 500, y + 260, 560, 150, 9, 0.28)} color={second} opacity={0.2} rim={false} />}
      <Ink pts={top} r={r} width={2} opacity={0.32} />
    </g>
  )
}

/** Still water with a few broken highlight strokes. Reads wet without shine. */
export function Water({ r, y, color, glint = P.cream }: { r: Rng; y: number; color: string; glint?: string }) {
  const top = ridge(r, -40, W + 40, y, 7, 11)
  const d = smooth([...top, [W + 40, 1540], [-40, 1540]] as Pt[], true)
  const lines = Array.from({ length: 9 }, (_, i) => {
    const ly = y + 30 + i * i * 4.2 + r.jitter(8)
    const x1 = r.range(40, 420), x2 = x1 + r.range(160, 420)
    return { ly, x1, x2, o: 0.34 - i * 0.03 }
  })
  return (
    <g>
      <Wash d={d} color={color} opacity={0.34} />
      <Wash d={smooth([...ridge(r, -40, W + 40, y + 170, 20, 7), [W + 40, 1540], [-40, 1540]] as Pt[], true)}
        color={color} opacity={0.18} rim={false} />
      <g stroke={glint} strokeLinecap="round" fill="none">
        {lines.map((l, i) => (
          <path key={i} d={smooth(ridge(r, l.x1, l.x2, l.ly, 3, 4))} strokeWidth={r.range(2, 5)} opacity={Math.max(0.08, l.o)} />
        ))}
      </g>
    </g>
  )
}

/** Vertical smear under an object — how lamplight breaks up on moving water. */
export function Reflection({ r, x, y, w, h, color, opacity = 0.22 }: {
  r: Rng; x: number; y: number; w: number; h: number; color: string; opacity?: number
}) {
  return (
    <g opacity={opacity}>
      {Array.from({ length: 10 }, (_, i) => {
        const ly = y + (i / 10) * h
        const shrink = 1 - i / 16
        return (
          <path key={i} d={smooth(ridge(r, x + (w * (1 - shrink)) / 2, x + w - (w * (1 - shrink)) / 2, ly, 4, 3))}
            stroke={color} strokeWidth={h / 14} fill="none" strokeLinecap="round" opacity={1 - i / 12} />
        )
      })}
    </g>
  )
}

/** Layered ranges — near peaks darker, far peaks nearly dissolved. */
export function Peaks({ r, y, colors, snow }: { r: Rng; y: number; colors: string[]; snow?: boolean }) {
  return (
    <g>
      {colors.map((c, layer) => {
        const lr = r.fork('peak' + layer)
        const base = y + layer * 46
        const n = 3 + layer
        const pts: Pt[] = [[-60, base + 60]]
        for (let i = 0; i < n; i++) {
          const cx = -40 + ((i + 0.5) / n) * (W + 80) + lr.jitter(60)
          const h = lr.range(160, 330) - layer * 30
          pts.push([cx - lr.range(90, 170), base + lr.jitter(16)])
          pts.push([cx + lr.jitter(14), base - h])
          pts.push([cx + lr.range(90, 170), base + lr.jitter(16)])
        }
        pts.push([W + 60, base + 60])
        const d = smooth([...pts, [W + 60, 1540], [-60, 1540]] as Pt[], true)
        return (
          <g key={layer}>
            <Wash d={d} color={c} opacity={0.3 - layer * 0.05} />
            {layer === colors.length - 1 && <Ink pts={pts} r={lr} width={2} opacity={0.3} />}
            {snow && layer === colors.length - 1 && (
              <g fill={P.paper} opacity={0.5}>
                {pts.filter((_, i) => i % 3 === 2).map(([px, py], i) => (
                  <path key={i} d={blob(lr, px, py + 34, 44, 26, 7, 0.4)} />
                ))}
              </g>
            )}
          </g>
        )
      })}
    </g>
  )
}

/** A stand of trees. Canopy is three overlapping washes so pigment pools. */
export function Trees({ r, x1, x2, baseY, n = 6, canopy, trunk = P.earth, scale = 1 }: {
  r: Rng; x1: number; x2: number; baseY: number; n?: number; canopy: string[]; trunk?: string; scale?: number
}) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const tr = r.fork('tree' + i)
        const x = x1 + ((i + 0.5) / n) * (x2 - x1) + tr.jitter(40)
        const s = scale * tr.range(0.75, 1.25)
        const y = baseY + tr.jitter(18)
        const th = 130 * s
        return (
          <g key={i}>
            <path d={`M ${x} ${y} L ${x + tr.jitter(8)} ${y - th}`} stroke={trunk} strokeWidth={9 * s} opacity={0.5} strokeLinecap="round" />
            {canopy.map((c, ci) => (
              <path key={ci}
                d={blob(tr.fork('c' + ci), x + tr.jitter(26), y - th - 26 * s + ci * 12 * s, (86 - ci * 12) * s, (66 - ci * 10) * s, 8, 0.34)}
                fill={c} opacity={0.34 - ci * 0.06} />
            ))}
          </g>
        )
      })}
    </g>
  )
}

/** City block silhouettes with pin-prick windows. Never drawn in perspective. */
export function Buildings({ r, x1, x2, baseY, color, maxH = 300, n = 9, windows = true, windowColor = P.amber }: {
  r: Rng; x1: number; x2: number; baseY: number; color: string; maxH?: number; n?: number
  windows?: boolean; windowColor?: string
}) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const br = r.fork('bld' + i)
        const bw = ((x2 - x1) / n) * br.range(0.85, 1.3)
        const x = x1 + (i / n) * (x2 - x1) + br.jitter(10)
        const h = maxH * br.range(0.42, 1)
        const top = baseY - h
        const pts: Pt[] = [[x, baseY], [x + br.jitter(3), top], [x + bw + br.jitter(3), top + br.jitter(10)], [x + bw, baseY]]
        return (
          <g key={i}>
            <path d={smooth(pts, true)} fill={color} opacity={0.34} />
            <Ink pts={pts} r={br} width={1.8} opacity={0.34} />
            {windows && (
              <g fill={windowColor} opacity={0.62}>
                {Array.from({ length: br.int(3, 8) }, (_, w) => (
                  <rect key={w} x={x + br.range(10, bw - 24)} y={top + br.range(18, h - 30)}
                    width={br.range(9, 15)} height={br.range(11, 18)} rx={2} />
                ))}
              </g>
            )}
          </g>
        )
      })}
    </g>
  )
}

/** Broad descending steps — a ghat. */
export function Steps({ r, y, color, n = 7 }: { r: Rng; y: number; color: string; n?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const sr = r.fork('step' + i)
        const sy = y + i * 30
        const inset = i * 26
        const pts = ridge(sr, 90 + inset * 0.4, W - 90 - inset * 0.4, sy, 4, 5)
        return (
          <g key={i}>
            <path d={smooth([...pts, [pts[pts.length - 1][0], sy + 30], [pts[0][0], sy + 30]] as Pt[], true)}
              fill={color} opacity={0.2 + (i % 2) * 0.07} />
            <Ink pts={pts} r={sr} width={1.7} opacity={0.26} />
          </g>
        )
      })}
    </g>
  )
}

export function Mist({ r, y, h = 200, color = '#FFFFFF', opacity = 0.5 }: {
  r: Rng; y: number; h?: number; color?: string; opacity?: number
}) {
  return (
    <g opacity={opacity}>
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={blob(r.fork('mist' + i), r.range(150, 850), y + r.jitter(h / 2), r.range(260, 460), r.range(38, 76), 9, 0.4)}
          fill={color} opacity={0.34} />
      ))}
    </g>
  )
}

export { Specks }
