import type { PublishedWorld, Scene } from '../types'

export type Board = 'overall' | 'trending' | 'loved' | 'recent'

export interface ListQuery {
  board: Board
  limit?: number
  cursor?: number
}

export interface ListResult {
  worlds: PublishedWorld[]
  nextCursor: number | null
  total: number
}

/**
 * Everything the app needs from persistence. The route handlers talk only to
 * this, so moving from the in-memory adapter to Postgres/KV is one new file.
 */
export interface Store {
  publish(input: { scene: Scene; title: string; nickname: string; description?: string }): Promise<PublishedWorld>
  get(id: string): Promise<PublishedWorld | null>
  list(q: ListQuery): Promise<ListResult>
  /** Idempotent: a second vote from the same voter is a no-op, not an error. */
  vote(id: string, voterId: string): Promise<{ world: PublishedWorld; counted: boolean }>
  hasVoted(id: string, voterId: string): Promise<boolean>
  votedIds(voterId: string): Promise<string[]>
  report(id: string, voterId: string): Promise<void>
  /** 1-based position on the overall board, or null if unranked/removed. */
  rank(id: string): Promise<number | null>
  /** How many more votes to climb one place. null at #1. */
  gapToNext(id: string): Promise<{ places: number; votes: number } | null>
}
