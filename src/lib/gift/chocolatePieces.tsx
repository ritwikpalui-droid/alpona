import type { ReactNode } from 'react'
import type { Rng } from '../rng'
import { blob, smooth, type Pt } from '../art/primitives'

/**
 * One chocolate piece, painted once at local (0,0), sized to sit in a grid
 * cell inside an open box (see `ChocolateBoxView.tsx`). Same "small,
 * individually-placeable" convention as `flowers.tsx` — the assortment is
 * the whole point of picking pieces, so each type gets a real, distinct
 * silhouette rather than one generic "chocolate" blob repeated.
 */
export interface GiftPiece {
  id: string
  name: string
  swatch: string
  draw: (r: Rng, color: string) => ReactNode
}

export const pieces: GiftPiece[] = [
  {
    id: 'truffle',
    name: 'Truffle',
    swatch: '#5C4A36',
    draw: (r, color) => (
      <g>
        <path d={blob(r, 0, 0, 15, 13, 8, 0.18)} fill={color} opacity={0.6} />
        {/* a drizzle across the top — the one detail that reads "truffle" not "ball" */}
        <path d={smooth([[-11, -3], [-3, 3], [5, -4], [12, 2]] as Pt[])} stroke="#F2ECE1" strokeWidth={2} fill="none" opacity={0.55} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'praline',
    name: 'Praline',
    swatch: '#8A6A4F',
    // A plain `<rect>`, not `smooth()` on its 4 corners — a bare-cornered
    // rectangle run through the Catmull-Rom spline bulges into a rounded
    // blob with nothing to keep it sharp (see the note in
    // `chocolateBoxes.tsx`); a praline is supposed to read as distinctly
    // square next to the truffle's round blob, not another blob.
    draw: (_r, color) => (
      <g>
        <rect x={-14} y={-12} width={28} height={24} rx={3} fill={color} opacity={0.6} />
        {/* a swirl piped on top */}
        <path d="M -6 2 Q 0 -8 6 2 Q 0 8 -3 2" stroke="#F2ECE1" strokeWidth={1.6} fill="none" opacity={0.5} />
      </g>
    ),
  },
  {
    id: 'wafer',
    name: 'Wafer',
    swatch: '#D9A441',
    draw: (_r, color) => (
      <g>
        <rect x={-15} y={-9} width={30} height={18} rx={1.5} fill={color} opacity={0.55} />
        {/* layered wafer lines */}
        <g stroke="#5C4A36" strokeWidth={1} opacity={0.28}>
          <path d="M -15 -3 L 15 -3" />
          <path d="M -15 3 L 15 3" />
        </g>
      </g>
    ),
  },
  {
    id: 'heart',
    name: 'Heart',
    swatch: '#B0392A',
    draw: (r, color) => (
      <path
        d={smooth([[0, 11], [-15, -2], [-8, -13], [0, -6], [8, -13], [15, -2]] as Pt[], true)}
        fill={color} opacity={0.62}
      />
    ),
  },
  {
    id: 'coconut-swirl',
    name: 'Coconut Swirl',
    swatch: '#F2ECE1',
    draw: (r, color) => (
      <g>
        <path d={blob(r, 0, 2, 13, 14, 7, 0.2)} fill="#F2ECE1" opacity={0.75} />
        <path d={blob(r.fork('cap'), 0, -8, 10, 6, 6, 0.16)} fill={color} opacity={0.6} />
      </g>
    ),
  },
]

export function getPiece(id: string): GiftPiece | undefined {
  return pieces.find(p => p.id === id)
}
