import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { clientKey, getVoter, voterCookie } from '@/lib/server/voter'
import { LIMITS, take } from '@/lib/server/ratelimit'

export async function POST(req: Request) {
  const voter = await getVoter()
  if (!take(`rep:${voter.id}`, LIMITS.report) || !take(`rep:ip:${clientKey(req)}`, LIMITS.report)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const id = (body as { id?: unknown })?.id
  if (typeof id !== 'string') return NextResponse.json({ error: 'bad_request' }, { status: 400 })

  await store.report(id, voter.id)
  const res = NextResponse.json({ ok: true })
  if (voter.issued) res.cookies.set(await voterCookie(voter.id))
  return res
}
