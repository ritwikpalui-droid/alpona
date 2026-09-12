'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { Scene } from '@/lib/types'
import { clearDraft } from '@/lib/scene'
import { canShareFiles, downloadBlob, FORMATS, renderShareCard, shareCard, type ShareFormat } from '@/lib/export'
import SceneCanvas from '@/components/SceneCanvas'

type Phase = 'reveal' | 'publish' | 'published'

/**
 * The final reveal (§18). The UI disappears; the artwork fills the screen,
 * ambient motion begins, and only then does chrome fade back in — title,
 * then publish. Nothing here is allowed to feel like a form submission.
 */
export default function Reveal({
  scene, title, onTitleChange, muted, onToggleMute, onEdit,
}: {
  scene: Scene
  title: string
  onTitleChange: (t: string) => void
  muted: boolean
  onToggleMute: () => void
  onEdit: () => void
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

  const shareLabel = useMemo(() => canShareFiles() ? 'Share' : 'Save image', [])

  async function doPublish() {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene, title, nickname: nickname.trim(), description: description.trim() }),
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
        siteName: 'PUJA WORLD 2026',
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
      downloadBlob(blob, `puja-world-${format}.png`)
    } catch {
      setError('Could not create the image. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-paper">
      <SceneCanvas ref={svgRef} scene={scene} alive className="paint-in h-full w-full" title={title} />

      {/* quiet exit + mute, always reachable, never competing with the art */}
      <div className="pt-safe absolute inset-x-0 top-0 flex items-center justify-between px-4 sm:px-6">
        <button type="button" onClick={onEdit} className="fade-up rounded-full bg-paper/80 px-3.5 py-2 text-[13px] text-ink-2 backdrop-blur transition-colors hover:text-ink" style={{ animationDelay: '0.3s' }}>
          ← Edit
        </button>
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

      {/* title + actions, rising in after the artwork has had a moment alone */}
      <div className="pb-safe absolute inset-x-0 bottom-0 px-5 pb-5 sm:px-8">
        <div className="rise mx-auto max-w-md" style={{ animationDelay: '0.6s' }}>
          <div className="card-paper rounded-3xl p-5">
            {phase === 'reveal' && (
              <>
                <p className="eyebrow mb-1.5">Your Puja World</p>
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
                <button type="button" onClick={doDownload} disabled={busy} className="mt-2 w-full text-center text-[12px] text-ink-3 underline-offset-4 hover:underline">
                  Download artwork instead
                </button>
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
                busy={busy} error={error}
                onShare={doShare} onDownload={doDownload}
              />
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

function PublishedPanel({
  title, nickname, publishedId, format, setFormat, busy, error, onShare, onDownload,
}: {
  title: string; nickname: string; publishedId: string
  format: ShareFormat; setFormat: (f: ShareFormat) => void
  busy: boolean; error: string | null
  onShare: () => void; onDownload: () => void
}) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? `${window.location.origin}/w/${publishedId}` : ''

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

      <div className="mb-2 flex gap-2">
        <button type="button" onClick={onShare} disabled={busy} className="flex-1 rounded-full bg-ink px-5 py-3 text-[14px] font-medium text-paper transition-transform duration-300 enabled:hover:scale-[1.015] disabled:opacity-50">
          {busy ? 'Preparing…' : 'Share'}
        </button>
        <button type="button" onClick={onDownload} disabled={busy} className="rounded-full border border-ink/16 px-4 py-3 text-[14px] text-ink hover:border-ink/30">
          Save
        </button>
      </div>
      <button type="button" onClick={copy} className="mb-3 w-full rounded-xl border border-ink/12 bg-paper/60 px-3 py-2 text-left text-[12px] text-ink-3">
        {copied ? 'Link copied ✓' : url}
      </button>

      <Link href={`/w/${publishedId}`} className="block w-full text-center text-[13px] font-medium text-ink underline-offset-4 hover:underline">
        View in the Gallery →
      </Link>
    </div>
  )
}
