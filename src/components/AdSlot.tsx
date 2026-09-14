'use client'

import { useEffect, useRef } from 'react'
import { adsenseClientId, adsenseSlot } from '@/lib/ads'

/**
 * A single AdSense display unit — deliberately confined to the Gallery and
 * Leaderboard (browsing pages people visit to look at other creations),
 * never on `/create` or the Reveal/gift flow. The making, and the gifting,
 * stays completely ad-free; only "looking around at what other people
 * made" ever sits next to one, and even there it's one clearly-labelled
 * unit at the end of the page, not something woven into the grid itself.
 *
 * Reserves its own height up front (`minHeight`) so the page never jumps
 * once the ad actually loads in — a slot that appears out of nowhere and
 * shoves the vote button down mid-tap is exactly the kind of "downgrade"
 * this is trying to avoid. Renders nothing at all — no box, no label, no
 * reserved space — until both a publisher id and a slot id for this
 * specific placement are configured (see src/lib/ads.ts); an ad container
 * holding a blank space is worse than no container.
 */
export default function AdSlot({ placement }: { placement: 'gallery' | 'leaderboard' }) {
  const client = adsenseClientId()
  const slot = adsenseSlot(placement)
  const insRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (!client || !slot || pushed.current) return
    pushed.current = true
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] }
      w.adsbygoogle = w.adsbygoogle || []
      w.adsbygoogle.push({})
    } catch {
      // AdSense script not loaded yet or blocked (ad blocker, offline) —
      // the reserved space just stays empty, nothing else on the page cares.
    }
  }, [client, slot])

  if (!client || !slot) return null

  return (
    <div className="my-10">
      <p className="eyebrow mb-2 text-center text-ink-3/70">Advertisement</p>
      <div style={{ minHeight: 250 }} className="mx-auto max-w-3xl">
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  )
}
