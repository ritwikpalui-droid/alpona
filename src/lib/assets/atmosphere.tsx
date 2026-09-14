import type { ReactNode } from 'react'
import type { Asset } from '../types'
import type { Rng } from '../rng'
import { P, HORIZON } from '../art/palette'
import { blob, Specks } from '../art/primitives'

/* ================================================================== *
 * SKY — painted beneath everything
 * ================================================================== */

function SkyWash({ id, stops }: { id: string; stops: [number, string, number][] }) {
  return (
    <>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          {stops.map(([o, c, a], i) => <stop key={i} offset={`${o}%`} stopColor={c} stopOpacity={a} />)}
        </linearGradient>
      </defs>
      <rect x={-40} y={-40} width={1080} height={HORIZON + 220} fill={`url(#sky-${id})`} />
    </>
  )
}

/** Loose cumulus — three overlapping washes so the pigment pools at the overlaps. */
function Clouds({ r, n = 4, color, y = 300, spread = 320, opacity = 0.3, scale = 1 }: {
  r: Rng; n?: number; color: string; y?: number; spread?: number; opacity?: number; scale?: number
}) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const cr = r.fork('cloud' + i)
        const cx = cr.range(60, 940)
        const cy = y + cr.jitter(spread)
        return (
          <g key={i} opacity={opacity}>
            {[0, 1, 2].map(k => (
              <path key={k}
                d={blob(cr.fork('p' + k), cx + cr.jitter(90), cy + cr.jitter(26), cr.range(110, 210) * scale, cr.range(34, 64) * scale, 9, 0.36)}
                fill={color} opacity={0.44 - k * 0.1} />
            ))}
          </g>
        )
      })}
    </g>
  )
}

function Moon({ r, x = 730, y = 250, rad = 62, color = P.cream, glow = true }: {
  r: Rng; x?: number; y?: number; rad?: number; color?: string; glow?: boolean
}) {
  return (
    <g>
      {glow && <circle cx={x} cy={y} r={rad * 2.4} fill={color} opacity={0.16} filter="url(#glow)" />}
      <path d={blob(r.fork('moon'), x, y, rad, rad, 13, 0.05)} fill={color} opacity={0.72} />
      <path d={blob(r.fork('mare'), x - rad * 0.25, y + rad * 0.2, rad * 0.34, rad * 0.26, 8, 0.3)} fill={P.paperDeep} opacity={0.34} />
    </g>
  )
}

function Stars({ r, n = 60, color = P.cream }: { r: Rng; n?: number; color?: string }) {
  return (
    <g fill={color}>
      {Array.from({ length: n }, (_, i) => (
        <circle key={i} cx={r.range(-20, 1020)} cy={r.range(-20, HORIZON - 60)} r={r.range(1.4, 3.6)} opacity={r.range(0.3, 0.9)} />
      ))}
    </g>
  )
}

function Rain({ r, n = 70, color = P.paper, opacity = 0.3, len = [30, 70] }: {
  r: Rng; n?: number; color?: string; opacity?: number; len?: [number, number]
}) {
  return (
    <g stroke={color} strokeWidth={2.2} opacity={opacity} strokeLinecap="round">
      {Array.from({ length: n }, (_, i) => {
        const x = r.range(-40, 1040), y = r.range(-40, 1100)
        return <path key={i} d={`M ${x.toFixed(0)} ${y.toFixed(0)} l -10 ${r.range(len[0], len[1]).toFixed(0)}`} />
      })}
    </g>
  )
}

function sky(id: string, name: string, subtitle: string, palette: string[],
  meta: Asset['meta'], draw: (r: Rng) => ReactNode, affinity?: Asset['affinity']): Asset {
  return { id, category: 'sky', name, subtitle, palette, meta, affinity, art: { kind: 'proc', draw: (r) => draw(r) } }
}

