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
 * board behind, and (see the face block inside Pratima) the long kohl-swept
 * eyes, arched brows, third eye and small vermilion lips of a traditional
 * Kumartuli face — brushed in with washes and low-opacity ink rather than
 * drawn hard-edged, so it still reads as painted, not as clip-art.
 */
/**
 * Four independent personality axes — hair, eye character, sari drape, and
 * jewellery — mixed and matched per idol so 12 genuinely different-looking
 * figures come from combining a small reusable set, rather than 12 bespoke
 * drawings. See `Hair`, `EYE_STYLES`, `SariPattern`, `Jewellery` below.
 */
type HairStyle = 'flowing-center-part' | 'single-braid' | 'low-bun' | 'loose-wavy' | 'covered' | 'layered-elaborate'
type EyeStyle = 'soft' | 'aesthetic' | 'fierce' | 'gentle'
type SariStyle = 'plain-pleats' | 'floral-border' | 'striped-aanchal' | 'temple-motif' | 'zari-heavy' | 'checked-folk'
type JewelStyle = 'minimal' | 'temple-heavy' | 'floral' | 'layered-modern' | 'folk-simple'

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
  /** Hairstyle archetype. Defaults to 'flowing-center-part'. */
  hair?: HairStyle
  /** Hair colour — an existing P.* token, so hair stays inside the same
   *  limited palette everything else is drawn from. Defaults to P.ink. */
  hairColor?: string
  /** Personality modifier applied to the existing kohl-sweep eye code — does
   *  not change its structure, only its numbers. Defaults to 'aesthetic',
   *  which reproduces the original hardcoded eyes bit-for-bit. */
  eyeStyle?: EyeStyle
  /** Sari drape/fold + hem-border treatment. Defaults to 'plain-pleats'
   *  (the original 3-line fold + dashed hem). */
  sariPattern?: SariStyle
  /** Necklace/waistband/armband ornament set. Defaults to 'minimal'. */
  jewellery?: JewelStyle
}

/**
 * A small traditional item at one hand — chakra, bow, blade, mace, lotus,
 * conch — cycled across the fan of arms so ten hands read as "carrying ten
 * different things," not ten identical fists. The trishul (always the
 * fixed upper-right hand, drawn separately below) is skipped here so nothing
 * doubles up on that one arm.
 */
function HandItem({ r, kind, x, y, s, color }: { r: Rng; kind: number; x: number; y: number; s: number; color: string }) {
  switch (kind % 6) {
    case 0: // chakra
      return <circle cx={x} cy={y} r={9 * s} fill="none" stroke={color} strokeWidth={2.2} opacity={0.5} />
    case 1: // bow
      return <path d={`M ${x - 10 * s} ${y + 6 * s} Q ${x} ${y - 14 * s} ${x + 10 * s} ${y + 6 * s}`} stroke={color} strokeWidth={2} fill="none" opacity={0.5} />
    case 2: // blade
      return <path d={`M ${x} ${y - 16 * s} L ${x} ${y + 6 * s}`} stroke={color} strokeWidth={2.6} opacity={0.55} strokeLinecap="round" />
    case 3: // mace
      return (
        <g stroke={color} opacity={0.5}>
          <path d={`M ${x} ${y + 4 * s} L ${x} ${y - 12 * s}`} strokeWidth={2} />
          <circle cx={x} cy={y - 15 * s} r={5 * s} fill={color} stroke="none" />
        </g>
      )
    case 4: // lotus bud
      return <path d={blob(r, x, y - 4 * s, 8 * s, 10 * s, 6, 0.2)} fill={color} opacity={0.46} />
    default: // conch
      return <path d={`M ${x - 8 * s} ${y - 2 * s} Q ${x} ${y - 12 * s} ${x + 8 * s} ${y - 2 * s} Q ${x + 3 * s} ${y + 8 * s} ${x} ${y + 4 * s} Q ${x - 3 * s} ${y + 8 * s} ${x - 8 * s} ${y - 2 * s} Z`} fill={color} opacity={0.42} />
  }
}

/**
 * Numeric knobs on the existing kohl-sweep eye code — every factor is 1.0 at
 * what the original hardcoded eyes drew, so `aesthetic` (the default)
 * reproduces them bit-for-bit. Nothing about "the mark that says Durga and
 * nothing else" is redesigned; only scaled.
 */
const EYE_STYLES: Record<EyeStyle, {
  rx: number; ry: number; pupil: number
  sweepLen: number; sweepLift: number
  browLift: number; browThick: number
  cheek: number
}> = {
  soft: { rx: 1.15, ry: 1.3, pupil: 1.1, sweepLen: 0.75, sweepLift: 0.55, browLift: 0.55, browThick: 1.05, cheek: 1.6 },
  gentle: { rx: 1, ry: 1.1, pupil: 1, sweepLen: 0.9, sweepLift: 0.75, browLift: 0.8, browThick: 1, cheek: 1.2 },
  aesthetic: { rx: 1, ry: 0.95, pupil: 0.95, sweepLen: 1.1, sweepLift: 1, browLift: 1, browThick: 0.95, cheek: 0.8 },
  fierce: { rx: 0.85, ry: 0.78, pupil: 0.9, sweepLen: 1.35, sweepLift: 1.45, browLift: 1.55, browThick: 1.2, cheek: 0.5 },
}

