/** The restrained pigment box. The interface borrows from it; the artwork lives in it. */
export const P = {
  paper: '#F2ECE1',
  paperDeep: '#E6DCC9',
  cream: '#EFE4CE',
  ink: '#2A2621',
  inkSoft: '#5C5346',

  vermilion: '#C0402A',
  red: '#A63528',
  marigold: '#E0912F',
  amber: '#D9A441',
  gold: '#B8913F',

  rose: '#D08C8C',
  pink: '#E0A8AE',

  indigo: '#33415E',
  blue: '#4A6B8A',
  slate: '#7A8699',
  violet: '#6B5B8A',

  teal: '#46786F',
  green: '#5E7A4E',
  moss: '#7A8A5C',

  earth: '#8A6A4F',
  terracotta: '#B36A47',
  clay: '#C08055',
} as const

/** Canvas geometry. Native 9:16 — the share card is not a re-crop. */
export const W = 1000
export const H = 1500
export const HORIZON = 840
export const PANDAL_BOX = { x: 235, y: 560, w: 530, h: 540 }
export const DURGA_BOX = { x: 372, y: 735, w: 256, h: 330 }
