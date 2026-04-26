# Klein Bottle Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated Three.js Klein bottle to the home page right column, floating transparently on the white background with the Leo Moser limerick and a Wikipedia link below it.

**Architecture:** A new `KleinBottle.astro` component contains the canvas, limerick, and Three.js script (bundled by Vite). `index.astro` wraps the existing `.home-wrap` and the new component in a `.home-layout` flex row. `global.css` gets the layout and typography classes. Three.js renders into a transparent alpha canvas so the site's white background shows through the bottle.

**Tech Stack:** Three.js 0.158.0 (npm), ParametricGeometry addon, RoomEnvironment addon, Astro 6, TypeScript

---

### Task 1: Install Three.js

**Files:**
- Modify: `package.json` (dependency added by npm)

- [ ] **Step 1: Install the package**

```bash
npm install three@0.158.0
```

- [ ] **Step 2: Verify it's in package.json**

```bash
grep '"three"' package.json
```

Expected: `"three": "0.158.0"` (or `"^0.158.0"`)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add three@0.158.0"
```

---

### Task 2: Add layout and component CSS

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add Klein layout rules to the Home / Landing section**

In `src/styles/global.css`, find the `/* ── Home / Landing ── */` comment (around line 702). Insert the following block **before** the existing `.home-wrap` rule:

```css
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
  padding: 8px 32px 0;
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

