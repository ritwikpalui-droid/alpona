import type { Metadata } from 'next'
import MishtiClient from '@/components/gift/MishtiClient'

export const metadata: Metadata = {
  title: 'Send Mishti',
  description: 'Pack a box of beloved Kolkata mishti and send a link someone can open and enjoy themselves.',
}

export default function MishtiPage() {
  return <MishtiClient />
}
