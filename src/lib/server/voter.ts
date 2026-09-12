import { cookies } from 'next/headers'

/**
 * Anonymous identity, no login wall (§44).
 *
 * A random id is issued in an httpOnly cookie and signed with a server secret,
 * so a client cannot mint a fresh voter id per request by editing the cookie —
 * it can only clear it, which costs it every vote it has already cast.
 */

const COOKIE = 'pw_v'
const SECRET = process.env.PUJA_SECRET ?? 'dev-only-secret-change-me'

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return Array.from(new Uint8Array(sig)).slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sign(id: string): Promise<string> { return `${id}.${await hmac(id)}` }

async function verify(token: string): Promise<string | null> {
  const dot = token.lastIndexOf('.')
  if (dot < 1) return null
  const id = token.slice(0, dot)
  return (await hmac(id)) === token.slice(dot + 1) ? id : null
}

export interface VoterContext { id: string; issued: boolean }

/** Reads the caller's voter id, minting one if absent. */
export async function getVoter(): Promise<VoterContext> {
  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  if (raw) {
    const id = await verify(raw)
    if (id) return { id, issued: false }
  }
  return { id: crypto.randomUUID(), issued: true }
}

export async function voterCookie(id: string) {
  return {
    name: COOKIE,
    value: await sign(id),
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  }
}

/** Coarse client signal, hashed — used only as a second rate-limit dimension. */
export function clientKey(req: Request): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip') ?? 'unknown'
  const ua = req.headers.get('user-agent') ?? ''
  let h = 2166136261 >>> 0
  for (const ch of ip + '|' + ua.slice(0, 60)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) }
  return (h >>> 0).toString(36)
}
