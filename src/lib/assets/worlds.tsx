import type { ReactNode } from 'react'
import type { Asset } from '../types'
import type { Rng } from '../rng'
import { HORIZON, P, W } from '../art/palette'
import { blob, Ink, ridge, smooth, Specks, Wash, type Pt } from '../art/primitives'
import { Buildings, Ground, Mist, Peaks, Reflection, Steps, Trees, Water } from '../art/scenery'
import { Bird } from '../art/motifs'

/**
 * A graduated sky — several overlapping horizontal washes instead of one
 * flat rect, so it reads as atmosphere (the way real watercolour skies are
 * built, wet-in-wet, pale at the top and deepening toward the horizon)
 * rather than a single colour swatch behind everything else.
 */
function SkyGrad({ bands }: { bands: [string, number, number][] }) {
  return (
    <g>
      {bands.map(([color, y0, opacity], i) => (
        <Wash key={i} d={`M -40 -60 L 1040 -60 L 1040 ${y0} L -40 ${y0} Z`} color={color} opacity={opacity} rim={false} />
      ))}
    </g>
  )
}

/** A simple distant skyline — hazy silhouettes, no detail, purely for depth. */
function FarSkyline({ xs, y, color, opacity = 0.32 }: { xs: number[]; y: number; color: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      {xs.map((x, i) => {
        const h = 34 + (i % 3) * 26
        const pts: Pt[] = [[x - 20, y], [x - 20, y - h], [x, y - h - 16], [x + 20, y - h], [x + 20, y]]
        return <path key={i} d={smooth(pts, true)} fill={color} />
      })}
    </g>
  )
}

/** A soft cumulus cloud — a cluster of overlapping rounded blobs, not one
 *  flat oval, the same "pigment pools where shapes overlap" trick as
 *  everywhere else. */
function Cloud({ r, x, y, scale = 1, color }: { r: Rng; x: number; y: number; scale?: number; color: string }) {
  const puffs: Pt[] = [[-1.4, 0.1], [-0.6, -0.3], [0.3, -0.4], [1.1, -0.1], [1.6, 0.2], [0.4, 0.3], [-0.6, 0.35]]
  return (
    <g>
      {puffs.map(([dx, dy], i) => (
        <path key={i} d={blob(r.fork('puff' + i), x + dx * 70 * scale, y + dy * 60 * scale, 46 * scale, 30 * scale, 8, 0.24)}
          fill={color} opacity={0.4} />
      ))}
    </g>
  )
}

/** One kash stalk — a wind-bent stem topped with a fluffy silvery plume
 *  (Saccharum spontaneum, the tall grass that floods Bengal's riverbanks
 *  and chars every sharatkal, right when Puja is near). The plume is a soft
 *  wash blob plus a handful of fine wispy strokes fanning off the tip, not
 *  a single flat puff — that fan is what actually reads as "feathery" at
 *  small size. */
function KashStalk({ r, x, baseY, h, lean, color }: { r: Rng; x: number; baseY: number; h: number; lean: number; color: string }) {
  const midX = x + lean * 0.45
  const midY = baseY - h * 0.55
  const topX = x + lean
  const topY = baseY - h
  const stemPts: Pt[] = [[x, baseY], [midX, midY], [topX, topY]]
  return (
    <g>
      <Ink pts={stemPts} r={r.fork('stem')} width={h * 0.02 + 1.2} opacity={0.42} color={P.moss} />
      <path d={blob(r.fork('plume'), topX, topY - h * 0.08, h * 0.14, h * 0.2, 8, 0.32)} fill={color} opacity={0.56} />
      <path d={blob(r.fork('plumesoft'), topX + lean * 0.15, topY - h * 0.02, h * 0.1, h * 0.14, 7, 0.3)} fill={color} opacity={0.3} />
      <g stroke={color} strokeWidth={Math.max(1, h * 0.012)} opacity={0.46} strokeLinecap="round">
        {Array.from({ length: 6 }, (_, i) => {
          const a = -Math.PI / 2 + (i - 2.5) * 0.26 + r.jitter(0.08) + (lean / Math.max(1, Math.abs(h))) * 0.4
          const len = h * (0.16 + r.range(-0.02, 0.04))
          return <path key={i} d={`M ${topX} ${topY} l ${Math.cos(a) * len} ${Math.sin(a) * len}`} />
        })}
      </g>
    </g>
  )
}

function make(id: string, name: string, subtitle: string, palette: string[],
  meta: Asset['meta'], draw: (r: Rng) => ReactNode, affinity?: Asset['affinity']): Asset {
  return { id, category: 'world', name, subtitle, palette, meta, affinity, art: { kind: 'proc', draw: (r) => draw(r) } }
}

