'use client'

import { useEffect } from 'react'

/**
 * Sets `--app-vh` on the root element to the ACTUALLY visible height, in
 * real pixels — measured in JS, not trusted from CSS.
 *
 * Why this exists: `100dvh`/`100svh` are supposed to make this unnecessary,
 * but reported behaviour (a persistent bottom toolbar in some Android
 * browsers — e.g. Samsung Internet's own address/tab bar, which isn't a
 * hardware safe-area inset and doesn't always shrink the CSS viewport
 * units either) shows they don't reliably account for chrome some mobile
 * browsers draw UNDER the page content. `window.visualViewport.height` is
 * the one number mobile browsers get right almost universally — it's what
 * they use to reposition content around an on-screen keyboard, so it
 * already has to be accurate. Falls back to `window.innerHeight` on the
 * (rare, older) browser with no `visualViewport` support at all.
 *
 * Mounted once, in the root layout — every fixed-height, non-scrolling
 * screen (Reveal, the studio picker) reads `var(--app-vh)` instead of a
 * CSS viewport unit directly.
 */
export default function ViewportHeightVar() {
  useEffect(() => {
    const root = document.documentElement
    function set() {
      const h = window.visualViewport?.height ?? window.innerHeight
      root.style.setProperty('--app-vh', `${h}px`)
    }
    set()
    window.visualViewport?.addEventListener('resize', set)
    window.addEventListener('resize', set)
    window.addEventListener('orientationchange', set)
    return () => {
      window.visualViewport?.removeEventListener('resize', set)
      window.removeEventListener('resize', set)
      window.removeEventListener('orientationchange', set)
    }
  }, [])

  return null
}
