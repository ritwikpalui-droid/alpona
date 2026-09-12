import type { Board } from '@/lib/store'
import type { PublishedWorld } from '@/lib/types'

export interface WorldsResponse {
  worlds: PublishedWorld[]
  nextCursor: number | null
  total: number
  board: Board
  voted: string[]
}

export async function fetchWorlds(board: Board, cursor = 0, limit = 24): Promise<WorldsResponse> {
  const res = await fetch(`/api/worlds?board=${board}&cursor=${cursor}&limit=${limit}`)
  if (!res.ok) throw new Error('Could not load the gallery.')
  return res.json()
}

export interface VoteResponse {
  votes: number
  counted: boolean
  rank: number | null
  gap: { places: number; votes: number } | null
  error?: string
  message?: string
}

export async function castVote(id: string): Promise<VoteResponse> {
  const res = await fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message ?? 'Could not cast your vote.')
  return data
}

export async function reportWorld(id: string): Promise<void> {
  await fetch('/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
}
