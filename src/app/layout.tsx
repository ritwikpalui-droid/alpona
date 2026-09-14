import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, Noto_Serif_Bengali } from 'next/font/google'
import Script from 'next/script'
import { ArtDefs } from '@/lib/art/primitives'
import { adsenseClientId } from '@/lib/ads'
import ViewportHeightVar from '@/components/ViewportHeightVar'
import './globals.css'

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
})

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// Loaded but not preloaded: Bengali appears only as small accents.
const bengali = Noto_Serif_Bengali({
  subsets: ['bengali'],
  variable: '--font-bengali',
  display: 'swap',
  weight: ['400', '600'],
  preload: false,
})

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpona.example'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Alpona — Build your own Durga Puja',
    template: '%s · Alpona',
  },
  description:
    'Do not just visit a Puja. Build your own. Choose a world, a pandal and Durga, then watch a watercolour Durga Puja scene paint itself layer by layer. Publish it, share it, and compete to be the number one Alpona on the leaderboard.',
  keywords: [
    'Alpona', 'Durga Puja 2026', 'create your own Puja', 'virtual Durga Puja',
    'Durga Puja artwork', 'Bengali Durga Puja', 'interactive Durga Puja experience',
    'Durga Puja creative', 'pandal', 'Kolkata Durga Puja',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Alpona',
    title: 'Alpona — Build your own Durga Puja',
    description: 'Choose a world. Build your Puja. Make it beautiful. Share it.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#F4EFE5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsClient = adsenseClientId()
  return (
    <html lang="en-IN" className={`${display.variable} ${sans.variable} ${bengali.variable}`}>
      <body className="min-h-dvh antialiased">
        {/* The AdSense loader itself — loaded sitewide (Google requires the
            same script/client id on every page it appears on), but absent
            entirely with no publisher id set, and `afterInteractive` so it
            never competes with the scene canvas for the main thread on
            first paint. Individual placements still each opt in on their
            own — see AdSlot.tsx — this only makes the library available. */}
        {adsClient && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <ViewportHeightVar />
        {/*
         * The watercolour filter set (wc-soft/wc-rough/paper-grain/glow/…),
         * defined exactly once for the whole document. Every SceneCanvas
         * references these by id instead of carrying its own copy — SVG's
         * url(#id) resolves document-wide anyway, so a dozen copies bought
         * nothing but dead weight and, worse, DOM churn: React unmounting one
         * canvas (switching gallery boards, moving between studio steps) used
         * to remove and re-add duplicate-id <filter> elements that every
         * OTHER canvas on the page was also referencing, which is a real,
         * visible flash. One instance, never unmounted, has none of that.
         */}
        <svg aria-hidden focusable="false" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <ArtDefs />
        </svg>
        {children}
      </body>
    </html>
  )
}
