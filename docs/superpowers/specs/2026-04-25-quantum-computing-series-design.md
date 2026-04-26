# Quantum Computing from First Principles — Series Design

**Date:** 2026-04-25
**Status:** Approved

## Overview

A linear 8-post blog series introducing quantum computing and its mathematical foundations to a technically literate audience (software engineers, CS grads comfortable with calculus). The series prioritizes intuition over rote formalism — each post builds understanding from first principles before introducing notation or machinery.

The series lives under a new `quantum-computing` topic on the site. The existing `quantum-crypto` posts are placeholders and will be replaced or retired separately.

## Audience

Software engineers and CS graduates who:
- Are comfortable with calculus and abstract thinking
- Have no background in quantum mechanics or quantum computing
- Want to genuinely understand the concepts, not just collect buzzwords

## Writing Philosophy

- Lead with intuition, not definitions
- Introduce notation only after the concept it represents is already understood
- Each post opens with a motivating question or concrete puzzle
- No assumed knowledge beyond the previous post in the series

## Series Structure

**Series slug:** `quantum-first-principles`
**Series name:** Quantum Computing from First Principles
**Topic:** `quantum-computing` (new topic, to be added to `TOPICS` in `src/content.config.ts`)

### Post 1 — Bits, Amplitudes, and Bra-Ket Notation

**Core concept:** Quantum state as a vector of probability amplitudes; the |0⟩ and |1⟩ basis states; superposition as a linear combination.

**Intuition arc:** Start from the familiar (a classical bit is a definite 0 or 1). Motivate the need for something richer: a qubit isn't just "both at once" — it has a precise mathematical description as a vector of complex amplitudes. Introduce bra-ket as notation that makes this clean to write.

**Depends on:** Nothing — this is the entry point.

---

### Post 2 — The Bloch Sphere

**Core concept:** Every single-qubit pure state as a point on a unit sphere; phase as the equatorial angle; measurement as projection onto the poles.

**Intuition arc:** The bra-ket description has two complex numbers — that's four real degrees of freedom. Show why global phase doesn't matter, leaving two: a latitude (|0⟩ vs |1⟩ mix) and a longitude (relative phase). This maps exactly to a sphere. Measurement collapses a point on the sphere to one of two poles.

**Depends on:** Post 1 (bra-ket, amplitudes).

---

### Post 3 — Quantum Gates as Rotations: The Hadamard

**Core concept:** Gates as unitary transformations; unitarity as information-preservation; the Hadamard as a 180° rotation on the Bloch sphere that creates equal superposition.

**Intuition arc:** If state is a point on a sphere, operations are rotations. Unitarity means the sphere doesn't stretch or shrink — information is preserved. The Hadamard is the most important single-qubit gate: it maps |0⟩ to (|0⟩+|1⟩)/√2, a point on the equator. Show this geometrically before writing the matrix.

**Depends on:** Post 2 (Bloch sphere, unitarity intuition).

---

### Post 4 — Phase and Interference

**Core concept:** Phase is invisible at measurement but determines which outcomes constructively or destructively interfere; interference is the engine of quantum algorithms.

**Intuition arc:** Measurement only reveals probabilities (|amplitude|²), so phase seems irrelevant — but it isn't. Two paths to the same outcome can cancel (destructive interference) or reinforce (constructive). This is what gives quantum algorithms their power. Introduce the Z gate and phase kickback as concrete examples.

**Depends on:** Post 3 (gates, Hadamard, Bloch sphere geometry).

---

### Post 5 — Two Qubits and the Tensor Product

**Core concept:** Combining quantum systems via tensor product; state space grows exponentially; the CNOT gate as a controlled operation.

**Intuition arc:** With one qubit, state is a 2D vector. With two, it's 4D. With n, it's 2ⁿ — this exponential is both the promise and the difficulty of quantum computing. Write a two-qubit state, show how to apply single-qubit gates to one qubit of a pair, and introduce CNOT as the canonical two-qubit gate.

**Depends on:** Post 4 (single-qubit gates and state).

---

### Post 6 — Entanglement and Bell States

**Core concept:** Entangled state as non-separable; Bell pairs as maximally entangled two-qubit states; what entanglement is and isn't.

**Intuition arc:** Most two-qubit states can be written as a product of two single-qubit states. The ones that can't are entangled — measuring one qubit tells you something about the other, instantly, regardless of distance. Construct the Bell states using Hadamard + CNOT. Clarify what entanglement doesn't give you: no faster-than-light signaling.

**Depends on:** Post 5 (tensor product, CNOT).

---

### Post 7 — Reading a Quantum Circuit

**Core concept:** The circuit model as the standard "assembly language" for quantum algorithms; wires, gates, measurement symbols; common gates (X, Y, Z, S, T, CNOT, Toffoli).

**Intuition arc:** Quantum algorithms are described as circuits. Show how to read a circuit diagram left-to-right: each wire is a qubit, each box is a gate, double lines indicate classical outcomes from measurement. Walk through a simple circuit to build fluency. This post is a short reference post — dense and practical.

**Depends on:** Post 6 (entanglement, multi-qubit gates).

---

### Post 8 — The Deutsch-Jozsa Algorithm

**Core concept:** Oracle model; query complexity; how interference concentrates probability on the correct answer in a single query.

**Intuition arc:** The problem: given a black-box function f: {0,1}ⁿ → {0,1}, determine if it's constant or balanced. Classically, you need 2ⁿ⁻¹+1 queries in the worst case. Quantum: 1 query always suffices. Walk through the circuit, trace the amplitudes, and show how interference causes all probability to land on "constant" or "balanced" — no randomness, no error. This post is the payoff for everything that came before.

**Depends on:** Post 7 (circuit model, how to read and trace a circuit).

---

## Technical Considerations

### New topic

Add to `TOPICS` array in `src/content.config.ts`:

```ts
{ slug: 'quantum-computing', name: 'Quantum Computing', description: '' }
```

### Content schema

Each post uses the standard schema:
- `topic: 'quantum-computing'`
- `series: { slug: 'quantum-first-principles', name: 'Quantum Computing from First Principles', part: N }`
- `tags`: per-post (e.g., `[quantum, bra-ket, linear-algebra]`)

### Existing placeholder posts

`qkd-primer.mdx` and `bb84-protocol.mdx` are acknowledged placeholders under `quantum-crypto`. They are out of scope for this series and will be addressed separately.

## Success Criteria

- A software engineer with no quantum background can read posts 1–8 in order and finish with a genuine understanding of how and why the Deutsch-Jozsa algorithm works
- No post requires knowledge not established in a previous post
- Each post leads with a question or puzzle before introducing formalism
