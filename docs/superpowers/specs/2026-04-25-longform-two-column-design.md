# Longform Two-Column Article Layout — Design Spec

**Date:** 2026-04-25
**Status:** Approved

## Overview

Combine the two quantum computing posts into one longform article and render it in a broadsheet-style two-column layout. The layout is opt-in via a frontmatter flag and does not affect other posts.

---

## Section 1: Content Merge

### Action
- **Delete** `src/content/posts/bits-amplitudes-bra-ket.mdx`
- **Delete** `src/content/posts/bloch-sphere.mdx`
- **Create** `src/content/posts/bits-amplitudes-bloch-sphere.mdx`

### Frontmatter
```yaml
---
title: "Bits, Amplitudes, and the Bloch Sphere"
description: "A qubit is not 'both 0 and 1 at once.' It is a precise mathematical object — and its geometry fits on the surface of a sphere."
topic: quantum-computing
layout: longform
series:
  slug: quantum-first-principles
  name: Quantum Computing from First Principles
  part: 1
tags: [quantum, bra-ket, bloch-sphere, linear-algebra, superposition, phase]
publishedAt: 2026-04-25
published: true
---
```

### Content structure (in order)
1. Import: `import BlochSphere from '../../components/BlochSphere.astro';`
2. Opening two paragraphs (plain prose, no wrapper — sits above the columns)
3. `<div class="prose-2col">` — Amplitudes · Bra-Ket Notation · What a Qubit Is · Degrees of Freedom · The Parametrization
4. `<div class="sphere-section">` — "Reading the Sphere" prose left, `<BlochSphere />` right
5. `<div class="prose-2col">` — Measurement as Projection · Phase Is Invisible

The merged prose is the full text of both posts with no content removed. The `<BlochSphere />` component that was at the end of Post 2 moves into the right column of the sphere-section.

---

## Section 2: CSS — `src/styles/global.css`

### `.article-wrap--wide`
Applied to the article wrapper when `layout === 'longform'`. Wider than the standard article column to accommodate two columns of text.

```css
.article-wrap--wide {
  max-width: clamp(900px, 78vw, 1100px);
}
```

### `.prose-2col`
Two-column CSS multicolumn layout for prose sections. Body text stays Geist (matching existing `.prose`), section headings stay Newsreader (matching existing `.prose h2`). KaTeX display blocks remain inside their column — no `column-span`.

```css
.prose-2col {
  columns: 2;
  column-gap: 40px;
  column-rule: 0.5px solid var(--color-border);
  margin-bottom: 0;
}

.prose-2col p {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 300;
  line-height: 1.72;
  color: var(--color-ink-2);
  margin-bottom: 16px;
}

.prose-2col h2 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 20px;
  color: var(--color-ink);
  letter-spacing: -0.3px;
  margin-top: 28px;
  margin-bottom: 10px;
  line-height: 1.2;
  break-before: avoid;
}

.prose-2col h2:first-child { margin-top: 0; }

.prose-2col strong {
  font-weight: 500;
  color: var(--color-ink);
}

.prose-2col .katex-display {
  margin: 10px 0 16px !important;
  padding: 12px 10px;
  background: var(--color-surface);
  border-radius: 6px;
  overflow-x: auto;
  break-inside: avoid;
}

.prose-2col ul,
.prose-2col ol {
  padding-left: 18px;
  margin-bottom: 16px;
}

.prose-2col li { margin-bottom: 6px; }
```

### `.sphere-section`
CSS grid. Left cell: "Reading the Sphere" prose. Right cell: sticky `<BlochSphere />` widget. A thin rule separates it visually from the two-col sections above and below.

```css
.sphere-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 40px;
  border-top: 0.5px solid var(--color-border);
  border-bottom: 0.5px solid var(--color-border);
  padding: 28px 0;
  margin: 28px 0;
}

.sphere-section-prose {
  border-right: 0.5px solid var(--color-border);
  padding-right: 40px;
}

.sphere-section-prose p {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 300;
  line-height: 1.72;
  color: var(--color-ink-2);
  margin-bottom: 16px;
}

.sphere-section-prose h2 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 20px;
  color: var(--color-ink);
  letter-spacing: -0.3px;
  margin-top: 0;
  margin-bottom: 10px;
  line-height: 1.2;
}

.sphere-section-prose strong { font-weight: 500; color: var(--color-ink); }

.sphere-section-prose ul {
  padding-left: 18px;
  margin-bottom: 16px;
}
.sphere-section-prose li { margin-bottom: 6px; }

.sphere-section-widget {
  position: relative;
}

.sphere-section-widget .bloch-sphere {
  position: sticky;
  top: 24px;
}
```

### Mobile (≤ 720px)
Both `.prose-2col` and `.sphere-section` collapse to single column. The Bloch sphere loses its sticky positioning and stacks below the prose.

```css
@media (max-width: 720px) {
  .prose-2col { columns: 1; }

  .sphere-section {
    grid-template-columns: 1fr;
  }

  .sphere-section-prose {
    border-right: none;
    padding-right: 0;
    border-bottom: 0.5px solid var(--color-border);
    padding-bottom: 24px;
    margin-bottom: 24px;
  }

  .sphere-section-widget .bloch-sphere {
    position: static;
  }
}
```

---

## Section 3: `src/pages/blog/[slug].astro`

Add `layout` to the content schema check and apply the wide class conditionally:

```astro
<div class={`article-wrap${post.data.layout === 'longform' ? ' article-wrap--wide' : ''}`}>
```

---

## Section 4: Content Schema — `src/content.config.ts`

Add `layout` as an optional field to the posts schema:

```ts
layout: z.enum(['longform']).optional(),
```

---

## File Map

| Action | Path |
|--------|------|
| Delete | `src/content/posts/bits-amplitudes-bra-ket.mdx` |
| Delete | `src/content/posts/bloch-sphere.mdx` |
| Create | `src/content/posts/bits-amplitudes-bloch-sphere.mdx` |
| Modify | `src/styles/global.css` |
| Modify | `src/pages/blog/[slug].astro` |
| Modify | `src/content.config.ts` |

---

## Success Criteria

- Old post URLs (`/blog/bits-amplitudes-bra-ket/`, `/blog/bloch-sphere/`) no longer exist
- New post at `/blog/bits-amplitudes-bloch-sphere/` renders correctly
- Body prose renders in two columns at desktop width
- KaTeX equations render inside their column, not spanning
- "Reading the Sphere" section: prose left, Bloch sphere widget right and sticky
- `<BlochSphere />` is interactive: orbit, θ/φ sliders, live probabilities
- All other posts unaffected (no two-column layout on them)
- Mobile: single-column, Bloch sphere stacks below prose
- Build passes with no errors
