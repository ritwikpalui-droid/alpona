'use client'

import { useMemo } from 'react'
import { rng } from '@/lib/rng'
import { getHolder } from '@/lib/gift/holders'
import { getFlower } from '@/lib/gift/flowers'
import { orbitPose, evenAngles, backFade } from '@/lib/gift/rotation'

export interface BouquetItemInput {
  id: string
  flowerId: string
  color?: string
}

export interface BouquetViewProps {
  holderId: string
  holderColor?: string
  items: BouquetItemInput[]
  /** Current rotation, degrees. Live — recompute every frame, never bake. */
  angleDeg: number
  /** Bump to re-roll each flower's placement jitter without touching which
   *  flowers are in the bouquet or how any one of them is drawn — the
   *  "🔀 Shuffle" override in place of manual per-flower dragging. */
  shuffleSeed?: number
  size?: number
}

/**
 * Composes a holder + its flowers at the given view angle. Every part's own
 * geometry (petals, holder silhouette) is painted exactly once, memoised on
 * its own stable identity (holder id, item id) — rotating only recomputes
 * cheap per-part `translate`/`scale`/`opacity` numbers from `rotation.ts`,
 * never a path string. That split is what keeps a drag gesture smooth; see
 * the file-level note in `rotation.ts`.
 */
export default function BouquetView({ holderId, holderColor, items, angleDeg, shuffleSeed = 0, size = 320 }: BouquetViewProps) {
  const holder = getHolder(holderId)

  const built = useMemo(() => {
    if (!holder) return null
    return holder.draw(rng(`holder:${holderId}`), holderColor ?? holder.swatch)
  }, [holder, holderId, holderColor])

  const flowerParts = useMemo(() => {
    const angles = evenAngles(items.length)
    const rim = (built?.rim.radius ?? 40) + 8
    return items.map((item, i) => {
      const flower = getFlower(item.flowerId)
      if (!flower) return null
      // Two independent streams: placement jitter (what shuffle re-rolls)
      // never shares draws with the flower's own petal geometry — shuffling
      // rearranges the bouquet, it doesn't repaint any flower in it.
      const jr = rng(`bouquet-placement:${item.id}:${shuffleSeed}`)
      const dr = rng(`bouquet-flower:${item.id}`)
      const placementDeg = angles[i] + jr.jitter(12)
      return {
        key: item.id,
        kind: 'flower' as const,
        placementDeg,
        radius: rim + jr.jitter(6),
        node: flower.draw(dr, item.color ?? flower.swatch),
      }
    }).filter((p): p is NonNullable<typeof p> => p !== null)
  }, [items, built, shuffleSeed])

  if (!holder || !built) return null

  const decoParts = built.decorations.map((d, i) => ({
    key: 'deco' + i,
    kind: 'deco' as const,
    placementDeg: d.angleDeg,
    radius: d.radius,
    node: d.node,
  }))

  const parts = [...flowerParts, ...decoParts]
    .map(p => ({ ...p, pose: orbitPose(angleDeg, p.placementDeg, p.radius) }))
    .sort((a, b) => a.pose.zOrder - b.pose.zOrder)

  return (
    <svg viewBox="-140 -180 280 360" width={size} height={size * (360 / 280)} role="img" aria-label="Bouquet preview">
      {/* the holder body itself is never transformed by view angle — a
          round vase/basket genuinely looks the same from any side */}
      {built.body}
      {parts.map(p => (
        <g
          key={p.key}
          transform={`translate(${p.pose.x} 0) scale(${p.pose.scale})`}
          // A single decoration (a ribbon, a handle) is one specific
          // front-facing feature and should properly vanish round the
          // back. A whole cluster of flowers should never fully vanish —
          // real gathered flowers still read as "there," just smaller and
          // dimmer, the further round they sit.
          opacity={p.kind === 'flower' ? 0.4 + 0.6 * p.pose.facing : backFade(p.pose.facing)}
        >
          {p.node}
        </g>
      ))}
    </svg>
  )
}
