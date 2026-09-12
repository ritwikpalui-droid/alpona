import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import type { Board } from '@/lib/store'
import { getVoter, voterCookie } from '@/lib/server/voter'

const BOARDS: Board[] = ['overall', 'trending', 'loved', 'recent']

export async function GET(req: Request) {
  const url = new URL(req.url)
  const boardParam = url.searchParams.get('board') as Board | null
  const board: Board = boardParam && BOARDS.includes(boardParam) ? boardParam : 'overall'
  const cursor = Math.max(0, Number(url.searchParams.get('cursor') ?? 0) || 0)
  const limit = Math.min(48, Math.max(1, Number(url.searchParams.get('limit') ?? 24) || 24))

  const [result, voter] = await Promise.all([store.list({ board, cursor, limit }), getVoter()])
  const voted = await store.votedIds(voter.id)

  const res = NextResponse.json({ ...result, board, voted })
  if (voter.issued) res.cookies.set(await voterCookie(voter.id))
  // Short public cache: a spike hits the CDN, not the store.
  res.headers.set('Cache-Control', 'private, max-age=15')
  return res
}
