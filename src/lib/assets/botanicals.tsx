import type { ReactNode } from 'react'
import type { Asset } from '../types'
import type { Rng } from '../rng'
import { P } from '../art/palette'
import { blob, Ink, ridge, smooth, Specks, Wash, type Pt } from '../art/primitives'

/* ------------------------------------------------------------------ *
 * Flower primitives
 * ------------------------------------------------------------------ */

/** One bloom: n petal washes around a slightly off-centre heart. */
export function Bloom({ r, x, y, rad, petals = 6, color, heart, opacity = 0.5 }: {
  r: Rng; x: number; y: number; rad: number; petals?: number; color: string; heart?: string; opacity?: number
}) {
  const start = r() * Math.PI * 2
  return (
    <g>
      {Array.from({ length: petals }, (_, i) => {
        const a = start + (i / petals) * Math.PI * 2 + r.jitter(0.14)
        const px = x + Math.cos(a) * rad * 0.56
        const py = y + Math.sin(a) * rad * 0.56
        return <path key={i} d={blob(r.fork('p' + i), px, py, rad * 0.52, rad * 0.4, 7, 0.26)} fill={color} opacity={opacity} />
      })}
      {heart && <circle cx={x + r.jitter(2)} cy={y + r.jitter(2)} r={rad * 0.2} fill={heart} opacity={0.72} />}
    </g>
  )
}

/** Blooms strewn along the plinth and the ground — where they actually land. */
function Strewn({ r, color, heart, n = 26, rad = 15, petals = 6, band = [1080, 1420] as [number, number] }: {
  r: Rng; color: string; heart?: string; n?: number; rad?: number; petals?: number; band?: [number, number]
}) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const br = r.fork('sw' + i)
        const t = br()
        return <Bloom key={i} r={br} x={br.range(60, 940)} y={band[0] + t * t * (band[1] - band[0])}
          rad={rad * br.range(0.7, 1.35)} petals={petals} color={color} heart={heart} opacity={0.46} />
      })}
    </g>
  )
}

/** A hanging chain of blooms, catenary-shaped. */
function Garland({ r, x1, x2, y, sag, color, heart, n = 20, rad = 13 }: {
  r: Rng; x1: number; x2: number; y: number; sag: number; color: string; heart?: string; n?: number; rad?: number
}) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1)
        const gx = x1 + (x2 - x1) * t
        const gy = y + Math.sin(t * Math.PI) * sag + r.jitter(5)
        return <Bloom key={i} r={r.fork('g' + i)} x={gx} y={gy} rad={rad} petals={5} color={color} heart={heart} opacity={0.5} />
      })}
    </g>
  )
}

function flower(id: string, name: string, subtitle: string, palette: string[],
  meta: Asset['meta'], draw: (r: Rng) => ReactNode, affinity?: Asset['affinity']): Asset {
  return { id, category: 'flowers', name, subtitle, palette, meta, affinity, art: { kind: 'proc', draw: (r) => draw(r) } }
}

