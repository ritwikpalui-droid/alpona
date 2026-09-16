import { useId, type ReactNode } from 'react'
import type { Asset, Box, CategoryId, ExtraPlacement, LayerAdjust, Scene, SceneAdjust, SceneContext } from '@/lib/types'
import { getAsset } from '@/lib/assets'
import { sceneContext } from '@/lib/scene'
import { rng } from '@/lib/rng'
import { GroundShadow, Paper, Vignette } from '@/lib/art/primitives'
import { CATEGORY_BOX, contain, H, PANDAL_MAX_W, W, placeOnGround, slotToCanvas, type Placement } from '@/lib/art/palette'
import { DURGA_ANCHORS, PANDAL_ANCHORS, WORLD_TONE } from '@/lib/art/anchors.generated'
import { DEFAULT_SLOT, PANDAL_SLOT } from '@/lib/art/slots'
import { MOTIFS } from '@/lib/art/motifs'

/**
 * Composites the chosen layers into one artwork.
 *
 * Turbulence filters are applied to *layer groups*, not to individual paths —
 * two filter passes for the whole scene instead of a hundred. That is the
 * difference between smooth and unusable on a mid-range Android.
 *
 * `ArtDefs` (the shared filter set) is deliberately NOT rendered here — it
 * lives exactly once, globally, in the root layout (see layout.tsx). SVG's
 * url(#id) references resolve document-wide, so rendering it per-canvas
 * used to mean every card on a page (a dozen on /create, ten on the
 * homepage) carried its own copy of the same six <filter> ids. Beyond the
 * dead weight, React unmounting/remounting any one of those duplicate-id
 * elements (switching gallery boards, moving between studio steps) made
 * every other canvas's same-id reference re-resolve mid-commit — a real,
 * visible flash. A single global copy has none of that.
 */

const FULL_BOX = { x: 0, y: 0, w: W, h: H }

/**
 * Drag+resize for a full-canvas layer (lighting / flowers / decor /
 * ambience) — these aren't a single grounded figure like the pandal/idol
 * (which go through the anchor-based `placeOnGround`), so a plain
 * `translate(dx,dy) scale(s)` around a fixed pivot is enough: a hanging
 * chandelier grows from its ceiling mount, a flower/decor/ambience scatter
 * grows from the middle of the frame, rather than from the SVG origin
 * (which would otherwise drag everything toward the top-left as it shrinks).
 */
function AdjustableLayer({ adjust, pivot, children }: { adjust?: LayerAdjust; pivot: [number, number]; children: ReactNode }) {
  if (!adjust) return <>{children}</>
  const [px, py] = pivot
  const { dx, dy, scale } = adjust
  return <g transform={`translate(${dx + px * (1 - scale)} ${dy + py * (1 - scale)}) scale(${scale})`}>{children}</g>
}

/** Where a procedural pandal/durga actually stands — CX=500 and BASE=1100 /
 *  FEET=1072 in pandals.tsx / durga.tsx respectively (both draw at fixed
 *  absolute canvas coordinates, not inside any CATEGORY_BOX). Pivoting a
 *  manual resize here, not at the SVG origin, keeps the figure's feet
 *  planted while it grows/shrinks — the same "scale from the ground point"
 *  invariant `placeOnGround` gives image-kind assets. */
const PANDAL_GROUND: [number, number] = [500, 1100]
const DURGA_GROUND: [number, number] = [500, 1072]