export const skies: Asset[] = [
  sky('clear-blue', 'Clear Blue', 'The impossible blue that only comes in autumn', [P.blue, P.paper, P.cream],
    { terrain: [], timeOfDay: ['day'], mood: ['serene', 'festive'], intensity: 1, tags: ['day', 'clear', 'bright', 'sharad', 'open'] },
    (r) => (<g><SkyWash id="cb" stops={[[0, P.blue, 0.5], [70, P.cream, 0.16], [100, P.paper, 0]]} /><Clouds r={r} n={2} color={P.paper} y={220} opacity={0.5} /></g>)),

  sky('golden-morning', 'Golden Morning', 'Six a.m., and the light is doing all the work', [P.amber, P.cream, P.rose],
    { terrain: [], timeOfDay: ['dawn'], mood: ['serene', 'nostalgic'], intensity: 2, tags: ['dawn', 'morning', 'warm', 'shiuli', 'soft', 'mahalaya'] },
    (r) => (<g><SkyWash id="gm" stops={[[0, P.rose, 0.3], [45, P.amber, 0.34], [100, P.cream, 0.1]]} /><Clouds r={r} n={3} color={P.marigold} y={340} opacity={0.24} /><Specks r={r.fork('s')} box={{ x: 0, y: 0, w: 1000, h: 600 }} n={14} color={P.amber} size={5} opacity={0.14} /></g>)),

  sky('pink-evening', 'Pink Evening', 'That fifteen minutes people stop and look up for', [P.pink, P.rose, P.violet],
    { terrain: [], timeOfDay: ['dusk'], mood: ['serene', 'nostalgic', 'intimate'], intensity: 2, tags: ['dusk', 'pink', 'soft', 'evening', 'gentle'] },
    (r) => (<g><SkyWash id="pe" stops={[[0, P.violet, 0.3], [50, P.pink, 0.38], [100, P.cream, 0.12]]} /><Clouds r={r} n={4} color={P.rose} y={380} opacity={0.3} /></g>)),

  sky('sunset', 'Sunset', 'The whole sky going at once', [P.marigold, P.vermilion, P.violet],
    { terrain: [], timeOfDay: ['dusk', 'golden'], mood: ['dramatic', 'grand', 'nostalgic'], intensity: 3, tags: ['sunset', 'orange', 'warm', 'dusk', 'bold'] },
    (r) => (<g><SkyWash id="ss" stops={[[0, P.violet, 0.36], [40, P.vermilion, 0.34], [72, P.marigold, 0.4], [100, P.amber, 0.16]]} />
      <circle cx={300} cy={640} r={78} fill={P.marigold} opacity={0.44} filter="url(#glow)" />
      <Clouds r={r} n={4} color={P.vermilion} y={420} opacity={0.26} /></g>)),

  sky('full-moon', 'Full Moon', 'Kojagori — the night she is asked to stay awake', [P.indigo, P.cream, P.slate],
    { terrain: [], timeOfDay: ['night'], mood: ['serene', 'mystic', 'grand'], intensity: 2, tags: ['night', 'moon', 'cool', 'quiet', 'kojagori', 'silver'] },
    (r) => (<g><SkyWash id="fm" stops={[[0, P.indigo, 0.62], [60, P.indigo, 0.34], [100, P.slate, 0.1]]} /><Stars r={r.fork('st')} n={44} /><Moon r={r} /></g>)),

  sky('moon-clouds', 'Moon & Clouds', 'Light coming and going behind the drift', [P.indigo, P.slate, P.cream],
    { terrain: [], timeOfDay: ['night'], mood: ['mystic', 'dramatic', 'nostalgic'], intensity: 3, tags: ['night', 'moon', 'cloud', 'drift', 'cool'] },
    (r) => (<g><SkyWash id="mc" stops={[[0, P.indigo, 0.6], [100, P.slate, 0.16]]} /><Stars r={r.fork('st')} n={26} /><Moon r={r} x={690} y={230} />
      <Clouds r={r.fork('c')} n={5} color={P.slate} y={280} opacity={0.4} scale={1.2} /></g>)),

  sky('deep-blue-night', 'Deep Blue Night', 'Two a.m., and the pandal is finally quiet', [P.indigo, P.ink, P.violet],
    { terrain: [], timeOfDay: ['night'], mood: ['mystic', 'intimate', 'serene'], intensity: 1, tags: ['night', 'dark', 'deep', 'still', 'quiet', 'late'] },
    (r) => (<g><SkyWash id="dbn" stops={[[0, P.ink, 0.66], [55, P.indigo, 0.56], [100, P.violet, 0.2]]} /><Stars r={r.fork('st')} n={30} color={P.slate} /></g>)),

  sky('stars', 'Full of Stars', 'Away from the city, where they all show up', [P.ink, P.indigo, P.cream],
    { terrain: [], timeOfDay: ['night'], mood: ['mystic', 'serene', 'grand'], intensity: 2, tags: ['night', 'stars', 'wild', 'remote', 'cold'] },
    (r) => (<g><SkyWash id="stk" stops={[[0, P.ink, 0.7], [100, P.indigo, 0.34]]} /><Stars r={r.fork('a')} n={130} />
      <g opacity={0.14}><path d={blob(r.fork('mw'), 500, 330, 520, 110, 11, 0.4)} fill={P.cream} filter="url(#blur-lg)" /></g></g>)),

  sky('mist-sky', 'Soft Mist', 'Everything a little further away than it is', [P.paperDeep, P.slate, P.paper],
    { terrain: [], timeOfDay: ['dawn', 'day'], mood: ['mystic', 'serene'], intensity: 1, tags: ['mist', 'fog', 'soft', 'cool', 'wet', 'quiet'] },
    (r) => (<g><SkyWash id="ms" stops={[[0, P.slate, 0.3], [60, P.paperDeep, 0.3], [100, P.paper, 0.1]]} />
      <Clouds r={r} n={5} color={P.paper} y={420} opacity={0.44} scale={1.5} /></g>)),

  sky('light-rain', 'Light Rain', 'The drizzle nobody bothers opening an umbrella for', [P.slate, P.teal, P.paperDeep],
    { terrain: [], timeOfDay: ['day', 'dusk'], mood: ['nostalgic', 'intimate', 'serene'], intensity: 2, tags: ['rain', 'wet', 'grey', 'monsoon', 'soft', 'cool'] },
    (r) => (<g><SkyWash id="lr" stops={[[0, P.slate, 0.44], [100, P.paperDeep, 0.2]]} /><Clouds r={r} n={4} color={P.slate} y={240} opacity={0.4} /><Rain r={r.fork('rn')} n={55} opacity={0.26} /></g>),
    { boost: ['rain', 'wet', 'mist'] }),

  sky('monsoon', 'Heavy Monsoon', 'Sky the colour of an old iron pot', [P.ink, P.slate, P.teal],
    { terrain: [], timeOfDay: ['day', 'dusk'], mood: ['dramatic', 'mystic'], intensity: 4, tags: ['rain', 'wet', 'storm', 'dark', 'monsoon', 'heavy'] },
    (r) => (<g><SkyWash id="mn" stops={[[0, P.ink, 0.5], [45, P.slate, 0.5], [100, P.teal, 0.2]]} />
      <Clouds r={r} n={6} color={P.ink} y={260} opacity={0.34} scale={1.4} /><Rain r={r.fork('rn')} n={110} opacity={0.34} len={[50, 100]} /></g>),
    { boost: ['rain', 'wet', 'storm'] }),

  sky('dramatic-clouds', 'Dramatic Clouds', 'Weather with an opinion', [P.slate, P.cream, P.violet],
    { terrain: [], timeOfDay: ['golden', 'dusk', 'day'], mood: ['dramatic', 'grand'], intensity: 3, tags: ['cloud', 'bold', 'sky', 'wind', 'big'] },
    (r) => (<g><SkyWash id="dc" stops={[[0, P.violet, 0.3], [60, P.slate, 0.26], [100, P.cream, 0.14]]} />
      <Clouds r={r} n={7} color={P.slate} y={320} opacity={0.36} scale={1.3} /><Clouds r={r.fork('hi')} n={3} color={P.cream} y={200} opacity={0.5} /></g>)),
]