export const worlds: Asset[] = [
  make('ganga-ghat', 'Ganga Ghat', 'Wide steps down to the river',
    [P.blue, P.cream, P.earth],
    { terrain: ['river'], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['serene', 'nostalgic', 'grand'], intensity: 3, tags: ['water', 'river', 'stone', 'reflection', 'classic'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.amber, HORIZON, 0.22], [P.cream, HORIZON - 220, 0.3], [P.paper, HORIZON - 420, 0.2]]} />
        <FarSkyline xs={[120, 210, 300, 660, 760, 860]} y={HORIZON} color={P.slate} />
        <Mist r={r.fork('m')} y={HORIZON - 30} h={140} opacity={0.34} />
        <Water r={r.fork('w')} y={HORIZON - 10} color={P.blue} glint={P.cream} />
        <Ink pts={ridge(r, -40, W + 40, HORIZON - 16, 5, 9)} r={r} width={2.4} opacity={0.44} />
        {Array.from({ length: 4 }, (_, i) => (
          <path key={i} d={smooth(ridge(r.fork('rip' + i), 80, 920, HORIZON + 30 + i * 60, 6, 8))}
            stroke={P.cream} strokeWidth={1.8} fill="none" opacity={0.32} />
        ))}
        <Reflection r={r.fork('rf')} x={380} y={HORIZON + 10} w={240} h={260} color={P.amber} opacity={0.3} />
        <Steps r={r.fork('s')} y={1130} color={P.earth} n={7} />
        <g stroke={P.earth} strokeWidth={1.8} opacity={0.4}>
          {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M ${100 + i * 82} 1160 L ${100 + i * 82} 1200`} />)}
        </g>
        <g stroke={P.ink} strokeWidth={3} fill="none" opacity={0.4}><path d="M 860 1080 L 860 880" /></g>
        <path d={blob(r.fork('lamp'), 860, 860, 18, 22, 7, 0.2)} fill={P.amber} opacity={0.4} />
        <path d={blob(r.fork('lampglow'), 860, 860, 30, 34, 7, 0.2)} fill={P.amber} opacity={0.16} filter="url(#glow)" />
        {[[300, 210], [360, 190], [420, 230]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(0.8)`}>{Bird(r.fork('bird' + i), P.inkSoft)}</g>
        ))}
        <Specks r={r.fork('sp')} box={{ x: 60, y: 1120, w: 880, h: 340 }} n={22} color={P.earth} size={4} opacity={0.16} />
      </g>
    )),

  make('kolkata-street', 'North Kolkata Street', 'Shuttered shops and tangled wires',
    [P.terracotta, P.amber, P.inkSoft],
    { terrain: ['urban'], timeOfDay: ['dusk', 'night', 'golden'], mood: ['nostalgic', 'festive', 'intimate'], intensity: 4, tags: ['city', 'street', 'para', 'wires', 'crowd', 'classic'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.indigo, 900, 0.16], [P.amber, 700, 0.22], [P.cream, 400, 0.16]]} />
        <Buildings r={r.fork('far')} x1={-60} x2={1060} baseY={800} color={P.slate} maxH={200} n={9} windowColor={P.amber} />
        <Buildings r={r.fork('L')} x1={60} x2={380} baseY={1120} color={P.terracotta} maxH={560} n={3} windowColor={P.amber} />
        <Buildings r={r.fork('R')} x1={620} x2={940} baseY={1120} color={P.earth} maxH={560} n={3} windowColor={P.amber} />
        <Ground r={r.fork('g')} y={1120} color={P.inkSoft} />
        <g stroke={P.ink} strokeWidth={2.2} fill="none" opacity={0.52}>
          {Array.from({ length: 4 }, (_, i) => (
            <path key={i} d={smooth(ridge(r.fork('wire' + i), -40, W + 40, 230 + i * 46, 3, 5))} />
          ))}
        </g>
        {[[110, 1000], [130, 1000], [850, 1010], [870, 1010]].map(([x, y], i) => (
          <g key={i} stroke={P.earth} strokeWidth={2} opacity={0.44}>
            <path d={`M ${x - 16} ${y} L ${x + 16} ${y} M ${x - 16} ${y} L ${x - 16} ${y + 90} M ${x + 16} ${y} L ${x + 16} ${y + 90}`} fill="none" />
            {Array.from({ length: 5 }, (_, k) => <path key={k} d={`M ${x - 16} ${y + k * 18} L ${x + 16} ${y + k * 18}`} />)}
          </g>
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <circle key={i} cx={r.range(320, 680)} cy={r.range(600, 1050)} r={5} fill={P.amber} opacity={0.42} filter="url(#glow-tight)" />
        ))}
        <Specks r={r.fork('sp')} box={{ x: 0, y: 1140, w: 1000, h: 300 }} n={20} color={P.ink} size={4} opacity={0.14} />
      </g>
    )),

  make('howrah', 'Beneath Howrah Bridge', 'Steel above, Hooghly below',
    [P.slate, P.blue, P.inkSoft],
    { terrain: ['urban', 'river'], timeOfDay: ['dawn', 'dusk', 'night'], mood: ['grand', 'dramatic', 'nostalgic'], intensity: 4, tags: ['water', 'river', 'city', 'steel', 'iconic'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.slate, 700, 0.2], [P.blue, 500, 0.14]]} />
        <Water r={r.fork('w')} y={HORIZON + 40} color={P.blue} />
        <g stroke={P.ink} fill="none" opacity={0.62} strokeLinecap="round">
          <path d={smooth([[-40, 700], [220, 660], [500, 648], [780, 660], [1040, 700]] as Pt[])} strokeWidth={16} />
          <path d={smooth([[-40, 560], [240, 380], [500, 350], [760, 380], [1040, 560]] as Pt[])} strokeWidth={11} />
          {Array.from({ length: 11 }, (_, i) => {
            const x = -20 + i * 104
            const t = Math.abs(i - 5) / 5
            return <path key={i} d={`M ${x} ${700 - t * 18} L ${x + r.jitter(10)} ${360 + t * 190}`} strokeWidth={6} />
          })}
        </g>
        <g stroke={P.ink} fill="none" opacity={0.22} strokeWidth={2}>
          <path d={smooth([[-40, 702], [500, 650], [1040, 702]] as Pt[])} />
        </g>
        <Ground r={r.fork('g')} y={1190} color={P.earth} />
        <Reflection r={r.fork('rf')} x={340} y={HORIZON + 60} w={320} h={280} color={P.blue} opacity={0.2} />
        {[[220, 300], [780, 320]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(0.75)`}>{Bird(r.fork('hbird' + i), P.inkSoft)}</g>
        ))}
      </g>
    )),

  make('himalaya', 'Himalayan Peaks', 'Her mountains, where she comes from',
    [P.slate, P.violet, P.paper],
    { terrain: ['mountain'], timeOfDay: ['dawn', 'day', 'golden', 'night'], mood: ['grand', 'serene', 'mystic'], intensity: 2, tags: ['mountain', 'snow', 'cold', 'height', 'quiet', 'kailash'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.violet, 700, 0.14], [P.paper, 500, 0.2]]} />
        <Peaks r={r.fork('far')} y={HORIZON - 140} colors={[P.violet, P.indigo]} snow />
        <Mist r={r.fork('m1')} y={HORIZON - 80} opacity={0.4} />
        <Peaks r={r.fork('p')} y={HORIZON - 60} colors={[P.slate, P.violet, P.indigo]} snow />
        <Mist r={r.fork('m')} y={HORIZON + 40} opacity={0.36} />
        <Ground r={r.fork('g')} y={1170} color={P.slate} second={P.paperDeep} />
        <g stroke={P.ink} strokeWidth={2} opacity={0.3}><path d="M 500 1170 L 500 1000" /></g>
        <g opacity={0.4}>
          {[0, 1, 2, 3, 4].map(i => (
            <path key={i} d={`M ${470 + i * 15} 1000 L ${490 + i * 15} 1000 L ${490 + i * 15} 1018 L ${470 + i * 15} 1018 Z`}
              fill={[P.vermilion, P.marigold, P.blue, P.paper, P.moss][i % 5]} opacity={0.5} />
          ))}
        </g>
        <Specks r={r.fork('sp')} box={{ x: 100, y: 900, w: 800, h: 260 }} n={30} color={P.paper} size={3} opacity={0.3} />
      </g>
    )),

  make('forest', 'Deep Forest', 'Sal trees closing overhead',
    [P.green, P.moss, P.earth],
    { terrain: ['forest'], timeOfDay: ['dawn', 'day', 'dusk', 'night'], mood: ['mystic', 'serene', 'intimate'], intensity: 3, tags: ['trees', 'green', 'wild', 'leaves', 'shade', 'aranya'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.moss, 700, 0.14], [P.paper, 500, 0.16]]} />
        <Trees r={r.fork('far')} x1={-80} x2={1080} baseY={HORIZON + 30} n={8} canopy={[P.moss, P.green]} scale={1.5} />
        <Mist r={r.fork('m')} y={HORIZON + 60} opacity={0.3} />
        <Trees r={r.fork('near')} x1={-100} x2={220} baseY={1300} n={2} canopy={[P.green, P.teal]} scale={2.4} />
        <Trees r={r.fork('near2')} x1={790} x2={1110} baseY={1300} n={2} canopy={[P.green, P.teal]} scale={2.4} />
        <Ground r={r.fork('g')} y={1150} color={P.moss} second={P.earth} />
        <path d={blob(r.fork('deer'), 700, 1080, 30, 20, 7, 0.2)} fill={P.earth} opacity={0.42} />
        {[[550, 300], [610, 340]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(0.7)`}>{Bird(r.fork('fbird' + i), P.inkSoft)}</g>
        ))}
        <Specks r={r.fork('sp')} box={{ x: 0, y: 700, w: 1000, h: 700 }} n={30} color={P.green} size={5} opacity={0.16} />
      </g>
    )),

  make('sea', 'By the Sea', 'Salt wind and a long empty shore',
    [P.teal, P.cream, P.paperDeep],
    { terrain: ['sea'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['serene', 'grand'], intensity: 2, tags: ['water', 'sea', 'waves', 'open', 'sand', 'wind'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.teal, HORIZON, 0.1], [P.cream, HORIZON - 260, 0.22], [P.paper, HORIZON - 460, 0.16]]} />
        <Water r={r.fork('w')} y={HORIZON - 30} color={P.teal} glint={P.paper} />
        <g stroke={P.paper} fill="none" opacity={0.5} strokeLinecap="round">
          {Array.from({ length: 5 }, (_, i) => (
            <path key={i} d={smooth(ridge(r.fork('f' + i), r.range(0, 300), r.range(600, 1000), 1000 + i * 46, 6, 6))} strokeWidth={r.range(3, 7)} />
          ))}
        </g>
        <Ground r={r.fork('g')} y={1240} color={P.paperDeep} second={P.cream} />
        {[[200, 1290], [260, 1310], [230, 1330]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={6} ry={3} fill={P.earth} opacity={0.2} />
        ))}
        {[[650, 180], [710, 210], [770, 170]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(0.9)`}>{Bird(r.fork('sbird' + i), P.inkSoft)}</g>
        ))}
      </g>
    )),

  make('village', 'Village Bengal', 'Mud walls, a pond, one palm leaning',
    [P.clay, P.moss, P.amber],
    { terrain: ['plain'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['nostalgic', 'intimate', 'serene'], intensity: 3, tags: ['village', 'gram', 'mud', 'pond', 'palm', 'rural', 'classic'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.amber, HORIZON, 0.18], [P.cream, HORIZON - 260, 0.2]]} />
        <Ground r={r.fork('g')} y={HORIZON} color={P.moss} second={P.clay} />
        {[220, 780].map((x, i) => {
          const hr = r.fork('hut' + i)
          const pts: Pt[] = [[x - 90, 1020], [x - 100, 940], [x, 870], [x + 100, 940], [x + 90, 1020]]
          const roofPts: Pt[] = [[x - 100, 940], [x, 870], [x + 100, 940]]
          return (
            <g key={i}>
              <Wash d={smooth(pts, true)} color={P.clay} opacity={0.56} />
              <Ink pts={pts} r={hr} width={2.6} opacity={0.58} />
              {Array.from({ length: 6 }, (_, k) => {
                const t = (k + 1) / 7
                const bx = x - 100 + t * 200, by = 940 - (1 - Math.abs(t - 0.5) * 2) * 70
                return <path key={k} d={`M ${bx - 14} ${by + 10} L ${bx + 10} ${by - 12}`} stroke={P.earth} strokeWidth={1.6} opacity={0.4} />
              })}
              <Ink pts={roofPts} r={hr.fork('roof')} width={2.2} opacity={0.5} />
              <path d={`M ${x - 24} 1020 L ${x - 24} 960 L ${x + 24} 960 L ${x + 24} 1020`} stroke={P.earth} strokeWidth={2.4} fill="none" opacity={0.46} />
              <path d={`M ${x - 90} 1020 L ${x + 90} 1020`} stroke={P.earth} strokeWidth={2.4} opacity={0.44} />
            </g>
          )
        })}
        <g>
          <path d="M 660 1040 Q 676 930 690 840" stroke={P.earth} strokeWidth={11} fill="none" opacity={0.6} />
          <path d="M 660 1040 Q 676 930 690 840" stroke={P.ink} strokeWidth={11} fill="none" opacity={0.2} />
          {Array.from({ length: 7 }, (_, i) => {
            const a = -2.5 + i * 0.55
            return <path key={i} d={`M 690 840 q ${Math.cos(a) * 70} ${Math.sin(a) * 50} ${Math.cos(a) * 130} ${Math.sin(a) * 96 + 24}`}
              stroke={P.green} strokeWidth={10} fill="none" opacity={0.54} strokeLinecap="round" />
          })}
        </g>
        <Wash d={blob(r.fork('pond'), 250, 1300, 300, 110, 9, 0.24)} color={P.teal} opacity={0.36} />
        <path d={blob(r.fork('pond'), 250, 1300, 300, 110, 9, 0.24)} stroke={P.earth} strokeWidth={1.8} fill="none" opacity={0.3} />
        <Reflection r={r.fork('rf')} x={200} y={1300} w={180} h={80} color={P.amber} opacity={0.26} />
        {[[400, 1250], [440, 1270]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={14} ry={5} fill={P.paper} opacity={0.64} stroke={P.earth} strokeWidth={1} strokeOpacity={0.3} />)}
      </g>
    )),

  make('tea-garden', 'Tea Garden', 'Green terraces stepping into fog',
    [P.green, P.moss, P.slate],
    { terrain: ['mountain', 'plain'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['serene', 'intimate', 'nostalgic'], intensity: 2, tags: ['green', 'hills', 'terrace', 'fog', 'north-bengal', 'quiet'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.slate, 700, 0.12], [P.paper, 500, 0.18]]} />
        <Peaks r={r.fork('p')} y={HORIZON - 130} colors={[P.slate, P.moss]} />
        <Mist r={r.fork('m')} y={HORIZON - 20} opacity={0.5} />
        <Ground r={r.fork('g')} y={HORIZON + 30} color={P.green} />
        <g>
          {Array.from({ length: 8 }, (_, i) => {
            const y = 920 + i * 66
            const pts = ridge(r.fork('row' + i), -40, 1040, y, 9, 7)
            return (
              <g key={i}>
                <path d={smooth(pts)} stroke={i % 2 ? P.moss : P.teal} strokeWidth={9 + i} fill="none" strokeLinecap="round" opacity={0.5} />
                <path d={smooth(pts)} stroke={P.earth} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.28} />
              </g>
            )
          })}
        </g>
        {Array.from({ length: 3 }, (_, i) => (
          <path key={i} d={blob(r.fork('bush' + i), r.range(200, 800), r.range(1000, 1300), 20, 14, 6, 0.24)} fill={P.moss} opacity={0.42} />
        ))}
        <Mist r={r.fork('m2')} y={1050} opacity={0.3} />
      </g>
    )),

  make('zamindar', 'Zamindar Courtyard', 'The thakur dalan of an old house',
    [P.cream, P.earth, P.gold],
    { terrain: ['interior'], timeOfDay: ['dusk', 'night', 'golden'], mood: ['nostalgic', 'grand', 'intimate'], intensity: 3, tags: ['bonedi', 'courtyard', 'columns', 'heritage', 'indoor', 'classic', 'gold'] },
    (r) => (
      <g>
        <Wash d="M -40 300 L 1040 300 L 1040 1180 L -40 1180 Z" color={P.cream} opacity={0.4} rim={false} />
        {[60, 210, 790, 940].map((x, i) => {
          const cr = r.fork('col' + i)
          const pts: Pt[] = [[x - 34, 1180], [x - 28, 420], [x + 28, 420], [x + 34, 1180]]
          return (
            <g key={i}>
              <Wash d={smooth(pts, true)} color={P.paperDeep} opacity={0.46} />
              <Ink pts={pts} r={cr} width={2.2} opacity={0.42} />
              <path d={blob(cr, x, 408, 52, 22, 7, 0.2)} fill={P.gold} opacity={0.3} />
              {Array.from({ length: 5 }, (_, k) => (
                <path key={k} d={`M ${x - 24} ${500 + k * 130} L ${x + 24} ${500 + k * 130}`} stroke={P.earth} strokeWidth={1.4} opacity={0.2} />
              ))}
            </g>
          )
        })}
        <g stroke={P.ink} fill="none" opacity={0.34} strokeWidth={2.4}>
          <path d={smooth([[-40, 400], [500, 372], [1040, 400]] as Pt[])} />
          {[0, 1, 2].map(i => <path key={i} d={`M ${180 + i * 320} 400 q 160 -78 320 0`} />)}
        </g>
        <path d="M 500 400 L 500 330" stroke={P.earth} strokeWidth={2} opacity={0.3} />
        <path d={blob(r.fork('lamp'), 500, 310, 22, 26, 8, 0.2)} fill={P.gold} opacity={0.4} />
        <path d={blob(r.fork('lampglow'), 500, 310, 40, 44, 8, 0.2)} fill={P.amber} opacity={0.18} filter="url(#glow)" />
        <Ground r={r.fork('g')} y={1180} color={P.earth} />
        <Specks r={r.fork('sp')} box={{ x: 0, y: 400, w: 1000, h: 700 }} n={14} color={P.gold} size={5} opacity={0.22} />
      </g>
    )),

  make('rooftop', 'Rooftop Over Kolkata', 'The whole city laid out below',
    [P.indigo, P.amber, P.slate],
    { terrain: ['rooftop', 'urban'], timeOfDay: ['dusk', 'night'], mood: ['intimate', 'nostalgic', 'dramatic'], intensity: 3, tags: ['city', 'chhaad', 'skyline', 'height', 'lights', 'modern'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.indigo, 900, 0.28], [P.violet, 700, 0.14]]} />
        <circle cx={800} cy={220} r={44} fill={P.cream} opacity={0.24} filter="url(#glow)" />
        <Buildings r={r.fork('far')} x1={-60} x2={1060} baseY={HORIZON + 90} color={P.slate} maxH={220} n={14} windowColor={P.amber} />
        <Buildings r={r.fork('mid')} x1={-60} x2={1060} baseY={HORIZON + 200} color={P.indigo} maxH={170} n={10} windowColor={P.amber} />
        <Wash d="M -40 1060 L 1040 1060 L 1040 1540 L -40 1540 Z" color={P.paperDeep} opacity={0.44} rim={false} />
        <g>
          <Ink pts={ridge(r, -40, 1040, 1060, 5, 7)} r={r} width={3} opacity={0.5} />
          {Array.from({ length: 13 }, (_, i) => (
            <rect key={i} x={-30 + i * 82} y={996} width={44} height={64} rx={4} fill={P.slate} opacity={0.4} stroke={P.ink} strokeWidth={1.8} strokeOpacity={0.42} />
          ))}
        </g>
        {[230, 500, 770].map((x, i) => (
          <g key={i}>
            <path d={blob(r.fork('pot' + i), x, 1006, 24, 30, 7, 0.16)} fill={P.earth} opacity={0.5} />
            <Ink pts={[[x - 24, 1006], [x - 18, 976], [x + 18, 976], [x + 24, 1006]]} r={r.fork('potink' + i)} close width={1.8} opacity={0.44} />
            <path d={blob(r.fork('leaf' + i), x, 950, 30, 26, 7, 0.28)} fill={P.moss} opacity={0.4} />
          </g>
        ))}
      </g>
    )),

  make('rainy-kolkata', 'Rainy Kolkata', 'Wet tar, and everything reflected twice',
    [P.slate, P.indigo, P.amber],
    { terrain: ['urban'], timeOfDay: ['dusk', 'night', 'day'], mood: ['nostalgic', 'dramatic', 'intimate'], intensity: 4, tags: ['rain', 'wet', 'city', 'reflection', 'monsoon', 'street'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.slate, 700, 0.2], [P.indigo, 500, 0.16]]} />
        <Buildings r={r.fork('L')} x1={60} x2={360} baseY={1100} color={P.slate} maxH={540} n={3} windowColor={P.amber} />
        <Buildings r={r.fork('R')} x1={640} x2={940} baseY={1100} color={P.slate} maxH={540} n={3} windowColor={P.amber} />
        <Mist r={r.fork('m')} y={780} opacity={0.3} color={P.paper} />
        <Wash d="M -40 1100 L 1040 1100 L 1040 1540 L -40 1540 Z" color={P.indigo} opacity={0.3} rim={false} />
        <Reflection r={r.fork('rf')} x={300} y={1110} w={400} h={340} color={P.amber} opacity={0.36} />
        <g stroke={P.paper} strokeWidth={2.4} opacity={0.4} strokeLinecap="round">
          {Array.from({ length: 44 }, (_, i) => {
            const x = r() * 1060 - 30, y = r() * 1100
            return <path key={i} d={`M ${x} ${y} l -9 ${r.range(34, 64)}`} />
          })}
        </g>
        {Array.from({ length: 6 }, (_, i) => (
          <circle key={i} cx={r.range(200, 800)} cy={r.range(1150, 1400)} r={r.range(2, 5)} fill={P.paper} opacity={0.4} />
        ))}
      </g>
    ),
    { boost: ['rain', 'wet', 'mist'] }),

  make('misty-valley', 'Misty Valley', 'Cloud sitting in the folds of the hills',
    [P.slate, P.teal, P.paper],
    { terrain: ['mountain', 'forest'], timeOfDay: ['dawn', 'day', 'dusk'], mood: ['mystic', 'serene'], intensity: 2, tags: ['mist', 'fog', 'hills', 'quiet', 'cool', 'wet'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.slate, 700, 0.14], [P.paper, 500, 0.18]]} />
        <Peaks r={r.fork('p')} y={HORIZON - 110} colors={[P.slate, P.teal, P.green]} />
        <Mist r={r.fork('m1')} y={HORIZON - 60} opacity={0.66} />
        <Trees r={r.fork('t')} x1={-60} x2={1060} baseY={HORIZON + 190} n={7} canopy={[P.teal, P.green]} scale={1.1} />
        <Mist r={r.fork('m2')} y={HORIZON + 160} opacity={0.5} />
        <Ground r={r.fork('g')} y={1190} color={P.green} second={P.moss} />
        <Mist r={r.fork('m3')} y={1330} opacity={0.34} />
      </g>
    ),
    { boost: ['mist', 'rain'] }),

  make('terrace-lights', 'Terrace Under Fairy Lights', 'A string of bulbs, and the city going soft below',
    [P.amber, P.marigold, P.slate],
    { terrain: ['rooftop', 'urban'], timeOfDay: ['golden', 'dusk'], mood: ['intimate', 'festive', 'nostalgic'], intensity: 2, tags: ['rooftop', 'terrace', 'fairy-lights', 'plants', 'golden', 'open', 'wide'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.amber, 720, 0.24], [P.marigold, 560, 0.16], [P.cream, 380, 0.2]]} />
        <FarSkyline xs={[150, 260, 380, 620, 740, 860]} y={720} color={P.slate} opacity={0.22} />
        <Wash d="M -40 700 L 1040 700 L 1040 800 L -40 800 Z" color={P.slate} opacity={0.22} rim={false} />
        <Ground r={r.fork('g')} y={1140} color={P.clay} second={P.terracotta} />
        <g stroke="#4A3D2E" strokeWidth={4} opacity={0.56}>
          <path d="M 200 1140 L 200 780" /><path d="M 800 1140 L 800 780" />
        </g>
        <path d={smooth(Array.from({ length: 8 }, (_, i) => {
          const t = i / 7
          return [200 + t * 600, 780 + Math.sin(t * Math.PI) * 26] as Pt
        }))} stroke="#4A3D2E" strokeWidth={2} fill="none" opacity={0.5} />
        {Array.from({ length: 8 }, (_, i) => {
          const t = i / 7, x = 200 + t * 600, y = 780 + Math.sin(t * Math.PI) * 26
          return (
            <g key={i}>
              <circle cx={x} cy={y + 8} r={13} fill={P.marigold} opacity={0.78} filter="url(#glow-tight)" />
              <circle cx={x} cy={y + 8} r={4.2} fill="#FFF3D6" opacity={0.95} />
            </g>
          )
        })}
        {[230, 500, 770].map((x, i) => (
          <g key={i}>
            <path d={blob(r.fork('pot' + i), x, 1080, 30, 22, 7, 0.2)} fill={P.earth} opacity={0.48} />
            <path d={blob(r.fork('leaf' + i), x, 1030, 32, 26, 7, 0.28)} fill={P.green} opacity={0.42} />
          </g>
        ))}
      </g>
    )),

  make('ocean', 'Open Ocean', 'Water to every horizon',
    [P.teal, P.blue, P.paper],
    { terrain: ['sea'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['grand', 'serene', 'dramatic'], intensity: 3, tags: ['water', 'ocean', 'waves', 'open', 'horizon', 'vast'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.teal, HORIZON, 0.14], [P.paper, HORIZON - 300, 0.22], [P.blue, HORIZON - 520, 0.12]]} />
        <circle cx={760} cy={260} r={50} fill={P.cream} opacity={0.3} filter="url(#glow)" />
        <Water r={r.fork('w1')} y={HORIZON - 20} color={P.teal} glint={P.paper} />
        <Water r={r.fork('w2')} y={HORIZON + 160} color={P.blue} glint={P.cream} />
        <g stroke={P.paper} fill="none" opacity={0.5} strokeLinecap="round">
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} d={smooth(ridge(r.fork('sw' + i), -40, 1040, HORIZON + 380 + i * 90, 7, 6))} strokeWidth={r.range(3, 7)} />
          ))}
        </g>
        <path d={blob(r.fork('ship'), 700, HORIZON + 40, 26, 10, 6, 0.2)} fill={P.inkSoft} opacity={0.36} />
        <path d={`M 700 ${HORIZON + 30} L 700 ${HORIZON + 4}`} stroke={P.inkSoft} strokeWidth={2} opacity={0.34} />
        {[[220, 180], [280, 150], [340, 200]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(0.85)`}>{Bird(r.fork('obird' + i), P.inkSoft)}</g>
        ))}
        <Reflection r={r.fork('rf')} x={460} y={HORIZON + 20} w={280} h={320} color={P.paper} opacity={0.24} />
      </g>
    )),

  make('mountain-pass', 'The Mountain Pass', 'A road bending around the peak',
    [P.slate, P.violet, P.earth],
    { terrain: ['mountain'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['grand', 'serene', 'mystic'], intensity: 3, tags: ['mountain', 'road', 'pass', 'winding', 'cliff', 'journey'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.violet, 700, 0.16], [P.paper, 500, 0.2]]} />
        <Peaks r={r.fork('far')} y={HORIZON - 160} colors={[P.violet, P.indigo]} snow />
        <Mist r={r.fork('m1')} y={HORIZON - 60} opacity={0.42} />
        <Peaks r={r.fork('near')} y={HORIZON - 10} colors={[P.slate, P.earth]} />
        <Ground r={r.fork('g')} y={1220} color={P.earth} second={P.moss} />
        <g>
          <path d={smooth([[500, 1220], [420, 1080], [560, 940], [440, 800], [520, 660]] as Pt[])}
            stroke={P.paperDeep} strokeWidth={46} fill="none" opacity={0.42} strokeLinecap="round" />
          <path d={smooth([[500, 1220], [420, 1080], [560, 940], [440, 800], [520, 660]] as Pt[])}
            stroke={P.ink} strokeWidth={2} fill="none" opacity={0.3} strokeDasharray="10 14" />
          <path d={smooth([[500, 1220], [420, 1080], [560, 940], [440, 800], [520, 660]] as Pt[])}
            stroke={P.ink} strokeWidth={2.4} fill="none" opacity={0.3} />
        </g>
        <Mist r={r.fork('m2')} y={1000} opacity={0.3} />
        <Specks r={r.fork('sp')} box={{ x: 80, y: 600, w: 840, h: 500 }} n={20} color={P.paper} size={3} opacity={0.26} />
      </g>
    )),

  make('banyan-canopy', 'Under the Banyan', 'Branches wide enough to hold the whole para',
    [P.moss, P.earth, P.amber],
    { terrain: ['forest'], timeOfDay: ['day', 'golden', 'dusk'], mood: ['serene', 'mystic', 'intimate'], intensity: 3, tags: ['tree', 'branches', 'banyan', 'canopy', 'shade', 'roots'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.paper, 900, 0.2], [P.cream, 650, 0.18]]} />
        <g>
          {Array.from({ length: 7 }, (_, i) => {
            const x = -80 + (i / 6) * 1160
            const y = 80 + Math.sin(i * 1.3) * 50
            return <path key={i} d={blob(r.fork('canopy' + i), x, y, 170, 100, 8, 0.28)} fill={P.moss} opacity={0.42} />
          })}
        </g>
        <Ink pts={ridge(r, -40, 1040, 300, 7, 10)} r={r} width={2.6} opacity={0.42} color={P.earth} />
        {[-1, 1].map((side) => (
          <g key={side} stroke={P.earth} strokeWidth={9} fill="none" opacity={0.5} strokeLinecap="round">
            {Array.from({ length: 4 }, (_, k) => {
              const bx = side < 0 ? 40 : 960
              const ex = side < 0 ? 300 + k * 90 : 700 - k * 90
              const ey = 320 - k * 40
              return <path key={k} d={`M ${bx} 1300 Q ${bx + side * 60} ${700 - k * 60} ${ex} ${ey}`} />
            })}
          </g>
        ))}
        {[-1, 1].map((side) => (
          <path key={'trunk' + side} d={smooth((side < 0
            ? [[0, 1400], [10, 1100], [60, 800], [40, 340]]
            : [[1000, 1400], [980, 1100], [940, 800], [960, 340]]) as Pt[])}
            stroke={P.earth} strokeWidth={44} fill="none" opacity={0.5} strokeLinecap="round" />
        ))}
        {[300, 460, 620, 780].map((x, i) => (
          <path key={i} d={`M ${x} 320 Q ${x + r.jitter(24)} 700 ${x + r.jitter(16)} ${1100 + r.jitter(60)}`}
            stroke={P.earth} strokeWidth={2.6} fill="none" opacity={0.32} />
        ))}
        <Ground r={r.fork('g')} y={1360} color={P.moss} second={P.earth} />
        <Specks r={r.fork('sp')} box={{ x: 150, y: 250, w: 700, h: 900 }} n={26} color={P.amber} size={4} opacity={0.2} />
        {[[280, 500], [720, 560]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(0.75)`}>{Bird(r.fork('tbird' + i), P.inkSoft)}</g>
        ))}
      </g>
    )),

  make('paddy-fields', 'Golden Paddy Fields', 'Rice ready for harvest, gold to the horizon',
    [P.marigold, P.amber, P.moss],
    { terrain: ['plain'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['serene', 'nostalgic'], intensity: 2, tags: ['fields', 'paddy', 'rice', 'golden', 'rural', 'open'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.amber, HORIZON, 0.2], [P.cream, HORIZON - 260, 0.22], [P.paper, HORIZON - 460, 0.16]]} />
        <FarSkyline xs={[160, 280, 420, 600, 740, 860]} y={HORIZON} color={P.moss} opacity={0.28} />
        <Trees r={r.fork('t')} x1={-60} x2={1060} baseY={HORIZON + 20} n={6} canopy={[P.moss, P.green]} scale={0.9} />
        <Ground r={r.fork('g')} y={HORIZON + 60} color={P.marigold} second={P.amber} />
        <g opacity={0.5}>
          {Array.from({ length: 9 }, (_, i) => {
            const y = HORIZON + 90 + i * 60
            return <path key={i} d={smooth(ridge(r.fork('row' + i), -40, 1040, y, 8, 6))}
              stroke={i % 2 ? P.marigold : P.amber} strokeWidth={8 + i * 0.6} fill="none" strokeLinecap="round" />
          })}
        </g>
        <path d="M 680 1200 L 680 980" stroke={P.earth} strokeWidth={6} opacity={0.4} />
        <path d="M 640 1000 L 720 1000 L 680 940 Z" fill={P.clay} opacity={0.42} />
        <path d="M 650 1010 L 710 1010" stroke={P.earth} strokeWidth={3} opacity={0.32} />
        {Array.from({ length: 3 }, (_, i) => (
          <g key={i} transform={`translate(${300 + i * 220} ${HORIZON + 260 + i * 30}) scale(0.8)`}>{Bird(r.fork('pbird' + i), P.inkSoft)}</g>
        ))}
        <Specks r={r.fork('sp')} box={{ x: 100, y: HORIZON + 80, w: 800, h: 400 }} n={20} color={P.moss} size={4} opacity={0.18} />
      </g>
    )),

  make('kash-field', 'Kash Phul Field', 'Wild white plumes, the surest sign she’s near',
    [P.paper, P.blue, P.moss],
    { terrain: ['plain', 'river'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['serene', 'nostalgic', 'grand'], intensity: 3, tags: ['kash', 'kashful', 'autumn', 'sharat', 'grass', 'field', 'white', 'wind', 'river', 'saccharum'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.blue, HORIZON, 0.26], [P.cream, HORIZON - 320, 0.16], [P.paper, HORIZON - 520, 0.14]]} />
        <Cloud r={r.fork('c0')} x={260} y={260} scale={1.1} color={P.paper} />
        <Cloud r={r.fork('c1')} x={720} y={340} scale={0.85} color={P.paper} />
        <Cloud r={r.fork('c2')} x={500} y={190} scale={0.65} color={P.paper} />
        <FarSkyline xs={[120, 260, 420, 580, 740, 880]} y={HORIZON + 20} color={P.moss} opacity={0.22} />
        <Water r={r.fork('w')} y={HORIZON + 60} color={P.blue} glint={P.paper} />
        <Ground r={r.fork('g')} y={HORIZON + 140} color={P.clay} second={P.moss} />

        {/* the far edge of the field — small, hazy, dense, full width */}
        <g opacity={0.5}>
          {Array.from({ length: 16 }, (_, i) => {
            const kr = r.fork('far' + i)
            const x = -20 + (i / 15) * 1040 + kr.jitter(20)
            return <KashStalk key={i} r={kr} x={x} baseY={HORIZON + 160 + kr.jitter(14)} h={kr.range(110, 160)} lean={kr.range(14, 30)} color={P.paper} />
          })}
        </g>

        {/* the near field — taller, fewer, more detailed, framing the sides
            and leaving the middle clear for whatever pandal/idol is placed
            there (see the note on SAFE in art/palette.ts) */}
        {[...Array.from({ length: 7 }, (_, i) => ({ x: -40 + (i / 6) * 340 })), ...Array.from({ length: 7 }, (_, i) => ({ x: 700 + (i / 6) * 340 }))].map(({ x }, i) => {
          const kr = r.fork('near' + i)
          const bx = x + kr.jitter(24)
          return <KashStalk key={i} r={kr} x={bx} baseY={1220 + kr.jitter(60)} h={kr.range(260, 380)} lean={kr.range(30, 70)} color={P.paper} />
        })}
        {Array.from({ length: 3 }, (_, i) => {
          const kr = r.fork('mid' + i)
          const x = 380 + i * 130 + kr.jitter(20)
          return <KashStalk key={i} r={kr} x={x} baseY={1260 + kr.jitter(30)} h={kr.range(180, 240)} lean={kr.range(20, 44)} color={P.paper} />
        })}

        {[[240, 210], [760, 240]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(0.85)`}>{Bird(r.fork('kbird' + i), P.inkSoft)}</g>
        ))}
        <Specks r={r.fork('sp')} box={{ x: 0, y: 1180, w: 1000, h: 320 }} n={26} color={P.paper} size={4} opacity={0.2} />
      </g>
    )),
]