/**
 * Hair — sits behind the face/crown (rendered once, immediately before the
 * face block; the crown is drawn last and always paints over it, so this
 * works unchanged for every crown style including 'none'). Frames the face
 * at the sides and cascades past the shoulders. Always Wash+Ink, never a
 * flat fill; degrades opacity (not visibility) under linework exactly like
 * the face/torso already do, since hair is structural, not a decorative
 * overlay (unlike SariPattern/Jewellery below, which the call site skips
 * outright under linework).
 */
function Hair({ r, style, cx, y, s, color, crownGapHalf, linework }: {
  r: Rng
  style: HairStyle
  cx: number
  y: (v: number) => number
  s: number
  color: string
  crownGapHalf: number
  linework?: boolean
}) {
  const fx = (dx: number) => cx + dx * s
  const fy = (dv: number) => y(HEAD + dv)
  const fillOp = linework ? 0.14 : 0.4
  const inkOp = linework ? 0.42 : 0.38
  const hr = r.fork(`hair-${style}`)
  // A bare head (crown 'none') needs a shallower, fuller parting than one
  // about to disappear under a daaker/tall crown.
  const partDip = crownGapHalf > 0 ? -26 : -14

  const mass = (pts: Pt[], key: string, opacity = 1) => (
    <g key={key}>
      <Wash d={smooth(pts, true)} color={color} opacity={fillOp * opacity} rim={false} />
      <Ink pts={pts} close r={hr.fork(key)} width={1.8} opacity={inkOp * opacity} />
    </g>
  )

  switch (style) {
    // Almost entirely tucked away — a thin hairline sliver at the temples,
    // for the crown/veil to sit on.
    case 'covered': {
      const sliver: Pt[] = [
        [fx(-32), fy(4)], [fx(-38), fy(-8)], [fx(-28), fy(-18)],
        [fx(28), fy(-18)], [fx(38), fy(-8)], [fx(32), fy(4)],
      ]
      return mass(sliver, 'sliver', 0.7)
    }

    // Swept back, gathered low at the nape — neat, practical, unfussy.
    case 'low-bun': {
      const cap: Pt[] = [
        [fx(-30), fy(-6)], [fx(-partDip * 0.7), fy(-24)], [fx(partDip * 0.7), fy(-24)], [fx(30), fy(-6)],
        [fx(28), fy(16)], [fx(16), fy(30)], [fx(-16), fy(30)], [fx(-28), fy(16)],
      ]
      const bunR = hr.fork('bun')
      return (
        <g>
          {mass(cap, 'cap')}
          <path d={blob(bunR, fx(0), fy(54), 13 * s, 9 * s, 7, 0.16)} fill={color} opacity={fillOp * 1.1} />
          <Ink pts={[[fx(-11), fy(46)], [fx(0), fy(60)], [fx(11), fy(46)]] as Pt[]} r={bunR.fork('wrap')} width={1.5} opacity={inkOp} />
        </g>
      )
    }

    // Pulled back, one single thick plait down the back — the plainest,
    // most homely archetype in the set.
    case 'single-braid': {
      const cap: Pt[] = [
        [fx(-28), fy(-8)], [fx(-partDip * 0.6), fy(-24)], [fx(partDip * 0.6), fy(-24)], [fx(28), fy(-8)],
        [fx(24), fy(18)], [fx(12), fy(34)], [fx(-12), fy(34)], [fx(-24), fy(18)],
      ]
      const br = hr.fork('braid')
      const braidPts: Pt[] = [
        [fx(-2 + br.jitter(2)), fy(28)], [fx(6 + br.jitter(2)), fy(58)], [fx(-5 + br.jitter(2)), fy(90)],
        [fx(5 + br.jitter(2)), fy(122)], [fx(-4 + br.jitter(2)), fy(154)], [fx(3), fy(182)],
      ]
      return (
        <g>
          {mass(cap, 'cap')}
          <Ink pts={braidPts} r={br} width={4.4 * s} opacity={inkOp * 1.15} />
          {braidPts.slice(0, 4).map((p, i) => (
            <path key={i} d={`M ${p[0] - 5 * s} ${p[1]} L ${p[0] + 5 * s} ${p[1]}`}
              stroke={color} strokeWidth={1.2} opacity={inkOp * 0.6} />
          ))}
        </g>
      )
    }

    // Wide, symmetric, centre-parted waves flowing past the shoulders —
    // the classic bonedi-bari silhouette.
    case 'flowing-center-part': {
      const pts: Pt[] = [
        [fx(0), fy(partDip)],
        [fx(-16), fy(-18)], [fx(-34), fy(-2)], [fx(-46), fy(28)], [fx(-44), fy(72)], [fx(-34), fy(126)], [fx(-22), fy(172)],
        [fx(-8), fy(146)], [fx(0), fy(96)],
        [fx(8), fy(146)], [fx(22), fy(172)], [fx(34), fy(126)], [fx(44), fy(72)], [fx(46), fy(28)], [fx(34), fy(-2)], [fx(16), fy(-18)],
      ]
      return (
        <g>
          {mass(pts, 'main')}
          {[-1, 1].map(side => (
            <Ink key={side}
              pts={[[fx(side * 20), fy(-10)], [fx(side * (34 + hr.jitter(4))), fy(60)], [fx(side * (28 + hr.jitter(4))), fy(130)]] as Pt[]}
              r={hr.fork(`wave${side}`)} width={1.3} opacity={inkOp * 0.5} />
          ))}
        </g>
      )
    }

    // Fuller, wind-blown, asymmetric flyaway strands — the most dynamic
    // archetype, for mid-motion/dramatic idols.
    case 'loose-wavy': {
      const pts: Pt[] = [
        [fx(0), fy(partDip - 2)],
        [fx(-20), fy(-16)], [fx(-40), fy(6)], [fx(-55), fy(42)], [fx(-50), fy(96)], [fx(-38), fy(158)], [fx(-24), fy(212)],
        [fx(-6), fy(164)], [fx(0), fy(102)],
        [fx(6), fy(164)], [fx(24), fy(212)], [fx(38), fy(158)], [fx(50), fy(96)], [fx(55), fy(42)], [fx(40), fy(6)], [fx(20), fy(-16)],
      ]
      return (
        <g>
          {mass(pts, 'main')}
          {[-1, 1].map(side => {
            const fr = hr.fork(`fly${side}`)
            return (
              <Ink key={side}
                pts={[[fx(side * 44), fy(14)], [fx(side * (66 + fr.jitter(8))), fy(-6 + fr.jitter(6))], [fx(side * (58 + fr.jitter(6))), fy(40)]] as Pt[]}
                r={fr} width={1.4} opacity={inkOp * 0.6} />
            )
          })}
        </g>
      )
    }

    // Two overlapping tiers plus small twist accents — the most ornate
    // archetype, for the most opulent/monumental idols.
    case 'layered-elaborate': {
      const outer: Pt[] = [
        [fx(0), fy(partDip - 4)],
        [fx(-18), fy(-18)], [fx(-38), fy(2)], [fx(-52), fy(36)], [fx(-48), fy(90)], [fx(-36), fy(148)], [fx(-24), fy(198)],
        [fx(-8), fy(156)], [fx(0), fy(98)],
        [fx(8), fy(156)], [fx(24), fy(198)], [fx(36), fy(148)], [fx(48), fy(90)], [fx(52), fy(36)], [fx(38), fy(2)], [fx(18), fy(-18)],
      ]
      const inner: Pt[] = [
        [fx(0), fy(partDip + 6)],
        [fx(-12), fy(-8)], [fx(-26), fy(14)], [fx(-32), fy(48)], [fx(-26), fy(84)],
        [fx(0), fy(70)],
        [fx(26), fy(84)], [fx(32), fy(48)], [fx(26), fy(14)], [fx(12), fy(-8)],
      ]
      return (
        <g>
          {mass(outer, 'outer')}
          {mass(inner, 'inner', 0.85)}
          {[-1, 1].map(side => (
            <path key={side} d={blob(hr.fork(`twist${side}`), fx(side * 30), fy(6), 6 * s, 9 * s, 6, 0.2)}
              fill={color} opacity={fillOp * 0.9} />
          ))}
        </g>
      )
    }
  }
}

