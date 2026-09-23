import type { ReactNode } from 'react'
import type { Rng } from '../rng'
import { blob, Specks } from '../art/primitives'

/**
 * A chocolate box style. Unlike a bouquet holder, a box is NOT naturally
 * viewed from any angle — its front/side/lid faces genuinely appear and
 * disappear as it turns (see the file-level note in `ChocolateBoxView.tsx`
 * for why this stays a bounded wobble, not a full spin). `draw` returns the
 * decorative content for each of the box's three faces at local (0,0)-
 * centred coordinates sized to `BOX_W`×`BOX_H`×`BOX_D` — the geometry
 * (face shapes, perspective skew) lives in the shared view component, not
 * here; a "style" is only ever what's painted ON the faces (ribbon,
 * pattern, seal), so every style drops into the same box shape.
 *
 * Faces are plain `<rect>`s with their own `stroke`, not `Ink`/`smooth()` —
 * a manufactured box is supposed to look crisp-cornered, and `smooth()`'s
 * Catmull-Rom spline bulges a 4-point rectangle into a rounded blob with
 * nothing to keep its corners sharp (the same bug this session's Venice
 * facades hit, for the same reason — `Ink` is for organic hand-drawn
 * wobble, not rectangles).
 */
export interface GiftBox {
  id: string
  name: string
  swatch: string
  draw: (r: Rng, color: string) => {
    /** Drawn on the front face, local coords centred on that face. */
    front: ReactNode
    /** Drawn on the lid's top face, local coords centred on the lid. */
    lid: ReactNode
  }
}

export const BOX_W = 220
export const BOX_H = 130
export const BOX_D = 70

export const boxes: GiftBox[] = [
  {
    id: 'classic',
    name: 'Classic Bow',
    swatch: '#B0392A',
    draw: (_r, color) => {
      const front = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_H / 2} width={BOX_W} height={BOX_H}
            fill={color} opacity={0.5} stroke="#5C4A36" strokeWidth={2} strokeOpacity={0.42} />
          {/* vertical ribbon band, front face only */}
          <rect x={-10} y={-BOX_H / 2} width={20} height={BOX_H} fill="#F2ECE1" opacity={0.7} />
        </g>
      )
      const lid = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_D / 2} width={BOX_W} height={BOX_D}
            fill={color} opacity={0.56} stroke="#5C4A36" strokeWidth={2} strokeOpacity={0.42} />
          <rect x={-10} y={-BOX_D / 2} width={20} height={BOX_D} fill="#F2ECE1" opacity={0.7} />
          {/* the bow, dead centre of the lid */}
          <g>
            <path d={blob(_r.fork('bl'), -16, 0, 15, 11, 7, 0.18)} fill="#F2ECE1" opacity={0.85} />
            <path d={blob(_r.fork('br'), 16, 0, 15, 11, 7, 0.18)} fill="#F2ECE1" opacity={0.85} />
            <circle cx={0} cy={0} r={6} fill="#F2ECE1" />
          </g>
        </g>
      )
      return { front, lid }
    },
  },
  {
    id: 'kraft',
    name: 'Kraft & Twine',
    swatch: '#C08A5C',
    draw: (r, color) => {
      const front = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_H / 2} width={BOX_W} height={BOX_H}
            fill={color} opacity={0.5} stroke="#5C4A36" strokeWidth={2} strokeOpacity={0.4} />
          <Specks r={r.fork('grain')} box={{ x: -BOX_W / 2, y: -BOX_H / 2, w: BOX_W, h: BOX_H }} n={16} color="#8A6A4F" size={2.4} opacity={0.22} />
        </g>
      )
      const lid = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_D / 2} width={BOX_W} height={BOX_D}
            fill={color} opacity={0.56} stroke="#5C4A36" strokeWidth={2} strokeOpacity={0.4} />
          {/* a length of twine, crossed, plus a wax seal instead of a bow */}
          <path d="M -80 -30 L 80 30 M 80 -30 L -80 30" stroke="#8A6A4F" strokeWidth={3} opacity={0.5} strokeLinecap="round" />
          <circle cx={0} cy={0} r={13} fill="#B0392A" opacity={0.62} />
          <circle cx={0} cy={0} r={13} fill="none" stroke="#5C4A36" strokeWidth={1} opacity={0.4} />
        </g>
      )
      return { front, lid }
    },
  },
  {
    id: 'elegant',
    name: 'Elegant Gold',
    swatch: '#2A2621',
    draw: (_r, color) => {
      const front = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_H / 2} width={BOX_W} height={BOX_H}
            fill={color} opacity={0.56} stroke="#B8913F" strokeWidth={2} strokeOpacity={0.4} />
          {/* a thin gold band, low on the face — restrained, not a full ribbon */}
          <rect x={-BOX_W / 2} y={BOX_H * 0.14} width={BOX_W} height={6} fill="#B8913F" opacity={0.6} />
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={-BOX_W / 2 + 20 + i * (BOX_W - 40) / 5} cy={-BOX_H * 0.22} r={2.4} fill="#B8913F" opacity={0.5} />
          ))}
        </g>
      )
      const lid = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_D / 2} width={BOX_W} height={BOX_D}
            fill={color} opacity={0.6} stroke="#B8913F" strokeWidth={2} strokeOpacity={0.4} />
          <rect x={-BOX_W / 2} y={-3} width={BOX_W} height={6} fill="#B8913F" opacity={0.6} />
          <circle cx={0} cy={0} r={8} fill="#B8913F" opacity={0.75} />
        </g>
      )
      return { front, lid }
    },
  },
]

export function getBox(id: string): GiftBox | undefined {
  return boxes.find(b => b.id === id)
}
