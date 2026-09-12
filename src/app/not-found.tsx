import Link from 'next/link'
import Header from '@/components/Header'

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-paper">
      <Header />
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-28 text-center">
        <p className="display mb-3 text-[26px]">This world hasn&rsquo;t been painted yet</p>
        <p className="mb-7 text-[14px] text-ink-2">The page you&rsquo;re looking for doesn&rsquo;t exist, or the creation was removed.</p>
        <Link href="/" className="rounded-full bg-ink px-6 py-3 text-[13.5px] font-medium text-paper">Back to Puja World</Link>
      </div>
    </div>
  )
}
