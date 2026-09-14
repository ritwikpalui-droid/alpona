# Alpona — Architecture

> Choose a world. Build your Puja. Make it beautiful. Share it. Get votes.

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | SSR for `/w/[id]` share pages (SEO + rich unfurls), route handlers for voting, zero-config static caching |
| Language | TypeScript (strict) | Asset catalogue is data — types are the contract that keeps it addable-to |
| Styling | Tailwind v4 + design tokens in `@theme` | Restrained token set; the artwork carries the colour |
| Artwork | **SVG, composed client-side** | ₹0. No AI call per layer. One render = one DOM tree, no network |
| Sound | **WebAudio, synthesised** | ₹0 and ~0 bytes. No mp3 downloads on mobile data |
| Export | SVG → `<canvas>` → PNG, in-browser | No server render cost under a traffic spike |
| Data | `Store` interface + swappable adapter | Ships on in-memory/seeded; swap to Postgres/KV without touching routes |

## 2. Why procedural SVG artwork

The brief's hardest constraint is **visual coherence** (§33): every asset must look painted by the same hand.
Hand-authoring 100+ PNGs cannot guarantee that, and per-layer AI generation violates §38 (cost).

So every asset — mountain, idol, shiuli, cloud — is drawn through the **same three primitives**:

- `Wash` — pigment blob, edges broken by a shared `feTurbulence` + `feDisplacementMap` filter
- `Ink` — charcoal contour with per-point jitter from a seeded RNG
- `Speck` / `Grain` — pigment granulation and a global paper texture

Coherence is therefore *structural*, not a matter of discipline. Randomness is **seeded per asset id**, so
a scene renders identically every time (no re-jitter on re-render, no layout shift).

### Swapping in real artwork later
`Asset.art` is a discriminated union:

```ts
type Art =
  | { kind: 'proc'; draw: (r: Rng, box: Box) => ReactNode }   // today
  | { kind: 'image'; src: string; w: number; h: number }      // painted PNG/SVG, later
```

Replacing one asset's art is a one-line change. Nothing else in the app knows the difference.

## 3. Asset model (§40)

```ts
interface Asset {
  id; category; name; subtitle?
  palette: string[]          // drives placeholder pigment AND the option card
  meta: {
    terrain:  Terrain[]      // river | urban | mountain | forest | sea | plain | rooftop | interior
    timeOfDay: TimeOfDay[]   // dawn | day | golden | dusk | night
    mood: Mood[]             // serene | festive | grand | intimate | mystic | dramatic | nostalgic
    intensity: 1..5          // visual busyness — used to stop the scene overcrowding
    tags: string[]           // free vocabulary: 'rain','water','gold','minimal','terracotta'…
  }
  affinity?: { boost?: string[]; avoid?: string[] }  // optional soft overrides
}
```

## 4. Compatibility engine (§15) — tag affinity, not lookup tables

An N×N table across 9 categories is unmaintainable and violates §59 (must grow painlessly).
Instead each asset only declares **what it is**. `scoreAsset()` measures overlap against the
scene chosen so far:

```
score = 0.34·terrain + 0.26·timeOfDay + 0.22·mood + 0.18·tags
        + boost/avoid adjustments
        − intensity penalty when the scene is already busy
```

Adding an asset = tagging it. No existing file changes.

Labels: `≥.78 PERFECT MATCH` · `≥.55 WORKS BEAUTIFULLY` · `≥.32 INTERESTING` · else `UNEXPECTED`.
Options are **ranked, never hidden** — the brief explicitly wants creative combinations possible.

**Surprise Me** (§16) = weighted sampling over the same scores (not uniform random), so results are
beautiful but not identical every time. *Change one thing* re-samples a single category.

## 5. Scene composition

Fixed 1000×1500 viewBox (9:16 — the share format is the native format, so the export is never a re-crop).

Paint order: `sky → world → pandal → durga → flowers → decor → ambience → lighting wash → grain`

`lighting` is a full-bleed tinted overlay + vignette rather than a discrete object, which is what makes it
change the *whole* scene (§9).

## 6. Voting & anti-cheat (§22, §46)

- Anonymous HMAC-signed `pw_v` cookie (httpOnly, 1y) — identity without a login wall
- One vote per (voter, world); server-side validated, idempotent
- Token bucket per voter and per IP-hash; cooldown between votes
- `trending = votes_recent / (age_hours + 2)^1.5` — time-decayed so new work can surface (§24)

## 7. Performance (§37)

No image requests for artwork at all — the scene is inline SVG. Option cards render **miniature** versions
of the same draw function at a small viewBox, so previews cost nothing extra. Catalogue modules are
plain data, tree-shakeable. Fonts self-hosted via `next/font`. Gallery cards are static SVG snapshots.

## 8. Growth surface (§48, §49)

`/w/[id]` is server-rendered with per-world title/description and a generated OG image (`next/og`),
so a WhatsApp or Instagram link unfurls with the artwork. Share card is 9:16 with minimal branding.
