'use client'

import { useRef, useState } from 'react'
import type { ExtraPlacement, SceneAdjust } from '@/lib/types'
import { H, W } from '@/lib/art/palette'
import { MOTIF_COLORS, MOTIFS } from '@/lib/art/motifs'
import { rng } from '@/lib/rng'

type Target = 'pandal' | 'durga' | 'lighting' | 'flowers' | 'decor' | 'ambience' | 'elements'

/** Friendly tab labels — deliberately not always the category's own label
 *  (e.g. 'durga' reads as "Idol" here, matching what you're actually
 *  looking at on the canvas, not the picker step's name for it). */
const TARGET_LABEL: Record<Exclude<Target, 'elements'>, string> = {
  pandal: 'Pandal', durga: 'Idol', lighting: 'Light', flowers: 'Flowers', decor: 'Decor', ambience: 'Air',
}
/** Same idea for the drag hint at the top of the screen. */
const TARGET_NOUN: Record<Exclude<Target, 'elements'>, string> = {
  pandal: 'the pandal', durga: 'her', lighting: 'the light', flowers: 'the flowers', decor: 'the decor', ambience: 'the air effect',
}

/**
 * A real preview of the actual motif — not a generic pictogram — so "what
 * am I about to add" and "what did I already place, in what colour" are
 * both answered by looking, not by reading a label. Same render function
 * the canvas itself uses, just framed in its own small viewBox.
 */
function MotifIcon({ motif, color }: { motif: string; color?: string }) {
  const def = MOTIFS[motif]
  if (!def) return null
  const r = rng(`motif-icon:${motif}`)
  return (
    <svg viewBox="-112 -118 224 224" className="h-8 w-8 shrink-0" aria-hidden>
      {def.render(r, color ?? def.swatch)}
    </svg>
  )
}

