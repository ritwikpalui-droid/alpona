'use client'

import { useMemo } from 'react'
import { rng } from '@/lib/rng'
import { getFlower, flowers } from '@/lib/gift/flowers'
import { getMishti, varieties } from '@/lib/gift/mishtiVarieties'
import { getPiece, pieces } from '@/lib/gift/chocolatePieces'
import type { ImpressionBuild } from '@/lib/gift/types'

interface GiftTopViewProps {
  build: ImpressionBuild
  size?: number
}

export default function GiftTopView({ build, size = 320 }: GiftTopViewProps) {
  const content = useMemo(() => {
    if (build.kind === 'bouquet') {
      return build.items.map((item, index) => {
        const flower = getFlower(item.flowerId)
        if (!flower) return null
        const angle = (index / Math.max(build.items.length, 1)) * Math.PI * 2 - Math.PI / 2
        const x = Math.cos(angle) * 92
        const y = Math.sin(angle) * 76
        return { key: item.id, x, y, node: flower.draw(rng(`top-flower:${item.id}`), item.color ?? flower.swatch) }
      }).filter((item): item is NonNullable<typeof item> => item !== null)
    }

    if (build.kind === 'mishti') {
      return build.items.map((item, index) => {
        const sweet = getMishti(item.itemId)
        if (!sweet) return null
        const col = index % 4
        const row = Math.floor(index / 4)
        return { key: item.id, x: -54 + col * 36, y: -42 + row * 34, node: sweet.draw(rng(`top-mishti:${item.id}`), sweet.swatch) }
      }).filter((item): item is NonNullable<typeof item> => item !== null)
    }

    return build.items.map((item, index) => {
      const piece = getPiece(item.pieceId)
      if (!piece) return null
      const col = index % 4
      const row = Math.floor(index / 4)
      return { key: item.id, x: -54 + col * 36, y: -36 + row * 30, node: piece.draw(rng(`top-chocolate:${item.id}`), piece.swatch) }
    }).filter((item): item is NonNullable<typeof item> => item !== null)
  }, [build])

  const title = build.kind === 'bouquet'
    ? 'Bouquet top view'
    : build.kind === 'chocolate'
      ? 'Chocolate top view'
      : 'Mishti top view'

  return (
    <svg viewBox="-130 -125 260 250" width={size} height={size} role="img" aria-label={title}>
      <g opacity="0.18" fill="none" stroke="#23201B" strokeWidth="1">
        <circle cx="0" cy="0" r="105" />
        <circle cx="0" cy="0" r="72" />
        <path d="M -105 0 H 105 M 0 -105 V 105" />
      </g>
      {content.map(item => <g key={item.key} transform={`translate(${item.x} ${item.y}) scale(0.8)`}>{item.node}</g>)}
      {build.kind === 'bouquet' && <path d="M -112 92 Q 0 118 112 92" fill="none" stroke="#23201B" strokeWidth="1.5" opacity="0.28" />}
      {build.kind === 'chocolate' && <rect x="-98" y="-94" width="196" height="188" rx="9" fill="none" stroke="#23201B" strokeWidth="1.5" opacity="0.28" />}
      {build.kind === 'mishti' && <rect x="-98" y="-94" width="196" height="188" rx="9" fill="none" stroke="#23201B" strokeWidth="1.5" opacity="0.28" />}
    </svg>
  )
}

export function itemNames(build: ImpressionBuild) {
  if (build.kind === 'bouquet') return build.items.map(item => getFlower(item.flowerId)?.name ?? item.flowerId)
  if (build.kind === 'mishti') return build.items.map(item => getMishti(item.itemId)?.name ?? item.itemId)
  return build.items.map(item => getPiece(item.pieceId)?.name ?? item.pieceId)
}

export const allFlowerNames = flowers.map(flower => flower.name)
export const allMishtiNames = varieties.map(item => item.name)
export const allChocolateNames = pieces.map(piece => piece.name)
