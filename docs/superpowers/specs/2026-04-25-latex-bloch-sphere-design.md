# LaTeX Math + Bloch Sphere Visualization — Design Spec

**Date:** 2026-04-25
**Status:** Approved

## Overview

Add two capabilities to the Astro blog:

1. **LaTeX math rendering** — build-time KaTeX processing of `$...$` (inline) and `$$...$$` (block) expressions in all MDX posts.
2. **Interactive 3D Bloch sphere** — a reusable `BlochSphere.astro` component powered by Three.js, with full projection visualization and live probability readout, embedded in the Bloch sphere post.

Both existing posts (`bits-amplitudes-bra-ket.mdx`, `bloch-sphere.mdx`) are updated to use proper LaTeX math. Post 2 gets the component embedded.

---

## Section 1: LaTeX Pipeline

### Packages

| Package | Role |
|---------|------|
| `remark-math` | Parses `$...$` and `$$...$$` in MDX source |
| `rehype-katex` | Renders parsed math nodes to KaTeX HTML at build time |
| `katex` | KaTeX engine; also provides the required CSS |

Math is rendered entirely at **build time** — zero client-side JavaScript for math display.

### `astro.config.mjs` change

```js
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://vatsal-bakshi.github.io',
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  vite: { plugins: [tailwindcss()] },
  integrations: [mdx()],
});
```

### CSS

Import KaTeX's stylesheet once in `src/layouts/BaseLayout.astro`:

```astro
---
import 'katex/dist/katex.min.css';
---
```

Vite bundles it. No CDN, no runtime fetch.

### MDX syntax

Inline math: `$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$`

Display math:
```
$$
|\psi\rangle = \cos\!\tfrac{\theta}{2}|0\rangle + e^{i\varphi}\sin\!\tfrac{\theta}{2}|1\rangle
$$
```

---

## Section 2: BlochSphere Component

### File

`src/components/BlochSphere.astro`

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theta` | `number` | `0` | Initial polar angle θ ∈ [0, π]. Default = north pole = \|0⟩. |
| `phi` | `number` | `0` | Initial azimuthal angle φ ∈ [0, 2π). |

Props are passed to the component as `data-theta` and `data-phi` HTML attributes on the container `<div>`. The bundled `<script>` reads them at runtime to set initial state.

### Dependencies

Install `three` as a project dependency. Three.js (including `OrbitControls` and `CSS2DRenderer`) is imported in the component `<script>` block and bundled by Vite.

```bash
npm install three @types/three
```

### HTML structure

```
<div class="bloch-sphere" data-theta={theta} data-phi={phi}>
  <div class="bloch-scene">          <!-- Three.js canvas + CSS2D labels injected here -->
  </div>
  <div class="bloch-controls">
    <div class="bloch-state-eq">     <!-- |ψ⟩ = ... equation, updated live -->
    <div class="bloch-probs">        <!-- P(|0⟩) and P(|1⟩) cells with progress bars -->
    <div class="bloch-sliders">      <!-- θ slider (amber) + φ slider (sky blue) -->
    <p class="bloch-hint">           <!-- "drag to orbit · sliders to move state" -->
  </div>
</div>
```

### Three.js scene contents

| Element | Description |
|---------|-------------|
| Wireframe sphere | `EdgesGeometry` on `SphereGeometry(1, 28, 18)`, subtle gray |
| Equator ring | 128-point circle at y=0, slightly more opaque than sphere edges |
| Z axis | Vertical line through poles, dashed style via opacity |
| X axis | Horizontal line, faint reference |
| State vector | `ArrowHelper` from origin to surface point, `#1c1c1e` (site ink color) |
| Tip dot | Small sphere at vector tip, `#1c1c1e` |
| Z-projection line | Dashed amber line from tip → (0, cosθ, 0) on z-axis |
| Z-projection dot | Amber dot at (0, cosθ, 0) |
| Z-segment | Solid amber line from origin to z-projection — shows the cos(θ) magnitude |
| Equatorial projection | Dashed sky-blue line from origin → (sinθ cosφ, 0, sinθ sinφ) |
| Drop line | Faint dashed sky-blue vertical from equatorial point up to tip |
| Labels | CSS2DObjects at all six cardinal states: \|0⟩ \|1⟩ \|+⟩ \|−⟩ \|+i⟩ \|−i⟩ |

