import type { ReactNode } from 'react'
import type { Asset } from '../types'
import type { Rng } from '../rng'
import { P, HORIZON } from '../art/palette'
import { blob, Ink, ridge, smooth, Wash, type Pt } from '../art/primitives'

/*
 * Ambient details. Every group carries an `a-*` class; those classes only do
 * anything when the scene root has `.alive`, and they collapse to nothing under
 * prefers-reduced-motion. Nothing here is allowed to compete with the idol.
 */

function amb(id: string, name: string, subtitle: string, palette: string[],
  meta: Asset['meta'], draw: (r: Rng) => ReactNode, affinity?: Asset['affinity']): Asset {
  return { id, category: 'ambience', name, subtitle, palette, meta, affinity, art: { kind: 'proc', draw: (r) => draw(r) } }
}

export const ambiences: Asset[] = [
  amb('none', 'Nothing Extra', 'Leave the air still', [P.paperDeep, P.cream, P.paper],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['serene', 'intimate'], intensity: 1, tags: ['minimal', 'quiet', 'still', 'restraint', 'clean'] },
    () => null),

  amb('floating-diyas', 'Floating Diyas', 'Let go upstream, and you watch them out of sight', [P.amber, P.marigold, P.cream],
    { terrain: ['river', 'sea'], timeOfDay: ['dusk', 'night'], mood: ['serene', 'mystic', 'nostalgic'], intensity: 2, tags: ['water', 'river', 'light', 'float', 'warm', 'drift', 'quiet'] },
    (r) => (<g className="a-drift">{Array.from({ length: 14 }, (_, i) => {
      const dr = r.fork('fd' + i)
      const x = dr.range(30, 970), y = dr.range(1100, 1440)
      return (<g key={i} style={{ animationDelay: `${(i * 0.7).toFixed(1)}s` }}>
        <ellipse cx={x} cy={y + 14} rx={22} ry={6} fill={P.amber} opacity={0.22} />
        <path d={blob(dr, x, y, 15, 8, 7, 0.2)} fill={P.clay} opacity={0.5} />
        <circle cx={x} cy={y - 8} r={22} fill={P.marigold} opacity={0.3} filter="url(#glow-tight)" />
        <circle cx={x} cy={y - 8} r={4.4} fill={P.amber} opacity={0.92} />
      </g>)
    })}</g>), { boost: ['water', 'river', 'sea'] }),

  amb('boats', 'Boats on the Water', 'Someone is always crossing, whatever the occasion', [P.earth, P.slate, P.cream],
    { terrain: ['river', 'sea'], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['nostalgic', 'serene'], intensity: 2, tags: ['water', 'river', 'boat', 'quiet', 'distance', 'life'] },
    (r) => (<g className="a-bob">{[[180, 980], [760, 1050], [420, 920]].map(([x, y], i) => {
      const br = r.fork('bt' + i)
      const s = 1 - i * 0.18
      const pts: Pt[] = [[x - 62 * s, y], [x - 40 * s, y + 18 * s], [x + 40 * s, y + 18 * s], [x + 62 * s, y]]
      return (<g key={i} style={{ animationDelay: `${i * 1.3}s` }}>
        <Wash d={smooth(pts, true)} color={P.earth} opacity={0.44} />
        <Ink pts={pts} r={br} width={1.8} opacity={0.4} />
        <path d={`M ${x} ${y} L ${x + br.jitter(6)} ${y - 70 * s}`} stroke={P.ink} strokeWidth={2.4} opacity={0.4} />
      </g>)
    })}</g>), { boost: ['water', 'river', 'sea'] }),

  amb('fireflies', 'Fireflies', 'Jonaki, switching on and off out of sync', [P.moss, P.amber, P.cream],
    { terrain: ['forest', 'plain', 'mountain'], timeOfDay: ['dusk', 'night'], mood: ['mystic', 'intimate', 'serene'], intensity: 1, tags: ['night', 'forest', 'glow', 'small', 'magic', 'quiet', 'wild'] },
    (r) => (<g className="a-twinkle">{Array.from({ length: 34 }, (_, i) => {
      const fr = r.fork('ff' + i)
      const x = fr.range(20, 980), y = fr.range(760, 1420)
      return (<g key={i} style={{ animationDelay: `${(fr() * 4).toFixed(2)}s` }}>
        <circle cx={x} cy={y} r={13} fill={P.amber} opacity={0.3} filter="url(#glow-tight)" />
        <circle cx={x} cy={y} r={2.8} fill={P.cream} opacity={0.9} />
      </g>)
    })}</g>), { boost: ['forest', 'trees', 'wild', 'green'] }),

  amb('birds', 'Birds', 'A line of them, going somewhere with purpose', [P.ink, P.slate, P.paper],
    { terrain: ['mountain', 'sea', 'plain', 'forest', 'river'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['serene', 'grand', 'nostalgic'], intensity: 1, tags: ['sky', 'bird', 'open', 'small', 'distance', 'quiet'] },
    (r) => (<g className="a-glide" stroke={P.ink} fill="none" strokeWidth={2.6} opacity={0.44} strokeLinecap="round">
      {Array.from({ length: 11 }, (_, i) => {
        const br = r.fork('bd' + i)
        const x = br.range(60, 940), y = br.range(120, 520), s = br.range(0.6, 1.3)
        return <path key={i} d={`M ${x - 14 * s} ${y} q ${7 * s} ${-9 * s} ${14 * s} 0 q ${7 * s} ${-9 * s} ${14 * s} 0`} style={{ animationDelay: `${(i * 0.4).toFixed(1)}s` }} />
      })}</g>), { boost: ['mountain', 'open', 'sky', 'sea'] }),

  amb('drifting-mist', 'Drifting Mist', 'Moving slowly enough that you have to watch to see it', [P.paper, P.paperDeep, P.slate],
    { terrain: ['mountain', 'forest', 'river'], timeOfDay: ['dawn', 'dusk', 'night'], mood: ['mystic', 'serene'], intensity: 2, tags: ['mist', 'fog', 'soft', 'cool', 'wet', 'quiet', 'slow'] },
    (r) => (<g className="a-drift-slow">{Array.from({ length: 6 }, (_, i) => (
      <path key={i} style={{ animationDelay: `${i * 2.4}s` }}
        d={blob(r.fork('dm' + i), r.range(120, 880), r.range(820, 1300), r.range(240, 420), r.range(34, 70), 9, 0.4)}
        fill={P.paper} opacity={0.26} />
    ))}</g>), { boost: ['mist', 'fog', 'wet', 'cool'] }),

  amb('rain-veil', 'Rain', 'Coming down steadily, with no sign of stopping', [P.slate, P.paper, P.teal],
    { terrain: ['urban', 'river', 'forest', 'mountain'], timeOfDay: ['day', 'dusk', 'night'], mood: ['nostalgic', 'dramatic', 'intimate'], intensity: 3, tags: ['rain', 'wet', 'monsoon', 'cool', 'grey', 'water'] },
    (r) => (<g className="a-rain" stroke={P.paper} strokeWidth={2.2} opacity={0.3} strokeLinecap="round">
      {Array.from({ length: 90 }, (_, i) => {
        const x = r.range(-60, 1060), y = r.range(-60, 1460)
        return <path key={i} d={`M ${x.toFixed(0)} ${y.toFixed(0)} l -11 ${r.range(38, 78).toFixed(0)}`} />
      })}</g>), { boost: ['rain', 'wet', 'monsoon', 'storm'] }),

  amb('distant-lights', 'Distant City Lights', 'The rest of Kolkata, carrying on without you', [P.amber, P.indigo, P.cream],
    { terrain: ['urban', 'rooftop', 'river'], timeOfDay: ['dusk', 'night'], mood: ['nostalgic', 'intimate', 'dramatic'], intensity: 2, tags: ['city', 'light', 'night', 'distance', 'warm', 'small'] },
    (r) => (<g className="a-twinkle">{Array.from({ length: 52 }, (_, i) => {
      const lr = r.fork('dl' + i)
      const x = lr.range(-10, 1010), y = HORIZON - lr.range(0, 150)
      return <circle key={i} cx={x} cy={y} r={lr.range(2, 4.6)} fill={lr() > 0.3 ? P.amber : P.cream}
        opacity={lr.range(0.4, 0.9)} style={{ animationDelay: `${(lr() * 5).toFixed(2)}s` }} />
    })}</g>), { boost: ['city', 'urban', 'skyline', 'street'] }),

  amb('falling-leaves', 'Falling Leaves', 'Kash and dry sal, turning over as they come down', [P.moss, P.clay, P.amber],
    { terrain: ['forest', 'plain', 'mountain'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['nostalgic', 'serene', 'intimate'], intensity: 2, tags: ['leaf', 'autumn', 'forest', 'soft', 'drift', 'green'] },
    (r) => (<g className="a-fall">{Array.from({ length: 22 }, (_, i) => {
      const lr = r.fork('lf' + i)
      const x = lr.range(20, 980), y = lr.range(300, 1300)
      return <path key={i} d={blob(lr, x, y, lr.range(9, 17), lr.range(5, 9), 6, 0.3)}
        fill={lr() > 0.5 ? P.moss : P.clay} opacity={0.46} style={{ animationDelay: `${(lr() * 6).toFixed(2)}s` }} />
    })}</g>), { boost: ['forest', 'trees', 'green', 'village'] }),

  amb('ripples', 'Gentle Ripples', 'The water never quite settles', [P.cream, P.teal, P.blue],
    { terrain: ['river', 'sea'], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['serene', 'intimate'], intensity: 1, tags: ['water', 'river', 'sea', 'quiet', 'soft', 'slow'] },
    (r) => (<g className="a-ripple" stroke={P.cream} fill="none" strokeLinecap="round" opacity={0.34}>
      {Array.from({ length: 12 }, (_, i) => {
        const rr = r.fork('rp' + i)
        const y = 1060 + i * 32 + rr.jitter(10)
        return <path key={i} d={smooth(ridge(rr, rr.range(20, 380), rr.range(600, 980), y, 4, 4))}
          strokeWidth={rr.range(2, 5)} style={{ animationDelay: `${(i * 0.4).toFixed(1)}s` }} />
      })}</g>), { boost: ['water', 'river', 'sea', 'reflection'] }),

  amb('crowd', 'Distant Crowd', 'Silhouettes, queueing in a line that does not move', [P.ink, P.inkSoft, P.slate],
    { terrain: ['urban', 'river', 'plain', 'interior'], timeOfDay: ['dusk', 'night', 'golden'], mood: ['festive', 'nostalgic'], intensity: 3, tags: ['crowd', 'people', 'city', 'festive', 'street', 'life'] },
    (r) => (<g opacity={0.34}>{Array.from({ length: 20 }, (_, i) => {
      const cr = r.fork('cw' + i)
      const x = cr.range(20, 980), y = cr.range(1120, 1260), h = cr.range(52, 88)
      return (<g key={i}>
        <path d={blob(cr, x, y - h * 0.35, 12, h * 0.4, 7, 0.18)} fill={P.ink} opacity={0.7} />
        <circle cx={x} cy={y - h * 0.82} r={9} fill={P.ink} opacity={0.7} />
      </g>)
    })}</g>), { boost: ['city', 'street', 'crowd', 'festive'] }),

  amb('smoke-drift', 'Drifting Smoke', 'Dhuno hanging in the air long after the dance', [P.paperDeep, P.slate, P.cream],
    { terrain: [], timeOfDay: ['dusk', 'night', 'golden'], mood: ['mystic', 'dramatic', 'nostalgic'], intensity: 2, tags: ['smoke', 'soft', 'drift', 'warm', 'slow', 'quiet'] },
    (r) => (<g className="a-drift-slow">{Array.from({ length: 5 }, (_, i) => (
      <path key={i} style={{ animationDelay: `${i * 1.9}s` }}
        d={blob(r.fork('sd' + i), r.range(200, 800), r.range(700, 1100), r.range(140, 260), r.range(50, 110), 9, 0.44)}
        fill={P.paperDeep} opacity={0.2} />
    ))}</g>)),
]
