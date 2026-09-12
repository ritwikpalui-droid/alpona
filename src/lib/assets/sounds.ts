import type { Asset } from '../types'
import { P } from '../art/palette'

/*
 * Soundscapes are synthesised in the browser (see lib/audio.ts) — no mp3s.
 * That is ₹0 hosting, near-zero bandwidth on mobile data, and instant preview.
 * Each spec is a mix of layers, 0–1.
 */

function snd(id: string, name: string, subtitle: string, palette: string[],
  meta: Asset['meta'], sound: Asset['sound'], affinity?: Asset['affinity']): Asset {
  return { id, category: 'sound', name, subtitle, palette, meta, sound, affinity }
}

export const soundscapes: Asset[] = [
  snd('silence', 'Silence', 'No sound at all', [P.paperDeep, P.paper, P.cream],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['serene', 'intimate'], intensity: 1, tags: ['quiet', 'minimal', 'still', 'restraint'] },
    {}),

  snd('distant-dhak', 'Distant Dhak', 'Two paras away, and getting closer', [P.earth, P.marigold, P.clay],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk', 'night'], mood: ['nostalgic', 'festive', 'grand'], intensity: 2, tags: ['dhak', 'drum', 'far', 'classic', 'warm', 'festive'] },
    { dhak: 0.45, wind: 0.16, drone: 0 }),

  snd('rain-dhak', 'Rain & Dhak', 'The two sounds of a Bengali October', [P.slate, P.earth, P.teal],
    { terrain: [], timeOfDay: ['day', 'dusk', 'night'], mood: ['nostalgic', 'intimate', 'dramatic'], intensity: 3, tags: ['rain', 'dhak', 'wet', 'monsoon', 'cool', 'drum'] },
    { dhak: 0.34, rain: 0.6, wind: 0.2 }, { boost: ['rain', 'wet', 'monsoon', 'storm'] }),

  snd('ghat-dhak', 'Ganga Ghat & Dhak', 'Water against stone, under the drums', [P.blue, P.earth, P.cream],
    { terrain: ['river'], timeOfDay: ['dawn', 'golden', 'dusk', 'night'], mood: ['serene', 'nostalgic', 'grand'], intensity: 3, tags: ['water', 'river', 'dhak', 'drum', 'ghat', 'classic'] },
    { dhak: 0.4, water: 0.5, wind: 0.14, bells: 0.12 }, { boost: ['water', 'river', 'ghat'] }),

  snd('forest-dhak', 'Forest & Distant Dhak', 'Insects, wind in the sal, and a drum somewhere', [P.green, P.moss, P.earth],
    { terrain: ['forest', 'mountain'], timeOfDay: ['dusk', 'night', 'dawn'], mood: ['mystic', 'serene', 'intimate'], intensity: 2, tags: ['forest', 'insects', 'dhak', 'wild', 'quiet', 'green'] },
    { dhak: 0.2, insects: 0.55, wind: 0.3 }, { boost: ['forest', 'trees', 'wild', 'green'] }),

  snd('temple-bells', 'Temple Bells', 'Ghanta, kansar, and a conch at the end', [P.gold, P.cream, P.earth],
    { terrain: [], timeOfDay: ['dawn', 'day', 'golden', 'dusk'], mood: ['grand', 'serene', 'nostalgic'], intensity: 2, tags: ['bell', 'brass', 'conch', 'temple', 'traditional', 'sacred'] },
    { bells: 0.6, conch: 0.3, drone: 96 }),

  snd('kolkata-night', 'Kolkata Night', 'Traffic, a far-off mic, someone’s radio', [P.indigo, P.amber, P.slate],
    { terrain: ['urban', 'rooftop'], timeOfDay: ['dusk', 'night'], mood: ['nostalgic', 'intimate', 'dramatic'], intensity: 3, tags: ['city', 'street', 'night', 'crowd', 'urban', 'hum'] },
    { crowd: 0.42, wind: 0.24, dhak: 0.14, drone: 62 }, { boost: ['city', 'urban', 'street', 'skyline'] }),

  snd('shiuli-morning', 'Shiuli Morning', 'Birds, and Mahalaya on somebody’s radio', [P.amber, P.paper, P.moss],
    { terrain: [], timeOfDay: ['dawn'], mood: ['nostalgic', 'serene', 'intimate'], intensity: 1, tags: ['morning', 'dawn', 'birds', 'soft', 'shiuli', 'quiet', 'mahalaya'] },
    { insects: 0.2, wind: 0.3, bells: 0.18, drone: 128 }),

  snd('puja-crowd', 'Puja Crowd', 'Pandal-hopping at ten p.m. on Ashtami', [P.marigold, P.vermilion, P.earth],
    { terrain: ['urban', 'river', 'plain'], timeOfDay: ['dusk', 'night'], mood: ['festive', 'grand'], intensity: 5, tags: ['crowd', 'festive', 'loud', 'dhak', 'city', 'people'] },
    { crowd: 0.62, dhak: 0.6, bells: 0.24, conch: 0.14 }, { boost: ['crowd', 'city', 'street', 'festive'] }),

  snd('quiet-midnight', 'Quiet Midnight Puja', 'Everyone gone home. One lamp, one drum, nobody watching', [P.ink, P.indigo, P.amber],
    { terrain: [], timeOfDay: ['night'], mood: ['intimate', 'mystic', 'serene'], intensity: 1, tags: ['night', 'quiet', 'still', 'late', 'alone', 'soft'] },
    { dhak: 0.14, wind: 0.24, insects: 0.16, drone: 72 }),
]