// Module-level, not inside the component: eslint's react-hooks/purity rule
// flags Date.now()/Math.random() called anywhere in a component's own
// function body, even inside an event handler that only ever runs from a
// click — moving the actual randomness one level out is what satisfies it.
function newExtraId(motif: string) {
  return `${motif}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}
function jitter(range: number) {
  return (Math.random() - 0.5) * range
}

/**
 * Manual placement override for the pandal, the idol, and any number of
 * small placed motifs (flowers, lanterns, diyas, birds, …) — drag to move,
 * slider to resize, "+" to add another, a colour swatch for whichever
 * motifs take one. Auto-placement (anchors + slots, see SceneCanvas/
 * PandalAndIdol) gets the pandal and idol right for most combinations, but
 * "most" isn't "all," and small motifs never had individual placement at
 * all — the fix for both is letting the person looking at it arrange
 * things themselves.
 *
 * Drag maths: the canvas is a 1000×1500 SVG scaled to cover the viewport
 * (`preserveAspectRatio="xMidYMid slice"`), so 1 CSS pixel of pointer
 * movement is NOT 1 canvas unit — it's `1 / scale` units, where `scale` is
 * whatever factor made the viewBox cover the element (the same "slice"
 * factor the renderer itself uses). Read directly off the SVG's own
 * bounding rect so this stays correct at any viewport size.
 *
 * Two distinct entry points share this one implementation: `entry="placement"`
 * (the "Position & size" button — pandal/idol only) and `entry="elements"`
 * (the "Add elements" button — flowers/lights/etc. only, no pandal/idol
 * tabs at all). They used to be one panel with all three as tabs, which
 * read as "elements is a sub-mode of moving the pandal" — not what it is.
 */
export default function AdjustPanel({
  entry, svgRef, adjust, onAdjustChange, extras, onExtrasChange, onDone,
}: {
  entry: 'placement' | 'elements'
  svgRef: React.RefObject<SVGSVGElement | null>
  adjust: SceneAdjust
  onAdjustChange: (a: SceneAdjust) => void
  extras: ExtraPlacement[]
  onExtrasChange: (e: ExtraPlacement[]) => void
  onDone: () => void
}) {
  const [target, setTarget] = useState<Target>(entry === 'elements' ? 'elements' : 'pandal')
  const [selectedExtra, setSelectedExtra] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; baseDx: number; baseDy: number; scale: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const isElements = target === 'elements'
  const layerAdjust = !isElements ? (adjust[target] ?? { dx: 0, dy: 0, scale: 1 }) : null
  const current = isElements ? extras.find(e => e.id === selectedExtra) ?? null : null
  const currentDef = current ? MOTIFS[current.motif] : null

  function canvasScale() {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return 1
    return Math.max(rect.width / 1000, rect.height / 1500)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (isElements && !current) return // nothing selected — a drag here would move nothing
    e.currentTarget.setPointerCapture(e.pointerId)
    const baseDx = isElements ? (current?.x ?? W / 2) : (layerAdjust?.dx ?? 0)
    const baseDy = isElements ? (current?.y ?? H / 2) : (layerAdjust?.dy ?? 0)
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseDx, baseDy, scale: canvasScale() }
    // Fade the control card out for the duration of the drag — it sits over
    // the bottom of the canvas, exactly where a lot of drags are headed
    // (reported: "the panel at the bottom blocks the view of the bottom of
    // the canvas completely"). Controls aren't needed mid-drag, only the
    // artwork is, so hide the thing that was blocking it instead of shrinking
    // it permanently.
    setDragging(true)
  }
  // An extra's x/y are absolute canvas coordinates (unlike a layer's dx/dy,
  // which are an offset from a pivot) — with nothing keeping them on
  // screen, dragging one far enough down used to tuck it fully behind the
  // closed control panel, where it stayed invisible (and "editable" only in
  // the sense that a slider could change a value nobody could see change).
  // Reads the panel's own live position instead of a guessed constant, so
  // this keeps working if the panel's height ever changes.
  function clampExtraY(rawY: number): number {
    const svgRect = svgRef.current?.getBoundingClientRect()
    const panelRect = panelRef.current?.getBoundingClientRect()
    if (!svgRect || !panelRect) return Math.max(0, Math.min(H, rawY))
    const scale = Math.max(svgRect.width / 1000, svgRect.height / 1500)
    const maxCanvasY = (panelRect.top - svgRect.top) / scale - 24
    return Math.max(0, Math.min(maxCanvasY, rawY))
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    const x = d.baseDx + (e.clientX - d.startX) / d.scale
    const y = d.baseDy + (e.clientY - d.startY) / d.scale
    if (isElements) {
      if (!current) return
      onExtrasChange(extras.map(e => e.id === current.id ? { ...e, x: Math.max(0, Math.min(W, x)), y: clampExtraY(y) } : e))
    } else {
      onAdjustChange({ ...adjust, [target]: { dx: x, dy: y, scale: layerAdjust?.scale ?? 1 } })
    }
  }
  function endDrag() { dragRef.current = null; setDragging(false) }

  function setScale(scale: number) {
    if (isElements) {
      if (!current) return
      onExtrasChange(extras.map(e => e.id === current.id ? { ...e, scale } : e))
    } else {
      onAdjustChange({ ...adjust, [target]: { dx: layerAdjust?.dx ?? 0, dy: layerAdjust?.dy ?? 0, scale } })
    }
  }

  function setColor(color: string) {
    if (!current) return
    onExtrasChange(extras.map(e => e.id === current.id ? { ...e, color } : e))
  }

  function reset() {
    if (isElements) {
      if (!current) return
      onExtrasChange(extras.filter(e => e.id !== current.id))
      setSelectedExtra(null)
    } else {
      const next = { ...adjust }
      delete next[target]
      onAdjustChange(next)
    }
  }

  function addExtra(motif: string) {
    const id = newExtraId(motif)
    // Independent random jitter around one fixed centre used to place a
    // SECOND (or third, ...) item right on top of whatever was already
    // there often enough to matter — two draws from the same range land
    // close together more often than it sounds, and a motif's own artwork
    // is easily wide enough to fully hide a same-sized neighbour a few
    // dozen units away. Spiralling each new one out from the last at a
    // fixed angular step (the golden angle, so it never re-aligns with an
    // earlier item) guarantees real separation instead of leaving it to
    // chance — the first item still spawns dead-centre, same as before.
    const n = extras.length
    const angle = n * 2.399963229728653
    const radius = n === 0 ? 0 : 70 + (n - 1) * 36
    const cx = W / 2 + Math.cos(angle) * radius
    const cy = H * 0.62 + Math.sin(angle) * radius * 0.6
    const next: ExtraPlacement = { id, motif, x: cx + jitter(40), y: cy + jitter(40), scale: 1 }
    onExtrasChange([...extras, next])
    setSelectedExtra(id)
  }

  return (
    <>
      <div
        className="absolute inset-0 z-10 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />

      <div className="pt-safe absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 sm:px-6">
        <p className="fade-up rounded-full bg-paper/85 px-3.5 py-2 text-[12.5px] text-ink-2 backdrop-blur">
          {isElements
            ? (current ? 'Drag anywhere to move it' : 'Tap one below to add it')
            : `Drag anywhere to move ${TARGET_NOUN[target as Exclude<Target, 'elements'>]}`}
        </p>
        <button type="button" onClick={onDone} className="fade-up rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper">
          Done
        </button>
      </div>

      <div
        className={`pb-safe absolute inset-x-0 bottom-0 z-20 px-5 pb-5 transition-[opacity,transform] duration-150 sm:px-8 ${
          dragging ? 'pointer-events-none translate-y-2 opacity-0' : 'opacity-100'
        }`}
      >
        <div ref={panelRef} className="card-paper mx-auto max-w-md rounded-3xl p-5">
          {entry === 'placement' && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {(['pandal', 'durga', 'lighting', 'flowers', 'decor', 'ambience'] as Target[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTarget(t)}
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                    target === t ? 'border-ink bg-ink text-paper' : 'border-ink/14 text-ink-2 hover:border-ink/30'
                  }`}
                >
                  {TARGET_LABEL[t as Exclude<Target, 'elements'>]}
                </button>
              ))}
            </div>
          )}

          {isElements && (
            <>
              <div className="mb-3 flex items-center gap-2 overflow-x-auto">
                {Object.entries(MOTIFS).map(([key, def]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => addExtra(key)}
                    className="flex shrink-0 flex-col items-center gap-1 rounded-2xl border border-ink/14 px-2.5 py-1.5 text-ink-2 hover:border-ink/30"
                  >
                    <MotifIcon motif={key} />
                    <span className="text-[10.5px] leading-none">{def.label}</span>
                  </button>
                ))}
              </div>

              {extras.length > 0 && (
                <div className="mb-3 flex items-center gap-1.5 overflow-x-auto">
                  {extras.map(e => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelectedExtra(e.id)}
                      aria-label={MOTIFS[e.motif]?.label ?? e.motif}
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors ${
                        selectedExtra === e.id ? 'border-ink bg-ink/6' : 'border-ink/14'
                      }`}
                    >
                      <MotifIcon motif={e.motif} color={e.color} />
                    </button>
                  ))}
                </div>
              )}

              {current && currentDef?.colorable && (
                <div className="mb-3 flex items-center gap-1.5">
                  {MOTIF_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      aria-label={c.name}
                      className={`h-7 w-7 shrink-0 rounded-full border-2 transition-transform ${
                        (current.color ?? currentDef.swatch) === c.hex ? 'scale-110 border-ink' : 'border-paper/0'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-3">
            <label className="flex-1">
              <span className="mb-1.5 block text-[12.5px] text-ink-2">Size</span>
              <input
                type="range" min={0.4} max={2} step={0.02}
                value={isElements ? (current?.scale ?? 1) : (layerAdjust?.scale ?? 1)}
                disabled={isElements && !current}
                onChange={e => setScale(Number(e.target.value))}
                className="w-full accent-ink disabled:opacity-30"
              />
            </label>
            <button
              type="button"
              onClick={reset}
              disabled={isElements && !current}
              className="rounded-full px-3 py-1.5 text-[12.5px] text-ink-3 underline-offset-4 hover:text-ink hover:underline disabled:opacity-30"
            >
              {isElements ? 'Remove' : 'Reset'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
