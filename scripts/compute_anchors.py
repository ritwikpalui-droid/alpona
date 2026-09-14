"""
Computes placement metadata for every existing cutout/world asset directly
from its own pixel data — no new art, no hand-annotation needed for these
fields. Emits src/lib/art/anchors.generated.ts.

Why this exists: `contain()` centres a FILE inside a fixed box. Two idols
with different amounts of transparent padding around the same-sized figure
end up at different heights on the ground, because contain() only knows
about the file's own W/H, not where the PAINTED content actually is. Same
problem for pandals: a "solid slab" pandal and a "thin frame" pandal get
identically sized boxes, so one blots out the whole world and the other
doesn't. This script measures, per asset:

  content   — the real painted-content bounding box (alpha > threshold),
              normalised 0-1 in the file's own pixel space. Placement uses
              THIS, not the file's full W/H.
  foot      — where the object actually touches the ground: the horizontal
              centre and width of the widest opaque run in the bottom
              slice of the content bbox, normalised to `content`.
  tone      — mean brightness (L, 0-255) and mean saturation (s, 0-1) over
              opaque pixels only. Drives per-layer tonal reconciliation
              (an object painted much darker/more saturated than the world
              it's dropped onto needs a proportional lift, not a flat wash).
  coverage  — opaque-pixel fraction of the content bbox. High coverage
              (e.g. 0.86 for a solid temple facade) is the single strongest
              predictor of "this blots out the whole scene."

For world plates (full-bleed backgrounds, no alpha), only `tone` is
computed — `plot`/`horizonY`/`camera` need a human glance at each image
and are left as TODO placeholders in the generated file for hand-filling.
"""
import glob
import json
import os
from collections import deque

import numpy as np
from PIL import Image

ALPHA_THRESH = 16


def content_bbox(alpha, thresh=ALPHA_THRESH):
    mask = alpha > thresh
    ys, xs = np.where(mask)
    if len(ys) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def foot_anchor(alpha, bbox, thresh=ALPHA_THRESH):
    x0, y0, x1, y1 = bbox
    h = y1 - y0
    w = x1 - x0
    # Widest opaque run within the bottom 6% of the content height.
    band_top = y1 - max(3, int(h * 0.06))
    band = alpha[band_top:y1, x0:x1] > thresh
    if not band.any():
        band = alpha[y0:y1, x0:x1] > thresh  # fallback: whole content
    col_any = band.any(axis=0)
    idx = np.where(col_any)[0]
    if len(idx) == 0:
        return 0.5, 1.0
    # Widest contiguous run, not just min/max (handles a stray far pixel).
    runs = []
    start = idx[0]
    prev = idx[0]
    for i in idx[1:]:
        if i != prev + 1:
            runs.append((start, prev))
            start = i
        prev = i
    runs.append((start, prev))
    run = max(runs, key=lambda r: r[1] - r[0])
    run_w = (run[1] - run[0] + 1) / w
    # A narrow/degenerate run (a single toe, a cape corner, one claw) is not
    # a trustworthy "where does this stand" signal on its own — an
    # asymmetric silhouette (a lunging pose, a cape trailing to one side)
    # can make the widest contiguous run a thin sliver far from the
    # figure's actual visual centre. When that happens, fall back to the
    # centroid of ALL opaque pixels in the band (robust to asymmetry) with
    # a wider, more conservative footprint estimate.
    if run_w < 0.16:
        xs_all = np.where(col_any)[0]
        cx = float(xs_all.mean()) / w
        rw = max(run_w, 0.16)
        return round(cx, 4), round(rw, 4)
    cx = (run[0] + run[1]) / 2 / w
    return round(float(cx), 4), round(float(run_w), 4)


def tone_of(rgb, alpha, bbox, thresh=ALPHA_THRESH):
    x0, y0, x1, y1 = bbox
    mask = alpha[y0:y1, x0:x1] > thresh
    region = rgb[y0:y1, x0:x1][mask].astype(np.float32)
    if len(region) == 0:
        return 128.0, 0.0
    L = float(region.mean())
    mx = region.max(axis=1)
    mn = region.min(axis=1)
    sat = float(((mx - mn) / np.clip(mx, 1, 255)).mean())
    return round(L, 1), round(sat, 3)


