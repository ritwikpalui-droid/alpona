import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { clientKey, getVoter, voterCookie } from '@/lib/server/voter'
import { LIMITS, take } from '@/lib/server/ratelimit'

export async function POST(req: Request) {
  const voter = await getVoter()

  // Two dimensions: the signed voter cookie, and a coarse client fingerprint.
  // Clearing cookies to vote again still runs into the second bucket.
  if (!take(`vote:${voter.id}`, LIMITS.vote) || !take(`vote:ip:${clientKey(req)}`, LIMITS.vote)) {
    return NextResponse.json({ error: 'rate_limited', message: 'Slow down a moment.' }, { status: 429 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const id = (body as { id?: unknown })?.id
  if (typeof id !== 'string' || !id) return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  try {
    const { world, counted } = await store.vote(id, voter.id)
    const [rank, gap] = await Promise.all([store.rank(id), store.gapToNext(id)])
    const res = NextResponse.json({ votes: world.votes, counted, rank, gap })
    if (voter.issued) res.cookies.set(await voterCookie(voter.id))
    return res
  } catch {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
}