/* ================================================================== *
 * LIGHTING — a full-bleed pass that recolours everything beneath it
 * ================================================================== */

function Tint({ color, o, blend = 'multiply' }: { color: string; o: number; blend?: 'multiply' | 'screen' | 'overlay' }) {
  return <rect x={-40} y={-40} width={1080} height={1580} fill={color} opacity={o} style={{ mixBlendMode: blend }} />
}

function Pool({ id, x, y, r: rad, color, o }: { id: string; x: number; y: number; r: number; color: string; o: number }) {
  return (
    <>
      <defs>
        <radialGradient id={`lp-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity={o} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={rad} fill={`url(#lp-${id})`} style={{ mixBlendMode: 'screen' }} />
    </>
  )
}

function Lamps({ pts, color, size = 9 }: { pts: [number, number][]; color: string; size?: number }) {
  return (
    <g>
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={size * 3.4} fill={color} opacity={0.24} filter="url(#glow-tight)" />
          <circle cx={x} cy={y} r={size} fill={color} opacity={0.8} />
        </g>
      ))}
    </g>
  )
}

function light(id: string, name: string, subtitle: string, palette: string[],
  meta: Asset['meta'], draw: (r: Rng) => ReactNode, affinity?: Asset['affinity']): Asset {
  return { id, category: 'lighting', name, subtitle, palette, meta, affinity, art: { kind: 'proc', draw: (r) => draw(r) } }
}

