import type { ReactNode } from 'react'
import type { Rng } from '../rng'
import { blob, smooth, type Pt } from '../art/primitives'

/**
 * Recognisable Indian chocolate packs, drawn as individual pieces so the
 * same item can be repeated in the box while retaining a distinct silhouette.
 */
export interface GiftPiece {
  id: string
  name: string
  swatch: string
  draw: (r: Rng, color: string) => ReactNode
}

function Wrapper({ color, label, accent, compact = false }: { color: string; label: string; accent: string; compact?: boolean }) {
  const width = compact ? 26 : 30
  const height = compact ? 16 : 20
  const labelY = compact ? -1 : 1
  return (
    <g>
      <rect x={-width / 2} y={-height / 2} width={width} height={height} rx={3} fill={color} stroke="#4B3328" strokeWidth={1.2} opacity={0.9} />
      <path d={`M ${-width / 2 + 3} ${-height / 2 + 3} H ${width / 2 - 3}`} stroke={accent} strokeWidth="1.2" opacity="0.6" />
      <text x="0" y={labelY} textAnchor="middle" fill="#FFF8EA" fontSize={compact ? 3.6 : 4.2} fontWeight="700" fontFamily="Arial, sans-serif">{label}</text>
    </g>
  )
}

export const pieces: GiftPiece[] = [
  {
    id: 'dairy-milk',
    name: 'Cadbury Dairy Milk',
    swatch: '#6E3B2D',
    draw: (_r, color) => <Wrapper color={color} label="DAIRY" accent="#F1C86C" />,
  },
  {
    id: 'kitkat',
    name: 'KitKat',
    swatch: '#C63D35',
    draw: (r, color) => (
      <g>
        <rect x={-15} y={-10} width={30} height={20} rx={2.5} fill={color} stroke="#6A2B28" strokeWidth={1.2} />
        <path d="M -10 -8 V 8 M -3 -8 V 8 M 4 -8 V 8 M 11 -8 V 8" stroke="#F6E8D5" strokeWidth="1.2" opacity="0.78" />
        <text x="0" y="1" textAnchor="middle" fill="#FFF8EA" fontSize="4.2" fontWeight="700" fontFamily="Arial, sans-serif">KITKAT</text>
      </g>
    ),
  },
  {
    id: 'five-star',
    name: 'Five Star',
    swatch: '#A72F2A',
    draw: (r, color) => (
      <g>
        <path d={blob(r, 0, 0, 17, 15, 8, 0.18)} fill={color} stroke="#6A2924" strokeWidth="1.1" />
        <path d="M -4 -5 L 0 -10 L 4 -5 L 10 -4 L 6 1 L 7 7 L 0 4 L -7 7 L -6 1 L -10 -4 Z" fill="#F3D28A" opacity="0.9" />
        <text x="0" y="7" textAnchor="middle" fill="#FFF7E8" fontSize="3" fontWeight="700" fontFamily="Arial, sans-serif">5 STAR</text>
      </g>
    ),
  },
  {
    id: 'perk',
    name: 'Perk',
    swatch: '#E8B33B',
    draw: (r, color) => (
      <g>
        <rect x={-15} y={-10} width={30} height={20} rx={2} fill={color} stroke="#74512A" strokeWidth="1.1" />
        <path d="M -10 -5 H 10 M -10 0 H 10 M -10 5 H 10" stroke="#FFF1BE" strokeWidth="1.5" opacity="0.72" />
        <text x="0" y="1" textAnchor="middle" fill="#4A321F" fontSize="3.8" fontWeight="700" fontFamily="Arial, sans-serif">PERK</text>
      </g>
    ),
  },
  {
    id: 'dark-chocolate',
    name: 'Dark Chocolate',
    swatch: '#3E2B24',
    draw: (r, color) => (
      <g>
        <rect x={-15} y={-10} width={30} height={20} rx={3} fill={color} stroke="#211713" strokeWidth="1.2" />
        <path d={smooth([[-9, -5], [0, -8], [9, -5], [7, 5], [0, 8], [-7, 5]] as Pt[])} fill="#7A4A3A" opacity="0.55" />
        <text x="0" y="1" textAnchor="middle" fill="#F2E2C8" fontSize="3.4" fontWeight="700" fontFamily="Arial, sans-serif">DARK</text>
      </g>
    ),
  },
]

export function getPiece(id: string): GiftPiece | undefined {
  return pieces.find(p => p.id === id)
}
