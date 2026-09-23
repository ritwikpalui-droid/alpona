import type { Metadata } from 'next'
import ChocolateClient from '@/components/gift/ChocolateClient'

export const metadata: Metadata = {
  title: 'Send Chocolate',
  description: 'Pack a box of chocolates and send a link someone can open and unwrap themselves.',
}

export default function ChocolatePage() {
  return <ChocolateClient />
}