function Layer({ scene, cat, filter, thumb }: { scene: Scene; cat: CategoryId; filter?: string; thumb: boolean }) {
  const asset: Asset | undefined = getAsset(cat, scene[cat])
  if (!asset?.art) return null
  const ctx = sceneContext(scene)
  if (asset.art.kind === 'image') {
    const box = CATEGORY_BOX[cat]
    if (box) {
      // Object-like categories (pandal, durga, …): fit the painting's own
      // aspect ratio inside its category's box, centred — never stretched,
      // never cropped, so a tall temple and a wide bamboo structure both
      // read correctly however differently they're shaped.
      //
      // This is the FALLBACK path — used only when the asset has no
      // measured `AutoAnchors` yet (see PandalAndIdol below, which is what
      // actually renders pandal/durga once anchors exist). Kept so nothing
      // breaks for an asset added before its anchors are computed.
      const fit = contain(box, asset.art.w, asset.art.h)
      return <image href={asset.art.src} x={fit.x} y={fit.y} width={fit.w} height={fit.h} preserveAspectRatio="xMidYMid meet" />
    }
    // No box defined for this category yet: treat it as a full-bleed
    // background (world, sky) and cover the whole canvas.
    return <image href={asset.art.src} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
  }
  const node = asset.art.draw(rng(`${cat}:${asset.id}`), FULL_BOX, ctx)
  if (!node) return null
  // Keyed on the asset id: swapping a layer remounts this group, which restarts
  // the paint-in animation. That is what makes a choice feel like a brushstroke.
  // Skipped for thumbs: a dozen option cards animating this at once, each
  // inside an active feTurbulence filter, is real, measured main-thread cost
  // for a flourish nobody's looking at on a 136px preview.
  return <g key={asset.id} data-layer={cat} className={thumb ? undefined : 'layer-paint'} filter={filter}>{node}</g>
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

/**
 * A layer painted independently of its world carries no relationship to
 * that world's own tone — measured on the real library, some pandals sit
 * up to 96 brightness-levels darker and 2.5× more saturated than the world
 * they're dropped onto. A flat colour wash over the whole scene (tried
 * previously) moves every layer by the same fixed amount, so it can only
 * ever close a small gap — it did nothing for a 96-level break.
 *
 * This closes a GAP-PROPORTIONAL amount instead: lift the layer's value
 * toward the world's, and only pull saturation down (never up — a muted
 * asset doesn't need to be made MORE colourful to belong). `depth` is how
 * much of the gap a layer at that distance from "background" should take
 * on (a foreground object catches less atmosphere than something further
 * back would, if it were).
 */
function tonalFilter(id: string, assetTone: { L: number; s: number } | undefined,
  worldTone: { L: number; s: number } | undefined, depth: number) {
  if (!assetTone || !worldTone) return null
  const lift = clamp((worldTone.L - assetTone.L) * 0.45 * depth, -26, 40)
  const desat = 1 - 0.3 * depth * clamp(assetTone.s / Math.max(0.02, worldTone.s) - 1, 0, 1.2)
  const slope = 1 - lift / 255
  const intercept = lift / 255
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="saturate" values={String(desat)} />
      <feComponentTransfer>
        <feFuncR type="linear" slope={slope} intercept={intercept} />
        <feFuncG type="linear" slope={slope} intercept={intercept} />
        <feFuncB type="linear" slope={slope} intercept={intercept} />
      </feComponentTransfer>
    </filter>
  )
}

/**
 * Renders the pandal and, nested inside its own architectural opening, the
 * idol — replacing two independent `contain()`-in-a-fixed-box images with
 * one physically related group. This is the actual fix for the reported
 * "stickers floating on a background" problem, which measurement showed
 * was NOT primarily a perspective mismatch: it was (a) idols floating
 * 20–140px above the ground because `contain()` centres the FILE, not the
 * painted figure, (b) pandals rendered 90–100% of the visible frame width
 * so no world was left to place them into, and (c) an idol rendered
 * 2.4× wider than the architectural opening it was meant to stand in,
 * covering the doorway instead of standing inside it.
 *
 * Falls back to the old independent-box rendering whenever an asset has no
 * measured anchors yet (procedural art, or a real asset added before its
 * anchors were computed) — nothing regresses while the library is filled in.
 */
