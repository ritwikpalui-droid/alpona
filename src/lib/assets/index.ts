import type { Asset, Category, CategoryId } from '../types'
import { worlds } from './worlds'
import { pandals } from './pandals'
import { durgaIdols } from './durga'
import { skies, lightings } from './atmosphere'
import { flowers, decorations } from './botanicals'
import { ambiences } from './ambience'
import { soundscapes } from './sounds'

/**
 * The nine steps, in the order the scene builds. Adding a tenth category, or a
 * hundredth asset to an existing one, touches nothing outside this file and the
 * catalogue module itself.
 */
export const CATEGORIES: Category[] = [
  { id: 'world', index: 1, label: 'World', question: 'Where should your Puja live?', assets: worlds },
  { id: 'pandal', index: 2, label: 'Pandal', question: 'What kind of pandal?', assets: pandals },
  { id: 'durga', index: 3, label: 'Durga', question: 'And how does she appear?', assets: durgaIdols },
  { id: 'lighting', index: 4, label: 'Light', question: 'What light is falling on all this?', assets: lightings },
  { id: 'flowers', index: 5, label: 'Flowers', question: 'Which flowers?', assets: flowers },
  { id: 'decor', index: 6, label: 'Decor', question: 'What else is there?', assets: decorations, optional: true },
  { id: 'sky', index: 7, label: 'Sky', question: 'What is the sky doing?', assets: skies },
  { id: 'ambience', index: 8, label: 'Air', question: 'Anything moving in the air?', assets: ambiences, optional: true },
  { id: 'sound', index: 9, label: 'Sound', question: 'What can you hear?', assets: soundscapes, optional: true },
]

export const CATEGORY_ORDER: CategoryId[] = CATEGORIES.map(c => c.id)

const byId = new Map<string, Asset>()
for (const c of CATEGORIES) for (const a of c.assets) byId.set(`${c.id}:${a.id}`, a)

export function getAsset(category: CategoryId, id: string | undefined): Asset | undefined {
  return id ? byId.get(`${category}:${id}`) : undefined
}

export function getCategory(id: CategoryId): Category {
  const c = CATEGORIES.find(x => x.id === id)
  if (!c) throw new Error(`Unknown category: ${id}`)
  return c
}

export const TOTAL_STEPS = CATEGORIES.length