export const lightings: Asset[] = [
  light('golden-hour', 'Golden Hour', 'Twenty minutes when nothing looks bad', [P.amber, P.marigold, P.clay],
    { terrain: [], timeOfDay: ['golden'], mood: ['serene', 'nostalgic', 'grand'], intensity: 2, tags: ['warm', 'gold', 'soft', 'evening', 'flattering'] },
    () => (<g><Tint color={P.amber} o={0.24} blend="overlay" /><Pool id="gh" x={300} y={620} r={620} color={P.marigold} o={0.34} /><Tint color={P.clay} o={0.1} /></g>)),

  light('sunrise', 'Sunrise', 'Cold air, first light on the water', [P.rose, P.amber, P.cream],
    { terrain: [], timeOfDay: ['dawn'], mood: ['serene', 'intimate', 'nostalgic'], intensity: 2, tags: ['dawn', 'cool', 'pink', 'fresh', 'morning', 'soft'] },
    () => (<g><Tint color={P.rose} o={0.18} blend="overlay" /><Pool id="sr" x={720} y={700} r={560} color={P.amber} o={0.3} /></g>)),

  light('blue-hour', 'Blue Hour', 'After the sun, before the lamps', [P.indigo, P.slate, P.violet],
    { terrain: [], timeOfDay: ['dusk'], mood: ['serene', 'mystic', 'intimate'], intensity: 2, tags: ['cool', 'blue', 'dusk', 'quiet', 'still'] },
    () => (<g><Tint color={P.indigo} o={0.26} /><Tint color={P.violet} o={0.12} blend="overlay" /></g>)),

  light('moonlight', 'Moonlight', 'Silver, and no warmth in it at all', [P.slate, P.cream, P.indigo],
    { terrain: [], timeOfDay: ['night'], mood: ['serene', 'mystic'], intensity: 2, tags: ['night', 'moon', 'cool', 'silver', 'quiet', 'still'] },
    () => (<g><Tint color={P.indigo} o={0.4} /><Pool id="ml" x={700} y={260} r={640} color={P.cream} o={0.2} /></g>)),

  light('deep-night', 'Deep Night', 'One lamp left burning', [P.ink, P.indigo, P.amber],
    { terrain: [], timeOfDay: ['night'], mood: ['intimate', 'mystic', 'dramatic'], intensity: 3, tags: ['night', 'dark', 'late', 'quiet', 'moody'] },
    () => (<g><Tint color={P.ink} o={0.44} /><Pool id="dn" x={500} y={900} r={380} color={P.amber} o={0.42} /></g>)),

  light('diya', 'Diya Light', 'Wick, oil, and a flame that will not sit still', [P.marigold, P.amber, P.vermilion],
    { terrain: [], timeOfDay: ['night', 'dusk'], mood: ['intimate', 'nostalgic', 'serene'], intensity: 3, tags: ['warm', 'flame', 'diya', 'gold', 'traditional', 'small'] },
    () => (<g><Tint color={P.earth} o={0.3} /><Pool id="dy" x={500} y={1060} r={440} color={P.marigold} o={0.46} />
      <Lamps color={P.amber} size={7} pts={[[250, 1120], [340, 1148], [430, 1120], [570, 1120], [660, 1148], [750, 1120]]} /></g>)),

  light('fairy-lights', 'Fairy Lights', 'Strings of them, half not working', [P.amber, P.cream, P.indigo],
    { terrain: [], timeOfDay: ['night', 'dusk'], mood: ['festive', 'intimate', 'nostalgic'], intensity: 3, tags: ['warm', 'string', 'twinkle', 'festive', 'small', 'gold'] },
    (r) => (<g><Tint color={P.indigo} o={0.3} />
      {[0, 1, 2].map(row => (
        <g key={row}>{Array.from({ length: 16 }, (_, i) => {
          const x = 20 + i * 62, y = 480 + row * 70 + Math.sin(i * 0.8) * 26 + r.jitter(8)
          return <g key={i}><circle cx={x} cy={y} r={16} fill={P.amber} opacity={0.24} filter="url(#glow-tight)" /><circle cx={x} cy={y} r={4.6} fill={P.cream} opacity={0.85} /></g>
        })}</g>))}
      <Pool id="fl" x={500} y={640} r={560} color={P.amber} o={0.2} /></g>)),

  light('warm-festival', 'Warm Festival Light', 'The floodlights the committee rents every year', [P.marigold, P.amber, P.clay],
    { terrain: [], timeOfDay: ['night', 'dusk'], mood: ['festive', 'grand'], intensity: 4, tags: ['warm', 'bright', 'festive', 'flood', 'gold', 'crowd'] },
    () => (<g><Tint color={P.earth} o={0.2} /><Pool id="wf" x={500} y={820} r={640} color={P.marigold} o={0.46} /><Tint color={P.amber} o={0.14} blend="overlay" /></g>)),

  light('neon-kolkata', 'Neon Kolkata', 'Chandannagar lights, and far too many of them', [P.vermilion, P.teal, P.violet],
    { terrain: [], timeOfDay: ['night'], mood: ['festive', 'dramatic'], intensity: 5, tags: ['neon', 'bright', 'city', 'colour', 'loud', 'modern', 'crowd'] },
    () => (<g><Tint color={P.indigo} o={0.4} /><Pool id="nk1" x={220} y={720} r={420} color={P.vermilion} o={0.4} />
      <Pool id="nk2" x={800} y={780} r={420} color={P.teal} o={0.36} /><Pool id="nk3" x={500} y={980} r={360} color={P.violet} o={0.34} /></g>)),

  light('spotlight', 'Dramatic Spotlight', 'Her, lit. Everything else can wait', [P.ink, P.cream, P.gold],
    { terrain: [], timeOfDay: ['night'], mood: ['dramatic', 'grand'], intensity: 4, tags: ['dark', 'contrast', 'theatre', 'bold', 'modern', 'focus'] },
    () => (<g><Tint color={P.ink} o={0.56} /><Pool id="sp" x={500} y={880} r={330} color={P.cream} o={0.5} />
      <path d="M 430 480 L 570 480 L 700 1180 L 300 1180 Z" fill={P.cream} opacity={0.09} style={{ mixBlendMode: 'screen' }} /></g>)),

  light('rainy-night', 'Rainy Night Light', 'Every lamp doubled in the wet road', [P.indigo, P.amber, P.slate],
    { terrain: [], timeOfDay: ['night'], mood: ['nostalgic', 'dramatic', 'intimate'], intensity: 3, tags: ['rain', 'wet', 'night', 'reflection', 'cool', 'moody'] },
    () => (<g><Tint color={P.indigo} o={0.44} /><Pool id="rnl" x={500} y={860} r={420} color={P.amber} o={0.34} />
      <Lamps color={P.amber} size={8} pts={[[160, 760], [840, 760]]} /></g>),
    { boost: ['rain', 'wet', 'mist'] }),

  light('misty-cinematic', 'Misty Cinematic', 'Light arriving in visible shafts', [P.paperDeep, P.cream, P.slate],
    { terrain: [], timeOfDay: ['dawn', 'day'], mood: ['mystic', 'serene', 'dramatic'], intensity: 2, tags: ['mist', 'fog', 'soft', 'cool', 'shaft', 'quiet'] },
    () => (<g><Tint color={P.slate} o={0.2} /><Pool id="mcn" x={340} y={300} r={620} color={P.cream} o={0.34} />
      <g opacity={0.12} style={{ mixBlendMode: 'screen' }}>
        {[0, 1, 2].map(i => <path key={i} d={`M ${180 + i * 170} -40 L ${300 + i * 170} -40 L ${520 + i * 200} 1200 L ${300 + i * 200} 1200 Z`} fill={P.cream} />)}
      </g></g>),
    { boost: ['mist', 'fog', 'wet'] }),

]