function PandalAndIdol({ scene, thumb, adjust }: { scene: Scene; thumb: boolean; adjust?: SceneAdjust }) {
  const ctx = sceneContext(scene)
  const pandalAsset = getAsset('pandal', scene.pandal)
  const durgaAsset = getAsset('durga', scene.durga)
  const filterIdBase = useId()
  // Procedural pandal/durga want the same hand-painted turbulence wobble
  // every other procedural layer gets — only skipped when the asset is a
  // real image (which the fallback branches below, by definition, aren't).
  const soft = thumb ? undefined : 'url(#wc-soft)'

  const pandalBox = CATEGORY_BOX.pandal!
  const pandalAnchors = pandalAsset?.art?.kind === 'image' ? PANDAL_ANCHORS[pandalAsset.id] : undefined
  const durgaAnchorsBare = durgaAsset?.art?.kind === 'image' ? DURGA_ANCHORS[durgaAsset.id] : undefined
  const worldToneBare = scene.world ? WORLD_TONE[scene.world]?.tone : undefined

  // Three distinct cases, kept deliberately separate — collapsing "no
  // pandal chosen" and "pandal chosen but still procedural" into one check
  // used to make a procedural pandal vanish outright (its `<Layer>` never
  // rendered), leaving the idol floating alone with no structure at all.
  if (!scene.pandal) {
    // Pandal is optional (§ "add option for not choosing the pandal too")
    // — a bare idol standing directly on whatever ground the world itself
    // offers. She still gets the real anchor-based ground placement and her
    // own shadow/tone-matching; there's just no architecture to nest into.
    if (durgaAsset?.art?.kind === 'image' && durgaAnchorsBare) {
      const groundCx = pandalBox.x + pandalBox.w / 2
      const groundY = pandalBox.y + pandalBox.h
      const targetW = Math.min(PANDAL_MAX_W * 0.65, pandalBox.w)
      const placement = placeOnGround(
        durgaAnchorsBare.content, durgaAnchorsBare.foot, durgaAnchorsBare.naturalW, durgaAnchorsBare.naturalH,
        groundCx, groundY, targetW, pandalBox.h, adjust?.durga,
      )
      const footW = Math.max(40, durgaAnchorsBare.foot.w * durgaAnchorsBare.content.w * durgaAnchorsBare.naturalW * placement.s)
      const shadowDx = (0.5 - ctx.light.x) * footW * 0.55
      const filterId = `df-${filterIdBase}`
      const filter = tonalFilter(filterId, durgaAnchorsBare.tone, worldToneBare, 0.4)
      return (
        <>
          {filter && <defs>{filter}</defs>}
          {!thumb && (
            <ellipse cx={groundCx + shadowDx} cy={groundY} rx={footW * 0.6} ry={16}
              fill="#2A2621" opacity={0.24} filter="url(#blur-lg)" transform={`skewX(${(0.5 - ctx.light.x) * 26})`} />
          )}
          <g data-adjust-target="durga" filter={filter ? `url(#${filterId})` : undefined}>
            <g transform={`translate(${placement.tx} ${placement.ty}) scale(${placement.s})`}>
              <image href={durgaAsset.art.src} x={0} y={0} width={durgaAnchorsBare.naturalW} height={durgaAnchorsBare.naturalH} />
            </g>
          </g>
        </>
      )
    }
    // Neither has measured anchors (procedural, or not yet computed): old behaviour.
    return (
      <>
        {!thumb && (scene.pandal || scene.durga) && (
          <GroundShadow cx={pandalBox.x + pandalBox.w / 2} cy={pandalBox.y + pandalBox.h} rx={pandalBox.w * 0.32} />
        )}
        {/* A procedural pandal/durga draws at its own fixed absolute
            coordinates (see PANDAL_GROUND/DURGA_GROUND below) — pivoting the
            manual drag/resize there, not the SVG origin, is what makes
            resizing grow it from its own standing point instead of from
            the canvas corner. This is the fix for "drag and resize not
            working": these two fallback branches used to render `<Layer>`
            with no adjust applied at all — `placeOnGround` (which DOES
            apply it) only ever runs for image-kind assets, and every
            pandal/durga in the current library is procedural.
            `data-adjust-target` is separate — it's what lets a tap directly
            on the canvas (not just the bottom panel's tabs) pick which of
            these two this drag/resize actually targets. */}
        <g data-adjust-target="pandal">
          <AdjustableLayer adjust={adjust?.pandal} pivot={PANDAL_GROUND}>
            <Layer scene={scene} cat="pandal" thumb={thumb} filter={soft} />
          </AdjustableLayer>
        </g>
        <g data-adjust-target="durga">
          <AdjustableLayer adjust={adjust?.durga} pivot={DURGA_GROUND}>
            <Layer scene={scene} cat="durga" thumb={thumb} filter={soft} />
          </AdjustableLayer>
        </g>
      </>
    )
  }

  // A pandal WAS chosen, but it's still procedural (kind 'proc' — not yet
  // migrated to a real painted asset) or its anchors haven't been computed
  // yet. Old combined rendering — this is what actually draws a procedural
  // pandal's `art.draw(...)`, which the anchor/slot system below has no
  // path for at all (it only ever renders an `<image>`).
  if (!pandalAsset || pandalAsset.art?.kind !== 'image' || !pandalAnchors) {
    return (
      <>
        {!thumb && <GroundShadow cx={pandalBox.x + pandalBox.w / 2} cy={pandalBox.y + pandalBox.h} rx={pandalBox.w * 0.32} />}
        <g data-adjust-target="pandal">
          <AdjustableLayer adjust={adjust?.pandal} pivot={PANDAL_GROUND}>
            <Layer scene={scene} cat="pandal" thumb={thumb} filter={soft} />
          </AdjustableLayer>
        </g>
        <g data-adjust-target="durga">
          <AdjustableLayer adjust={adjust?.durga} pivot={DURGA_GROUND}>
            <Layer scene={scene} cat="durga" thumb={thumb} filter={soft} />
          </AdjustableLayer>
        </g>
      </>
    )
  }

  const groundCx = pandalBox.x + pandalBox.w / 2
  const groundY = pandalBox.y + pandalBox.h
  const targetW = Math.min(PANDAL_MAX_W, pandalBox.w)
  const placement: Placement = placeOnGround(
    pandalAnchors.content, pandalAnchors.foot, pandalAnchors.naturalW, pandalAnchors.naturalH,
    groundCx, groundY, targetW, pandalBox.h, adjust?.pandal,
  )

  const footWidthCanvas = Math.max(60, pandalAnchors.foot.w * pandalAnchors.content.w * pandalAnchors.naturalW * placement.s)
  const shadowDx = (0.5 - ctx.light.x) * footWidthCanvas * 0.55
  const shadowSkew = (0.5 - ctx.light.x) * 26

  const worldTone = scene.world ? WORLD_TONE[scene.world]?.tone : undefined
  const pandalFilterId = `pf-${filterIdBase}`
  const pandalFilter = tonalFilter(pandalFilterId, pandalAnchors.tone, worldTone, 0.45)

  const slot = PANDAL_SLOT[pandalAsset.id] ?? DEFAULT_SLOT
  const slotBox = slotToCanvas(placement, pandalAnchors.content, pandalAnchors.naturalW, pandalAnchors.naturalH, slot)
  const slotShadeId = `ss-${filterIdBase}`

  const durgaAnchors = durgaAsset?.art?.kind === 'image' ? DURGA_ANCHORS[durgaAsset.id] : undefined
  let idol: ReactNode = null
  let idolShadow: ReactNode = null
  let durgaFilter: ReactNode = null
  if (durgaAsset?.art?.kind === 'image' && durgaAnchors) {
    const idolGroundCx = slotBox.x + slotBox.w / 2
    const idolGroundY = slotBox.y + slotBox.h
    const idolPlacement = placeOnGround(
      durgaAnchors.content, durgaAnchors.foot, durgaAnchors.naturalW, durgaAnchors.naturalH,
      idolGroundCx, idolGroundY, slotBox.w * 0.94, slotBox.h, adjust?.durga,
    )
    const durgaFilterId = `df-${filterIdBase}`
    durgaFilter = tonalFilter(durgaFilterId, durgaAnchors.tone, worldTone, 0.35)
    const idolFootW = Math.max(30, durgaAnchors.foot.w * durgaAnchors.content.w * durgaAnchors.naturalW * idolPlacement.s)
    idolShadow = !thumb && (
      <ellipse cx={idolGroundCx + shadowDx * 0.4} cy={idolGroundY} rx={idolFootW * 0.55} ry={12}
        fill="#2A2621" opacity={0.24} filter="url(#blur-lg)" transform={`skewX(${shadowSkew * 0.6})`} />
    )
    idol = (
      <g data-adjust-target="durga" filter={durgaFilter ? `url(#${durgaFilterId})` : undefined}>
        <g transform={`translate(${idolPlacement.tx} ${idolPlacement.ty}) scale(${idolPlacement.s})`}>
          <image href={durgaAsset.art.src} x={0} y={0} width={durgaAnchors.naturalW} height={durgaAnchors.naturalH} />
        </g>
      </g>
    )
  } else if (durgaAsset?.art) {
    idol = (
      <g data-adjust-target="durga">
        <AdjustableLayer adjust={adjust?.durga} pivot={DURGA_GROUND}>
          <Layer scene={scene} cat="durga" thumb={thumb} filter={soft} />
        </AdjustableLayer>
      </g>
    )
  }

  return (
    <>
      <defs>
        {pandalFilter}
        {durgaFilter}
        <radialGradient id={slotShadeId} cx="50%" cy="30%" r="75%">
          <stop offset="35%" stopColor="#2A2621" stopOpacity="0" />
          <stop offset="100%" stopColor="#2A2621" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {!thumb && (
        <ellipse cx={groundCx + shadowDx} cy={groundY} rx={footWidthCanvas * 0.62} ry={22}
          fill="#2A2621" opacity={0.26} filter="url(#blur-lg)" transform={`skewX(${shadowSkew})`} />
      )}

      <g data-adjust-target="pandal" filter={pandalFilter ? `url(#${pandalFilterId})` : undefined}>
        <g transform={`translate(${placement.tx} ${placement.ty}) scale(${placement.s})`}>
          <image href={pandalAsset.art.src} x={0} y={0} width={pandalAnchors.naturalW} height={pandalAnchors.naturalH} />
        </g>
      </g>

      {idolShadow}
      {idol}

      {/* Shading at the mouth of the opening — this is what reads as "recessed
          into the architecture" even without true multi-layer occlusion; the
          eye takes a darkened opening as depth almost entirely from shading,
          not from what's actually behind what. */}
      {!thumb && idol && (
        <rect x={slotBox.x} y={slotBox.y} width={slotBox.w} height={slotBox.h}
          fill={`url(#${slotShadeId})`} style={{ mixBlendMode: 'multiply' }} opacity={0.6} pointerEvents="none" />
      )}
    </>
  )
}

