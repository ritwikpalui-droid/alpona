'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { ExtraPlacement, Scene, SceneAdjust } from '@/lib/types'
import { getAsset } from '@/lib/assets'
import { clearDraft } from '@/lib/scene'
import {
  canShareFiles, CARD_TEMPLATES, downloadBlob, FORMATS, giftCardFilename, renderGiftCard, renderShareCard,
  shareCard, shareGiftCard, type CardTemplateId, type GiftCardMeta, type ShareFormat,
} from '@/lib/export'
import { canRecordVideo, canUseCustomAudioFile, renderGiftVideo } from '@/lib/giftVideo'
import { getOccasion, OCCASIONS, type OccasionId } from '@/lib/occasions'
import SceneCanvas from '@/components/SceneCanvas'
import AdjustPanel from './AdjustPanel'

type Phase = 'reveal' | 'publish' | 'published' | 'gift' | 'gift-ready' | 'gifted'

/**
 * The final reveal (§18). The UI disappears; the artwork fills the screen,
 * ambient motion begins, and only then does chrome fade back in — title,
 * then publish. Nothing here is allowed to feel like a form submission.
 */
export default function Reveal({
  scene, title, onTitleChange, muted, onToggleMute, onEdit, adjust, onAdjustChange, extras, onExtrasChange,
}: {
  scene: Scene
  title: string
  onTitleChange: (t: string) => void
  muted: boolean
  onToggleMute: () => void
  onEdit: () => void
  adjust: SceneAdjust
  onAdjustChange: (a: SceneAdjust) => void
  extras: ExtraPlacement[]
  onExtrasChange: (e: ExtraPlacement[]) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [phase, setPhase] = useState<Phase>('reveal')
  const [editingTitle, setEditingTitle] = useState(false)
  const [nickname, setNickname] = useState('')
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState<ShareFormat>('story')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const [openPanel, setOpenPanel] = useState<'placement' | 'elements' | null>(null)
  const [occasion, setOccasion] = useState<OccasionId>(OCCASIONS[0].id)
  const [recipient, setRecipient] = useState('')
  const [giftMessage, setGiftMessage] = useState(OCCASIONS[0].starter)
  const [giftFrom, setGiftFrom] = useState('')
  const [animate, setAnimate] = useState(false)
  const [template, setTemplate] = useState<CardTemplateId>('classic')
  const [customAudio, setCustomAudio] = useState<File | null>(null)
  const [giftResult, setGiftResult] = useState<{ blob: Blob; ext: string; meta: GiftCardMeta; url: string } | null>(null)

  const shareLabel = useMemo(() => canShareFiles() ? 'Share' : 'Save image', [])

  async function doPublish() {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene, title, nickname: nickname.trim(), description: description.trim(), adjust, extras }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message ?? 'Could not publish. Try again.')
      clearDraft()
      setPublishedId(data.world.id)
      setPhase('published')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function doShare() {
    if (!svgRef.current) return
    setBusy(true); setError(null)
    try {
      const blob = await renderShareCard(svgRef.current, format, {
        title, nickname: nickname || undefined,
        siteName: 'ALPONA',
      })
      const url = publishedId ? `${window.location.origin}/w/${publishedId}` : undefined
      await shareCard(blob, { title }, url)
    } catch {
      setError('Could not create the share image. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function doDownload() {
    if (!svgRef.current) return
    setBusy(true); setError(null)
    try {
      const blob = await renderShareCard(svgRef.current, format, { title, nickname: nickname || undefined })
      downloadBlob(blob, `alpona-${format}.png`)
    } catch {
      setError('Could not create the image. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Renders the card (still, or a few seconds of video if "Animate it" is
  // on) and stops there — see doGiftShare/doGiftSave below for what happens
  // to the result. Generating and sending used to be one action; now the
  // person gets to see what they made before choosing where it goes.
  async function doGift() {
    if (!svgRef.current) return
    setBusy(true); setError(null)
    try {
      const occ = getOccasion(occasion)
      const meta: GiftCardMeta = {
        greeting: occ.greeting,
        recipient: recipient.trim() || undefined,
        message: giftMessage.trim() || occ.starter,
        from: giftFrom.trim() || undefined,
      }
      if (giftResult) URL.revokeObjectURL(giftResult.url)
      if (animate) {
        const soundSpec = getAsset('sound', scene.sound)?.sound
        const { blob, ext } = await renderGiftVideo(svgRef.current, format, meta, extras, soundSpec, { template, customAudio })
        setGiftResult({ blob, ext, meta, url: URL.createObjectURL(blob) })
      } else {
        const blob = await renderGiftCard(svgRef.current, format, meta, template)
        setGiftResult({ blob, ext: 'png', meta, url: URL.createObjectURL(blob) })
      }
      setPhase('gift-ready')
    } catch (e) {
      setError((e as Error).message || 'Could not create the card. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function doGiftShare() {
    if (!giftResult) return
    setBusy(true); setError(null)
    try {
      await shareGiftCard(giftResult.blob, giftResult.meta, giftResult.ext)
      setPhase('gifted')
    } catch (e) {
      setError((e as Error).message || 'Could not open the share sheet. Try Save instead.')
    } finally {
      setBusy(false)
    }
  }

  function doGiftSave() {
    if (!giftResult) return
    downloadBlob(giftResult.blob, giftCardFilename(giftResult.meta, giftResult.ext))
    setPhase('gifted')
  }

  // Elements (flowers, lights, lanterns, …) are placeable even in a pure
  // landscape with no idol and no pandal chosen — the panel isn't just
  // "move the idol," so it can't be gated on those two alone.
  const canAdjust = phase === 'reveal'

  return (
    // `100svh` (small viewport height), not `h-dvh`: this is fixed, non-
    // scrolling, overflow-hidden, with the Publish button absolutely
    // positioned at the bottom — it needs the GUARANTEED-visible height
    // (assume any browser chrome is showing), not the largest one `dvh`
    // reports, or that button ends up under a persistent toolbar some
    // mobile browsers draw beneath the page (reported on Samsung Internet).
    <div className="h-app-vh relative w-full overflow-hidden bg-paper">
      {/* Not `alive` — see the note on SceneCanvasProps.alive. */}
      <SceneCanvas ref={svgRef} scene={scene} adjust={adjust} extras={extras} className="paint-in h-full w-full" title={title} />

      {openPanel && (
        <AdjustPanel
          entry={openPanel}
          svgRef={svgRef}
          adjust={adjust} onAdjustChange={onAdjustChange}
          extras={extras} onExtrasChange={onExtrasChange}
          onDone={() => setOpenPanel(null)}
        />
      )}

      {/* quiet exit + mute, always reachable, never competing with the art */}
      {!openPanel && (
        <div className="pt-safe absolute inset-x-0 top-0 flex items-center justify-between px-4 sm:px-6">
          <button type="button" onClick={onEdit} className="fade-up rounded-full bg-paper/80 px-3.5 py-2 text-[13px] text-ink-2 backdrop-blur transition-colors hover:text-ink" style={{ animationDelay: '0.3s' }}>
            ← Edit
          </button>
          <div className="flex items-center gap-1.5">
            {canAdjust && (
              <>
                <button
                  type="button"
                  onClick={() => setOpenPanel('elements')}
                  aria-label="Add elements"
                  className="fade-up rounded-full bg-paper/80 px-3 py-2 text-[13px] whitespace-nowrap text-ink-2 backdrop-blur transition-colors hover:text-ink"
                  style={{ animationDelay: '0.3s' }}
                >
                  <span aria-hidden>🌼</span><span className="ml-1.5 hidden sm:inline">Add elements</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenPanel('placement')}
                  aria-label="Position and size"
                  className="fade-up rounded-full bg-paper/80 px-3 py-2 text-[13px] whitespace-nowrap text-ink-2 backdrop-blur transition-colors hover:text-ink"
                  style={{ animationDelay: '0.3s' }}
                >
                  <span aria-hidden>🤏</span><span className="ml-1.5 hidden sm:inline">Position &amp; size</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={muted}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="fade-up grid h-9 w-9 place-items-center rounded-full bg-paper/80 text-[15px] backdrop-blur transition-colors hover:text-ink"
              style={{ animationDelay: '0.3s' }}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      )}

      {/* title + actions, rising in after the artwork has had a moment alone */}
      <div className={`pb-safe absolute inset-x-0 bottom-0 px-5 pb-5 sm:px-8 ${openPanel ? 'pointer-events-none opacity-0' : ''}`}>
        <div className="rise mx-auto max-w-md" style={{ animationDelay: '0.6s' }}>
          <div className="card-paper rounded-3xl p-5">
            {phase === 'reveal' && (
              <>
                <p className="eyebrow mb-1.5">Your Alpona</p>
                {editingTitle ? (
                  <input
                    autoFocus
                    value={title}
                    onChange={e => onTitleChange(e.target.value)}
                    onBlur={() => setEditingTitle(false)}
                    onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
                    maxLength={60}
                    className="display w-full border-b border-ink/20 bg-transparent pb-1 text-[24px] leading-tight text-ink outline-none"
                  />
                ) : (
                  <button type="button" onClick={() => setEditingTitle(true)} className="display block text-left text-[24px] leading-tight text-ink">
                    {title} <span className="align-middle text-[13px] text-ink-3">✎</span>
                  </button>
                )}

                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setPhase('publish')} className="flex-1 rounded-full bg-ink px-5 py-3 text-[14px] font-medium text-paper transition-transform duration-300 hover:scale-[1.015] active:scale-[0.98]">
                    Publish to Gallery
                  </button>
                  <button type="button" onClick={doShare} disabled={busy} className="rounded-full border border-ink/16 px-4 py-3 text-[14px] text-ink transition-colors hover:border-ink/30 disabled:opacity-50">
                    {shareLabel}
                  </button>
                </div>
                {/* Its own row, not crammed into the one above — this isn't
                    a third way to export the same picture, it's a different
                    thing: a card addressed to someone, not a post. */}
                <button
                  type="button"
                  onClick={() => setPhase('gift')}
                  className="mt-2 w-full rounded-full border border-ink/16 px-4 py-3 text-[14px] text-ink transition-colors hover:border-ink/30"
                >
                  🎁 Gift this to someone
                </button>
                {/* Redundant once the button above already just downloads. */}
                {shareLabel === 'Share' && (
                  <button type="button" onClick={doDownload} disabled={busy} className="mt-2 w-full text-center text-[12px] text-ink-3 underline-offset-4 hover:underline">
                    Download artwork instead
                  </button>
                )}
              </>
            )}

            {phase === 'publish' && (
              <PublishForm
                nickname={nickname} setNickname={setNickname}
                description={description} setDescription={setDescription}
                busy={busy} error={error}
                onBack={() => setPhase('reveal')}
                onSubmit={doPublish}
              />
            )}

            {phase === 'published' && publishedId && (
              <PublishedPanel
                title={title} nickname={nickname} publishedId={publishedId}
                format={format} setFormat={setFormat}
                busy={busy} error={error} shareLabel={shareLabel}
                onShare={doShare} onDownload={doDownload}
              />
            )}

            {phase === 'gift' && (
              <GiftForm
                occasion={occasion} setOccasion={(o) => { setOccasion(o); setGiftMessage(getOccasion(o).starter) }}
                recipient={recipient} setRecipient={setRecipient}
                message={giftMessage} setMessage={setGiftMessage}
                from={giftFrom} setFrom={setGiftFrom}
                template={template} setTemplate={setTemplate}
                animate={animate} setAnimate={setAnimate}
                customAudio={customAudio} setCustomAudio={setCustomAudio}
                busy={busy} error={error}
                onBack={() => setPhase('reveal')}
                onSubmit={doGift}
              />
            )}

            {phase === 'gift-ready' && giftResult && (
              <GiftReady
                url={giftResult.url} isVideo={giftResult.ext !== 'png'}
                canShare={canShareFiles()}
                busy={busy} error={error}
                onShare={doGiftShare} onSave={doGiftSave}
                onBack={() => setPhase('gift')}
              />
            )}

            {phase === 'gifted' && (
              <div>
                <p className="eyebrow mb-1">Card ready</p>
                <p className="display mb-4 text-[19px] leading-snug">
                  {recipient ? `Sent, for ${recipient}.` : 'Sent.'}
                </p>
                <button type="button" onClick={() => setPhase('reveal')} className="w-full rounded-full bg-ink px-5 py-3 text-[14px] font-medium text-paper transition-transform duration-300 hover:scale-[1.015] active:scale-[0.98]">
                  Done
                </button>
                <button type="button" onClick={() => setPhase('gift')} className="mt-2 w-full text-center text-[12px] text-ink-3 underline-offset-4 hover:underline">
                  Send another card
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PublishForm({
  nickname, setNickname, description, setDescription, busy, error, onBack, onSubmit,
}: {
  nickname: string; setNickname: (v: string) => void
  description: string; setDescription: (v: string) => void
  busy: boolean; error: string | null
  onBack: () => void; onSubmit: () => void
}) {
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit() }}>
      <p className="eyebrow mb-3">Publish to the Gallery</p>
      <label className="mb-3 block">
        <span className="mb-1.5 block text-[12.5px] text-ink-2">Nickname</span>
        <input
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          maxLength={24}
          placeholder="What should we call you?"
          className="w-full rounded-xl border border-ink/14 bg-paper/60 px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-3 focus:border-ink/35"
        />
      </label>
      <label className="mb-4 block">
        <span className="mb-1.5 block text-[12.5px] text-ink-2">A line about it <span className="text-ink-3">— optional</span></span>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={160}
          rows={2}
          placeholder="What were you picturing?"
          className="w-full resize-none rounded-xl border border-ink/14 bg-paper/60 px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-3 focus:border-ink/35"
        />
      </label>
      {error && <p className="mb-3 text-[12.5px] text-vermilion">{error}</p>}
      <p className="mb-3 text-[11px] text-ink-3">No login, no personal details — just a nickname the gallery shows.</p>
      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="rounded-full border border-ink/14 px-4 py-3 text-[14px] text-ink-2 hover:text-ink">Back</button>
        <button type="submit" disabled={busy} className="flex-1 rounded-full bg-ink px-5 py-3 text-[14px] font-medium text-paper transition-transform duration-300 enabled:hover:scale-[1.015] disabled:opacity-50">
          {busy ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </form>
  )
}

function GiftForm({
  occasion, setOccasion, recipient, setRecipient, message, setMessage, from, setFrom,
  template, setTemplate, animate, setAnimate, customAudio, setCustomAudio, busy, error, onBack, onSubmit,
}: {
  occasion: OccasionId; setOccasion: (o: OccasionId) => void
  recipient: string; setRecipient: (v: string) => void
  message: string; setMessage: (v: string) => void
  from: string; setFrom: (v: string) => void
  template: CardTemplateId; setTemplate: (t: CardTemplateId) => void
  animate: boolean; setAnimate: (v: boolean) => void
  customAudio: File | null; setCustomAudio: (f: File | null) => void
  busy: boolean; error: string | null
  onBack: () => void; onSubmit: () => void
}) {
  const videoCapable = useMemo(() => canRecordVideo(), [])
  const audioUploadCapable = useMemo(() => canUseCustomAudioFile(), [])
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit() }}>
      <p className="eyebrow mb-3">Gift this to someone</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {OCCASIONS.map(o => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOccasion(o.id)}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
              occasion === o.id ? 'border-ink bg-ink text-paper' : 'border-ink/14 text-ink-2 hover:border-ink/30'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <label className="mb-3 block">
        <span className="mb-1.5 block text-[12.5px] text-ink-2">Who&apos;s it for <span className="text-ink-3">— optional</span></span>
        <input
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          maxLength={30}
          placeholder="A name"
          className="w-full rounded-xl border border-ink/14 bg-paper/60 px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-3 focus:border-ink/35"
        />
      </label>

      <label className="mb-3 block">
        <span className="mb-1.5 block text-[12.5px] text-ink-2">Your message</span>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={200}
          rows={3}
          className="w-full resize-none rounded-xl border border-ink/14 bg-paper/60 px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-3 focus:border-ink/35"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-[12.5px] text-ink-2">From <span className="text-ink-3">— optional</span></span>
        <input
          value={from}
          onChange={e => setFrom(e.target.value)}
          maxLength={30}
          placeholder="Your name"
          className="w-full rounded-xl border border-ink/14 bg-paper/60 px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-3 focus:border-ink/35"
        />
      </label>

      <div className="mb-4">
        <span className="mb-1.5 block text-[12.5px] text-ink-2">Template</span>
        <div className="flex gap-1.5">
          {CARD_TEMPLATES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              title={t.hint}
              className={`flex-1 rounded-xl border px-2.5 py-2 text-[12.5px] transition-colors ${
                template === t.id ? 'border-ink bg-ink text-paper' : 'border-ink/14 text-ink-2 hover:border-ink/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {videoCapable && (
        <button
          type="button"
          onClick={() => setAnimate(!animate)}
          aria-pressed={animate}
          className={`${animate && audioUploadCapable ? 'mb-2' : 'mb-4'} flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
            animate ? 'border-ink/30 bg-ink/5' : 'border-ink/14'
          }`}
        >
          <span>
            <span className="block text-[13.5px] text-ink">✨ Animate it</span>
            <span className="block text-[11.5px] text-ink-3">The flowers, lights and ambience sway and blink — with sound</span>
          </span>
          <span className={`grid h-6 w-10 shrink-0 items-center rounded-full px-1 transition-colors ${animate ? 'bg-ink justify-end' : 'bg-ink/15 justify-start'}`}>
            <span className="h-4 w-4 rounded-full bg-paper" />
          </span>
        </button>
      )}

      {videoCapable && animate && audioUploadCapable && (
        <label className="mb-4 block rounded-xl border border-dashed border-ink/20 bg-paper/60 px-3.5 py-2.5">
          <span className="mb-1 block text-[12.5px] text-ink-2">
            🎵 Your own music <span className="text-ink-3">— optional, replaces the scene sound</span>
          </span>
          <input
            type="file"
            accept="audio/*"
            onChange={e => setCustomAudio(e.target.files?.[0] ?? null)}
            className="block w-full text-[12px] text-ink-3 file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-paper"
          />
          {customAudio && (
            <button
              type="button"
              onClick={() => setCustomAudio(null)}
              className="mt-1.5 text-[11.5px] text-ink-3 underline-offset-4 hover:underline"
            >
              Remove {customAudio.name}
            </button>
          )}
        </label>
      )}

      {error && <p className="mb-3 text-[12.5px] text-vermilion">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="rounded-full border border-ink/14 px-4 py-3 text-[14px] text-ink-2 hover:text-ink">Back</button>
        <button type="submit" disabled={busy} className="flex-1 rounded-full bg-ink px-5 py-3 text-[14px] font-medium text-paper transition-transform duration-300 enabled:hover:scale-[1.015] disabled:opacity-50">
          {busy ? (animate ? 'Recording…' : 'Creating…') : 'Create the card'}
        </button>
      </div>
    </form>
  )
}

function GiftReady({
  url, isVideo, canShare, busy, error, onShare, onSave, onBack,
}: {
  url: string; isVideo: boolean; canShare: boolean
  busy: boolean; error: string | null
  onShare: () => void; onSave: () => void; onBack: () => void
}) {
  return (
    <div>
      <p className="eyebrow mb-3">Your card is ready</p>
      <div className="mb-4 overflow-hidden rounded-2xl border border-ink/10">
        {isVideo ? (
          <video src={url} className="block w-full" autoPlay loop muted playsInline controls />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- a blob: URL, not an optimisable remote image
          <img src={url} alt="Your gift card" className="block w-full" />
        )}
      </div>
      {error && <p className="mb-3 text-[12.5px] text-vermilion">{error}</p>}
      <div className="flex gap-2">
        {canShare && (
          <button type="button" onClick={onShare} disabled={busy} className="flex-1 rounded-full bg-ink px-5 py-3 text-[14px] font-medium text-paper transition-transform duration-300 enabled:hover:scale-[1.015] disabled:opacity-50">
            {busy ? 'Opening…' : 'Share'}
          </button>
        )}
        <button
          type="button" onClick={onSave} disabled={busy}
          className={`rounded-full border border-ink/16 px-4 py-3 text-[14px] text-ink transition-colors hover:border-ink/30 disabled:opacity-50 ${canShare ? '' : 'flex-1'}`}
        >
          Save
        </button>
      </div>
      <button type="button" onClick={onBack} className="mt-2 w-full text-center text-[12px] text-ink-3 underline-offset-4 hover:underline">
        Back
      </button>
    </div>
  )
}

function PublishedPanel({
  title, nickname, publishedId, format, setFormat, busy, error, shareLabel, onShare, onDownload,
}: {
  title: string; nickname: string; publishedId: string
  format: ShareFormat; setFormat: (f: ShareFormat) => void
  busy: boolean; error: string | null
  /** 'Share' opens the native share sheet; 'Save image' means this device/context
   *  can't (e.g. no secure-context support), so the primary button just downloads. */
  shareLabel: string
  onShare: () => void; onDownload: () => void
}) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? `${window.location.origin}/w/${publishedId}` : ''
  const canShare = shareLabel === 'Share'

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* clipboard unavailable */ }
  }

  return (
    <div>
      <p className="eyebrow mb-1">Published</p>
      <p className="display mb-3 text-[19px] leading-snug">
        {title} is live{nickname ? `, by ${nickname}` : ''}.
      </p>

      <div className="mb-3 flex gap-1.5">
        {(Object.keys(FORMATS) as ShareFormat[]).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFormat(f)}
            className={`rounded-full border px-3 py-1.5 text-[11.5px] transition-colors ${format === f ? 'border-ink bg-ink text-paper' : 'border-ink/14 text-ink-2 hover:border-ink/30'}`}
          >
            {FORMATS[f].label}
          </button>
        ))}
      </div>
      {error && <p className="mb-3 text-[12.5px] text-vermilion">{error}</p>}

      {/* Only one button when there's no native share sheet to offer — a
          second "Save" button next to "Save image" would just repeat itself. */}
      <div className="mb-2 flex gap-2">
        <button type="button" onClick={onShare} disabled={busy} className="flex-1 rounded-full bg-ink px-5 py-3 text-[14px] font-medium text-paper transition-transform duration-300 enabled:hover:scale-[1.015] disabled:opacity-50">
          {busy ? 'Preparing…' : shareLabel}
        </button>
        {canShare && (
          <button type="button" onClick={onDownload} disabled={busy} className="rounded-full border border-ink/16 px-4 py-3 text-[14px] text-ink hover:border-ink/30">
            Save
          </button>
        )}
      </div>
      {!canShare && (
        <p className="mb-3 text-[11.5px] leading-relaxed text-ink-3">
          Saves the artwork to your device. Open Instagram, WhatsApp or Facebook and share it from there like any photo.
        </p>
      )}
      <button type="button" onClick={copy} className="mb-3 w-full rounded-xl border border-ink/12 bg-paper/60 px-3 py-2 text-left text-[12px] text-ink-3">
        {copied ? 'Link copied ✓' : url}
      </button>

      <Link href={`/w/${publishedId}`} className="block w-full text-center text-[13px] font-medium text-ink underline-offset-4 hover:underline">
        View in the Gallery →
      </Link>
    </div>
  )
}