/**
 * SariPattern — replaces the original 3-line fold + dashed hem with a
 * per-archetype treatment. Called only under `{!o.linework && ...}` at the
 * site, so linework idols simply never render it.
 */
function SariPattern({ r, style, cx, y, s, accent }: {
  r: Rng; style: SariStyle; cx: number; y: (v: number) => number; s: number; accent: string
}) {
  const pr = r.fork(`sari-${style}`)
  switch (style) {
    // The original look, kept as the default/baseline archetype.
    case 'plain-pleats':
      return (
        <g>
          <g opacity={0.3}>
            {[-1, 0, 1].map(k => (
              <path key={k} d={`M ${cx + k * 16 * s} ${y(870)} Q ${cx + k * 22 * s} ${y(960)} ${cx + k * 14 * s} ${y(FEET)}`}
                stroke={accent} strokeWidth={1.6} fill="none" />
            ))}
          </g>
          <g stroke={accent} strokeWidth={3} opacity={0.4} strokeDasharray={`${2 * s} ${5 * s}`}>
            <path d={`M ${cx - 34 * s} ${y(FEET) - 4 * s} L ${cx + 34 * s} ${y(FEET) - 4 * s}`} />
          </g>
        </g>
      )

    // Soft fold-lines + a few small bud blobs and a wavy vine along the hem.
    case 'floral-border':
      return (
        <g>
          <g opacity={0.26}>
            {[-1, 1].map(k => (
              <path key={k} d={`M ${cx + k * 20 * s} ${y(880)} Q ${cx + k * 26 * s} ${y(970)} ${cx + k * 16 * s} ${y(FEET)}`}
                stroke={accent} strokeWidth={1.4} fill="none" />
            ))}
          </g>
          <g opacity={0.5}>
            {[-1, 0, 1].map(k => (
              <path key={k} d={blob(pr.fork(`bud${k}`), cx + k * 20 * s, y(FEET) - 8 * s, 5 * s, 4 * s, 6, 0.22)}
                fill={accent} opacity={0.5} />
            ))}
            <path d={`M ${cx - 36 * s} ${y(FEET) - 2 * s} Q ${cx} ${y(FEET) + 4 * s} ${cx + 36 * s} ${y(FEET) - 2 * s}`}
              stroke={accent} strokeWidth={1.6} fill="none" opacity={0.5} />
          </g>
        </g>
      )

    // Bold parallel diagonal bands across the aanchal — graphic, dynamic.
    case 'striped-aanchal':
      return (
        <g stroke={accent} strokeWidth={2.4} opacity={0.4} fill="none">
          {[-1, -0.4, 0.2, 0.8].map((k, i) => (
            <path key={i} d={`M ${cx + (k - 0.5) * 40 * s} ${y(860)} L ${cx + (k + 0.6) * 40 * s} ${y(FEET)}`} />
          ))}
        </g>
      )

    // A row of small temple-spire triangles along the hem — grand, structural.
    case 'temple-motif': {
      const n = 5
      return (
        <g opacity={0.45}>
          {Array.from({ length: n }, (_, i) => {
            const k = (i - (n - 1) / 2) * 15
            const bx = cx + k * s
            const by = y(FEET) - 6 * s
            return <path key={i} d={`M ${bx - 6 * s} ${by} L ${bx} ${by - 12 * s} L ${bx + 6 * s} ${by} Z`} fill={accent} opacity={0.4} />
          })}
          <path d={`M ${cx - 40 * s} ${y(FEET) - 2 * s} L ${cx + 40 * s} ${y(FEET) - 2 * s}`} stroke={accent} strokeWidth={2} opacity={0.44} />
        </g>
      )
    }

    // Dense fine lattice across the torso + a doubled hem border — reads
    // as heavy gold zari embroidery.
    case 'zari-heavy':
      return (
        <g>
          <g stroke={accent} strokeWidth={1.1} opacity={0.32}>
            {Array.from({ length: 6 }, (_, i) => {
              const k = i - 2.5
              return <path key={i} d={`M ${cx + k * 13 * s} ${y(860)} L ${cx + k * 13 * s} ${y(FEET)}`} />
            })}
            {Array.from({ length: 4 }, (_, i) => (
              <path key={`h${i}`} d={`M ${cx - 40 * s} ${y(890 + i * 45)} L ${cx + 40 * s} ${y(890 + i * 45)}`} />
            ))}
          </g>
          <g stroke={accent} strokeWidth={3.4} opacity={0.5} strokeDasharray={`${1.4 * s} ${3 * s}`}>
            <path d={`M ${cx - 36 * s} ${y(FEET) - 5 * s} L ${cx + 36 * s} ${y(FEET) - 5 * s}`} />
            <path d={`M ${cx - 32 * s} ${y(FEET) + 1 * s} L ${cx + 32 * s} ${y(FEET) + 1 * s}`} />
          </g>
        </g>
      )

    // A simple grid — handloom check/gamcha weave, folk and unpretentious.
    case 'checked-folk':
      return (
        <g stroke={accent} strokeWidth={1.2} opacity={0.3}>
          {[-24, -8, 8, 24].map((k, i) => (
            <path key={`v${i}`} d={`M ${cx + k * s} ${y(864)} L ${cx + k * 1.3 * s} ${y(FEET)}`} />
          ))}
          {[900, 950, 1000, 1050].map((v, i) => (
            <path key={`h${i}`} d={`M ${cx - 40 * s} ${y(v)} L ${cx + 40 * s} ${y(v)}`} />
          ))}
        </g>
      )
  }
}