Coordinate mapping: y-up in Three.js corresponds to the Bloch sphere z-axis. North pole = (0, 1, 0) = |0⟩. South pole = (0, −1, 0) = |1⟩.

State vector position: `(sin θ cos φ, cos θ, sin θ sin φ)`.

### Controls panel

- **State equation** (Georgia serif, `#6e6e73`): displays `|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)·sin(θ/2)|1⟩` with live numeric values
- **Probability cells**: two cells side by side, each showing label, value (3 decimal places), and a thin progress bar
  - P(|0⟩) = cos²(θ/2): amber `#d97706`
  - P(|1⟩) = sin²(θ/2): sky blue `#0ea5e9`
- **θ slider**: range 0–180°, amber thumb
- **φ slider**: range 0–360°, sky-blue thumb
- **Hint text**: "drag to orbit · sliders to move state", `#aeaeb2`

### Multi-instance support

The `<script>` block queries all `.bloch-sphere:not([data-initialized])` elements on `DOMContentLoaded`, initializes each independently, and marks them `data-initialized="true"`. Multiple `<BlochSphere />` components on the same page work correctly.

### OrbitControls settings

- `enableDamping: true`, `dampingFactor: 0.07`
- `enablePan: false`
- `minDistance: 2.2`, `maxDistance: 7`

### Styling

Uses the site's existing CSS custom properties:
- `--color-surface` (#f7f7f9) for the canvas background
- `--color-panel` (#ffffff) for the controls panel background
- `--color-border` for the panel border
- `--color-ink` (#1c1c1e) for the state vector
- `--font-display` (Newsreader/Georgia) for the state equation
- `--font-sans` (Geist) for all UI text

Component-scoped styles in `<style>` block using `.bloch-*` class names to avoid collision.

### MDX usage

```mdx
import BlochSphere from '../../components/BlochSphere.astro';

<BlochSphere />
<BlochSphere theta={Math.PI / 2} phi={0} />
```

---

## Section 3: Post Updates

### Post 1 — `bits-amplitudes-bra-ket.mdx`

Rewrite all math expressions from Unicode prose to KaTeX LaTeX. In MDX, `|` is a valid math character — do not escape it as `\|` (which KaTeX renders as `‖`). Examples:

```latex
$|\alpha|^2 + |\beta|^2 = 1$

$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$

$\langle\psi|\psi\rangle = 1$

$|\psi\rangle = [\alpha,\,\beta]^\top$
```

Display equation for the normalization constraint:
```latex
$$
|\alpha|^2 + |\beta|^2 = 1
$$
```

No component added to Post 1.

### Post 2 — `bloch-sphere.mdx`

Same LaTeX rewrite. Additionally:
- Add `import BlochSphere from '../../components/BlochSphere.astro'` immediately after the closing `---` of the MDX frontmatter
- Embed `<BlochSphere />` immediately after the "Reading the Sphere" section
- The component defaults to θ=0 (|0⟩ at north pole); reader explores from there

Key display equation in Post 2 becomes:
```latex
$$
|\psi\rangle = \cos\!\tfrac{\theta}{2}|0\rangle + e^{i\varphi}\sin\!\tfrac{\theta}{2}|1\rangle
$$
```

---

## File Map

| Action | Path |
|--------|------|
| Modify | `astro.config.mjs` |
| Modify | `src/layouts/BaseLayout.astro` |
| Create | `src/components/BlochSphere.astro` |
| Modify | `src/content/posts/bits-amplitudes-bra-ket.mdx` |
| Modify | `src/content/posts/bloch-sphere.mdx` |

---

## Success Criteria

- `$...$` and `$$...$$` math renders correctly in both posts with no visible LaTeX source
- `<BlochSphere />` renders a 3D sphere in Post 2, orbit-draggable, with θ/φ sliders that update state vector, projection lines, and probabilities live
- P(|0⟩) + P(|1⟩) always equals 1.000
- All six cardinal state labels are visible and positioned correctly
- Build passes with no errors
- No client-side JS for math (KaTeX is build-time only)
