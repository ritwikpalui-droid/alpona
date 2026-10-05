/**
 * A gift is NOT a `Scene` — `Scene` (see `../types.ts`) is one asset id per
 * category, which can't express "several flowers, maybe repeated types."
 * This is a deliberately separate, small data model rather than forcing
 * the Puja-scene shape to fit; see the approved plan
 * (abundant-spinning-platypus.md) for why.
 */

export type ImpressionKind = 'bouquet' | 'chocolate' | 'mishti'

export interface BouquetItem {
  id: string
  flowerId: string
  color?: string
}

export interface BouquetBuild {
  kind: 'bouquet'
  holderId: string
  holderColor?: string
  items: BouquetItem[]
}

export interface ChocolateItemBuild {
  id: string
  pieceId: string
}

export interface ChocolateBuild {
  kind: 'chocolate'
  boxId: string
  boxColor?: string
  items: ChocolateItemBuild[]
}

export interface MishtiItemBuild {
  id: string
  itemId: string
}

export interface MishtiBuild {
  kind: 'mishti'
  boxId: string
  boxColor?: string
  items: MishtiItemBuild[]
}

export type ImpressionBuild = BouquetBuild | ChocolateBuild | MishtiBuild

export interface PublishedImpression {
  id: string
  build: ImpressionBuild
  title: string
  nickname: string
  message?: string
  recipient?: string
  /** A `sound` category asset id — reuses the existing soundscape registry. */
  soundId?: string
  createdAt: number
}

/** Cap per bouquet/box — mirrors `sanitizeExtras`'s existing 40-cap idea,
 *  scaled down for what still reads as a believable small cluster in a
 *  ~300px viewport rather than an unreadable pile. */
export const MAX_ITEMS = 16
