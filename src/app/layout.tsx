import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, Noto_Serif_Bengali } from 'next/font/google'
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

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pujaworld.example'

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Puja World 2026 — Build your own Durga Puja',
    template: '%s · Puja World 2026',
  },
  description:
    'Do not just visit a Puja. Build your own. Choose a world, a pandal and Durga, then watch a watercolour Durga Puja scene paint itself layer by layer. Publish it, share it, and compete to be the number one Puja World of 2026.',
  keywords: [
    'Puja World 2026', 'Durga Puja 2026', 'create your own Puja', 'virtual Durga Puja',
    'Durga Puja artwork', 'Bengali Durga Puja', 'interactive Durga Puja experience',
    'Durga Puja creative', 'pandal', 'Kolkata Durga Puja',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Puja World 2026',
    title: 'Puja World 2026 — Build your own Durga Puja',
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
  return (
    <html lang="en-IN" className={`${display.variable} ${sans.variable} ${bengali.variable}`}>
      <body className="paper-grain min-h-dvh antialiased">{children}</body>
    </html>
  )
}
