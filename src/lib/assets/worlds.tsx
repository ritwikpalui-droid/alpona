import type { Asset } from '../types'
import { P, HORIZON, W } from '../art/palette'
import { blob, Ink, ridge, smooth, Wash, Specks, type Pt } from '../art/primitives'
import { Buildings, Ground, Mist, Peaks, Reflection, Steps, Trees, Water } from '../art/scenery'

export const worlds: Asset[] = [
  {
    id: 'ganga-ghat',
    category: 'world',
    name: 'Ganga Ghat',
    subtitle: 'Wide steps down to the river',
    palette: [P.blue, P.cream, P.earth],
    meta: { terrain: ['river'], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['serene', 'nostalgic', 'grand'], intensity: 3, tags: ['water', 'river', 'stone', 'reflection', 'classic'] },
    art: {
      kind: 'proc',
      draw: (r, _b, s) => (
        <g>
          <Water r={r.fork('w')} y={HORIZON - 10} color={s.isNight ? P.indigo : P.blue} />
          <g opacity={0.5}><Ink pts={ridge(r, -40, W + 40, HORIZON - 16, 5, 9)} r={r} width={2} opacity={0.3} /></g>
          <Steps r={r.fork('s')} y={1130} color={P.earth} n={7} />
          <Reflection r={r.fork('rf')} x={380} y={HORIZON + 10} w={240} h={260} color={s.lightTint} opacity={0.24} />
          <Specks r={r.fork('sp')} box={{ x: 60, y: 1120, w: 880, h: 340 }} n={22} color={P.earth} size={4} opacity={0.18} />
        </g>
      ),
    },
  },
  {
    id: 'kolkata-street',
    category: 'world',
    name: 'North Kolkata Street',
    subtitle: 'Shuttered shops and tangled wires',
    palette: [P.terracotta, P.amber, P.inkSoft],
    meta: { terrain: ['urban'], timeOfDay: ['dusk', 'night', 'golden'], mood: ['nostalgic', 'festive', 'intimate'], intensity: 4, tags: ['city', 'street', 'para', 'wires', 'crowd', 'classic'] },
    art: {
      kind: 'proc',
      draw: (r, _b, s) => (
        <g>
          <Buildings r={r.fork('L')} x1={-60} x2={300} baseY={1120} color={P.terracotta} maxH={560} n={3} windowColor={s.isNight ? P.amber : P.cream} />
          <Buildings r={r.fork('R')} x1={700} x2={1060} baseY={1120} color={P.earth} maxH={560} n={3} windowColor={s.isNight ? P.amber : P.cream} />
          <Ground r={r.fork('g')} y={1120} color={P.inkSoft} />
          <g stroke={P.ink} strokeWidth={2} fill="none" opacity={0.4}>
            {Array.from({ length: 4 }, (_, i) => (
              <path key={i} d={smooth(ridge(r.fork('wire' + i), -40, W + 40, 230 + i * 46, 3, 5))} />
            ))}
          </g>
          <Specks r={r.fork('sp')} box={{ x: 0, y: 1140, w: 1000, h: 300 }} n={18} color={P.ink} size={4} opacity={0.14} />
        </g>
      ),
    },
  },
  {
    id: 'howrah',
    category: 'world',
    name: 'Beneath Howrah Bridge',
    subtitle: 'Steel above, Hooghly below',
    palette: [P.slate, P.blue, P.inkSoft],
    meta: { terrain: ['urban', 'river'], timeOfDay: ['dawn', 'dusk', 'night'], mood: ['grand', 'dramatic', 'nostalgic'], intensity: 4, tags: ['water', 'river', 'city', 'steel', 'iconic'] },
    art: {
      kind: 'proc',
      draw: (r, _b, s) => (
        <g>
          <Water r={r.fork('w')} y={HORIZON + 40} color={s.isNight ? P.indigo : P.blue} />
          <g stroke={P.slate} fill="none" opacity={0.46} strokeLinecap="round">
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
          <Reflection r={r.fork('rf')} x={340} y={HORIZON + 60} w={320} h={280} color={s.lightTint} opacity={0.2} />
        </g>
      ),
    },
  },
  {
    id: 'himalaya',
    category: 'world',
    name: 'Himalayan Peaks',
    subtitle: 'Her mountains, where she comes from',
    palette: [P.slate, P.violet, P.paper],
    meta: { terrain: ['mountain'], timeOfDay: ['dawn', 'day', 'golden', 'night'], mood: ['grand', 'serene', 'mystic'], intensity: 2, tags: ['mountain', 'snow', 'cold', 'height', 'quiet', 'kailash'] },
    art: {
      kind: 'proc',
      draw: (r) => (
        <g>
          <Peaks r={r.fork('p')} y={HORIZON - 60} colors={[P.slate, P.violet, P.indigo]} snow />
          <Mist r={r.fork('m')} y={HORIZON + 40} opacity={0.4} />
          <Ground r={r.fork('g')} y={1170} color={P.slate} second={P.paperDeep} />
        </g>
      ),
    },
  },
  {
    id: 'forest',
    category: 'world',
    name: 'Deep Forest',
    subtitle: 'Sal trees closing overhead',
    palette: [P.green, P.moss, P.earth],
    meta: { terrain: ['forest'], timeOfDay: ['dawn', 'day', 'dusk', 'night'], mood: ['mystic', 'serene', 'intimate'], intensity: 3, tags: ['trees', 'green', 'wild', 'leaves', 'shade', 'aranya'] },
    art: {
      kind: 'proc',
      draw: (r) => (
        <g>
          <Trees r={r.fork('far')} x1={-80} x2={1080} baseY={HORIZON + 30} n={8} canopy={[P.moss, P.green]} scale={1.5} />
          <Trees r={r.fork('near')} x1={-100} x2={220} baseY={1300} n={2} canopy={[P.green, P.teal]} scale={2.4} />
          <Trees r={r.fork('near2')} x1={790} x2={1110} baseY={1300} n={2} canopy={[P.green, P.teal]} scale={2.4} />
          <Ground r={r.fork('g')} y={1150} color={P.moss} second={P.earth} />
          <Specks r={r.fork('sp')} box={{ x: 0, y: 700, w: 1000, h: 700 }} n={26} color={P.green} size={5} opacity={0.16} />
        </g>
      ),
    },
  },
  {
    id: 'sea',
    category: 'world',
    name: 'By the Sea',
    subtitle: 'Salt wind and a long empty shore',
    palette: [P.teal, P.cream, P.paperDeep],
    meta: { terrain: ['sea'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['serene', 'grand'], intensity: 2, tags: ['water', 'sea', 'waves', 'open', 'sand', 'wind'] },
    art: {
      kind: 'proc',
      draw: (r, _b, s) => (
        <g>
          <Water r={r.fork('w')} y={HORIZON - 30} color={s.isNight ? P.indigo : P.teal} glint={P.paper} />
          <g stroke={P.paper} fill="none" opacity={0.5} strokeLinecap="round">
            {Array.from({ length: 5 }, (_, i) => (
              <path key={i} d={smooth(ridge(r.fork('f' + i), r.range(0, 300), r.range(600, 1000), 1000 + i * 46, 6, 6))} strokeWidth={r.range(3, 7)} />
            ))}
          </g>
          <Ground r={r.fork('g')} y={1240} color={P.paperDeep} second={P.cream} />
        </g>
      ),
    },
  },
  {
    id: 'village',
    category: 'world',
    name: 'Village Bengal',
    subtitle: 'Mud walls, a pond, one palm leaning',
    palette: [P.clay, P.moss, P.amber],
    meta: { terrain: ['plain'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['nostalgic', 'intimate', 'serene'], intensity: 3, tags: ['village', 'gram', 'mud', 'pond', 'palm', 'rural', 'classic'] },
    art: {
      kind: 'proc',
      draw: (r) => (
        <g>
          <Ground r={r.fork('g')} y={HORIZON} color={P.moss} second={P.clay} />
          {[140, 830].map((x, i) => {
            const hr = r.fork('hut' + i)
            const pts: Pt[] = [[x - 90, 1020], [x - 100, 940], [x, 870], [x + 100, 940], [x + 90, 1020]]
            return (
              <g key={i}>
                <Wash d={smooth(pts, true)} color={P.clay} opacity={0.34} />
                <Ink pts={pts} r={hr} width={2.2} opacity={0.42} />
              </g>
            )
          })}
          <g>
            <path d={`M 900 1040 Q 916 930 930 840`} stroke={P.earth} strokeWidth={10} fill="none" opacity={0.5} />
            {Array.from({ length: 7 }, (_, i) => {
              const a = -2.5 + i * 0.55
              return <path key={i} d={`M 930 840 q ${Math.cos(a) * 70} ${Math.sin(a) * 50} ${Math.cos(a) * 130} ${Math.sin(a) * 96 + 24}`}
                stroke={P.green} strokeWidth={9} fill="none" opacity={0.42} strokeLinecap="round" />
            })}
          </g>
          <Wash d={blob(r.fork('pond'), 250, 1300, 300, 110, 9, 0.24)} color={P.teal} opacity={0.26} />
        </g>
      ),
    },
  },
  {
    id: 'tea-garden',
    category: 'world',
    name: 'Tea Garden',
    subtitle: 'Green terraces stepping into fog',
    palette: [P.green, P.moss, P.slate],
    meta: { terrain: ['mountain', 'plain'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['serene', 'intimate', 'nostalgic'], intensity: 2, tags: ['green', 'hills', 'terrace', 'fog', 'north-bengal', 'quiet'] },
    art: {
      kind: 'proc',
      draw: (r) => (
        <g>
          <Peaks r={r.fork('p')} y={HORIZON - 130} colors={[P.slate, P.moss]} />
          <Mist r={r.fork('m')} y={HORIZON - 20} opacity={0.55} />
          <Ground r={r.fork('g')} y={HORIZON + 30} color={P.green} />
          <g opacity={0.3}>
            {Array.from({ length: 8 }, (_, i) => {
              const y = 920 + i * 66
              return <path key={i} d={smooth(ridge(r.fork('row' + i), -40, 1040, y, 9, 7))} stroke={P.teal} strokeWidth={7 + i} fill="none" strokeLinecap="round" />
            })}
          </g>
        </g>
      ),
    },
  },
  {
    id: 'zamindar',
    category: 'world',
    name: 'Zamindar Courtyard',
    subtitle: 'The thakur dalan of an old house',
    palette: [P.cream, P.earth, P.gold],
    meta: { terrain: ['interior'], timeOfDay: ['dusk', 'night', 'golden'], mood: ['nostalgic', 'grand', 'intimate'], intensity: 3, tags: ['bonedi', 'courtyard', 'columns', 'heritage', 'indoor', 'classic', 'gold'] },
    art: {
      kind: 'proc',
      draw: (r, _b, s) => (
        <g>
          <Wash d={`M -40 300 L 1040 300 L 1040 1180 L -40 1180 Z`} color={P.cream} opacity={0.4} rim={false} />
          {[60, 210, 790, 940].map((x, i) => {
            const cr = r.fork('col' + i)
            const pts: Pt[] = [[x - 34, 1180], [x - 28, 420], [x + 28, 420], [x + 34, 1180]]
            return (
              <g key={i}>
                <Wash d={smooth(pts, true)} color={P.paperDeep} opacity={0.46} />
                <Ink pts={pts} r={cr} width={2.2} opacity={0.42} />
                <path d={blob(cr, x, 408, 52, 22, 7, 0.2)} fill={P.gold} opacity={0.3} />
              </g>
            )
          })}
          <g stroke={P.ink} fill="none" opacity={0.34} strokeWidth={2.4}>
            <path d={smooth([[-40, 400], [500, 372], [1040, 400]] as Pt[])} />
            {[0, 1, 2].map(i => <path key={i} d={`M ${180 + i * 320} 400 q 160 -78 320 0`} />)}
          </g>
          <Ground r={r.fork('g')} y={1180} color={P.earth} />
          {s.isNight && <Specks r={r.fork('sp')} box={{ x: 0, y: 400, w: 1000, h: 700 }} n={12} color={P.gold} size={5} opacity={0.24} />}
        </g>
      ),
    },
  },
  {
    id: 'rooftop',
    category: 'world',
    name: 'Rooftop Over Kolkata',
    subtitle: 'The whole city laid out below',
    palette: [P.indigo, P.amber, P.slate],
    meta: { terrain: ['rooftop', 'urban'], timeOfDay: ['dusk', 'night'], mood: ['intimate', 'nostalgic', 'dramatic'], intensity: 3, tags: ['city', 'chhaad', 'skyline', 'height', 'lights', 'modern'] },
    art: {
      kind: 'proc',
      draw: (r, _b, s) => (
        <g>
          <Buildings r={r.fork('far')} x1={-60} x2={1060} baseY={HORIZON + 90} color={P.slate} maxH={220} n={14} windowColor={s.isNight ? P.amber : P.cream} />
          <Buildings r={r.fork('mid')} x1={-60} x2={1060} baseY={HORIZON + 200} color={P.indigo} maxH={170} n={10} windowColor={P.amber} />
          <Wash d={`M -40 1060 L 1040 1060 L 1040 1540 L -40 1540 Z`} color={P.paperDeep} opacity={0.44} rim={false} />
          <g>
            <Ink pts={ridge(r, -40, 1040, 1060, 5, 7)} r={r} width={3} opacity={0.4} />
            {Array.from({ length: 13 }, (_, i) => (
              <rect key={i} x={-30 + i * 82} y={996} width={44} height={64} rx={4} fill={P.paperDeep} opacity={0.5} stroke={P.ink} strokeWidth={1.6} strokeOpacity={0.3} />
            ))}
          </g>
        </g>
      ),
    },
  },
  {
    id: 'rainy-kolkata',
    category: 'world',
    name: 'Rainy Kolkata',
    subtitle: 'Wet tar, and everything reflected twice',
    palette: [P.slate, P.indigo, P.amber],
    meta: { terrain: ['urban'], timeOfDay: ['dusk', 'night', 'day'], mood: ['nostalgic', 'dramatic', 'intimate'], intensity: 4, tags: ['rain', 'wet', 'city', 'reflection', 'monsoon', 'street'] },
    affinity: { boost: ['rain', 'wet', 'mist'] },
    art: {
      kind: 'proc',
      draw: (r, _b, s) => (
        <g>
          <Buildings r={r.fork('L')} x1={-70} x2={280} baseY={1100} color={P.slate} maxH={540} n={3} windowColor={P.amber} />
          <Buildings r={r.fork('R')} x1={720} x2={1070} baseY={1100} color={P.slate} maxH={540} n={3} windowColor={P.amber} />
          <Mist r={r.fork('m')} y={780} opacity={0.3} color={P.paper} />
          <Wash d={`M -40 1100 L 1040 1100 L 1040 1540 L -40 1540 Z`} color={P.indigo} opacity={0.3} rim={false} />
          <Reflection r={r.fork('rf')} x={300} y={1110} w={400} h={340} color={s.lightTint} opacity={0.3} />
          <g stroke={P.paper} strokeWidth={2.4} opacity={0.28} strokeLinecap="round">
            {Array.from({ length: 44 }, (_, i) => {
              const x = r() * 1060 - 30, y = r() * 1100
              return <path key={i} d={`M ${x} ${y} l -9 ${r.range(34, 64)}`} />
            })}
          </g>
        </g>
      ),
    },
  },
  {
    id: 'misty-valley',
    category: 'world',
    name: 'Misty Valley',
    subtitle: 'Cloud sitting in the folds of the hills',
    palette: [P.slate, P.teal, P.paper],
    meta: { terrain: ['mountain', 'forest'], timeOfDay: ['dawn', 'day', 'dusk'], mood: ['mystic', 'serene'], intensity: 2, tags: ['mist', 'fog', 'hills', 'quiet', 'cool', 'wet'] },
    affinity: { boost: ['mist', 'rain'] },
    art: {
      kind: 'proc',
      draw: (r) => (
        <g>
          <Peaks r={r.fork('p')} y={HORIZON - 110} colors={[P.slate, P.teal, P.green]} />
          <Mist r={r.fork('m1')} y={HORIZON - 60} opacity={0.66} />
          <Trees r={r.fork('t')} x1={-60} x2={1060} baseY={HORIZON + 190} n={7} canopy={[P.teal, P.green]} scale={1.1} />
          <Mist r={r.fork('m2')} y={HORIZON + 160} opacity={0.5} />
          <Ground r={r.fork('g')} y={1190} color={P.green} second={P.moss} />
          <Mist r={r.fork('m3')} y={1330} opacity={0.34} />
        </g>
      ),
    },
  },
]
