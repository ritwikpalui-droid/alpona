'use client'

import { useMemo } from 'react'
import { rng } from '@/lib/rng'
import { getBox, BOX_W, BOX_H, BOX_D } from '@/lib/gift/chocolateBoxes'
import { getPiece } from '@/lib/gift/chocolatePieces'

/**
 * A chocolate box is NOT a bouquet: its front/side/lid faces genuinely
 * appear and disappear as it turns, and a continuous full 360° spin makes
 * a flat face "pop" through a seam at the 90°/270° transitions with no
 * clean way to hide it (stress-tested during planning, not guessed at).
 * So this only ever wobbles within a bounded arc (the CALLER clamps
 * `angleDeg`, same `ImpressionViewer` drag as the bouquet drives it) —
 * within that arc, simple face-width scaling by cos/sin genuinely holds
 * up. The real payoff is `open`: tipping the lid back to reveal the
 * pieces inside, which is cheaper to build than a full spin AND the more
 * satisfying reveal for a chocolate gift specifically.
 */
export interface ChocolateItemInput {
  id: string
  pieceId: string
}

export interface ChocolateBoxViewProps {
  boxId: string
  boxColor?: string
  items: ChocolateItemInput[]
  /** Wobble angle, degrees — caller must bound this (see WOBBLE_LIMIT_DEG). */
  angleDeg: number
  open: boolean
  size?: number
}

export const WOBBLE_LIMIT_DEG = 55

function deg2rad(d: number) {
  return (d * Math.PI) / 180
}

export default function ChocolateBoxView({ boxId, boxColor, items, angleDeg, open, size = 320 }: ChocolateBoxViewProps) {
  const box = getBox(boxId)
  const built = useMemo(() => {
    if (!box) return null
    return box.draw(rng(`box:${boxId}`), boxColor ?? box.swatch)
  }, [box, boxId, boxColor])

  const grid = useMemo(() => {
    const cols = 5
    const rows = 3
    const cellW = BOX_W / cols
    const cellH = BOX_D / rows
    return items.slice(0, cols * rows).map((item, i) => {
      const piece = getPiece(item.pieceId)
      if (!piece) return null
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = -BOX_W / 2 + cellW * (col + 0.5)
      const y = -BOX_D / 2 + cellH * (row + 0.5)
      return { key: item.id, x, y, node: piece.draw(rng(`choc-piece:${item.id}`), piece.swatch) }
    }).filter((p): p is NonNullable<typeof p> => p !== null)
  }, [items])

  if (!box || !built) return null

  const rad = deg2rad(Math.max(-WOBBLE_LIMIT_DEG, Math.min(WOBBLE_LIMIT_DEG, angleDeg)))
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  const sideSign = s === 0 ? 1 : Math.sign(s)
  const sideW = BOX_D * Math.abs(s)
  const edgeX = sideSign * (BOX_W / 2) * c

  // A hinge "openness" of 0..1 — this is a discrete toggle, not a per-frame
  // drag value, so a CSS transition on the lid group is enough; no rAF
  // loop needed for it the way the rotation itself needs one.
  const openT = open ? 1 : 0
  const lidY = -BOX_H / 2 - BOX_D / 2 - openT * 78
  const lidScaleY = 1 - openT * 0.55
  const lidRotate = -openT * 18 * sideSign

  return (
    <svg viewBox="-170 -220 340 320" width={size} height={size * (320 / 340)} role="img" aria-label="Chocolate box preview">
      {/* the open cavity + pieces, sitting where the lid normally rests —
          drawn BEFORE the lid group so the lid, still swinging away above
          it, never has to be pierced or reordered mid-animation */}
      <g transform={`translate(0 ${-BOX_H / 2 - BOX_D / 2}) scale(${c} 1)`} opacity={open ? 1 : 0}>
        <rect x={-BOX_W / 2} y={-BOX_D / 2} width={BOX_W} height={BOX_D} fill="#3A342C" opacity={0.5} />
        {grid.map(p => (
          <g key={p.key} transform={`translate(${p.x} ${p.y})`}>{p.node}</g>
        ))}
      </g>

      {/* front face — foreshortened by the wobble */}
      <g transform={`scale(${c} 1)`}>{built.front}</g>

      {/* side face — only the box style's colour needs to travel here, the
          shape/shading is generic to any box */}
      {sideW > 0.5 && (
        <g opacity={0.9}>
          <path
            d={`M ${edgeX} ${-BOX_H / 2} L ${edgeX + sideSign * sideW} ${-BOX_H / 2 + 6} L ${edgeX + sideSign * sideW} ${BOX_H / 2 - 6} L ${edgeX} ${BOX_H / 2} Z`}
            fill="#2A2621" opacity={0.22}
          />
        </g>
      )}

      {/* the lid — tips up and back on open, foreshortening as it goes */}
      <g style={{ transition: 'transform 480ms cubic-bezier(0.22,0.61,0.24,1)' }}
        transform={`translate(0 ${lidY}) rotate(${lidRotate}) scale(${c} ${lidScaleY})`}>
        {built.lid}
      </g>
    </svg>
  )
}