/** One placed flower/light instance — see `ExtraPlacement` in types.ts.
 *  `data-extra-id` lets the gift video (see `loadArtworkExtra` in
 *  export.ts) isolate and animate this ONE instance on its own — a small,
 *  independently-placed object like a lantern or a bird can plausibly sway
 *  or bob by itself; a whole category layer (which might contain a full
 *  tree or a hut) can't, so those are never tagged for isolation at all
 *  and simply stay part of the still "chrome" background. */
function Extra({ placement }: { placement: ExtraPlacement }) {
  const def = MOTIFS[placement.motif]
  if (!def) return null
  const r = rng(`extra:${placement.id}`)
  return (
    <g data-extra-id={placement.id} transform={`translate(${placement.x} ${placement.y}) scale(${placement.scale})`}>
      {/* An invisible, generous hit target — SVG only hit-tests actually
          painted pixels by default, and most motifs are thin ink strokes
          plus one small filled shape near local (0,0), so a tap square in
          the middle of "the bird" often lands in real, painted-nothing
          space between the wing strokes and the tiny body. A transparent
          fill still counts as "painted" for pointer-events purposes (a
          standard SVG technique), which is what actually makes tap-to-
          select on the canvas (see AdjustPanel's hit-test) work reliably
          instead of only on the rare exact pixel. */}
      <circle r={40} fill="transparent" pointerEvents="all" />
      {def.render(r, placement.color ?? def.swatch)}
    </g>
  )
}

