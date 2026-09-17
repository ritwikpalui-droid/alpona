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

/* ------------------------------------------------------------------ *
 * New World locations — foreign landmarks and celestial backdrops,
 * added alongside the original Bengal-rooted set above. Same technique
 * throughout: graduated SkyGrad, layered far/mid/near elements, Wash/Ink/
 * blob for anything filled/outlined/organic, each with its own r.fork().
 * ------------------------------------------------------------------ */

// ---- eiffel-tower ----
/** The Eiffel Tower's ironwork silhouette — four legs that curve inward
 *  through two viewing platforms into a slender lattice mast and a short
 *  broadcast antenna, built from a tapering profile (not a plain triangle)
 *  plus real crisscross truss bracing and its own evening sparkle lights. */
function EiffelTowerLattice({ r, cx, baseY, topY, baseHalfW }: {
  r: Rng; cx: number; baseY: number; topY: number; baseHalfW: number
}): ReactNode {
  const totalH = baseY - topY
  const platform1Y = baseY - totalH * 0.27
  const platform2Y = baseY - totalH * 0.55
  const deckY = baseY - totalH * 0.86
  const mastTopY = baseY - totalH * 0.95
  const branchY = topY + 22
  const hw1 = baseHalfW * 0.41
  const hw2 = baseHalfW * 0.225
  const hw3 = baseHalfW * 0.09
  const hwMast = baseHalfW * 0.032

  const levels: [number, number][] = [
    [baseHalfW, baseY],
    [baseHalfW * 0.93, baseY - totalH * 0.08],
    [baseHalfW * 0.6, platform1Y + totalH * 0.05],
    [hw1, platform1Y],
    [hw2, platform2Y],
    [hw3, deckY],
    [hwMast, mastTopY],
  ]
  const halfWAt = (y: number): number => {
    for (let i = 0; i < levels.length - 1; i++) {
      const [hwA, yA] = levels[i], [hwB, yB] = levels[i + 1]
      if (y <= yA && y >= yB) return hwA + (hwB - hwA) * ((yA - y) / (yA - yB))
    }
    return levels[levels.length - 1][0]
  }

  const leftPts: Pt[] = levels.map(([hw, y]) => [cx - hw, y] as Pt)
  const rightPts: Pt[] = levels.map(([hw, y]) => [cx + hw, y] as Pt)
  const outline: Pt[] = [...leftPts, ...rightPts.slice().reverse()]
  const silhouette = smooth(outline, true)

  const lr = r.fork('lattice')
  const belts = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8
    const y = baseY + t * (deckY - baseY) + lr.jitter(5)
    return { y, hw: Math.max(2, halfWAt(y) + lr.jitter(3)) }
  })

  const sparkR = r.fork('spark')
  const sparks = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12
    const y = baseY - t * (baseY - platform2Y) + sparkR.jitter(20)
    const hw = halfWAt(y)
    const side = i % 2 === 0 ? -1 : 1
    return { x: cx + side * hw * sparkR.range(0.55, 0.96), y }
  })

  return (
    <g>
      {/* warm glow where the ironwork is brightest lit */}
      <path d={blob(r.fork('glow'), cx, platform1Y + 30, baseHalfW * 0.85, 210, 8, 0.18)}
        fill={P.marigold} opacity={0.16} filter="url(#glow)" />

      {/* faint body tone only — the truss lines below, not this fill, are
          what has to read as "lattice ironwork" rather than a solid cone */}
      <path d={silhouette} fill={P.inkSoft} opacity={0.13} />
      <Ink pts={outline} close r={r.fork('towerink')} width={2.4} opacity={0.7} color={P.ink} />

      {/* crisscross truss bracing, densest at the splayed base — needs to
          stand well clear of the faint body fill above or the whole tower
          reads as a flat silhouette instead of open ironwork */}
      <g stroke={P.ink} fill="none" strokeLinecap="round">
        {belts.map((b, i) => (
          <path key={'belt' + i} d={`M ${cx - b.hw} ${b.y} L ${cx + b.hw} ${b.y}`}
            strokeWidth={Math.max(1.2, 2.6 - i * 0.15)} opacity={Math.max(0.34, 0.72 - i * 0.045)} />
        ))}
        {belts.slice(0, -1).map((b, i) => {
          const n = belts[i + 1]
          const o = Math.max(0.28, 0.58 - i * 0.035)
          return (
            <g key={'x' + i}>
              <path d={`M ${cx - b.hw} ${b.y} L ${cx + n.hw} ${n.y}`} strokeWidth={1.5} opacity={o} />
              <path d={`M ${cx + b.hw} ${b.y} L ${cx - n.hw} ${n.y}`} strokeWidth={1.5} opacity={o} />
            </g>
          )
        })}
      </g>

      {/* the two viewing platforms */}
      {[{ y: platform1Y, hw: hw1, h: 14 }, { y: platform2Y, hw: hw2, h: 11 }].map((p, i) => (
        <g key={'deck' + i}>
          <rect x={cx - p.hw - 16} y={p.y - p.h / 2} width={(p.hw + 16) * 2} height={p.h} rx={2} fill={P.ink} opacity={0.56} />
          <rect x={cx - p.hw - 16} y={p.y - p.h / 2} width={(p.hw + 16) * 2} height={2} fill={P.marigold} opacity={0.5} />
        </g>
      ))}

      {/* slender mast, forked broadcast antenna, and the tip beacon */}
      <path d={`M ${cx} ${mastTopY} L ${cx} ${branchY}`} stroke={P.ink} strokeWidth={2.6} opacity={0.56} strokeLinecap="round" />
      <path d={`M ${cx} ${branchY} L ${cx - 9} ${topY + 4}`} stroke={P.ink} strokeWidth={1.6} opacity={0.5} />
      <path d={`M ${cx} ${branchY} L ${cx + 7} ${topY + 6}`} stroke={P.ink} strokeWidth={1.6} opacity={0.5} />
      <path d={`M ${cx} ${branchY} L ${cx} ${topY}`} stroke={P.ink} strokeWidth={1.8} opacity={0.56} strokeLinecap="round" />
      <circle cx={cx} cy={topY} r={5} fill={P.marigold} opacity={0.85} />
      <circle cx={cx} cy={topY} r={16} fill={P.marigold} opacity={0.3} filter="url(#glow)" />

      {/* evening sparkle lights scattered up the lower half */}
      <g fill={P.marigold}>
        {sparks.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={sparkR.range(1.6, 2.8)} opacity={sparkR.range(0.55, 0.85)} />
        ))}
      </g>
    </g>
  )
}

/** A row of Parisian mansard-roofed buildings — a bell-cast zinc roof over
 *  a pale stone facade, a dormer window on the slope, an occasional corner
 *  turret — the skyline the Tower rises above, not a generic city block. */
function EiffelMansardRow({ r, x1, x2, baseY, n, wallColor, roofColor, windowColor }: {
  r: Rng; x1: number; x2: number; baseY: number; n: number; wallColor: string; roofColor: string; windowColor: string
}): ReactNode {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const br = r.fork('bld' + i)
        const bw = ((x2 - x1) / n) * br.range(0.86, 1.18)
        const x = x1 + (i / n) * (x2 - x1) + br.jitter(8)
        const wallH = br.range(150, 230)
        const roofH = br.range(46, 74)
        const wallTop = baseY - wallH
        const roofTop = wallTop - roofH
        const bell = bw * 0.09
        const wallPts: Pt[] = [[x, baseY], [x, wallTop], [x + bw, wallTop], [x + bw, baseY]]
        const roofPts: Pt[] = [
          [x - bell * 0.3, wallTop],
          [x - bell, wallTop - roofH * 0.35],
          [x + bw * 0.18, roofTop],
          [x + bw * 0.82, roofTop],
          [x + bw + bell, wallTop - roofH * 0.35],
          [x + bw + bell * 0.3, wallTop],
        ]
        const hasTurret = br() < 0.28
        const numCols = Math.max(1, Math.floor((bw - 16) / 32))
        return (
          <g key={i}>
            <path d={smooth(wallPts, true)} fill={wallColor} opacity={0.5} />
            <Ink pts={wallPts} close r={br.fork('wallink')} width={2} opacity={0.4} />
            <g fill={windowColor} opacity={0.58}>
              {Array.from({ length: 3 * numCols }, (_, idx) => {
                const row = Math.floor(idx / numCols), col = idx % numCols
                return (
                  <rect key={idx} x={x + 10 + col * 32} y={wallTop + 18 + row * (wallH - 36) / 3}
                    width={11} height={16} rx={1} />
                )
              })}
            </g>
            <path d={smooth(roofPts, true)} fill={roofColor} opacity={0.56} />
            <Ink pts={roofPts} close r={br.fork('roofink')} width={2} opacity={0.44} color={P.inkSoft} />
            <rect x={x + bw * 0.4} y={roofTop + roofH * 0.32} width={bw * 0.18} height={roofH * 0.3} rx={2} fill={windowColor} opacity={0.48} />
            {hasTurret && (
              <g>
                <path d={blob(br.fork('turret'), x + bw + 12, wallTop - 10, 15, 42, 7, 0.14)} fill={wallColor} opacity={0.5} />
                <path d={`M ${x + bw - 3} ${wallTop - 48} L ${x + bw + 27} ${wallTop - 48} L ${x + bw + 12} ${wallTop - 90} Z`} fill={roofColor} opacity={0.58} />
              </g>
            )}
            <rect x={x + bw * 0.66} y={roofTop - 18} width={9} height={18} fill={roofColor} opacity={0.5} />
          </g>
        )
      })}
    </g>
  )
}

// ---- venice ----
/** The Rialto-style humpback stone footbridge — the single most load-bearing
 *  shape in this scene. Built as a proper stone "ring": an outer parapet
 *  curve and an inner arch-soffit curve sharing the same x-positions, so the
 *  balusters (sampled straight off the parapet curve's own points) always
 *  sit exactly on the drawn line, and the space below the soffit curve is
 *  left unpainted (only lightly shaded) — whatever was painted behind it
 *  (hazy far rooftops, haze) shows straight through, the way daylight
 *  actually shows under a real stone arch. */
function VeniceBridge({ r, cx, waterY, span, rise }: { r: Rng; cx: number; waterY: number; span: number; rise: number }) {
  const br = r.fork('bridge')
  const N = 12
  const deckThick = 44
  const archUnder: Pt[] = Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N
    const hump = Math.sin(t * Math.PI)
    return [cx - span + t * 2 * span, waterY - hump * rise + br.jitter(2)] as Pt
  })
  const deckTop: Pt[] = archUnder.map(([x, y], i) => {
    const t = i / N
    const thick = deckThick * (0.55 + 0.45 * Math.sin(t * Math.PI))
    return [x, y - thick] as Pt
  })
  const endThick = deckThick * 0.55
  const shadowD = smooth([...archUnder, [archUnder[N][0], waterY + 60], [archUnder[0][0], waterY + 60]] as Pt[], true)
  const ringD = smooth([...deckTop, ...[...archUnder].reverse()] as Pt[], true)

  return (
    <g>
      {/* the shaded water directly beneath the arch — the tunnel's depth */}
      <path d={shadowD} fill={P.ink} opacity={0.16} />
      {/* stone abutments anchoring both ends into the banks */}
      {[-1, 1].map((side) => {
        const ex = cx + side * span
        const pts: Pt[] = [[ex - 14, waterY - endThick], [ex + 14, waterY - endThick], [ex + 14, waterY + 44], [ex - 14, waterY + 44]]
        return <path key={side} d={smooth(pts, true)} fill={P.paperDeep} opacity={0.5} />
      })}
      {/* the stone deck/parapet ring itself */}
      <Wash d={ringD} color={P.paperDeep} opacity={0.56} />
      <Ink pts={deckTop} r={br.fork('top')} width={2.2} opacity={0.5} color={P.inkSoft} />
      <Ink pts={archUnder} r={br.fork('under')} width={2} opacity={0.44} color={P.inkSoft} />
      {/* balusters along the parapet */}
      {deckTop.slice(3, N - 2).map(([bx, by], i) => (
        <g key={i}>
          <path d={`M ${bx} ${by} L ${bx} ${by - 13}`} stroke={P.paperDeep} strokeWidth={3.2} opacity={0.56} strokeLinecap="round" />
          <circle cx={bx} cy={by - 15} r={2.6} fill={P.paperDeep} opacity={0.6} />
        </g>
      ))}
      {/* a small lamp at each end of the parapet */}
      {[2, N - 2].map((i) => {
        const [lx, ly] = deckTop[i]
        const lr = br.fork('lamp' + i)
        return (
          <g key={i}>
            <path d={`M ${lx} ${ly} L ${lx} ${ly - 46}`} stroke={P.inkSoft} strokeWidth={2.6} opacity={0.5} />
            <path d={blob(lr, lx, ly - 58, 12, 15, 7, 0.2)} fill={P.amber} opacity={0.5} />
            <path d={blob(lr.fork('glow'), lx, ly - 58, 22, 26, 7, 0.2)} fill={P.amber} opacity={0.18} filter="url(#glow)" />
          </g>
        )
      })}
      {/* a couple of steps down onto the fondamenta beside each abutment */}
      {[-1, 1].map((side) => {
        const ex = cx + side * span + side * 20
        return (
          <g key={side} stroke={P.inkSoft} strokeWidth={2} opacity={0.34}>
            {[0, 1, 2].map((k) => (
              <path key={k} d={`M ${ex + side * k * 12} ${waterY + 4 + k * 10} L ${ex + side * (k * 12 + 20)} ${waterY + 4 + k * 10}`} />
            ))}
          </g>
        )
      })}
    </g>
  )
}

/** One narrow, weathered pastel Venetian house-front, its base meeting the
 *  canal directly — no quay, no grass, which is itself the Venice cue.
 *  Called several times at shrinking scale toward the bridge to fake the
 *  canal's forced perspective. */
