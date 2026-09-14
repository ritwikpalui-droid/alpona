import type { SoundSpec } from './types'

/**
 * Soundscapes, synthesised in the browser.
 *
 * Why not mp3s: a dozen loops at even 200 KB each is 2.4 MB of mobile data
 * before anyone hears anything, plus hosting and bandwidth during a spike.
 * This is a few kilobytes of code and starts instantly. It also means a new
 * soundscape is a row of numbers, not an audio production job (§59).
 *
 * Never starts without a user gesture (§14).
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
let stopFns: Array<() => void> = []
let current: SoundSpec | null = null
let muted = false
let recordDest: MediaStreamAudioDestinationNode | null = null

function audio(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.85
    master.connect(ctx.destination)
  }
  return ctx
}

/** Pink-ish noise, generated once and looped. Cheaper and warmer than white. */
function noise(): AudioBuffer {
  const c = audio()
  if (noiseBuffer) return noiseBuffer
  const len = c.sampleRate * 3
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.99765 * b0 + w * 0.0990460
    b1 = 0.96300 * b1 + w * 0.2965164
    b2 = 0.57000 * b2 + w * 1.0526913
    data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.22
  }
  noiseBuffer = buf
  return buf
}

/** A filtered noise bed — rain, wind, water and crowd are all this, tuned. */
function bed(level: number, type: BiquadFilterType, freq: number, q: number, wobble?: { rate: number; depth: number }) {
  const c = audio()
  const src = c.createBufferSource()
  src.buffer = noise()
  src.loop = true

  const filter = c.createBiquadFilter()
  filter.type = type
  filter.frequency.value = freq
  filter.Q.value = q

  const gain = c.createGain()
  gain.gain.value = 0
  gain.gain.linearRampToValueAtTime(level, c.currentTime + 2.2)

  src.connect(filter).connect(gain).connect(master!)
  src.start()

  let lfo: OscillatorNode | null = null
  if (wobble) {
    lfo = c.createOscillator()
    lfo.frequency.value = wobble.rate
    const depth = c.createGain()
    depth.gain.value = wobble.depth
    lfo.connect(depth).connect(gain.gain)
    lfo.start()
  }

  return () => {
    gain.gain.cancelScheduledValues(c.currentTime)
    gain.gain.setTargetAtTime(0, c.currentTime, 0.35)
    setTimeout(() => { try { src.stop(); lfo?.stop() } catch { /* already stopped */ } }, 1400)
  }
}

/** A struck drum head: pitch-dropping body plus a noise slap. */
function dhakHit(at: number, strong: boolean, level: number) {
  const c = audio()
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(strong ? 168 : 128, at)
  osc.frequency.exponentialRampToValueAtTime(strong ? 54 : 62, at + 0.16)

  const g = c.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(level * (strong ? 1 : 0.55), at + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, at + (strong ? 0.5 : 0.28))

  const slap = c.createBufferSource()
  slap.buffer = noise()
  const sf = c.createBiquadFilter()
  sf.type = 'bandpass'
  sf.frequency.value = strong ? 1400 : 2400
  sf.Q.value = 1.1
  const sg = c.createGain()
  sg.gain.setValueAtTime(level * (strong ? 0.4 : 0.26), at)
  sg.gain.exponentialRampToValueAtTime(0.0001, at + 0.09)

  osc.connect(g).connect(master!)
  slap.connect(sf).connect(sg).connect(master!)
  osc.start(at); osc.stop(at + 0.6)
  slap.start(at); slap.stop(at + 0.14)
}

/** Struck brass: two detuned partials with a long, slightly inharmonic tail. */
function bell(at: number, base: number, level: number) {
  const c = audio()
  for (const [mult, amp, decay] of [[1, 1, 3.4], [2.76, 0.42, 2.1], [5.4, 0.2, 1.3]] as const) {
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.value = base * mult
    const g = c.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(level * amp, at + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay)
    o.connect(g).connect(master!)
    o.start(at); o.stop(at + decay + 0.1)
  }
}

function conchBlow(at: number, level: number) {
  const c = audio()
  const o = c.createOscillator()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(196, at)
  o.frequency.linearRampToValueAtTime(208, at + 1.9)
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.setValueAtTime(500, at)
  f.frequency.linearRampToValueAtTime(1500, at + 0.8)
  const g = c.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(level, at + 0.5)
  g.gain.setValueAtTime(level, at + 1.5)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 2.6)
  o.connect(f).connect(g).connect(master!)
  o.start(at); o.stop(at + 2.8)
}

