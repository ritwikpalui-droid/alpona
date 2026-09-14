import type { ReactNode } from 'react'
import type { Rng } from '../rng'
import { blob, Ink, smooth, Wash, type Pt } from './primitives'
import { Bloom } from '../assets/botanicals'

/**
 * Small, individually-placeable motifs — centred at local (0,0), sized for
 * one instance rather than a whole-canvas scatter. Placed via a single
 * `translate(x,y) scale(s)` per instance (see `ExtraPlacement` in types.ts,
 * and `AdjustPanel` for the add/drag/resize/colour UI).
 *
 * First pass at these used plain filled shapes — flat blobs, a bare stroke
 * for a bird — and it showed: next to a real painted Durga or a fully
 * hand-inked pandal, they read as "some objects," not as the same artist's
 * hand. Fixed by actually using the app's own painting primitives instead
 * of skipping them — `Ink`'s double-pass wobbly contour (the same hand-
 * drawn-line technique every procedural asset in the app uses) and `Wash`'s
 * rim-darkening (the same pigment-pooling-at-the-edge technique), plus more
 * sub-shapes per motif (a diya isn't one flame, it's a bowl + rim + pooled
 * oil + flame + reflected glow).
 *
 * Deliberately still a SMALL registry, not the full "animals, vehicles,
 * human figures" wishlist — these primitives can convincingly do
 * organic/abstract things (real ones are irregular and forgiving of a
 * wobbly hand) and simple geometric structures built from straight/near-
 * straight edges (a hut, a house, a boat hull — a wobbly line still reads
 * as "hand-painted," not "wrong"). They cannot credibly draw a yellow taxi
 * or a recognisable human figure — those need real painted art, generated
 * the same one-at-a-time way as every Durga/Pandal/World asset so far.
 *
 * Colour is per-PLACEMENT, not baked into the motif (see `ExtraPlacement.
 * color`) — "this tree in red, that one in lavender" needs the same motif
 * rendered differently per placement, not a global choice.
 */

export interface MotifDef {
  label: string
  /** Rough default footprint at scale=1, for the "+" preview swatch only. */
  swatch: string
  /** Whether tapping a colour swatch actually changes this motif's look. */
  colorable: boolean
  render: (r: Rng, color: string) => ReactNode
}

const INK = '#2A2621'

function FlowerSprig(r: Rng, color: string): ReactNode {
  const stemPts: Pt[] = [[0, 40], [-2, 10], [1, -14]]
  return (
    <g>
      <Ink r={r.fork('stem')} pts={stemPts} width={2} opacity={0.4} color="#5E7A4E" />
      {Array.from({ length: 2 }, (_, i) => (
        <path key={i} d={blob(r.fork('lf' + i), i ? 10 : -9, 14 + i * 10, 11, 6, 6, 0.3)} fill="#7A8A5C" opacity={0.45} />
      ))}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + r.jitter(0.3)
        const rad = r.range(20, 32)
        const bx = Math.cos(a) * rad
        const by = -18 + Math.sin(a) * rad * 0.8
        return (
          <g key={i}>
            <Bloom r={r.fork('sp' + i)} x={bx} y={by} rad={r.range(22, 30)} petals={6} color={color} heart="#F2ECE1" opacity={0.6} />
            <Ink r={r.fork('spi' + i)} pts={[[bx - 14, by], [bx, by - 12], [bx + 14, by]]} width={1.4} opacity={0.28} color={INK} />
          </g>
        )
      })}
    </g>
  )
}

function FloweringTree(r: Rng, color: string): ReactNode {
  const trunkPts: Pt[] = [[-6, 74], [-4, 22], [2, -8], [4, -42]]
  return (
    <g>
      <Wash d={smooth([[-9, 74], [-6, 20], [2, -10], [6, -40], [9, -40], [5, -8], [7, 22], [9, 74]] as Pt[], true)} color="#6B5642" opacity={0.4} />
      <Ink r={r.fork('trunk')} pts={trunkPts} width={5} opacity={0.55} color="#4A3D2E" />
      <path d={blob(r.fork('foliage'), 0, -58, 62, 48, 10, 0.22)} fill="#5E7A4E" opacity={0.32} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + r.jitter(0.25)
        const rad = r.range(28, 48)
        const bx = Math.cos(a) * rad
        const by = -58 + Math.sin(a) * rad * 0.7
        return <Bloom key={i} r={r.fork('t' + i)} x={bx} y={by} rad={r.range(15, 23)} petals={6} color={color} heart="#FFF3D6" opacity={0.64} />
      })}
      {Array.from({ length: 4 }, (_, i) => {
        const a = r() * Math.PI * 2
        const rad = r.range(20, 50)
        return <path key={i} d={blob(r.fork('lfx' + i), Math.cos(a) * rad, -58 + Math.sin(a) * rad * 0.7, 9, 5, 6, 0.3)} fill="#4F6B42" opacity={0.4} />
      })}
    </g>
  )
}

