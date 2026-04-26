# Design: Golf Ball Flight Laws — Blog Post

**Date:** 2026-04-26
**Status:** Approved

## Overview

A standalone longform blog post explaining the D-Plane theory of golf ball flight, anchored by Tiger's 9 window drill as a narrative hook. The post includes an embedded Three.js interactive visualization (`GolfFlightViz`) that lets readers cycle through all nine ball flight shapes.

## Content Structure

### 1. Hook — Tiger's 9 Window Drill
Open with the story of how Tiger practices deliberate shot-shaping: a 3×3 grid of nine distinct ball flights, one per "window," achieved by systematically varying club face and swing path. Establishes why understanding ball flight mechanics matters beyond theory.

### 2. The D-Plane
Explain the physics of ball flight in plain language:
- **Face angle** determines ~75% of the initial launch direction (ball starts toward where the face points, not where the club is swinging)
- **Face–path difference** determines curve: positive difference (face open relative to path) → fades/slices; negative (face closed to path) → draws/hooks
- Brief note on the old "ball starts on the path" myth and why TrackMan data killed it

### 3. The 9 Windows
A 3×3 grid where:
- **Rows** = face angle at impact: Closed / Square / Open
- **Columns** = swing path: In-to-Out / Straight / Out-to-In

Named shots in each cell:

|              | In→Out    | Straight   | Out→In    |
|--------------|-----------|------------|-----------|
| **Closed**   | Hook      | Pull Hook  | Pull      |
| **Square**   | Draw      | Straight   | Fade      |
| **Open**     | Push      | Push Slice | Slice     |

### 4. Interactive Visualization
`<GolfFlightViz />` component embedded inline. Readers can click or use arrow keys to explore each of the nine windows. See component spec below.

### 5. Appendix A — The Banana Slice and Pull Hook
Extreme face–path divergence cases. The banana slice: face wide open, path steep out-to-in → ball starts right, curves far further right. The pull hook: face closed, path steeply in-to-out → ball starts left, curves further left. Explains why beginners over-correct and make both worse.

### 6. Appendix B — Gear Effect
Off-center hits on a curved driver face cause additional sidespin via gear effect:
- Toe strike → extra draw spin (ball curves left)
- Heel strike → extra fade spin (ball curves right)
- Explains why low-handicap players often tee the ball slightly heel-side to counter their fade

## `GolfFlightViz` Component

**File:** `src/components/GolfFlightViz.astro`

### Scene
- Single `<canvas>` using Three.js r158 (already installed via npm)
- One `WebGLRenderer`, `NoToneMapping`, no sRGB encoding (direct hex colors)
- Camera: fixed at `(0, 0.42, 2.8)` looking at `(0, 0.18, −10)` — behind-ball perspective, never moves
- Scene: dark green ground (`#1c4a2a`), lighter fairway stripe, deep navy sky (`#1b3d6e`), tee marker, no flag poles

### Ball Animation
- Ball (`SphereGeometry r=0.1`, white Lambert material) animates along `currentCurve.getPoint(t)` each frame
- Ghost trail: `TubeGeometry` tube at 30% opacity; color matches arc type
- Loop: 2.4 s flight → 0.7 s pause → repeat; resets on window change

### GolfArc Curve
Custom `class GolfArc extends THREE.Curve` using Hermite interpolation:
- **X:** cubic Hermite with launch tangent derived from face angle, endpoint from `endX`
- **Z:** linear to `END_Z = −13.0`
- **Y:** `peakH × sin(t × π)` clamped to ≥ 0.09

### Arc Colors
| Shape | Color | Hex |
|-------|-------|-----|
| Draw / Hook | Blue | `#4f8ef7` |
| Fade / Slice | Orange | `#f47730` |
| Straight | Silver | `#d8dce4` |

### HUD Overlays (HTML over canvas)

**D-Plane inset** (bottom-left, 158×auto):
- SVG top-down diagram: face (green `#4ade80`) and path (amber `#fbbf24`) arrows from ball origin
- Angles scaled 2.5× visually so small real-world differences are readable
- Shaded D-plane sector between the two vectors
- Target line (dashed) with SVG flag at tip

**Club Face inset** (top-right, 158×auto):
- SVG top-down driver crown silhouette rotating at 3× face angle for visual clarity
- Face edge colored by state: blue (closed), orange (open), silver (square)
- Dashed square reference line; target line + flag above
- Arc indicator from square to current angle; state label below (`OPEN +14°` etc.)

**3×3 Minimap** (bottom-right):
- Nine clickable cells labeled with shot name
- Active cell highlighted
- Arrow keys (`←` / `→`) also cycle windows; number keys `1–9` jump directly

**Shot label** (top-center): shot name + face/path angle subtitle

### Nine Window Data

```
{ label:'Hook',       faceAngle:-14, pathAngle: 10, endX:-4.5, peakH:3.8 }
{ label:'Pull Hook',  faceAngle:-10, pathAngle:  0, endX:-2.8, peakH:4.0 }
{ label:'Pull',       faceAngle:-10, pathAngle:-10, endX:-1.8, peakH:4.0 }
{ label:'Draw',       faceAngle:  2, pathAngle: 10, endX:-0.8, peakH:4.5 }
{ label:'Straight',   faceAngle:  0, pathAngle:  0, endX: 0.0, peakH:4.5 }
{ label:'Fade',       faceAngle: -2, pathAngle:-10, endX: 1.0, peakH:4.5 }
{ label:'Push',       faceAngle: 10, pathAngle: 10, endX: 1.8, peakH:4.0 }
{ label:'Push Slice', faceAngle: 10, pathAngle:  0, endX: 2.8, peakH:3.8 }
{ label:'Slice',      faceAngle: 14, pathAngle:-10, endX: 4.5, peakH:3.5 }
```

## Files

| File | Action |
|------|--------|
| `src/content/posts/golf-ball-flight-laws.mdx` | Create — post content |
| `src/components/GolfFlightViz.astro` | Create — Three.js component |
| `src/content.config.ts` | Add `{ slug: 'golf', name: 'Golf', description: '' }` to `TOPICS` array |

## Frontmatter

```yaml
title: "The 9 Windows: Golf's Ball Flight Laws Explained"
description: "How face angle and swing path combine to produce every possible ball flight — and what Tiger's 9 window drill teaches us about controlling them."
topic: golf
tags: [golf, physics, ball-flight, d-plane]
publishedAt: 2026-04-26
published: false
postLayout: longform
```
