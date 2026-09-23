/**
 * The math behind "hold and rotate" — a live, continuous orthographic
 * approximation, not a lookup into a fixed set of pre-rendered frames.
 *
 * A bouquet/holder is modelled as several small parts arranged in a circle
 * (flowers around a rim, a ribbon knot on a vase, a handle on a basket).
 * Each part is painted ONCE, at mount, as a flat local-coordinate sprite —
 * rotating the assembly never redraws a petal or re-runs `blob()`; it only
 * moves and rescales that already-painted sprite. That split (paint once,
 * transform every frame) is the whole reason this stays smooth on a phone —
 * see the file-level note in `src/lib/giftVideo.ts` for the same lesson
 * learned the hard way with per-frame filtered-SVG redraws.
 */

const TAU = Math.PI * 2

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Shortest signed distance from `b` to `a`, in degrees, wrapped to ±180. */
function angleDelta(a: number, b: number): number {
  let d = (a - b) % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

export interface OrbitPose {
  /** Horizontal offset from center, local units. */
  x: number
  /** How much bigger/closer (>1) or smaller/further (<1) this part reads. */
  scale: number
  /** 0 (fully away-facing) .. 1 (fully camera-facing) — drive opacity/hide with it. */
  facing: number
  /** Sort ascending and render in that order — back parts first, front last. */
  zOrder: number
}

/**
 * Where a part sitting at `placementDeg` around the rim appears when the
 * whole assembly is viewed from `viewDeg`. `radius` is the part's orbit
 * radius in local units (how far from center it sits).
 */
export function orbitPose(viewDeg: number, placementDeg: number, radius: number): OrbitPose {
  const delta = deg2rad(angleDelta(viewDeg, placementDeg))
  const facing = (Math.cos(delta) + 1) / 2 // 0..1
  return {
    x: radius * Math.sin(delta),
    scale: 0.62 + 0.38 * facing,
    facing,
    zOrder: Math.cos(delta),
  }
}

/** Evenly distributes `n` items around the circle, degrees, starting at 0°. */
export function evenAngles(n: number): number[] {
  if (n <= 0) return []
  return Array.from({ length: n }, (_, i) => (i / n) * 360)
}

/**
 * A part all but disappears once it's most of the way round the back — this
 * is what stops the "far side" reading as a confusing overlapping smear of
 * every flower at once. Returns 0..1, multiply straight into opacity.
 */
export function backFade(facing: number): number {
  return facing < 0.18 ? 0 : Math.min(1, (facing - 0.18) / 0.22)
}

export { angleDelta, TAU }