export interface SceneCanvasProps {
  scene: Scene
  /** `thumb` drops every filter and the grain — option cards render 12 at once. */
  variant?: 'full' | 'thumb'
  /**
   * Enables the ambient motion classes (a-drift, a-twinkle, …). Respects
   * prefers-reduced-motion in CSS.
   *
   * Not currently passed `true` anywhere in the app. Measured (CPU-throttled,
   * frame-timing + a categorised Chrome trace) that ANY of these animations —
   * one element or thirty-four, doesn't matter — costs a fixed, severe
   * penalty here specifically: they run inside the wc-rough/wc-soft
   * feTurbulence filter groups, and Chromium does not give SVG transform/
   * opacity CSS animations the same compositor-only fast path HTML elements
   * get, so every frame re-enters Blink's main-thread style/layout pipeline
   * (confirmed: with no ambience active, the same scene holds a clean 60fps;
   * with any ambience active, a consistent ~30fps regardless of which one).
   * `will-change` narrows the gap but doesn't close it. This read as the
   * "blinking" reported from real devices. Left in place, disabled by
   * default, for whenever the rendering approach changes enough to afford it
   * (e.g. a canvas/WebGL compositor, or real painted assets replacing the
   * procedural filters this depends on) — not something to re-enable as-is.
   */
  alive?: boolean
  className?: string
  title?: string
  children?: ReactNode
  /** A user's manual nudge on the pandal/idol placement — see `SceneAdjust`
   * in types.ts. Undefined (the common case) means pure auto-placement. */
  adjust?: SceneAdjust
  /** Extra hand-placed flowers/lights on top of the base scatter — see
   * `ExtraPlacement` in types.ts. */
  extras?: ExtraPlacement[]
  /**
   * Zoom the camera into one region of the 1000×1500 canvas instead of
   * showing the whole thing — everything still draws at its normal full-
   * scene position, only the `viewBox` changes. Exists for option-picker
   * thumbnails: a pandal or idol drawn at its ordinary in-scene size is a
   * small figure on a big canvas, which at a 136px-wide card is too small
   * to judge — let alone see hand-drawn detail like hair or a carved panel.
   * See `THUMB_CROP` in AssetThumb below.
   */
  cropBox?: Box
  /** React 19 accepts `ref` as a plain prop on function components — no forwardRef. */
  ref?: React.Ref<SVGSVGElement>
}

