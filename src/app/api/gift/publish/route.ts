import { NextResponse } from 'next/server'
import { giftStore } from '@/lib/gift/store'
import { clientKey, getVoter, voterCookie } from '@/lib/server/voter'
import { LIMITS, take } from '@/lib/server/ratelimit'
import { cleanText, looksAbusive, sanitizeGiftBuild } from '@/lib/server/validate'
import { getAsset } from '@/lib/assets'

const DEFAULT_TITLE: Record<string, string> = {
  bouquet: 'A Bouquet, For You',
  chocolate: 'A Little Something Sweet',
}

export async function POST(req: Request) {
  const voter = await getVoter()
  if (!take(`giftpub:${voter.id}`, LIMITS.giftPublish) || !take(`giftpub:ip:${clientKey(req)}`, LIMITS.giftPublish)) {
    return NextResponse.json({ error: 'rate_limited', message: 'Give it a minute before publishing again.' }, { status: 429 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const input = (body ?? {}) as Record<string, unknown>

  const build = sanitizeGiftBuild(input.build)
  if (!build) {
    return NextResponse.json({ error: 'incomplete', message: 'Add at least one flower or piece first.' }, { status: 400 })
  }

  const nickname = cleanText(input.nickname, 24) || 'Anonymous'
  const title = cleanText(input.title, 60) || DEFAULT_TITLE[build.kind]
  const message = cleanText(input.message, 160)
  const recipient = cleanText(input.recipient, 40)
  // `soundId` reuses the existing `sound` category registry — allowlisted
  // the same way `sanitizeScene` checks every asset id.
  const soundId = typeof input.soundId === 'string' && getAsset('sound', input.soundId) ? input.soundId : undefined

  if (looksAbusive(nickname, title, message, recipient)) {
    return NextResponse.json({ error: 'rejected', message: 'Please choose different wording.' }, { status: 400 })
  }

  const gift = await giftStore.publish({
    build, title, nickname,
    message: message || undefined,
    recipient: recipient || undefined,
    soundId,
  })
  const res = NextResponse.json({ gift }, { status: 201 })
  if (voter.issued) res.cookies.set(await voterCookie(voter.id))
  return res
}
