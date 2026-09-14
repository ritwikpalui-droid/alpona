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

/**
 * One small incised motif for a carved terracotta panel — an elephant, a
 * small standing figure, or a floral rosette, picked at random per panel so
 * a whole grid of them reads as "every inch told a story" (real Bishnupur
 * panels are dense rows of exactly this: figures, animals, rosettes,
 * repeated with hand-carved variation) rather than a decorative but empty
 * outline. Thin plain strokes, not the full double-pass `Ink` — at this
 * size (~20 canvas units) the heavier line weight just reads as a smudge.
 */
function CarvedFigure({ r, cx, cy, s, color }: { r: Rng; cx: number; cy: number; s: number; color: string }) {
  const kind = Math.floor(r() * 3)
  const j = () => r.jitter(1.4)
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.8}>
      {kind === 0 && (
        <>
          <ellipse cx={j()} cy={2 + j()} rx={11} ry={7} />
          <path d={`M${-10 + j()},-1 Q${-15 + j()},4 ${-13 + j()},10`} />
          <circle cx={9 + j()} cy={-3 + j()} r={2.2} fill={color} opacity={0.5} />
          <path d={`M-6,8 L-6,13 M0,8 L0,13 M6,8 L6,13`} />
        </>
      )}
      {kind === 1 && (
        <>
          <circle cx={j()} cy={-9 + j()} r={3.4} />
          <path d={`M0,-5.5 L0,7`} />
          <path d={`M-8,${-1 + j()} L0,-5.5 L8,${-1 + j()}`} />
          <path d={`M-6,${13 + j()} L0,7 L6,${13 + j()}`} />
        </>
      )}
      {kind === 2 && Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2
        return <path key={i} d={`M${j()},${j()} L${Math.cos(a) * 10},${Math.sin(a) * 10}`} />
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
  meta: Asset['meta'], draw: (r: Rng) => ReactNode, affinity?: Asset['affinity'],
  image?: { src: string; w: number; h: number }): Asset {
  return {
    id, category: 'pandal', name, subtitle, palette, meta, affinity,
    art: image ? { kind: 'image', ...image } : { kind: 'proc', draw: (r) => draw(r) },
  }
}

