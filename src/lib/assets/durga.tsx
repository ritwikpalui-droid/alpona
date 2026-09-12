import type { ReactNode } from 'react'
import type { Asset } from '../types'
import type { Rng } from '../rng'
import { P } from '../art/palette'
import { blob, Ink, smooth, Wash, type Pt } from '../art/primitives'

const CX = 500
const FEET = 1072
const HEAD = 792

/**
 * The pratima. Drawn from the marks that actually identify a Durga Puja idol —
 * the fan of ten arms, the trishul, the crown, the lion beneath, the chalchitri
 * board behind. Faces stay abstract: a wash, a crown and three almond marks.
 * That is both the honest watercolour idiom and the respectful one.
 */
interface PratimaOpts {
  skin: string
  cloth: string
  accent: string
  arms?: number
  chal?: 'ekchala' | 'halo' | 'none'
  chalColor?: string
  lion?: boolean
  crown?: 'daaker' | 'tall' | 'simple' | 'none'
  scale?: number
  /** Draw only contour, almost no fill — for the minimal interpretations. */
  linework?: boolean
  /** The four children flanking her, as in a single-frame ekchala. */
  children4?: boolean
}

function Pratima({ r, o }: { r: Rng; o: PratimaOpts }) {
  const s = o.scale ?? 1
  const arms = o.arms ?? 10
  const fill = o.linework ? 0.16 : 0.46
  const y = (v: number) => FEET - (FEET - v) * s
  const shoulderY = y(882)

  const armPaths: ReactNode[] = []
  const perSide = Math.floor(arms / 2)
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < perSide; i++) {
      const ar = r.fork(`arm${side}${i}`)
      const t = perSide === 1 ? 0.5 : i / (perSide - 1)
      const angle = (-78 + t * 118) * (Math.PI / 180)
      const len = (128 + ar.jitter(16)) * s * (1 - Math.abs(t - 0.5) * 0.16)
      const sx = CX + side * 30 * s
      const ex = sx + side * Math.cos(angle) * len
      const ey = shoulderY - Math.sin(angle) * len * 0.92
      const mx = sx + side * Math.cos(angle) * len * 0.55 + ar.jitter(9)
      const my = shoulderY - Math.sin(angle) * len * 0.5 + ar.jitter(9)
      armPaths.push(
        <g key={`${side}${i}`}>
          <path d={smooth([[sx, shoulderY], [mx, my], [ex, ey]] as Pt[])}
            stroke={o.skin} strokeWidth={10 * s} fill="none" strokeLinecap="round" opacity={o.linework ? 0.34 : 0.58} />
          <circle cx={ex} cy={ey} r={7 * s} fill={o.skin} opacity={o.linework ? 0.34 : 0.6} />
        </g>,
      )
    }
  }

  const torso: Pt[] = [
    [CX - 34 * s, y(FEET)], [CX - 46 * s, y(990)], [CX - 40 * s, y(906)],
    [CX - 24 * s, y(846)], [CX + 24 * s, y(846)], [CX + 40 * s, y(906)],
    [CX + 46 * s, y(990)], [CX + 34 * s, y(FEET)],
  ]

  return (
    <g>
      {/* backdrop board */}
      {o.chal === 'ekchala' && (() => {
        const cr = r.fork('chal')
        const pts: Pt[] = [
          [CX - 210 * s, FEET], [CX - 218 * s, y(900)], [CX - 150 * s, y(736)],
          [CX, y(672)], [CX + 150 * s, y(736)], [CX + 218 * s, y(900)], [CX + 210 * s, FEET],
        ]
        return (
          <g>
            <Wash d={smooth(pts, true)} color={o.chalColor ?? P.marigold} opacity={0.3} />
            <Ink pts={pts} r={cr} width={2.6} opacity={0.4} />
            <g stroke={o.accent} strokeWidth={2.4} opacity={0.34} fill="none">
              {Array.from({ length: 13 }, (_, i) => {
                const a = Math.PI + (i / 12) * Math.PI
                return <path key={i} d={`M ${CX + Math.cos(a) * 108 * s} ${y(880) + Math.sin(a) * 120 * s} L ${CX + Math.cos(a) * 178 * s} ${y(880) + Math.sin(a) * 190 * s}`} />
              })}
            </g>
          </g>
        )
      })()}
      {o.chal === 'halo' && (
        <g>
          <circle cx={CX} cy={y(842)} r={186 * s} fill={o.chalColor ?? P.gold} opacity={0.16} />
          <circle cx={CX} cy={y(842)} r={186 * s} fill="none" stroke={o.accent} strokeWidth={3} opacity={0.34} />
        </g>
      )}

      {/* the four children, as a single-frame ekchala carries them */}
      {o.children4 && (
        <g opacity={0.5}>
          {[-166, -108, 108, 166].map((dx, i) => {
            const kr = r.fork('kid' + i)
            const kx = CX + dx * s
            return (
              <g key={i}>
                <path d={blob(kr, kx, y(980), 26 * s, 46 * s, 8, 0.2)} fill={i % 2 ? o.cloth : o.accent} opacity={0.44} />
                <circle cx={kx} cy={y(1040)} r={16 * s} fill={o.skin} opacity={0.5} />
              </g>
            )
          })}
        </g>
      )}

      {/* lion */}
      {o.lion !== false && (() => {
        const lr = r.fork('lion')
        return (
          <g opacity={0.5}>
            <path d={blob(lr, CX - 108 * s, y(1030), 76 * s, 44 * s, 9, 0.26)} fill={P.amber} opacity={0.44} />
            <path d={blob(lr.fork('mane'), CX - 152 * s, y(1042), 40 * s, 40 * s, 11, 0.34)} fill={P.marigold} opacity={0.5} />
            <Ink pts={[[CX - 176 * s, y(1000)], [CX - 120 * s, y(1006)], [CX - 40 * s, y(1024)]] as Pt[]} r={lr} width={2} opacity={0.3} />
          </g>
        )
      })()}

      {/* body */}
      <g>
        {armPaths}
        <Wash d={smooth(torso, true)} color={o.cloth} opacity={fill} rim={!o.linework} />
        <Ink pts={torso} close r={r.fork('torso')} width={2.4} opacity={o.linework ? 0.6 : 0.44} />
        <path d={blob(r.fork('head'), CX, y(HEAD + 24), 30 * s, 34 * s, 9, 0.12)} fill={o.skin} opacity={o.linework ? 0.24 : 0.56} />
        <Ink pts={[[CX - 30 * s, y(HEAD + 24)], [CX, y(HEAD - 8)], [CX + 30 * s, y(HEAD + 24)], [CX, y(HEAD + 60)]] as Pt[]} close r={r.fork('face')} width={2} opacity={0.44} />
        {/* three eyes — the mark that says Durga and nothing else */}
        <g fill={P.ink} opacity={0.62}>
          <ellipse cx={CX - 11 * s} cy={y(HEAD + 24)} rx={6 * s} ry={3 * s} />
          <ellipse cx={CX + 11 * s} cy={y(HEAD + 24)} rx={6 * s} ry={3 * s} />
          <ellipse cx={CX} cy={y(HEAD + 42)} rx={3 * s} ry={7 * s} />
        </g>
      </g>

      {/* crown */}
      {o.crown !== 'none' && (() => {
        const kr = r.fork('crown')
        const h = o.crown === 'tall' ? 118 : o.crown === 'simple' ? 46 : 84
        const half = o.crown === 'simple' ? 30 : 44
        const pts: Pt[] = [
          [CX - half * s, y(HEAD - 12)], [CX - half * 0.7 * s, y(HEAD - 12 - h * 0.6)],
          [CX, y(HEAD - 12 - h)], [CX + half * 0.7 * s, y(HEAD - 12 - h * 0.6)], [CX + half * s, y(HEAD - 12)],
        ]
        return (
          <g>
            <Wash d={smooth(pts, true)} color={o.accent} opacity={0.5} />
            <Ink pts={pts} r={kr} width={2.2} opacity={0.5} />
            {o.crown === 'daaker' && (
              <g stroke={o.accent} strokeWidth={2.6} opacity={0.5} fill="none">
                {[-1, 0, 1].map(k => <path key={k} d={`M ${CX + k * 26 * s} ${y(HEAD - 16)} l ${k * 12 * s} ${-38 * s}`} strokeLinecap="round" />)}
              </g>
            )}
          </g>
        )
      })()}

      {/* trishul — always present, always in the upper right hand */}
      <g stroke={P.ink} strokeWidth={4 * s} fill="none" opacity={0.6} strokeLinecap="round">
        <path d={`M ${CX + 150 * s} ${y(1010)} L ${CX + 158 * s} ${y(770)}`} />
        <path d={`M ${CX + 138 * s} ${y(806)} L ${CX + 140 * s} ${y(754)} M ${CX + 158 * s} ${y(788)} L ${CX + 159 * s} ${y(736)} M ${CX + 178 * s} ${y(806)} L ${CX + 176 * s} ${y(754)}`} />
      </g>
    </g>
  )
}