/**
 * Jewellery — extends the original necklace/waistband/armband block. Also
 * called only under `{!o.linework && ...}`, same as the original.
 */
function Jewellery({ r, style, cx, y, s, accent, shoulderY }: {
  r: Rng; style: JewelStyle; cx: number; y: (v: number) => number; s: number; accent: string; shoulderY: number
}) {
  const jr = r.fork(`jewel-${style}`)

  // Plain helpers, not components — each returns a ReactNode directly and is
  // called as a function (`necklace(...)`), never used as a JSX tag. Naming
  // one of these with a capital letter and rendering it as `<Necklace/>`
  // would make React treat it as a brand-new component type on every single
  // render of this parent, which is exactly what `react-hooks/static-components`
  // flags: it's created fresh on every call to `Jewellery`, so it can never
  // keep any state (irrelevant here, since none of these hold state) but,
  // worse, its own children get remounted every render for no reason.
  const necklace = (n: number, w: number, opacity: number) => (
    <g key={`necklace-${n}-${w}`}>
      <path d={`M ${cx - w * s} ${y(830)} Q ${cx} ${y(830) + w * 0.7 * s} ${cx + w * s} ${y(830)}`}
        stroke={accent} strokeWidth={2.4} fill="none" opacity={opacity} />
      {Array.from({ length: n }, (_, i) => {
        const k = i - (n - 1) / 2
        return <circle key={i} cx={cx + k * (w * 0.6) * s} cy={y(830) + Math.abs(k) * 4 * s + 6 * s} r={2.4 * s} fill={accent} />
      })}
    </g>
  )
  const waistband = (opacity = 0.7) => (
    <path key="waistband" d={`M ${cx - 30 * s} ${y(930)} Q ${cx} ${y(942)} ${cx + 30 * s} ${y(930)}`} stroke={accent} strokeWidth={2.6} fill="none" opacity={opacity} />
  )
  const armbands = () => (
    <g key="armbands">
      {[-1, 1].map(side => (
        <circle key={side} cx={cx + side * 30 * s} cy={shoulderY + 6 * s} r={9 * s} fill="none" stroke={accent} strokeWidth={2} />
      ))}
    </g>
  )
  const earrings = () => (
    <g key="earrings">
      {[-1, 1].map(side => (
        <path key={side} d={`M ${cx + side * 34 * s} ${y(HEAD + 14)} q ${side * 3 * s} ${9 * s} 0 ${17 * s}`}
          stroke={accent} strokeWidth={1.8} fill="none" opacity={0.6} />
      ))}
    </g>
  )
  const tikka = () => (
    <g key="tikka" opacity={0.55}>
      <path d={`M ${cx} ${y(HEAD - 34)} L ${cx} ${y(HEAD - 14)}`} stroke={accent} strokeWidth={1.4} />
      <circle cx={cx} cy={y(HEAD - 14)} r={2.2 * s} fill={accent} />
    </g>
  )
  const bangles = () => (
    <g key="bangles">
      {[-1, 1].map(side => (
        <g key={side} stroke={accent} strokeWidth={1.4} fill="none" opacity={0.55}>
          <circle cx={cx + side * 34 * s} cy={shoulderY + 50 * s} r={5 * s} />
          <circle cx={cx + side * 34 * s} cy={shoulderY + 58 * s} r={5 * s} />
        </g>
      ))}
    </g>
  )
  const floralBits = () => (
    <g key="floral">
      {[-1, 1].map(side => (
        <path key={side} d={blob(jr.fork(`ear${side}`), cx + side * 32 * s, y(HEAD + 24), 4 * s, 5 * s, 6, 0.2)}
          fill={accent} opacity={0.55} />
      ))}
      <path d={blob(jr.fork('pendant'), cx, y(834), 5 * s, 5 * s, 6, 0.2)} fill={accent} opacity={0.6} />
    </g>
  )

  switch (style) {
    // Necklace only — nothing else.
    case 'minimal':
      return <g opacity={0.5}>{necklace(3, 20, 0.55)}</g>

    // Everything the original had, plus a second necklace strand, earrings,
    // a maang-tikka and bangles — full daaker-saaj ornamentation.
    case 'temple-heavy':
      return (
        <g opacity={0.5}>
          {necklace(5, 30, 0.7)}
          {necklace(0, 40, 0.4)}
          {waistband(0.7)}
          {armbands()}
          {earrings()}
          {tikka()}
          {bangles()}
        </g>
      )

    // Small flower-blob earrings + forehead pendant instead of hard beads;
    // no armbands — soft and delicate.
    case 'floral':
      return (
        <g opacity={0.5}>
          {necklace(5, 24, 0.55)}
          {floralBits()}
        </g>
      )

    // Bold stacked necklace strands + armbands + bangles; no waist piece —
    // clean, graphic, reads at a distance.
    case 'layered-modern':
      return (
        <g opacity={0.5}>
          {necklace(5, 30, 0.7)}
          {necklace(0, 38, 0.35)}
          {armbands()}
          {bangles()}
        </g>
      )

    // One plain beaded necklace + a waistband, nothing else — humble,
    // handmade.
    case 'folk-simple':
      return (
        <g opacity={0.5}>
          {necklace(3, 26, 0.6)}
          {waistband(0.55)}
        </g>
      )
  }
}