function VeniceFacade({ r, x, w, baseY, topY, color, shutter = P.teal, chimney = false }: {
  r: Rng; x: number; w: number; baseY: number; topY: number; color: string; shutter?: string; chimney?: boolean
}) {
  const fr = r.fork('facade')
  const taper = w * 0.03
  const h = baseY - topY
  // A midpoint on each side keeps `smooth()`'s spline running straight up a
  // tall facade — with only the 4 corners, a closed Catmull-Rom curve reads
  // the far corner across the shape as its tangent and bows the long vertical
  // edges outward into a rounded dome instead of a building (visible on any
  // facade taller than it is wide, which most of these are).
  const wallPts: Pt[] = [
    [x, baseY], [x, topY + h * 0.5], [x + taper, topY],
    [x + w - taper, topY], [x + w, topY + h * 0.5], [x + w, baseY],
  ]
  const floors = Math.max(1, Math.min(6, Math.round(h / 130)))
  const cols = w > 150 ? 3 : w > 85 ? 2 : 1
  return (
    <g>
      <Wash d={smooth(wallPts, true)} color={color} opacity={0.52} />
      <Ink pts={wallPts} close r={fr} width={2.2} opacity={0.5} color={P.inkSoft} />
      {/* the damp, water-stained base every Venetian wall wears */}
      <Wash
        d={smooth([[x - 3, baseY], [x + taper + 3, baseY - h * 0.12], [x + w - taper - 3, baseY - h * 0.12], [x + w + 3, baseY]] as Pt[], true)}
        color={P.inkSoft} opacity={0.18} rim={false}
      />
      <path d={`M ${x + taper} ${topY} L ${x + w - taper} ${topY}`} stroke={P.inkSoft} strokeWidth={2.2} opacity={0.4} />
      {chimney && (
        <g>
          <path
            d={`M ${x + w * 0.62 - 11} ${topY} L ${x + w * 0.62 - 6} ${topY - 28} L ${x + w * 0.62 + 6} ${topY - 28} L ${x + w * 0.62 + 11} ${topY} Z`}
            fill={P.terracotta} opacity={0.5}
          />
          <ellipse cx={x + w * 0.62} cy={topY - 28} rx={6} ry={2} fill={P.inkSoft} opacity={0.4} />
        </g>
      )}
      {Array.from({ length: floors }, (_, fl) => (
        <g key={fl}>
          {Array.from({ length: cols }, (_, c) => {
            const wr = fr.fork(`w${fl}${c}`)
            const wx = x + w * ((c + 1) / (cols + 1))
            const wy = topY + h * ((fl + 1) / (floors + 1))
            const hw = Math.min(13, w / (cols * 3.4))
            const hh = hw * 1.5
            const arch = `M ${wx - hw} ${wy + hh} L ${wx - hw} ${wy} Q ${wx - hw} ${wy - hh} ${wx} ${wy - hh} Q ${wx + hw} ${wy - hh} ${wx + hw} ${wy} L ${wx + hw} ${wy + hh} Z`
            return (
              <g key={c}>
                <path d={arch} fill={P.indigo} opacity={0.38} />
                <path d={arch} fill="none" stroke={P.inkSoft} strokeWidth={1.3} opacity={0.4} />
                <rect x={wx - hw - 5} y={wy - hh * 0.3} width={3.6} height={hh * 1.2} fill={shutter} opacity={wr.range(0.32, 0.5)} />
                <rect x={wx + hw + 1.4} y={wy - hh * 0.3} width={3.6} height={hh * 1.2} fill={shutter} opacity={wr.range(0.32, 0.5)} />
              </g>
            )
          })}
        </g>
      ))}
    </g>
  )
}

/** A gondola — the long black hull with its asymmetric sheer (higher at the
 *  bow than the stern) and, at the bow, the "ferro di prua": the single
 *  upright comb-toothed fin that is the one shape nothing else in the world
 *  gets mistaken for. */
function VeniceGondola({ r, x, y, scale = 1 }: { r: Rng; x: number; y: number; scale?: number }) {
  const gr = r.fork('gondola')
  const L = 140 * scale
  const hullPts: Pt[] = [
    [x - L * 0.6, y + 6], [x - L * 0.32, y + 16], [x + L * 0.3, y + 16],
    [x + L * 0.7, y - 2], [x + L * 0.48, y - 12], [x - L * 0.4, y - 9],
  ]
  const prowX = x + L * 0.7, prowY = y - 12
  return (
    <g>
      <ellipse cx={x + L * 0.05} cy={y + 24} rx={L * 0.5} ry={7} fill={P.ink} opacity={0.14} filter="url(#blur-lg)" />
      <Wash d={smooth(hullPts, true)} color={P.ink} opacity={0.6} rim={false} />
      <Ink pts={hullPts} close r={gr} width={2} opacity={0.54} color={P.ink} />
      <path d={`M ${x - L * 0.44} ${y - 5} L ${x + L * 0.42} ${y - 8}`} stroke={P.gold} strokeWidth={1.4} opacity={0.4} />
      <g stroke={P.paper} strokeWidth={2} opacity={0.68} strokeLinecap="round" fill="none">
        <path d={`M ${prowX} ${prowY} L ${prowX + 3} ${prowY - 30}`} />
        <path d={`M ${prowX + 3} ${prowY - 30} Q ${prowX - 5} ${prowY - 36} ${prowX - 11} ${prowY - 26}`} />
        {[0, 1, 2, 3].map((i) => {
          const ty = prowY - 6 - i * 6.5
          const tw = 6 - i
          return <path key={i} d={`M ${prowX + 3 - tw} ${ty} L ${prowX + 3} ${ty}`} />
        })}
      </g>
      <path d={`M ${x + L * 0.08} ${y - 11} L ${x + L * 0.3} ${y - 70}`} stroke={P.earth} strokeWidth={2.4} opacity={0.4} strokeLinecap="round" />
    </g>
  )
}

/** A bricola — one of the striped wooden mooring poles marking the shallows,
 *  always seen leaning slightly, always in twos or threes near a doorway. */
function VeniceMooringPole({ r, x, y, h = 130, stripe = P.paper }: { r: Rng; x: number; y: number; h?: number; stripe?: string }) {
  const pr = r.fork('pole')
  const lean = pr.jitter(10)
  const topY = y - h
  return (
    <g>
      <ellipse cx={x} cy={y + 3} rx={11} ry={4} fill={P.ink} opacity={0.14} />
      <path d={`M ${x} ${y} L ${x + lean} ${topY}`} stroke={P.earth} strokeWidth={8.5} opacity={0.58} strokeLinecap="round" />
      {Array.from({ length: 4 }, (_, i) => {
        const t = 0.18 + i * 0.2
        const px = x + lean * t, py = topY + h * (1 - t)
        return <path key={i} d={`M ${px - 5} ${py + 6} L ${px + 5} ${py - 6}`} stroke={stripe} strokeWidth={4.4} opacity={0.5} strokeLinecap="round" />
      })}
      <ellipse cx={x + lean} cy={topY} rx={6} ry={3.4} fill={P.earth} opacity={0.5} />
    </g>
  )
}

// ---- great-wall ----
/** Linear-interpolated y on a ridge polyline at an arbitrary x — lets the
 *  wall's own teeth and towers sit exactly on the ridgeline that carries
 *  them, instead of guessing offsets by eye. */
function greatWallRidgeY(pts: Pt[], x: number): number {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1]
    if (x >= ax && x <= bx) return ay + (by - ay) * ((x - ax) / (bx - ax || 1))
  }
  return pts[pts.length - 1][1]
}

/**
 * A stretch of Great Wall rampart following a ridgeline: a stone ribbon
 * (parapet walk down to its downhill base) topped with alternating merlon
 * blocks — the crenellated silhouette that is the single detail that makes
 * this unmistakably THE Wall, not a garden fence on a hill. `pts` is the
 * ridge the wall's own walkway follows (built with `ridge(...)`, and often
 * reused as the hill's own crest line too, so wall and terrain stay locked
 * together instead of drifting apart).
 */
function GreatWallRampart({ r, pts, thickness, color, opacity = 0.5, teeth = 14, toothW = 20, toothH = 16 }: {
  r: Rng; pts: Pt[]; thickness: number; color: string; opacity?: number
  teeth?: number; toothW?: number; toothH?: number
}) {
  const x1 = pts[0][0], x2 = pts[pts.length - 1][0]
  const base = pts.map(([x, y]) => [x, y + thickness] as Pt)
  const body = smooth([...pts, ...base.slice().reverse()] as Pt[], true)
  return (
    <g>
      <Wash d={body} color={color} opacity={opacity} />
      <Ink pts={pts} r={r.fork('rampline')} width={2.6} opacity={Math.min(0.75, opacity + 0.28)} />
      <g fill={color} stroke={P.inkSoft} strokeWidth={1.3} opacity={Math.min(0.85, opacity + 0.3)}>
        {Array.from({ length: teeth }, (_, i) => {
          if (i % 2 === 1) return null
          const cx = x1 + ((i + 0.5) / teeth) * (x2 - x1)
          const cy = greatWallRidgeY(pts, cx) + r.fork('tooth' + i).jitter(1.4)
          return <rect key={i} x={cx - toothW / 2} y={cy - toothH} width={toothW} height={toothH + 4} rx={1.5} />
        })}
      </g>
    </g>
  )
}

/**
 * One Great Wall watchtower: a square stone base with a doorway and two
 * window slits, capped by a hipped roof with flared, upturned corners — the
 * distinctive Chinese roofline that reads at a glance even at small scale.
 */
function GreatWallWatchtower({ r, x, y, scale = 1, wallColor, roofColor }: {
  r: Rng; x: number; y: number; scale?: number; wallColor: string; roofColor: string
}) {
  const tr = r.fork('tower')
  const w = 76 * scale, h = 104 * scale
  const bodyPts: Pt[] = [[x - w / 2, y + 6 * scale], [x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y + 6 * scale]]
  const roofPts: Pt[] = [
    [x - w / 2 - 18 * scale, y - h + 6 * scale],
    [x - w / 2 - 30 * scale, y - h - 8 * scale],
    [x, y - h - 42 * scale],
    [x + w / 2 + 30 * scale, y - h - 8 * scale],
    [x + w / 2 + 18 * scale, y - h + 6 * scale],
  ]
  return (
    <g>
      <Wash d={smooth(bodyPts, true)} color={wallColor} opacity={0.6} />
      <Ink pts={bodyPts} r={tr} close width={2.2} opacity={0.56} color={P.inkSoft} />
      <path d={`M ${x - w / 2} ${y - h * 0.38} L ${x + w / 2} ${y - h * 0.38}`} stroke={P.inkSoft} strokeWidth={1.6} opacity={0.3} />
      {[-1, 1].map((s) => (
        <rect key={s} x={x + s * w * 0.22 - 5 * scale} y={y - h * 0.66} width={9 * scale} height={16 * scale} fill={P.inkSoft} opacity={0.4} rx={1} />
      ))}
      <path d={`M ${x - w * 0.18} ${y + 6 * scale} L ${x - w * 0.18} ${y - h * 0.22} L ${x + w * 0.18} ${y - h * 0.22} L ${x + w * 0.18} ${y + 6 * scale}`}
        stroke={P.inkSoft} strokeWidth={2} fill="none" opacity={0.4} />
      <Wash d={smooth(roofPts, true)} color={roofColor} opacity={0.58} />
      <Ink pts={roofPts} r={tr.fork('roof')} close width={2} opacity={0.5} color={P.inkSoft} />
    </g>
  )
}

// ---- pyramids ----
/** One Giza pyramid — an isoceles silhouette split by a near-corner ridge
 *  line into a sun-lit face and a shadow face (the two-facet read that
 *  makes a plain triangle unmistakably a pyramid rather than a mountain),
 *  banded with faint horizontal course-lines for the stacked limestone
 *  blocks the real monument is built from. */
function GizaPyramid({ r, cx, baseY, height, halfWidth, lit, shade, edgeBias = 0.16 }: {
  r: Rng; cx: number; baseY: number; height: number; halfWidth: number; lit: string; shade: string; edgeBias?: number
}) {
  const apex: Pt = [cx + r.jitter(3), baseY - height]
  const left: Pt = [cx - halfWidth, baseY]
  const right: Pt = [cx + halfWidth, baseY]
  const edge: Pt = [cx + halfWidth * edgeBias, baseY]
  const courseN = r.int(5, 7)
  return (
    <g>
      <Wash d={smooth([left, apex, edge], true)} color={shade} opacity={0.56} rim={false} />
      <Wash d={smooth([edge, apex, right], true)} color={lit} opacity={0.5} rim={false} />
      <g stroke={P.inkSoft} strokeWidth={1.2} opacity={0.22}>
        {Array.from({ length: courseN }, (_, i) => {
          const t = (i + 1) / (courseN + 1)
          const y = apex[1] + (baseY - apex[1]) * t
          const xL = apex[0] + (left[0] - apex[0]) * t
          const xR = apex[0] + (right[0] - apex[0]) * t
          return <path key={i} d={`M ${xL + r.jitter(3)} ${y} L ${xR + r.jitter(3)} ${y}`} />
        })}
      </g>
      <Ink pts={[left, apex, right]} r={r.fork('out')} close width={2.6} opacity={0.5} color={P.ink} />
      <Ink pts={[apex, edge]} r={r.fork('ridge')} width={1.8} opacity={0.32} color={P.ink} />
    </g>
  )
}

/** The Great Sphinx, seen in near-silhouette against the low sun — a
 *  couchant lion body with forepaws stretched flat along the sand, topped
 *  with the pharaoh's nemes headdress: a crisp, straight-edged shelf
 *  projecting behind the crown and a flap draping the chest, the two
 *  details that keep this from reading as a plain reclining lion. */
function GreatSphinx({ r, cx, baseY, scale = 1, color, rimColor }: {
  r: Rng; cx: number; baseY: number; scale?: number; color: string; rimColor: string
}) {
  const s = scale
  const at = (dx: number, dy: number): Pt => [cx + dx * s, baseY + dy * s]
  const bodyPts: Pt[] = [
    at(-150, 0), at(-172, -50), at(-140, -90), at(-60, -102),
    at(15, -84), at(45, -55), at(65, -16), at(150, -10), at(150, 0),
  ]
  const shelfPts: Pt[] = [at(48, -170), at(78, -186), at(80, -150), at(56, -144)]
  const flapPts: Pt[] = [at(104, -158), at(120, -100), at(94, -96), at(90, -142)]
  const headCx = cx + 82 * s, headCy = baseY - 138 * s
  return (
    <g>
      <ellipse cx={cx + 10 * s} cy={baseY + 6 * s} rx={165 * s} ry={16 * s} fill={P.ink} opacity={0.14} filter="url(#blur-lg)" />
      <Wash d={smooth(bodyPts, true)} color={color} opacity={0.62} rim={false} />
      <path d={smooth(shelfPts, true)} fill={color} opacity={0.6} />
      <path d={smooth(flapPts, true)} fill={color} opacity={0.6} />
      <Wash d={blob(r.fork('head'), headCx, headCy, 30 * s, 42 * s, 8, 0.14)} color={color} opacity={0.62} rim={false} />
      <Ink pts={bodyPts} r={r.fork('body')} close width={2.4} opacity={0.5} color={P.ink} />
      <Ink pts={shelfPts} r={r.fork('shelfLine')} close width={1.6} opacity={0.42} color={P.ink} />
      <Ink pts={flapPts} r={r.fork('flapLine')} close width={1.6} opacity={0.42} color={P.ink} />
      <path d={smooth([at(-172, -50), at(-140, -90), at(-60, -102)])} stroke={rimColor} strokeWidth={2 * s} opacity={0.26} fill="none" strokeLinecap="round" />
      <path d={`M ${headCx - 26 * s} ${headCy - 8 * s} Q ${headCx - 2 * s} ${headCy - 32 * s} ${headCx + 20 * s} ${headCy - 22 * s}`}
        stroke={rimColor} strokeWidth={2 * s} opacity={0.3} fill="none" strokeLinecap="round" />
    </g>
  )
}

