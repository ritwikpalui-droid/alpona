import type { ReactNode } from 'react'
import type { Rng } from '../rng'
import { blob, Specks } from '../art/primitives'

export interface GiftBox {
  id: string
  name: string
  swatch: string
  draw: (r: Rng, color: string) => {
    front: ReactNode
    lid: ReactNode
  }
}

export const BOX_W = 220
export const BOX_H = 130
export const BOX_D = 70

export const boxes: GiftBox[] = [
  {
    id: 'royal-bengal',
    name: 'Royal Bengal',
    swatch: '#C75E46',
    draw: (_r, color) => {
      const front = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_H / 2} width={BOX_W} height={BOX_H}
            fill={color} opacity={0.54} stroke="#6B4A3C" strokeWidth={2} strokeOpacity={0.42} />
          <rect x={-BOX_W / 2 + 18} y={-BOX_H / 2 + 18} width={BOX_W - 36} height={BOX_H - 36}
            fill="#F7F1E8" opacity={0.18} stroke="#F7F1E8" strokeWidth={1.2} strokeOpacity={0.2} />
        </g>
      )
      const lid = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_D / 2} width={BOX_W} height={BOX_D}
            fill={color} opacity={0.58} stroke="#6B4A3C" strokeWidth={2} strokeOpacity={0.42} />
          <circle cx={0} cy={0} r={12} fill="#F2ECE1" opacity={0.82} />
          <path d="M -18 0 Q 0 -12 18 0 Q 0 12 -18 0" fill="#C75E46" opacity={0.72} />
        </g>
      )
      return { front, lid }
    },
  },
  {
    id: 'saffron-keep',
    name: 'Saffron Keep',
    swatch: '#D89C42',
    draw: (r, color) => {
      const front = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_H / 2} width={BOX_W} height={BOX_H}
            fill={color} opacity={0.52} stroke="#7A5531" strokeWidth={2} strokeOpacity={0.42} />
          <Specks r={r.fork('grain')} box={{ x: -BOX_W / 2, y: -BOX_H / 2, w: BOX_W, h: BOX_H }} n={16} color="#8B6B3A" size={2.2} opacity={0.22} />
        </g>
      )
      const lid = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_D / 2} width={BOX_W} height={BOX_D}
            fill={color} opacity={0.6} stroke="#7A5531" strokeWidth={2} strokeOpacity={0.42} />
          <path d={blob(r.fork('swirl'), 0, 0, 54, 18, 10, 0.16)} fill="#F2E9D7" opacity={0.78} />
          <circle cx={0} cy={0} r={6} fill="#D89C42" opacity={0.7} />
        </g>
      )
      return { front, lid }
    },
  },
  {
    id: 'heritage-tin',
    name: 'Heritage Tin',
    swatch: '#7F8EA3',
    draw: (_r, color) => {
      const front = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_H / 2} width={BOX_W} height={BOX_H}
            fill={color} opacity={0.5} stroke="#3F4C5D" strokeWidth={2} strokeOpacity={0.4} />
          <rect x={-BOX_W / 2 + 22} y={-BOX_H / 2 + 24} width={BOX_W - 44} height={BOX_H - 48}
            fill="#F7F4ED" opacity={0.12} stroke="#F7F4ED" strokeWidth={1} strokeOpacity={0.2} />
        </g>
      )
      const lid = (
        <g>
          <rect x={-BOX_W / 2} y={-BOX_D / 2} width={BOX_W} height={BOX_D}
            fill={color} opacity={0.58} stroke="#3F4C5D" strokeWidth={2} strokeOpacity={0.4} />
          <rect x={-BOX_W / 2 + 18} y={-BOX_D / 2 + 8} width={BOX_W - 36} height={BOX_D - 16}
            fill="#F2ECE1" opacity={0.26} />
          <circle cx={0} cy={0} r={8} fill="#F2ECE1" opacity={0.8} />
        </g>
      )
      return { front, lid }
    },
  },
]

export function getBox(id: string): GiftBox | undefined {
  return boxes.find(b => b.id === id)
}