.klein-poem {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 300;
  font-style: italic;
  color: var(--color-ink-3);
  line-height: 1.8;
  white-space: pre;
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
  display: block;
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

- [ ] **Step 2: Hide klein-aside on narrow viewports**

Find the `@media (max-width: 720px)` block (around line 1347). Add this line **inside** that block, before its closing `}`:

```css
  .klein-aside { display: none; }
```

Then add a separate mid-size breakpoint **after** the `@media (max-width: 720px)` block's closing `}`:

```css
@media (max-width: 1100px) {
  .klein-aside { display: none; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "style: add Klein bottle layout and verse CSS"
```

---

### Task 3: Create KleinBottle.astro component

**Files:**
- Create: `src/components/KleinBottle.astro`

- [ ] **Step 1: Create the component**

Create `src/components/KleinBottle.astro` with the following content:

```astro
---
---
<div class="klein-aside">
  <canvas id="klein-canvas"></canvas>
  <figure class="klein-verse">
    <pre class="klein-poem">A mathematician named Klein
Thought the Möbius band was divine.
     Said he: "If you glue
     The edges of two,
You'll get a weird bottle like mine."</pre>
    <figcaption class="klein-attr">— Leo Moser</figcaption>
    <a
      href="https://en.wikipedia.org/wiki/Klein_bottle"
      target="_blank"
      rel="noopener noreferrer"
    >Klein bottle ↗</a>
  </figure>
</div>

<script>
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

const canvas = document.getElementById('klein-canvas') as HTMLCanvasElement;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0, 14);

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

function makeKlein(tubeScale: number, v: number, u: number, target: THREE.Vector3) {
  u *= Math.PI; v *= 2 * Math.PI; u *= 2;
  const r = 2 * (1 - Math.cos(u) / 2) * tubeScale;
  let x: number, y: number, z: number;
  if (u < Math.PI) {
    x = 3*Math.cos(u)*(1+Math.sin(u)) + r*Math.cos(u)*Math.cos(v);
    y = 8*Math.sin(u) + r*Math.sin(u)*Math.cos(v);
  } else {
    x = 3*Math.cos(u)*(1+Math.sin(u)) + r*Math.cos(v+Math.PI);
    y = 8*Math.sin(u);
  }
  z = r * Math.sin(v);
  target.set(x, y, z);
}

// ParametricGeometry calls fn(u, v, target) — we swap to (v, u) to match the
// Three.js figure-8 Klein convention used in the approved prototype.
const glassGeo = new ParametricGeometry((v, u, t) => makeKlein(1.0, v, u, t), 100, 50);
glassGeo.computeBoundingBox();
const center = new THREE.Vector3();
glassGeo.boundingBox!.getCenter(center);
glassGeo.translate(-center.x, -center.y, -center.z);
glassGeo.computeBoundingBox();
const sz = new THREE.Vector3();
glassGeo.boundingBox!.getSize(sz);
const s = 8.0 / Math.max(sz.x, sz.y, sz.z);

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0xe8f0ff,
  metalness: 0,
  roughness: 0.0,
  transmission: 0.88,
  thickness: 2.5,
  ior: 1.52,
  reflectivity: 0.65,
  side: THREE.DoubleSide,
  envMapIntensity: 2.5,
});
const glass = new THREE.Mesh(glassGeo, glassMat);
glass.scale.setScalar(s);

const liquidGeo = new ParametricGeometry((v, u, t) => makeKlein(0.72, v, u, t), 100, 50);
liquidGeo.translate(-center.x, -center.y, -center.z);
const liquidMat = new THREE.MeshStandardMaterial({
  color: 0x07070f,
  metalness: 0.2,
  roughness: 0.6,
  side: THREE.FrontSide,
});
const liquid = new THREE.Mesh(liquidGeo, liquidMat);
liquid.scale.setScalar(s);

const group = new THREE.Group();
group.add(liquid);  // opaque first — captured in glass transmission pass
group.add(glass);
group.rotation.x = 0.3;
group.rotation.z = 0.1;
scene.add(group);

scene.add(new THREE.AmbientLight(0xffffff, 0.25));
const key = new THREE.DirectionalLight(0xffffff, 3.5);
key.position.set(5, 10, 8);
scene.add(key);
const fill = new THREE.DirectionalLight(0xaabbff, 0.8);
fill.position.set(-6, -3, 4);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xfff8f0, 0.45);
rim.position.set(2, -8, -6);
scene.add(rim);

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);  // false = don't touch canvas style
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();

let animId: number | null = null;
let t = 0;

function tick() {
  animId = requestAnimationFrame(tick);
  t += 0.004;
  group.rotation.y = t;
  renderer.render(scene, camera);
}

const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    if (animId === null) tick();
  } else {
    if (animId !== null) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }
}, { threshold: 0 });

observer.observe(canvas);
window.addEventListener('resize', resize);
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/KleinBottle.astro
git commit -m "feat: add KleinBottle component with Three.js animation and limerick"
```

---

### Task 4: Update index.astro

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Import KleinBottle and add .home-layout wrapper**

Replace `src/pages/index.astro` with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Sidebar from '../components/Sidebar.astro';
import KleinBottle from '../components/KleinBottle.astro';
---

<BaseLayout title="Vatsal Bakshi" description="Engineering Manager at Apple, working on cryptographic architecture across PKI, post-quantum migration, and HSM infrastructure.">
  <div class="layout">
    <Sidebar />

    <main class="feed">
      <div class="home-layout">
        <div class="home-wrap">

          <div class="home-intro">
            <p>I work on the Crypto Services team at <a href="https://www.apple.com" target="_blank" rel="noopener noreferrer">Apple</a>, a smaller and highly specialized group embedded within the Information Systems and Technology (IS&amp;T) organization. Before this I was working on engineering challenges associated with infrastructure in data centers supporting various compliance and security teams.</p>
            <p>I am a hands-on engineering leader who enjoys solving software engineering problems at any scale.</p>
            <p>I received my Masters in Information Security from <a href="https://isi.jhu.edu/" target="_blank" rel="noopener noreferrer">Johns Hopkins University</a> and my B.E. in Computer Science from <a href="https://www.bits-pilani.ac.in" target="_blank" rel="noopener noreferrer">Birla Institute of Technology &amp; Science, Pilani</a>.</p>
            <p>Away from the keyboard, I spend time outside golfing or hiking with my wife. I'm also an avid astrophotographer — some of my work can be viewed on <a href="https://app.astrobin.com/u/primordialphotons" target="_blank" rel="noopener noreferrer">Astrobin</a>.</p>
          </div>

          <nav class="home-links">
            <a href="/resume" class="home-link">
              <span class="home-link-label">Resume</span>
              <span class="home-link-desc">Work history &amp; technical background</span>
              <span class="home-link-arrow">↗</span>
            </a>
            <a href="/blog" class="home-link">
              <span class="home-link-label">Writing</span>
              <span class="home-link-desc">Thoughts on various things</span>
              <span class="home-link-arrow">↗</span>
            </a>
          </nav>

        </div>

        <KleinBottle />
      </div>
    </main>
  </div>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: integrate KleinBottle into home page layout"
```

---

### Task 5: Visual verification

**Files:** none (read-only)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open the URL shown in terminal (Astro default: `http://localhost:4321`).

- [ ] **Step 2: Check wide viewport (≥ 1200px)**

Confirm all of the following:

1. Klein bottle canvas appears in the right column with no dark box behind it — white page shows through
2. Bottle rotates slowly; dark liquid visible through the glass shell
3. Limerick appears below in Newsreader italic; lines 3–4 are indented five spaces
4. `— Leo Moser` on its own line below the poem
5. `Klein bottle ↗` link below the attribution, styled like site secondary links

- [ ] **Step 3: Check narrow viewport (≤ 1100px)**

Resize below 1100px — `.klein-aside` disappears, `.home-wrap` reads as a clean single column with no layout shift.

- [ ] **Step 4: If the glass is too invisible on white**

The transparent glass relies on specular highlights. If the bottle looks nearly invisible (just a faint dark blob), increase presence in `src/components/KleinBottle.astro`:

```typescript
// in glassMat:
reflectivity: 0.75,
transmission: 0.82,
```

Commit:

```bash
git add src/components/KleinBottle.astro
git commit -m "fix: increase glass visibility on white background"
```

- [ ] **Step 5: If `three/addons/` imports fail at build time**

Vite may not resolve the `three/addons/` export alias on all setups. If you see a module-not-found error, replace the two addon imports in `KleinBottle.astro`:

```typescript
// replace:
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

// with:
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
```

Commit:

```bash
git add src/components/KleinBottle.astro
git commit -m "fix: use full jsm paths for Three.js addons"
```
