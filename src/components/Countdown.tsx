'use client'

import { useSyncExternalStore } from 'react'
import { countdownTo, formatRemaining, phaseLine } from '@/lib/festival'

/**
 * The live clock as an external store: `useSyncExternalStore` renders the
 * server snapshot (0, meaning "unknown") on first paint and switches to the
 * real clock only after hydration, which is exactly the tool React ships for
 * a value that legitimately differs between server and client.
 */
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 60_000)
  return () => clearInterval(id)
}
const getSnapshot = () => Date.now()
const getServerSnapshot = () => 0

/** The event framing (§50). Quiet by default; it only gets loud in the final days. */
export default function Countdown({ className = '' }: { className?: string }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (now === 0) return <span className={className} />

  const cd = countdownTo(now)
  return (
    <span className={`eyebrow ${className}`}>
      {phaseLine(now)}
      {cd && <> · {cd.label} {formatRemaining(cd.target - now)}</>}
    </span>
  )
}