def coverage_of(alpha, bbox, thresh=ALPHA_THRESH):
    x0, y0, x1, y1 = bbox
    region = alpha[y0:y1, x0:x1]
    return round(float((region > thresh).mean()), 3)


def process_cutout(path):
    img = Image.open(path)
    if img.mode != 'RGBA':
        return None
    arr = np.array(img)
    rgb, alpha = arr[:, :, :3], arr[:, :, 3]
    h, w = alpha.shape
    bbox = content_bbox(alpha)
    if bbox is None:
        return None
    x0, y0, x1, y1 = bbox
    cx, cw = foot_anchor(alpha, bbox)
    L, s = tone_of(rgb, alpha, bbox)
    cov = coverage_of(alpha, bbox)
    return {
        'content': {'x': round(x0 / w, 4), 'y': round(y0 / h, 4),
                     'w': round((x1 - x0) / w, 4), 'h': round((y1 - y0) / h, 4)},
        'foot': {'cx': cx, 'w': cw},
        'tone': {'L': L, 's': s},
        'coverage': cov,
        'naturalW': w, 'naturalH': h,
    }


def process_world(path):
    img = Image.open(path).convert('RGB')
    arr = np.array(img).astype(np.float32)
    L = float(arr.mean())
    mx = arr.max(axis=2)
    mn = arr.min(axis=2)
    sat = float(((mx - mn) / np.clip(mx, 1, 255)).mean())
    w, h = img.size
    return {'tone': {'L': round(L, 1), 's': round(sat, 3)}, 'naturalW': w, 'naturalH': h}


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = {'durga': {}, 'pandal': {}, 'world': {}}

    for cat in ('durga', 'pandal'):
        for path in sorted(glob.glob(os.path.join(root, 'public', 'art', cat, '*.webp'))):
            asset_id = os.path.splitext(os.path.basename(path))[0]
            result = process_cutout(path)
            if result:
                out[cat][asset_id] = result
                print(f"{cat}/{asset_id}: coverage={result['coverage']:.2f} "
                      f"tone L={result['tone']['L']:.0f} s={result['tone']['s']:.2f} "
                      f"foot cx={result['foot']['cx']:.2f} w={result['foot']['w']:.2f}")

    for path in sorted(glob.glob(os.path.join(root, 'public', 'art', 'world', '*.webp'))):
        asset_id = os.path.splitext(os.path.basename(path))[0]
        out['world'][asset_id] = process_world(path)
        print(f"world/{asset_id}: tone L={out['world'][asset_id]['tone']['L']:.0f} "
              f"s={out['world'][asset_id]['tone']['s']:.2f}")

    ts_path = os.path.join(root, 'src', 'lib', 'art', 'anchors.generated.ts')
    with open(ts_path, 'w') as f:
        f.write("// AUTO-GENERATED by scripts/compute_anchors.py — do not hand-edit.\n")
        f.write("// Measured directly from each asset's own pixel data: real painted-content\n")
        f.write("// bounding box, ground-contact footprint, mean tone, and opaque coverage.\n")
        f.write("// `contain()`-in-a-fixed-box only knows a file's full W/H, which is why\n")
        f.write("// idols float (padding varies per file) and some pandals swallow the whole\n")
        f.write("// scene (coverage varies per file). This is what placement should use instead.\n\n")
        f.write("export interface AutoAnchors {\n")
        f.write("  content: { x: number; y: number; w: number; h: number }\n")
        f.write("  foot: { cx: number; w: number }\n")
        f.write("  tone: { L: number; s: number }\n")
        f.write("  coverage: number\n")
        f.write("  naturalW: number\n  naturalH: number\n")
        f.write("}\n\n")
        f.write("export interface WorldTone {\n  tone: { L: number; s: number }\n  naturalW: number\n  naturalH: number\n}\n\n")
        f.write(f"export const DURGA_ANCHORS: Record<string, AutoAnchors> = {json.dumps(out['durga'], indent=2)}\n\n")
        f.write(f"export const PANDAL_ANCHORS: Record<string, AutoAnchors> = {json.dumps(out['pandal'], indent=2)}\n\n")
        f.write(f"export const WORLD_TONE: Record<string, WorldTone> = {json.dumps(out['world'], indent=2)}\n")
    print(f"\nwrote {ts_path}")


if __name__ == '__main__':
    main()