export const pandals: Asset[] = [
  make('bengali-temple', 'Bengali Temple', 'Aat-chala, the roof that curves like a hut',
    [P.terracotta, P.cream, P.ink],
    { terrain: ['river', 'plain', 'urban', 'interior'], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['nostalgic', 'serene', 'grand'], intensity: 3, tags: ['traditional', 'temple', 'chala', 'classic', 'terracotta'] },
    (r) => {
      // A plastered front wall standing behind the niche and columns — the
      // aat-chala roof didn't used to have anything to sit on. Its top ~90
      // units sit under tier 0's own eave overhang (which closes down to
      // y+30), so only the lived-in lower wall — with the niche cut into it —
      // actually shows, the way a real temple's roof overhangs its walls.
      const wallPts: Pt[] = [[224, BASE], [232, 638], [768, 638], [776, BASE]]
      const wallD = `M ${wallPts[0][0]} ${wallPts[0][1]} L ${wallPts[1][0]} ${wallPts[1][1]} L ${wallPts[2][0]} ${wallPts[2][1]} L ${wallPts[3][0]} ${wallPts[3][1]} Z`
      // Per-tier cornice geometry, echoing Chala's own (unexported) numbers so
      // the moulding band under each roof edge lines up with it exactly.
      const tierGeo = [0, 1, 2].map(i => ({ y: 700 - i * 118, half: 300 - i * 62 }))
      const tickCounts = [15, 11, 7]

      return (
        <g>
          <Wash d={wallD} color={P.paperDeep} opacity={0.55} />
          <Ink pts={[[228, 735], [222, BASE]]} r={r.fork('wallL')} width={2.4} opacity={0.32} />
          <Ink pts={[[772, 735], [778, BASE]]} r={r.fork('wallR')} width={2.4} opacity={0.32} />

          {/* Old brick-and-plaster age: hairline cracks in the plain wall
              strips flanking the niche (not across the niche opening itself,
              which reads oddly with a "structural" crack over it), plus
              scattered pigment aging across the whole facade. */}
          {([[236, 292, 830], [708, 764, 960]] as [number, number, number][]).map(([x1, x2, cy], i) => (
            <Ink key={i} pts={ridge(r.fork('crack' + i), x1, x2, cy, 12, 4)} r={r.fork('crackI' + i)} width={1} opacity={0.22} color={P.ink} />
          ))}
          <Specks r={r.fork('sp1')} box={{ x: 224, y: 638, w: 552, h: 462 }} n={26} color={P.earth} size={3} opacity={0.16} />
          <Specks r={r.fork('sp2')} box={{ x: 224, y: 638, w: 552, h: 462 }} n={14} color={P.terracotta} size={2} opacity={0.2} />

          <Niche opacity={0.34} color={P.earth} />

          <Columns r={r.fork('col')} xs={[300, 700]} top={700} color={P.cream} capital={P.gold} />
          {/* Richer capitals (a second banded ring under the gold cushion) and
              flared, planted bases, so the columns read as carved stone
              members standing on the plinth, not plain tubes. */}
          {[300, 700].map((x, i) => (
            <g key={x}>
              <path d={blob(r.fork('cband' + i), x, 732, 24, 9, 6, 0.16)} fill={P.terracotta} opacity={0.4} />
              <path d={blob(r.fork('cbase' + i), x, 1086, 32, 13, 7, 0.16)} fill={P.earth} opacity={0.46} />
            </g>
          ))}

          <Chala r={r} tiers={3} color={P.terracotta} />

          {/* A moulded cornice under each of the three chala tiers — a plastered
              band plus a row of dentils — so the roof reads as finished
              brick-and-plaster construction, not a bare curved shape stacked
              three times. Widths shrink tier to tier exactly as Chala's own
              eaves do, so each band sits right under its edge. */}
          {tierGeo.map((t, i) => {
            const bandPts = ridge(r.fork('cor' + i), CX - t.half + 16, CX + t.half - 16, t.y + 10, 3, 8)
            const span = (t.half - 16) * 2 - 24
            return (
              <g key={i}>
                <Wash
                  d={smooth([...bandPts, [CX + t.half - 16, t.y + 22], [CX - t.half + 16, t.y + 22]] as Pt[], true)}
                  color={P.cream}
                  opacity={0.5}
                  rim={false}
                />
                <Ink pts={bandPts} r={r.fork('corI' + i)} width={1.8} opacity={0.38} color={P.ink} />
                <g stroke={P.terracotta} strokeWidth={1.6} opacity={0.32}>
                  {Array.from({ length: tickCounts[i] }, (_, k) => {
                    const x = CX - t.half + 28 + k * (span / (tickCounts[i] - 1))
                    return <path key={k} d={`M ${x} ${t.y + 11} L ${x} ${t.y + 21}`} />
                  })}
                </g>
              </g>
            )
          })}

          <Plinth r={r} color={P.paperDeep} />
        </g>
      )
    },
    undefined),

  make('terracotta', 'Terracotta Temple', 'Baked clay panels, every inch told a story',
    [P.clay, P.terracotta, P.earth],
    { terrain: ['river', 'plain', 'forest', 'interior'], timeOfDay: ['dawn', 'golden', 'dusk'], mood: ['nostalgic', 'grand', 'intimate'], intensity: 4, tags: ['traditional', 'terracotta', 'bishnupur', 'carved', 'earthy', 'classic'] },
    (r) => {
      const wallPts: Pt[] = [[220, BASE], [230, 640], [CX, 560], [770, 640], [780, BASE]]
      // Panel grid flanking the niche — every cell gets a carved figure, not
      // an empty outline. Two blocks (left of the niche, right of it), three
      // rows each, so nothing overlaps the arch or the pilasters.
      const leftCols = [252, 300, 348]
      const rightCols = [652, 700, 748]
      const rows = [608, 656, 704, 752, 800]
      return (
        <g>
          <Wash d={smooth(wallPts, true)} color={P.clay} opacity={0.46} />
          <Ink pts={wallPts} r={r.fork('wall')} width={3} opacity={0.4} />
          {/* Cornice band under the roofline — a plain wash would just be a
              flat cap; a dentil row of small ticks reads as moulding. */}
          <Wash d={`M 236 610 L 764 610 L 764 640 L 236 640 Z`} color={P.earth} opacity={0.32} rim={false} />
          <g stroke={P.ink} strokeWidth={2} opacity={0.4}>
            {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M ${248 + i * 32} 610 L ${248 + i * 32} 640`} />)}
          </g>
          <path d={blob(r.fork('finial'), CX, 548, 16, 22, 7, 0.28)} fill={P.earth} opacity={0.55} />

          {/* Layered voussoir arch — three receding ink bands instead of one
              flat niche silhouette, the way a real deep-cut archway steps
              inward toward the shadow. */}
          <Niche opacity={0.9} color={P.ink} />
          {[0, 1, 2].map(i => {
            const inset = i * 16
            const pts: Pt[] = [
              [NICHE.x + inset, BASE], [NICHE.x - 6 + inset, NICHE.y + 110 - inset * 0.4],
              [CX - 90 + inset, NICHE.y - 10], [CX, NICHE.y - 46 + inset * 1.6], [CX + 90 - inset, NICHE.y - 10],
              [NICHE.x + NICHE.w + 6 - inset, NICHE.y + 110 - inset * 0.4], [NICHE.x + NICHE.w - inset, BASE],
            ]
            return <Ink key={i} pts={pts} r={r.fork('vs' + i)} width={2} opacity={0.4 - i * 0.06} color={i === 0 ? P.earth : P.ink} />
          })}

          {[300, 700].map((x, i) => <Arch key={i} r={r.fork('a' + i)} cx={x} y={BASE} half={62} h={300} color={P.earth} />)}
          <Columns r={r.fork('pil')} xs={[300, 700]} top={730} color={P.cream} capital={P.gold} />

          {[...leftCols, ...rightCols].map(x => rows.map((y, ri) => (
            <g key={`${x}-${y}`}>
              <rect x={x - 20} y={y - 16} width={40} height={32} rx={3} fill="none" stroke={P.earth} strokeWidth={1.6} opacity={0.4} />
              <CarvedFigure r={r.fork(`cf${x}-${ri}`)} cx={x} cy={y} s={0.85} color={P.ink} />
            </g>
          )))}

          <Specks r={r.fork('sp1')} box={{ x: 220, y: 560, w: 560, h: 540 }} n={30} color={P.terracotta} size={4} opacity={0.18} />
          <Specks r={r.fork('sp2')} box={{ x: 220, y: 560, w: 560, h: 540 }} n={16} color={P.earth} size={2.4} opacity={0.22} />
          <Plinth r={r} color={P.earth} />
          {[280, 720].map(x => <CarvedFigure key={x} r={r.fork('pf' + x)} cx={x} cy={BASE + 30} s={0.9} color={P.paperDeep} />)}
        </g>
      )
    },
    undefined),

  make('zamindar-mansion', 'Zamindar Mansion', 'A pillared thakur dalan, faintly peeling',
    [P.cream, P.gold, P.earth],
    { terrain: ['interior', 'urban', 'plain'], timeOfDay: ['dusk', 'night', 'golden'], mood: ['nostalgic', 'grand', 'intimate'], intensity: 3, tags: ['bonedi', 'heritage', 'columns', 'gold', 'classic', 'indoor'] },
    (r) => {
      const roofPts: Pt[] = [[200, 640], [CX, 566], [800, 640]]
      const wallPts: Pt[] = [...roofPts, [800, 700], [200, 700]]
      const archesX = [311, 689]
      const peelSpots: Array<[number, number, number, number, string]> = [
        [268, 608, 32, 22, P.earth],
        [432, 652, 26, 34, P.paperDeep],
        [598, 626, 30, 20, P.earth],
        [742, 660, 20, 26, P.paperDeep],
      ]
      const railXs = Array.from({ length: 24 }, (_, i) => 232 + i * ((776 - 232) / 23))

      return (
        <g>
          <Wash d={smooth(wallPts, true)} color={P.cream} opacity={0.5} />
          <Ink pts={roofPts} r={r} width={3} opacity={0.44} />

          {/* peeling plaster: darker undercoat showing through the cream limewash */}
          {peelSpots.map(([px, py, prx, pry, col], i) => (
            <path key={i} d={blob(r.fork('peel' + i), px, py, prx, pry, 6, 0.42)} fill={col} opacity={i % 2 === 0 ? 0.24 : 0.2} />
          ))}

          {/* string-course moulding under the roofline, with a dentil row like old cornice work */}
          <Wash d={`M 214 636 L 786 636 L 786 650 L 214 650 Z`} color={P.paperDeep} opacity={0.3} rim={false} />
          <g stroke={P.inkSoft} strokeWidth={1.6} opacity={0.3}>
            {Array.from({ length: 19 }, (_, i) => <path key={i} d={`M ${222 + i * 32} 636 L ${222 + i * 32} 650`} />)}
          </g>
          {/* recessed pediment relief + a small fanlight medallion in the tympanum */}
          <Ink pts={[[240, 632], [CX, 580], [760, 632]] as Pt[]} r={r.fork('ped')} width={1.8} opacity={0.3} color={P.gold} />
          <path d={blob(r.fork('fan'), CX, 606, 20, 14, 7, 0.24)} fill={P.gold} opacity={0.3} />

          <Niche />

          <Columns r={r} xs={[250, 372, 628, 750]} top={690} color={P.cream} capital={P.gold} />

          {/* the two bay arches, each now with an inset inner band for real depth */}
          {archesX.map((x, i) => (
            <g key={i}>
              <Arch r={r.fork('ar' + i)} cx={x} y={1040} half={52} h={200} color={P.paperDeep} />
              <Arch r={r.fork('ari' + i)} cx={x} y={1040} half={36} h={150} color={P.ink} fill={false} />
            </g>
          ))}

          {/* low wrought-iron courtyard railing along the veranda edge */}
          <g>
            <Ink pts={[[224, 1052], [776, 1052]] as Pt[]} r={r.fork('railT')} width={2} opacity={0.36} color={P.ink} />
            <Ink pts={[[224, 1066], [776, 1066]] as Pt[]} r={r.fork('railB')} width={2} opacity={0.36} color={P.ink} />
            <g stroke={P.ink} strokeWidth={1.4} opacity={0.3}>
              {railXs.map((x, i) => <path key={i} d={`M ${x} 1052 L ${x} 1066`} />)}
            </g>
            {[300, 500, 700].map((x, i) => (
              <path key={i} d={blob(r.fork('finial' + i), x, 1050, 6, 6, 6, 0.3)} fill={P.gold} opacity={0.32} />
            ))}
          </g>

          {/* rising damp / moss staining near the ground, worst at the column feet */}
          {[250, 372, 628, 750].map((x, i) => (
            <path key={i} d={blob(r.fork('moss' + i), x, 1032, 13, 44, 6, 0.32)} fill={P.moss} opacity={0.17} />
          ))}
          <path d={blob(r.fork('mossc'), CX, 1062, 58, 22, 7, 0.3)} fill={P.moss} opacity={0.13} />
          <Specks r={r.fork('mspeck')} box={{ x: 220, y: 980, w: 560, h: 120 }} n={14} color={P.moss} size={2.4} opacity={0.2} />

          <Plinth r={r} color={P.cream} />
          <path d={blob(r.fork('plinthmoss'), CX, BASE + 30, 90, 13, 8, 0.3)} fill={P.moss} opacity={0.13} />
        </g>
      )
    },
    undefined),

  make('royal-palace', 'Royal Palace', 'Domes, and more gold than is strictly wise',
    [P.gold, P.cream, P.vermilion],
    { terrain: ['interior', 'plain', 'urban', 'rooftop'], timeOfDay: ['golden', 'dusk', 'night'], mood: ['grand', 'dramatic', 'festive'], intensity: 5, tags: ['palace', 'gold', 'dome', 'opulent', 'royal', 'grand'] },
    (r) => {
      const wallPts: Pt[] = [[210, BASE], [210, 700], [790, 700], [790, BASE]]
      const domes: [number, number][] = [[CX, 130], [300, 78], [700, 78]]

      // shared ogee-arch silhouette (mirrors the dome curve formula) reused for gold trim + cusped scallops
      const archPts = (cx: number, half: number, h: number, y: number): Pt[] => [
        [cx - half, y], [cx - half * 0.82, y - h * 0.58], [cx, y - h], [cx + half * 0.82, y - h * 0.58], [cx + half, y],
      ]
      const jaliDiamond = (cx: number, cy: number, s: number): Pt[] =>
        [[cx, cy - s], [cx + s * 0.68, cy], [cx, cy + s], [cx - s * 0.68, cy]]

      return (
        <g>
          <Wash d={smooth(wallPts, true)} color={P.cream} opacity={0.46} />
          <Ink pts={wallPts} r={r.fork('wallTrim')} width={2.6} opacity={0.4} color={P.gold} />

          {/* gilt cornice band with a run of beaded moulding, just under the dome springline */}
          <Wash d={`M 218 686 L 782 686 L 782 706 L 218 706 Z`} color={P.gold} opacity={0.24} rim={false} />
          {Array.from({ length: 19 }, (_, i) => {
            const bx = 226 + i * 31
            return <path key={i} d={blob(r.fork('bead' + i), bx, 706, 6, 4, 6, 0.22)} fill={P.gold} opacity={0.5} />
          })}

          {domes.map(([x, rad], i) => {
            const dr = r.fork('dome' + i)
            const y = i === 0 ? 700 : 720
            const domePts: Pt[] = [[x - rad, y], [x - rad * 0.8, y - rad * 1.1], [x, y - rad * 1.7], [x + rad * 0.8, y - rad * 1.1], [x + rad, y]]
            const bandY1 = y - rad * 0.22
            const bandY2 = y - rad * 1.36
            return (
              <g key={i}>
                <path d={smooth(domePts, true)} fill={P.gold} opacity={0.42} />
                <Ink pts={domePts} r={dr} width={2.4} opacity={0.44} />
                {/* gilt collar bands ringing each dome */}
                <Ink pts={[[x - rad * 0.94, bandY1], [x, bandY1 + rad * 0.05], [x + rad * 0.94, bandY1]] as Pt[]} r={r.fork('band1-' + i)} width={2.2} opacity={0.5} color={P.gold} />
                <Ink pts={[[x - rad * 0.5, bandY2], [x, bandY2 + rad * 0.04], [x + rad * 0.5, bandY2]] as Pt[]} r={r.fork('band2-' + i)} width={1.8} opacity={0.45} color={P.gold} />
                <Ink pts={[[x, y - rad * 1.7], [x, y - rad * 1.7 - 34]] as Pt[]} r={r.fork('spike' + i)} width={5} opacity={0.6} color={P.gold} />
                <path d={blob(r.fork('finial' + i), x, y - rad * 1.7 - 38, 8, 8, 7, 0.3)} fill={P.gold} opacity={0.65} />
              </g>
            )
          })}

          <Niche />

          {/* jali lattice screens flanking the niche */}
          {[[250, 358], [642, 750]].map(([x0, x1], pi) => {
            const cols = 4
            const rows = 3
            const cw = (x1 - x0) / cols
            const y0 = 706
            const y1 = 826
            const rh = (y1 - y0) / rows
            return (
              <g key={pi}>
                <Wash d={`M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`} color={P.cream} opacity={0.2} rim={false} />
                {Array.from({ length: rows }, (_, ri) => Array.from({ length: cols }, (_, ci) => {
                  const cx = x0 + cw * (ci + 0.5)
                  const cy = y0 + rh * (ri + 0.5)
                  const s = Math.min(cw, rh) * 0.36
                  return <Ink key={`${ri}-${ci}`} pts={jaliDiamond(cx, cy, s)} close r={r.fork(`jali${pi}${ri}${ci}`)} width={1.3} opacity={0.36} color={P.gold} />
                }))}
              </g>
            )
          })}

          <Columns r={r} xs={[262, 738]} top={700} color={P.cream} capital={P.gold} />

          {[300, 700].map((x, i) => {
            const trimPts = archPts(x, 54, 254, BASE - 4)
            const cuspPts = archPts(x, 58, 270, BASE)
            return (
              <g key={i}>
                <Arch r={r.fork('pa' + i)} cx={x} y={BASE} half={58} h={270} color={P.vermilion} />
                <Ink pts={trimPts} r={r.fork('archTrim' + i)} width={2.4} opacity={0.5} color={P.gold} />
                {cuspPts.map((p, pi) => (
                  <path key={pi} d={blob(r.fork(`cusp${i}-${pi}`), p[0], p[1], 9, 7, 7, 0.28)} fill={P.gold} opacity={0.4} />
                ))}
              </g>
            )
          })}

          <Specks r={r.fork('gsp1')} box={{ x: 210, y: 560, w: 580, h: 540 }} n={46} color={P.gold} size={3} opacity={0.2} />
          <Specks r={r.fork('gsp2')} box={{ x: 210, y: 560, w: 580, h: 540 }} n={20} color={P.gold} size={5} opacity={0.16} />
          <Specks r={r.fork('gsp3')} box={{ x: 210, y: 700, w: 580, h: 400 }} n={12} color={P.vermilion} size={2.6} opacity={0.18} />

          <Plinth r={r} color={P.gold} />
          <Specks r={r.fork('gsp4')} box={{ x: 210, y: BASE - 6, w: 580, h: 40 }} n={14} color={P.gold} size={3} opacity={0.22} />
        </g>
      )
    },
    undefined),

  make('bamboo', 'Bamboo Structure', 'Lashed poles, the way a pandal actually gets built',
    [P.moss, P.earth, P.cream],
    { terrain: ['plain', 'forest', 'river', 'urban'], timeOfDay: ['day', 'golden', 'dusk', 'night'], mood: ['intimate', 'serene', 'festive'], intensity: 2, tags: ['bamboo', 'craft', 'honest', 'lattice', 'natural', 'light'] },
    (r) => {
      const poleXs = [240, 330, 670, 760]
      const poleTones = [P.moss, P.green, P.gold, P.earth]
      const top = 610

      // a small wrapped-looking cluster of short diagonal strokes: rope/jute lashing at one joint
      const lash = (cx: number, cy: number, rng: Rng, scale = 1) => {
        const n = 4
        return (
          <g key={`lash-${cx}-${cy}`} stroke={P.inkSoft} strokeLinecap="round" fill="none" opacity={0.6}>
            {Array.from({ length: n }, (_, i) => {
              const a = (i / n) * Math.PI + rng.jitter(0.3)
              const len = (7 + rng.jitter(2)) * scale
              const dx = Math.cos(a) * len, dy = Math.sin(a) * len
              return <path key={i} d={`M ${cx - dx} ${cy - dy} L ${cx + dx} ${cy + dy}`} strokeWidth={2.2 * scale} />
            })}
          </g>
        )
      }

      // node-ring ticks along one pole - the segmented look of real cane
      const nodes = (x0: number, y0: number, x1: number, y1: number, rng: Rng) => {
        const dx = x1 - x0, dy = y1 - y0
        const len = Math.hypot(dx, dy) || 1
        const px = -dy / len, py = dx / len
        return [0.28, 0.52, 0.76].map((t, i) => {
          const cx = x0 + dx * t + rng.jitter(3), cy = y0 + dy * t + rng.jitter(3)
          const w = 9 + rng.jitter(2)
          return <path key={i} d={`M ${cx - px * w} ${cy - py * w} L ${cx + px * w} ${cy + py * w}`} />
        })
      }

      // sparse woven / thatch infill between two poles - airy basket-weave, never solid
      const weave = (x0: number, x1: number, yTop: number, yBot: number, rng: Rng) => {
        const quad: Pt[] = [[x0, yBot], [x0 + 6, yTop], [x1 - 6, yTop], [x1, yBot]]
        const span = x1 - x0
        const linesA = Array.from({ length: 5 }, (_, i) => {
          const sx = x0 + span * (i / 4) + rng.jitter(3)
          return <path key={'a' + i} d={`M ${sx} ${yBot} L ${sx + span * 0.3 + rng.jitter(3)} ${yTop}`} />
        })
        const linesB = Array.from({ length: 5 }, (_, i) => {
          const sx = x0 + span * (i / 4) + rng.jitter(3)
          return <path key={'b' + i} d={`M ${sx} ${yTop} L ${sx + span * 0.3 + rng.jitter(3)} ${yBot}`} />
        })
        return (
          <g>
            <Wash d={smooth(quad, true)} color={P.cream} opacity={0.12} rim={false} />
            <g stroke={P.gold} strokeWidth={1.4} opacity={0.24} fill="none">{linesA}</g>
            <g stroke={P.earth} strokeWidth={1.3} opacity={0.2} fill="none">{linesB}</g>
          </g>
        )
      }

      const tops = poleXs.map((x, i) => x + r.fork('top' + i).jitter(14))

      return (
        <g>
          {/* woven infill panels in the two side bays - airy basket-weave, not solid */}
          {weave(poleXs[0], poleXs[1], top, BASE, r.fork('weaveL'))}
          {weave(poleXs[2], poleXs[3], top, BASE, r.fork('weaveR'))}

          {/* main lashed poles - node rings give the segmented cane look, tone varies pole to pole */}
          {poleXs.map((x, i) => {
            const pr = r.fork('pole' + i)
            const tx = tops[i]
            return (
              <g key={i}>
                <Ink pts={[[x, BASE], [tx, top]]} r={pr} width={8} opacity={0.5} color={poleTones[i % poleTones.length]} />
                <g stroke={P.ink} strokeWidth={1.8} opacity={0.32} fill="none">{nodes(x, BASE, tx, top, pr.fork('nodes'))}</g>
              </g>
            )
          })}

          {/* horizontal rungs, lashed at select pole junctions */}
          {Array.from({ length: 6 }, (_, i) => {
            const y = 640 + i * 78
            const hr = r.fork('bh' + i)
            return (
              <Ink key={'h' + i} pts={ridge(hr, 230, 770, y, 5, 4)} r={hr} width={5.5} opacity={0.44}
                color={i % 2 ? P.moss : P.earth} />
            )
          })}
          {poleXs.flatMap((x, i) => [1, 4].map(ri => lash(x, 640 + ri * 78, r.fork(`lj${i}${ri}`))))}

          {/* ridge pole and the diagonal bracing that ties the roof together */}
          <Ink pts={[[200, 620], [CX, 540], [800, 620]] as Pt[]} r={r.fork('ridge')} width={7} opacity={0.5} color={P.moss} />
          {Array.from({ length: 9 }, (_, i) => (
            <path key={'d' + i} d={`M ${230 + i * 68} 616 L ${CX} 548`} stroke={P.earth} strokeWidth={2.6} opacity={0.4} fill="none" />
          ))}
          {lash(CX, 548, r.fork('apex'), 1.3)}
          {poleXs.map((x, i) => lash(x, top, r.fork('apexj' + i)))}

          <Niche opacity={0.22} />
          <Plinth r={r} color={P.earth} />

          {/* small tied bamboo bundles echoed at the plinth - repetition with variation, terracotta-lesson style */}
          {[280, 720].map((x, i) => (
            <g key={x}>
              <Ink pts={[[x - 10, BASE + 44], [x - 10, BASE - 4]]} r={r.fork('pb' + i + 'a')} width={5} opacity={0.42} color={P.moss} />
              <Ink pts={[[x + 10, BASE + 44], [x + 10, BASE - 4]]} r={r.fork('pb' + i + 'b')} width={5} opacity={0.42} color={P.gold} />
              {lash(x, BASE + 14, r.fork('pbl' + i), 0.8)}
            </g>
          ))}
        </g>
      )
    },
    undefined),

  make('geometric', 'Geometric Structure', 'Folded planes — the theme pandal school',
    [P.indigo, P.paperDeep, P.vermilion],
    { terrain: ['urban', 'rooftop', 'plain', 'sea'], timeOfDay: ['dusk', 'night', 'day'], mood: ['dramatic', 'grand'], intensity: 4, tags: ['modern', 'contemporary', 'angular', 'bold', 'theme', 'art'] },
    (r) => {
      const poly = (pts: Pt[]) => 'M ' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ') + ' Z'
      const baseAccentPts: Pt[] = [[CX - 60, BASE + 34], [CX + 60, BASE + 34]]
      return (
        <g>
          {[0, 1, 2, 3, 4].map(i => {
            const gr = r.fork('g' + i)
            const half = 300 - i * 46
            const y = BASE - i * 96
            const bl: Pt = [CX - half, y]
            const tl: Pt = [CX - half * 0.5, y - 150]
            const trr: Pt = [CX + half * 0.5, y - 150]
            const br: Pt = [CX + half, y]
            // fold seam leans off-centre per tier — a hinge, not a symmetric split
            const lean = gr.jitter(half * 0.08)
            const ridgeTop: Pt = [CX + lean, y - 150]
            const ridgeBot: Pt = [CX + lean * 0.4, y]
            const outline: Pt[] = [bl, tl, trr, br]
            const baseHue = i % 2 ? P.indigo : P.paperDeep
            const lightEdge = i === 1 || i === 3
            return (
              <g key={i}>
                {/* two flat, hard-edged facets sharing one pigment but different wash
                    strength — the near-side catches less light, reads darker */}
                <Wash d={poly([bl, tl, ridgeTop, ridgeBot])} color={baseHue} opacity={0.4} rim={false} />
                <Wash d={poly([ridgeBot, ridgeTop, trr, br])} color={baseHue} opacity={0.22} rim={false} />
                <Ink pts={outline} r={gr} width={2.4} opacity={0.42} />
                {/* the crease itself */}
                <Ink pts={[ridgeTop, ridgeBot]} r={gr.fork('crease')} width={2.1} opacity={0.4} color={P.ink} />
                {/* exposed diagonal brace on alternating tiers — theme-pandal scaffolding */}
                {i % 2 === 0 && (
                  <Ink pts={[bl, ridgeTop]} r={gr.fork('strut')} width={1.4} opacity={0.24} color={P.ink} />
                )}
                {/* rivets holding the fold together */}
                {[0.22, 0.5, 0.78].map((t, ri) => {
                  const rx = ridgeTop[0] + (ridgeBot[0] - ridgeTop[0]) * t
                  const ry = ridgeTop[1] + (ridgeBot[1] - ridgeTop[1]) * t
                  return <path key={ri} d={blob(gr.fork('rv' + ri), rx, ry, 3.6, 3.6, 5, 0.3)} fill={P.ink} opacity={0.45} />
                })}
                {/* vermilion light-strip along the lit edge, a couple of tiers only */}
                {lightEdge && (
                  <Ink pts={[trr, br]} r={gr.fork('strip')} width={3} opacity={0.55} color={P.vermilion} />
                )}
              </g>
            )
          })}
          <Niche opacity={0.26} />
          <path d={`M ${CX} 560 l 0 -70`} stroke={P.vermilion} strokeWidth={7} opacity={0.6} strokeLinecap="round" />
          <path d={`M ${CX - 40} 558 l 26 20 M ${CX + 40} 558 l -26 20`} stroke={P.vermilion} strokeWidth={3} opacity={0.4} strokeLinecap="round" />
          {/* the same accent material echoed down at the plinth */}
          <Ink pts={baseAccentPts} r={r.fork('baseAccent')} width={2.4} opacity={0.35} color={P.vermilion} />
          <Plinth r={r} color={P.indigo} />
        </g>
      )
    },
    undefined),

  make('floral-structure', 'Giant Floral Structure', 'A pandal built as one enormous opening flower',
    [P.rose, P.marigold, P.moss],
    { terrain: ['plain', 'forest', 'river', 'urban'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['festive', 'serene', 'grand'], intensity: 4, tags: ['flower', 'petal', 'soft', 'organic', 'colour', 'art'] },
    (r) => {
      const CY = 1010
      const outerN = 9
      const innerN = 7

      const makePetal = (a: number, baseR: number, tipR: number, halfW: number, bend: number) => {
        const cos = Math.cos(a), sin = Math.sin(a)
        const nx = -sin, ny = cos
        const midR = baseR + (tipR - baseR) * 0.55
        const baseC: Pt = [CX + cos * baseR * 0.75, CY + sin * baseR * 0.75]
        const midC: Pt = [CX + cos * midR, CY + sin * midR]
        const tip: Pt = [CX + cos * tipR + nx * bend, CY + sin * tipR + ny * bend]
        const outline: Pt[] = [
          [baseC[0] + nx * halfW * 0.35, baseC[1] + ny * halfW * 0.35],
          [midC[0] + nx * halfW, midC[1] + ny * halfW],
          tip,
          [midC[0] - nx * halfW, midC[1] - ny * halfW],
          [baseC[0] - nx * halfW * 0.35, baseC[1] - ny * halfW * 0.35],
        ]
        const vein: Pt[] = [baseC, midC, tip]
        return { outline, vein }
      }

      const outer = Array.from({ length: outerN }, (_, i) => {
        const a = -Math.PI + (i / (outerN - 1)) * Math.PI
        const pr = r.fork('petal' + i)
        const baseR = 106 + pr.jitter(10)
        const tipR = baseR + 205 + pr.jitter(45)
        const halfW = 42 + pr.jitter(12)
        const bend = pr.jitter(18)
        const { outline, vein } = makePetal(a, baseR, tipR, halfW, bend)
        const color = i % 2 ? P.rose : P.marigold
        return (
          <g key={i}>
            <Wash d={smooth(outline, true)} color={color} opacity={0.5 + pr.jitter(0.06)} />
            <Ink pts={outline} r={pr.fork('ink')} close width={1.8} opacity={0.36} color={P.ink} />
            <Ink pts={vein} r={pr.fork('vein')} width={1.3} opacity={0.28} color={P.ink} />
          </g>
        )
      })

      const inner = Array.from({ length: innerN }, (_, i) => {
        const a = -Math.PI + 0.22 + (i / (innerN - 1)) * (Math.PI - 0.44)
        const pr = r.fork('ipetal' + i)
        const baseR = 90 + pr.jitter(8)
        const tipR = baseR + 118 + pr.jitter(28)
        const halfW = 26 + pr.jitter(7)
        const bend = pr.jitter(10)
        const { outline, vein } = makePetal(a, baseR, tipR, halfW, bend)
        return (
          <g key={i}>
            <Wash d={smooth(outline, true)} color={P.gold} opacity={0.58} />
            <Ink pts={outline} r={pr.fork('ink')} close width={1.5} opacity={0.34} color={P.earth} />
            <Ink pts={vein} r={pr.fork('vein')} width={1.1} opacity={0.26} color={P.earth} />
          </g>
        )
      })

      const leafCfg: Array<[number, number, number, number, number]> = [
        [-Math.PI - 0.34, 92, 244, 58, 14],
        [0.34, 92, 244, 58, -14],
        [-Math.PI - 0.12, 78, 168, 40, 8],
        [0.12, 78, 168, 40, -8],
      ]
      const leaves = leafCfg.map(([a, baseR, tipR, halfW, bend], i) => {
        const pr = r.fork('leaf' + i)
        const { outline, vein } = makePetal(a, baseR + pr.jitter(6), tipR + pr.jitter(16), halfW + pr.jitter(6), bend)
        return (
          <g key={i}>
            <Wash d={smooth(outline, true)} color={P.moss} opacity={0.46} />
            <Ink pts={outline} r={pr.fork('ink')} close width={1.6} opacity={0.32} color={P.ink} />
            <Ink pts={vein} r={pr.fork('vein')} width={1.1} opacity={0.24} color={P.ink} />
          </g>
        )
      })

      const stamens = Array.from({ length: 16 }, (_, i) => {
        const a = -Math.PI + (i / 15) * Math.PI
        const pr = r.fork('stamen' + i)
        const len = 46 + pr.jitter(20)
        const tip: Pt = [CX + Math.cos(a) * len, CY + Math.sin(a) * len]
        const base: Pt = [CX + Math.cos(a) * 14, CY + Math.sin(a) * 14]
        return (
          <g key={i}>
            <Ink pts={[base, tip]} r={pr.fork('line')} width={1.4} opacity={0.3} color={P.earth} />
            <path d={blob(pr.fork('anther'), tip[0], tip[1], 6, 6, 6, 0.3)} fill={P.gold} opacity={0.55} />
          </g>
        )
      })

      return (
        <g>
          {leaves}
          {outer}
          {inner}
          <Niche opacity={0.22} />
          <path d={blob(r.fork('core'), CX, CY, 168, 138, 11, 0.18)} fill={P.marigold} opacity={0.32} />
          <Ink pts={[[CX - 150, CY], [CX, CY - 128], [CX + 150, CY], [CX, CY + 128], [CX - 150, CY]]} r={r.fork('coreRim')} width={2} opacity={0.3} color={P.earth} />
          {stamens}
          <Specks r={r.fork('sp1')} box={{ x: 200, y: 700, w: 600, h: 380 }} n={26} color={P.gold} size={3.2} opacity={0.2} />
          <Specks r={r.fork('sp2')} box={{ x: 220, y: 740, w: 560, h: 320 }} n={14} color={P.rose} size={1.8} opacity={0.22} />
          <Plinth r={r} color={P.moss} />
        </g>
      )
    },
    undefined),

  make('ruins', 'Ancient Ruins', 'Whatever is left, made sacred again',
    [P.slate, P.moss, P.earth],
    { terrain: ['forest', 'mountain', 'plain', 'sea'], timeOfDay: ['dawn', 'dusk', 'night'], mood: ['mystic', 'dramatic', 'nostalgic'], intensity: 3, tags: ['ruin', 'stone', 'broken', 'moss', 'ancient', 'wild'] },
    (r) => {
      const ar = r.fork('wall')
      const aj = (amt: number) => ar.jitter(amt)
      // Broken archway: the crown is not a clean point — a keystone is
      // missing (deep sag at centre), one jagged shard still stands higher
      // to one side, and the whole top line wanders instead of arcing smoothly.
      const archPts: Pt[] = [
        [300, BASE],
        [296 + aj(4), 852 + aj(10)],
        [332 + aj(6), 758 + aj(14)],
        [366 + aj(6), 636 + aj(16)],
        [408 + aj(8), 758 + aj(18)],
        [456 + aj(6), 556 + aj(14)],
        [500 + aj(6), 706 + aj(20)],
        [546 + aj(6), 610 + aj(14)],
        [588 + aj(6), 726 + aj(16)],
        [630 + aj(6), 800 + aj(12)],
        [670 + aj(4), 862 + aj(10)],
        [700, BASE],
      ]

      const sideRuins = [[250, 340], [750, 420]].map(([x, h], i) => {
        const sr = r.fork('side' + i)
        const sj = (amt: number) => sr.jitter(amt)
        const topY = BASE - h
        const pts: Pt[] = [
          [x - 42, BASE],
          [x - 40 + sj(4), BASE - h * 0.55 + sj(10)],
          [x - 30 + sj(6), topY + 30 + sj(14)],
          [x - 6 + sj(6), topY - 8 + sj(12)],
          [x + 14 + sj(6), topY + 44 + sj(16)],
          [x + 34 + sj(5), BASE - h * 0.5 + sj(10)],
          [x + 42, BASE],
        ]
        return (
          <g key={i}>
            <Wash d={smooth(pts, true)} color={P.slate} opacity={0.4} />
            <Ink pts={pts} r={sr} width={2.2} opacity={0.44} />
          </g>
        )
      })

      // Weathering streaks — centuries of rain run-off, soft vertical stains.
      const streakXs = [250, 340, 420, 580, 660, 750]
      const streaks = streakXs.map((x, i) => {
        const sk = r.fork('streak' + i)
        const topY = BASE - (x < 300 ? 300 : x > 700 ? 380 : 560) + sk.jitter(40)
        const pts: Pt[] = [[x - 7, topY], [x + 7, topY], [x + 5, BASE - 4], [x - 5, BASE - 4]]
        return <Wash key={i} d={smooth(pts, true)} color={P.ink} opacity={0.12} rim={false} />
      })

      // Cracks — thin dark hairlines, some branching, running down the stone.
      const crack1: Pt[] = [[386, 700], [394, 758], [376, 818], [396, 878], [372, 946], [388, BASE - 20]]
      const crack1b: Pt[] = [[394, 758], [422, 792], [444, 832]]
      const crack2: Pt[] = [[612, 668], [602, 732], [628, 792], [604, 862], [624, 940], [606, BASE - 26]]
      const crackL: Pt[] = [[240, BASE - 258], [250, BASE - 196], [234, BASE - 132], [248, BASE - 66]]
      const crackR: Pt[] = [[742, BASE - 318], [752, BASE - 250], [736, BASE - 178], [750, BASE - 88]]

      // Ivy climbing the left flank — thin curved stems with small leaves,
      // distinct from the broad moss patches below.
      const vine1: Pt[] = [[218, BASE + 6], [226, BASE - 62], [210, BASE - 138], [228, BASE - 212], [212, BASE - 282]]
      const vine2: Pt[] = [[294, BASE - 36], [310, BASE - 134], [296, BASE - 224], [314, BASE - 314], [300, BASE - 392]]

      const mossMain = Array.from({ length: 6 }, (_, i) => {
        const mr = r.fork('moss' + i)
        const d = blob(mr, mr.range(240, 760), mr.range(680, 1080), mr.range(24, 52), mr.range(15, 30), 7, 0.4)
        return <path key={i} d={d} fill={mr() > 0.5 ? P.moss : P.green} />
      })
      const mossFuzz = Array.from({ length: 8 }, (_, i) => {
        const mr = r.fork('fuzz' + i)
        const d = blob(mr, mr.range(300, 700), mr.range(600, 780), mr.range(8, 16), mr.range(5, 10), 6, 0.4)
        return <path key={i} d={d} fill={P.moss} />
      })

      // Fallen stone — chunks that broke from the crown, now rubble at the base.
      const rubble: Pt[] = [[236, BASE + 18], [318, BASE + 8], [468, BASE + 22], [560, BASE + 6], [648, BASE + 16], [764, BASE + 10]]

      return (
        <g>
          <Wash d={smooth(archPts, true)} color={P.slate} opacity={0.4} />
          <Ink pts={archPts} r={ar} width={2.6} opacity={0.46} />

          {sideRuins}

          {streaks}

          <Ink pts={crack1} r={r.fork('c1')} width={1.4} opacity={0.55} color={P.ink} />
          <Ink pts={crack1b} r={r.fork('c1b')} width={1} opacity={0.4} color={P.ink} />
          <Ink pts={crack2} r={r.fork('c2')} width={1.4} opacity={0.52} color={P.ink} />
          <Ink pts={crackL} r={r.fork('cl')} width={1.2} opacity={0.48} color={P.ink} />
          <Ink pts={crackR} r={r.fork('cr')} width={1.2} opacity={0.48} color={P.ink} />

          <Niche opacity={0.26} />

          <g opacity={0.36}>{mossMain}</g>
          <g opacity={0.4}>{mossFuzz}</g>

          <Ink pts={vine1} r={r.fork('v1')} width={1.8} opacity={0.5} color={P.green} />
          <Ink pts={vine2} r={r.fork('v2')} width={1.8} opacity={0.5} color={P.green} />
          <g opacity={0.55}>
            {vine1.slice(1).map((p, i) => (
              <path key={'l1' + i} d={blob(r.fork('leaf1' + i), p[0] + (i % 2 ? 9 : -9), p[1] + 4, 8, 5.5, 5, 0.32)} fill={i % 2 ? P.moss : P.green} />
            ))}
            {vine2.slice(1).map((p, i) => (
              <path key={'l2' + i} d={blob(r.fork('leaf2' + i), p[0] + (i % 2 ? -9 : 9), p[1] + 4, 8, 5.5, 5, 0.32)} fill={i % 2 ? P.green : P.moss} />
            ))}
          </g>

          {rubble.map((p, i) => {
            const rb = r.fork('rubble' + i)
            return <Wash key={i} d={blob(rb, p[0], p[1], rb.range(18, 32), rb.range(11, 18), 5, 0.18)} color={i % 2 ? P.earth : P.slate} opacity={0.42} />
          })}

          <Specks r={r.fork('sp1')} box={{ x: 200, y: 560, w: 600, h: 560 }} n={26} color={P.earth} size={3.2} opacity={0.16} />
          <Specks r={r.fork('sp2')} box={{ x: 200, y: 560, w: 600, h: 560 }} n={14} color={P.ink} size={2} opacity={0.14} />

          <Plinth r={r} color={P.slate} />

          <path d={blob(r.fork('pmoss1'), 260, BASE + 40, 20, 12, 6, 0.35)} fill={P.moss} opacity={0.4} />
          <path d={blob(r.fork('pmoss2'), 720, BASE + 44, 22, 13, 6, 0.35)} fill={P.green} opacity={0.36} />
        </g>
      )
    },
    undefined),

  make('monastery', 'Monastery Form', 'Tiered eaves borrowed from the high hills',
    [P.vermilion, P.cream, P.gold],
    { terrain: ['mountain', 'forest'], timeOfDay: ['dawn', 'day', 'golden', 'night'], mood: ['serene', 'mystic', 'grand'], intensity: 3, tags: ['mountain', 'tiered', 'himalaya', 'calm', 'gompa', 'red'] },
    (r) => {
      const wallPts: Pt[] = [[240, BASE], [250, 660], [750, 660], [760, BASE]]
      const bandPts: Pt[] = [[250, 660], [750, 660], [752, 762], [248, 762]]
      const tassel = (cx: number, cy: number, rt: Rng, scale = 1) => (
        <g key={`ts-${cx}-${cy}`}>
          <Ink pts={[[cx, cy], [cx, cy + 9 * scale]]} r={rt.fork('cord')} width={1.2} opacity={0.32} color={P.inkSoft} />
          <path d={blob(rt.fork('bell'), cx, cy + 13 * scale, 5 * scale, 7 * scale, 6, 0.22)} fill={P.gold} opacity={0.5} />
        </g>
      )
      const flagColors = [P.blue, P.cream, P.red, P.moss, P.amber]
      const flagString = (rid: string, x1: number, x2: number, y: number, sag: number, n: number, size: number) => {
        const line = ridge(r.fork(rid), x1, x2, y, sag, n)
        return (
          <g key={rid}>
            <Ink pts={line} r={r.fork(rid + 'k')} width={1.3} opacity={0.4} color={P.inkSoft} />
            {line.filter((_, i) => i % 2 === 0).map((p, i) => (
              <path key={i} d={blob(r.fork(rid + 'f' + i), p[0], p[1] + size * 0.7, size * 0.55, size * 0.8, 3, 0.3)} fill={flagColors[i % flagColors.length]} opacity={0.55} />
            ))}
          </g>
        )
      }
      return (
        <g>
          <Wash d={smooth(wallPts, true)} color={P.cream} opacity={0.46} />
          <Wash d={smooth(bandPts, true)} color={P.red} opacity={0.42} />
          <Ink pts={ridge(r.fork('trimTop'), 250, 750, 660, 3, 12)} r={r.fork('trimTopK')} width={2} opacity={0.45} color={P.gold} />
          <Ink pts={ridge(r.fork('trimBot'), 248, 752, 762, 3, 12)} r={r.fork('trimBotK')} width={2} opacity={0.4} color={P.gold} />
          {[0, 1, 2].map(i => {
            const tr = r.fork('t' + i)
            const y = 690 - i * 110
            const half = 310 - i * 66
            const pts: Pt[] = [[CX - half, y], [CX - half * 0.6, y - 40], [CX, y - 58], [CX + half * 0.6, y - 40], [CX + half, y]]
            return (
              <g key={i}>
                <Wash d={smooth([...pts, [CX + half - 20, y + 26], [CX - half + 20, y + 26]] as Pt[], true)} color={P.vermilion} opacity={0.4} />
                <Ink pts={pts} r={tr} width={2.4} opacity={0.44} />
                {i === 0 && [-0.55, -0.18, 0.18, 0.55].map((f, ti) => tassel(CX + f * half, y + 10, r.fork(`ts0-${ti}`), 1))}
                {i === 1 && [-0.5, 0, 0.5].map((f, ti) => tassel(CX + f * half, y + 8, r.fork(`ts1-${ti}`), 0.8))}
              </g>
            )
          })}
          {flagString('flagA', CX - 200, CX + 200, 500, 16, 9, 9)}
          {flagString('flagB', CX - 300, CX + 300, 655, 22, 13, 10)}
          <Niche />
          {[330, 670].map((x, wi) => {
            const rw = r.fork('win' + wi)
            return (
              <g key={wi}>
                <Wash d={smooth([[x - 27, 772], [x + 27, 772], [x + 27, 852], [x - 27, 852]] as Pt[], true)} color={P.earth} opacity={0.55} />
                <path d={blob(rw.fork('hood'), x, 764, 30, 12, 3, 0.2)} fill={P.earth} opacity={0.5} />
                <Wash d={smooth([[x - 21, 780], [x + 21, 780], [x + 21, 846], [x - 21, 846]] as Pt[], true)} color={P.gold} opacity={0.42} />
                <Ink pts={[[x, 780], [x, 846]]} r={rw.fork('mv')} width={1.4} opacity={0.35} color={P.ink} />
                <Ink pts={[[x - 21, 802], [x + 21, 802]]} r={rw.fork('mh1')} width={1.4} opacity={0.35} color={P.ink} />
                <Ink pts={[[x - 21, 824], [x + 21, 824]]} r={rw.fork('mh2')} width={1.4} opacity={0.35} color={P.ink} />
              </g>
            )
          })}
          <Specks r={r.fork('sp1')} box={{ x: 240, y: 660, w: 520, h: 440 }} n={22} color={P.gold} size={2.6} opacity={0.16} />
          <Plinth r={r} color={P.paperDeep} />
        </g>
      )
    },
    undefined),

  make('minimal', 'Minimal Pandal', 'One frame. Nothing else. Let her be the thing',
    [P.paperDeep, P.ink, P.cream],
    { terrain: ['sea', 'mountain', 'rooftop', 'plain', 'river'], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['serene', 'intimate'], intensity: 1, tags: ['minimal', 'quiet', 'modern', 'restraint', 'clean', 'light'] },
    (r) => {
      const framePts: Pt[] = [[296, BASE], [316, 640], [684, 640], [704, BASE]]
      const inlayPts: Pt[] = [[312, BASE - 8], [332, 658], [668, 658], [688, BASE - 8]]
      const footL: Pt[] = [[281, BASE - 4], [311, BASE - 4]]
      const footR: Pt[] = [[689, BASE - 4], [719, BASE - 4]]
      return (
        <g>
          <Wash d={smooth(framePts, true)} color={P.paperDeep} opacity={0.22} rim={false} />
          <Ink pts={framePts} r={r.fork('frame')} width={7} opacity={0.5} color={P.ink} />
          <Ink pts={inlayPts} r={r.fork('inlay')} width={1.4} opacity={0.16} color={P.gold} />
          <Ink pts={footL} r={r.fork('footL')} width={4} opacity={0.3} color={P.ink} />
          <Ink pts={footR} r={r.fork('footR')} width={4} opacity={0.3} color={P.ink} />
          <Niche opacity={0.14} />
          <Plinth r={r} color={P.cream} />
        </g>
      )
    },
    undefined),

  make('wooden', 'Wooden Bengal', 'Plank and gable, silvered by weather',
    [P.earth, P.clay, P.moss],
    { terrain: ['forest', 'plain', 'river', 'mountain'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['intimate', 'nostalgic', 'serene'], intensity: 2, tags: ['wood', 'warm', 'rustic', 'craft', 'natural', 'village'] },
    (r) => {
      const wallPts: Pt[] = [[230, BASE], [240, 700], [CX, 588], [760, 700], [770, BASE]]
      const lineXs = [256, 318, 380, 442, 504, 566, 628, 690]
      const panelXs = [240, ...lineXs, 760]
      const nailRows = [742, 858, 974, 1060]
      return (
        <g>
          <Wash d={smooth(wallPts, true)} color={P.earth} opacity={0.4} />
          <Ink pts={wallPts} r={r.fork('wall')} width={2.8} opacity={0.46} />

          {panelXs.slice(0, -1).map((xl, i) => {
            const xr = panelXs[i + 1]
            const pick = r.fork('tone' + i)()
            const tone = pick < 0.26 ? P.cream : pick < 0.48 ? P.ink : null
            if (!tone) return null
            const d = `M ${xl} 700 L ${xr} 700 L ${xr} ${BASE} L ${xl} ${BASE} Z`
            return <Wash key={i} d={d} color={tone} opacity={pick < 0.26 ? 0.2 : 0.15} rim={false} />
          })}

          {lineXs.map((x, i) => (
            <Ink key={i} pts={[[x, 700], [x, BASE]] as Pt[]} r={r.fork('joint' + i)} width={2.2} opacity={0.32} color={P.ink} />
          ))}

          {panelXs.slice(0, -1).map((xl, i) => {
            const xr = panelXs[i + 1]
            if (xr - xl < 30 || r.fork('grainpick' + i)() > 0.6) return null
            const grng = r.fork('grain' + i)
            const w = xr - xl
            return [0.32, 0.62].map((f, gi) => {
              const gx = xl + w * f
              const pts: Pt[] = [
                [gx, 712], [gx + grng.jitter(4), 830], [gx + grng.jitter(5), 950],
                [gx + grng.jitter(4), 1040], [gx, BASE - 10],
              ]
              return <Ink key={`${i}-${gi}`} pts={pts} r={grng.fork('l' + gi)} width={1} opacity={0.14} color={P.earth} />
            })
          })}

          {lineXs.map((x, li) => nailRows.map((y, yi) => (
            <path key={`${li}-${yi}`} d={blob(r.fork(`nail${li}-${yi}`), x, y, 2.6, 2.6, 6, 0.3)} fill={P.ink} opacity={0.4} />
          )))}

          <Specks r={r.fork('sp1')} box={{ x: 230, y: 600, w: 540, h: 500 }} n={22} color={P.earth} size={2.6} opacity={0.16} />

          <Wash
            d={smooth([[CX - 165, 668], [CX - 150, 655], [CX, 552], [CX + 150, 655], [CX + 165, 668]] as Pt[], true)}
            color={P.clay}
            opacity={0.5}
          />
          <Ink
            pts={[[CX - 175, 662], [CX - 88, 674], [CX, 680], [CX + 88, 674], [CX + 175, 662]] as Pt[]}
            r={r.fork('eave')}
            width={2.6}
            opacity={0.48}
            color={P.earth}
          />
          <path d={blob(r.fork('ridge'), CX, 560, 9, 13, 6, 0.3)} fill={P.ink} opacity={0.38} />

          <Niche opacity={0.3} />
          <Plinth r={r} color={P.earth} />
        </g>
      )
    },
    undefined),

  make('toran', 'Ceremonial Arch', 'A single enormous gateway, and she is through it',
    [P.marigold, P.vermilion, P.gold],
    { terrain: ['urban', 'plain', 'river', 'rooftop'], timeOfDay: ['golden', 'dusk', 'night'], mood: ['festive', 'grand', 'dramatic'], intensity: 4, tags: ['arch', 'gate', 'toran', 'festive', 'colour', 'welcome'] },
    (r) => {
      // A single small local helper: one marigold "flower" built from several
      // overlapping layered-petal blobs (not a flat dot) — reused all along the
      // garland string.
      const marigold = (fr: Rng, fx: number, fy: number, s: number) => (
        <g key={`mg-${fx.toFixed(0)}-${fy.toFixed(0)}`}>
          <path d={blob(fr.fork('op'), fx, fy, 11 * s, 9 * s, 8, 0.3)} fill={P.marigold} opacity={0.5} />
          {Array.from({ length: 6 }, (_, k) => {
            const pa = (k / 6) * Math.PI * 2 + fr.jitter(0.35)
            const px = fx + Math.cos(pa) * 7 * s
            const py = fy + Math.sin(pa) * 6 * s
            return <path key={k} d={blob(fr.fork('pp' + k), px, py, 4 * s, 3 * s, 5, 0.3)} fill={P.amber} opacity={0.5} />
          })}
          <path d={blob(fr.fork('ct'), fx, fy, 3 * s, 2.6 * s, 6, 0.25)} fill={P.vermilion} opacity={0.55} />
        </g>
      )

      // A small mango-leaf toran frond, tip hanging down from the crossbeam.
      const frond = (fr: Rng, fx: number, fy: number, len: number, tilt: number, color: string) => {
        const pts: Pt[] = [
          [0, 0], [len * 0.3, len * 0.34], [len * 0.16, len * 0.66], [0, len],
          [-len * 0.16, len * 0.66], [-len * 0.3, len * 0.34],
        ]
        return (
          <g key={`fr-${fx.toFixed(0)}`} transform={`translate(${fx} ${fy}) rotate(${tilt})`}>
            <Wash d={smooth(pts, true)} color={color} opacity={0.4} />
            <Ink pts={[[0, 4], [0, len - 4]]} r={fr.fork('vein')} width={1.4} opacity={0.32} color={P.ink} />
          </g>
        )
      }

      // A little bell-and-fringe tassel where an arch column meets the ground.
      const tassel = (fr: Rng, tx: number, ty: number, color: string) => (
        <g key={`ts-${tx.toFixed(0)}-${ty.toFixed(0)}`}>
          <path d={blob(fr.fork('kn'), tx, ty, 4, 5, 6, 0.22)} fill={P.gold} opacity={0.5} />
          <path d={blob(fr.fork('bl'), tx, ty + 15, 9, 11, 7, 0.26)} fill={color} opacity={0.5} />
          {[-3, 0, 3].map((dx, k) => (
            <Ink key={k} pts={[[tx + dx, ty + 24], [tx + dx * 1.4 + fr.jitter(2), ty + 40]]}
              r={fr.fork('fringe' + k)} width={1.3} opacity={0.36} color={color} />
          ))}
        </g>
      )

      // Positions for the garland string: it traces just inside the outer arch's
      // curve, sagging in scalloped loops the way a strung garland really hangs
      // between mounting points rather than sitting on a rigid arc.
      const garlandN = 13
      const garland: Pt[] = Array.from({ length: garlandN }, (_, i) => {
        const t = i / (garlandN - 1)
        const a = Math.PI + t * Math.PI
        const gx = CX + Math.cos(a) * 226
        const gy = BASE - 250 + Math.sin(a) * 254 + Math.abs(Math.sin(t * Math.PI * 4.5)) * 9
        return [gx, gy]
      })

      const frondXs = [330, 372, 414, 456, CX, 544, 586, 628, 670]

      const tasselSpots: { x: number; color: string }[] = [
        { x: 238, color: P.vermilion }, { x: 762, color: P.vermilion },
        { x: 324, color: P.marigold }, { x: 676, color: P.marigold },
      ]

      return (
        <g>
          <Arch r={r.fork('outer')} cx={CX} y={BASE} half={262} h={540} color={P.marigold} />
          <Arch r={r.fork('inner')} cx={CX} y={BASE} half={176} h={410} color={P.vermilion} />
          <Niche opacity={0.26} />
          {/* a third, smaller arch glimpsed past the threshold — the same
              receding-depth trick as the terracotta pandal's layered niche */}
          <Arch r={r.fork('innermost')} cx={CX} y={BASE} half={116} h={320} color={P.gold} />

          {/* crossbeam + hanging mango-leaf fronds along the very top of the gate */}
          <Ink pts={[[326, 552], [CX, 540], [674, 552]]} r={r.fork('beam')} width={3} opacity={0.4} color={P.earth} />
          {frondXs.map((x, i) =>
            frond(r.fork('frond' + i), x, 550, 46 + (i % 2) * 8, (i - 4) * 4, i % 2 ? P.green : P.moss))}

          {/* the strung marigold cord, then real layered-petal flowers along it */}
          <Ink pts={garland} r={r.fork('cord')} width={1.6} opacity={0.3} color={P.earth} />
          {garland.map(([gx, gy], i) => marigold(r.fork('mg' + i), gx, gy, 0.95 + (i % 3) * 0.08))}

          {/* a couple of tassels hanging at the base of each arch's columns */}
          {tasselSpots.map((t, i) => tassel(r.fork('tassel' + i), t.x, BASE - 70, t.color))}

          <Specks r={r.fork('sp1')} box={{ x: 200, y: 560, w: 600, h: 560 }} n={26} color={P.marigold} size={3.4} opacity={0.16} />
          <Specks r={r.fork('sp2')} box={{ x: 200, y: 560, w: 600, h: 560 }} n={14} color={P.gold} size={2.2} opacity={0.2} />

          <Plinth r={r} color={P.vermilion} />

          {/* fallen marigold petals scattered on the plinth, echoing the garland */}
          {Array.from({ length: 7 }, (_, i) => {
            const px = 260 + i * 70 + r.jitter(20)
            const py = BASE + 26 + r.jitter(10)
            return <path key={'pet' + i} d={blob(r.fork('pet' + i), px, py, 6, 4.5, 6, 0.3)} fill={i % 2 ? P.marigold : P.vermilion} opacity={0.3} />
          })}
        </g>
      )
    },
    undefined),
]
