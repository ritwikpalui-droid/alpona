import type { Scene } from './types'
import { getAsset } from './assets'
import { rng } from './rng'
import { encodeScene } from './scene'

/**
 * Titles are generated from the combination, not from a random bank, so the
 * name feels earned: "Moonlight at the Ganga" only appears if you actually
 * chose moonlight and the Ganga. Deterministic — the same scene always gets
 * the same title until the user edits it.
 */

const PLACE: Record<string, string> = {
  'ganga-ghat': 'the Ganga',
  'kolkata-street': 'North Kolkata',
  howrah: 'the Bridge',
  himalaya: 'the Clouds',
  forest: 'the Forest',
  sea: 'the Sea',
  village: 'the Village',
  'tea-garden': 'the Tea Gardens',
  zamindar: 'the Old House',
  rooftop: 'the Rooftops',
  'rainy-kolkata': 'Wet Kolkata',
  'misty-valley': 'the Valley',
  ocean: 'the Ocean',
  'mountain-pass': 'the Mountain Pass',
  'banyan-canopy': 'the Banyan Tree',
  'paddy-fields': 'the Paddy Fields',
}

const LIGHT: Record<string, string> = {
  'golden-hour': 'Golden Hour',
  sunrise: 'First Light',
  'blue-hour': 'Blue Hour',
  moonlight: 'Moonlight',
  'deep-night': 'Midnight',
  diya: 'Lamplight',
  'fairy-lights': 'Little Lights',
  'warm-festival': 'Festival Light',
  'neon-kolkata': 'Neon',
  spotlight: 'One Light',
  'rainy-night': 'Rain and Light',
  'misty-cinematic': 'Mist',
}

const FLOWER: Record<string, string> = {
  shiuli: 'Shiuli',
  marigold: 'Marigold',
  hibiscus: 'Hibiscus',
  lotus: 'Lotus',
  tuberose: 'Rajanigandha',
  jasmine: 'Jasmine',
  'white-flowers': 'White Flower',
  floating: 'Floating Flower',
}

/** Places you can meaningfully be *above*. */
const ABOVE = new Set(['himalaya', 'rooftop', 'misty-valley', 'tea-garden'])

function titleCase(s: string) { return s.replace(/\b([a-z])/g, (m) => m.toUpperCase()) }

export function generateTitle(scene: Scene): string {
  const r = rng('title:' + encodeScene(scene))
  const place = scene.world ? PLACE[scene.world] : undefined
  const light = scene.lighting ? LIGHT[scene.lighting] : undefined
  const flower = scene.flowers ? FLOWER[scene.flowers] : undefined
  const durga = getAsset('durga', scene.durga)
  const sky = getAsset('sky', scene.sky)

  const candidates: string[] = []

  if (light && place) candidates.push(`${light} at ${place}`, `${light} over ${place}`)
  if (place && scene.world && ABOVE.has(scene.world)) candidates.push(`Durga Above ${place}`)
  if (place) candidates.push(`A Puja in ${place}`, `The Puja at ${place}`)
  if (flower) candidates.push(`The ${flower} Puja`)
  if (sky?.meta.tags.includes('rain') && place) candidates.push(`Rain Over ${place}`)
  if (sky?.id === 'full-moon' && place) candidates.push(`Full Moon at ${place}`)
  if (durga?.meta.tags.includes('minimal') && place) candidates.push(`Quiet Puja at ${place}`)
  if (durga?.meta.tags.includes('fierce')) candidates.push(place ? `She Arrives at ${place}` : 'She Arrives')
  if (light) candidates.push(`${light}`)

  if (!candidates.length) return 'My Alpona'
  // Prefer the most specific phrasing; vary deterministically among the top few.
  return titleCase(r.pick(candidates.slice(0, Math.min(4, candidates.length))))
}
