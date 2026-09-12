import type { ReactNode } from 'react'
import type { Asset, CategoryId, Scene } from '@/lib/types'
import { getAsset } from '@/lib/assets'
import { sceneContext } from '@/lib/scene'
import { rng } from '@/lib/rng'
import { ArtDefs, Paper, Vignette } from '@/lib/art/primitives'
import { H, W } from '@/lib/art/palette'

/**
 * Composites the chosen layers into one artwork.
 *
 * Turbulence filters are applied to *layer groups*, not to individual paths —
 * two filter passes for the whole scene instead of a hundred. That is the
 * difference between smooth and unusable on a mid-range Android.
 */

const FULL_BOX = { x: 0, y: 0, w: W, h: H }

function Layer({ scene, cat, filter }: { scene: Scene; cat: CategoryId; filter?: string }) {
  const asset: Asset | undefined = getAsset(cat, scene[cat])
  if (!asset?.art) return null
  const ctx = sceneContext(scene)
  if (asset.art.kind === 'image') {
    return <image href={asset.art.src} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
  }
  const node = asset.art.draw(rng(`${cat}:${asset.id}`), FULL_BOX, ctx)
  if (!node) return null
  // Keyed on the asset id: swapping a layer remounts this group, which restarts
  // the paint-in animation. That is what makes a choice feel like a brushstroke.
  return <g key={asset.id} data-layer={cat} className="layer-paint" filter={filter}>{node}</g>
}

export interface SceneCanvasProps {
  scene: Scene
  /** `thumb` drops every filter and the grain — option cards render 12 at once. */
  variant?: 'full' | 'thumb'
  /** Enables the ambient motion classes. Respects prefers-reduced-motion in CSS. */
  alive?: boolean
  className?: string
  title?: string
  children?: ReactNode
  /** React 19 accepts `ref` as a plain prop on function components — no forwardRef. */
  ref?: React.Ref<SVGSVGElement>
}

export default function SceneCanvas({
  scene, variant = 'full', alive = false, className, title, children, ref,
}: SceneCanvasProps) {
  const thumb = variant === 'thumb'
  const rough = thumb ? undefined : 'url(#wc-rough)'
  const soft = thumb ? undefined : 'url(#wc-soft)'
  const ctx = sceneContext(scene)

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={title ?? 'Your Puja world'}
      style={{ display: 'block' }}
    >
      {!thumb && <ArtDefs />}
      <Paper tone={ctx.isNight ? '#EDE6DA' : '#F2ECE1'} />

      <g className={alive ? 'alive' : undefined}>
        <g filter={rough}>
          <Layer scene={scene} cat="sky" />
          <Layer scene={scene} cat="world" />
        </g>
        <g filter={soft}>
          <Layer scene={scene} cat="pandal" />
          <Layer scene={scene} cat="durga" />
          <Layer scene={scene} cat="flowers" />
          <Layer scene={scene} cat="decor" />
        </g>
        <Layer scene={scene} cat="ambience" />
        {/* Light goes on last, over everything, which is what makes it
            change the whole picture rather than add an object to it. */}
        <Layer scene={scene} cat="lighting" />
      </g>

      <Vignette strength={ctx.isNight ? 0.26 : 0.14} />
      {!thumb && (
        <rect width={W} height={H} filter="url(#paper-grain)" opacity={0.055}
          style={{ mixBlendMode: 'multiply' }} pointerEvents="none" />
      )}
      {children}
    </svg>
  )
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
  return <SceneCanvas scene={s} variant="thumb" className={className} title={asset.name} />
}