function Pratima({ r, o }: { r: Rng; o: PratimaOpts }) {
  const s = o.scale ?? 1
  const arms = o.arms ?? 10
  const fill = o.linework ? 0.16 : 0.46
  const y = (v: number) => FEET - (FEET - v) * s
  const shoulderY = y(882)
  const crownGapHalf = o.crown === 'none' ? 0 : o.crown === 'simple' ? 30 : 44
  const hairColor = o.hairColor ?? P.ink

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
      const isTrishulHand = side === 1 && i === perSide - 1
      armPaths.push(
        <g key={`${side}${i}`}>
          <path d={smooth([[sx, shoulderY], [mx, my], [ex, ey]] as Pt[])}
            stroke={o.skin} strokeWidth={10 * s} fill="none" strokeLinecap="round" opacity={o.linework ? 0.34 : 0.58} />
          <circle cx={ex} cy={ey} r={7 * s} fill={o.skin} opacity={o.linework ? 0.34 : 0.6} />
          {!o.linework && !isTrishulHand && (
            <HandItem r={ar.fork('item')} kind={side === 1 ? i : i + perSide} x={ex} y={ey} s={s} color={o.accent} />
          )}
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
            {!o.linework && (
              <>
                <path d={`M ${CX - 40 * s} ${y(1000)} Q ${CX - 10 * s} ${y(985)} ${CX - 4 * s} ${y(1005)}`}
                  stroke={P.earth} strokeWidth={4 * s} fill="none" opacity={0.4} strokeLinecap="round" />
                <circle cx={CX - 168 * s} cy={y(1018)} r={2.6 * s} fill={P.ink} opacity={0.5} />
              </>
            )}
          </g>
        )
      })()}

      {/* body */}
      <g>
        {armPaths}
        <Wash d={smooth(torso, true)} color={o.cloth} opacity={fill} rim={!o.linework} />
        {/* sari folds + hem border — otherwise the torso is one flat wash */}
        {!o.linework && (
          <SariPattern r={r} style={o.sariPattern ?? 'plain-pleats'} cx={CX} y={y} s={s} accent={o.accent} />
        )}
        <Ink pts={torso} close r={r.fork('torso')} width={2.4} opacity={o.linework ? 0.6 : 0.44} />
        {/* jewellery — necklace, waistband, armbands */}
        {!o.linework && (
          <Jewellery r={r} style={o.jewellery ?? 'minimal'} cx={CX} y={y} s={s} accent={o.accent} shoulderY={shoulderY} />
        )}
        <Hair r={r} style={o.hair ?? 'flowing-center-part'} cx={CX} y={y} s={s}
          color={hairColor} crownGapHalf={crownGapHalf} linework={o.linework} />
        {(() => {
          const fx = (dx: number) => CX + dx * s
          const fy = (dv: number) => y(HEAD + dv)

          // Wider at the cheekbones than at brow or jaw, tapering to a soft
          // chin — reads as a real face rather than a symmetric diamond. Top
          // still meets the crown base (drawn just below, at HEAD-12) cleanly.
          const facePts: Pt[] = [
            [fx(-10), fy(-6)], [fx(10), fy(-6)], [fx(21), fy(4)], [fx(36), fy(26)],
            [fx(23), fy(50)], [fx(0), fy(65)], [fx(-23), fy(50)], [fx(-36), fy(26)], [fx(-21), fy(4)],
          ]

          return (
            <g>
              <Wash d={smooth(facePts, true)} color={o.skin} opacity={o.linework ? 0.2 : 0.56} rim={false} />
              <Ink pts={facePts} close r={r.fork('face')} width={2} opacity={o.linework ? 0.5 : 0.42} />

              {/* eyebrows, eye sockets, and — the whole point — a long confident
                  kohl sweep off the outer corner toward the temple. Everything
                  else on this face stays quiet so the eyes read first, even at
                  thumbnail size. `ES` scales these same numbers per-idol —
                  'aesthetic' (the default) reproduces the original exactly. */}
              {(() => {
                const ES = EYE_STYLES[o.eyeStyle ?? 'aesthetic']
                return [-1, 1].map((side) => {
                  const eyeR = r.fork(`eye${side}`)
                  const browR = r.fork(`brow${side}`)
                  const eyeCx = fx(side * 13)
                  const eyeCy = fy(17)
                  const almondPts: Pt[] = [
                    [fx(side * 7), fy(21)],
                    [fx(side * 17 * ES.rx), fy(21 - 11 * ES.ry)],
                    [fx(side * 28 * ES.rx), fy(21 - 8 * ES.ry)],
                    [fx(side * 16), fy(21 + 3 * ES.ry)],
                  ]
                  const kohlPts: Pt[] = [
                    [fx(side * 4), fy(22)],
                    [fx(side * 18), fy(22 - 13 * ES.sweepLift)],
                    [fx(side * 30), fy(22 - 11 * ES.sweepLift)],
                    [fx(side * 46 * ES.sweepLen), fy(22 - 27 * ES.sweepLift)],
                  ]
                  return (
                    <g key={side}>
                      {!o.linework && (
                        <path d={blob(eyeR.fork('white'), eyeCx, eyeCy, 10 * s * ES.rx, 5.5 * s * ES.ry, 6, 0.14)} fill={P.paper} opacity={0.24} />
                      )}
                      <Ink pts={almondPts} close r={eyeR} width={1.6} opacity={o.linework ? 0.42 : 0.5} />
                      <ellipse cx={eyeCx} cy={eyeCy} rx={3.4 * s * ES.pupil} ry={4 * s * ES.pupil} fill={P.ink} opacity={o.linework ? 0.32 : 0.72} />
                      {/* the sweep — long, confident, upturned toward the temple:
                          the single mark that says Durga and nothing else */}
                      <Ink pts={kohlPts} r={eyeR.fork('liner')} width={2.6} opacity={o.linework ? 0.6 : 0.74} />
                      {!o.linework && (
                        <Ink
                          pts={[[fx(side * 10), fy(26)], [fx(side * 24), fy(27)], [fx(side * 33), fy(20)]] as Pt[]}
                          r={eyeR.fork('lash')} width={1.4} opacity={0.3}
                        />
                      )}
                      <Ink
                        pts={[[fx(side * 8), fy(6)], [fx(side * 19), fy(6 - 7 * ES.browLift)], [fx(side * 31), fy(6 - 1 * ES.browLift)]] as Pt[]}
                        r={browR} width={2 * ES.browThick} opacity={o.linework ? 0.38 : 0.42}
                      />
                      {!o.linework && (
                        <path d={blob(r.fork(`cheek${side}`), fx(side * 30), fy(34), 10 * s, 7 * s, 6, 0.25)} fill={P.rose} opacity={0.14 * ES.cheek} />
                      )}
                    </g>
                  )
                })
              })()}

              {/* thin nose bridge — a whisper, not a sculpted nose */}
              <Ink
                pts={[[fx(-1), fy(19)], [fx(1.5), fy(31)], [fx(0), fy(41)]] as Pt[]}
                r={r.fork('nose')} width={1.5} opacity={o.linework ? 0.3 : 0.32}
              />

              {/* small, defined vermilion lips */}
              <Wash
                d={smooth(
                  [
                    [fx(-9), fy(50)], [fx(-3), fy(47)], [fx(0), fy(49)], [fx(3), fy(47)], [fx(9), fy(50)],
                    [fx(5), fy(55)], [fx(0), fy(57)], [fx(-5), fy(55)],
                  ] as Pt[],
                  true,
                )}
                color={P.vermilion} opacity={o.linework ? 0.14 : 0.55} rim={false}
              />
              <Ink
                pts={[[fx(-8), fy(50)], [fx(0), fy(51)], [fx(8), fy(50)]] as Pt[]}
                r={r.fork('lipLine')} width={1.4} opacity={o.linework ? 0.4 : 0.38}
              />

              {/* the third eye — a vertical flame/lens on the forehead, above
                  the brows, not a plain ellipse */}
              <path
                d={smooth([[fx(0), fy(-4)], [fx(4), fy(1)], [fx(0), fy(6)], [fx(-4), fy(1)]] as Pt[], true)}
                fill={P.ink} opacity={o.linework ? 0.22 : 0.5}
              />
              <Ink
                pts={[[fx(0), fy(-4)], [fx(4), fy(1)], [fx(0), fy(6)], [fx(-4), fy(1)]] as Pt[]}
                close r={r.fork('thirdEye')} width={1.4} opacity={o.linework ? 0.55 : 0.46}
              />
              {!o.linework && <circle cx={fx(0)} cy={fy(9)} r={2.2 * s} fill={o.accent} opacity={0.55} />}
            </g>
          )
        })()}
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
  meta: Asset['meta'], o: PratimaOpts, affinity?: Asset['affinity'],
  /** Real painted artwork, once it exists — `w`/`h` are the file's own natural
   *  pixel size, used to fit it into DURGA_BOX (see art/palette.ts) without
   *  stretching. Omit to keep the procedural placeholder. */
  image?: { src: string; w: number; h: number }): Asset {
  return {
    id, category: 'durga', name, subtitle, palette, meta, affinity,
    art: image ? { kind: 'image', ...image } : { kind: 'proc', draw: (r) => <Pratima r={r} o={o} /> },
  }
}

