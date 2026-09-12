import type { MetadataRoute } from 'next'
import { store } from '@/lib/store'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pujaworld.example'

/**
 * A handful of static pages plus recent published worlds — not thousands of
 * thin auto-pages (§48 explicitly warns against that). Capped and sorted by
 * recency so the file stays small and relevant as the gallery grows.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { worlds } = await store.list({ board: 'recent', limit: 200 })

  return [
    { url: SITE, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/create`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE}/gallery`, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE}/leaderboard`, changeFrequency: 'hourly', priority: 0.8 },
    ...worlds.map(w => ({
      url: `${SITE}/w/${w.id}`,
      lastModified: new Date(w.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ]
}
