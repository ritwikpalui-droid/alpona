# Puja World 2026

> Don't just visit a Puja. Build your own.

A mobile-first, hand-drawn-watercolour interactive experience for Durga Puja 2026. Choose a world, a pandal and a Durga, and watch a coherent watercolour scene compose itself layer by layer — then publish it, share it, and climb the leaderboard.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design: the compatibility engine, the procedural-watercolour rendering approach, data model, and how to add new assets.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The creation studio is at `/create`, the gallery at `/gallery`, the leaderboard at `/leaderboard`.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
npx tsc --noEmit  # typecheck
```

## What's implemented

- **Creation studio** (`/create`) — 9 categories (world, pandal, Durga, lighting, flowers, decor, sky, ambience, sound), each with a compatibility-ranked option rail, Surprise Me, Change-one-thing, back/undo, and local-storage draft resume.
- **Procedural watercolour rendering** — every asset is inline SVG built from shared primitives (`src/lib/art/primitives.tsx`), not pre-rendered images, so the whole scene composes client-side at zero marginal cost per combination.
- **Synthesised soundscapes** (`src/lib/audio.ts`) — WebAudio, no audio files, previewable before selecting, muteable, never autoplaying.
- **Final reveal, title generation, export** — 9:16 / 1:1 / 16:9 share cards rendered client-side to PNG via canvas; native share sheet where available.
- **Publish → Gallery → Leaderboard → Vote** — anonymous nickname-only publishing, signed anonymous voter cookie, idempotent voting, token-bucket rate limiting, Overall/Trending/Most Loved boards, "Can you beat this?" challenge on #1.
- **Public share pages** (`/w/[id]`) — server-rendered, SEO metadata, dynamic OG image.
- **Seasonal framing** — countdown and phase copy driven by `NEXT_PUBLIC_PUJA_*` env vars (see `src/lib/festival.ts`), not hard-coded dates.

## Data / storage

The in-memory store (`src/lib/store/memory.ts`) is the ₹0 MVP adapter — correct, fast, and process-local. It resets on redeploy and won't share state across multiple server instances (e.g. serverless functions). **Before real traffic**, swap in a real `Store` implementation (Postgres/D1/KV) behind the same interface in `src/lib/store/types.ts` — no other code needs to change.

One non-obvious detail if you touch this file: Next's App Router compiles Server Components and Route Handlers as separate module "layers", so a plain module-level singleton isn't actually shared between them (confirmed under `next start`, not just dev). The current fix keeps state on `globalThis` under a fixed `Symbol.for(...)` key. A real database sidesteps this entirely.

## Next steps (asset library)

The visual system currently uses placeholder-quality procedural art — coherent and on-brand, but not hand-painted. Per the brief's own recommendation, the intended path is to replace `Asset.art` entries one category at a time with real painted artwork (`{ kind: 'image', src, w, h }` is already a supported variant of the same type) without touching the compatibility engine, scene compositor, or any UI.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL, used in metadata/sitemap/OG tags |
| `NEXT_PUBLIC_PUJA_OPENS` / `_FINAL_DAYS` / `_CLOSES` | Festival countdown dates (ISO 8601) |
| `PUJA_SECRET` | HMAC secret signing the anonymous voter cookie — set a real value in production |