function LightString(r: Rng, color: string): ReactNode {
  const wirePts: Pt[] = Array.from({ length: 6 }, (_, i) => {
    const t = i / 5
    return [-48 + t * 96, Math.sin(t * Math.PI) * 20] as Pt
  })
  return (
    <g>
      <Ink r={r.fork('wire')} pts={wirePts} width={1.4} opacity={0.4} color="#4A3D2E" />
      {wirePts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y + 4} r={13} fill={color} opacity={0.22} filter="url(#glow)" />
          <circle cx={x} cy={y + 4} r={9} fill={color} opacity={0.72} filter="url(#glow-tight)" />
          <circle cx={x} cy={y + 4} r={3.4} fill="#FFF3D6" opacity={0.95} />
          <path d={`M${x - 2},${y - 1} L${x + 2},${y - 1}`} stroke="#4A3D2E" strokeWidth={1.6} opacity={0.5} />
        </g>
      ))}
    </g>
  )
}

function Lantern(r: Rng, color: string): ReactNode {
  const bodyPts: Pt[] = [[-26, -32], [-32, 0], [-26, 32], [26, 32], [32, 0], [26, -32]]
  const body = smooth(bodyPts, true)
  return (
    <g>
      <path d="M0,-48 L0,-33" stroke="#4A3D2E" strokeWidth={2.4} opacity={0.55} />
      <Wash d={body} color={color} opacity={0.5} />
      <path d={body} fill={color} opacity={0.16} filter="url(#glow)" />
      <Ink r={r.fork('lb')} pts={bodyPts} close width={2} opacity={0.5} color="#4A3D2E" />
      {[-15, 0, 15].map(x => (
        <path key={x} d={`M${x},${x === 0 ? -32 : -26} L${x},${x === 0 ? 32 : 26}`} stroke="#4A3D2E" strokeWidth={1.3} opacity={0.32} />
      ))}
      <ellipse cx={0} cy={-32} rx={11} ry={4.5} fill="#4A3D2E" opacity={0.55} />
      <ellipse cx={0} cy={32} rx={11} ry={4.5} fill="#4A3D2E" opacity={0.55} />
      <path d="M0,36 Q-6,46 0,54 Q6,46 0,36 Z" fill="#B8913F" opacity={0.6} />
      <circle cx={0} cy={54} r={2.6} fill="#B8913F" opacity={0.7} />
    </g>
  )
}

function Diya(r: Rng): ReactNode {
  return (
    <g>
      <ellipse cx={0} cy={26} rx={26} ry={7} fill="#2A2621" opacity={0.14} filter="url(#blur-lg)" />
      <Wash d={blob(r.fork('bowl'), 0, 12, 32, 13, 8, 0.14)} color="#B36A47" opacity={0.62} />
      <path d={blob(r.fork('rim'), 0, 4, 26, 6, 8, 0.1)} fill="#8A6A4F" opacity={0.4} />
      <path d="M-20,10 Q0,24 20,10" stroke="#6B4A34" strokeWidth={2} fill="none" opacity={0.5} />
      <path d={blob(r.fork('oil'), 0, 2, 14, 4, 7, 0.16)} fill="#D9A441" opacity={0.5} />
      <path d="M0,-6 Q-7,-20 0,-36 Q7,-20 0,-6 Z" fill="#E0912F" opacity={0.28} filter="url(#glow)" />
      <path d="M0,-6 Q-6,-19 0,-33 Q6,-19 0,-6 Z" fill="#E0912F" opacity={0.85} filter="url(#glow-tight)" />
      <path d="M0,-9 Q-3,-17 0,-25 Q3,-17 0,-9 Z" fill="#FFF3D6" opacity={0.92} />
    </g>
  )
}

