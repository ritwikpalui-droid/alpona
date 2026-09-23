import type { ReactNode } from 'react'
import type { Rng } from '../rng'
import { Bloom } from '../assets/botanicals'
import { blob, Ink, smooth, type Pt } from '../art/primitives'

/**
 * One bouquet flower type. Drawn ONCE, at local (0,0) — the point where its
 * stem meets the holder's rim — with the bloom cluster rising above it
 * (negative y). This is the exact "small, individually-placeable, centred
 * at local (0,0)" convention `src/lib/art/motifs.tsx` already uses for
 * `FlowerSprig`; a bouquet flower is that same idea; a few of them just
 * happen to be a category richer (rose/tulip/lily/etc, not one generic
 * sprig) since here the flower type itself is the whole point of picking
 * one, not an incidental scatter choice.
 *
 * `color` is applied the same way `MOTIF_COLORS` colours a motif — one
 * pigment substituted in, never baked into the shape itself, so "this rose
 * in red, that one in white" is the same flower drawn twice.
 */
export interface GiftFlower {
  id: string
  name: string
  swatch: string
  draw: (r: Rng, color: string) => ReactNode
}

const INK = '#2A2621'

function Stem({ r, height, curve = 0 }: { r: Rng; height: number; curve?: number }) {
  const pts: Pt[] = [[0, 0], [curve * 0.5 + r.jitter(2), -height * 0.5], [curve + r.jitter(2), -height]]
  return <Ink r={r.fork('stem')} pts={pts} width={2.4} opacity={0.42} color="#5E7A4E" />
}

function Leaf({ r, x, y, scale = 1 }: { r: Rng; x: number; y: number; scale?: number }) {
  return <path d={blob(r, x, y, 11 * scale, 6 * scale, 6, 0.3)} fill="#7A8A5C" opacity={0.44} />
}

export const flowers: GiftFlower[] = [
  {
    id: 'rose',
    name: 'Rose',
    swatch: '#B0392A',
    draw: (r, color) => {
      const cy = -62
      return (
        <g>
          <Stem r={r} height={64} curve={4} />
          <Leaf r={r.fork('l0')} x={-9} y={-30} />
          <Leaf r={r.fork('l1')} x={9} y={-24} scale={0.85} />
          {/* two layered rings — a rose reads as "full," not a flat daisy */}
          <Bloom r={r.fork('outer')} x={0} y={cy} rad={34} petals={9} color={color} opacity={0.42} />
          <Bloom r={r.fork('inner')} x={0} y={cy} rad={20} petals={7} color={color} opacity={0.58} />
          <circle cx={r.jitter(2)} cy={cy + r.jitter(2)} r={7} fill={color} opacity={0.7} />
        </g>
      )
    },
  },
  {
    id: 'marigold',
    name: 'Marigold',
    swatch: '#E0912F',
    draw: (r, color) => {
      const cy = -58
      return (
        <g>
          <Stem r={r} height={60} />
          <Leaf r={r.fork('l0')} x={-8} y={-26} />
          {/* dense, tightly packed petals — the pom-pom look real marigolds have */}
          <Bloom r={r.fork('a')} x={0} y={cy} rad={30} petals={13} color={color} opacity={0.5} />
          <Bloom r={r.fork('b')} x={0} y={cy} rad={17} petals={11} color={color} opacity={0.62} />
        </g>
      )
    },
  },
  {
    id: 'tulip',
    name: 'Tulip',
    swatch: '#C0402A',
    draw: (r, color) => {
      const cy = -70
      // Petals cupped upward in a half-turn, not spread flat — the one
      // detail that keeps a tulip from reading as a generic round bloom.
      const petals = Array.from({ length: 5 }, (_, i) => {
        const a = -Math.PI / 2 + (i - 2) * 0.42 + r.jitter(0.05)
        const px = Math.cos(a) * 16
        const py = cy + Math.sin(a) * 10 - 6
        return <path key={i} d={blob(r.fork('t' + i), px, py, 11, 24, 6, 0.16)} fill={color} opacity={0.56} />
      })
      return (
        <g>
          <Stem r={r} height={66} />
          <Leaf r={r.fork('l0')} x={-10} y={-28} scale={1.1} />
          {petals}
        </g>
      )
    },
  },
  {
    id: 'lily',
    name: 'Lily',
    swatch: '#F4EFE4',
    draw: (r, color) => {
      const cy = -64
      return (
        <g>
          <Stem r={r} height={62} curve={-3} />
          <Leaf r={r.fork('l0')} x={8} y={-26} />
          {/* six wide, pointed, star-like petals, well spread */}
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2 + r.jitter(0.08)
            const px = Math.cos(a) * 22
            const py = cy + Math.sin(a) * 22
            return <path key={i} d={blob(r.fork('p' + i), px, py, 14, 8, 6, 0.14)} fill={color} opacity={0.5} />
          })}
          {/* prominent stamens — the detail that says "lily," not "generic star" */}
          <g stroke={INK} strokeWidth={1.2} opacity={0.4}>
            {Array.from({ length: 5 }, (_, i) => {
              const a = (i / 5) * Math.PI * 2 + r.jitter(0.3)
              return <line key={i} x1={0} y1={cy} x2={Math.cos(a) * 9} y2={cy + Math.sin(a) * 9 - 3} />
            })}
          </g>
          <circle cx={0} cy={cy} r={5} fill="#D9A441" opacity={0.65} />
        </g>
      )
    },
  },
  {
    id: 'daisy',
    name: 'Daisy',
    swatch: '#F4EFE4',
    draw: (r, color) => {
      const cy = -56
      return (
        <g>
          <Stem r={r} height={58} curve={2} />
          <Leaf r={r.fork('l0')} x={-8} y={-24} scale={0.9} />
          {/* many thin narrow petals, flat and fully spread */}
          <Bloom r={r.fork('a')} x={0} y={cy} rad={26} petals={16} color={color} heart="#E0912F" opacity={0.46} />
        </g>
      )
    },
  },
  {
    id: 'orchid',
    name: 'Orchid',
    swatch: '#9C89C9',
    draw: (r, color) => {
      const cy = -60
      const sidePetals = Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4 + r.jitter(0.1)
        const px = Math.cos(a) * 20
        const py = cy + Math.sin(a) * 17
        return <path key={i} d={blob(r.fork('o' + i), px, py, 13, 9, 6, 0.2)} fill={color} opacity={0.5} />
      })
      return (
        <g>
          <Stem r={r} height={64} curve={6} />
          {sidePetals}
          {/* the lip — a distinctly bigger bottom petal, the one detail
              that keeps this from reading as "just another five-petal bloom" */}
          <path d={smooth([[-15, cy + 20], [0, cy + 34], [15, cy + 20], [0, cy + 12]] as Pt[], true)}
            fill={color} opacity={0.62} />
          <circle cx={0} cy={cy} r={5} fill="#E0912F" opacity={0.6} />
        </g>
      )
    },
  },
]

export function getFlower(id: string): GiftFlower | undefined {
  return flowers.find(f => f.id === id)
}
