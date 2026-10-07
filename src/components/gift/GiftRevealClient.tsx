'use client'

import { useEffect, useState } from 'react'
import BouquetView from './BouquetView'
import ChocolateBoxView, { WOBBLE_LIMIT_DEG } from './ChocolateBoxView'
import MishtiBoxView from './MishtiBoxView'
import GiftTopView, { itemNames } from './GiftTopView'
import ImpressionViewer from './ImpressionViewer'
import { getAsset } from '@/lib/assets'
import { playSound, stopSound, setMuted, isMuted } from '@/lib/audio'
import type { PublishedImpression } from '@/lib/gift/types'

function clampWobble(next: number): number {
  const signed = next > 180 ? next - 360 : next
  return Math.max(-WOBBLE_LIMIT_DEG, Math.min(WOBBLE_LIMIT_DEG, signed))
}

const KIND_EMOJI: Record<string, string> = { bouquet: '💐', chocolate: '🍫', mishti: '🍬' }
const KIND_LABEL: Record<string, string> = { bouquet: 'bouquet', chocolate: 'chocolate box', mishti: 'Mishti box' }

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
  const [topView, setTopView] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
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

  async function shareGift() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: gift.title, text: `${gift.title} — a gift from ${gift.nickname}`, url })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    setShareOpen(true)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  function openShare(target: 'whatsapp' | 'email') {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`${gift.title} — a gift from ${gift.nickname}`)
    const destination = target === 'whatsapp'
      ? `https://wa.me/?text=${text}%20${url}`
      : `mailto:?subject=${encodeURIComponent(gift.title)}&body=${text}%0A%0A${url}`
    window.open(destination, '_blank', 'noopener,noreferrer')
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
        {topView ? (
          <div className="flex h-[320px] w-full items-center justify-center rounded-2xl bg-paper-2/70">
            <GiftTopView build={gift.build} size={300} />
          </div>
        ) : (
          <ImpressionViewer
            angleDeg={angle}
            onAngleChange={a => setAngle(gift.build.kind === 'chocolate' ? clampWobble(a) : a)}
          >
            {gift.build.kind === 'bouquet' ? (
              <BouquetView holderId={gift.build.holderId} holderColor={gift.build.holderColor} items={gift.build.items} angleDeg={angle} size={300} />
            ) : gift.build.kind === 'mishti' ? (
              <MishtiBoxView boxId={gift.build.boxId} boxColor={gift.build.boxColor} items={gift.build.items} angleDeg={angle} open={open} size={300} />
            ) : (
              <ChocolateBoxView boxId={gift.build.boxId} boxColor={gift.build.boxColor} items={gift.build.items} angleDeg={angle} open={open} size={300} />
            )}
          </ImpressionViewer>
        )}
        <p className="mt-1 text-[11.5px] text-ink-3">
          {topView ? 'Everything in this gift, seen from above' : gift.build.kind === 'bouquet' ? 'Drag to turn it in your hand' : 'Drag to tilt it'}
        </p>
        <div className="mt-3 flex w-full gap-2">
          <button type="button" onClick={() => setTopView(v => !v)}
            className="flex-1 rounded-full border border-ink/14 px-4 py-2 text-[13px] text-ink-2 hover:text-ink">
            {topView ? 'Back to 3D' : 'Top view'}
          </button>
          {(gift.build.kind === 'chocolate' || gift.build.kind === 'mishti') && (
            <button type="button" onClick={() => setOpen(o => !o)}
              className="flex-1 rounded-full border border-ink/14 px-4 py-2 text-[13px] text-ink-2 hover:text-ink">
              {open ? 'Close the lid' : 'Open the lid'}
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-ink/10 bg-paper-2/45 p-3">
        <p className="eyebrow mb-2">Inside the {KIND_LABEL[gift.build.kind]}</p>
        <p className="text-[13px] leading-relaxed text-ink-2">{itemNames(gift.build).join(' · ') || 'A surprise selection'}</p>
      </div>

      {gift.message && <p className="mb-2 text-[14.5px] leading-relaxed text-ink-2">{gift.message}</p>}
      <p className="text-[13px] text-ink-3">— {gift.nickname}</p>

      <div className="mt-7 flex flex-col gap-2">
        <button type="button" onClick={shareGift}
          className="w-full rounded-full bg-ink px-6 py-3.5 text-[14px] font-medium text-paper transition-transform duration-300 hover:scale-[1.015] active:scale-[0.98]">
          Share this gift
        </button>
        {shareOpen && (
          <div className="rounded-2xl border border-ink/12 bg-paper-2/55 p-3">
            <p className="eyebrow mb-2">Send the link</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => openShare('whatsapp')} className="rounded-xl bg-[#25D366] px-3 py-2.5 text-[12.5px] font-medium text-white">WhatsApp</button>
              <button type="button" onClick={() => openShare('email')} className="rounded-xl bg-ink px-3 py-2.5 text-[12.5px] font-medium text-paper">Email</button>
            </div>
            <button type="button" onClick={copyLink} className="mt-2 w-full rounded-xl border border-ink/14 px-3 py-2.5 text-[12.5px] text-ink-2 hover:text-ink">
              {copied ? 'Link copied ✓' : 'Copy gift link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
