import type { ReactNode } from 'react'
import type { Rng } from '../rng'
import { blob, smooth, type Pt } from '../art/primitives'

export interface MishtiType {
  id: string
  name: string
  swatch: string
  draw: (r: Rng, color: string) => ReactNode
}

export const varieties: MishtiType[] = [
  {
    id: 'rosogolla',
    name: 'Rosogolla',
    swatch: '#F7E7D2',
    draw: (r, color) => (
      <g>
        <path d={blob(r, 0, 0, 18, 16, 9, 0.18)} fill={color} opacity={0.82} />
        <circle cx={-4} cy={-5} r={4} fill="#fffaf3" opacity={0.35} />
      </g>
    ),
  },
  {
    id: 'rosogolla-royal',
    name: 'Rosogolla Royale',
    swatch: '#FBEAD9',
    draw: (r, color) => (
      <g>
        <path d={blob(r, 0, 0, 18, 16, 9, 0.18)} fill={color} opacity={0.84} />
        <circle cx={-5} cy={-6} r={5} fill="#fffaf3" opacity={0.28} />
        <circle cx={5} cy={2} r={3} fill="#F5CBA7" opacity={0.4} />
      </g>
    ),
  },
  {
    id: 'sandesh',
    name: 'Sandesh',
    swatch: '#D9C8B4',
    draw: (_r, color) => (
      <g>
        <rect x={-16} y={-12} width={32} height={24} rx={3} fill={color} opacity={0.7} />
        <circle cx={0} cy={-4} r={7} fill="#F2ECE1" opacity={0.5} />
      </g>
    ),
  },
  {
    id: 'pantua',
    name: 'Pantua',
    swatch: '#B85C39',
    draw: (r, color) => (
      <g>
        <path d={blob(r, 0, 0, 18, 15, 10, 0.2)} fill={color} opacity={0.75} />
        <path d={smooth([[-9, 0], [0, -11], [9, 0], [0, 10]] as Pt[])} stroke="#F7E7D2" strokeWidth={2} fill="none" opacity={0.55} strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'chomchom',
    name: 'Chomchom',
    swatch: '#D9A441',
    draw: (r, color) => (
      <g>
        <path d={blob(r, 0, 0, 17, 14, 8, 0.2)} fill={color} opacity={0.7} />
        <circle cx={0} cy={0} r={5} fill="#F3E6C9" opacity={0.58} />
      </g>
    ),
  },
  {
    id: 'mishti-doi',
    name: 'Mishti Doi',
    swatch: '#F0D7B2',
    draw: (_r, color) => (
      <g>
        <path d="M -16 10 Q -12 -10 0 -12 Q 12 -10 16 10 L 12 15 Q 0 21 -12 15 Z" fill={color} opacity={0.72} />
        <path d="M -9 5 Q 0 -2 9 5" stroke="#F7F1E8" strokeWidth={1.8} fill="none" opacity={0.45} />
      </g>
    ),
  },
  {
    id: 'jalbhora',
    name: 'Jalbhara',
    swatch: '#5E7B7B',
    draw: (_r, color) => (
      <g>
        <path d="M -14 14 Q -5 -10 0 -14 Q 5 -10 14 14 L 12 18 Q 0 22 -12 18 Z" fill={color} opacity={0.7} />
        <path d="M -8 3 Q 0 -5 8 3" stroke="#EAF4F4" strokeWidth={2} fill="none" opacity={0.5} />
      </g>
    ),
  },
]

export function getMishti(id: string): MishtiType | undefined {
  return varieties.find(item => item.id === id)
}
