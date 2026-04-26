# Longform Two-Column Article Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace two existing quantum computing posts with one combined longform post rendered in a broadsheet-style two-column layout with the Bloch sphere widget sitting beside the qubit states section.

**Architecture:** A `layout: longform` frontmatter flag opts a post into a wider article wrapper and two CSS layout primitives — `.prose-2col` (CSS multicolumn) and `.sphere-section` (CSS grid). The MDX post uses raw `<div>` wrappers around content sections to activate each layout. All other posts are unaffected.

**Tech Stack:** Astro 6, MDX, KaTeX (already installed), Three.js BlochSphere component (already built), Tailwind v4 / vanilla CSS in `global.css`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/content.config.ts` | Add optional `layout` field to posts schema |
| Modify | `src/pages/blog/[slug].astro` | Apply `.article-wrap--wide` when `layout === 'longform'` |
| Modify | `src/styles/global.css` | Add `.article-wrap--wide`, `.prose-2col`, `.sphere-section` CSS |
| Delete | `src/content/posts/bits-amplitudes-bra-ket.mdx` | Replaced by combined post |
| Delete | `src/content/posts/bloch-sphere.mdx` | Replaced by combined post |
| Create | `src/content/posts/bits-amplitudes-bloch-sphere.mdx` | Combined post with new voice + layout structure |

---

## Task 1: Add `layout` field to schema and apply wide wrapper in page template

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/pages/blog/[slug].astro`

- [ ] **Step 1: Add `layout` to the posts schema in `src/content.config.ts`**

The current schema ends at `published: z.boolean().default(false)`. Add `layout` as an optional field after it:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const TOPICS = [
  {
    slug: 'quantum-crypto',
    name: 'Quantum Cryptography',
    description: '',
  },
  {
    slug: 'quantum-computing',
    name: 'Quantum Computing',
    description: '',
  },
] as const;

export type TopicSlug = (typeof TOPICS)[number]['slug'];

export const collections = {
  posts: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
    schema: z.object({
      title: z.string(),
      description: z.string(),
      topic: z.enum(TOPICS.map((t) => t.slug) as [TopicSlug, ...TopicSlug[]]),
      series: z
        .object({
          slug: z.string(),
          name: z.string(),
          part: z.number().int().positive(),
        })
        .optional(),
      tags: z.array(z.string()).default([]),
      publishedAt: z.coerce.date(),
      published: z.boolean().default(false),
      layout: z.enum(['longform']).optional(),
    }),
  }),
};
```

- [ ] **Step 2: Apply the wide class conditionally in `src/pages/blog/[slug].astro`**

The current template has `<div class="article-wrap">` on line 44. Change it to:

```astro
<div class={`article-wrap${post.data.layout === 'longform' ? ' article-wrap--wide' : ''}`}>
```

Full updated `[slug].astro` for reference:

```astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Sidebar from '../../components/Sidebar.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map((post: CollectionEntry<'posts'>) => ({
    params: { slug: post.id.replace(/\.(md|mdx)$/, '') },
    props: { post },
  }));
}

interface Props {
  post: CollectionEntry<'posts'>;
}

const { post } = Astro.props;
const { Content } = await render(post);

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function readTime(body: string | undefined) {
  if (!body) return '1 min read';
  const words = body.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}
---

<BaseLayout
  title={`${post.data.title} — Vatsal Bakshi`}
  description={post.data.description}
>
  <div class="layout">
    <Sidebar activeTopic={post.data.topic} />

    <main class="feed">
      <div class={`article-wrap${post.data.layout === 'longform' ? ' article-wrap--wide' : ''}`}>
        <a href="/blog" class="article-back">← Writing</a>

        <header class="article-header">
          {post.data.series && (
            <div class="article-series">
              {post.data.series.name} · Part {post.data.series.part}
            </div>
          )}
          <h1 class="article-title">{post.data.title}</h1>
          <div class="article-meta">
            <span>{formatDate(post.data.publishedAt)}</span>
            <span class="meta-dot"></span>
            <span>{readTime(post.body)}</span>
          </div>
        </header>

        <article class="prose">
          <Content />
        </article>
      </div>
    </main>
  </div>