export const flowers: Asset[] = [
  flower('shiuli', 'Shiuli', 'Fallen overnight, gone by nine in the morning', [P.paper, P.marigold, P.moss],
    { terrain: [], timeOfDay: ['dawn', 'day'], mood: ['nostalgic', 'serene', 'intimate'], intensity: 2, tags: ['shiuli', 'white', 'saffron', 'autumn', 'morning', 'soft', 'classic'] },
    (r) => (<g><Strewn r={r} color={P.paper} heart={P.marigold} n={38} rad={13} petals={6} />
      <Specks r={r.fork('s')} box={{ x: 40, y: 1080, w: 920, h: 360 }} n={22} color={P.marigold} size={4} opacity={0.3} /></g>)),

  flower('marigold', 'Marigold', 'Genda — the flower the whole festival smells of', [P.marigold, P.amber, P.moss],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['festive', 'nostalgic', 'grand'], intensity: 3, tags: ['marigold', 'orange', 'gold', 'festive', 'classic', 'warm'] },
    (r) => (<g><Garland r={r.fork('g1')} x1={230} x2={770} y={630} sag={60} color={P.marigold} heart={P.amber} />
      <Strewn r={r.fork('s')} color={P.marigold} heart={P.amber} n={26} rad={16} petals={9} /></g>)),

  flower('white-flowers', 'White Flowers', 'Restraint, in floral form', [P.paper, P.cream, P.moss],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['serene', 'intimate'], intensity: 1, tags: ['white', 'soft', 'minimal', 'quiet', 'clean', 'light'] },
    (r) => (<g><Strewn r={r} color={P.paper} heart={P.cream} n={22} rad={15} petals={5} /></g>)),

  flower('hibiscus', 'Red Hibiscus', 'Joba — the one she is actually offered', [P.vermilion, P.red, P.green],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['festive', 'dramatic', 'grand'], intensity: 3, tags: ['red', 'joba', 'hibiscus', 'bold', 'traditional', 'offering'] },
    (r) => (<g><Strewn r={r} color={P.vermilion} heart={P.red} n={20} rad={19} petals={5} />
      <Garland r={r.fork('g')} x1={300} x2={700} y={690} sag={40} color={P.vermilion} heart={P.marigold} n={12} rad={15} /></g>)),

  flower('lotus', 'Lotus', 'One hundred and eight of them, traditionally', [P.pink, P.rose, P.teal],
    { terrain: ['river', 'sea'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['serene', 'grand', 'mystic'], intensity: 2, tags: ['lotus', 'padma', 'pink', 'water', 'sacred', 'soft'] },
    (r) => (<g>
      {Array.from({ length: 9 }, (_, i) => {
        const lr = r.fork('lt' + i)
        const x = lr.range(60, 940), y = lr.range(1180, 1430)
        return (<g key={i}>
          <path d={blob(lr.fork('pad'), x + 26, y + 16, 54, 22, 9, 0.24)} fill={P.teal} opacity={0.26} />
          <Bloom r={lr} x={x} y={y} rad={34} petals={8} color={P.pink} heart={P.amber} opacity={0.46} />
        </g>)
      })}</g>),
    { boost: ['water', 'river', 'sea'] }),

  flower('tuberose', 'Tuberose', 'Rajanigandha — smells strongest after dark', [P.paper, P.cream, P.green],
    { terrain: [], timeOfDay: ['dusk', 'night'], mood: ['intimate', 'nostalgic', 'serene'], intensity: 2, tags: ['white', 'night', 'fragrant', 'soft', 'elegant', 'stem'] },
    (r) => (<g>
      {Array.from({ length: 7 }, (_, i) => {
        const sr = r.fork('tb' + i)
        const x = sr.range(80, 920), base = sr.range(1200, 1400)
        return (<g key={i}>
          <path d={smooth([[x, base], [x + sr.jitter(14), base - 90], [x + sr.jitter(20), base - 180]] as Pt[])} stroke={P.green} strokeWidth={5} fill="none" opacity={0.4} />
          {Array.from({ length: 6 }, (_, k) => <Bloom key={k} r={sr.fork('b' + k)} x={x + sr.jitter(18)} y={base - 40 - k * 28} rad={13} petals={6} color={P.paper} heart={P.cream} opacity={0.56} />)}
        </g>)
      })}</g>)),

  flower('jasmine', 'Jasmine', 'Small, white, and completely out of proportion to its scent', [P.paper, P.moss, P.cream],
    { terrain: [], timeOfDay: ['dusk', 'night', 'dawn'], mood: ['intimate', 'serene', 'nostalgic'], intensity: 1, tags: ['white', 'small', 'fragrant', 'delicate', 'soft', 'night'] },
    (r) => (<g><Garland r={r.fork('g1')} x1={210} x2={790} y={660} sag={70} color={P.paper} heart={P.cream} n={30} rad={9} />
      <Strewn r={r.fork('s')} color={P.paper} heart={P.cream} n={30} rad={9} petals={5} /></g>)),

  flower('mixed', 'Mixed Bengali Flowers', 'Whatever the phool-wala had that morning', [P.marigold, P.vermilion, P.paper],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['festive', 'nostalgic', 'intimate'], intensity: 4, tags: ['mixed', 'colour', 'festive', 'abundant', 'traditional', 'warm'] },
    (r) => (<g><Strewn r={r.fork('a')} color={P.marigold} heart={P.amber} n={16} rad={16} petals={9} />
      <Strewn r={r.fork('b')} color={P.vermilion} heart={P.red} n={12} rad={14} petals={5} />
      <Strewn r={r.fork('c')} color={P.paper} heart={P.marigold} n={18} rad={11} petals={6} /></g>)),

  flower('garlands', 'Hanging Garlands', 'Mala on every upright, three deep', [P.marigold, P.vermilion, P.green],
    { terrain: [], timeOfDay: ['day', 'golden', 'dusk', 'night'], mood: ['festive', 'grand'], intensity: 3, tags: ['garland', 'mala', 'hanging', 'festive', 'traditional', 'colour'] },
    (r) => (<g>
      <Garland r={r.fork('g1')} x1={190} x2={810} y={600} sag={78} color={P.marigold} heart={P.amber} n={24} />
      <Garland r={r.fork('g2')} x1={240} x2={760} y={678} sag={54} color={P.vermilion} heart={P.marigold} n={18} />
      <Garland r={r.fork('g3')} x1={290} x2={710} y={742} sag={34} color={P.green} heart={P.paper} n={14} rad={10} /></g>)),

  flower('flower-arch', 'Flower Arch', 'You walk through it to get to her', [P.rose, P.marigold, P.green],
    { terrain: [], timeOfDay: ['day', 'golden', 'dusk', 'night'], mood: ['festive', 'grand', 'serene'], intensity: 4, tags: ['arch', 'gate', 'flower', 'festive', 'soft', 'colour'] },
    (r) => (<g>
      {Array.from({ length: 26 }, (_, i) => {
        const t = i / 25
        const a = Math.PI + t * Math.PI
        const x = 500 + Math.cos(a) * 300
        const y = 1110 + Math.sin(a) * 420
        return <Bloom key={i} r={r.fork('ar' + i)} x={x + r.jitter(12)} y={y + r.jitter(12)} rad={r.range(15, 24)}
          petals={i % 2 ? 6 : 8} color={i % 3 === 0 ? P.marigold : P.rose} heart={P.amber} opacity={0.46} />
      })}</g>)),

  flower('floating', 'Floating Flowers', 'Set loose on the water and let go', [P.marigold, P.paper, P.teal],
    { terrain: ['river', 'sea'], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['serene', 'nostalgic', 'mystic'], intensity: 2, tags: ['water', 'float', 'river', 'soft', 'drift', 'visarjan'] },
    (r) => (<g>
      {Array.from({ length: 20 }, (_, i) => {
        const fr = r.fork('fl' + i)
        const x = fr.range(20, 980), y = fr.range(1140, 1450)
        return (<g key={i}>
          <ellipse cx={x} cy={y + 9} rx={26} ry={6} fill={P.cream} opacity={0.2} />
          <Bloom r={fr} x={x} y={y} rad={fr.range(13, 21)} petals={7} color={i % 3 ? P.marigold : P.paper} heart={P.amber} opacity={0.5} />
        </g>)
      })}</g>),
    { boost: ['water', 'river', 'sea'] }),
]

