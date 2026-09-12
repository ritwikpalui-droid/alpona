'use client'

import { useEffect, useRef } from 'react'
import type { CategoryId, Scene, ScoredAsset } from '@/lib/types'
import { AssetThumb } from '@/components/SceneCanvas'
import MatchBadge from '@/components/MatchBadge'
import SoundCard from './SoundCard'

/**
 * The picker. A horizontal rail of watercolour cards, snapped, thumb-reachable,
 * every target well over 44px. Not a dropdown, not a grid of icons (§29).
 */
export default function OptionRail({
  category, options, selected, scene, showLabels, onSelect,
}: {
  category: CategoryId
  options: ScoredAsset[]
  selected?: string
  scene: Scene
  /** Match labels are meaningless on the first step — nothing to match against. */
  showLabels: boolean
  onSelect: (id: string) => void
}) {
  const railRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Bring the chosen card into view when the step changes or Surprise Me fires,
  // but never fight a scroll the user is in the middle of.
  useEffect(() => {
    const el = activeRef.current
    if (!el) return
    const id = requestAnimationFrame(() =>
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }),
    )
    return () => cancelAnimationFrame(id)
  }, [category, selected])

  return (
    <div
      ref={railRef}
      className="rail -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 pt-1 sm:-mx-6 sm:px-6"
      role="radiogroup"
      aria-label="Choose an option"
    >
      {options.map(({ asset, score, label }) => {
        const isActive = selected === asset.id

        if (category === 'sound') {
          return (
            <div key={asset.id} ref={isActive ? (activeRef as never) : undefined}>
              <SoundCard asset={asset} isActive={isActive} label={label} showLabel={showLabels} onSelect={onSelect} />
            </div>
          )
        }

        return (
          <button
            key={asset.id}
            ref={isActive ? activeRef : undefined}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onSelect(asset.id)}
            className={[
              'group relative w-[136px] shrink-0 overflow-hidden rounded-2xl text-left',
              'transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,0.61,0.24,1)]',
              'sm:w-[150px]',
              isActive
                ? 'scale-[1.015] shadow-[0_10px_34px_-16px_rgba(35,32,27,0.5)] ring-2 ring-ink'
                : 'ring-1 ring-ink/12 hover:ring-ink/28 active:scale-[0.985]',
            ].join(' ')}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper-2">
              <AssetThumb cat={category} asset={asset} scene={scene} className="h-full w-full" />
              {isActive && (
                <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] text-paper">
                  ✓
                </span>
              )}
            </div>
            <div className="space-y-1 bg-paper px-2.5 py-2">
              <p className="truncate text-[12.5px] font-medium leading-tight text-ink">{asset.name}</p>
              {showLabels ? (
                <MatchBadge label={label} />
              ) : (
                <p className="truncate text-[10.5px] leading-tight text-ink-3">{asset.subtitle}</p>
              )}
            </div>
            <span className="sr-only">
              {asset.subtitle}
              {showLabels ? `. ${label}, ${Math.round(score * 100)} percent match.` : ''}
            </span>
          </button>
        )
      })}
      <div aria-hidden className="w-2 shrink-0" />
    </div>
  )
}