</BaseLayout>
```

- [ ] **Step 3: Verify the build passes**

```bash
npm run build 2>&1
```

Expected: build completes with no TypeScript errors. All existing posts still render.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts src/pages/blog/[slug].astro
git commit -m "feat: add longform layout flag to post schema and article wrapper"
```

---

## Task 2: Add longform CSS classes to `global.css`

**Files:**
- Modify: `src/styles/global.css`

These rules must be added **after** the existing `.prose` block (currently ending around line 504) so that `.prose-2col` and `.sphere-section-prose` selectors win the cascade over the inherited `.prose` rules.

- [ ] **Step 1: Add `.article-wrap--wide`, `.prose-2col`, `.sphere-section` blocks**

Append the following to the end of `src/styles/global.css`, before the `@media (max-width: 720px)` block:

```css
/* ── Longform wide wrapper ── */

.article-wrap--wide {
  max-width: clamp(900px, 78vw, 1100px);
}

/* ── Two-column prose ── */

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

/* ── Sphere section (grid: prose left, widget right) ── */

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

- [ ] **Step 2: Add mobile overrides inside the existing `@media (max-width: 720px)` block**

Find the existing `@media (max-width: 720px)` block (currently ending around line 1232 with `}`) and add these rules inside it, just before the closing `}`:

```css
  /* Longform: collapse to single column */
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
```

- [ ] **Step 3: Verify the build passes**

```bash
npm run build 2>&1
```

Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add prose-2col and sphere-section CSS for longform layout"
```

---

## Task 3: Create the combined MDX post

**Files:**
- Delete: `src/content/posts/bits-amplitudes-bra-ket.mdx`
- Delete: `src/content/posts/bloch-sphere.mdx`
- Create: `src/content/posts/bits-amplitudes-bloch-sphere.mdx`

The new post follows the voice spec: intuition before notation, informal and direct, every term explained inline, dimmer switch metaphor for superposition, equations always preceded by a plain-English setup sentence.

- [ ] **Step 1: Delete the two old posts**

```bash
rm src/content/posts/bits-amplitudes-bra-ket.mdx
rm src/content/posts/bloch-sphere.mdx
```

- [ ] **Step 2: Create `src/content/posts/bits-amplitudes-bloch-sphere.mdx`**

Create the file with the following complete contents:

```mdx
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

import BlochSphere from '../../components/BlochSphere.astro';

Think about a light switch. It's either on or off — no in between. A classical bit works the same way: it's a 1 or a 0, and it knows which one it is at all times.

Now imagine a dimmer switch. Before you walk into the room, the dial is sitting at some position between fully off and fully on. When you flip the light on to check, it instantly snaps to either fully on or fully off — but *where the dial was sitting* determined how likely each outcome was. The closer to "on," the more likely you get light. The dial position is not uncertainty about what's there — it's a precise description of the system before you look.

A qubit works like that dimmer. Before you measure it, it's not secretly a 0 or secretly a 1. It's in a **superposition** — a specific, mathematically precise state that encodes how likely each outcome is. When you measure, the superposition snaps to either 0 or 1. The state *before* measurement was real and well-defined. Just not a classical value.

The numbers that describe "where the dial is set" are called **amplitudes**. They're the central concept of everything that follows.

<div class="prose-2col">

## Amplitudes aren't probabilities — they're stranger

You already know probabilities. A fair coin lands heads 50% of the time. Probabilities are real numbers between 0 and 1. They're never negative.

Amplitudes are stranger. They're **complex numbers** — numbers that live in the complex plane, with both a real and an imaginary part. An amplitude is not a probability. It becomes one when you square its magnitude.

Concretely: if a qubit has amplitude $\alpha$ for the outcome 0 and amplitude $\beta$ for the outcome 1, the probabilities are $|\alpha|^2$ and $|\beta|^2$. Since probabilities must add to 1, the amplitudes must satisfy:

$$|\alpha|^2 + |\beta|^2 = 1$$

That's the only constraint. As long as this holds, $\alpha$ and $\beta$ can be any complex numbers whatsoever.

Why complex? Because the imaginary part encodes something called **phase** — a quantity that's invisible at measurement but becomes crucial when qubits interact. We'll come back to phase. For now: complex amplitudes aren't arbitrary complexity for its own sake. They're the minimum structure that makes quantum mechanics work.

## A shorthand worth learning — bra-ket notation

Writing "the state with amplitude $\alpha$ for 0 and amplitude $\beta$ for 1" every time is exhausting. Physicists use a compact notation invented by Paul Dirac, called **bra-ket notation** — named after the word "bracket."

The two most definite qubit states — the analogs of classical 0 and 1 — are written:

$$|0\rangle \quad \text{and} \quad |1\rangle$$

These are called **kets**. They're just vectors, written in a distinctive way. Measuring $|0\rangle$ always gives 0. Measuring $|1\rangle$ always gives 1. No probability involved.

A superposition — any state in between — is a **linear combination** of these two. The general qubit state is:

$$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$$

where $\alpha$ and $\beta$ are complex numbers with $|\alpha|^2 + |\beta|^2 = 1$. The symbol $\psi$ (psi) is just a conventional name for a quantum state. You'll see it everywhere.

Underneath the notation, this is an ordinary vector. Written as a column:

$$|\psi\rangle = [\alpha,\,\beta]^\top$$

with $|0\rangle = [1,\,0]^\top$ and $|1\rangle = [0,\,1]^\top$. The ket notation is just a more descriptive wrapper.

The other half: the **bra**, written $\langle\psi|$, is the conjugate transpose of the ket — $[\alpha^*,\,\beta^*]$. It lets you write inner products as $\langle\varphi|\psi\rangle$ — bra on the left, ket on the right, forming a "bracket." The normalization constraint in this form is:

$$\langle\psi|\psi\rangle = 1$$

## What a qubit is, precisely

A qubit is a unit vector in a two-dimensional complex vector space. Its two components are amplitudes. Measuring it collapses it to one of the two basis states, with probabilities equal to the squared magnitudes of the amplitudes.

The state before measurement is not vague — it's exactly $|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$. The uncertainty is in the *outcome* of measurement, not in the state itself. The dimmer is in a precise position before you flip the light on. You just can't know what it snaps to until you look.

Everything in quantum computing builds on this. Gates are transformations on these vectors. Entanglement is a property of multi-qubit vectors. Quantum algorithms steer the amplitudes so that the right answer comes out with high probability.

## How many knobs does a qubit have?

Before we can visualize a qubit's state, we need to count how many independent things can vary about it — the **degrees of freedom**.

Start with the full description: two complex numbers, $\alpha$ and $\beta$. That's four real numbers: $\text{Re}(\alpha)$, $\text{Im}(\alpha)$, $\text{Re}(\beta)$, $\text{Im}(\beta)$.

**Constraint 1 — normalization.** The rule $|\alpha|^2 + |\beta|^2 = 1$ fixes one of the four numbers given the others. Down to three.

**Constraint 2 — global phase.** If you multiply the entire state by any complex number of magnitude 1 — say $e^{i\theta}$ for some real angle $\theta$ — you get a state that is physically *indistinguishable* from the original. Every measurement gives the same result. The reason: probabilities depend on $|\text{amplitude}|^2$, and $|e^{i\theta}\alpha|^2 = |\alpha|^2$. The global factor cancels.

Since states that differ only by global phase are physically identical, we can always fix a convention to remove it. By convention, we require $\alpha$ to be real and non-negative. That removes another degree of freedom.

We're left with **two real degrees of freedom**. Two knobs. Two is exactly the number of coordinates needed to index the surface of a sphere.

## Putting the qubit on a sphere

Two angular coordinates describe any point on a sphere: a polar angle $\theta$ (how far down from the north pole) and an azimuthal angle $\varphi$ (the longitude). The qubit state can be written using exactly those two angles. This parametrization bakes normalization in automatically:

$$|\psi\rangle = \cos\!\tfrac{\theta}{2}|0\rangle + e^{i\varphi}\sin\!\tfrac{\theta}{2}|1\rangle$$

where $\theta \in [0, \pi]$ and $\varphi \in [0, 2\pi)$.

The $\theta/2$ is deliberate: it ensures that as $\theta$ sweeps from 0 to $\pi$, the state sweeps from $|0\rangle$ to $|1\rangle$ exactly once, covering the full sphere without doubling back.

Check the poles: at $\theta = 0$, we get $|\psi\rangle = |0\rangle$. At $\theta = \pi$, we get $e^{i\varphi}|1\rangle$ — which is physically $|1\rangle$ (global phase). Every qubit state is a point on this sphere. This is the **Bloch sphere**.

</div>

<div class="sphere-section">
<div class="sphere-section-prose">

## Reading the sphere — qubit states as geography

The Bloch sphere turns qubit states into geography. The poles are the classical states; everything else is a superposition.

**North pole ($\theta = 0$) — the state $|0\rangle$.** Measuring this gives 0 with certainty. $\cos^2(0) = 1$.

**South pole ($\theta = \pi$) — the state $|1\rangle$.** Measuring this gives 1 with certainty. $\sin^2(\pi/2) = 1$.

**The equator ($\theta = \pi/2$)** — a ring of states that each give a 50/50 outcome. The four named equatorial states are:

- $|{+}\rangle = (|0\rangle + |1\rangle)/\sqrt{2}$ — positive x-axis ($\varphi = 0$)
- $|{-}\rangle = (|0\rangle - |1\rangle)/\sqrt{2}$ — negative x-axis ($\varphi = \pi$)
- $|{+i}\rangle = (|0\rangle + i|1\rangle)/\sqrt{2}$ — positive y-axis ($\varphi = \pi/2$)
- $|{-i}\rangle = (|0\rangle - i|1\rangle)/\sqrt{2}$ — negative y-axis ($\varphi = 3\pi/2$)

All four give 50/50 at measurement. But they're four distinct physical states — drag the sphere and you'll see them sitting 90° apart around the equator. They respond differently to gates.

</div>
<div class="sphere-section-widget">

<BlochSphere />

</div>
</div>

<div class="prose-2col">

## What happens when you measure

Measurement collapses the qubit to one of the two poles — $|0\rangle$ or $|1\rangle$. The probabilities come directly from the parametrization. For a state at polar angle $\theta$:

$$P(0) = \cos^2\!\tfrac{\theta}{2} \qquad P(1) = \sin^2\!\tfrac{\theta}{2}$$

The latitude of the state tells you how certain the outcome is. A state near the north pole has small $\theta$, so $P(0)$ is close to 1. The equator is maximum uncertainty. Distance from a pole is geometric probability.

After measurement, the superposition is gone. The state is now $|0\rangle$ or $|1\rangle$, snapped to the pole. This is why you can't extract both $\alpha$ and $\beta$ from a single measurement — you only see which pole the state fell to.

## Phase — the coordinate that hides until you need it

The longitude $\varphi$ doesn't appear anywhere in the measurement probabilities. The azimuthal angle of the Bloch sphere has no effect on what you observe when you measure directly.

This might look like phase doesn't matter. It does.

Phase becomes visible the moment you rotate the state before measuring. A gate — a quantum operation — is a rotation of the Bloch sphere. A rotation that shifts the longitude $\varphi$ can change the latitude $\theta$. And changing $\theta$ changes the measurement probabilities. Two states that look identical under direct measurement can become distinguishable after a rotation, because the rotation treats different longitudes differently.

This is **quantum interference** — the mechanism behind every quantum algorithm. It's entirely a consequence of phase. We'll dig into it in the next post, when we have a concrete gate to work with. For now: phase is the hidden coordinate. Invisible at measurement, but present in the state vector, waiting to matter.

</div>
```

- [ ] **Step 3: Verify the build passes**

```bash
npm run build 2>&1
```

Expected: build completes. The two old post URLs no longer exist in `dist/`. The new post is built.

```bash
ls dist/blog/
```

Expected output includes `bits-amplitudes-bloch-sphere/` but NOT `bits-amplitudes-bra-ket/` or `bloch-sphere/`.

- [ ] **Step 4: Verify KaTeX rendered in the new post**

```bash
grep -c 'class="katex"' dist/blog/bits-amplitudes-bloch-sphere/index.html
```

Expected: a number greater than 0.

- [ ] **Step 5: Commit**

```bash
git add src/content/posts/bits-amplitudes-bloch-sphere.mdx
git rm src/content/posts/bits-amplitudes-bra-ket.mdx
git rm src/content/posts/bloch-sphere.mdx
git commit -m "feat: replace posts 1+2 with combined longform article"
```
