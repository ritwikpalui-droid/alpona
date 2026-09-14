import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alpona',
    short_name: 'Alpona',
    description: "Don't just visit a Puja. Build your own.",
    start_url: '/',
    display: 'standalone',
    background_color: '#F4EFE5',
    theme_color: '#F4EFE5',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }
}