// ---- santorini ----
/** A single blocky whitewashed Cycladic cube house, terraced onto the cliff. */
function SantoriniCubeHouse(r: Rng, x: number, y: number, w: number, h: number, wall: string, shutter: string, domeColor?: string): ReactNode {
  const hr = r.fork('house')
  const bodyPts: Pt[] = [
    [x - w / 2 + hr.jitter(2), y],
    [x - w / 2 + hr.jitter(2), y - h],
    [x + w / 2 + hr.jitter(2), y - h],
    [x + w / 2 + hr.jitter(2), y],
  ]
  return (
    <g>
      <ellipse cx={x} cy={y + 3} rx={w * 0.56} ry={4} fill={P.ink} opacity={0.12} />
      <Wash d={smooth(bodyPts, true)} color={wall} opacity={0.6} />
      <Ink pts={bodyPts} close r={hr} width={1.6} opacity={0.46} color={P.ink} />
      {domeColor ? (
        <path d={blob(hr.fork('cap'), x, y - h - w * 0.2, w * 0.32, w * 0.26, 8, 0.16)} fill={domeColor} opacity={0.62} />
      ) : (
        <path d={`M ${x - w / 2 - 2} ${y - h} L ${x + w / 2 + 2} ${y - h}`} stroke={P.paperDeep} strokeWidth={2.4} opacity={0.5} />
      )}
      <rect x={x - w * 0.16} y={y - h * 0.58} width={w * 0.32} height={h * 0.3} fill={shutter} opacity={0.5} />
      <path d={`M ${x} ${y - h * 0.58} L ${x} ${y - h * 0.28}`} stroke={P.ink} strokeWidth={1} opacity={0.28} />
    </g>
  )
}

/**
 * The single most iconic mark of this place: a whitewashed Orthodox chapel
 * with a cobalt-blue dome and a small cross, standing taller than every
 * house around it so it reads clearly above the terraced skyline.
 */
function SantoriniBlueDome(r: Rng, x: number, y: number, scale: number): ReactNode {
  const cr = r.fork('dome')
  const s = scale
  const bw = 30 * s
  const th = 70 * s
  const dw = bw * 0.6
  const dh = 16 * s
  const domeR = dw * 1.5
  const bodyPts: Pt[] = [
    [x - bw + cr.jitter(2), y],
    [x - bw + cr.jitter(2), y - th],
    [x + bw + cr.jitter(2), y - th],
    [x + bw + cr.jitter(2), y],
  ]
  const drumPts: Pt[] = [
    [x - dw, y - th],
    [x - dw, y - th - dh],
    [x + dw, y - th - dh],
    [x + dw, y - th],
  ]
  const domeCy = y - th - dh - domeR * 0.68
  const apexY = domeCy - domeR * 1.05
  return (
    <g>
      <ellipse cx={x} cy={y + 4 * s} rx={bw * 1.1} ry={6 * s} fill={P.ink} opacity={0.14} />
      <Wash d={smooth(bodyPts, true)} color={P.paper} opacity={0.62} />
      <Ink pts={bodyPts} close r={cr.fork('body')} width={2} opacity={0.5} color={P.ink} />
      <path d={`M ${x - dw * 0.6} ${y} L ${x - dw * 0.6} ${y - th * 0.42} A ${dw * 0.6} ${dw * 0.6} 0 0 1 ${x + dw * 0.6} ${y - th * 0.42} L ${x + dw * 0.6} ${y} Z`}
        fill={P.indigo} opacity={0.55} />
      <Ink pts={[[x - dw * 0.6, y], [x - dw * 0.6, y - th * 0.42], [x, y - th * 0.62], [x + dw * 0.6, y - th * 0.42], [x + dw * 0.6, y]]}
        r={cr.fork('arch')} width={1.3} opacity={0.4} color={P.ink} />
      <Wash d={smooth(drumPts, true)} color={P.cream} opacity={0.58} />
      <Ink pts={drumPts} close r={cr.fork('drum')} width={1.6} opacity={0.42} color={P.ink} />
      <Wash d={blob(cr.fork('domeshape'), x, domeCy, domeR, domeR * 0.9, 9, 0.12)} color={P.blue} opacity={0.64} />
      <path d={blob(cr.fork('domehi'), x - domeR * 0.3, domeCy - domeR * 0.3, domeR * 0.36, domeR * 0.24, 7, 0.2)} fill={P.paper} opacity={0.3} />
      <path d={`M ${x} ${domeCy - domeR * 0.95} L ${x} ${apexY} M ${x - 6 * s} ${apexY + 5 * s} L ${x + 6 * s} ${apexY + 5 * s}`}
        stroke={P.ink} strokeWidth={1.8 * s} opacity={0.55} strokeLinecap="round" />
    </g>
  )
}

// ---- machu-picchu ----
/** The unmistakable sugarloaf silhouette of Huayna Picchu — steep, fluted
 *  rock flanks climbing to a narrow, slightly rounded summit, with cloud
 *  forever snagging at its collar. This is the one shape that has to read
 *  instantly, so it gets its own hand-built outline rather than the
 *  generic rolling Peaks() range. */
function HuaynaPicchuPeak({ r, cx, baseY, apexY, width, rock, green }: {
  r: Rng; cx: number; baseY: number; apexY: number; width: number; rock: string; green: string
}): ReactNode {
  const h = baseY - apexY
  const pts: Pt[] = [
    [cx - width / 2, baseY],
    [cx - width * 0.4 + r.jitter(8), baseY - h * 0.3],
    [cx - width * 0.18 + r.jitter(6), baseY - h * 0.58],
    [cx - width * 0.05 + r.jitter(5), baseY - h * 0.84],
    [cx + r.jitter(4), apexY],
    [cx + width * 0.07 + r.jitter(5), baseY - h * 0.82],
    [cx + width * 0.22 + r.jitter(6), baseY - h * 0.52],
    [cx + width * 0.42 + r.jitter(8), baseY - h * 0.26],
    [cx + width / 2, baseY],
  ]
  const skirt: Pt[] = [...pts, [cx + width / 2, baseY + 50], [cx - width / 2, baseY + 50]]
  return (
    <g>
      <Wash d={smooth(skirt, true)} color={green} opacity={0.5} />
      <path d={blob(r.fork('cap'), cx + width * 0.02, apexY + h * 0.15, width * 0.2, h * 0.16, 7, 0.28)}
        fill={rock} opacity={0.42} />
      <Ink pts={pts} r={r.fork('outline')} width={2.6} opacity={0.52} />
      {/* fluted rock striations climbing the near-vertical face */}
      <g stroke={rock} strokeWidth={1.6} opacity={0.28} strokeLinecap="round" fill="none">
        {Array.from({ length: 6 }, (_, i) => {
          const t = (i + 0.5) / 6
          const x0 = cx - width * 0.3 + t * width * 0.6 + r.jitter(6)
          const y0 = baseY - h * 0.08
          const y1 = apexY + h * (0.32 + r.range(0, 0.18))
          return <path key={i} d={`M ${x0} ${y0} Q ${x0 + r.jitter(12)} ${(y0 + y1) / 2} ${cx + (x0 - cx) * 0.35} ${y1}`} />
        })}
      </g>
      {/* the cloud collar that almost always wraps this peak's mid-flank */}
      <g opacity={0.5}>
        {Array.from({ length: 3 }, (_, i) => (
          <path key={i} d={blob(r.fork('collar' + i), cx + (i - 1) * width * 0.26, baseY - h * 0.4 + r.jitter(12), width * 0.24, h * 0.06, 7, 0.3)}
            fill={P.paper} opacity={0.42} />
        ))}
      </g>
    </g>
  )
}

/** Rows of low, roofless stone-walled rooms stepping down the ridge — the
 *  actual ruins. Each wall gets one trapezoidal opening, wider at the sill
 *  than at the lintel: every real doorway and niche at Machu Picchu narrows
 *  toward the top, which is the one detail that separates this from "some
 *  old rectangles" and makes it read as specifically Inca stonework. */
function MachuPicchuRuinWalls({ r, rows, stone, shadow, doorway }: {
  r: Rng
  rows: { x1: number; x2: number; y: number; wallH: number; n: number }[]
  stone: string; shadow: string; doorway: string
}): ReactNode {
  return (
    <g>
      {rows.map((row, ri) => {
        const rr = r.fork('row' + ri)
        return (
          <g key={ri}>
            {Array.from({ length: row.n }, (_, i) => {
              const wr = rr.fork('w' + i)
              const bw = ((row.x2 - row.x1) / row.n) * wr.range(0.68, 1.02)
              const bx = row.x1 + (i / row.n) * (row.x2 - row.x1) + wr.jitter(8)
              const wallH = row.wallH * wr.range(0.75, 1.15)
              const topY = row.y - wallH
              const pts: Pt[] = [[bx, row.y], [bx + wr.jitter(3), topY], [bx + bw + wr.jitter(3), topY + wr.jitter(4)], [bx + bw, row.y]]
              const doorW = Math.min(bw * 0.3, 26)
              const doorX = bx + bw * wr.range(0.32, 0.5)
              const shrink = doorW * 0.16
              const lintelY = topY + wallH * 0.15
              return (
                <g key={i}>
                  <Wash d={smooth(pts, true)} color={stone} opacity={0.52} />
                  <Ink pts={pts} r={wr} width={2} opacity={0.5} color={shadow} />
                  <path d={`M ${doorX} ${row.y} L ${doorX + doorW} ${row.y} L ${doorX + doorW - shrink} ${lintelY} L ${doorX + shrink} ${lintelY} Z`}
                    fill={doorway} opacity={0.4} />
                </g>
              )
            })}
          </g>
        )
      })}
    </g>
  )
}

/** The Torreón — Machu Picchu's one famous curved wall (the Temple of the
 *  Sun), tucked among the ruin's otherwise square rooms. Every other wall
 *  in the whole cluster is straight-sided; this single deliberate curve is
 *  what a well-informed eye actually looks for first. */
function MachuPicchuTorreon({ r, cx, cy, rx, ry, stone, shadow }: {
  r: Rng; cx: number; cy: number; rx: number; ry: number; stone: string; shadow: string
}): ReactNode {
  const arc: Pt[] = Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI * (1 - i / 7)
    return [cx + Math.cos(a) * rx + r.jitter(2), cy - Math.sin(a) * ry + r.jitter(2)] as Pt
  })
  const wall: Pt[] = [...arc, [cx + rx, cy + ry * 0.7], [cx - rx, cy + ry * 0.7]]
  return (
    <g>
      <Wash d={smooth(wall, true)} color={stone} opacity={0.5} />
      <Ink pts={arc} r={r.fork('outline')} width={2.2} opacity={0.5} color={shadow} />
      <g stroke={shadow} strokeWidth={1.2} opacity={0.22}>
        {Array.from({ length: 4 }, (_, i) => {
          const a = Math.PI * (0.15 + i * 0.23)
          return <path key={i} d={`M ${cx + Math.cos(a) * rx * 0.5} ${cy - Math.sin(a) * ry * 0.5 + ry * 0.5} L ${cx + Math.cos(a) * rx} ${cy - Math.sin(a) * ry}`} />
        })}
      </g>
    </g>
  )
}

/** A grazing llama — the terraces at Machu Picchu are still cropped by
 *  llama herds today, and one small silhouette does more to say "this is
 *  specifically Machu Picchu" than another stone wall would. */
function MachuPicchuLlama({ r, x, y, scale, color }: {
  r: Rng; x: number; y: number; scale: number; color: string
}): ReactNode {
  const bodyPts: Pt[] = [[-22, 6], [-18, -10], [-4, -16], [10, -14], [20, -4], [16, 8], [-6, 10]]
  const neckPts: Pt[] = [[10, -12], [16, -30], [14, -46], [8, -54]]
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d={smooth(bodyPts, true)} fill={color} opacity={0.5} />
      <Ink pts={neckPts} r={r.fork('neck')} width={5} opacity={0.5} color={color} />
      <path d="M 6 -54 L 2 -62 M 12 -55 L 16 -63" stroke={color} strokeWidth={2.4} opacity={0.5} strokeLinecap="round" />
      <path d="M -16 6 L -18 22 M -2 8 L -3 24 M 8 6 L 10 22 M 16 2 L 19 18" stroke={color} strokeWidth={3} opacity={0.48} strokeLinecap="round" />
    </g>
  )
}

// ---- kyoto ----
/**
 * One myōjin-style torii — two tapered posts, a curved kasagi beam with
 * upturned ends riding above a straight shimaki, a small dark hanging
 * plaque, and a straight nuki tying the posts together. This double-beam
 * silhouette (not a single crossbar) is what actually reads as "torii"
 * rather than "goalpost" — Fushimi Inari's whole tunnel is built from
 * exactly this shape, repeated smaller and smaller into the distance.
 * `detail` drops the plaque/shimaki/base-band on gates too small and far
 * away to read them anyway.
 */
function KyotoToriiGate({ r, cx, groundY, topY, halfW, overhang, postW, color, capColor, detail }: {
  r: Rng; cx: number; groundY: number; topY: number; halfW: number; overhang: number; postW: number
  color: string; capColor: string; detail: boolean
}) {
  const h = groundY - topY
  const lx = cx - halfW, rx = cx + halfW
  const flare = postW * 0.4
  const leftPost: Pt[] = [[lx - postW / 2 - flare, groundY], [lx - postW / 2, topY], [lx + postW / 2, topY], [lx + postW / 2 + flare, groundY]]
  const rightPost: Pt[] = [[rx - postW / 2 - flare, groundY], [rx - postW / 2, topY], [rx + postW / 2, topY], [rx + postW / 2 + flare, groundY]]
  const kasagiY = topY - h * 0.03
  const kasagiPts: Pt[] = [
    [lx - overhang, kasagiY - h * 0.05],
    [lx - overhang * 0.35, kasagiY + h * 0.015],
    [cx, kasagiY + h * 0.01],
    [rx + overhang * 0.35, kasagiY + h * 0.015],
    [rx + overhang, kasagiY - h * 0.05],
  ]
  const shimakiY = kasagiY + h * 0.055
  const shimakiOverhang = overhang * 0.5
  const shimakiPts: Pt[] = [[lx - shimakiOverhang, shimakiY], [cx, shimakiY + h * 0.006], [rx + shimakiOverhang, shimakiY]]
  const nukiY = topY + h * 0.17
  const nukiPts: Pt[] = [[lx, nukiY], [cx, nukiY + h * 0.01], [rx, nukiY]]
  const beamW = Math.max(1.6, h * 0.018)
  return (
    <g>
      <Wash d={smooth(leftPost, true)} color={color} opacity={0.6} rim={false} />
      <Wash d={smooth(rightPost, true)} color={color} opacity={0.6} rim={false} />
      <Ink pts={leftPost} close r={r.fork('lp')} width={Math.max(1.2, postW * 0.05)} opacity={0.4} color={capColor} />
      <Ink pts={rightPost} close r={r.fork('rp')} width={Math.max(1.2, postW * 0.05)} opacity={0.4} color={capColor} />
      {detail && (
        <g fill={capColor} opacity={0.5}>
          <rect x={lx - postW * 0.75} y={groundY - h * 0.12} width={postW * 1.5} height={h * 0.045} />
          <rect x={rx - postW * 0.75} y={groundY - h * 0.12} width={postW * 1.5} height={h * 0.045} />
        </g>
      )}
      <path d={smooth(nukiPts)} stroke={color} strokeWidth={beamW} fill="none" strokeLinecap="round" opacity={0.6} />
      {detail && (
        <rect x={cx - postW * 0.55} y={nukiY - h * 0.015} width={postW * 1.1} height={h * 0.09} fill={capColor} opacity={0.55} />
      )}
      {detail && (
        <path d={smooth(shimakiPts)} stroke={color} strokeWidth={beamW * 1.15} fill="none" strokeLinecap="round" opacity={0.58} />
      )}
      <path d={smooth(kasagiPts)} stroke={color} strokeWidth={beamW * 1.5} fill="none" strokeLinecap="round" opacity={0.68} />
      <Ink pts={kasagiPts} r={r.fork('kasagi')} width={1.6} opacity={0.3} color={capColor} />
    </g>
  )
}

