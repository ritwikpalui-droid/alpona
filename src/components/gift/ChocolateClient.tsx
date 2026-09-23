'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import ChocolateBoxView, { type ChocolateItemInput, WOBBLE_LIMIT_DEG } from './ChocolateBoxView'
import ImpressionViewer from './ImpressionViewer'
import { boxes } from '@/lib/gift/chocolateBoxes'
import { pieces } from '@/lib/gift/chocolatePieces'
import { MOTIF_COLORS } from '@/lib/art/motifs'
import { soundscapes } from '@/lib/assets/sounds'
import { previewSound, stopSound } from '@/lib/audio'
import { MAX_ITEMS } from '@/lib/gift/types'

let seedCounter = 0

// Unwrap ImpressionViewer's [0,360) wrap to a signed range, then clamp to
// the box's bounded wobble — see the file-level note on ChocolateBoxView
// for why a box only ever wobbles, it never fully spins.
function clampWobble(next: number): number {
  const signed = next > 180 ? next - 360 : next
  return Math.max(-WOBBLE_LIMIT_DEG, Math.min(WOBBLE_LIMIT_DEG, signed))
}

export default function ChocolateClient() {
  const router = useRouter()
  const [boxId, setBoxId] = useState(boxes[0].id)
  const [boxColor, setBoxColor] = useState<string | undefined>(undefined)
  const [items, setItems] = useState<ChocolateItemInput[]>([])
  const [angle, setAngle] = useState(0)
  const [open, setOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [recipient, setRecipient] = useState('')
  const [nickname, setNickname] = useState('')
  const [soundId, setSoundId] = useState<string | undefined>(undefined)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addPiece(pieceId: string) {
    if (items.length >= MAX_ITEMS) return
    setItems(prev => [...prev, { id: `c${Date.now()}-${seedCounter++}`, pieceId }])
    setOpen(true)
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function pickSound(id: string) {
    setSoundId(prev => {
      const next = prev === id ? undefined : id
      const asset = soundscapes.find(s => s.id === next)
      if (asset?.sound) void previewSound(asset.sound)
      else stopSound()
      return next
    })
  }

  async function publish() {
    if (items.length === 0) { setError('Add at least one piece first.'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/gift/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          build: { kind: 'chocolate', boxId, boxColor, items },
          title, nickname, message, recipient, soundId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Could not create the box. Please try again.'); return }
      stopSound()
      router.push(`/gift/${data.gift.id}`)
    } catch {
      setError('Could not create the box. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="mx-auto max-w-lg px-5 pb-28 pt-4 sm:px-6">
        <p className="eyebrow mb-1">Send Chocolate</p>
        <h1 className="display mb-4 text-[22px] leading-tight text-ink">Pack the box, then send the link</h1>

        <div className="card-paper mb-2 flex flex-col items-center rounded-3xl p-4">
          <ImpressionViewer angleDeg={angle} onAngleChange={a => setAngle(clampWobble(a))}>
            <ChocolateBoxView boxId={boxId} boxColor={boxColor} items={items} angleDeg={angle} open={open} size={280} />
          </ImpressionViewer>
          <p className="mt-1 text-[11.5px] text-ink-3">Drag to tilt it, tap below to open the lid</p>
        </div>

        <button type="button" onClick={() => setOpen(o => !o)}
          className="mb-6 w-full rounded-full border border-ink/14 py-2 text-[13px] text-ink-2 transition-colors hover:border-ink/30 hover:text-ink">
          {open ? 'Close the lid' : 'Open the lid'}
        </button>

        <Section title="Box">
          <ChipRow>
            {boxes.map(b => (
              <button key={b.id} type="button" onClick={() => setBoxId(b.id)}
                className={`shrink-0 rounded-2xl px-3.5 py-2.5 text-left text-[12.5px] font-medium text-ink transition-transform ${boxId === b.id ? 'scale-[1.03] ring-2 ring-ink' : 'ring-1 ring-ink/12'}`}
                style={{ background: b.swatch + '33' }}>
                {b.name}
              </button>
            ))}
          </ChipRow>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setBoxColor(undefined)}
              className={`h-7 w-7 rounded-full ring-1 ring-ink/20 ${boxColor === undefined ? 'ring-2 ring-ink' : ''}`}
              style={{ background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 / 8px 8px' }}
              aria-label="Natural colour" />
            {MOTIF_COLORS.map(c => (
              <button key={c.hex} type="button" onClick={() => setBoxColor(c.hex)}
                className={`h-7 w-7 rounded-full ring-1 ring-ink/20 ${boxColor === c.hex ? 'scale-110 ring-2 ring-ink' : ''}`}
                style={{ background: c.hex }} aria-label={c.name} />
            ))}
          </div>
        </Section>

        <Section title={`Pieces (${items.length}/${MAX_ITEMS})`}>
          <ChipRow>
            {pieces.map(p => (
              <button key={p.id} type="button" onClick={() => addPiece(p.id)} disabled={items.length >= MAX_ITEMS}
                className="shrink-0 rounded-2xl px-3.5 py-2.5 text-[12.5px] font-medium text-ink ring-1 ring-ink/12 transition-transform hover:scale-[1.03] disabled:opacity-35"
                style={{ background: p.swatch + '55' }}>
                + {p.name}
              </button>
            ))}
          </ChipRow>
          {items.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.map(i => {
                const p = pieces.find(x => x.id === i.pieceId)
                return (
                  <button key={i.id} type="button" onClick={() => removeItem(i.id)}
                    className="rounded-full px-2.5 py-1 text-[11px] text-ink-2 ring-1 ring-ink/12 hover:text-ink">
                    {p?.name ?? i.pieceId} ✕
                  </button>
                )
              })}
            </div>
          )}
        </Section>

        <Section title="Music">
          <p className="mb-2 text-[11.5px] text-ink-3">Plays while they open the box.</p>
          <ChipRow>
            {soundscapes.map(s => (
              <button key={s.id} type="button" onClick={() => pickSound(s.id)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-medium text-ink transition-colors ${soundId === s.id ? 'bg-ink text-paper' : 'ring-1 ring-ink/14 hover:ring-ink/30'}`}>
                {s.name}
              </button>
            ))}
          </ChipRow>
        </Section>

        <Section title="A few details">
          <div className="space-y-2.5">
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={60} placeholder="Title (e.g. Happy Diwali)"
              className="w-full rounded-xl border border-ink/14 bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-ink/30" />
            <input value={recipient} onChange={e => setRecipient(e.target.value)} maxLength={40} placeholder="Who's it for? (optional)"
              className="w-full rounded-xl border border-ink/14 bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-ink/30" />
            <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={160} rows={2} placeholder="A little message (optional)"
              className="w-full rounded-xl border border-ink/14 bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-ink/30" />
            <input value={nickname} onChange={e => setNickname(e.target.value)} maxLength={24} placeholder="Your name (optional)"
              className="w-full rounded-xl border border-ink/14 bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-ink/30" />
          </div>
        </Section>

        {error && <p className="mb-3 text-[12.5px] text-vermilion">{error}</p>}
        <button type="button" onClick={publish} disabled={busy || items.length === 0}
          className="w-full rounded-full bg-ink px-6 py-3.5 text-[14px] font-medium text-paper transition-transform duration-300 enabled:hover:scale-[1.015] disabled:opacity-35">
          {busy ? 'Wrapping it up…' : 'Get the link'}
        </button>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-[13px] font-medium text-ink">{title}</div>
      {children}
    </div>
  )
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">{children}</div>
}
