'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { Scene } from '@/lib/types'
import { CATEGORIES, TOTAL_STEPS, getAsset, getCategory } from '@/lib/assets'
import { hasContext, rankOptions, rerollOne, surprise } from '@/lib/compat'
import { clearDraft, isComplete, loadDraft, saveDraft } from '@/lib/scene'
import { generateTitle } from '@/lib/title'
import { playSound, setMuted, stopSound } from '@/lib/audio'
import SceneCanvas from '@/components/SceneCanvas'
import OptionRail from './OptionRail'
import Reveal from './Reveal'

const pad2 = (n: number) => String(n).padStart(2, '0')

export default function StudioClient() {
  const [scene, setScene] = useState<Scene>({})
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'build' | 'reveal'>('build')
  const [title, setTitle] = useState<string | null>(null)
  const [resumed, setResumed] = useState(false)
  const [muted, setMutedState] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const category = CATEGORIES[step]
  const stageRef = useRef<HTMLDivElement>(null)

  /* ---------------------------------------------------------------- draft */

  // A one-time read of localStorage on mount. It has to run in an effect,
  // not a lazy useState initializer: the server (and the client's first,
  // hydration-matching render) has no localStorage, so a lazy initializer
  // would read real draft data on the client's very first render and mismatch
  // the empty server markup. This is that mismatch avoided on purpose.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const d = loadDraft()
    if (d && Object.keys(d.scene).length > 0) {
      setScene(d.scene)
      setStep(Math.min(d.step ?? 0, TOTAL_STEPS - 1))
      if (d.title) setTitle(d.title)
      setResumed(true)
    }
    setHydrated(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return
    saveDraft({ scene, step, title: title ?? undefined })
  }, [scene, step, title, hydrated])

  useEffect(() => () => { stopSound() }, [])

  /* ------------------------------------------------------------- options */

  const options = useMemo(() => rankOptions(category.id, scene), [category.id, scene])
  const showLabels = useMemo(() => hasContext(scene, category.id), [scene, category.id])
  const chosen = scene[category.id]

  const chosenLayers = useMemo(
    () => CATEGORIES.filter(c => scene[c.id]).map(c => ({ cat: c, asset: getAsset(c.id, scene[c.id])! })),
    [scene],
  )

  /* ------------------------------------------------------------- actions */

  const select = useCallback((id: string) => {
    setScene(prev => ({ ...prev, [category.id]: id }))
    setResumed(false)
    if (category.id === 'sound') {
      const spec = getCategory('sound').assets.find(a => a.id === id)?.sound
      void playSound(spec)
    }
  }, [category.id])

  const goto = useCallback((next: number) => {
    setStep(Math.max(0, Math.min(TOTAL_STEPS - 1, next)))
    if (CATEGORIES[step]?.id === 'sound' && CATEGORIES[next]?.id !== 'sound') stopSound()
  }, [step])

  const doSurprise = useCallback(() => {
    const next = surprise()
    setScene(next)
    setTitle(null)
    setResumed(false)
    stopSound()
  }, [])

  const changeOne = useCallback(() => {
    setScene(prev => rerollOne(prev, category.id))
    setTitle(null)
  }, [category.id])

  const toggleMute = useCallback(() => {
    setMutedState(m => { setMuted(!m); return !m })
  }, [])

  const startOver = useCallback(() => {
    clearDraft()
    setScene({})
    setStep(0)
    setTitle(null)
    setResumed(false)
    stopSound()
  }, [])

  const ready = isComplete(scene)
  const isLast = step === TOTAL_STEPS - 1

  const reveal = useCallback(() => {
    setTitle(t => t ?? generateTitle(scene))
    setMode('reveal')
    const spec = getAsset('sound', scene.sound)?.sound
    if (spec && !muted) void playSound(spec)
  }, [scene, muted])

  /* -------------------------------------------------------------- render */

  if (mode === 'reveal') {
    return (
      <Reveal
        scene={scene}
        title={title ?? generateTitle(scene)}
        onTitleChange={setTitle}
        muted={muted}
        onToggleMute={toggleMute}
        onEdit={() => { setMode('build'); stopSound() }}
      />
    )
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper lg:flex-row">
      {/* ------------------------------------------------ stage (canvas) */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* top bar: progress, nothing else */}
        <div className="pt-safe absolute inset-x-0 top-0 z-20 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-2.5">
            <button
              type="button"
              onClick={() => step === 0 ? undefined : goto(step - 1)}
              className={`-ml-2 flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-ink-2 transition-opacity ${step === 0 ? 'pointer-events-none opacity-0' : 'hover:text-ink'}`}
              aria-label="Back one step"
            >
              <span aria-hidden>←</span> Back
            </button>

            <span className="eyebrow tabular-nums text-ink-2">
              {pad2(step + 1)} <span className="text-ink-3/60">/ {pad2(TOTAL_STEPS)}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={doSurprise}
                aria-label="Surprise me"
                className="rounded-full px-3 py-2 text-[13px] text-ink-2 transition-colors hover:text-ink"
              >
                <span aria-hidden>✨</span><span className="ml-1.5 hidden sm:inline">Surprise me</span>
              </button>
              <Link href="/" aria-label="Leave the studio" className="grid h-9 w-9 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink">✕</Link>
            </div>
          </div>

          {/* the progress indicator: one hairline, no stepper (§4) */}
          <div className="h-px w-full bg-ink/10" aria-hidden>
            <div
              className="h-px bg-ink transition-[width] duration-700 ease-[cubic-bezier(0.22,0.61,0.24,1)]"
              style={{ width: `${((step + (chosen ? 1 : 0)) / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          {/* already-chosen layers, doubling as the "Change" affordance (§17) */}
          {chosenLayers.length > 0 && (
            <div className="rail -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
              {chosenLayers.map(({ cat, asset }) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => goto(cat.index - 1)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] whitespace-nowrap transition-colors ${
                    cat.id === category.id
                      ? 'border-ink/30 bg-ink/6 text-ink'
                      : 'border-ink/12 bg-paper/70 text-ink-3 hover:text-ink-2'
                  }`}
                >
                  <span className="opacity-55">{cat.label}</span> · {asset.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* the artwork — the largest thing on the screen, always (§4) */}
        <div ref={stageRef} className="min-h-0 flex-1 overflow-hidden">
          <SceneCanvas
            scene={scene}
            alive
            className="h-full w-full"
            title={title ?? 'Your Puja world, in progress'}
          />
        </div>

        {Object.keys(scene).length === 0 && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center px-10">
            <p className="display max-w-[15ch] text-balance text-center text-[26px] leading-[1.15] text-ink-2/70 sm:text-[32px]">
              An empty sheet. Choose where your Puja lives.
            </p>
          </div>
        )}

        {resumed && (
          <div className="fade-up pointer-events-auto absolute inset-x-0 bottom-3 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border border-ink/12 bg-paper/92 px-4 py-2 text-[12.5px] text-ink-2 backdrop-blur">
            Picked up where you left off.
            <button type="button" onClick={startOver} className="font-medium text-ink underline underline-offset-4">Start over</button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------ the picker */}
      <div className="pb-safe relative z-30 shrink-0 border-t border-ink/10 bg-paper px-5 pt-4 sm:px-6 lg:w-[430px] lg:border-l lg:border-t-0 lg:pt-6 lg:shadow-[-24px_0_48px_-40px_rgba(35,32,27,0.4)]">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1.5">{category.label}</p>
            <h2 className="display max-w-[18ch] text-balance text-[21px] leading-[1.12] sm:text-[24px]">
              {category.question}
            </h2>
          </div>
          {chosen && (
            <button
              type="button"
              onClick={changeOne}
              className="mb-1 shrink-0 rounded-full border border-ink/14 px-3 py-1.5 text-[11.5px] text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
            >
              Change this
            </button>
          )}
        </div>

        <OptionRail
          category={category.id}
          options={options}
          selected={chosen}
          scene={scene}
          showLabels={showLabels}
          onSelect={select}
        />

        <div className="mt-3 flex min-h-[20px] items-center justify-between gap-3">
          <p className="truncate text-[12px] text-ink-3">
            {chosen ? getAsset(category.id, chosen)?.subtitle : 'Swipe for more'}
          </p>
          {category.id === 'sound' && chosen && (
            <button
              type="button"
              onClick={toggleMute}
              className="shrink-0 rounded-full border border-ink/14 px-3 py-1 text-[11.5px] text-ink-2 transition-colors hover:text-ink"
              aria-pressed={muted}
            >
              {muted ? 'Unmute' : 'Mute'}
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2.5 pb-4">
          {category.optional && !chosen && (
            <button
              type="button"
              onClick={() => goto(step + 1)}
              className="rounded-full border border-ink/14 px-5 py-3 text-[14px] text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
            >
              Skip
            </button>
          )}
          {isLast ? (
            <button
              type="button"
              onClick={reveal}
              disabled={!ready}
              className="flex-1 rounded-full bg-ink px-6 py-3.5 text-[14px] font-medium text-paper transition-transform duration-300 enabled:hover:scale-[1.015] enabled:active:scale-[0.985] disabled:opacity-35"
            >
              {ready ? 'Reveal my Puja World' : 'A few layers still to choose'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goto(step + 1)}
              disabled={!chosen && !category.optional}
              className="flex-1 rounded-full bg-ink px-6 py-3.5 text-[14px] font-medium text-paper transition-transform duration-300 enabled:hover:scale-[1.015] enabled:active:scale-[0.985] disabled:opacity-35"
            >
              Next <span aria-hidden className="ml-1">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
