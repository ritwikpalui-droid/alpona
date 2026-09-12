import type { ReactNode } from 'react'
import type { Asset } from '../types'
import type { Rng } from '../rng'
import { P } from '../art/palette'
import { blob, Ink, ridge, smooth, Specks, Wash, type Pt } from '../art/primitives'

const CX = 500
const BASE = 1100
const NICHE = { x: 358, y: 700, w: 284, h: 400 }

/** The recess the idol stands in. Every pandal needs one or the idol floats. */
function Niche({ color = P.ink, opacity = 0.3 }: { color?: string; opacity?: number }) {
  const pts: Pt[] = [
    [NICHE.x, BASE], [NICHE.x - 6, NICHE.y + 110],
    [CX - 90, NICHE.y - 10], [CX, NICHE.y - 46], [CX + 90, NICHE.y - 10],
    [NICHE.x + NICHE.w + 6, NICHE.y + 110], [NICHE.x + NICHE.w, BASE],
  ]
  return <path d={smooth(pts, true)} fill={color} opacity={opacity} />
}

function Plinth({ r, color }: { r: Rng; color: string }) {
  const top = ridge(r, 180, 820, BASE, 5, 6)
  return (
    <g>
      <Wash d={smooth([...top, [820, BASE + 70], [180, BASE + 70]] as Pt[], true)} color={color} opacity={0.4} />
      <Ink pts={top} r={r} width={2.4} opacity={0.4} />
    </g>
  )
}

/** Bengali chala roof — the concave-eaved curve, stacked n times. */
function Chala({ r, tiers, color, ink = true }: { r: Rng; tiers: number; color: string; ink?: boolean }) {
  return (
    <g>
      {Array.from({ length: tiers }, (_, i) => {
        const tr = r.fork('chala' + i)
        const y = 700 - i * 118
        const half = 300 - i * 62
        const pts: Pt[] = [
          [CX - half, y], [CX - half * 0.55, y - 52 - i * 4], [CX, y - 96 - i * 6],
          [CX + half * 0.55, y - 52 - i * 4], [CX + half, y],
        ]
        const d = smooth([...pts, [CX + half - 14, y + 30], [CX - half + 14, y + 30]] as Pt[], true)
        return (
          <g key={i}>
            <Wash d={d} color={color} opacity={0.42 - i * 0.03} />
            {ink && <Ink pts={pts} r={tr} width={2.6} opacity={0.46} />}
          </g>
        )
      })}
      <path d={`M ${CX} ${700 - (tiers - 1) * 118 - 100} l 0 -60`} stroke={P.ink} strokeWidth={5} opacity={0.5} strokeLinecap="round" />
      <path d={blob(r.fork('finial'), CX, 700 - (tiers - 1) * 118 - 172, 20, 26, 7, 0.3)} fill={color} opacity={0.6} />
    </g>
  )
}

function Columns({ r, xs, top, color, capital }: { r: Rng; xs: number[]; top: number; color: string; capital?: string }) {
  return (
    <g>
      {xs.map((x, i) => {
        const cr = r.fork('c' + i)
        const pts: Pt[] = [[x - 26, BASE], [x - 20, top + 20], [x + 20, top + 20], [x + 26, BASE]]
        return (
          <g key={i}>
            <Wash d={smooth(pts, true)} color={color} opacity={0.44} />
            <Ink pts={pts} r={cr} width={2} opacity={0.4} />
            {capital && <path d={blob(cr, x, top + 10, 38, 17, 7, 0.2)} fill={capital} opacity={0.44} />}
          </g>
        )
      })}
    </g>
  )
}

function Arch({ r, cx, y, half, h, color, fill = true }: {
  r: Rng; cx: number; y: number; half: number; h: number; color: string; fill?: boolean
}) {
  const pts: Pt[] = [[cx - half, y], [cx - half, y - h * 0.5], [cx, y - h], [cx + half, y - h * 0.5], [cx + half, y]]
  return (
    <g>
      {fill && <Wash d={smooth(pts, true)} color={color} opacity={0.3} />}
      <Ink pts={pts} r={r} width={2.2} opacity={0.42} />
    </g>
  )
}