/* ------------------------------------------------------------------ *
 * DECORATION — kept deliberately sparse. An overcrowded scene was the
 * single most-named failure mode in the brief.
 * ------------------------------------------------------------------ */

function Smoke({ r, x, y, color = P.paperDeep, n = 3, h = 300 }: {
  r: Rng; x: number; y: number; color?: string; n?: number; h?: number
}) {
  return (
    <g opacity={0.34}>
      {Array.from({ length: n }, (_, i) => {
        const sr = r.fork('sm' + i)
        const pts: Pt[] = Array.from({ length: 6 }, (_, k) => [x + Math.sin(k * 1.1 + i) * (16 + k * 7) + sr.jitter(10), y - (k / 5) * h] as Pt)
        return <path key={i} d={smooth(pts)} stroke={color} strokeWidth={sr.range(8, 20)} fill="none" strokeLinecap="round" opacity={0.3 - i * 0.06} />
      })}
    </g>
  )
}

function decor(id: string, name: string, subtitle: string, palette: string[],
  meta: Asset['meta'], draw: (r: Rng) => ReactNode, affinity?: Asset['affinity']): Asset {
  return { id, category: 'decor', name, subtitle, palette, meta, affinity, art: { kind: 'proc', draw: (r) => draw(r) } }
}

export const decorations: Asset[] = [
  decor('alpana', 'Alpana', 'Rice paste, drawn freehand on the floor at dawn', [P.paper, P.vermilion, P.paperDeep],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['nostalgic', 'serene', 'intimate'], intensity: 2, tags: ['alpana', 'floor', 'white', 'traditional', 'pattern', 'handmade', 'classic'] },
    (r) => (<g opacity={0.6}>
      {[0, 1, 2].map(ring => {
        const rad = 130 + ring * 78
        return (
          <g key={ring} stroke={P.paper} fill="none" strokeWidth={3 - ring * 0.4} opacity={0.7 - ring * 0.12}>
            <ellipse cx={500} cy={1220} rx={rad} ry={rad * 0.34} />
            {Array.from({ length: 10 + ring * 4 }, (_, i) => {
              const a = (i / (10 + ring * 4)) * Math.PI * 2
              const x = 500 + Math.cos(a) * rad, y = 1220 + Math.sin(a) * rad * 0.34
              return <path key={i} d={blob(r.fork(`al${ring}${i}`), x, y, 15, 6, 6, 0.3)} />
            })}
          </g>)
      })}
    </g>)),

  decor('diyas', 'Diyas', 'Rows of them, relit every time the wind gets one', [P.amber, P.clay, P.marigold],
    { terrain: [], timeOfDay: ['dusk', 'night'], mood: ['intimate', 'nostalgic', 'festive'], intensity: 2, tags: ['diya', 'flame', 'warm', 'gold', 'traditional', 'small', 'classic'] },
    (r) => (<g>{Array.from({ length: 14 }, (_, i) => {
      const dr = r.fork('d' + i)
      const x = 100 + i * 58 + dr.jitter(12), y = 1128 + (i % 2) * 26
      return (<g key={i}>
        <path d={blob(dr, x, y, 15, 8, 7, 0.2)} fill={P.clay} opacity={0.62} />
        <circle cx={x} cy={y - 12} r={17} fill={P.marigold} opacity={0.34} filter="url(#glow-tight)" />
        <path d={blob(dr.fork('f'), x, y - 12, 4.6, 9, 6, 0.3)} fill={P.amber} opacity={0.9} />
      </g>)
    })}</g>)),

  decor('bells', 'Bells', 'Kansar and ghanta, rung badly and with feeling', [P.gold, P.earth, P.cream],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['grand', 'nostalgic', 'festive'], intensity: 2, tags: ['bell', 'brass', 'gold', 'sound', 'traditional', 'hanging'] },
    (r) => (<g>{[290, 380, 620, 710].map((x, i) => {
      const br = r.fork('bl' + i)
      const y = 660 + (i % 2) * 40
      const pts: Pt[] = [[x - 26, y + 54], [x - 20, y + 14], [x, y - 6], [x + 20, y + 14], [x + 26, y + 54]]
      return (<g key={i}>
        <path d={`M ${x} ${y - 6} L ${x} ${y - 58}`} stroke={P.earth} strokeWidth={3} opacity={0.5} />
        <Wash d={smooth(pts, true)} color={P.gold} opacity={0.5} />
        <Ink pts={pts} r={br} width={2} opacity={0.44} />
        <circle cx={x} cy={y + 62} r={6} fill={P.earth} opacity={0.6} />
      </g>)
    })}</g>)),

  decor('dhunuchi', 'Dhunuchi', 'Coconut husk, resin, and a great deal of smoke', [P.paperDeep, P.clay, P.marigold],
    { terrain: [], timeOfDay: ['dusk', 'night', 'golden'], mood: ['dramatic', 'nostalgic', 'festive'], intensity: 3, tags: ['smoke', 'dhunuchi', 'dhuno', 'traditional', 'dance', 'warm', 'classic'] },
    (r) => (<g>{[330, 670].map((x, i) => (
      <g key={i}>
        <Smoke r={r.fork('s' + i)} x={x} y={1090} h={420} n={4} />
        <path d={blob(r.fork('v' + i), x, 1110, 32, 24, 8, 0.2)} fill={P.clay} opacity={0.6} />
        <path d={`M ${x} 1110 L ${x} 1160`} stroke={P.clay} strokeWidth={12} opacity={0.5} strokeLinecap="round" />
        <circle cx={x} cy={1094} r={20} fill={P.marigold} opacity={0.4} filter="url(#glow-tight)" />
      </g>))}</g>)),

  decor('hanging-lamps', 'Hanging Lamps', 'Brass, on chains, swinging very slightly', [P.gold, P.amber, P.earth],
    { terrain: [], timeOfDay: ['dusk', 'night'], mood: ['intimate', 'grand', 'nostalgic'], intensity: 2, tags: ['lamp', 'brass', 'hanging', 'warm', 'gold', 'heritage'] },
    (r) => (<g>{[270, 500, 730].map((x, i) => {
      const lr = r.fork('hl' + i)
      const y = 620 + (i === 1 ? -44 : 0)
      return (<g key={i}>
        <path d={`M ${x} 400 L ${x} ${y}`} stroke={P.earth} strokeWidth={2.4} opacity={0.44} />
        <path d={blob(lr, x, y + 26, 24, 30, 8, 0.2)} fill={P.gold} opacity={0.52} />
        <circle cx={x} cy={y + 26} r={40} fill={P.amber} opacity={0.24} filter="url(#glow-tight)" />
      </g>)
    })}</g>)),

  decor('motifs', 'Bengali Motifs', 'Lotus, fish, conch, and a paisley that will not behave', [P.vermilion, P.gold, P.cream],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['nostalgic', 'grand', 'intimate'], intensity: 3, tags: ['motif', 'pattern', 'traditional', 'craft', 'folk', 'detail'] },
    (r) => (<g opacity={0.5}>{Array.from({ length: 18 }, (_, i) => {
      const mr = r.fork('mt' + i)
      const x = 180 + (i % 9) * 82, y = 560 + Math.floor(i / 9) * 560
      return (<g key={i} stroke={i % 2 ? P.vermilion : P.gold} fill="none" strokeWidth={2.4} opacity={0.62}>
        <path d={blob(mr, x, y, 22, 22, 8, 0.34)} />
        <path d={blob(mr.fork('i'), x, y, 10, 10, 6, 0.3)} />
      </g>)
    })}</g>)),

  decor('drapes', 'Fabric Drapes', 'Metres of red cloth, stapled somewhere out of sight', [P.vermilion, P.red, P.gold],
    { terrain: [], timeOfDay: ['day', 'golden', 'dusk', 'night'], mood: ['grand', 'festive', 'dramatic'], intensity: 3, tags: ['fabric', 'cloth', 'red', 'drape', 'soft', 'grand'] },
    () => (<g>{[0, 1, 2, 3].map(i => {
      const x = 180 + i * 213
      const pts: Pt[] = [[x, 560], [x + 40, 700], [x + 20, 860], [x + 60, 1010]]
      return <path key={i} d={smooth([...pts, [x + 130, 1010], [x + 110, 850], [x + 130, 690], [x + 106, 560]] as Pt[], true)}
        fill={i % 2 ? P.vermilion : P.red} opacity={0.26} />
    })}</g>)),

  decor('bamboo-decor', 'Bamboo Work', 'Split cane woven into screens', [P.moss, P.earth, P.cream],
    { terrain: [], timeOfDay: ['day', 'golden', 'dusk', 'night'], mood: ['intimate', 'serene', 'nostalgic'], intensity: 2, tags: ['bamboo', 'craft', 'natural', 'weave', 'honest', 'light'] },
    (r) => (<g stroke={P.moss} strokeWidth={3.4} fill="none" opacity={0.42} strokeLinecap="round">
      {Array.from({ length: 12 }, (_, i) => <path key={'v' + i} d={`M ${150 + i * 62} 600 L ${150 + i * 62 + r.jitter(10)} 1080`} />)}
      {Array.from({ length: 7 }, (_, i) => <path key={'h' + i} d={smooth(ridge(r.fork('bd' + i), 140, 860, 620 + i * 76, 5, 4))} strokeWidth={2.4} />)}
    </g>)),

  decor('floating-lights', 'Floating Lights', 'Little lamps let go on the current', [P.amber, P.marigold, P.cream],
    { terrain: ['river', 'sea'], timeOfDay: ['dusk', 'night'], mood: ['serene', 'mystic', 'intimate'], intensity: 2, tags: ['water', 'float', 'light', 'warm', 'drift', 'quiet'] },
    (r) => (<g>{Array.from({ length: 18 }, (_, i) => {
      const fr = r.fork('fl' + i)
      const x = fr.range(20, 980), y = fr.range(1120, 1450)
      return (<g key={i}>
        <circle cx={x} cy={y} r={26} fill={P.marigold} opacity={0.24} filter="url(#glow-tight)" />
        <circle cx={x} cy={y} r={5.4} fill={P.amber} opacity={0.9} />
        <ellipse cx={x} cy={y + 18} rx={16} ry={5} fill={P.amber} opacity={0.2} />
      </g>)
    })}</g>),
    { boost: ['water', 'river', 'sea'] }),

  decor('incense', 'Incense Smoke', 'Dhoop, drifting sideways in the draught', [P.paperDeep, P.slate, P.cream],
    { terrain: [], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['mystic', 'serene', 'intimate'], intensity: 1, tags: ['smoke', 'incense', 'soft', 'quiet', 'drift', 'subtle'] },
    (r) => (<g>{[400, 500, 600].map((x, i) => <Smoke key={i} r={r.fork('in' + i)} x={x} y={1080} h={480} n={2} />)}</g>)),

  decor('conch', 'Conch Shells', 'Shankha — blown three times, by someone short of breath', [P.cream, P.paperDeep, P.rose],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['nostalgic', 'serene', 'grand'], intensity: 1, tags: ['conch', 'shankha', 'white', 'traditional', 'sound', 'small'] },
    (r) => (<g>{[240, 760].map((x, i) => {
      const cr = r.fork('ch' + i)
      const pts: Pt[] = [[x - 40, 1130], [x - 16, 1096], [x + 20, 1090], [x + 44, 1118], [x + 16, 1148]]
      return (<g key={i}><Wash d={smooth(pts, true)} color={P.cream} opacity={0.6} /><Ink pts={pts} r={cr} width={2} opacity={0.44} /></g>)
    })}</g>)),

  decor('patterns', 'Artistic Patterns', 'The theme-pandal instinct: repeat one thing, a lot', [P.indigo, P.paperDeep, P.vermilion],
    { terrain: [], timeOfDay: ['day', 'dusk', 'night'], mood: ['dramatic', 'grand'], intensity: 3, tags: ['pattern', 'modern', 'art', 'repeat', 'graphic', 'theme'] },
    (r) => (<g opacity={0.4}>{Array.from({ length: 30 }, (_, i) => {
      const pr = r.fork('pt' + i)
      const x = 120 + (i % 10) * 84, y = 600 + Math.floor(i / 10) * 150
      return <path key={i} d={blob(pr, x, y, 28, 28, 3, 0.2)} fill="none" stroke={i % 2 ? P.indigo : P.vermilion} strokeWidth={2.6} />
    })}</g>)),
]
