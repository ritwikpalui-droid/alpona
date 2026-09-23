'use client'

import { useEffect, useState } from 'react'
import BouquetView from './BouquetView'
import ChocolateBoxView, { WOBBLE_LIMIT_DEG } from './ChocolateBoxView'
import ImpressionViewer from './ImpressionViewer'
import { getAsset } from '@/lib/assets'
import { playSound, stopSound, setMuted, isMuted } from '@/lib/audio'
import type { PublishedImpression } from '@/lib/gift/types'

function clampWobble(next: number): number {
  const signed = next > 180 ? next - 360 : next
  return Math.max(-WOBBLE_LIMIT_DEG, Math.min(WOBBLE_LIMIT_DEG, signed))
}

const KIND_EMOJI: Record<string, string> = { bouquet: '💐', chocolate: '🍫' }

/**
 * The recipient's own two-stage reveal — a sealed flat card first, the
 * interactive piece only once tapped open. Not just cosmetic: opening IS
 * the user gesture that unlocks audio (`playSound` must run synchronously
 * inside a real gesture, browsers won't allow it otherwise), and the
 * server-rendered shell always matches this sealed state so hydration
 * never has to reconcile a guess about whether it was already open.
 */
export default function GiftRevealClient({ gift }: { gift: PublishedImpression }) {
  const [opened, setOpened] = useState(false)
  const [angle, setAngle] = useState(gift.build.kind === 'chocolate' ? 0 : 20)
  const [open, setOpen] = useState(false)
  const [muted, setMutedState] = useState(isMuted)

  useEffect(() => () => stopSound(), [])

  function unwrap() {
    setOpened(true)
    const spec = gift.soundId ? getAsset('sound', gift.soundId)?.sound : undefined
    if (spec) void playSound(spec) // synchronous within this gesture — must not await anything first
  }

  function toggleMute() {
    setMutedState(m => { setMuted(!m); return !m })
  }

  const greeting = gift.recipient ? `For ${gift.recipient}` : 'You’ve got a gift'

  if (!opened) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-5 pt-16 text-center sm:px-8">
        <div className="card-paper mb-6 flex w-full flex-col items-center rounded-3xl p-10">
          <span className="mb-4 text-[56px]">{KIND_EMOJI[gift.build.kind]}</span>
          <p className="eyebrow mb-1 text-ink-3">{greeting}</p>
          <h1 className="display mb-1 text-[24px] leading-tight text-ink">{gift.title}</h1>
          <p className="text-[13px] text-ink-3">from {gift.nickname}</p>
        </div>
        <button type="button" onClick={unwrap}
          className="w-full rounded-full bg-ink px-6 py-3.5 text-[14px] font-medium text-paper transition-transform duration-300 hover:scale-[1.015] active:scale-[0.98]">
          Tap to open
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-16 pt-6 sm:px-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="eyebrow mb-1 text-ink-3">{greeting}</p>
          <h1 className="display text-[22px] leading-tight text-ink">{gift.title}</h1>
        </div>
        <button type="button" onClick={toggleMute} aria-pressed={muted}
          className="rounded-full border border-ink/14 px-3 py-2 text-[12px] text-ink-2 hover:text-ink">
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      <div className="card-paper mb-4 flex flex-col items-center rounded-3xl p-4">
        <ImpressionViewer
          angleDeg={angle}
          onAngleChange={a => setAngle(gift.build.kind === 'chocolate' ? clampWobble(a) : a)}
        >
          {gift.build.kind === 'bouquet' ? (
            <BouquetView holderId={gift.build.holderId} holderColor={gift.build.holderColor} items={gift.build.items} angleDeg={angle} size={300} />
          ) : (
            <ChocolateBoxView boxId={gift.build.boxId} boxColor={gift.build.boxColor} items={gift.build.items} angleDeg={angle} open={open} size={300} />
          )}
        </ImpressionViewer>
        <p className="mt-1 text-[11.5px] text-ink-3">
          {gift.build.kind === 'chocolate' ? 'Drag to tilt it' : 'Drag to turn it in your hand'}
        </p>
        {gift.build.kind === 'chocolate' && (
          <button type="button" onClick={() => setOpen(o => !o)}
            className="mt-3 rounded-full border border-ink/14 px-4 py-2 text-[13px] text-ink-2 hover:text-ink">
            {open ? 'Close the lid' : 'Open the lid'}
          </button>
        )}
      </div>

      {gift.message && <p className="mb-2 text-[14.5px] leading-relaxed text-ink-2">{gift.message}</p>}
      <p className="text-[13px] text-ink-3">— {gift.nickname}</p>
    </div>
  )
}