/**
 * A distant five-tier pagoda silhouette rising right at the torii tunnel's
 * vanishing point — Tō-ji's five-story pagoda is the reference, Kyoto's
 * own skyline signature. Kept flat and hazy, no ink outline, the same
 * treatment as FarSkyline: it only needs to read as a shape glimpsed
 * above the smallest gates, not as a rendered building.
 */
function KyotoPagodaSilhouette({ cx, baseY, h, color }: { cx: number; baseY: number; h: number; color: string }) {
  const tiers = 5
  const tierH = h * 0.15
  const baseW = h * 0.5
  const topTierY = baseY - (tiers - 1) * tierH * 0.86
  return (
    <g fill={color}>
      {Array.from({ length: tiers }, (_, i) => {
        const w = baseW * (1 - (i / (tiers - 1)) * 0.55)
        const y = baseY - i * tierH * 0.86
        const eave = w * 0.16
        const pts: Pt[] = [
          [cx - w / 2 - eave, y + tierH * 0.32],
          [cx - w / 2, y],
          [cx + w / 2, y],
          [cx + w / 2 + eave, y + tierH * 0.32],
          [cx + w / 2 + eave * 0.6, y + tierH * 0.62],
          [cx - w / 2 - eave * 0.6, y + tierH * 0.62],
        ]
        return <path key={i} d={smooth(pts, true)} opacity={0.44 - i * 0.02} />
      })}
      <path d={`M ${cx} ${topTierY} L ${cx} ${topTierY - h * 0.22}`} stroke={color} strokeWidth={3} opacity={0.4} />
      <circle cx={cx} cy={topTierY - h * 0.24} r={5} opacity={0.42} />
    </g>
  )
}

// ---- northern-lights ----
/** One sweeping curtain of aurora light — several overlapping translucent
 *  washes between a wavering top and bottom edge (never a flat solid
 *  shape), plus a scatter of thin vertical rays for the curtain's
 *  characteristic striations, so it reads as *glowing atmosphere* rather
 *  than a painted stripe. */
function AuroraCurtain({ r, y, x1 = -60, x2 = W + 60, height, colors, tilt = 0 }: {
  r: Rng; y: number; x1?: number; x2?: number; height: number; colors: string[]; tilt?: number
}) {
  const top = ridge(r.fork('top'), x1, x2, y, height * 0.22, 9)
  const mid = ridge(r.fork('mid'), x1, x2, y + height * 0.5 + tilt, height * 0.36, 9)
  const bot = ridge(r.fork('bot'), x1, x2, y + height + tilt * 1.6, height * 0.3, 9)
  const bodyD = smooth([...top, ...[...mid].reverse()] as Pt[], true)
  const lowerD = smooth([...mid, ...[...bot].reverse()] as Pt[], true)
  const cx = (x1 + x2) / 2
  return (
    <g>
      <ellipse cx={cx} cy={y + height * 0.4} rx={(x2 - x1) * 0.32} ry={height * 0.6}
        fill={colors[0]} opacity={0.1} filter="url(#glow)" />
      {colors.map((c, i) => (
        <g key={i}>
          <path d={bodyD} fill={c} opacity={0.17 - i * 0.03} transform={`translate(${i * 6} ${i * 10})`} />
          <path d={lowerD} fill={c} opacity={0.11 - i * 0.02} transform={`translate(${-i * 6} ${i * 14})`} />
        </g>
      ))}
      <g stroke={colors[0]} fill="none" strokeLinecap="round" opacity={0.5}>
        {Array.from({ length: 16 }, (_, i) => {
          const rr = r.fork('ray' + i)
          const t = i / 15
          const x = x1 + t * (x2 - x1) + rr.jitter(14)
          const topY = y + Math.sin(t * Math.PI * 3 + rr()) * height * 0.14
          const len = height * rr.range(0.7, 1.5)
          return (
            <path key={i} d={`M ${x} ${topY} L ${x + rr.jitter(20)} ${topY + len}`}
              strokeWidth={rr.range(2, 5)} opacity={rr.range(0.08, 0.26)} />
          )
        })}
      </g>
    </g>
  )
}

/** A single snow-dusted fir at the fjord's edge — three stacked wobbly
 *  tiers on a short dark trunk. The one unmistakably Nordic silhouette
 *  that tells the foreground bank apart from "just a hill." */
function FjordFir({ r, x, baseY, h, color }: { r: Rng; x: number; baseY: number; h: number; color: string }) {
  const trunkH = h * 0.12
  return (
    <g>
      <path d={`M ${x - 2} ${baseY} L ${x + 2} ${baseY} L ${x + 1.4} ${baseY - trunkH} L ${x - 1.4} ${baseY - trunkH} Z`}
        fill={color} opacity={0.5} />
      {[0, 1, 2].map((i) => {
        const t = i / 2
        const tw = h * (0.32 - t * 0.16)
        const tipY = baseY - trunkH - t * h * 0.55
        const tierBaseY = tipY + h * 0.32
        const pts: Pt[] = [[x - tw, tierBaseY], [x + r.jitter(2), tipY], [x + tw, tierBaseY]]
        return (
          <g key={i}>
            <path d={smooth(pts, true)} fill={color} opacity={0.44 + i * 0.04} />
            <path d={`M ${x - tw * 0.5} ${tierBaseY - h * 0.02} L ${x} ${tipY + h * 0.06} L ${x + tw * 0.5} ${tierBaseY - h * 0.02}`}
              stroke={P.paper} strokeWidth={1.6} opacity={0.3} fill="none" strokeLinecap="round" />
          </g>
        )
      })}
    </g>
  )
}

const NORTHERN_LIGHTS_GREEN = '#8FBFA0'
const NORTHERN_LIGHTS_VIOLET = '#9B84B0'

// ---- moon ----
/** One lunar crater — a raised rim, a shadowed bowl, and a hard, unfiltered
 *  cast shadow that always falls toward the same corner (a single fixed
 *  "sun" direction shared by every crater in the scene, so the whole
 *  surface reads as lit by one real light rather than each shape shaded on
 *  its own logic). Unlike almost everything else in this app, the shadow
 *  and highlight here skip Wash's soft rim-darkening and any blur filter —
 *  there is no air on the Moon to soften an edge, so the paint itself has
 *  to stay flat and crisp where the rest of the world gets to bleed. */
function MoonCrater({ r, cx, cy, rx, ry, rim, shadow = P.ink, light = P.cream }: {
  r: Rng; cx: number; cy: number; rx: number; ry: number; rim: string; shadow?: string; light?: string
}) {
  const rimPts: Pt[] = Array.from({ length: 11 }, (_, i) => {
    const a = (i / 11) * Math.PI * 2 + r.jitter(0.12)
    const k = 1 + r.jitter(0.13)
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as Pt
  })
  return (
    <g>
      <path d={smooth(rimPts, true)} fill={rim} opacity={0.4} />
      <path d={blob(r.fork('bowl'), cx + rx * 0.06, cy + ry * 0.08, rx * 0.72, ry * 0.68, 9, 0.14)} fill={shadow} opacity={0.3} />
      <path d={blob(r.fork('wedge'), cx + rx * 0.3, cy + ry * 0.32, rx * 0.48, ry * 0.44, 8, 0.12)} fill={shadow} opacity={0.4} />
      <path d={blob(r.fork('lit'), cx - rx * 0.34, cy - ry * 0.36, rx * 0.26, ry * 0.2, 7, 0.16)} fill={light} opacity={0.46} />
      <Ink pts={rimPts} close r={r.fork('ink')} width={2} opacity={0.4} color={P.ink} />
    </g>
  )
}

/** Earth itself, small and still in the black — the one detail that says
 *  "the Moon" and not just "any airless rock in space": an ocean-blue
 *  disc, a handful of soft continents, thin cloud-swirl strokes, and a
 *  faint limb-glow. Lit from the same upper-left "sun" as every crater
 *  below, so the light in the sky and the light on the ground agree. */
function MoonEarthGlobe({ r, cx, cy, rad }: { r: Rng; cx: number; cy: number; rad: number }) {
  const bodyPts: Pt[] = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad] as Pt
  })
  const continents = Array.from({ length: 5 }, (_, i) => {
    const lr = r.fork('land' + i)
    const ang = lr.range(0, Math.PI * 2)
    const dist = lr.range(0.05, 0.4) * rad
    return { x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist, rx: lr.range(0.14, 0.22) * rad, ry: lr.range(0.09, 0.15) * rad }
  })
  return (
    <g>
      <circle cx={cx} cy={cy} r={rad * 1.3} fill={P.blue} opacity={0.14} filter="url(#glow)" />
      <path d={smooth(bodyPts, true)} fill={P.blue} opacity={0.6} />
      {continents.map((c, i) => (
        <path key={i} d={blob(r.fork('mass' + i), c.x, c.y, c.rx, c.ry, 7, 0.22)} fill={P.moss} opacity={0.58} />
      ))}
      <g stroke={P.paper} strokeWidth={rad * 0.05} fill="none" strokeLinecap="round" opacity={0.48}>
        {Array.from({ length: 3 }, (_, i) => {
          const sr = r.fork('swirl' + i)
          const a0 = sr.range(0, Math.PI * 2)
          const pts: Pt[] = Array.from({ length: 4 }, (_, k) => {
            const a = a0 + k * 0.6
            const d = rad * (0.12 + k * 0.11)
            return [cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.75] as Pt
          })
          return <path key={i} d={smooth(pts)} />
        })}
      </g>
      <path d={blob(r.fork('rimlight'), cx - rad * 0.5, cy - rad * 0.5, rad * 0.34, rad * 0.3, 7, 0.18)} fill={P.paper} opacity={0.16} />
      <Ink pts={bodyPts} close r={r.fork('outline')} width={1.8} opacity={0.42} color={P.indigo} />
    </g>
  )
}

// ---- mars ----
/** Dusty butterscotch-pink haze — the colour Martian daytime sky actually
 *  is, from sunlight scattering off suspended dust, not the black-space
 *  postcard cliché. */
const MARS_HAZE = '#E0A98A'
/** Deep, desaturated rust-brown for rock and mesa shadow — duller than any
 *  existing red in the box, the way real oxidised iron dust reads under
 *  a dust-filtered sun rather than a clean vermilion. */
const MARS_RUST = '#8B4630'

/** One of Mars's two small, lumpy, potato-shaped moons — Phobos (bigger,
 *  closer, dominated by the huge Stickney impact crater) or Deimos
 *  (smaller, fainter, farther out). Neither is round: real moons this
 *  small never relax into a sphere. A single moon in the sky could belong
 *  to any world; a PAIR of tiny irregular ones together belongs to Mars
 *  alone. */
function MarsMoon({ r, cx, cy, radius, color, opacity = 0.6, bigCrater = false }: {
  r: Rng; cx: number; cy: number; radius: number; color: string; opacity?: number; bigCrater?: boolean
}) {
  const mr = r.fork('moon')
  const body = blob(mr, cx, cy, radius, radius * 0.84, 9, 0.26)
  const craterN = mr.int(3, 5)
  return (
    <g>
      <path d={body} fill={color} opacity={opacity} />
      <path d={body} fill="none" stroke={P.ink} strokeWidth={1.4} opacity={opacity * 0.5} />
      <path d={blob(mr.fork('shade'), cx + radius * 0.32, cy + radius * 0.18, radius * 0.62, radius * 0.5, 7, 0.3)}
        fill={P.ink} opacity={0.14} />
      {Array.from({ length: craterN }, (_, i) => {
        const cr = mr.fork('crater' + i)
        const a = cr() * Math.PI * 2
        const dist = cr.range(0.15, 0.65) * radius
        const size = cr.range(radius * 0.08, radius * 0.16)
        return <circle key={i} cx={cx + Math.cos(a) * dist} cy={cy + Math.sin(a) * dist * 0.84} r={size} fill={P.ink} opacity={0.16} />
      })}
      {bigCrater && (
        <g>
          <circle cx={cx - radius * 0.38} cy={cy - radius * 0.22} r={radius * 0.4} fill={P.ink} opacity={0.16} />
          <circle cx={cx - radius * 0.38} cy={cy - radius * 0.22} r={radius * 0.4} fill="none" stroke={P.ink} strokeWidth={1.2} opacity={0.32} />
        </g>
      )}
    </g>
  )
}

/** A row of layered, flat-topped mesas on the horizon, each banded with
 *  horizontal strata — the eroded tablelands (Mount Sharp, the Valles
 *  Marineris walls) every rover panorama shows. It's the banding read
 *  against the dust-pink sky, not the silhouette alone, that keeps this
 *  from reading as an Arizona canyon. */
function MarsMesaRidge({ r, y, color, bandColor }: { r: Rng; y: number; color: string; bandColor: string }) {
  const buttes = 4
  return (
    <g>
      {Array.from({ length: buttes }, (_, i) => {
        const br = r.fork('butte' + i)
        const cx = -60 + ((i + 0.5) / buttes) * (W + 120) + br.jitter(50)
        const bw = br.range(180, 320)
        const bh = br.range(90, 190)
        const top = y - bh
        const pts: Pt[] = [
          [cx - bw / 2, y],
          [cx - bw / 2 + br.jitter(10), top + br.range(10, 30)],
          [cx - bw * 0.3, top + br.jitter(8)],
          [cx + bw * 0.1, top - br.range(0, 14)],
          [cx + bw * 0.35, top + br.jitter(10)],
          [cx + bw / 2 - br.jitter(10), top + br.range(14, 34)],
          [cx + bw / 2, y],
        ]
        const bandCount = br.int(3, 5)
        return (
          <g key={i}>
            <Wash d={smooth([...pts, [cx + bw / 2, y + 40], [cx - bw / 2, y + 40]] as Pt[], true)} color={color} opacity={0.4} />
            <g stroke={bandColor} strokeWidth={1.6} opacity={0.38} fill="none">
              {Array.from({ length: bandCount }, (_, k) => {
                const t = (k + 1) / (bandCount + 1)
                const by = top + (y - top) * t
                const half = (bw / 2) * (0.6 + t * 0.4)
                return <path key={k} d={smooth(ridge(br.fork('band' + k), cx - half, cx + half, by, 4, 4))} />
              })}
            </g>
            <Ink pts={pts} r={br.fork('ink')} width={2} opacity={0.4} color={P.ink} />
          </g>
        )
      })}
    </g>
  )
}