export default function SceneCanvas({
  scene, variant = 'full', alive = false, className, title, children, adjust, extras, cropBox, ref,
}: SceneCanvasProps) {
  const thumb = variant === 'thumb'
  const rough = thumb ? undefined : 'url(#wc-rough)'
  const soft = thumb ? undefined : 'url(#wc-soft)'
  const ctx = sceneContext(scene)
  const vb = cropBox ?? { x: 0, y: 0, w: W, h: H }

  return (
    <svg
      ref={ref}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={title ?? 'Your Alpona'}
      style={{ display: 'block' }}
    >
      <g data-anim="chrome"><Paper tone={ctx.isNight ? '#EDE6DA' : '#F2ECE1'} /></g>

      <g className={alive ? 'alive' : undefined}>
        {/*
          `wc-rough`/`wc-soft` displace pixels via feTurbulence — a wobble
          that reads as hand-painted imprecision on a PROCEDURAL vector path,
          but on a real painted-image asset it just warps the actual
          artwork (str­aight lines going wavy, detail smearing) since it's
          randomly shifting pixels of a picture that was already painted,
          not redrawing a line. World is now always a real image, so it
          renders outside `rough` entirely; Sky is still procedural (not yet
          migrated) and keeps the wobble, since it still benefits from it.
        */}
        {/* `data-anim="chrome"` marks the groups the gift video treats as a
            still background it rasterises once and never moves (see
            `loadArtworkChrome` in export.ts) — sky, world, the pandal/idol,
            the atmospheric washes, AND the flowers/decor/ambience CATEGORY
            layers. Those category layers are one asset's whole pre-authored
            composition (a hut, a full tree, a scatter of many petals) with
            no per-piece addressability, so animating the group as one rigid
            body used to mean "the entire tree slides sideways" — physically
            nonsensical, not "alive." Only genuinely independent, individually
            hand-placed objects (see `Extra`'s `data-extra-id` above) are
            ever isolated and animated on their own; a category layer never
            is. `data-anim` has no meaning outside the gift-video recorder. */}
        <g data-anim="chrome" filter={rough}>
          <Layer scene={scene} cat="sky" thumb={thumb} />
        </g>
        <g data-anim="chrome">
          <Layer scene={scene} cat="world" thumb={thumb} filter={getAsset('world', scene.world)?.art?.kind === 'proc' ? rough : undefined} />
        </g>
        {/* Same reasoning: the pandal and idol are always real images now,
            so `PandalAndIdol` sits outside `soft` — flowers/decor are still
            procedural and keep it. */}
        <g data-anim="chrome">
          <PandalAndIdol scene={scene} thumb={thumb} adjust={adjust} />
        </g>
        {/* Same invisible-hit-target idea as `Extra`'s circle: a real
            painted illustration still has real empty gaps (between roof
            tiers, at a spire's point, the space around a raised arm), so a
            tap square in the middle of "the pandal" can easily land on
            nothing painted at all. These give tap-to-select a reliable,
            generous target sized to each one's own layout box (the same
            boxes auto-placement itself uses) instead of only the sparser
            painted pixels. Durga's is drawn AFTER pandal's here on purpose:
            their boxes overlap (she stands inside the pandal's opening), and
            later-painted siblings win ties in `elementsFromPoint`'s stack —
            a tap near the idol should select her, not the structure behind
            her. Not shown to thumbs; nothing there is tappable. */}
        {!thumb && (
          <>
            <rect data-adjust-target="pandal" x={CATEGORY_BOX.pandal!.x} y={CATEGORY_BOX.pandal!.y}
              width={CATEGORY_BOX.pandal!.w} height={CATEGORY_BOX.pandal!.h} fill="transparent" pointerEvents="all" />
            <rect data-adjust-target="durga" x={CATEGORY_BOX.durga!.x} y={CATEGORY_BOX.durga!.y}
              width={CATEGORY_BOX.durga!.w} height={CATEGORY_BOX.durga!.h} fill="transparent" pointerEvents="all" />
          </>
        )}
        <g filter={soft} data-anim="chrome">
          <g data-adjust-target="flowers">
            <AdjustableLayer adjust={adjust?.flowers} pivot={[500, 750]}>
              <Layer scene={scene} cat="flowers" thumb={thumb} />
            </AdjustableLayer>
          </g>
          <g data-adjust-target="decor">
            <AdjustableLayer adjust={adjust?.decor} pivot={[500, 750]}>
              <Layer scene={scene} cat="decor" thumb={thumb} />
            </AdjustableLayer>
          </g>
        </g>
        {/* Individually-placed extras sit in their OWN group, outside the
            category layers above — each one gets its own `data-extra-id`
            (see `Extra`) so the gift video can isolate and move just that
            one small object, independently of whatever bulk category art
            happens to be behind it. */}
        <g filter={soft}>
          {!thumb && extras?.map(p => <Extra key={p.id} placement={p} />)}
        </g>
        <g data-anim="chrome">
          <AdjustableLayer adjust={adjust?.ambience} pivot={[500, 750]}>
            <Layer scene={scene} cat="ambience" thumb={thumb} />
          </AdjustableLayer>
        </g>
        {/* Light goes on last, over everything, which is what makes it
            change the whole picture rather than add an object to it. Pivoted
            from the top-centre, not the frame's middle — a hanging
            chandelier's own mount point, so resizing it grows it from the
            ceiling down instead of from the canvas centre outward. */}
        <g data-anim="lighting">
          <AdjustableLayer adjust={adjust?.lighting} pivot={[500, 0]}>
            <Layer scene={scene} cat="lighting" thumb={thumb} />
          </AdjustableLayer>
        </g>
      </g>

      {!thumb && <g data-anim="chrome"><Vignette strength={ctx.isNight ? 0.26 : 0.14} /></g>}
      {/*
        A DIRECTIONAL wash, not a flat one: it runs along `ctx.light`'s own
        axis, warm/tinted on the light side and cooler on the far side. A
        flat rect over the whole scene reads as a colour filter; a gradient
        along the actual light axis reads as illumination, because it
        changes *across* the picture the way real light falling from one
        side would, rather than shifting every pixel by the same amount.
        Only applied once a Lighting choice is actually made — skipping the
        step (it's optional precisely so this is escapable) means "no light
        recolouring, please," not "fall back to a default one." Some
        combinations read better with nothing added on top at all.
      */}
      {!thumb && scene.lighting && (
        <g data-anim="chrome">
          <DirectionalWash light={ctx.light} tint={ctx.lightTint} strength={ctx.isNight ? 0.22 : 0.15} />
        </g>
      )}
      {!thumb && (
        <g data-anim="chrome">
          <rect width={W} height={H} filter="url(#paper-grain)" opacity={0.055}
            style={{ mixBlendMode: 'multiply' }} pointerEvents="none" />
        </g>
      )}
      {children}
    </svg>
  )
}

