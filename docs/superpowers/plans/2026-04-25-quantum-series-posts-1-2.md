# Quantum Computing from First Principles: Posts 1–2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author and publish the first two posts of the "Quantum Computing from First Principles" series — registering the new topic and writing complete MDX content for both posts.

**Architecture:** Add the `quantum-computing` topic to the content schema, then create two MDX posts as standalone files under `src/content/posts/`. Each post is self-contained prose with MDX frontmatter matching the Astro content schema.

**Tech Stack:** Astro 6, MDX, Tailwind v4. Build command: `npm run build`. Dev server: `npm run dev`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/content.config.ts` | Add `quantum-computing` to `TOPICS` array |
| Create | `src/content/posts/bits-amplitudes-bra-ket.mdx` | Post 1 full content |
| Create | `src/content/posts/bloch-sphere.mdx` | Post 2 full content |

---

## Task 1: Register the quantum-computing topic

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Add the topic to the TOPICS array**

Open `src/content.config.ts`. The current `TOPICS` array is:

```ts
export const TOPICS = [
  {
    slug: 'quantum-crypto',
    name: 'Quantum Cryptography',
    description: '',
  },
] as const;
```

Replace with:

```ts
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
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`

Expected: Build completes with no type errors. The `topic` enum in the post schema now accepts both `'quantum-crypto'` and `'quantum-computing'`.

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add quantum-computing topic"
```

---

## Task 2: Write Post 1 — Bits, Amplitudes, and Bra-Ket Notation

**Files:**
- Create: `src/content/posts/bits-amplitudes-bra-ket.mdx`

- [ ] **Step 1: Create the MDX file with complete content**

Create `src/content/posts/bits-amplitudes-bra-ket.mdx` with the following content:

```mdx
---
title: "Bits, Amplitudes, and Bra-Ket Notation"
description: "A classical bit is either 0 or 1. A qubit is something more precise — and more interesting — than 'both at once'."
topic: quantum-computing
series:
  slug: quantum-first-principles
  name: Quantum Computing from First Principles
  part: 1
tags: [quantum, bra-ket, linear-algebra, superposition]
publishedAt: 2026-04-25
published: true
---

A classical bit is a choice made. In a transistor, the choice is permanent until you change it: high voltage is 1, low voltage is 0. There is no ambiguity. The bit doesn't wonder which it is — it knows.

You've probably heard that a qubit can be "both 0 and 1 at the same time." This is technically wrong in a way that matters. It creates a mental model that collapses the moment you try to reason carefully about quantum algorithms.

Here is a better frame: a qubit is not in a definite state until you measure it. Before measurement, it exists in a **superposition** — a precise mathematical description of the possible outcomes and their weights. When you measure, the superposition resolves to a definite outcome, with probabilities determined by those weights.

Those weights are called **amplitudes**. And amplitudes are the central concept of quantum computing.

## Amplitudes Are Not Probabilities

This distinction is the first thing to get right.

In classical probability, you might say a coin has a 50% chance of heads. That probability is a real number between 0 and 1. Probabilities can never be negative. They can never be complex.

Quantum amplitudes are different. They are **complex numbers**. They can be positive, negative, real, imaginary, or anywhere in the complex plane. Only their squared magnitude gives you a probability.

Specifically: if a qubit has amplitude α for |0⟩ and amplitude β for |1⟩, then:

- Probability of measuring 0: |α|²
- Probability of measuring 1: |β|²

The constraint is that |α|² + |β|² = 1 — the probabilities must sum to 1.

Why complex numbers, rather than just signed reals? The imaginary part encodes **phase** — a quantity invisible at measurement but critical when qubits interact with each other. We'll return to phase in a later post. For now: complex amplitudes are not arbitrary. They are the minimum structure needed to make quantum mechanics work.

## Basis States and Bra-Ket Notation

We need a clean notation for all of this. The standard is called **bra-ket notation**, introduced by Paul Dirac.

The two pure states of a qubit — the analogs of classical 0 and 1 — are written:

|0⟩ and |1⟩

These are called **kets**. The vertical bar and angle bracket are part of the notation, not decoration. These are the **basis states**: the simplest, most definite states a qubit can be in. Measuring |0⟩ always gives 0; measuring |1⟩ always gives 1.

A general single-qubit state is a **linear combination** of the basis states:

|ψ⟩ = α|0⟩ + β|1⟩

where α and β are complex numbers satisfying |α|² + |β|² = 1. This is superposition — not "being both at once," but occupying a precise mathematical combination of the two basis states.

As a column vector, this is equivalent to writing:

|ψ⟩ = [α, β]ᵀ

where |0⟩ = [1, 0]ᵀ and |1⟩ = [0, 1]ᵀ. The ket is just a vector; the notation is a more expressive way to write it.

The **bra** is the conjugate transpose of the ket: ⟨ψ| = [α*, β*]. This lets us write inner products cleanly: ⟨φ|ψ⟩ is the inner product of state φ with state ψ — a bra on the left, a ket on the right, forming a "bracket." That is where the name comes from.

The normalization constraint, in bra-ket form, is just ⟨ψ|ψ⟩ = 1.

## What a Qubit Is

We now have a precise answer to the question.

A qubit is a unit vector in a two-dimensional complex vector space. Its two components are amplitudes. Measuring it collapses it to one of the basis states, with probabilities given by the squared magnitudes of the corresponding amplitudes. The state before measurement is not vague or undefined — it is exactly |ψ⟩ = α|0⟩ + β|1⟩. The uncertainty is in the outcome of measurement, not in the state itself.

This is the foundation everything else builds on. Gates are transformations that act on these vectors. Entanglement is a property of multi-qubit vectors. Quantum algorithms are sequences of transformations designed to steer probability toward the right answer.

In the next post, we'll figure out how to visualize a qubit's state geometrically — and discover that every single-qubit state corresponds to a point on the surface of a sphere.
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`