export const durgaIdols: Asset[] = [
  make('ekchala', 'Ekchala Durga', 'All five in one frame, under one arch',
    [P.marigold, P.vermilion, P.gold],
    { terrain: ['river', 'plain', 'interior', 'urban'], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['nostalgic', 'grand', 'festive'], intensity: 5, tags: ['traditional', 'ekchala', 'classic', 'family', 'sabeki', 'gold'] },
    { skin: P.clay, cloth: P.vermilion, accent: P.gold, chal: 'ekchala', chalColor: P.marigold, crown: 'daaker', children4: true,
      hair: 'flowing-center-part', hairColor: P.ink, eyeStyle: 'soft', sariPattern: 'temple-motif', jewellery: 'temple-heavy' },
    undefined),

  make('sabeki', 'Classical Bengali Durga', 'The bonedi-bari face, unchanged for a century',
    [P.vermilion, P.gold, P.clay],
    { terrain: ['interior', 'river', 'urban', 'plain'], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['nostalgic', 'serene', 'grand'], intensity: 4, tags: ['traditional', 'sabeki', 'classic', 'gold', 'bonedi'] },
    { skin: P.clay, cloth: P.vermilion, accent: P.gold, chal: 'halo', chalColor: P.gold, crown: 'daaker',
      hair: 'flowing-center-part', hairColor: P.ink, eyeStyle: 'aesthetic', sariPattern: 'zari-heavy', jewellery: 'temple-heavy' },
    undefined),

  make('serene', 'Serene Durga', 'Ten arms, and not one of them in a hurry',
    [P.cream, P.teal, P.gold],
    { terrain: ['mountain', 'forest', 'sea', 'river'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['serene', 'mystic', 'intimate'], intensity: 2, tags: ['calm', 'quiet', 'soft', 'gentle', 'light'] },
    { skin: P.cream, cloth: P.teal, accent: P.gold, chal: 'halo', chalColor: P.cream, crown: 'simple',
      hair: 'low-bun', hairColor: P.inkSoft, eyeStyle: 'gentle', sariPattern: 'plain-pleats', jewellery: 'minimal' },
    undefined),

  make('fierce', 'Fierce Durga', 'Mid-strike, the moment before',
    [P.red, P.ink, P.marigold],
    { terrain: ['mountain', 'forest', 'urban', 'sea'], timeOfDay: ['dusk', 'night'], mood: ['dramatic', 'grand'], intensity: 5, tags: ['fierce', 'dark', 'power', 'bold', 'storm', 'roudra'] },
    { skin: P.earth, cloth: P.red, accent: P.marigold, chal: 'halo', chalColor: P.red, crown: 'tall',
      hair: 'loose-wavy', hairColor: P.ink, eyeStyle: 'fierce', sariPattern: 'striped-aanchal', jewellery: 'layered-modern' },
    undefined),

  make('royal-gold', 'Royal Gold Durga', 'Daaker saaj, every surface catching light',
    [P.gold, P.vermilion, P.cream],
    { terrain: ['interior', 'urban', 'plain', 'rooftop'], timeOfDay: ['golden', 'dusk', 'night'], mood: ['grand', 'festive', 'dramatic'], intensity: 5, tags: ['gold', 'opulent', 'royal', 'shine', 'daaker', 'rich'] },
    { skin: P.cream, cloth: P.gold, accent: P.vermilion, chal: 'ekchala', chalColor: P.gold, crown: 'tall',
      hair: 'layered-elaborate', hairColor: P.ink, eyeStyle: 'aesthetic', sariPattern: 'zari-heavy', jewellery: 'temple-heavy' },
    undefined),

  make('white-minimal', 'White Durga', 'Unpainted clay left as it is',
    [P.paper, P.paperDeep, P.ink],
    { terrain: ['sea', 'mountain', 'rooftop', 'river'], timeOfDay: ['dawn', 'day', 'golden'], mood: ['serene', 'intimate'], intensity: 1, tags: ['minimal', 'white', 'quiet', 'restraint', 'modern', 'light'] },
    { skin: P.paperDeep, cloth: P.paper, accent: P.paperDeep, chal: 'none', crown: 'simple', linework: true,
      hair: 'covered', hairColor: P.paperDeep, eyeStyle: 'gentle', sariPattern: 'plain-pleats', jewellery: 'minimal' },
    undefined),

  make('terracotta-idol', 'Terracotta Durga', 'Fired clay, the colour of the riverbank',
    [P.terracotta, P.clay, P.earth],
    { terrain: ['river', 'plain', 'forest', 'interior'], timeOfDay: ['dawn', 'golden', 'dusk'], mood: ['nostalgic', 'serene', 'intimate'], intensity: 3, tags: ['terracotta', 'clay', 'earthy', 'craft', 'matte', 'kumartuli'] },
    { skin: P.clay, cloth: P.terracotta, accent: P.earth, chal: 'halo', chalColor: P.clay, crown: 'simple',
      hair: 'low-bun', hairColor: P.earth, eyeStyle: 'soft', sariPattern: 'checked-folk', jewellery: 'folk-simple' },
    undefined),

  make('contemporary', 'Contemporary Durga', 'An artist reinterpreting her, carefully',
    [P.indigo, P.paperDeep, P.vermilion],
    { terrain: ['urban', 'rooftop', 'sea', 'plain'], timeOfDay: ['dusk', 'night', 'day'], mood: ['dramatic', 'serene'], intensity: 3, tags: ['modern', 'art', 'contemporary', 'clean', 'theme'] },
    { skin: P.paperDeep, cloth: P.indigo, accent: P.vermilion, chal: 'halo', chalColor: P.indigo, crown: 'simple',
      hair: 'low-bun', hairColor: P.ink, eyeStyle: 'aesthetic', sariPattern: 'striped-aanchal', jewellery: 'layered-modern' },
    undefined),

  make('monumental', 'Monumental Durga', 'Three storeys tall, visible from the road',
    [P.earth, P.gold, P.slate],
    { terrain: ['urban', 'plain', 'rooftop', 'sea'], timeOfDay: ['golden', 'dusk', 'night'], mood: ['grand', 'dramatic'], intensity: 4, tags: ['huge', 'scale', 'monument', 'stone', 'awe'] },
    { skin: P.slate, cloth: P.earth, accent: P.gold, chal: 'none', crown: 'tall', scale: 1.3,
      hair: 'layered-elaborate', hairColor: P.slate, eyeStyle: 'aesthetic', sariPattern: 'temple-motif', jewellery: 'layered-modern' },
    undefined),

  make('village-durga', 'Village Durga', 'Made in the para, by someone’s uncle',
    [P.clay, P.marigold, P.green],
    { terrain: ['plain', 'river', 'forest'], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['intimate', 'nostalgic', 'festive'], intensity: 3, tags: ['village', 'folk', 'handmade', 'warm', 'simple', 'gram'] },
    { skin: P.clay, cloth: P.marigold, accent: P.green, chal: 'ekchala', chalColor: P.clay, crown: 'simple', children4: true,
      hair: 'single-braid', hairColor: P.inkSoft, eyeStyle: 'soft', sariPattern: 'checked-folk', jewellery: 'folk-simple' },
    undefined),

  make('sculptural', 'Sculptural Durga', 'Form reduced until only the gesture is left',
    [P.slate, P.paperDeep, P.ink],
    { terrain: ['rooftop', 'sea', 'mountain', 'urban'], timeOfDay: ['day', 'dusk', 'night'], mood: ['dramatic', 'serene'], intensity: 2, tags: ['abstract', 'modern', 'stone', 'minimal', 'sculpture', 'art'] },
    { skin: P.slate, cloth: P.paperDeep, accent: P.ink, chal: 'none', crown: 'tall', arms: 6, linework: true,
      hair: 'covered', hairColor: P.paperDeep, eyeStyle: 'aesthetic', sariPattern: 'plain-pleats', jewellery: 'minimal' },
    undefined),

  make('shiuli-durga', 'Shiuli Durga', 'White and saffron, like the flower itself',
    [P.paper, P.marigold, P.moss],
    { terrain: ['plain', 'forest', 'river', 'mountain'], timeOfDay: ['dawn', 'day'], mood: ['serene', 'nostalgic', 'intimate'], intensity: 2, tags: ['shiuli', 'white', 'saffron', 'autumn', 'morning', 'soft'] },
    { skin: P.cream, cloth: P.paper, accent: P.marigold, chal: 'halo', chalColor: P.marigold, crown: 'simple',
      hair: 'single-braid', hairColor: P.inkSoft, eyeStyle: 'soft', sariPattern: 'floral-border', jewellery: 'floral' },
    undefined),
]
