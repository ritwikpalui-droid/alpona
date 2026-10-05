'use client'

import { useMemo } from 'react'
import { rng } from '@/lib/rng'
import { getBox, BOX_W, BOX_H, BOX_D } from '@/lib/gift/mishtiBoxes'
import { getMishti } from '@/lib/gift/mishtiVarieties'

export interface MishtiItemInput {
  id: string
  itemId: string
}

export interface MishtiBoxViewProps {
  boxId: string
  boxColor?: string
  items: MishtiItemInput[]
  angleDeg: number
  open: boolean
  size?: number
}

export const WOBBLE_LIMIT_DEG = 55

function deg2rad(d: number) {
  return (d * Math.PI) / 180
}

export default function MishtiBoxView({ boxId, boxColor, items, angleDeg, open, size = 320 }: MishtiBoxViewProps) {
  const box = getBox(boxId)
  const built = useMemo(() => {
    if (!box) return null
    return box.draw(rng(`box:${boxId}`), boxColor ?? box.swatch)
  }, [box, boxId, boxColor])

  const grid = useMemo(() => {
    const cols = 4
    const rows = 3
    const cellW = BOX_W / cols
    const cellH = BOX_D / rows
    return items.slice(0, cols * rows).map((item, i) => {
      const sweet = getMishti(item.itemId)
      if (!sweet) return null
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = -BOX_W / 2 + cellW * (col + 0.5)
      const y = -BOX_D / 2 + cellH * (row + 0.5)
      return { key: item.id, x, y, node: sweet.draw(rng(`mishti:${item.id}`), sweet.swatch) }
    }).filter((p): p is NonNullable<typeof p> => p !== null)
  }, [items])

  if (!box || !built) return null

  const rad = deg2rad(Math.max(-WOBBLE_LIMIT_DEG, Math.min(WOBBLE_LIMIT_DEG, angleDeg)))
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  const sideSign = s === 0 ? 1 : Math.sign(s)
  const sideW = BOX_D * Math.abs(s)
  const edgeX = sideSign * (BOX_W / 2) * c

  const openT = open ? 1 : 0
  const lidY = -BOX_H / 2 - BOX_D / 2 - openT * 78
  const lidScaleY = 1 - openT * 0.55
  const lidRotate = -openT * 18 * sideSign

  return (
    <svg viewBox="-170 -220 340 320" width={size} height={size * (320 / 340)} role="img" aria-label="Mishti box preview">
      <g transform={`translate(0 ${-BOX_H / 2 - BOX_D / 2}) scale(${c} 1)`} opacity={open ? 1 : 0}>
        <rect x={-BOX_W / 2} y={-BOX_D / 2} width={BOX_W} height={BOX_D} fill="#3A342C" opacity={0.5} />
        {grid.map(p => (
          <g key={p.key} transform={`translate(${p.x} ${p.y})`}>{p.node}</g>
        ))}
      </g>

      <g transform={`scale(${c} 1)`}>{built.front}</g>

      {sideW > 0.5 && (
        <g opacity={0.9}>
          <path
            d={`M ${edgeX} ${-BOX_H / 2} L ${edgeX + sideSign * sideW} ${-BOX_H / 2 + 6} L ${edgeX + sideSign * sideW} ${BOX_H / 2 - 6} L ${edgeX} ${BOX_H / 2} Z`}
            fill="#2A2621" opacity={0.22}
          />
        </g>
      )}

      <g style={{ transition: 'transform 480ms cubic-bezier(0.22,0.61,0.24,1)' }}
        transform={`translate(0 ${lidY}) rotate(${lidRotate}) scale(${c} ${lidScaleY})`}>
        {built.lid}
      </g>
    </svg>
  )
}