Expected: Build completes with no errors. The new post is collected and its frontmatter validates against the content schema.

- [ ] **Step 3: Commit**

```bash
git add src/content/posts/bits-amplitudes-bra-ket.mdx
git commit -m "feat: add post 1 — Bits, Amplitudes, and Bra-Ket Notation"
```

---

## Task 3: Write Post 2 — The Bloch Sphere

**Files:**
- Create: `src/content/posts/bloch-sphere.mdx`

- [ ] **Step 1: Create the MDX file with complete content**

Create `src/content/posts/bloch-sphere.mdx` with the following content:

```mdx
---
title: "The Bloch Sphere"
description: "A qubit state has two complex amplitudes — four real degrees of freedom. Two constraints reduce this to something you can draw on a sphere."
topic: quantum-computing
series:
  slug: quantum-first-principles
  name: Quantum Computing from First Principles
  part: 2
tags: [quantum, bloch-sphere, visualization, phase]
publishedAt: 2026-04-25
published: true
---

We have a precise description of a qubit: a unit vector |ψ⟩ = α|0⟩ + β|1⟩ in a two-dimensional complex vector space. Two complex numbers. Four real degrees of freedom.

Four dimensions is too many to picture directly. But two constraints reduce this to something you can actually visualize — and the result turns out to be the surface of a sphere.

## Counting Degrees of Freedom

Start with four real numbers: Re(α), Im(α), Re(β), Im(β).

**Constraint 1: normalization.** The state must satisfy |α|² + |β|² = 1. This removes one degree of freedom, leaving three.

**Constraint 2: global phase.** This one is subtler. Quantum mechanics has a structural property: multiplying an entire state by e^(iθ) for any real θ produces a state that is physically indistinguishable from the original. No measurement, now or ever, can tell the difference between |ψ⟩ and e^(iθ)|ψ⟩.

This is not an approximation. It is exact, and it follows from how probabilities are computed. Measurement outcomes depend on |amplitude|², and |e^(iθ) · α|² = |α|² — the global phase factor cancels.

Global phase is physically meaningless, so we can always choose a convention that removes it. By convention, we choose α to be a real, non-negative number. This removes another degree of freedom.

We are left with **two real degrees of freedom** to describe any physically distinct single-qubit state.

Two degrees of freedom. One constraint (normalization still holds). The natural geometric object is a **surface** — and with the remaining normalization, specifically a unit sphere.

## The Parametrization

Write the state in a form that makes the two degrees of freedom explicit:

|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩

where θ ∈ [0, π] and φ ∈ [0, 2π).

The factor of θ/2 is deliberate. At θ = 0: cos(0) = 1, sin(0) = 0, so |ψ⟩ = |0⟩. At θ = π: cos(π/2) = 0, sin(π/2) = 1, so |ψ⟩ = e^(iφ)|1⟩, which is physically |1⟩ (global phase). The factor of 2 maps the full range of qubit states onto a complete sphere without wrapping around twice.

Interpret θ as the polar angle from the north pole, and φ as the azimuthal angle. Every qubit state is now a point on a unit sphere. This is the **Bloch sphere**.

## Reading the Sphere

**North pole (θ = 0):** |ψ⟩ = |0⟩. Probability of measuring 0 is cos²(0) = 1. Certainty.

**South pole (θ = π):** |ψ⟩ = |1⟩. Probability of measuring 1 is sin²(π/2) = 1. Certainty.

**Equator (θ = π/2):** |ψ⟩ = (|0⟩ + e^(iφ)|1⟩)/√2. Equal probability of measuring 0 or 1, for any φ. The four cardinal points on the equator are named:

- |+⟩ = (|0⟩ + |1⟩)/√2 — positive x-axis (φ = 0)
- |−⟩ = (|0⟩ − |1⟩)/√2 — negative x-axis (φ = π)
- |i⟩ = (|0⟩ + i|1⟩)/√2 — positive y-axis (φ = π/2)
- |−i⟩ = (|0⟩ − i|1⟩)/√2 — negative y-axis (φ = 3π/2)

These four states all produce a 50/50 measurement outcome. They are nonetheless distinct physical states that behave differently under operations.

## Measurement as Projection

When you measure a qubit in the standard basis — the z-axis of the Bloch sphere — the state collapses to one of the two poles. The probabilities follow directly from the parametrization:

- Probability of measuring 0 (north pole): cos²(θ/2)
- Probability of measuring 1 (south pole): sin²(θ/2)

A state close to the north pole has small θ, so cos²(θ/2) is close to 1. The closer a state is to a pole, the more certain the corresponding measurement outcome. Distance from the pole is geometric uncertainty.

After measurement, the state is no longer |ψ⟩. It is either |0⟩ or |1⟩, collapsed to the corresponding pole. The original superposition is gone. This is why you cannot extract both α and β from a single measurement — you only ever see which pole the state fell to.

## Phase Is Invisible — For Now

Notice that φ does not appear anywhere in the measurement probabilities. The azimuthal angle — the longitude of the Bloch sphere — has no effect on what you observe when you measure.

This might suggest that phase is unimportant. It is not.

Phase becomes observable the moment you apply a gate before measuring. A gate is a rotation of the Bloch sphere. A rotation that moves φ can change θ — and changing θ changes the measurement probabilities. Two states that are indistinguishable by direct measurement can become distinguishable after a rotation, because the rotation treats different φ values differently.

This is quantum interference. It is the mechanism behind every quantum algorithm, and it is entirely a consequence of phase. We will explore it carefully in post 4, after we have a concrete gate to work with.

In the next post, we'll look at the Hadamard gate — the most important single-qubit gate. Seen on the Bloch sphere, it is a 180° rotation that maps the north pole to the equator.
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`

Expected: Build completes with no errors. Both new posts render, series metadata is valid.

- [ ] **Step 3: Commit**

```bash
git add src/content/posts/bloch-sphere.mdx
git commit -m "feat: add post 2 — The Bloch Sphere"
```
