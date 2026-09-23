import type { ReactNode } from 'react'
import type { Rng } from '../rng'
import { blob, Ink, smooth, Wash, type Pt } from '../art/primitives'

/**
 * A bouquet holder. Local (0,0) is the centre of the rim — the point every
 * flower's stem meets — with the body hanging below it (positive y) same
 * as `flowers.tsx`'s stem convention, so a holder and any flower line up
 * without extra offset math at the call site.
 *
 * `body` is painted once and never re-transformed per rotation frame — a
 * round vase/basket genuinely looks almost the same from any angle, which
 * is realistic, not a shortcut. What DOES have to move as the assembly
 * turns is whatever isn't rotationally symmetric (a ribbon knot, a basket
 * handle) — those live in `decorations`, each with its own placement angle,
 * and get the exact same orbiting treatment (`rotation.ts`) as a flower.
 */
export interface GiftHolder {
  id: string
  name: string
  swatch: string
  draw: (r: Rng, color: string) => {
    body: ReactNode
    rim: { radius: number } // where flowers should sit
    decorations: Array<{ angleDeg: number; radius: number; node: ReactNode }>
  }
}

export const holders: GiftHolder[] = [
  {
    id: 'glass-vase',
    name: 'Glass Vase',
    swatch: '#9FB6C4',
    draw: (r, color) => {
      const pts: Pt[] = [
        [-38, 0], [-30, 18], [-46, 70], [-40, 150], [-26, 168],
        [26, 168], [40, 150], [46, 70], [30, 18], [38, 0],
      ]
      const body = (
        <g>
          <Wash d={smooth(pts, true)} color={color} opacity={0.28} rim={false} />
          <Ink r={r.fork('out')} pts={pts} close width={2} opacity={0.4} color="#3A4A52" />
          {/* two glass highlight streaks */}
          <path d="M -20 30 L -14 140" stroke="#F2ECE1" strokeWidth={5} opacity={0.3} strokeLinecap="round" />
          <path d="M 12 40 L 8 120" stroke="#F2ECE1" strokeWidth={3} opacity={0.22} strokeLinecap="round" />
          {/* a little water inside, at the base */}
          <path d={blob(r.fork('water'), 0, 140, 24, 14, 7, 0.12)} fill="#7FA3B0" opacity={0.22} />
        </g>
      )
      const knot = (
        <path d={blob(r.fork('knot'), 0, 0, 10, 8, 7, 0.2)} fill={color} opacity={0.6} />
      )
      return { body, rim: { radius: 30 }, decorations: [{ angleDeg: 15, radius: 40, node: knot }] }
    },
  },
  {
    id: 'kraft-wrap',
    name: 'Kraft Paper Wrap',
    swatch: '#C08A5C',
    draw: (r, color) => {
      const pts: Pt[] = [[-52, 0], [-58, 10], [-14, 190], [14, 190], [58, 10], [52, 0]]
      const body = (
        <g>
          <Wash d={smooth(pts, true)} color={color} opacity={0.5} />
          <Ink r={r.fork('out')} pts={pts} close width={2.2} opacity={0.5} color="#5C4A36" />
          {/* fold lines — paper, not fabric */}
          <path d="M -30 8 L -8 185" stroke="#5C4A36" strokeWidth={1.2} opacity={0.24} />
          <path d="M 22 8 L 6 185" stroke="#5C4A36" strokeWidth={1.2} opacity={0.24} />
        </g>
      )
      const twine = (
        <path d={smooth([[-30, 0], [0, 10], [30, 0]] as Pt[])} stroke="#8A6A4F" strokeWidth={4} fill="none"
          opacity={0.6} strokeLinecap="round" />
      )
      return { body, rim: { radius: 44 }, decorations: [{ angleDeg: 0, radius: 6, node: twine }] }
    },
  },
  {
    id: 'cellophane-ribbon',
    name: 'Ribboned Cellophane',
    swatch: '#E0A8AE',
    draw: (r, color) => {
      const pts: Pt[] = [[-56, 0], [-64, 14], [-10, 200], [10, 200], [64, 14], [56, 0]]
      const body = (
        <g>
          {/* tinted, translucent — colour is the whole point of a cellophane
              wrap, not just a clear plastic outline */}
          <Wash d={smooth(pts, true)} color={color} opacity={0.34} rim={false} />
          <Ink r={r.fork('out')} pts={pts} close width={2} opacity={0.46} color="#8A8072" />
          {/* two crinkly sheen streaks — cellophane catching light */}
          <path d="M -34 20 L -6 190" stroke="#F2ECE1" strokeWidth={7} opacity={0.34} strokeLinecap="round" />
          <path d="M 28 24 L 14 150" stroke="#F2ECE1" strokeWidth={4} opacity={0.26} strokeLinecap="round" />
        </g>
      )
      const bow = (
        <g>
          <path d={blob(r.fork('bl'), -12, 0, 13, 9, 7, 0.2)} fill={color} opacity={0.68} />
          <path d={blob(r.fork('br'), 12, 0, 13, 9, 7, 0.2)} fill={color} opacity={0.68} />
          <circle cx={0} cy={0} r={5} fill={color} opacity={0.8} />
        </g>
      )
      return { body, rim: { radius: 50 }, decorations: [{ angleDeg: 0, radius: 4, node: bow }] }
    },
  },
  {
    id: 'woven-basket',
    name: 'Woven Basket',
    swatch: '#B36A47',
    draw: (r, color) => {
      const pts: Pt[] = [[-56, 6], [-50, 100], [-30, 128], [30, 128], [50, 100], [56, 6]]
      const body = (
        <g>
          <Wash d={smooth(pts, true)} color={color} opacity={0.5} />
          <Ink r={r.fork('out')} pts={pts} close width={2.2} opacity={0.5} color="#6E4A30" />
          {/* woven texture — a few short cross-strokes, not a full basket-weave render */}
          <g stroke="#6E4A30" strokeWidth={1.4} opacity={0.28}>
            {Array.from({ length: 5 }, (_, i) => {
              const y = 30 + i * 20
              return <path key={i} d={`M -48 ${y} L 48 ${y - 3}`} />
            })}
          </g>
        </g>
      )
      // the handle arches OVER the rim — this is the part that has to move
      // to the side/behind as the basket turns, or it never reads as 3-D.
      const handleArc: Pt[] = [[-30, -6], [-24, -46], [24, -46], [30, -6]]
      const handle = (
        <g>
          <path d={smooth(handleArc)} stroke="#6E4A30" strokeWidth={9} fill="none" opacity={0.4} strokeLinecap="round" />
          <path d={smooth(handleArc)} stroke={color} strokeWidth={6} fill="none" opacity={0.7} strokeLinecap="round" />
        </g>
      )
      return { body, rim: { radius: 40 }, decorations: [{ angleDeg: 0, radius: 30, node: handle }] }
    },
  },
]

export function getHolder(id: string): GiftHolder | undefined {
  return holders.find(h => h.id === id)
}
