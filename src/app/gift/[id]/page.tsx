import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import GiftRevealClient from '@/components/gift/GiftRevealClient'
import { giftStore } from '@/lib/gift/store'

interface Props { params: Promise<{ id: string }> }

const KIND_LABEL: Record<string, string> = { bouquet: 'bouquet', chocolate: 'box of chocolates', mishti: 'box of mishti' }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const gift = await giftStore.get(id)
  if (!gift) return { title: 'Alpona not found' }

  const description = gift.message || `A ${KIND_LABEL[gift.build.kind]} from ${gift.nickname}.`

  return {
    title: gift.title,
    description,
    alternates: { canonical: `/gift/${gift.id}` },
    openGraph: {
      title: `${gift.title} · Alpona`,
      description,
      type: 'article',
      images: [{ url: `/gift/${gift.id}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/gift/${gift.id}/opengraph-image`],
    },
  }
}

export default async function GiftPage({ params }: Props) {
  const { id } = await params
  const gift = await giftStore.get(id)
  if (!gift) notFound()

  return (
    <div className="min-h-dvh bg-paper">
      <Header />
      <GiftRevealClient gift={gift} />
    </div>
  )
}