// ---- saturn-rings ----
/**
 * One arc of a tilted ellipse, angle running the usual cos/sin way — the
 * geometry both the ring bands and the shadow the rings throw across the
 * globe are built from. 0°→180° is the lower/near half of the ellipse
 * (drawn in FRONT of the sphere); 180°→360° is the upper/far half (drawn
 * BEHIND it, tucked under the sphere's own fill).
 */
function saturnRingArc(
  r: Rng, cx: number, cy: number, rx: number, ry: number,
  aFromDeg: number, aToDeg: number, steps = 14,
): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = ((aFromDeg + (aToDeg - aFromDeg) * t) * Math.PI) / 180
    pts.push([
      cx + Math.cos(a) * rx + r.jitter(rx * 0.012),
      cy + Math.sin(a) * ry + r.jitter(ry * 0.035),
    ])
  }
  return pts
}

/**
 * A jagged standing rock on the moon's own surface — sharp alternating
 * peaks, never a smooth dome, plus a couple of pale ice-glint scratches on
 * the faces that catch Saturn's light.
 */
function SaturnMoonBoulder({ r, x, baseY, w, h, color }: {
  r: Rng; x: number; baseY: number; w: number; h: number; color: string
}) {
  const br = r.fork('rock')
  const n = 5
  const peaks: Pt[] = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    const tall = i % 2 === 0
    const py = baseY - h * (tall ? br.range(0.55, 0.85) : br.range(0.12, 0.32))
    return [x - w / 2 + t * w + br.jitter(10), py + br.jitter(10)] as Pt
  })
  const outline: Pt[] = [[x - w / 2 - 8, baseY + 12], ...peaks, [x + w / 2 + 8, baseY + 12]]
  return (
    <g>
      <Wash d={smooth(outline, true)} color={color} opacity={0.56} />
      <Ink pts={outline} close r={br.fork('ink')} width={2.4} opacity={0.54} color={P.ink} />
      <g stroke={P.paper} strokeWidth={2} opacity={0.4} strokeLinecap="round">
        {peaks.filter((_, i) => i % 2 === 0).map(([px, py], i) => (
          <path key={i} d={`M ${px - 8} ${py + 14} L ${px + 5} ${py - 2}`} />
        ))}
      </g>
    </g>
  )
}

/**
 * A shallow, rimmed impact crater — the one ground detail an airless world
 * has that no terrestrial "Ground" plane needs.
 */
function SaturnMoonCrater({ r, cx, cy, rad, color }: {
  r: Rng; cx: number; cy: number; rad: number; color: string
}) {
  const cr = r.fork('crater')
  const rim: Pt[] = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.55] as Pt
  })
  return (
    <g>
      <path d={blob(cr, cx, cy, rad, rad * 0.55, 8, 0.16)} fill={color} opacity={0.36} />
      <Ink pts={rim} close r={cr.fork('rim')} width={1.5} opacity={0.4} color={P.ink} />
      <path
        d={`M ${cx - rad * 0.4} ${cy + rad * 0.12} Q ${cx} ${cy - rad * 0.18} ${cx + rad * 0.38} ${cy + rad * 0.16}`}
        stroke={P.paper} strokeWidth={1.5} opacity={0.36} fill="none" strokeLinecap="round"
      />
    </g>
  )
}

// ---- nebula ----
/** One glowing lobe of nebula gas — a cluster of soft overlapping blobs
 *  plus a denser core, so a colour reads as luminous gas pooling outward
 *  rather than a single flat cloud shape. Several of these, in different
 *  jewel tones, overlapping, are what the whole nebula body is built from. */
function NebulaBillow({ r, cx, cy, rx, ry, color, opacity = 0.32, puffs = 7 }: {
  r: Rng; cx: number; cy: number; rx: number; ry: number; color: string; opacity?: number; puffs?: number
}) {
  return (
    <g>
      {Array.from({ length: puffs }, (_, i) => {
        const pr = r.fork('puff' + i)
        const a = (i / puffs) * Math.PI * 2 + pr.jitter(0.7)
        const dist = pr.range(0.2, 0.8)
        const px = cx + Math.cos(a) * rx * dist
        const py = cy + Math.sin(a) * ry * dist
        const s = pr.range(0.5, 1.1)
        return (
          <path key={i} d={blob(pr.fork('shape'), px, py, rx * 0.5 * s, ry * 0.46 * s, 9, 0.42)}
            fill={color} opacity={opacity * pr.range(0.65, 1.2)} />
        )
      })}
      <path d={blob(r.fork('core'), cx, cy, rx * 0.42, ry * 0.4, 9, 0.3)} fill={color} opacity={Math.min(0.6, opacity + 0.24)} />
    </g>
  )
}

/** A dark rocky planetoid silhouetted against the glow behind it — a
 *  foreground scale cue. A thin lit rim (the nebula's own light catching
 *  its near edge) keeps it from reading as a flat hole punched in the
 *  painting; `rimStart`/`rimSweep` aim that rim at wherever the glow
 *  actually sits, so the light direction reads as real rather than generic. */
