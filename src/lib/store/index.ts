import type { Store } from './types'
import { memoryStore } from './memory'

/**
 * Adapter selection. Today there is one; the point is that route handlers
 * import `store` and never learn which.
 */
export const store: Store = memoryStore
export type { Store, Board, ListQuery, ListResult } from './types'
