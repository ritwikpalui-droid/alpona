import type { Metadata } from 'next'
import StudioClient from '@/components/studio/StudioClient'

export const metadata: Metadata = {
  title: 'Create Your Puja World',
  description: 'Choose a world, a pandal and Durga, then watch your own watercolour Durga Puja scene build itself, layer by layer.',
}

export default function CreatePage() {
  return <StudioClient />
}
