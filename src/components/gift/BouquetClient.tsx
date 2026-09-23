'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import BouquetView, { type BouquetItemInput } from './BouquetView'
import ImpressionViewer from './ImpressionViewer'
import { holders } from '@/lib/gift/holders'
import { flowers } from '@/lib/gift/flowers'
import { MOTIF_COLORS } from '@/lib/art/motifs'
import { soundscapes } from '@/lib/assets/sounds'
import { previewSound, stopSound } from '@/lib/audio'
import { MAX_ITEMS } from '@/lib/gift/types'

let seedCounter = 0

export default function BouquetClient() {
  const router = useRouter()
  const [holderId, setHolderId] = useState(holders[0].id)
  const [holderColor, setHolderColor] = useState<string | undefined>(undefined)
  const [items, setItems] = useState<BouquetItemInput[]>([])
  const [flowerColor, setFlowerColor] = useState<string | undefined>(undefined)
  const [angle, setAngle] = useState(20)
  const [shuffleSeed, setShuffleSeed] = useState(0)

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [recipient, setRecipient] = useState('')
  const [nickname, setNickname] = useState('')
  const [soundId, setSoundId] = useState<string | undefined>(undefined)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addFlower(flowerId: string) {
    if (items.length >= MAX_ITEMS) return
    setItems(prev => [...prev, { id: `f${Date.now()}-${seedCounter++}`, flowerId, color: flowerColor }])
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
    if (items.length === 0) { setError('Add at least one flower first.'); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/gift/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          build: { kind: 'bouquet', holderId, holderColor, items },
          title, nickname, message, recipient, soundId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Could not create the bouquet. Please try again.'); return }
      stopSound()
      router.push(`/gift/${data.gift.id}`)
    } catch {
      setError('Could not create the bouquet. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="mx-auto max-w-lg px-5 pb-28 pt-4 sm:px-6">
        <p className="eyebrow mb-1">Send a Bouquet</p>
        <h1 className="display mb-4 text-[22px] leading-tight text-ink">Build it, then send the link</h1>

        <div className="card-paper mb-2 flex flex-col items-center rounded-3xl p-4">
          <ImpressionViewer angleDeg={angle} onAngleChange={setAngle}>
            <BouquetView holderId={holderId} holderColor={holderColor} items={items} angleDeg={angle} shuffleSeed={shuffleSeed} size={280} />
          </ImpressionViewer>
          <p className="mt-1 text-[11.5px] text-ink-3">Drag to turn it in your hand</p>
        </div>

        {items.length > 0 && (
          <button type="button" onClick={() => setShuffleSeed(s => s + 1)}
            className="mb-6 w-full rounded-full border border-ink/14 py-2 text-[13px] text-ink-2 transition-colors hover:border-ink/30 hover:text-ink">
            🔀 Shuffle arrangement
          </button>
        )}

        <Section title="Holder">
          <ChipRow>
            {holders.map(h => (
              <button key={h.id} type="button" onClick={() => setHolderId(h.id)}
                className={`shrink-0 rounded-2xl px-3.5 py-2.5 text-left text-[12.5px] font-medium text-ink transition-transform ${holderId === h.id ? 'scale-[1.03] ring-2 ring-ink' : 'ring-1 ring-ink/12'}`}
                style={{ background: h.swatch + '55' }}>
                {h.name}
              </button>
            ))}
          </ChipRow>
          <div className="mt-2"><ColorRow value={holderColor} onChange={setHolderColor} /></div>
        </Section>

        <Section title={`Flowers (${items.length}/${MAX_ITEMS})`}>
          <p className="mb-2 text-[11.5px] text-ink-3">Pick a colour, then tap a flower to add it that colour.</p>
          <ColorRow value={flowerColor} onChange={setFlowerColor} />
          <div className="mt-2"><ChipRow>
            {flowers.map(f => (
              <button key={f.id} type="button" onClick={() => addFlower(f.id)} disabled={items.length >= MAX_ITEMS}
                className="shrink-0 rounded-2xl px-3.5 py-2.5 text-[12.5px] font-medium text-ink ring-1 ring-ink/12 transition-transform hover:scale-[1.03] disabled:opacity-35"
                style={{ background: (flowerColor ?? f.swatch) + '55' }}>
                + {f.name}
              </button>
            ))}
          </ChipRow></div>
          {items.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.map(i => {
                const f = flowers.find(x => x.id === i.flowerId)
                return (
                  <button key={i.id} type="button" onClick={() => removeItem(i.id)}
                    className="rounded-full px-2.5 py-1 text-[11px] text-ink-2 ring-1 ring-ink/12 hover:text-ink">
                    {f?.name ?? i.flowerId} ✕
                  </button>
                )
              })}
            </div>
          )}
        </Section>

        <Section title="Music">
          <p className="mb-2 text-[11.5px] text-ink-3">Plays while they hold and turn it.</p>
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
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={60} placeholder="Title (e.g. Happy Birthday)"
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

/** The `MOTIF_COLORS` preset palette, plus a "natural" option that clears
 *  the override — the same tap-a-swatch convention `AdjustPanel` already
 *  uses for colorable motifs. */
function ColorRow({ value, onChange }: { value: string | undefined; onChange: (c: string | undefined) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" onClick={() => onChange(undefined)}
        className={`h-7 w-7 rounded-full ring-1 ring-ink/20 ${value === undefined ? 'ring-2 ring-ink' : ''}`}
        style={{ background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 / 8px 8px' }}
        aria-label="Natural colour" />
      {MOTIF_COLORS.map(c => (
        <button key={c.hex} type="button" onClick={() => onChange(c.hex)}
          className={`h-7 w-7 rounded-full ring-1 ring-ink/20 ${value === c.hex ? 'scale-110 ring-2 ring-ink' : ''}`}
          style={{ background: c.hex }} aria-label={c.name} />
      ))}
    </div>
  )
}
