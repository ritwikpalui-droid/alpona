import type { Metadata } from 'next'
import BouquetClient from '@/components/gift/BouquetClient'

export const metadata: Metadata = {
  title: 'Send a Bouquet',
  description: 'Pick a holder, add your flowers, and send a bouquet someone can hold and turn in their own hands.',
}

export default function BouquetPage() {
  return <BouquetClient />
}