function DirectionalWash({ light, tint, strength }: { light: SceneContext['light']; tint: string; strength: number }) {
  const id = `wash-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const x1 = light.x * 100, y1 = light.y * 100
  const x2 = (1 - light.x) * 100, y2 = (1 - light.y) * 100
  return (
    <>
      <defs>
        <linearGradient id={id} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
          <stop offset="0%" stopColor={tint} stopOpacity={strength} />
          <stop offset="100%" stopColor={tint} stopOpacity={strength * 0.25} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} style={{ mixBlendMode: 'soft-light' }} pointerEvents="none" />
    </>
  )
}

/**
 * Idol and pandal both draw at a fixed, modest size on the full 1000×1500
 * canvas — correct for the finished scene, but it means an option card
 * showing the WHOLE canvas renders them as a small figure floating in a lot
 * of empty sky, too small to judge (a face, hair, or a carved panel is
 * illegible at that scale). These crop the same drawing into just the
 * region it actually occupies, generous enough to cover the tallest crown
 * (`monumental`'s 1.3× scale) and the widest pandal without clipping.
 * `w`/`h` are both a 4:5 ratio, matching the option card's own aspect, so
 * the crop fills the card edge-to-edge with no further slicing.
 */
const THUMB_CROP: Partial<Record<CategoryId, Box>> = {
  durga: { x: 200, y: 440, w: 600, h: 750 },
  pandal: { x: 170, y: 420, w: 660, h: 825 },
}

/** Small square preview of a single asset, for option cards. */
export function AssetThumb({ cat, asset, scene, className }: {
  cat: CategoryId; asset: Asset; scene: Scene; className?: string
}) {
  // Scene-wide categories need context to be judged; object layers read better
  // isolated. Either way the preview is capped at four layers, because a dozen
  // of these render at once on a mid-range phone.
  const contextual = cat === 'lighting' || cat === 'sky'
  const s: Scene = contextual
    ? { world: scene.world, pandal: scene.pandal, sky: scene.sky, lighting: scene.lighting, [cat]: asset.id }
    : { world: cat === 'world' ? asset.id : scene.world, lighting: scene.lighting, [cat]: asset.id }
  return <SceneCanvas scene={s} variant="thumb" className={className} title={asset.name} cropBox={THUMB_CROP[cat]} />
}