export function Bird(r: Rng, color: string): ReactNode {
  const flap = r.range(0.75, 1.15)
  const bodyPts: Pt[] = [[-8, 2], [0, -3], [9, 1]]
  return (
    <g>
      <Ink r={r.fork('wl')} pts={[[-32, 0], [-15, -17 * flap], [-1, -3]]} width={2.4} opacity={0.68} color={color} />
      <Ink r={r.fork('wr')} pts={[[1, -3], [15, -17 * flap], [32, 0]]} width={2.4} opacity={0.68} color={color} />
      <path d={smooth(bodyPts)} fill={color} opacity={0.5} />
      <path d="M9,1 L15,3 L9,4 Z" fill={color} opacity={0.6} />
    </g>
  )
}

function Hut(r: Rng, color: string): ReactNode {
  const wallPts: Pt[] = [[-64, 50], [-70, -18], [0, -70], [70, -18], [64, 50]]
  const roofPts: Pt[] = [[-70, -18], [0, -70], [70, -18]]
  return (
    <g>
      <Wash d={smooth(wallPts, true)} color={color} opacity={0.56} />
      <Ink r={r.fork('wall')} pts={wallPts} close width={2.4} opacity={0.56} color="#4A3D2E" />
      {Array.from({ length: 6 }, (_, k) => {
        const t = (k + 1) / 7
        const bx = -70 + t * 140, by = -18 - (1 - Math.abs(t - 0.5) * 2) * 52
        return <path key={k} d={`M ${bx - 11} ${by + 8} L ${bx + 8} ${by - 9}`} stroke="#4A3D2E" strokeWidth={1.4} opacity={0.4} />
      })}
      <Ink r={r.fork('roof')} pts={roofPts} width={2} opacity={0.5} color="#4A3D2E" />
      <path d="M -16 50 L -16 14 L 16 14 L 16 50" stroke="#4A3D2E" strokeWidth={2} fill="none" opacity={0.46} />
      <path d="M -64 50 L 64 50" stroke="#4A3D2E" strokeWidth={2.2} opacity={0.4} />
    </g>
  )
}

function House(r: Rng, color: string): ReactNode {
  const wallPts: Pt[] = [[-56, 54], [-56, -30], [56, -30], [56, 54]]
  const roofPts: Pt[] = [[-66, -30], [0, -76], [66, -30]]
  return (
    <g>
      <path d="M 42 -76 L 42 -102" stroke="#4A3D2E" strokeWidth={7} opacity={0.4} />
      <path d="M 30 -102 L 54 -102 L 54 -88 L 30 -88 Z" fill="#4A3D2E" opacity={0.36} />
      <Wash d={smooth(roofPts, true)} color="#8A5A3F" opacity={0.5} />
      <Ink r={r.fork('roof')} pts={roofPts} close width={2.2} opacity={0.5} color="#4A3D2E" />
      <Wash d={smooth(wallPts, true)} color={color} opacity={0.52} />
      <Ink r={r.fork('wall')} pts={wallPts} close width={2.4} opacity={0.54} color="#4A3D2E" />
      <path d="M -14 54 L -14 8 L 14 8 L 14 54" stroke="#4A3D2E" strokeWidth={2} fill="none" opacity={0.46} />
      {[[-36, -8], [30, -8]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 14} y={y - 14} width={28} height={26} fill="#F2ECE1" opacity={0.4} stroke="#4A3D2E" strokeWidth={1.6} strokeOpacity={0.42} />
          <path d={`M ${x} ${y - 14} L ${x} ${y + 12} M ${x - 14} ${y} L ${x + 14} ${y}`} stroke="#4A3D2E" strokeWidth={1.2} opacity={0.34} />
        </g>
      ))}
      <path d="M -56 54 L 56 54" stroke="#4A3D2E" strokeWidth={2.2} opacity={0.4} />
    </g>
  )
}

function Boat(r: Rng, color: string): ReactNode {
  const hullPts: Pt[] = [[-90, -4], [-50, 20], [50, 20], [90, -4], [60, -12], [-60, -12]]
  return (
    <g>
      <ellipse cx={0} cy={26} rx={78} ry={9} fill="#2A2621" opacity={0.14} filter="url(#blur-lg)" />
      <Wash d={smooth(hullPts, true)} color={color} opacity={0.58} />
      <Ink r={r.fork('hull')} pts={hullPts} close width={2.4} opacity={0.56} color="#4A3D2E" />
      {[-40, 0, 40].map((x, i) => (
        <path key={i} d={`M ${x} -10 L ${x - 6} 16`} stroke="#4A3D2E" strokeWidth={1.4} opacity={0.3} />
      ))}
      <path d="M -4 -12 L -4 -58" stroke="#4A3D2E" strokeWidth={3} opacity={0.44} />
      <path d="M -4 -58 Q 24 -50 22 -30 Q 2 -38 -4 -30 Z" fill={color} opacity={0.5} />
      <Ink r={r.fork('sail')} pts={[[-4, -58], [22, -30], [-4, -30]]} close width={1.6} opacity={0.4} color="#4A3D2E" />
    </g>
  )
}

