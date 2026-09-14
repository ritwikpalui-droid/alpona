import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import { clientKey, getVoter, voterCookie } from '@/lib/server/voter'
import { LIMITS, take } from '@/lib/server/ratelimit'
import { cleanText, looksAbusive, sanitizeAdjust, sanitizeExtras, sanitizeScene } from '@/lib/server/validate'
import { generateTitle } from '@/lib/title'

export async function POST(req: Request) {
  const voter = await getVoter()
  if (!take(`pub:${voter.id}`, LIMITS.publish) || !take(`pub:ip:${clientKey(req)}`, LIMITS.publish)) {
    return NextResponse.json({ error: 'rate_limited', message: 'Give it a minute before publishing again.' }, { status: 429 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const input = (body ?? {}) as Record<string, unknown>

  const scene = sanitizeScene(input.scene)
  if (!scene) {
    return NextResponse.json({ error: 'incomplete', message: 'A few layers still to choose.' }, { status: 400 })
  }

  const nickname = cleanText(input.nickname, 24) || 'Anonymous'
  const title = cleanText(input.title, 60) || generateTitle(scene)
  const description = cleanText(input.description, 160)
  const adjust = sanitizeAdjust(input.adjust)
  const extras = sanitizeExtras(input.extras)

  if (looksAbusive(nickname, title, description)) {
    return NextResponse.json({ error: 'rejected', message: 'Please choose a different nickname or title.' }, { status: 400 })
  }

  const world = await store.publish({ scene, title, nickname, description: description || undefined, adjust, extras })
  const res = NextResponse.json({ world }, { status: 201 })
  if (voter.issued) res.cookies.set(await voterCookie(voter.id))
  return res
}
