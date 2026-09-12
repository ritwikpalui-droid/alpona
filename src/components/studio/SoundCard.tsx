'use client'

import { useState } from 'react'
import type { Asset, MatchLabel } from '@/lib/types'
import { previewSound, stopSound } from '@/lib/audio'
import MatchBadge from '@/components/MatchBadge'

/**
 * Soundscapes are metadata, not artwork, so they get their own visual language
 * instead of an empty SceneCanvas: a soft gradient keyed to the sound's own
 * palette, a waveform glyph shaped by which layers it mixes, and a preview
 * button — the brief is explicit that this must not read as a dropdown (§14).
 */

function bars(asset: Asset): number[] {
  const s = asset.sound ?? {}
  const vals = [s.dhak ?? 0, s.rain ?? 0, s.water ?? 0, s.wind ?? 0, s.crowd ?? 0, s.bells ?? 0, s.insects ?? 0, s.conch ?? 0]
  const seed = [...asset.id].reduce((a, c) => a + c.charCodeAt(0), 0)
  return Array.from({ length: 9 }, (_, i) => {
    const base = vals[i % vals.length]
    const wobble = ((Math.sin(seed + i * 2.7) + 1) / 2) * 0.4
    return Math.max(0.12, Math.min(1, base * 0.75 + wobble + (asset.sound?.drone ? 0.15 : 0)))
  })
}

export default function SoundCard({
  asset, isActive, label, showLabel, onSelect,
}: {
  asset: Asset
  isActive: boolean
  label: MatchLabel
  showLabel: boolean
  onSelect: (id: string) => void
}) {
  const [previewing, setPreviewing] = useState(false)
  const heights = bars(asset)
  const [c1, c2] = asset.palette

  const preview = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (previewing) { stopSound(); setPreviewing(false); return }
    setPreviewing(true)
    await previewSound(asset.sound)
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      onClick={() => { onSelect(asset.id); setPreviewing(true) }}
      className={[
        'group relative w-[136px] shrink-0 overflow-hidden rounded-2xl text-left sm:w-[150px]',
        'transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,0.61,0.24,1)]',
        isActive
          ? 'scale-[1.015] shadow-[0_10px_34px_-16px_rgba(35,32,27,0.5)] ring-2 ring-ink'
          : 'ring-1 ring-ink/12 hover:ring-ink/28 active:scale-[0.985]',
      ].join(' ')}
    >
      <div
        className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(155deg, ${c1}33, ${c2}22 60%, #F4EFE5 100%)` }}
      >
        <div className="flex h-12 items-end gap-[3px]" aria-hidden>
          {heights.map((h, i) => (
            <span
              key={i}
              className={previewing ? 'a-bar' : undefined}
              style={{
                height: `${h * 44}px`, width: '4px', borderRadius: '3px',
                background: c1, opacity: 0.55 + h * 0.4,
                animationDelay: `${i * 0.09}s`,
              }}
            />
          ))}
        </div>

        <div
          onClick={preview}
          role="button"
          aria-label={previewing ? 'Stop preview' : `Preview ${asset.name}`}
          className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-paper/85 text-[13px] text-ink shadow-sm backdrop-blur transition-transform active:scale-90"
        >
          {previewing ? '❚❚' : '▶'}
        </div>

        {isActive && (
          <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] text-paper">✓</span>
        )}
      </div>

      <div className="space-y-1 bg-paper px-2.5 py-2">
        <p className="truncate text-[12.5px] font-medium leading-tight text-ink">{asset.name}</p>
        {showLabel ? <MatchBadge label={label} /> : <p className="truncate text-[10.5px] leading-tight text-ink-3">{asset.subtitle}</p>}
      </div>
    </button>
  )
}