/**
 * Five hanging chandeliers/lamps — genuinely different fixtures, not one
 * drawing recoloured five times. Centred at local (0,0) like every other
 * motif here, with a short chain rising ABOVE the origin (so placing one
 * near wherever a ceiling reads in the scene hangs it convincingly) and the
 * fixture body hanging below.
 */
function ChandelierCrystal(r: Rng, color: string): ReactNode {
  const cr = r.fork('chand-crystal')
  const urnPts: Pt[] = [[-22, 40], [0, 18], [22, 40], [16, 78], [-16, 78]]
  const tiers = [{ dy: 0, ry: 62, n: 6, drop: 22 }, { dy: 26, ry: 96, n: 8, drop: 30 }]
  return (
    <g>
      <path d="M0,-30 L0,40" stroke="#4A3D2E" strokeWidth={2} opacity={0.5} />
      <Wash d={smooth(urnPts, true)} color={color} opacity={0.44} rim={false} />
      <Ink pts={urnPts} close r={cr.fork('urn')} width={1.6} opacity={0.42} color="#4A3D2E" />
      {tiers.map((t, ti) => {
        const armY = 78 + t.dy
        const armPts: Pt[] = [[-t.ry, armY + 18], [0, armY - 6], [t.ry, armY + 18]]
        return (
          <g key={ti}>
            <Ink pts={armPts} r={cr.fork(`arm${ti}`)} width={1.6} opacity={0.42} color={color} />
            {Array.from({ length: t.n }, (_, i) => {
              const tt = i / (t.n - 1)
              const x = -t.ry + tt * t.ry * 2
              const y = armY + 18 - Math.sin(tt * Math.PI) * 20
              return (
                <g key={i}>
                  <path d={`M ${x} ${y} L ${x} ${y + t.drop}`} stroke="#4A3D2E" strokeWidth={1} opacity={0.3} />
                  <path d={blob(cr.fork(`drop${ti}${i}`), x, y + t.drop + 4, 4, 5.5, 6, 0.24)} fill={color} opacity={0.62} />
                  <circle cx={x} cy={y + t.drop + 1} r={1.3} fill="#FFF3D6" opacity={0.75} />
                </g>
              )
            })}
          </g>
        )
      })}
      <circle cx={0} cy={54} r={22} fill={color} opacity={0.16} filter="url(#glow)" />
    </g>
  )
}

