/**
 * "Gift this" occasions (§ "the significance drops after pujo is finished").
 * The mechanic — a recipient, a personal message, a card — is occasion-
 * agnostic; these are just the wording/greeting presets on top of it, so
 * the feature stays alive the other eleven months of the year instead of
 * going quiet the day Bijoya Dashami ends. `seasonal` only affects display
 * order (the in-season one first); nothing here is hidden the rest of the
 * year — a homesick evening in June is exactly when "Missing Home" matters
 * most.
 */
export type OccasionId = 'puja' | 'homesick' | 'poila-boishakh' | 'just-because'

export interface Occasion {
  id: OccasionId
  label: string
  /** The card's own headline — printed above the message, not editable. */
  greeting: string
  /** A real, ready-to-send starting message — editable, not a placeholder
   *  that vanishes on focus, so "just tap send" is a genuine option. */
  starter: string
  seasonal?: boolean
}

export const OCCASIONS: Occasion[] = [
  {
    id: 'puja', label: 'Puja Card', greeting: 'Shubho Bijoya',
    starter: 'Wishing you and your family a joyous Durga Puja.', seasonal: true,
  },
  {
    id: 'homesick', label: 'Missing Home', greeting: 'Thinking of you',
    starter: 'Saw this and thought of home — and of you.',
  },
  {
    id: 'poila-boishakh', label: 'Poila Boishakh', greeting: 'Shubho Noboborsho',
    starter: 'Wishing you a wonderful Bengali New Year.',
  },
  {
    id: 'just-because', label: 'Just Because', greeting: '',
    starter: 'No reason — just wanted you to see this.',
  },
]

export function getOccasion(id: OccasionId): Occasion {
  return OCCASIONS.find(o => o.id === id) ?? OCCASIONS[0]
}