function pad(freq: number, level: number) {
  const c = audio()
  const stops: Array<() => void> = []
  for (const detune of [-6, 5]) {
    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.value = freq
    o.detune.value = detune
    const g = c.createGain()
    g.gain.value = 0
    g.gain.linearRampToValueAtTime(level, c.currentTime + 3)
    o.connect(g).connect(master!)
    o.start()
    stops.push(() => {
      g.gain.setTargetAtTime(0, c.currentTime, 0.5)
      setTimeout(() => { try { o.stop() } catch { /* already stopped */ } }, 1800)
    })
  }
  return () => stops.forEach(f => f())
}

/** Look-ahead scheduler: the only way to get steady rhythm out of WebAudio. */
function rhythm(spec: SoundSpec) {
  const c = audio()
  const beat = 0.52
  let next = c.currentTime + 0.3
  let step = 0
  // A loose dhak bol: strong on 1 and 4, fills either side.
  const pattern = [1, 0, 0.6, 1, 0, 0.7, 0.5, 0]

  const tick = () => {
    while (next < c.currentTime + 0.4) {
      const v = pattern[step % pattern.length]
      if (spec.dhak && v > 0 && Math.random() < 0.92) {
        dhakHit(next, v === 1, spec.dhak * 0.5 * (0.85 + Math.random() * 0.3))
      }
      if (spec.bells && step % 16 === 0 && Math.random() < 0.7) {
        bell(next, 520 + Math.random() * 90, spec.bells * 0.16)
      }
      if (spec.conch && step % 64 === 8 && Math.random() < 0.6) {
        conchBlow(next, spec.conch * 0.16)
      }
      next += beat
      step++
    }
  }
  const timer = setInterval(tick, 60)
  tick()
  return () => clearInterval(timer)
}

/* ------------------------------ public API ------------------------------ */

export function isPlaying(): boolean { return stopFns.length > 0 }
export function isMuted(): boolean { return muted }

export function setMuted(next: boolean): void {
  muted = next
  if (master && ctx) master.gain.setTargetAtTime(next ? 0 : 0.85, ctx.currentTime, 0.08)
}

export function stopSound(): void {
  stopFns.forEach(f => { try { f() } catch { /* node already torn down */ } })
  stopFns = []
  current = null
}

/** Must be called from a user gesture. Safe to call repeatedly. */
export async function playSound(spec: SoundSpec | undefined): Promise<void> {
  if (!spec || typeof window === 'undefined') { stopSound(); return }
  stopSound()
  current = spec
  const c = audio()
  if (c.state === 'suspended') await c.resume()

  const fns: Array<() => void> = []
  if (spec.rain) fns.push(bed(spec.rain * 0.16, 'highpass', 900, 0.6))
  if (spec.water) fns.push(bed(spec.water * 0.1, 'bandpass', 420, 0.7, { rate: 0.12, depth: 0.03 }))
  if (spec.wind) fns.push(bed(spec.wind * 0.09, 'lowpass', 380, 0.9, { rate: 0.07, depth: 0.03 }))
  if (spec.crowd) fns.push(bed(spec.crowd * 0.07, 'bandpass', 720, 0.35, { rate: 0.19, depth: 0.02 }))
  if (spec.insects) fns.push(bed(spec.insects * 0.035, 'bandpass', 5200, 6, { rate: 5.5, depth: 0.012 }))
  if (spec.drone) fns.push(pad(spec.drone, 0.035))
  if (spec.dhak || spec.bells || spec.conch) fns.push(rhythm(spec))

  stopFns = fns
}

/** Preview while the picker is open; the user hears before committing (§14). */
export async function previewSound(spec: SoundSpec | undefined): Promise<void> {
  await playSound(spec)
}

export function currentSpec(): SoundSpec | null { return current }

/**
 * A `MediaStream` carrying whatever the synth engine is currently playing —
 * for recording a gift video, not for anything a listener ever hears
 * directly. Fans `master` out to a second destination alongside the real
 * speakers (`connect()` supports multiple destinations from one node), so
 * capturing audio never changes what actually plays out loud.
 */
export function captureAudioStream(): MediaStream {
  const c = audio()
  if (!recordDest) {
    recordDest = c.createMediaStreamDestination()
    master!.connect(recordDest)
  }
  return recordDest.stream
}