function ChandelierBrass(r: Rng, color: string): ReactNode {
  const cr = r.fork('chand-brass')
  const bowlPts: Pt[] = [[-80, 60], [-68, 96], [68, 96], [80, 60], [0, 34]]
  const rimPts: Pt[] = [[-96, 96], [0, 116], [96, 96]]
  const cupN = 7
  return (
    <g>
      <path d="M0,-30 L0,34" stroke="#4A3D2E" strokeWidth={2} opacity={0.5} />
      <Wash d={smooth(bowlPts, true)} color={color} opacity={0.5} />
      <Ink pts={bowlPts} close r={cr.fork('bowl')} width={2} opacity={0.44} color="#4A3D2E" />
      <Ink pts={rimPts} r={cr.fork('rim')} width={2.2} opacity={0.4} color={color} />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M ${-64 + i * 32} 66 L ${-64 + i * 32} 92`} stroke="#4A3D2E" strokeWidth={1.2} opacity={0.26} />
      ))}
      <path d="M0,116 L0,148" stroke="#4A3D2E" strokeWidth={2} opacity={0.4} />
      {Array.from({ length: cupN }, (_, i) => {
        const t = i / (cupN - 1)
        const x = -140 + t * 280
        const y = 148 + Math.sin(t * Math.PI) * -26
        const cor = cr.fork(`cup${i}`)
        return (
          <g key={i}>
            <path d={`M 0 132 Q ${x / 2} ${(132 + y) / 2 - 8} ${x} ${y}`} stroke="#4A3D2E" strokeWidth={1} opacity={0.3} fill="none" />
            <path d={blob(cor.fork('cup'), x, y + 8, 10, 6.5, 7, 0.16)} fill={color} opacity={0.55} />
            <path d="M0,-4 Q-3,-10 0,-17 Q3,-10 0,-4 Z" fill="#E0912F" opacity={0.8} transform={`translate(${x} ${y})`} filter="url(#glow-tight)" />
          </g>
        )
      })}
    </g>
  )
}

function ChandelierDiyaTiers(r: Rng, color: string): ReactNode {
  const cr = r.fork('chand-diya')
  const rings = [{ y: 30, ry: 60, n: 4 }, { y: 92, ry: 116, n: 6 }, { y: 160, ry: 172, n: 8 }]
  return (
    <g>
      <path d="M0,-30 L0,30" stroke="#4A3D2E" strokeWidth={2} opacity={0.5} />
      {rings.map((ring, ri) => {
        const ringPts: Pt[] = Array.from({ length: 9 }, (_, i) => {
          const t = i / 8
          return [-ring.ry + t * ring.ry * 2, ring.y + Math.sin(t * Math.PI) * 12] as Pt
        })
        return (
          <g key={ri}>
            <Ink pts={ringPts} r={cr.fork(`ring${ri}`)} width={1.6} opacity={0.4} color={color} />
            {ri > 0 && (
              <>
                <path d={`M ${-rings[ri - 1].ry} ${rings[ri - 1].y} L ${-ring.ry} ${ring.y}`} stroke="#4A3D2E" strokeWidth={1} opacity={0.26} />
                <path d={`M ${rings[ri - 1].ry} ${rings[ri - 1].y} L ${ring.ry} ${ring.y}`} stroke="#4A3D2E" strokeWidth={1} opacity={0.26} />
              </>
            )}
            {Array.from({ length: ring.n }, (_, i) => {
              const t = i / (ring.n - 1)
              const x = -ring.ry + t * ring.ry * 2
              const y = ring.y + Math.sin(t * Math.PI) * 12
              const dr = cr.fork(`d${ri}${i}`)
              return (
                <g key={i}>
                  <path d={`M ${x} ${y} L ${x} ${y + 12}`} stroke="#4A3D2E" strokeWidth={1} opacity={0.3} />
                  <path d={blob(dr.fork('bowl'), x, y + 17, 6.5, 4, 6, 0.2)} fill={color} opacity={0.58} />
                  <path d="M0,-3 Q-2.5,-9 0,-15 Q2.5,-9 0,-3 Z" fill="#E0912F" opacity={0.85} transform={`translate(${x} ${y + 12})`} filter="url(#glow-tight)" />
                </g>
              )
            })}
          </g>
        )
      })}
    </g>
  )
}

function ChandelierLanterns(r: Rng, color: string): ReactNode {
  const cr = r.fork('chand-lanterns')
  const xs = [-72, -26, 22, 68]
  const stringPts: Pt[] = [[-92, -36], ...xs.map((x, i) => [x, -36 + Math.sin(i * 1.7) * 8] as Pt), [92, -36]]
  return (
    <g>
      <Ink pts={stringPts} r={cr} width={1.4} opacity={0.4} color="#4A3D2E" />
      {xs.map((x, i) => {
        const y = -20 + (i % 2) * 20
        const lr = cr.fork(`lant${i}`)
        const bodyPts: Pt[] = [[x - 13, y - 14], [x - 16, y + 2], [x - 13, y + 18], [x + 13, y + 18], [x + 16, y + 2], [x + 13, y - 14]]
        return (
          <g key={i}>
            <path d={`M ${x} -34 L ${x} ${y - 14}`} stroke="#4A3D2E" strokeWidth={1.1} opacity={0.34} />
            <Wash d={smooth(bodyPts, true)} color={color} opacity={0.52} />
            <path d={smooth(bodyPts, true)} fill={color} opacity={0.16} filter="url(#glow)" />
            <Ink pts={bodyPts} close r={lr} width={1.4} opacity={0.46} color="#4A3D2E" />
            <ellipse cx={x} cy={y - 14} rx={6.5} ry={2.6} fill="#4A3D2E" opacity={0.42} />
            <ellipse cx={x} cy={y + 18} rx={6.5} ry={2.6} fill="#4A3D2E" opacity={0.42} />
          </g>
        )
      })}
    </g>
  )
}

function ChandelierPendant(r: Rng, color: string): ReactNode {
  const cr = r.fork('chand-pendant')
  const domePts: Pt[] = [[-30, 10], [-34, 32], [0, 42], [34, 32], [30, 10], [0, -8]]
  return (
    <g>
      <path d="M0,-60 L0,-6" stroke="#4A3D2E" strokeWidth={2} opacity={0.48} />
      <Wash d={smooth(domePts, true)} color={color} opacity={0.5} />
      <Ink pts={domePts} close r={cr} width={1.8} opacity={0.44} color="#4A3D2E" />
      <ellipse cx={0} cy={38} rx={19} ry={4.5} fill="#4A3D2E" opacity={0.3} />
      <circle cx={0} cy={38} r={24} fill={color} opacity={0.18} filter="url(#glow)" />
      <circle cx={0} cy={38} r={9} fill="#FFF3D6" opacity={0.75} />
    </g>
  )
}

function Butterfly(r: Rng, color: string): ReactNode {
  return (
    <g>
      <path d={blob(r.fork('lwu'), -13, -8, 15, 12, 7, 0.2)} fill={color} opacity={0.6} />
      <path d={blob(r.fork('rwu'), 13, -8, 15, 12, 7, 0.2)} fill={color} opacity={0.6} />
      <path d={blob(r.fork('lwl'), -9, 10, 9, 8, 6, 0.22)} fill={color} opacity={0.5} />
      <path d={blob(r.fork('rwl'), 9, 10, 9, 8, 6, 0.22)} fill={color} opacity={0.5} />
      <circle cx={-13} cy={-9} r={3.4} fill="#FFF3D6" opacity={0.7} />
      <circle cx={13} cy={-9} r={3.4} fill="#FFF3D6" opacity={0.7} />
      <Ink r={r.fork('vein')} pts={[[-13, -18], [-13, 2]]} width={1} opacity={0.3} color={INK} />
      <Ink r={r.fork('veinr')} pts={[[13, -18], [13, 2]]} width={1} opacity={0.3} color={INK} />
      <path d="M0,-14 L0,14" stroke={INK} strokeWidth={2.2} opacity={0.6} strokeLinecap="round" />
      <path d="M0,-14 Q-5,-20 -8,-25 M0,-14 Q5,-20 8,-25" stroke={INK} strokeWidth={1.3} fill="none" opacity={0.5} />
    </g>
  )
}

export const MOTIFS: Record<string, MotifDef> = {
  'flower-sprig': { label: 'Flowers', swatch: '#D08C8C', colorable: true, render: FlowerSprig },
  'flowering-tree': { label: 'Flowering tree', swatch: '#C0402A', colorable: true, render: FloweringTree },
  'light-string': { label: 'Lights', swatch: '#E0A83A', colorable: true, render: LightString },
  lantern: { label: 'Lantern', swatch: '#D9A441', colorable: true, render: Lantern },
  diya: { label: 'Diya', swatch: '#E0912F', colorable: false, render: (r) => Diya(r) },
  bird: { label: 'Bird', swatch: '#2A2621', colorable: true, render: Bird },
  butterfly: { label: 'Butterfly', swatch: '#6B5B8A', colorable: true, render: Butterfly },
  hut: { label: 'Hut', swatch: '#C08A5C', colorable: true, render: Hut },
  house: { label: 'House', swatch: '#D9C9A8', colorable: true, render: House },
  boat: { label: 'Boat', swatch: '#8A6A4F', colorable: true, render: Boat },
  'chandelier-crystal': { label: 'Crystal chandelier', swatch: '#F2ECE1', colorable: true, render: ChandelierCrystal },
  'chandelier-brass': { label: 'Brass jhaar', swatch: '#E0912F', colorable: true, render: ChandelierBrass },
  'chandelier-diya': { label: 'Diya tree', swatch: '#D9A441', colorable: true, render: ChandelierDiyaTiers },
  'chandelier-lanterns': { label: 'Lantern string', swatch: '#C0402A', colorable: true, render: ChandelierLanterns },
  'chandelier-pendant': { label: 'Pendant lamp', swatch: '#B8913F', colorable: true, render: ChandelierPendant },
}

/** A handful of preset tints — "red or yellow or lavender or white or some
 *  other creative colour" — for the motifs marked `colorable`. */
export const MOTIF_COLORS = [
  { name: 'marigold', hex: '#E0912F' },
  { name: 'red', hex: '#B0392A' },
  { name: 'yellow', hex: '#E6C34A' },
  { name: 'lavender', hex: '#9C89C9' },
  { name: 'white', hex: '#F4EFE4' },
  { name: 'rose', hex: '#D08C8C' },
  { name: 'teal', hex: '#46786F' },
]