function NebulaAsteroid({ r, cx, cy, rx, ry, rim, rimStart = -0.6 * Math.PI, rimSweep = 0.6 * Math.PI }: {
  r: Rng; cx: number; cy: number; rx: number; ry: number; rim: string; rimStart?: number; rimSweep?: number
}) {
  const body = blob(r.fork('rock'), cx, cy, rx, ry, 10, 0.24)
  const rimPts: Pt[] = Array.from({ length: 7 }, (_, i) => {
    const a = rimStart + (i / 6) * rimSweep
    return [cx + Math.cos(a) * rx * 1.03, cy + Math.sin(a) * ry * 1.03] as Pt
  })
  return (
    <g>
      <path d={body} fill="#14131E" opacity={0.95} />
      {Array.from({ length: 4 }, (_, i) => {
        const cr = r.fork('crater' + i)
        const a = cr() * Math.PI * 2
        const d = cr.range(0.12, 0.55)
        return (
          <path key={i}
            d={blob(cr.fork('shape'), cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d,
              rx * cr.range(0.07, 0.15), ry * cr.range(0.07, 0.15), 7, 0.3)}
            fill="#0B0A12" opacity={0.5} />
        )
      })}
      <Ink pts={rimPts} r={r.fork('rim')} width={2.4} opacity={0.5} color={rim} />
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
  make('eiffel-tower', 'Eiffel Tower', 'Paris, seen across the rooftops',
    [P.amber, P.rose, P.inkSoft],
    { terrain: ['urban', 'river'], timeOfDay: ['golden', 'dusk'], mood: ['grand', 'nostalgic', 'dramatic'], intensity: 3, tags: ['paris', 'eiffel-tower', 'landmark', 'iconic', 'skyline', 'mansard', 'seine', 'golden-hour'] },
    (r) => {
      const sky = 970
      const towerCx = 500, towerBaseY = 1090, towerTopY = 246, towerHalfW = 150
      return (
        <g>
          <SkyGrad bands={[
            [P.amber, sky, 0.24],
            [P.cream, sky - 220, 0.22],
            [P.rose, sky - 420, 0.2],
            [P.marigold, sky - 640, 0.14],
          ]} />
          {/* a low sun off to one side, so the tower reads dark against the brightest sky */}
          <circle cx={640} cy={720} r={70} fill={P.marigold} opacity={0.22} filter="url(#glow)" />
          <circle cx={640} cy={720} r={30} fill={P.cream} opacity={0.4} filter="url(#glow-tight)" />
          <FarSkyline xs={[60, 170, 780, 900, 990]} y={sky} color={P.rose} opacity={0.2} />
          <Mist r={r.fork('haze')} y={sky - 10} h={90} opacity={0.28} color={P.cream} />

          <EiffelTowerLattice r={r.fork('eiffel')} cx={towerCx} baseY={towerBaseY} topY={towerTopY} baseHalfW={towerHalfW} />

          <EiffelMansardRow r={r.fork('left')} x1={-60} x2={320} baseY={1180} n={5} wallColor={P.cream} roofColor={P.slate} windowColor={P.amber} />
          <EiffelMansardRow r={r.fork('right')} x1={680} x2={1060} baseY={1180} n={5} wallColor={P.paperDeep} roofColor={P.indigo} windowColor={P.amber} />

          {/* the stone quai along the Seine, full width, with a grassy break at the Tower's feet */}
          <Wash d="M -40 1180 L 1040 1180 L 1040 1270 L -40 1270 Z" color={P.paperDeep} opacity={0.32} rim={false} />
          <Wash d="M 320 1090 L 680 1090 L 680 1225 L 320 1225 Z" color={P.moss} opacity={0.3} rim={false} />
          {[380, 620].map((x, i) => (
            <g key={i}>
              <path d={`M ${x} 1205 L ${x} 1112`} stroke={P.inkSoft} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
              <path d={blob(r.fork('lamp' + i), x, 1100, 10, 12, 7, 0.2)} fill={P.marigold} opacity={0.5} />
              <circle cx={x} cy={1100} r={16} fill={P.marigold} opacity={0.22} filter="url(#glow)" />
            </g>
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <path key={i} d={blob(r.fork('hedge' + i), 340 + i * 110, 1215, 34, 18, 7, 0.24)} fill={P.green} opacity={0.36} />
          ))}

          {/* the Seine, foreground, with a hint of a stone bridge entering from the left */}
          <Water r={r.fork('seine')} y={1240} color={P.blue} glint={P.cream} />
          <Wash d="M 30 1232 L 430 1224 L 430 1260 L 30 1272 Z" color={P.earth} opacity={0.4} />
          {Array.from({ length: 3 }, (_, i) => {
            const aw = 400 / 3, ax = 30 + i * aw + aw * 0.16, ar = aw * 0.32
            return <ellipse key={i} cx={ax + ar} cy={1250} rx={ar} ry={ar * 0.68} fill={P.blue} opacity={0.5} />
          })}
          <Ink pts={[[30, 1234], [230, 1228], [430, 1224]]} r={r.fork('bridgeink')} width={2} opacity={0.38} color={P.inkSoft} />

          {[[590, 380], [660, 420], [430, 340]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(0.85)`}>{Bird(r.fork('ebird' + i), P.inkSoft)}</g>
          ))}

          <Specks r={r.fork('sp')} box={{ x: 0, y: 900, w: 1000, h: 500 }} n={26} color={P.earth} size={3} opacity={0.14} />
        </g>
      )
    }),

  make('venice', 'Venice Canals', 'Gondolas beneath a bridge of stone',
    [P.terracotta, P.teal, P.rose],
    { terrain: ['river', 'urban'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['grand', 'nostalgic', 'serene'], intensity: 4, tags: ['venice', 'canal', 'gondola', 'bridge', 'water', 'reflection', 'italy', 'pastel', 'stone', 'romantic'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.amber, 700, 0.24], [P.cream, 520, 0.2], [P.paper, 320, 0.14]]} />
        <circle cx={800} cy={190} r={44} fill={P.cream} opacity={0.26} filter="url(#glow)" />
        <FarSkyline xs={[420, 460, 500, 540, 580]} y={678} color={P.slate} opacity={0.22} />
        <Mist r={r.fork('haze')} y={660} h={90} color={P.cream} opacity={0.3} />

        <Water r={r.fork('water')} y={700} color={P.teal} glint={P.cream} />

        <VeniceBridge r={r.fork('bridge')} cx={500} waterY={700} span={130} rise={140} />

        <VeniceFacade r={r.fork('lFar')} x={290} w={95} baseY={705} topY={650} color={P.clay} shutter={P.teal} />
        <VeniceFacade r={r.fork('rFar')} x={615} w={95} baseY={705} topY={650} color={P.cream} shutter={P.moss} />
        <VeniceFacade r={r.fork('lMid')} x={140} w={170} baseY={1160} topY={880} color={P.rose} shutter={P.moss} />
        <VeniceFacade r={r.fork('rMid')} x={690} w={170} baseY={1160} topY={880} color={P.paperDeep} shutter={P.teal} />
        <VeniceFacade r={r.fork('lNear')} x={10} w={250} baseY={1500} topY={1030} color={P.terracotta} shutter={P.teal} chimney />
        <VeniceFacade r={r.fork('rNear')} x={740} w={250} baseY={1500} topY={1030} color={P.clay} shutter={P.earth} chimney />

        <Reflection r={r.fork('rfBridge')} x={400} y={705} w={200} h={260} color={P.paperDeep} opacity={0.28} />
        <Reflection r={r.fork('rfLeft')} x={280} y={1180} w={180} h={260} color={P.terracotta} opacity={0.26} />
        <Reflection r={r.fork('rfRight')} x={560} y={1180} w={180} h={260} color={P.clay} opacity={0.26} />

        <VeniceMooringPole r={r.fork('poleL')} x={250} y={1300} h={110} />
        <VeniceMooringPole r={r.fork('poleR')} x={720} y={1300} h={110} stripe={P.vermilion} />
        <VeniceMooringPole r={r.fork('poleMid')} x={420} y={900} h={80} />

        <VeniceGondola r={r.fork('gondola1')} x={430} y={1250} scale={1.15} />
        <VeniceGondola r={r.fork('gondola2')} x={560} y={820} scale={0.6} />

        {[[200, 220], [780, 260]].map(([bx, by], i) => (
          <g key={i} transform={`translate(${bx} ${by}) scale(0.8)`}>{Bird(r.fork('vbird' + i), P.inkSoft)}</g>
        ))}

        <Specks r={r.fork('sp1')} box={{ x: 40, y: 550, w: 920, h: 850 }} n={24} color={P.earth} size={4} opacity={0.14} />
        <Specks r={r.fork('sp2')} box={{ x: 260, y: 900, w: 480, h: 500 }} n={16} color={P.paper} size={3} opacity={0.2} />
      </g>
    )),

  make('great-wall', 'The Great Wall', 'Stone and watchtowers over the ridgeline',
    [P.slate, P.earth, P.moss],
    { terrain: ['mountain'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['grand', 'mystic', 'dramatic'], intensity: 3, tags: ['wall', 'stone', 'watchtower', 'fortress', 'ridge', 'mountain', 'mist', 'autumn', 'ancient', 'china'] },
    (r) => {
      const farPts = ridge(r.fork('farRidge'), 60, 940, 750, 22, 9)
      const heroPts = ridge(r.fork('heroRidge'), -40, 1040, 830, 36, 13)
      return (
        <g>
          <SkyGrad bands={[[P.amber, 820, 0.16], [P.cream, 600, 0.24], [P.slate, 380, 0.14]]} />
          <Peaks r={r.fork('farpeaks')} y={680} colors={[P.slate, P.violet]} />
          <Mist r={r.fork('mfar')} y={650} opacity={0.5} />

          <g opacity={0.6}>
            <Wash d={smooth([...farPts, [940, 890], [60, 890]] as Pt[], true)} color={P.slate} opacity={0.32} />
            <GreatWallRampart r={r.fork('farWall')} pts={farPts} thickness={12} color={P.slate} opacity={0.34} teeth={12} toothW={14} toothH={9} />
            <GreatWallWatchtower r={r.fork('farTower')} x={520} y={greatWallRidgeY(farPts, 520)} scale={0.5} wallColor={P.slate} roofColor={P.earth} />
          </g>

          <Mist r={r.fork('vmist1')} y={860} opacity={0.4} />

          <Wash d={smooth([...heroPts, [1040, 1280], [-40, 1280]] as Pt[], true)} color={P.moss} opacity={0.46} />
          <GreatWallRampart r={r.fork('heroWall')} pts={heroPts} thickness={44} color={P.clay} opacity={0.62} teeth={16} toothW={26} toothH={22} />
          {[[220, 0.85], [580, 1.3], [880, 0.9]].map(([x, s], i) => (
            <GreatWallWatchtower key={i} r={r.fork('tower' + i)} x={x} y={greatWallRidgeY(heroPts, x)} scale={s}
              wallColor={P.clay} roofColor={P.terracotta} />
          ))}

          <Mist r={r.fork('valley1')} y={950} h={240} opacity={0.5} />
          <Mist r={r.fork('valley2')} y={1100} h={200} opacity={0.34} />

          <Ground r={r.fork('fg')} y={1300} color={P.earth} second={P.moss} />
          <Trees r={r.fork('autumn')} x1={30} x2={970} baseY={1290} n={6} canopy={[P.terracotta, P.amber, P.moss]} scale={0.6} />

          {[[560, 600], [620, 570]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(0.75)`}>{Bird(r.fork('wbird' + i), P.inkSoft)}</g>
          ))}

          <Specks r={r.fork('sp')} box={{ x: 40, y: 600, w: 920, h: 460 }} n={24} color={P.paper} size={3} opacity={0.22} />
        </g>
      )
    },
    { boost: ['mist', 'fog'] }),

  make('pyramids', 'Pyramids of Giza', 'Sand, sun, and the desert wind',
    [P.marigold, P.clay, P.ink],
    { terrain: ['plain'], timeOfDay: ['dawn', 'golden', 'dusk'], mood: ['grand', 'serene', 'mystic'], intensity: 3, tags: ['egypt', 'pyramid', 'giza', 'desert', 'sand', 'sphinx', 'ancient', 'monument', 'dune', 'sun'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.terracotta, HORIZON, 0.26], [P.marigold, HORIZON - 160, 0.26], [P.amber, HORIZON - 360, 0.2], [P.cream, HORIZON - 600, 0.16]]} />
        <circle cx={640} cy={760} r={140} fill={P.marigold} opacity={0.16} filter="url(#glow)" />
        <circle cx={640} cy={760} r={88} fill={P.amber} opacity={0.5} filter="url(#glow-tight)" />
        <circle cx={640} cy={760} r={54} fill={P.cream} opacity={0.85} />
        <Mist r={r.fork('haze1')} y={790} h={140} color={P.cream} opacity={0.28} />
        <FarSkyline xs={[60, 150, 860, 940]} y={HORIZON + 6} color={P.clay} opacity={0.2} />
        <GizaPyramid r={r.fork('menkaure')} cx={755} baseY={870} height={165} halfWidth={118} lit={P.cream} shade={P.clay} edgeBias={0.18} />
        <GizaPyramid r={r.fork('khafre')} cx={600} baseY={935} height={290} halfWidth={205} lit={P.amber} shade={P.terracotta} edgeBias={0.16} />
        <GizaPyramid r={r.fork('khufu')} cx={375} baseY={1060} height={430} halfWidth={310} lit={P.gold} shade={P.earth} edgeBias={0.14} />
        <Mist r={r.fork('haze2')} y={980} h={100} color={P.cream} opacity={0.18} />
        <Ground r={r.fork('ground')} y={1080} color={P.clay} second={P.terracotta} />
        {Array.from({ length: 3 }, (_, i) => {
          const dr = r.fork('dune' + i)
          const y = 1180 + i * 120
          const pts = ridge(dr, -40, W + 40, y, 26 + i * 8, 8)
          const d = smooth([...pts, [W + 40, 1540], [-40, 1540]] as Pt[], true)
          return <Wash key={i} d={d} color={i % 2 === 0 ? P.terracotta : P.clay} opacity={0.2 - i * 0.03} rim={false} />
        })}
        <GreatSphinx r={r.fork('sphinx')} cx={175} baseY={1230} scale={1.1} color={P.ink} rimColor={P.marigold} />
        <g stroke={P.earth} strokeWidth={1.6} opacity={0.26} fill="none" strokeLinecap="round">
          {Array.from({ length: 10 }, (_, i) => {
            const rr = r.fork('ripple' + i)
            const y = rr.range(1120, 1460)
            const x1 = rr.range(40, 500), x2 = x1 + rr.range(120, 320)
            return <path key={i} d={smooth(ridge(rr, x1, x2, y, 5, 4))} strokeWidth={rr.range(1.2, 2.6)} />
          })}
        </g>
        {[[820, 300], [865, 345]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(0.55)`}>{Bird(r.fork('pbird' + i), P.inkSoft)}</g>
        ))}
        <Specks r={r.fork('sp')} box={{ x: 0, y: 1150, w: 1000, h: 350 }} n={26} color={P.earth} size={4} opacity={0.16} />
      </g>
    )),

  make('santorini', 'Santorini', 'White houses over a blue sea',
    [P.blue, P.paper, P.earth],
    { terrain: ['sea', 'urban'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['serene', 'grand', 'dramatic'], intensity: 3, tags: ['santorini', 'greece', 'greek', 'island', 'cliff', 'whitewashed', 'church', 'aegean', 'sea', 'coastal'] },
    (r) => {
      const topPts = ridge(r.fork('cliffTop'), 140, 900, 548, 28, 9)
      const basePts = ridge(r.fork('cliffBase'), 900, 140, 780, 16, 7)
      const cliffD = smooth([...topPts, ...basePts] as Pt[], true)
      return (
        <g>
          <SkyGrad bands={[[P.blue, 560, 0.16], [P.paper, 300, 0.26], [P.cream, 120, 0.14]]} />
          <circle cx={800} cy={200} r={64} fill={P.cream} opacity={0.2} filter="url(#glow)" />
          <Cloud r={r.fork('c0')} x={250} y={210} scale={0.85} color={P.paper} />
          <Cloud r={r.fork('c1')} x={630} y={160} scale={0.6} color={P.paper} />
          {[[300, 250], [360, 220]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(0.75)`}>{Bird(r.fork('sbird' + i), P.inkSoft)}</g>
          ))}

          <Water r={r.fork('sea')} y={560} color={P.blue} glint={P.paper} />
          <Mist r={r.fork('haze')} y={568} h={70} color={P.cream} opacity={0.28} />

          {/* two distant sails, kept outside the cliff's own x-range so they never get overdrawn */}
          <g opacity={0.5}>
            <path d="M 70 660 L 70 610 L 96 656 Z" fill={P.paperDeep} />
            <path d="M 70 660 L 46 660 L 70 646 Z" fill={P.inkSoft} opacity={0.5} />
          </g>
          <g opacity={0.36}>
            <path d="M 958 692 L 958 654 L 978 690 Z" fill={P.slate} />
            <path d="M 958 692 L 938 692 L 958 680 Z" fill={P.inkSoft} opacity={0.5} />
          </g>

          {/* the cliff itself — dark volcanic rock rising straight out of the sea */}
          <Wash d={cliffD} color={P.earth} opacity={0.56} />
          <Wash d={cliffD} color={P.ink} opacity={0.2} rim={false} />
          <path d={blob(r.fork('streak'), 700, 700, 150, 95, 8, 0.28)} fill={P.terracotta} opacity={0.18} />
          <Ink pts={topPts} r={r.fork('cliffTopInk')} width={2.4} opacity={0.48} color={P.ink} />
          <Ink pts={basePts} r={r.fork('cliffBaseInk')} width={2} opacity={0.36} color={P.inkSoft} />
          {Array.from({ length: 3 }, (_, i) => (
            <path key={i} d={smooth(ridge(r.fork('strata' + i), 190, 850, 630 + i * 48, 9, 6))}
              stroke={P.inkSoft} strokeWidth={1.4} fill="none" opacity={0.22} />
          ))}
          {Array.from({ length: 5 }, (_, i) => {
            const sr = r.fork('scrub' + i)
            return <path key={i} d={blob(sr, sr.range(190, 850), sr.range(630, 730), 8, 5, 6, 0.3)} fill={P.moss} opacity={0.3} />
          })}

          {/* the town — three cascading terraces of whitewashed cube houses,
              farthest/smallest first, sized to actually read as buildings
              rather than dots and spread down the cliff face instead of
              bunched in one thin band along its very top edge */}
          {Array.from({ length: 7 }, (_, i) => {
            const hr = r.fork('back' + i)
            const x = 200 + (i / 6) * 620 + hr.jitter(18)
            const y = 548 + hr.jitter(8)
            return <g key={i}>{SantoriniCubeHouse(hr, x, y, hr.range(40, 54), hr.range(46, 64), hr.pick([P.paper, P.cream]), hr.pick([P.blue, P.indigo]))}</g>
          })}
          {Array.from({ length: 6 }, (_, i) => {
            const hr = r.fork('mid' + i)
            const x = 185 + (i / 5) * 660 + hr.jitter(20)
            const y = 622 + hr.jitter(10)
            const dome = i === 1 || i === 4 ? P.blue : undefined
            return <g key={i}>{SantoriniCubeHouse(hr, x, y, hr.range(54, 72), hr.range(60, 82), hr.pick([P.paper, P.cream]), hr.pick([P.blue, P.teal, P.indigo]), dome)}</g>
          })}

          {/* the blue-domed chapel — the single most recognisable mark of this place */}
          {SantoriniBlueDome(r.fork('church'), 555, 672, 1.7)}

          {Array.from({ length: 5 }, (_, i) => {
            const hr = r.fork('front' + i)
            const x = 215 + (i / 4) * 590 + hr.jitter(22)
            const y = 706 + hr.jitter(12)
            return <g key={i}>{SantoriniCubeHouse(hr, x, y, hr.range(72, 94), hr.range(78, 106), hr.pick([P.paper, P.cream]), hr.pick([P.blue, P.indigo, P.teal]))}</g>
          })}
          {[[260, 662], [760, 640]].map(([x, y], i) => {
            const br = r.fork('bloom' + i)
            return (
              <g key={i}>
                {Array.from({ length: 4 }, (_, k) => (
                  <path key={k} d={blob(br.fork('b' + k), x + br.jitter(10), y + br.jitter(8), 6, 5, 6, 0.3)} fill={P.rose} opacity={0.5} />
                ))}
              </g>
            )
          })}

          <Reflection r={r.fork('rf')} x={300} y={764} w={460} h={260} color={P.paper} opacity={0.2} />

          {/* foreground swell, kept below the cliff's own footprint */}
          <g stroke={P.paper} fill="none" opacity={0.5} strokeLinecap="round">
            {Array.from({ length: 5 }, (_, i) => (
              <path key={i} d={smooth(ridge(r.fork('fw' + i), r.range(0, 300), r.range(650, 1000), 1300 + i * 44, 6, 6))} strokeWidth={r.range(3, 6)} />
            ))}
          </g>

          <Specks r={r.fork('spr')} box={{ x: 150, y: 570, w: 700, h: 220 }} n={22} color={P.earth} size={3} opacity={0.16} />
          <Specks r={r.fork('sps')} box={{ x: 0, y: 900, w: 1000, h: 500 }} n={18} color={P.paper} size={3} opacity={0.14} />
        </g>
      )
    }),

  make('machu-picchu', 'Machu Picchu', 'Ruins above the clouds',
    [P.moss, P.slate, P.violet, P.clay],
    { terrain: ['mountain'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['grand', 'serene', 'mystic'], intensity: 3, tags: ['machu-picchu', 'peru', 'inca', 'ruins', 'andes', 'mountain', 'mist', 'ancient', 'terraces', 'llama'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.marigold, 700, 0.14], [P.cream, 520, 0.18], [P.blue, 340, 0.12], [P.paper, 160, 0.14]]} />
        <FarSkyline xs={[50, 900, 960]} y={480} color={P.violet} opacity={0.2} />
        <Peaks r={r.fork('far')} y={520} colors={[P.violet, P.indigo]} />
        <Mist r={r.fork('haze')} y={620} h={140} opacity={0.36} color={P.paper} />

        {/* the rounder green shoulder of Machu Picchu mountain itself — the
            OTHER side of the saddle from Huayna Picchu */}
        <path d={smooth([[10, 830], [70, 740], [170, 560], [260, 600], [330, 820], [340, 1540], [0, 1540]] as Pt[], true)}
          fill={P.moss} opacity={0.46} />
        <Ink pts={[[10, 830], [70, 740], [170, 560], [260, 600], [330, 820]] as Pt[]} r={r.fork('shoulder')} width={2.4} opacity={0.42} />

        <HuaynaPicchuPeak r={r.fork('hp')} cx={660} baseY={800} apexY={290} width={360} rock={P.slate} green={P.teal} />
        <Mist r={r.fork('collar-drift')} y={640} h={110} opacity={0.26} color={P.paper} />

        {[[260, 180], [420, 140], [520, 210]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(1.3)`}>{Bird(r.fork('condor' + i), P.ink)}</g>
        ))}

        {/* the saddle itself — the terraced ground the ruins actually sit on */}
        <Ground r={r.fork('saddle')} y={860} color={P.moss} second={P.earth} />

        <MachuPicchuRuinWalls r={r.fork('ruins')} stone={P.clay} shadow={P.inkSoft} doorway={P.ink}
          rows={[
            { x1: 300, x2: 560, y: 800, wallH: 50, n: 3 },
            { x1: 180, x2: 660, y: 880, wallH: 60, n: 5 },
            { x1: 130, x2: 780, y: 970, wallH: 66, n: 6 },
            { x1: 150, x2: 860, y: 1060, wallH: 60, n: 6 },
          ]} />

        <MachuPicchuTorreon r={r.fork('torreon')} cx={700} cy={900} rx={52} ry={36} stone={P.clay} shadow={P.inkSoft} />

        <Steps r={r.fork('terraces')} y={1130} color={P.green} n={8} />

        <MachuPicchuLlama r={r.fork('llama0')} x={340} y={1160} scale={0.9} color={P.inkSoft} />
        <MachuPicchuLlama r={r.fork('llama1')} x={660} y={1200} scale={0.72} color={P.earth} />

        <Mist r={r.fork('wisp')} y={1010} h={70} opacity={0.2} color={P.paper} />
        <Mist r={r.fork('valley1')} y={1280} h={160} opacity={0.5} color={P.paper} />
        <Mist r={r.fork('valley2')} y={1400} h={180} opacity={0.6} color={P.paper} />
        <Mist r={r.fork('valley3')} y={1470} h={110} opacity={0.5} color={P.cream} />

        <Specks r={r.fork('stonegrain')} box={{ x: 100, y: 760, w: 760, h: 360 }} n={26} color={P.earth} size={3} opacity={0.16} />
        <Specks r={r.fork('skygrain')} box={{ x: 0, y: 0, w: 1000, h: 600 }} n={16} color={P.paper} size={3} opacity={0.14} />
      </g>
    ),
    { boost: ['mist'] }),

  make('kyoto', 'Kyoto in Sakura Season', 'Torii gates and falling cherry blossoms',
    [P.vermilion, P.pink, P.cream],
    { terrain: ['urban', 'forest'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['serene', 'grand', 'mystic'], intensity: 3, tags: ['kyoto', 'japan', 'torii', 'shrine', 'sakura', 'cherry-blossom', 'pagoda', 'tunnel', 'gate', 'pink'] },
    (r) => {
      const VPy = 620
      return (
        <g>
          <SkyGrad bands={[[P.rose, 650, 0.22], [P.pink, 480, 0.16], [P.cream, 300, 0.22], [P.paper, 120, 0.14]]} />
          <Peaks r={r.fork('hills')} y={560} colors={[P.violet, P.slate]} />
          <KyotoPagodaSilhouette cx={500} baseY={VPy} h={320} color={P.slate} />
          <Mist r={r.fork('haze')} y={600} opacity={0.32} />
          <Ground r={r.fork('g')} y={640} color={P.clay} second={P.earth} />
          {[[430, 520], [560, 500]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(0.55)`}>{Bird(r.fork('kbird' + i), P.inkSoft)}</g>
          ))}
          <Trees r={r.fork('farblossomL')} x1={-60} x2={230} baseY={840} n={2} canopy={[P.rose, P.pink]} scale={0.75} />
          <Trees r={r.fork('farblossomR')} x1={780} x2={1070} baseY={840} n={2} canopy={[P.rose, P.pink]} scale={0.75} />

          {/* the torii tunnel — nested gates receding to a single vanishing
              point at the pagoda's foot, small/simple far, large/detailed near */}
          {Array.from({ length: 7 }, (_, i) => {
            const t = 0.06 + 0.94 * Math.pow(i / 6, 1.5)
            const gy = VPy + (1460 - VPy) * t
            // The top has to recede toward the vanishing point by roughly as
            // much as the base does, or every gate's cap beam — however far
            // back it sits — ends up in the same narrow band and seven
            // overlapping crossbeams paint one solid red bar instead of a
            // tunnel of gates receding into the distance.
            const topY = VPy - 350 * t
            const halfW = 380 * t
            const overhang = 70 * t
            const postW = Math.max(2.2, 32 * t)
            const gr = r.fork('torii' + i)
            const cx = 500 + gr.jitter(6)
            const color = [P.rose, P.rose, P.terracotta, P.terracotta, P.vermilion, P.vermilion, P.red][i]
            return (
              <KyotoToriiGate key={i} r={gr} cx={cx} groundY={gy} topY={topY} halfW={halfW} overhang={overhang}
                postW={postW} color={color} capColor={P.ink} detail={t > 0.4} />
            )
          })}

          <Trees r={r.fork('nearblossomL')} x1={-100} x2={160} baseY={1160} n={2} canopy={[P.pink, P.rose]} scale={1.5} />
          <Trees r={r.fork('nearblossomR')} x1={840} x2={1100} baseY={1160} n={2} canopy={[P.pink, P.rose]} scale={1.5} />

          {/* cherry blossom canopy framing the top corners, as if looking
              up through low branches at the mouth of the tunnel */}
          {[-1, 1].map((side) => {
            const br = r.fork('corner' + side)
            const branchPts: Pt[] = side < 0
              ? [[-60, -40], [50, 6], [170, 62], [270, 40]]
              : [[1060, -30], [900, 20], [780, 70], [670, 48]]
            return (
              <g key={side}>
                <path d={smooth(branchPts)} stroke={P.earth} strokeWidth={10} fill="none" opacity={0.5} strokeLinecap="round" />
                <path d={smooth(branchPts.slice(1))} stroke={P.earth} strokeWidth={5} fill="none" opacity={0.4} strokeLinecap="round" />
                {Array.from({ length: 7 }, (_, i) => {
                  const cbx = side < 0 ? 30 + i * 55 : 970 - i * 55
                  const cby = 10 + br.jitter(40) + i * 6
                  return (
                    <path key={i}
                      d={blob(br.fork('c' + i), cbx + br.jitter(24), cby, 95 - i * 5, 62 - i * 3, 8, 0.3)}
                      fill={i % 2 ? P.pink : P.rose} opacity={0.42} />
                  )
                })}
              </g>
            )
          })}

          <Specks r={r.fork('petaldust')} box={{ x: 0, y: 0, w: 1000, h: 1500 }} n={30} color={P.pink} size={4} opacity={0.2} />
          {Array.from({ length: 12 }, (_, i) => {
            const pr = r.fork('petal' + i)
            const x = pr.range(40, 960)
            const y = pr.range(80, 1420)
            const rot = pr.range(0, 360)
            const s = pr.range(0.7, 1.3)
            return (
              <ellipse key={i} cx={x} cy={y} rx={9 * s} ry={4.6 * s} fill={pr.pick([P.pink, P.rose])} opacity={0.55}
                transform={`rotate(${rot} ${x} ${y})`} />
            )
          })}
        </g>
      )
    }),

  make('northern-lights', 'Northern Lights', 'Aurora over a frozen fjord',
    [P.indigo, P.teal, P.violet],
    {
      terrain: ['mountain', 'sea'],
      timeOfDay: ['night'],
      mood: ['mystic', 'serene', 'dramatic'],
      intensity: 3,
      tags: ['aurora', 'northern-lights', 'arctic', 'fjord', 'snow', 'night', 'stars', 'cold', 'mountains', 'still-water'],
    },
    (r) => (
      <g>
        <SkyGrad bands={[[P.indigo, 1060, 0.4], [P.violet, 760, 0.2], [P.indigo, 460, 0.24]]} />

        {/* stars — a dense faint scatter, a handful of brighter points, and
            a few hand-marked four-point twinkles */}
        <Specks r={r.fork('stars1')} box={{ x: 0, y: 0, w: 1000, h: 760 }} n={70} color={P.paper} size={1.8} opacity={0.4} />
        <Specks r={r.fork('stars2')} box={{ x: 0, y: 0, w: 1000, h: 700 }} n={16} color={P.cream} size={3.2} opacity={0.6} />
        {[[120, 140], [860, 110], [660, 90], [300, 60]].map(([x, y], i) => (
          <g key={i} stroke={P.cream} strokeWidth={1.4} opacity={0.55} strokeLinecap="round">
            <path d={`M ${x - 7} ${y} L ${x + 7} ${y} M ${x} ${y - 7} L ${x} ${y + 7}`} />
          </g>
        ))}

        {/* the aurora itself — three sweeping curtains at different
            heights and spans, so it reads as motion across the whole sky
            rather than one static band */}
        <AuroraCurtain r={r.fork('auroraA')} y={190} height={260} tilt={40}
          colors={[NORTHERN_LIGHTS_GREEN, P.teal, NORTHERN_LIGHTS_VIOLET]} />
        <AuroraCurtain r={r.fork('auroraB')} y={380} height={220} tilt={-60}
          colors={[NORTHERN_LIGHTS_VIOLET, NORTHERN_LIGHTS_GREEN]} />
        <AuroraCurtain r={r.fork('auroraC')} x1={-60} x2={720} y={540} height={170} tilt={30}
          colors={[NORTHERN_LIGHTS_GREEN, P.moss]} />

        <Peaks r={r.fork('peaks')} y={800} colors={[P.violet, P.slate, P.indigo]} snow />
        <Mist r={r.fork('mist1')} y={900} opacity={0.32} />

        <Water r={r.fork('water')} y={960} color={P.indigo} glint={P.paper} />
        <Reflection r={r.fork('reflG')} x={340} y={975} w={420} h={300} color={NORTHERN_LIGHTS_GREEN} opacity={0.2} />
        <Reflection r={r.fork('reflV')} x={520} y={985} w={260} h={220} color={NORTHERN_LIGHTS_VIOLET} opacity={0.16} />

        {/* the fjord's snowy near shore, framing left and right */}
        <path d={blob(r.fork('rockL'), 90, 1470, 190, 110, 9, 0.2)} fill={P.slate} opacity={0.4} />
        <Wash d={blob(r.fork('bankL'), 100, 1420, 230, 170, 9, 0.22)} color={P.paper} opacity={0.62} />
        <FjordFir r={r.fork('fir0')} x={80} baseY={1400} h={210} color={P.ink} />
        <FjordFir r={r.fork('fir1')} x={150} baseY={1420} h={150} color={P.indigo} />
        <FjordFir r={r.fork('fir2')} x={205} baseY={1438} h={110} color={P.indigo} />

        <path d={blob(r.fork('rockR'), 910, 1480, 170, 100, 9, 0.2)} fill={P.slate} opacity={0.36} />
        <Wash d={blob(r.fork('bankR'), 900, 1436, 200, 150, 9, 0.22)} color={P.paper} opacity={0.56} />
        <FjordFir r={r.fork('fir3')} x={880} baseY={1418} h={160} color={P.indigo} />

        <Specks r={r.fork('snowSparkle')} box={{ x: 0, y: 1300, w: 1000, h: 200 }} n={26} color={P.paper} size={3} opacity={0.3} />
      </g>
    )),

  make('moon', 'The Moon', 'Grey dust, sharp shadows, Earth in the sky',
    [P.indigo, '#9E9484', P.blue, '#15131C'],
    { terrain: ['space'], timeOfDay: ['night'], mood: ['serene', 'grand', 'mystic'], intensity: 3, tags: ['moon', 'lunar', 'craters', 'earthrise', 'starfield', 'space', 'grey', 'cosmic', 'quiet', 'apollo'] },
    (r) => (
      <g>
        <SkyGrad bands={[[P.indigo, 900, 0.6], ['#15131C', 630, 0.75], [P.violet, 260, 0.16]]} />

        {/* countless cold pinpricks — no atmosphere up here to make them twinkle */}
        <Specks r={r.fork('starsDim')} box={{ x: -20, y: 0, w: 1040, h: 860 }} n={70} color={P.paper} size={2} opacity={0.32} />
        <Specks r={r.fork('starsMid')} box={{ x: -20, y: 0, w: 1040, h: 860 }} n={28} color={P.cream} size={2.6} opacity={0.55} />
        {[[180, 140], [520, 90], [860, 320], [300, 480], [700, 600], [120, 700]].map(([x, y], i) => {
          const br = r.fork('bstar' + i)
          const s = br.range(5, 9)
          return (
            <g key={i} opacity={br.range(0.55, 0.85)}>
              <path d={`M ${x - s} ${y} L ${x + s} ${y} M ${x} ${y - s} L ${x} ${y + s}`} stroke={P.paper} strokeWidth={1.1} />
              <circle cx={x} cy={y} r={1.8} fill={P.paper} />
            </g>
          )
        })}

        {/* low, hazy lunar highlands right on the horizon — mostly swallowed
            by the ground plane below, just their tops left showing */}
        <FarSkyline xs={[60, 180, 300, 430, 560, 700, 830, 950]} y={900} color={P.inkSoft} opacity={0.3} />

        {/* Earth, hanging small and still and unmistakably blue */}
        <MoonEarthGlobe r={r.fork('earth')} cx={700} cy={260} rad={86} />

        <Ground r={r.fork('ground')} y={880} color={'#9E9484'} second={P.clay} />

        {/* the cratered field itself — several rims, different sizes, some
            overlapping, every shadow falling the same way */}
        <MoonCrater r={r.fork('crHero')} cx={150} cy={1450} rx={280} ry={148} rim={'#9E9484'} />
        <MoonCrater r={r.fork('crHeroSat')} cx={370} cy={1380} rx={72} ry={44} rim={P.clay} />
        <MoonCrater r={r.fork('crR1')} cx={840} cy={1370} rx={150} ry={90} rim={'#9E9484'} />
        <MoonCrater r={r.fork('crMid1')} cx={380} cy={1150} rx={95} ry={58} rim={P.clay} />
        <MoonCrater r={r.fork('crMid2')} cx={540} cy={1110} rx={78} ry={48} rim={'#9E9484'} />
        {Array.from({ length: 7 }, (_, i) => {
          const fr = r.fork('crFar' + i)
          const x = 40 + (i / 6) * 940 + fr.jitter(30)
          const y = 960 + fr.jitter(40)
          const s = fr.range(16, 36)
          const rimColor = fr.pick(['#9E9484', P.clay])
          return <MoonCrater key={i} r={fr} cx={x} cy={y} rx={s} ry={s * 0.55} rim={rimColor} />
        })}

        <Specks r={r.fork('dust')} box={{ x: 0, y: 900, w: 1000, h: 600 }} n={40} color={P.inkSoft} size={3.4} opacity={0.14} />
      </g>
    )),

  make('mars', 'Mars', 'Rust-red dunes under a butterscotch sky',
    [MARS_HAZE, MARS_RUST, P.terracotta],
    { terrain: ['space'], timeOfDay: ['day', 'dusk'], mood: ['mystic', 'grand', 'serene'], intensity: 3, tags: ['mars', 'red-planet', 'dunes', 'desert', 'rocks', 'dusty', 'space', 'alien', 'phobos', 'deimos'] },
    (r) => {
      const groundY = 920
      return (
        <g>
          <SkyGrad bands={[[MARS_HAZE, groundY, 0.34], [P.clay, groundY - 220, 0.22], [P.paperDeep, groundY - 420, 0.16]]} />

          {/* a small, dust-hazed sun — Mars still has one, just paler and farther off */}
          <circle cx={740} cy={260} r={40} fill={P.cream} opacity={0.3} filter="url(#glow)" />
          <circle cx={740} cy={260} r={16} fill={P.paper} opacity={0.4} />

          {/* fine dust suspended in the upper air, the reason the sky reads butterscotch and not blue */}
          <Specks r={r.fork('skydust')} box={{ x: 0, y: 100, w: 1000, h: groundY - 100 }} n={16} color={MARS_HAZE} size={2.5} opacity={0.12} />

          {/* Phobos, dominated by the Stickney crater, and tiny distant Deimos — the pair no other world's sky has */}
          <MarsMoon r={r.fork('phobos')} cx={220} cy={190} radius={34} color={P.slate} opacity={0.62} bigCrater />
          <MarsMoon r={r.fork('deimos')} cx={332} cy={148} radius={15} color={P.inkSoft} opacity={0.46} />

          <MarsMesaRidge r={r.fork('mesa')} y={groundY - 10} color={MARS_RUST} bandColor={P.earth} />
          <Mist r={r.fork('haze')} y={groundY - 30} h={140} color={MARS_HAZE} opacity={0.4} />

          {/* a wind-carried dust devil, the funnel every rover panorama eventually catches crossing the plain */}
          <g opacity={0.42}>
            <path d={smooth([[500, groundY - 20], [488, groundY - 140], [506, groundY - 260], [492, groundY - 360], [504, groundY - 430]] as Pt[])}
              stroke={MARS_HAZE} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.5} />
            <path d={blob(r.fork('devilbase'), 500, groundY - 10, 46, 16, 7, 0.3)} fill={MARS_HAZE} opacity={0.3} />
          </g>

          <Ground r={r.fork('g')} y={groundY} color={P.terracotta} second={MARS_RUST} />

          {/* rolling dune crests, alternating rust/clay so each ridge pools a shade differently as it recedes */}
          {Array.from({ length: 6 }, (_, i) => {
            const dy = groundY + 40 + i * 70
            const dr = r.fork('dune' + i)
            const pts = ridge(dr, -40, W + 40, dy, 22, 6)
            return (
              <g key={i}>
                <path d={smooth(pts)} stroke={i % 2 ? MARS_RUST : P.clay} strokeWidth={26 + i * 4} fill="none" strokeLinecap="round" opacity={0.34} />
                <Ink pts={pts} r={dr.fork('ink')} width={1.6} opacity={0.22} color={P.ink} />
              </g>
            )
          })}

          {/* fine wind-ripple texture on the sand itself */}
          <g stroke={P.paperDeep} strokeWidth={1.4} opacity={0.22} fill="none">
            {Array.from({ length: 9 }, (_, i) => {
              const wy = groundY + 70 + i * 60 + r.jitter(10)
              return <path key={i} d={smooth(ridge(r.fork('ripple' + i), 40, 960, wy, 10, 5))} />
            })}
          </g>

          {/* scattered dark boulders, closer ones bigger, every rover-photo Mars foreground has these */}
          {Array.from({ length: 9 }, (_, i) => {
            const rr = r.fork('rock' + i)
            const x = rr.range(50, 950)
            const y = rr.range(groundY + 100, 1440)
            const depth = Math.min(1, (y - groundY) / 560)
            const size = rr.range(16, 60) * (0.5 + depth * 0.9)
            const tone = rr.pick([MARS_RUST, P.earth, P.inkSoft])
            return (
              <g key={i}>
                <ellipse cx={x + size * 0.15} cy={y + size * 0.6} rx={size * 0.95} ry={size * 0.26} fill={P.ink} opacity={0.14} />
                <Wash d={blob(rr.fork('shape'), x, y, size, size * rr.range(0.6, 0.85), 7, 0.3)} color={tone} opacity={0.58} />
              </g>
            )
          })}

          <Specks r={r.fork('sp')} box={{ x: 0, y: groundY, w: 1000, h: 1500 - groundY }} n={30} color={P.earth} size={4} opacity={0.16} />
        </g>
      )
    }),

  make('saturn-rings', 'Rings of Saturn', 'Ice and stone, seen from a nearby moon',
    ['#151726', P.gold, P.slate],
    {
      terrain: ['space'], timeOfDay: ['night'], mood: ['grand', 'mystic', 'serene'], intensity: 3,
      tags: ['saturn', 'rings', 'space', 'planet', 'moon', 'stars', 'ice', 'cosmic', 'celestial', 'night-sky'],
    },
    (r) => {
      const VOID = '#151726'
      const CX = 500, CY = 560
      const SPHERE_R = 185
      const RING_RX = 430, RING_RY = 98
      const INNER_RX = SPHERE_R + 22
      const INNER_RY = INNER_RX * (RING_RY / RING_RX)
      const RING_BANDS = [
        { t: 0.05, width: 24, color: P.gold, opacity: 0.5 },
        { t: 0.22, width: 30, color: P.cream, opacity: 0.46 },
        { t: 0.37, width: 9, color: P.inkSoft, opacity: 0.4 },
        { t: 0.5, width: 34, color: P.amber, opacity: 0.5 },
        { t: 0.66, width: 8, color: P.earth, opacity: 0.42 },
        { t: 0.82, width: 38, color: P.cream, opacity: 0.48 },
        { t: 0.95, width: 16, color: P.gold, opacity: 0.4 },
      ]
      const ringGeom = RING_BANDS.map((b) => ({
        ...b,
        rx: INNER_RX + b.t * (RING_RX - INNER_RX),
        ry: INNER_RY + b.t * (RING_RY - INNER_RY),
      }))
      const spherePts: Pt[] = Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return [CX + Math.cos(a) * SPHERE_R, CY + Math.sin(a) * SPHERE_R] as Pt
      })

      return (
        <g>
          <SkyGrad bands={[[VOID, 980, 0.86], [P.indigo, 620, 0.22], [P.violet, 260, 0.14]]} />

          {/* starfield */}
          <g>
            {Array.from({ length: 70 }, (_, i) => {
              const sr = r.fork('star' + i)
              return (
                <circle key={i} cx={sr.range(-20, 1020)} cy={sr.range(20, 960)}
                  r={sr.range(0.5, 1.6)} fill={P.paper} opacity={sr.range(0.2, 0.55)} />
              )
            })}
            {Array.from({ length: 7 }, (_, i) => {
              const sr = r.fork('brightstar' + i)
              return (
                <circle key={i} cx={sr.range(20, 980)} cy={sr.range(30, 900)}
                  r={sr.range(1.8, 3)} fill={P.paper} opacity={sr.range(0.7, 0.95)} filter="url(#glow-tight)" />
              )
            })}
          </g>

          {/* ambient glow behind the whole planet+ring system */}
          <path d={blob(r.fork('haloglow'), CX, CY, RING_RX * 1.1, SPHERE_R * 1.35, 10, 0.1)}
            fill={P.gold} opacity={0.16} filter="url(#glow)" />

          {/* back half of the rings, tucked behind the globe */}
          <g>
            {ringGeom.map((b, i) => (
              <path key={i}
                d={smooth(saturnRingArc(r.fork('ringback' + i), CX, CY, b.rx, b.ry, 180, 360))}
                stroke={b.color} strokeWidth={b.width} fill="none" strokeLinecap="round" opacity={b.opacity * 0.6} />
            ))}
          </g>

          {/* the globe itself */}
          <g>
            <Wash d={blob(r.fork('sphere'), CX, CY, SPHERE_R, SPHERE_R, 12, 0.035)} color={P.gold} opacity={0.6} />
            {Array.from({ length: 8 }, (_, i) => {
              const bandR = r.fork('cloudband' + i)
              const dy = -SPHERE_R * 0.78 + (i / 7) * SPHERE_R * 1.56
              const halfW = Math.sqrt(Math.max(1, SPHERE_R * SPHERE_R - dy * dy)) * 0.95
              const tone = [P.amber, P.cream, P.marigold, P.gold][i % 4]
              return <path key={i} d={blob(bandR, CX, CY + dy, halfW, 14, 8, 0.1)} fill={tone} opacity={0.14} />
            })}
            <path d={blob(r.fork('shadowside'), CX + SPHERE_R * 0.38, CY + SPHERE_R * 0.3, SPHERE_R * 0.72, SPHERE_R * 0.68, 9, 0.14)}
              fill={P.inkSoft} opacity={0.2} />
            <path d={blob(r.fork('litside'), CX - SPHERE_R * 0.4, CY - SPHERE_R * 0.42, SPHERE_R * 0.3, SPHERE_R * 0.26, 8, 0.16)}
              fill={P.cream} opacity={0.3} />
            <path d={smooth(saturnRingArc(r.fork('ringshadow'), CX, CY, SPHERE_R * 0.92, SPHERE_R * 0.92 * (RING_RY / RING_RX), 8, 172))}
              stroke={P.inkSoft} strokeWidth={16} fill="none" strokeLinecap="round" opacity={0.22} />
            <Ink pts={spherePts} close r={r.fork('sphereink')} width={2.4} opacity={0.48} color={P.inkSoft} />
          </g>

          {/* front half of the rings, passing in front of the globe */}
          <g>
            {ringGeom.map((b, i) => (
              <path key={i}
                d={smooth(saturnRingArc(r.fork('ringfront' + i), CX, CY, b.rx, b.ry, 0, 180))}
                stroke={b.color} strokeWidth={b.width} fill="none" strokeLinecap="round" opacity={b.opacity} />
            ))}
            <Ink pts={saturnRingArc(r.fork('ringrim'), CX, CY, RING_RX, RING_RY, 4, 176)}
              r={r.fork('ringrimink')} width={2} opacity={0.32} color={P.inkSoft} />
            {Array.from({ length: 7 }, (_, i) => {
              const gr = r.fork('ringglint' + i)
              const a = (gr.range(15, 165) * Math.PI) / 180
              const t = gr.range(0.55, 0.98)
              const rx = INNER_RX + t * (RING_RX - INNER_RX)
              const ry = INNER_RY + t * (RING_RY - INNER_RY)
              return (
                <circle key={i} cx={CX + Math.cos(a) * rx} cy={CY + Math.sin(a) * ry}
                  r={gr.range(1.4, 2.4)} fill={P.paper} opacity={gr.range(0.55, 0.85)} />
              )
            })}
          </g>

          {/* the moon's own icy, jagged, cratered ground */}
          <Peaks r={r.fork('ridge')} y={950} colors={[P.slate, P.indigo]} snow />
          <Ground r={r.fork('g')} y={1030} color={P.slate} second={P.indigo} />

          <SaturnMoonBoulder r={r.fork('boulderL')} x={150} baseY={1080} w={220} h={230} color={P.slate} />
          <SaturnMoonBoulder r={r.fork('boulderR')} x={860} baseY={1120} w={260} h={280} color={P.indigo} />
          <SaturnMoonBoulder r={r.fork('boulderMid')} x={520} baseY={1400} w={180} h={140} color={P.slate} />

          {[[300, 1200, 30], [620, 1260, 22], [430, 1340, 16], [780, 1300, 26], [220, 1420, 14]].map(([cx, cy, rad], i) => (
            <SaturnMoonCrater key={i} r={r.fork('crater' + i)} cx={cx} cy={cy} rad={rad} color={P.slate} />
          ))}

          <Specks r={r.fork('frost')} box={{ x: 0, y: 1020, w: 1000, h: 480 }} n={34} color={P.paper} size={3} opacity={0.22} />
        </g>
      )
    }),

  make('nebula', 'Deep Space Nebula', 'Colour and stars past the edge of anything',
    [P.violet, P.rose, P.teal],
    { terrain: ['space'], timeOfDay: ['night'], mood: ['mystic', 'grand', 'dramatic'], intensity: 4, tags: ['space', 'nebula', 'stars', 'cosmic', 'galaxy', 'void', 'asteroid', 'celestial', 'deep-space', 'stardust'] },
    (r) => (
      <g>
        {/* the void the whole scene is painted on */}
        <SkyGrad bands={[
          ['#14131E', 1540, 0.95],
          [P.indigo, 1080, 0.28],
          [P.violet, 620, 0.16],
        ]} />

        {/* a dense far starfield, varying size and brightness */}
        <g fill={P.paper}>
          {Array.from({ length: 130 }, (_, i) => {
            const sr = r.fork('star' + i)
            return (
              <circle key={i} cx={sr.range(-20, 1020)} cy={sr.range(-20, 1520)}
                r={sr.range(0.6, 1.8)} opacity={sr.range(0.25, 0.75)} />
            )
          })}
        </g>

        {/* the nebula body — three overlapping jewel-toned lobes, wide
            enough to fill most of the sky, so it reads as one luminous
            drifting cloud rather than three separate blobs */}
        <NebulaBillow r={r.fork('lobeV')} cx={380} cy={560} rx={430} ry={320} color={P.violet} opacity={0.34} puffs={8} />
        <NebulaBillow r={r.fork('lobeR')} cx={640} cy={470} rx={360} ry={260} color={P.rose} opacity={0.3} puffs={7} />
        <NebulaBillow r={r.fork('lobeT')} cx={520} cy={700} rx={400} ry={280} color={P.teal} opacity={0.26} puffs={7} />

        {/* wispy gas filaments trailing off the main body */}
        <g fill="none" strokeLinecap="round">
          {Array.from({ length: 6 }, (_, i) => {
            const fr = r.fork('fil' + i)
            const cx0 = fr.range(260, 760), cy0 = fr.range(380, 700)
            const a = fr() * Math.PI * 2
            const len = fr.range(160, 320)
            const pts: Pt[] = [
              [cx0, cy0],
              [cx0 + Math.cos(a) * len * 0.5 + fr.jitter(40), cy0 + Math.sin(a) * len * 0.5 + fr.jitter(40)],
              [cx0 + Math.cos(a) * len, cy0 + Math.sin(a) * len],
            ]
            return (
              <path key={i} d={smooth(pts)} stroke={fr.pick([P.violet, P.rose, P.teal])}
                strokeWidth={fr.range(2, 5)} opacity={fr.range(0.18, 0.34)} />
            )
          })}
        </g>

        {/* the bright core — young stars lighting the gas from within */}
        <circle cx={470} cy={560} r={70} fill={P.cream} opacity={0.16} filter="url(#glow)" />
        <circle cx={470} cy={560} r={30} fill={P.cream} opacity={0.3} filter="url(#glow-tight)" />
        {Array.from({ length: 9 }, (_, i) => {
          const cr = r.fork('corestar' + i)
          const a = cr() * Math.PI * 2, d = cr.range(0, 46)
          return (
            <circle key={i} cx={470 + Math.cos(a) * d} cy={560 + Math.sin(a) * d * 0.8}
              r={cr.range(1.4, 3.2)} fill={P.cream} opacity={cr.range(0.6, 0.95)} />
          )
        })}

        {/* brighter foreground stars, some with a hint of sparkle */}
        {Array.from({ length: 16 }, (_, i) => {
          const br = r.fork('bstar' + i)
          const x = br.range(-10, 1010), y = br.range(-10, 1510)
          const rr = br.range(1.6, 3.4)
          const bright = br() > 0.6
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={rr * 2.4} fill={P.paper} opacity={0.14} filter="url(#glow-tight)" />
              <circle cx={x} cy={y} r={rr} fill={P.paper} opacity={0.9} />
              {bright && (
                <g stroke={P.paper} strokeWidth={1} opacity={0.5}>
                  <path d={`M ${x - rr * 3} ${y} L ${x + rr * 3} ${y}`} />
                  <path d={`M ${x} ${y - rr * 3} L ${x} ${y + rr * 3}`} />
                </g>
              )}
            </g>
          )
        })}

        {/* two foreground planetoids for scale, each lit on the side
            actually facing the glow */}
        <NebulaAsteroid r={r.fork('rockA')} cx={70} cy={1380} rx={200} ry={160} rim={P.rose} rimStart={-0.66 * Math.PI} rimSweep={0.6 * Math.PI} />
        <NebulaAsteroid r={r.fork('rockB')} cx={970} cy={1440} rx={120} ry={95} rim={P.violet} rimStart={-0.96 * Math.PI} rimSweep={0.6 * Math.PI} />

        {/* cosmic dust */}
        <Specks r={r.fork('sp')} box={{ x: 0, y: 0, w: 1000, h: 1500 }} n={40} color={P.paper} size={2.4} opacity={0.14} />
      </g>
    )),
]