function make(id: string, name: string, subtitle: string, palette: string[],
  meta: Asset['meta'], draw: (r: Rng) => ReactNode, affinity?: Asset['affinity']): Asset {
  return { id, category: 'pandal', name, subtitle, palette, meta, affinity, art: { kind: 'proc', draw: (r) => draw(r) } }
}

export const pandals: Asset[] = [
  make('bengali-temple', 'Bengali Temple', 'Aat-chala, the roof that curves like a hut',
    [P.terracotta, P.cream, P.ink],
    { terrain: ['river', 'plain', 'urban', 'interior'], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['nostalgic', 'serene', 'grand'], intensity: 3, tags: ['traditional', 'temple', 'chala', 'classic', 'terracotta'] },
    (r) => (<g><Chala r={r} tiers={3} color={P.terracotta} /><Niche /><Columns r={r} xs={[300, 700]} top={700} color={P.cream} capital={P.gold} /><Plinth r={r} color={P.paperDeep} /></g>)),

  make('terracotta', 'Terracotta Temple', 'Baked clay panels, every inch told a story',
    [P.clay, P.terracotta, P.earth],
    { terrain: ['river', 'plain', 'forest', 'interior'], timeOfDay: ['dawn', 'golden', 'dusk'], mood: ['nostalgic', 'grand', 'intimate'], intensity: 4, tags: ['traditional', 'terracotta', 'bishnupur', 'carved', 'earthy', 'classic'] },
    (r) => (
      <g>
        <Wash d={smooth([[220, BASE], [230, 640], [CX, 560], [770, 640], [780, BASE]] as Pt[], true)} color={P.clay} opacity={0.44} />
        <Niche opacity={0.34} />
        {[300, 700].map((x, i) => <Arch key={i} r={r.fork('a' + i)} cx={x} y={BASE} half={62} h={300} color={P.earth} />)}
        <g opacity={0.36}>
          {Array.from({ length: 18 }, (_, i) => (
            <rect key={i} x={250 + (i % 9) * 56} y={600 + Math.floor(i / 9) * 46} width={40} height={32} rx={3}
              fill="none" stroke={P.earth} strokeWidth={2} />
          ))}
        </g>
        <Specks r={r.fork('sp')} box={{ x: 220, y: 560, w: 560, h: 540 }} n={26} color={P.terracotta} size={4} opacity={0.2} />
        <Plinth r={r} color={P.earth} />
      </g>)),

  make('zamindar-mansion', 'Zamindar Mansion', 'A pillared thakur dalan, faintly peeling',
    [P.cream, P.gold, P.earth],
    { terrain: ['interior', 'urban', 'plain'], timeOfDay: ['dusk', 'night', 'golden'], mood: ['nostalgic', 'grand', 'intimate'], intensity: 3, tags: ['bonedi', 'heritage', 'columns', 'gold', 'classic', 'indoor'] },
    (r) => (
      <g>
        <Wash d={smooth([[200, 640], [CX, 566], [800, 640], [800, 700], [200, 700]] as Pt[], true)} color={P.cream} opacity={0.5} />
        <Ink pts={[[200, 640], [CX, 566], [800, 640]] as Pt[]} r={r} width={3} opacity={0.44} />
        <Niche />
        <Columns r={r} xs={[250, 372, 628, 750]} top={690} color={P.cream} capital={P.gold} />
        {[[311, 0], [689, 1]].map(([x], i) => <Arch key={i} r={r.fork('ar' + i)} cx={x as number} y={1040} half={52} h={200} color={P.paperDeep} />)}
        <Plinth r={r} color={P.cream} />
      </g>)),

  make('royal-palace', 'Royal Palace', 'Domes, and more gold than is strictly wise',
    [P.gold, P.cream, P.vermilion],
    { terrain: ['interior', 'plain', 'urban', 'rooftop'], timeOfDay: ['golden', 'dusk', 'night'], mood: ['grand', 'dramatic', 'festive'], intensity: 5, tags: ['palace', 'gold', 'dome', 'opulent', 'royal', 'grand'] },
    (r) => (
      <g>
        <Wash d={smooth([[210, BASE], [210, 700], [790, 700], [790, BASE]] as Pt[], true)} color={P.cream} opacity={0.46} />
        {[[CX, 130], [300, 78], [700, 78]].map(([x, rad], i) => {
          const dr = r.fork('dome' + i)
          const y = i === 0 ? 700 : 720
          return (
            <g key={i}>
              <path d={smooth([[x - rad, y], [x - rad * 0.8, y - rad * 1.1], [x, y - rad * 1.7], [x + rad * 0.8, y - rad * 1.1], [x + rad, y]] as Pt[], true)}
                fill={P.gold} opacity={0.42} />
              <Ink pts={[[x - rad, y], [x - rad * 0.8, y - rad * 1.1], [x, y - rad * 1.7], [x + rad * 0.8, y - rad * 1.1], [x + rad, y]] as Pt[]} r={dr} width={2.4} opacity={0.44} />
              <path d={`M ${x} ${y - rad * 1.7} l 0 -34`} stroke={P.gold} strokeWidth={5} opacity={0.6} strokeLinecap="round" />
            </g>
          )
        })}
        <Niche />
        <Columns r={r} xs={[262, 738]} top={700} color={P.cream} capital={P.gold} />
        {[300, 700].map((x, i) => <Arch key={i} r={r.fork('pa' + i)} cx={x} y={BASE} half={58} h={270} color={P.vermilion} />)}
        <Plinth r={r} color={P.gold} />
      </g>)),

  make('bamboo', 'Bamboo Structure', 'Lashed poles, the way a pandal actually gets built',
    [P.moss, P.earth, P.cream],
    { terrain: ['plain', 'forest', 'river', 'urban'], timeOfDay: ['day', 'golden', 'dusk', 'night'], mood: ['intimate', 'serene', 'festive'], intensity: 2, tags: ['bamboo', 'craft', 'honest', 'lattice', 'natural', 'light'] },
    (r) => (
      <g>
        <g stroke={P.moss} strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.52}>
          {[240, 330, 670, 760].map((x, i) => <path key={i} d={`M ${x} ${BASE} L ${x + r.jitter(14)} ${610}`} />)}
          {Array.from({ length: 6 }, (_, i) => (
            <path key={'h' + i} d={smooth(ridge(r.fork('bh' + i), 230, 770, 640 + i * 78, 5, 4))} strokeWidth={6} />
          ))}
          <path d={smooth([[200, 620], [CX, 540], [800, 620]] as Pt[])} strokeWidth={11} />
          {Array.from({ length: 9 }, (_, i) => (
            <path key={'d' + i} d={`M ${230 + i * 68} 616 L ${CX} 548`} strokeWidth={4} opacity={0.7} />
          ))}
        </g>
        <Niche opacity={0.2} />
        <Plinth r={r} color={P.earth} />
      </g>)),

  make('geometric', 'Geometric Structure', 'Folded planes — the theme pandal school',
    [P.indigo, P.paperDeep, P.vermilion],
    { terrain: ['urban', 'rooftop', 'plain', 'sea'], timeOfDay: ['dusk', 'night', 'day'], mood: ['dramatic', 'grand'], intensity: 4, tags: ['modern', 'contemporary', 'angular', 'bold', 'theme', 'art'] },
    (r) => (
      <g>
        {[0, 1, 2, 3, 4].map(i => {
          const gr = r.fork('g' + i)
          const half = 300 - i * 46
          const y = BASE - i * 96
          const pts: Pt[] = [[CX - half, y], [CX - half * 0.5, y - 150], [CX + half * 0.5, y - 150], [CX + half, y]]
          return (
            <g key={i}>
              <Wash d={smooth(pts, true)} color={i % 2 ? P.indigo : P.paperDeep} opacity={0.3} />
              <Ink pts={pts} r={gr} width={2.4} opacity={0.4} />
            </g>
          )
        })}
        <Niche opacity={0.26} />
        <path d={`M ${CX} 560 l 0 -70`} stroke={P.vermilion} strokeWidth={7} opacity={0.6} strokeLinecap="round" />
        <Plinth r={r} color={P.indigo} />
      </g>)),

  make('floral-structure', 'Giant Floral Structure', 'A pandal built as one enormous opening flower',
    [P.rose, P.marigold, P.moss],
    { terrain: ['plain', 'forest', 'river', 'urban'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['festive', 'serene', 'grand'], intensity: 4, tags: ['flower', 'petal', 'soft', 'organic', 'colour', 'art'] },
    (r) => (
      <g>
        {Array.from({ length: 9 }, (_, i) => {
          const a = -Math.PI + (i / 8) * Math.PI
          const pr = r.fork('petal' + i)
          const len = 330 + pr.jitter(50)
          const px = CX + Math.cos(a) * len * 0.92
          const py = 1030 + Math.sin(a) * len * 0.86
          return <path key={i} d={blob(pr, px, py, 118, 88, 8, 0.3)} fill={i % 2 ? P.rose : P.marigold} opacity={0.26} />
        })}
        <Niche opacity={0.22} />
        <path d={blob(r.fork('core'), CX, 1010, 180, 150, 10, 0.2)} fill={P.marigold} opacity={0.2} />
        <Plinth r={r} color={P.moss} />
      </g>)),

  make('ruins', 'Ancient Ruins', 'Whatever is left, made sacred again',
    [P.slate, P.moss, P.earth],
    { terrain: ['forest', 'mountain', 'plain', 'sea'], timeOfDay: ['dawn', 'dusk', 'night'], mood: ['mystic', 'dramatic', 'nostalgic'], intensity: 3, tags: ['ruin', 'stone', 'broken', 'moss', 'ancient', 'wild'] },
    (r) => (
      <g>
        <Arch r={r.fork('a1')} cx={CX} y={BASE} half={200} h={500} color={P.slate} />
        {[[250, 340], [750, 420]].map(([x, h], i) => {
          const br2 = r.fork('br' + i)
          const pts: Pt[] = [[x - 42, BASE], [x - 34, BASE - h], [x + 20, BASE - h + 40], [x + 42, BASE]]
          return (<g key={i}><Wash d={smooth(pts, true)} color={P.slate} opacity={0.4} /><Ink pts={pts} r={br2} width={2.2} opacity={0.42} /></g>)
        })}
        <Niche opacity={0.24} />
        <g opacity={0.34}>
          {Array.from({ length: 7 }, (_, i) => (
            <path key={i} d={blob(r.fork('moss' + i), r.range(260, 740), r.range(700, 1090), r.range(26, 56), r.range(16, 32), 7, 0.4)} fill={P.moss} />
          ))}
        </g>
        <Plinth r={r} color={P.slate} />
      </g>)),

  make('monastery', 'Monastery Form', 'Tiered eaves borrowed from the high hills',
    [P.vermilion, P.cream, P.gold],
    { terrain: ['mountain', 'forest'], timeOfDay: ['dawn', 'day', 'golden', 'night'], mood: ['serene', 'mystic', 'grand'], intensity: 3, tags: ['mountain', 'tiered', 'himalaya', 'calm', 'gompa', 'red'] },
    (r) => (
      <g>
        <Wash d={smooth([[240, BASE], [250, 660], [750, 660], [760, BASE]] as Pt[], true)} color={P.cream} opacity={0.46} />
        {[0, 1, 2].map(i => {
          const tr = r.fork('t' + i)
          const y = 690 - i * 110
          const half = 310 - i * 66
          const pts: Pt[] = [[CX - half, y], [CX - half * 0.6, y - 40], [CX, y - 58], [CX + half * 0.6, y - 40], [CX + half, y]]
          return (<g key={i}><Wash d={smooth([...pts, [CX + half - 20, y + 26], [CX - half + 20, y + 26]] as Pt[], true)} color={P.vermilion} opacity={0.4} /><Ink pts={pts} r={tr} width={2.4} opacity={0.44} /></g>)
        })}
        <Niche />
        <g opacity={0.5}>{[330, 670].map((x, i) => <rect key={i} x={x - 22} y={780} width={44} height={70} rx={5} fill={P.gold} opacity={0.5} />)}</g>
        <Plinth r={r} color={P.paperDeep} />
      </g>)),

  make('minimal', 'Minimal Pandal', 'One frame. Nothing else. Let her be the thing',
    [P.paperDeep, P.ink, P.cream],
    { terrain: ['sea', 'mountain', 'rooftop', 'plain', 'river'], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['serene', 'intimate'], intensity: 1, tags: ['minimal', 'quiet', 'modern', 'restraint', 'clean', 'light'] },
    (r) => (
      <g>
        <g stroke={P.ink} fill="none" opacity={0.5} strokeLinecap="round" strokeWidth={7}>
          <path d={smooth([[300, BASE], [298, 640], [702, 640], [700, BASE]] as Pt[])} />
        </g>
        <Wash d={smooth([[300, BASE], [298, 640], [702, 640], [700, BASE]] as Pt[], true)} color={P.paperDeep} opacity={0.22} rim={false} />
        <Niche opacity={0.14} />
        <Plinth r={r} color={P.cream} />
      </g>)),

  make('wooden', 'Wooden Bengal', 'Plank and gable, silvered by weather',
    [P.earth, P.clay, P.moss],
    { terrain: ['forest', 'plain', 'river', 'mountain'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['intimate', 'nostalgic', 'serene'], intensity: 2, tags: ['wood', 'warm', 'rustic', 'craft', 'natural', 'village'] },
    (r) => (
      <g>
        <Wash d={smooth([[230, BASE], [240, 700], [CX, 588], [760, 700], [770, BASE]] as Pt[], true)} color={P.earth} opacity={0.4} />
        <Ink pts={[[230, BASE], [240, 700], [CX, 588], [760, 700], [770, BASE]] as Pt[]} r={r} width={2.8} opacity={0.46} />
        <g stroke={P.clay} strokeWidth={4} opacity={0.34}>
          {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M ${256 + i * 62} ${BASE} L ${256 + i * 62} 700`} />)}
        </g>
        <Niche opacity={0.3} />
        <Plinth r={r} color={P.earth} />
      </g>)),

  make('toran', 'Ceremonial Arch', 'A single enormous gateway, and she is through it',
    [P.marigold, P.vermilion, P.gold],
    { terrain: ['urban', 'plain', 'river', 'rooftop'], timeOfDay: ['golden', 'dusk', 'night'], mood: ['festive', 'grand', 'dramatic'], intensity: 4, tags: ['arch', 'gate', 'toran', 'festive', 'colour', 'welcome'] },
    (r) => (
      <g>
        <Arch r={r.fork('outer')} cx={CX} y={BASE} half={262} h={540} color={P.marigold} />
        <Arch r={r.fork('inner')} cx={CX} y={BASE} half={176} h={410} color={P.vermilion} />
        <Niche opacity={0.26} />
        <g opacity={0.46}>
          {Array.from({ length: 11 }, (_, i) => {
            const a = Math.PI + (i / 10) * Math.PI
            return <circle key={i} cx={CX + Math.cos(a) * 218} cy={BASE - 250 + Math.sin(a) * 250} r={11} fill={P.gold} />
          })}
        </g>
        <Plinth r={r} color={P.vermilion} />
      </g>)),
]
