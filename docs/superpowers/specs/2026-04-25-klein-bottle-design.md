# Klein Bottle — Home Page Design Spec

**Date:** 2026-04-25  
**Status:** Approved for implementation

---

## Overview

Add an animated Three.js Klein bottle to the home page. It floats in the right column alongside the existing `.home-wrap` intro text, rendered on a transparent canvas so it blends seamlessly into the site's white background. Below the animation: the Leo Moser limerick and a Wikipedia link, typeset in the site's existing editorial style.

---

## Layout

The home page `<main class="feed">` currently contains only `.home-wrap`. We wrap both the existing text column and the new Klein aside in a new flex row:

```html
<main class="feed">
  <div class="home-layout">
    <div class="home-wrap">…existing content…</div>
    <KleinBottle />   <!-- renders .klein-aside -->
  </div>
</main>
```

**`.home-layout`**
- `display: flex; align-items: flex-start; gap: 0; width: 100%;`

**`.home-wrap`** — unchanged: `max-width: clamp(540px, 44vw, 700px); flex-shrink: 0;`

**`.klein-aside`**
- `flex: 1; min-width: 0;`
- `display: flex; flex-direction: column; align-items: center;`
- `padding: 0 32px;`
- Hidden at `≤ 1100px` via `display: none` (the text column still reads cleanly as a single column on narrower viewports)

---

## Component

**File:** `src/components/KleinBottle.astro`

Plain Astro component (no framework island needed — Three.js runs in a regular `<script>` tag processed by Vite).

Structure:
```
<div class="klein-aside">
  <canvas id="klein-canvas"></canvas>
  <figure class="klein-verse">
    <pre class="klein-poem">…limerick…</pre>
    <figcaption class="klein-attr">— Leo Moser</figcaption>
    <a href="https://en.wikipedia.org/wiki/Klein_bottle" …>Klein bottle ↗</a>
  </figure>
</div>
```

**Dependency:** `npm install three` (Three.js as a proper npm package, not CDN importmap).

---

## Three.js Rendering

Based on approved prototype v9 (figure-8 parametric immersion, glass + concentric liquid geometry), with the following adjustments for a transparent white-background canvas:

| Setting | Prototype v9 | Home page |
|---|---|---|
| `WebGLRenderer` | `{ antialias: true }` | `{ antialias: true, alpha: true }` |
| `setClearColor` | (not set) | `(0x000000, 0)` — fully transparent |
| `scene.background` | `0x1a1a2e` | `null` (transparent) |
| `glassMat.transmission` | `0.97` | `0.88` — more glass body on white |
| `glassMat.color` | `0xffffff` | `0xe8f0ff` — faint cool tint for visibility |
| `glassMat.envMapIntensity` | `2.0` | `2.5` |
| `glassMat.reflectivity` | `0.55` | `0.65` |

All other geometry, liquid material, lighting, and rotation settings remain identical to v9.

**Canvas sizing:**
- Width: `100%` of `.klein-aside`
- Height: `min(65vh, 480px)`
- Camera aspect and renderer size update on `resize`

**Animation loop:** Start/stop via `IntersectionObserver` — pause `requestAnimationFrame` when canvas is not in viewport. Prevents background GPU drain on scroll.

---

## Limerick & Link

**Typography:** `font-family: var(--font-display)` (Newsreader) — same as `home-intro` prose, which makes the poem read as editorial content rather than a caption box.

```css
.klein-poem {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 300;
  font-style: italic;
  color: var(--color-ink-3);
  line-height: 1.8;
  white-space: pre;        /* preserves indentation on lines 3–4 */
  margin: 0;
  background: none;
  border: none;
  padding: 0;
}

.klein-attr {
  font-size: 11.5px;
  font-weight: 300;
  color: var(--color-ink-5);
  margin-top: 6px;
  font-family: var(--font-display);
  font-style: normal;
}

.klein-verse a {
  display: block;
  margin-top: 10px;
  font-size: 11px;
  font-weight: 300;
  color: var(--color-ink-5);
  text-decoration: underline;
  text-decoration-color: var(--color-ink-6);
  text-underline-offset: 3px;
  transition: color 0.15s, text-decoration-color 0.15s;
}

.klein-verse a:hover {
  color: var(--color-ink-2);
  text-decoration-color: var(--color-ink-3);
}
```

**Poem text** (verbatim, preserving the two leading spaces on lines 3–4):

```
A mathematician named Klein
Thought the Möbius band was divine.
     Said he: "If you glue
     The edges of two,
You'll get a weird bottle like mine."
```

Lines 3–4 are indented five spaces — `white-space: pre` on the `<pre>` preserves this exactly.

**Link:** `Klein bottle ↗` → `https://en.wikipedia.org/wiki/Klein_bottle`, `target="_blank" rel="noopener noreferrer"`

---

## CSS Changes

Add to `src/styles/global.css`:

```css
/* ── Home / Klein aside ── */

.home-layout {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.klein-aside {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 32px 0;   /* 8px top matches .home-wrap padding-top */
}

#klein-canvas {
  width: 100%;
  height: min(65vh, 480px);
  display: block;
}

.klein-verse {
  margin: 0;
  text-align: left;
  max-width: 280px;
}

/* hide Klein aside on narrow viewports */
@media (max-width: 1100px) {
  .klein-aside { display: none; }
}
```

---

## Mobile

At `≤ 1100px`, `.klein-aside` is hidden entirely. The `.home-layout` flex container collapses to just `.home-wrap`, which maintains its existing single-column layout unchanged. No mobile-specific Klein rendering is needed.

---

## Performance

- `three` npm package (~500KB gzipped ~150KB) — acceptable for a portfolio site
- `IntersectionObserver` pauses the animation loop when canvas is off-screen
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` — caps at 2× for retina without burning 3× on high-DPI screens
- No shadows, no post-processing — rendering is a single pass
