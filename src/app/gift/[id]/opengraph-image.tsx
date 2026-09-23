import { ImageResponse } from 'next/og'
import { giftStore } from '@/lib/gift/store'
import { getHolder } from '@/lib/gift/holders'
import { getBox } from '@/lib/gift/chocolateBoxes'

/**
 * The link-unfurl image — same reasoning as `/w/[id]/opengraph-image.tsx`:
 * Satori can't render the real SVG art, so this is a flat, dependency-free
 * card built from the same swatch colours every holder/box already carries.
 * It's a bonus for platforms that unfurl links, not the primary "2D first"
 * mechanism — `GiftRevealClient`'s own sealed state is (plain SMS never
 * shows this at all).
 */

export const alt = 'A gift, wrapped'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const KIND_EMOJI: Record<string, string> = { bouquet: '💐', chocolate: '🍫' }

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gift = await giftStore.get(id)

  const swatch = gift
    ? (gift.build.kind === 'bouquet' ? getHolder(gift.build.holderId)?.swatch : getBox(gift.build.boxId)?.swatch)
    : undefined
  const c1 = swatch ?? '#D08C8C'
  const title = gift?.title ?? 'A gift, wrapped'
  const byline = gift ? `from ${gift.nickname}` : ''
  const emoji = gift ? KIND_EMOJI[gift.build.kind] : '🎁'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: 72,
          background: `linear-gradient(135deg, ${c1}33 0%, #F4EFE5 60%)`,
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4, color: '#8A8071', textTransform: 'uppercase' }}>
          ALPONA
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 920 }}>
          <div style={{ display: 'flex', fontSize: 90, marginBottom: 12 }}>{emoji}</div>
          <div style={{ display: 'flex', fontSize: 72, lineHeight: 1.08, color: '#23201B' }}>{title}</div>
          <div style={{ display: 'flex', fontSize: 28, marginTop: 20, color: '#4F4840', fontFamily: 'sans-serif' }}>
            {byline}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#23201B', fontFamily: 'sans-serif' }}>
          Tap to open →
        </div>
      </div>
    ),
    { ...size },
  )
}