function make(id: string, name: string, subtitle: string, palette: string[],
  meta: Asset['meta'], o: PratimaOpts, affinity?: Asset['affinity']): Asset {
  return {
    id, category: 'durga', name, subtitle, palette, meta, affinity,
    art: { kind: 'proc', draw: (r) => <Pratima r={r} o={o} /> },
  }
}

export const durgaIdols: Asset[] = [
  make('ekchala', 'Ekchala Durga', 'All five in one frame, under one arch',
    [P.marigold, P.vermilion, P.gold],
    { terrain: ['river', 'plain', 'interior', 'urban'], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['nostalgic', 'grand', 'festive'], intensity: 5, tags: ['traditional', 'ekchala', 'classic', 'family', 'sabeki', 'gold'] },
    { skin: P.clay, cloth: P.vermilion, accent: P.gold, chal: 'ekchala', chalColor: P.marigold, crown: 'daaker', children4: true }),

  make('sabeki', 'Classical Bengali Durga', 'The bonedi-bari face, unchanged for a century',
    [P.vermilion, P.gold, P.clay],
    { terrain: ['interior', 'river', 'urban', 'plain'], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['nostalgic', 'serene', 'grand'], intensity: 4, tags: ['traditional', 'sabeki', 'classic', 'gold', 'bonedi'] },
    { skin: P.clay, cloth: P.vermilion, accent: P.gold, chal: 'halo', chalColor: P.gold, crown: 'daaker' }),

  make('serene', 'Serene Durga', 'Ten arms, and not one of them in a hurry',
    [P.cream, P.teal, P.gold],
    { terrain: ['mountain', 'forest', 'sea', 'river'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['serene', 'mystic', 'intimate'], intensity: 2, tags: ['calm', 'quiet', 'soft', 'gentle', 'light'] },
    { skin: P.cream, cloth: P.teal, accent: P.gold, chal: 'halo', chalColor: P.cream, crown: 'simple' }),

  make('fierce', 'Fierce Durga', 'Mid-strike, the moment before',
    [P.red, P.ink, P.marigold],
    { terrain: ['mountain', 'forest', 'urban', 'sea'], timeOfDay: ['dusk', 'night'], mood: ['dramatic', 'grand'], intensity: 5, tags: ['fierce', 'dark', 'power', 'bold', 'storm', 'roudra'] },
    { skin: P.earth, cloth: P.red, accent: P.marigold, chal: 'halo', chalColor: P.red, crown: 'tall' }),

  make('royal-gold', 'Royal Gold Durga', 'Daaker saaj, every surface catching light',
    [P.gold, P.vermilion, P.cream],
    { terrain: ['interior', 'urban', 'plain', 'rooftop'], timeOfDay: ['golden', 'dusk', 'night'], mood: ['grand', 'festive', 'dramatic'], intensity: 5, tags: ['gold', 'opulent', 'royal', 'shine', 'daaker', 'rich'] },
    { skin: P.cream, cloth: P.gold, accent: P.vermilion, chal: 'ekchala', chalColor: P.gold, crown: 'tall' }),

  make('white-minimal', 'White Durga', 'Unpainted clay left as it is',
    [P.paper, P.paperDeep, P.ink],
    { terrain: ['sea', 'mountain', 'rooftop', 'river'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['serene', 'intimate'], intensity: 1, tags: ['minimal', 'white', 'quiet', 'restraint', 'modern', 'light'] },
    { skin: P.paperDeep, cloth: P.paper, accent: P.paperDeep, chal: 'none', crown: 'simple', linework: true }),

  make('terracotta-idol', 'Terracotta Durga', 'Fired clay, the colour of the riverbank',
    [P.terracotta, P.clay, P.earth],
    { terrain: ['river', 'plain', 'forest', 'interior'], timeOfDay: ['dawn', 'golden', 'dusk'], mood: ['nostalgic', 'serene', 'intimate'], intensity: 3, tags: ['terracotta', 'clay', 'earthy', 'craft', 'matte', 'kumartuli'] },
    { skin: P.clay, cloth: P.terracotta, accent: P.earth, chal: 'halo', chalColor: P.clay, crown: 'simple' }),

  make('contemporary', 'Contemporary Durga', 'An artist reinterpreting her, carefully',
    [P.indigo, P.paperDeep, P.vermilion],
    { terrain: ['urban', 'rooftop', 'sea', 'plain'], timeOfDay: ['dusk', 'night', 'day'], mood: ['dramatic', 'serene'], intensity: 3, tags: ['modern', 'art', 'contemporary', 'clean', 'theme'] },
    { skin: P.paperDeep, cloth: P.indigo, accent: P.vermilion, chal: 'halo', chalColor: P.indigo, crown: 'simple' }),

  make('monumental', 'Monumental Durga', 'Three storeys tall, visible from the road',
    [P.earth, P.gold, P.slate],
    { terrain: ['urban', 'plain', 'rooftop', 'sea'], timeOfDay: ['golden', 'dusk', 'night'], mood: ['grand', 'dramatic'], intensity: 4, tags: ['huge', 'scale', 'monument', 'stone', 'awe'] },
    { skin: P.slate, cloth: P.earth, accent: P.gold, chal: 'none', crown: 'tall', scale: 1.3 }),

  make('village-durga', 'Village Durga', 'Made in the para, by someone’s uncle',
    [P.clay, P.marigold, P.green],
    { terrain: ['plain', 'river', 'forest'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['intimate', 'nostalgic', 'festive'], intensity: 3, tags: ['village', 'folk', 'handmade', 'warm', 'simple', 'gram'] },
    { skin: P.clay, cloth: P.marigold, accent: P.green, chal: 'ekchala', chalColor: P.clay, crown: 'simple', children4: true }),

  make('sculptural', 'Sculptural Durga', 'Form reduced until only the gesture is left',
    [P.slate, P.paperDeep, P.ink],
    { terrain: ['rooftop', 'sea', 'mountain', 'urban'], timeOfDay: ['day', 'dusk', 'night'], mood: ['dramatic', 'serene'], intensity: 2, tags: ['abstract', 'modern', 'stone', 'minimal', 'sculpture', 'art'] },
    { skin: P.slate, cloth: P.paperDeep, accent: P.ink, chal: 'none', crown: 'tall', arms: 6, linework: true }),

  make('shiuli-durga', 'Shiuli Durga', 'White and saffron, like the flower itself',
    [P.paper, P.marigold, P.moss],
    { terrain: ['plain', 'forest', 'river', 'mountain'], timeOfDay: ['dawn', 'day'], mood: ['serene', 'nostalgic', 'intimate'], intensity: 2, tags: ['shiuli', 'white', 'saffron', 'autumn', 'morning', 'soft'] },
    { skin: P.cream, cloth: P.paper, accent: P.marigold, chal: 'halo', chalColor: P.marigold, crown: 'simple' }),
]
