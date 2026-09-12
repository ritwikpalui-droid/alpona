import { ImageResponse } from 'next/og'
import { store } from '@/lib/store'
import { getAsset } from '@/lib/assets'

/**
 * The link-unfurl image for WhatsApp/Twitter/Discord previews. Deliberately
 * simple: Satori (which powers ImageResponse) cannot render our SVG turbulence
 * filters, so rather than fight that, this draws a light card from the same
 * palette data every asset already carries — fast, dependency-free, ₹0.
 * The rich 9:16 share card (lib/export.ts) is what users actually post.
 */

export const alt = 'A Puja World, imagined'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const world = await store.get(id)

  const light = getAsset('lighting', world?.scene.lighting)
  const sky = getAsset('sky', world?.scene.sky)
  const [c1, c2] = light?.palette ?? sky?.palette ?? ['#DE8F2C', '#33415E']
  const title = world?.title ?? 'A Puja World'
  const byline = world ? `by ${world.nickname}` : ''
  const votes = world ? `${world.votes.toLocaleString('en-IN')} votes` : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: 72,
          background: `linear-gradient(135deg, ${c1}2E 0%, #F4EFE5 55%, ${c2}22 100%)`,
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4, color: '#8A8071', textTransform: 'uppercase' }}>
          PUJA WORLD 2026
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 920 }}>
          <div style={{ display: 'flex', fontSize: 76, lineHeight: 1.08, color: '#23201B' }}>{title}</div>
          <div style={{ display: 'flex', fontSize: 28, marginTop: 20, color: '#4F4840', fontFamily: 'sans-serif' }}>
            {[byline, votes].filter(Boolean).join('   ·   ')}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#23201B', fontFamily: 'sans-serif' }}>
          Build yours →
        </div>
      </div>
    ),
    { ...size },
  )
}
