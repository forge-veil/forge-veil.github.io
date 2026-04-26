# Golf Ball Flight Laws — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone longform blog post about D-Plane golf ball flight theory with an embedded Three.js interactive visualization (`GolfFlightViz`) cycling through all 9 ball flight shapes.

**Architecture:** One new Astro component (`GolfFlightViz.astro`) wraps a Three.js WebGL canvas with three HTML HUD overlays. It is imported once in a new MDX post. The content schema gets a `golf` topic. No changes to `[slug].astro` or the blog index — the index auto-shows Golf once a published post exists; our post starts as `published: false`.

**Tech Stack:** Three.js r158 (already in npm deps), Astro 6, MDX, inline SVG for HUDs

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/content.config.ts` | Modify | Add `golf` to TOPICS array |
| `src/components/GolfFlightViz.astro` | Create | Three.js scene + HUD overlays |
| `src/content/posts/golf-ball-flight-laws.mdx` | Create | Post content, imports GolfFlightViz |

---

### Task 1: Add `golf` topic to content schema

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Edit TOPICS**

In `src/content.config.ts`, change:

```typescript
export const TOPICS = [
  {
    slug: 'quantum-computing',
    name: 'Quantum Computing',
    description: '',
  },
] as const;
```

to:

```typescript
export const TOPICS = [
  {
    slug: 'quantum-computing',
    name: 'Quantum Computing',
    description: '',
  },
  {
    slug: 'golf',
    name: 'Golf',
    description: '',
  },
] as const;
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add golf topic to content schema"
```

---

### Task 2: GolfFlightViz — HTML skeleton and CSS

Create the component file with the full DOM structure and all layout styles. No Three.js yet — the goal is a correctly styled, correctly positioned container so Task 3 can focus purely on the 3D logic.

**Files:**
- Create: `src/components/GolfFlightViz.astro`

- [ ] **Step 1: Create the file**

Create `src/components/GolfFlightViz.astro` with the following content:

```astro
---
// No props — self-contained
---

<div class="gfv-wrap">
  <canvas class="gfv-canvas"></canvas>

  <div class="gfv-label">DRAW</div>
  <div class="gfv-sub">FACE: Square (+2°) · PATH: In→Out (+10°)</div>

  <!-- D-Plane HUD — bottom-left -->
  <div class="gfv-hud gfv-hud--dplane">
    <div class="gfv-hud-title">D-PLANE · TOP VIEW</div>
    <svg class="gfv-dplane-svg" width="142" height="126" viewBox="0 0 142 126"></svg>
    <div class="gfv-hud-legend">
      <span class="gfv-legend-item">
        <span class="gfv-legend-swatch" style="background:#4ade80"></span>FACE
      </span>
      <span class="gfv-legend-item">
        <span class="gfv-legend-swatch" style="background:#fbbf24"></span>PATH
      </span>
    </div>
  </div>

  <!-- Club Face HUD — top-right -->
  <div class="gfv-hud gfv-hud--clubface">
    <div class="gfv-hud-title">CLUB FACE · TOP VIEW</div>
    <svg class="gfv-cf-svg" width="142" height="100" viewBox="0 0 142 100"></svg>
    <div class="gfv-cf-state">SQUARE (0°)</div>
    <div class="gfv-cf-legend"><span>HEEL</span><span>TOE</span></div>
  </div>

  <!-- 3×3 minimap — bottom-right -->
  <div class="gfv-minimap"></div>

  <!-- Nav — bottom-center -->
  <div class="gfv-nav">
    <button class="gfv-nav-btn gfv-nav-prev">‹</button>
    <span class="gfv-nav-counter">4 / 9</span>
    <button class="gfv-nav-btn gfv-nav-next">›</button>
  </div>
</div>

<style>
  .gfv-wrap {
    position: relative;
    width: 100%;
    height: 480px;
    border: 0.5px solid var(--color-border);
    border-radius: 10px;
    overflow: hidden;
    margin: 2rem 0;
    font-family: 'SF Mono', 'Fira Mono', monospace;
    background: #0a1628;
  }

  .gfv-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }

  .gfv-label {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    white-space: nowrap;
    background: rgba(0, 0, 0, 0.82);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 8px;
    padding: 5px 18px;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    pointer-events: none;
  }

  .gfv-sub {
    position: absolute;
    top: 54px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    white-space: nowrap;
    color: rgba(255, 255, 255, 0.48);
    font-size: 10px;
    letter-spacing: 0.06em;
    pointer-events: none;
  }

  .gfv-hud {
    position: absolute;
    z-index: 2;
    width: 158px;
    background: rgba(6, 14, 32, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 10px;
    padding: 10px 8px 8px;
    pointer-events: none;
  }

  .gfv-hud-title {
    font-size: 9px;
    letter-spacing: 0.18em;
    color: rgba(255, 255, 255, 0.38);
    text-transform: uppercase;
    margin-bottom: 6px;
    text-align: center;
  }

  .gfv-hud--dplane { bottom: 60px; left: 14px; }
  .gfv-hud--clubface { top: 80px; right: 14px; }

  .gfv-hud-legend {
    display: flex;
    gap: 10px;
    margin-top: 8px;
    justify-content: center;
  }

  .gfv-legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 9px;
    letter-spacing: 0.06em;
    color: rgba(255, 255, 255, 0.58);
  }

  .gfv-legend-swatch {
    display: inline-block;
    width: 16px;
    height: 2.5px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .gfv-cf-state {
    margin-top: 7px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-align: center;
    text-transform: uppercase;
    color: #d8dce4;
  }

  .gfv-cf-legend {
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
    padding: 0 4px;
    font-size: 8px;
    letter-spacing: 0.04em;
    color: rgba(255, 255, 255, 0.28);
  }

  .gfv-minimap {
    position: absolute;
    bottom: 60px;
    right: 14px;
    z-index: 2;
    display: grid;
    grid-template-columns: repeat(3, 50px);
    grid-template-rows: repeat(3, 30px);
    gap: 3px;
    pointer-events: all;
  }

  /* :global because cells are injected by JS and won't have Astro's scoped attribute */
  :global(.gfv-mm-cell) {
    background: rgba(6, 14, 32, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7.5px;
    letter-spacing: 0.03em;
    color: rgba(255, 255, 255, 0.38);
    cursor: pointer;
    text-align: center;
    line-height: 1.2;
    font-family: 'SF Mono', 'Fira Mono', monospace;
    transition: background 0.12s, color 0.12s;
  }

  :global(.gfv-mm-cell:hover) {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.75);
  }

  :global(.gfv-mm-cell.is-active) {
    border-color: rgba(255, 255, 255, 0.58);
    color: #fff;
    background: rgba(255, 255, 255, 0.14);
  }

  .gfv-nav {
    position: absolute;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: all;
  }

  .gfv-nav-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: #fff;
    font-size: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.12s;
    user-select: none;
    line-height: 1;
  }

  .gfv-nav-btn:hover { background: rgba(255, 255, 255, 0.22); }

  .gfv-nav-counter {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.36);
    letter-spacing: 0.08em;
    min-width: 44px;
    text-align: center;
  }
</style>
```

- [ ] **Step 2: Type-check**

```bash
npx astro check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/GolfFlightViz.astro
git commit -m "feat: add GolfFlightViz skeleton with HTML and CSS"
```

---

### Task 3: Three.js scene — renderer, GolfArc, ground, ball, animation

Add the `<script>` block with the Three.js setup, `GolfArc` Hermite curve class, scene geometry, and the looping ball animation. Starts bootstrapped on window index 3 (Draw). HUD interactivity comes in Task 5.

**Files:**
- Modify: `src/components/GolfFlightViz.astro` — append `<script>` after `</style>`

- [ ] **Step 1: Append the script block**

Add the following after the closing `</style>` tag:

```astro
<script>
import * as THREE from 'three';

// ── Types and constants ────────────────────────────────────────────────────

interface GolfWindow {
  label: string;
  face: string;
  path: string;
  faceAngle: number;
  pathAngle: number;
  endX: number;
  peakH: number;
}

const END_Z   = -13.0;
const ANIM_SEC = 2.4;
const PAUSE_SEC = 0.7;

const WINS: GolfWindow[] = [
  { label: 'Hook',       face: 'Closed', path: 'In→Out',   faceAngle: -14, pathAngle:  10, endX: -4.5, peakH: 3.8 },
  { label: 'Pull Hook',  face: 'Closed', path: 'Straight',  faceAngle: -10, pathAngle:   0, endX: -2.8, peakH: 4.0 },
  { label: 'Pull',       face: 'Closed', path: 'Out→In',   faceAngle: -10, pathAngle: -10, endX: -1.8, peakH: 4.0 },
  { label: 'Draw',       face: 'Square', path: 'In→Out',   faceAngle:   2, pathAngle:  10, endX: -0.8, peakH: 4.5 },
  { label: 'Straight',   face: 'Square', path: 'Straight',  faceAngle:   0, pathAngle:   0, endX:  0.0, peakH: 4.5 },
  { label: 'Fade',       face: 'Square', path: 'Out→In',   faceAngle:  -2, pathAngle: -10, endX:  1.0, peakH: 4.5 },
  { label: 'Push',       face: 'Open',   path: 'In→Out',   faceAngle:  10, pathAngle:  10, endX:  1.8, peakH: 4.0 },
  { label: 'Push Slice', face: 'Open',   path: 'Straight',  faceAngle:  10, pathAngle:   0, endX:  2.8, peakH: 3.8 },
  { label: 'Slice',      face: 'Open',   path: 'Out→In',   faceAngle:  14, pathAngle: -10, endX:  4.5, peakH: 3.5 },
];

// ── GolfArc Hermite curve ─────────────────────────────────────────────────
// X: cubic Hermite with launch tangent from face angle, endpoint from endX
// Z: linear to END_Z
// Y: peakH × sin(t × π), clamped ≥ 0.09

class GolfArc extends THREE.Curve<THREE.Vector3> {
  private m0x: number;
  private m1x: number;
  private endX: number;
  private endZ: number;
  private peakH: number;

  constructor(faceAngle: number, ex: number, ez: number, ph: number) {
    super();
    const fr   = faceAngle * Math.PI / 180;
    const dist = Math.sqrt(ex * ex + ez * ez);
    this.m0x  = Math.sin(fr) * dist * 0.72;
    this.m1x  = ex * 0.55;
    this.endX = ex;
    this.endZ = ez;
    this.peakH = ph;
  }

  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const t2 = t * t, t3 = t2 * t;
    const x  = (t3 - 2 * t2 + t) * this.m0x
             + (-2 * t3 + 3 * t2) * this.endX
             + (t3 - t2) * this.m1x;
    return target.set(x, Math.max(0.09, this.peakH * Math.sin(t * Math.PI)), this.endZ * t);
  }
}

function arcColorHex(w: GolfWindow): number {
  const d = w.faceAngle - w.pathAngle;
  return d < -1 ? 0x4f8ef7   // blue  — draw/hook
       : d >  1 ? 0xf47730   // orange — fade/slice
       :          0xd8dce4;  // silver — straight
}

// ── Renderer and scene ────────────────────────────────────────────────────

const wrap   = document.querySelector<HTMLElement>('.gfv-wrap')!;
const canvas = wrap.querySelector<HTMLCanvasElement>('.gfv-canvas')!;
let W = wrap.clientWidth, H = wrap.clientHeight;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.NoToneMapping; // direct hex colors, no shift
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b3d6e);
scene.fog = new THREE.FogExp2(0x1b3d6e, 0.02);

const cam = new THREE.PerspectiveCamera(52, W / H, 0.1, 200);
cam.position.set(0, 0.42, 2.8);
cam.lookAt(0, 0.18, -10);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(8, 14, 4);
sun.castShadow = true;
sun.shadow.mapSize.width  = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.left   = -20;
sun.shadow.camera.right  =  20;
sun.shadow.camera.top    =  20;
sun.shadow.camera.bottom = -20;
sun.shadow.camera.far    =  60;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x6699ff, 0.35);
fill.position.set(-5, 4, -3);
scene.add(fill);

// Ground
const gnd = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshLambertMaterial({ color: 0x1c4a2a }),
);
gnd.rotation.x = -Math.PI / 2;
gnd.receiveShadow = true;
scene.add(gnd);

// Fairway stripe
const fw = new THREE.Mesh(
  new THREE.PlaneGeometry(7, 80),
  new THREE.MeshLambertMaterial({ color: 0x245e35 }),
);
fw.rotation.x = -Math.PI / 2;
fw.position.set(0, 0.001, -20);
fw.receiveShadow = true;
scene.add(fw);

// Tee marker
const tee = new THREE.Mesh(
  new THREE.CylinderGeometry(0.18, 0.18, 0.01, 16),
  new THREE.MeshLambertMaterial({ color: 0xd4b483 }),
);
tee.position.set(0, 0.005, 0);
scene.add(tee);

// Animated ball
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 16, 12),
  new THREE.MeshLambertMaterial({ color: 0xffffff }),
);
ball.position.set(0, 0.1, 0);
scene.add(ball);

// ── Arc trail (rebuilt per window) ────────────────────────────────────────

let trailMesh:     THREE.Mesh | null = null;
let currentCurve:  GolfArc   | null = null;

function buildTrail(w: GolfWindow): void {
  if (trailMesh) {
    scene.remove(trailMesh);
    trailMesh.geometry.dispose();
    (trailMesh.material as THREE.Material).dispose();
    trailMesh = null;
  }
  currentCurve = new GolfArc(w.faceAngle, w.endX, END_Z, w.peakH);
  const geo = new THREE.TubeGeometry(currentCurve, 80, 0.05, 8, false);
  const mat = new THREE.MeshBasicMaterial({
    color: arcColorHex(w),
    transparent: true,
    opacity: 0.3,
  });
  trailMesh = new THREE.Mesh(geo, mat);
  scene.add(trailMesh);
}

// ── Animation loop ────────────────────────────────────────────────────────

const clock = new THREE.Clock();
let animT     = 0;
let isPaused  = false;
let pauseAccum = 0;

function resetAnim(): void {
  animT      = 0;
  isPaused   = false;
  pauseAccum = 0;
  ball.position.set(0, 0.1, 0);
  clock.getDelta(); // flush accumulated dt so first frame isn't a huge jump
}

function tick(): void {
  requestAnimationFrame(tick);
  const dt = clock.getDelta();

  if (!isPaused) {
    animT = Math.min(animT + dt / ANIM_SEC, 1);
    if (animT >= 1) { isPaused = true; pauseAccum = 0; }
  } else {
    pauseAccum += dt;
    if (pauseAccum >= PAUSE_SEC) { isPaused = false; animT = 0; }
  }

  if (currentCurve) {
    const p = currentCurve.getPoint(animT);
    ball.position.set(p.x, Math.max(0.1, p.y), p.z);
  }

  renderer.render(scene, cam);
}

window.addEventListener('resize', () => {
  W = wrap.clientWidth;
  H = wrap.clientHeight;
  cam.aspect = W / H;
  cam.updateProjectionMatrix();
  renderer.setSize(W, H);
});

// ── Bootstrap (replaced by goTo() in Task 5) ─────────────────────────────
buildTrail(WINS[3]);
resetAnim();
tick();
</script>
```

- [ ] **Step 2: Temporarily embed the component to verify**

In any existing published post, add a temporary `import` and `<GolfFlightViz />` to check the scene renders. Run:

```bash
npm run dev
```

Verify: dark green ground, navy sky, white ball animating and looping along a faint blue trail (Draw window). No console errors.

Remove the temporary import before committing.

- [ ] **Step 3: Commit**

```bash
git add src/components/GolfFlightViz.astro
git commit -m "feat: add GolfFlightViz Three.js scene and ball animation"
```

---

### Task 4: HUD overlays — D-Plane and Club Face SVGs

Extend the `<script>` with SVG helper functions and two HUD updaters. The D-Plane diagram shows face/path vectors from top-down (angles scaled 2.5× for readability). The Club Face diagram shows a top-down driver crown rotating 3× the face angle.

**Files:**
- Modify: `src/components/GolfFlightViz.astro` — insert into script before the bootstrap lines

- [ ] **Step 1: Insert SVG helpers and HUD updaters before the bootstrap lines**

Replace the bootstrap comment block at the bottom of the script:

```typescript
// ── Bootstrap (replaced by goTo() in Task 5) ─────────────────────────────
buildTrail(WINS[3]);
resetAnim();
tick();
```

with:

```typescript
// ── SVG helpers ───────────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgMk(tag: string, attrs: Record<string, string | number>): Element {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

function svgClear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function svgArrow(
  parent: Element,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
): void {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const ah = 8, aw = 3.2, ax = x2 - ux * ah, ay = y2 - uy * ah;
  parent.appendChild(svgMk('line', {
    x1, y1, x2: ax, y2: ay,
    stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round',
  }));
  parent.appendChild(svgMk('polygon', {
    points: `${x2},${y2} ${ax + nx * aw},${ay + ny * aw} ${ax - nx * aw},${ay - ny * aw}`,
    fill: color,
  }));
}

function svgFlag(parent: Element, cx: number, poleTop: number, poleBot: number): void {
  parent.appendChild(svgMk('line', {
    x1: cx, y1: poleBot, x2: cx, y2: poleTop,
    stroke: 'rgba(255,255,255,0.5)', 'stroke-width': 1.5, 'stroke-linecap': 'round',
  }));
  parent.appendChild(svgMk('polygon', {
    points: `${cx},${poleTop} ${cx + 10},${poleTop + 4.5} ${cx},${poleTop + 9}`,
    fill: '#dd2828',
  }));
}

function svgText(
  parent: Element, x: number, y: number,
  text: string, color: string, size = 9,
): void {
  const t = svgMk('text', {
    x, y, fill: color, 'font-size': size, 'font-family': 'monospace',
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    'font-weight': 600, 'letter-spacing': '0.04em',
  });
  t.textContent = text;
  parent.appendChild(t);
}

// ── D-Plane HUD ───────────────────────────────────────────────────────────
// Angles scaled 2.5× so small real-world differences (e.g. ±2° vs ±10°) are clearly distinct

const dplaneSvg   = wrap.querySelector('.gfv-dplane-svg')!;
const DPLANE_SCALE = 2.5;

function updateDPlane(w: GolfWindow): void {
  svgClear(dplaneSvg);
  const cx = 71, cy = 82, r = 48;
  const fa = w.faceAngle * DPLANE_SCALE * Math.PI / 180;
  const pa = w.pathAngle * DPLANE_SCALE * Math.PI / 180;
  const fx = cx + Math.sin(fa) * r, fy = cy - Math.cos(fa) * r;
  const px = cx + Math.sin(pa) * r, py = cy - Math.cos(pa) * r;

  // Dashed target line + flag
  dplaneSvg.appendChild(svgMk('line', {
    x1: cx, y1: cy, x2: cx, y2: cy - r,
    stroke: 'rgba(255,255,255,0.18)', 'stroke-width': 1, 'stroke-dasharray': '3,3',
  }));
  svgFlag(dplaneSvg, cx, cy - r - 18, cy - r - 2);

  // D-plane shaded sector between face and path
  if (Math.abs(w.faceAngle - w.pathAngle) > 1) {
    dplaneSvg.appendChild(svgMk('path', {
      d: `M ${cx} ${cy} L ${fx} ${fy} L ${px} ${py} Z`,
      fill: 'rgba(255,255,255,0.07)',
    }));
  }

  svgArrow(dplaneSvg, cx, cy, fx, fy, '#4ade80'); // FACE — green
  svgArrow(dplaneSvg, cx, cy, px, py, '#fbbf24'); // PATH — amber
  dplaneSvg.appendChild(svgMk('circle', { cx, cy, r: 5, fill: 'white' }));

  // Labels positioned beyond arrow tips, clamped inside viewBox
  let fLx = Math.max(12, Math.min(130, cx + Math.sin(fa) * (r + 13)));
  let fLy = Math.max(8,  Math.min(118, cy - Math.cos(fa) * (r + 13)));
  let pLx = Math.max(12, Math.min(130, cx + Math.sin(pa) * (r + 13)));
  let pLy = Math.max(8,  Math.min(118, cy - Math.cos(pa) * (r + 13)));
  // Nudge apart when angles nearly identical (Straight window)
  if (Math.abs(w.faceAngle - w.pathAngle) < 2) { fLy -= 6; pLy += 6; }

  svgText(dplaneSvg, fLx, fLy, 'FACE', '#4ade80');
  svgText(dplaneSvg, pLx, pLy, 'PATH', '#fbbf24');
}

// ── Club Face HUD ─────────────────────────────────────────────────────────
// Driver crown rotated 3× face angle so small real-world angles are visibly distinct

const cfSvg     = wrap.querySelector('.gfv-cf-svg')!;
const cfStateEl = wrap.querySelector<HTMLElement>('.gfv-cf-state')!;
const FACE_SCALE = 3.0;

function faceColorCss(fa: number): string {
  return fa > 1 ? '#f47730' : fa < -1 ? '#4f8ef7' : '#d8dce4';
}

function updateClubFace(w: GolfWindow): void {
  svgClear(cfSvg);
  const fa = w.faceAngle;
  const fc = faceColorCss(fa);
  const cx = 71, cy = 58, hw = 36;

  // Dashed target line + flag
  cfSvg.appendChild(svgMk('line', {
    x1: cx, y1: 12, x2: cx, y2: cy,
    stroke: 'rgba(255,255,255,0.18)', 'stroke-width': 1, 'stroke-dasharray': '3,3',
  }));
  svgFlag(cfSvg, cx, 2, 14);

  // Dashed square reference line (where face would be at 0°)
  cfSvg.appendChild(svgMk('line', {
    x1: cx - hw - 6, y1: cy, x2: cx + hw + 6, y2: cy,
    stroke: 'rgba(255,255,255,0.18)', 'stroke-width': 1, 'stroke-dasharray': '4,3',
  }));

  // Club head group — rotated by fa × FACE_SCALE around face center
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('transform', `rotate(${fa * FACE_SCALE}, ${cx}, ${cy})`);

  // Driver crown body (top-down silhouette)
  g.appendChild(svgMk('path', {
    d: [
      `M ${cx - hw},${cy}`,
      `L ${cx + hw},${cy}`,
      `Q ${cx + hw + 8},${cy} ${cx + hw + 8},${cy + 10}`,
      `Q ${cx + hw + 4},${cy + 32} ${cx + 14},${cy + 36}`,
      `Q ${cx},${cy + 38} ${cx - 14},${cy + 36}`,
      `Q ${cx - hw - 4},${cy + 32} ${cx - hw - 8},${cy + 10}`,
      `Q ${cx - hw - 8},${cy} ${cx - hw},${cy}`,
      'Z',
    ].join(' '),
    fill: 'rgba(48,54,78,0.92)',
    stroke: 'rgba(180,190,220,0.2)',
    'stroke-width': 1,
  }));

  // Groove lines (subtle depth cues)
  for (let i = 1; i <= 5; i++) {
    g.appendChild(svgMk('line', {
      x1: cx - hw + 2, y1: cy + i * 5,
      x2: cx + hw - 2, y2: cy + i * 5,
      stroke: 'rgba(255,255,255,0.06)', 'stroke-width': 0.8,
    }));
  }

  // Hosel shadow (heel side = left)
  g.appendChild(svgMk('ellipse', {
    cx: cx - hw + 4, cy: cy + 3, rx: 5, ry: 4,
    fill: 'rgba(100,105,135,0.55)',
  }));

  // Face edge — color encodes state: blue=closed, orange=open, silver=square
  g.appendChild(svgMk('line', {
    x1: cx - hw, y1: cy, x2: cx + hw, y2: cy,
    stroke: fc, 'stroke-width': 3.5, 'stroke-linecap': 'round',
  }));

  // Deviation arc on the target side (from square to current angle)
  if (Math.abs(fa) > 1) {
    const arcR    = 14;
    const startAng = -Math.PI / 2;
    const endAng   = -Math.PI / 2 + (fa * FACE_SCALE * Math.PI / 180);
    const sx = cx + arcR * Math.cos(startAng);
    const sy = cy + arcR * Math.sin(startAng);
    const ex = cx + arcR * Math.cos(endAng);
    const ey = cy + arcR * Math.sin(endAng);
    const sweep = fa * FACE_SCALE > 0 ? 1 : 0;
    g.appendChild(svgMk('path', {
      d: `M ${sx} ${sy} A ${arcR} ${arcR} 0 0 ${sweep} ${ex} ${ey}`,
      fill: 'none', stroke: fc, 'stroke-width': 1.5, opacity: 0.75,
    }));
  }

  cfSvg.appendChild(g);

  // State label below the SVG
  const stateStr = fa > 1 ? 'OPEN' : fa < -1 ? 'CLOSED' : 'SQUARE';
  const angleStr = fa === 0 ? '0°' : `${fa > 0 ? '+' : ''}${fa}°`;
  cfStateEl.textContent = `${stateStr} (${angleStr})`;
  cfStateEl.style.color = fc;
}

// ── Bootstrap ─────────────────────────────────────────────────────────────
buildTrail(WINS[3]);
updateDPlane(WINS[3]);
updateClubFace(WINS[3]);
resetAnim();
tick();
```

- [ ] **Step 2: Verify HUDs in dev server**

Both HUDs should now appear:
- Bottom-left: D-Plane diagram with green FACE arrow (slightly right, Draw), amber PATH arrow (further right, In→Out), flag at top, shaded sector between
- Top-right: Driver crown slightly rotated, face edge is blue (closed relative to path for Draw), state label reads `CLOSED (−2°)` — wait, Draw has faceAngle=+2, so state is `OPEN (+2°)`. Verify the arc colors and state label are consistent.

No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/GolfFlightViz.astro
git commit -m "feat: add D-Plane and Club Face HUD overlays to GolfFlightViz"
```

---

### Task 5: Window navigation — minimap, nav buttons, shot label, keyboard

Wire `goTo(idx)` to update every element simultaneously on window change. Build the 3×3 minimap with clickable cells, hook up the ‹/› buttons, and add keyboard shortcuts.

**Files:**
- Modify: `src/components/GolfFlightViz.astro` — extend script

- [ ] **Step 1: Add DOM refs for nav elements**

Insert the following immediately after the `const cfStateEl` declaration:

```typescript
const shotLabelEl = wrap.querySelector<HTMLElement>('.gfv-label')!;
const shotSubEl   = wrap.querySelector<HTMLElement>('.gfv-sub')!;
const minimapEl   = wrap.querySelector<HTMLElement>('.gfv-minimap')!;
const counterEl   = wrap.querySelector<HTMLElement>('.gfv-nav-counter')!;
const prevBtn     = wrap.querySelector<HTMLButtonElement>('.gfv-nav-prev')!;
const nextBtn     = wrap.querySelector<HTMLButtonElement>('.gfv-nav-next')!;
```

- [ ] **Step 2: Build minimap cells**

Insert after the DOM refs:

```typescript
const MM_LABELS = [
  'Hook',    'Pull\nHook', 'Pull',
  'Draw',    'Straight',   'Fade',
  'Push',    'Push\nSlice','Slice',
];

const mmCells: HTMLDivElement[] = MM_LABELS.map((lbl, i) => {
  const cell = document.createElement('div');
  cell.className = 'gfv-mm-cell';
  cell.innerHTML = lbl.replace('\n', '<br>');
  cell.addEventListener('click', () => goTo(i));
  minimapEl.appendChild(cell);
  return cell;
});
```

- [ ] **Step 3: Add `goTo()` function**

Insert after the minimap setup (before the bootstrap block):

```typescript
let cur = 3;

function goTo(idx: number): void {
  cur = idx;
  const w = WINS[idx];

  buildTrail(w);
  resetAnim();
  updateDPlane(w);
  updateClubFace(w);

  shotLabelEl.textContent = w.label;
  const fa = `${w.faceAngle >= 0 ? '+' : ''}${w.faceAngle}°`;
  const pa = `${w.pathAngle >= 0 ? '+' : ''}${w.pathAngle}°`;
  shotSubEl.textContent = `FACE: ${w.face} (${fa})  ·  PATH: ${w.path} (${pa})`;

  mmCells.forEach((c, i) => c.classList.toggle('is-active', i === idx));
  counterEl.textContent = `${idx + 1} / 9`;
}

prevBtn.addEventListener('click', () => goTo((cur + 8) % 9));
nextBtn.addEventListener('click', () => goTo((cur + 1) % 9));

window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft')  { goTo((cur + 8) % 9); return; }
  if (e.key === 'ArrowRight') { goTo((cur + 1) % 9); return; }
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 9) goTo(n - 1);
});
```

- [ ] **Step 4: Replace the bootstrap block**

Replace:
```typescript
// ── Bootstrap ─────────────────────────────────────────────────────────────
buildTrail(WINS[3]);
updateDPlane(WINS[3]);
updateClubFace(WINS[3]);
resetAnim();
tick();
```

with:

```typescript
// ── Bootstrap ─────────────────────────────────────────────────────────────
goTo(3); // Draw
tick();
```

- [ ] **Step 5: Full interactivity check**

In the dev server:
- Click all 9 minimap cells — label, sub-label, arc color, D-Plane, Club Face all update correctly
- ‹ / › buttons cycle through all 9 windows without skipping or wrapping incorrectly
- Arrow keys work (← / →)
- Number keys 1–9 jump directly to the right window
- Active minimap cell highlights correctly

- [ ] **Step 6: Commit**

```bash
git add src/components/GolfFlightViz.astro
git commit -m "feat: add window navigation and minimap to GolfFlightViz"
```

---

### Task 6: Create the MDX blog post

Write the full post with all six content sections from the spec, embedding `<GolfFlightViz />` inline between the 9-window table and the reading instructions paragraph.

**Files:**
- Create: `src/content/posts/golf-ball-flight-laws.mdx`

- [ ] **Step 1: Create the file**

Create `src/content/posts/golf-ball-flight-laws.mdx`:

````mdx
---
title: "The 9 Windows: Golf's Ball Flight Laws Explained"
description: "How face angle and swing path combine to produce every possible ball flight — and what Tiger's 9 window drill teaches us about controlling them."
topic: golf
tags: [golf, physics, ball-flight, d-plane]
publishedAt: 2026-04-26
published: false
postLayout: longform
---

import GolfFlightViz from '../../components/GolfFlightViz.astro';

Tiger Woods has a practice drill he calls the 9 windows. The goal is simple to describe and demanding to execute: hit nine different types of shots, one after another, each intentionally different from the last. A high draw, then a high straight, then a high fade. Drop to medium height and repeat. Three rows, three columns. Nine distinct ball flights, produced by systematically varying exactly two things: where your clubface points at impact, and what direction your club is swinging through the ball.

Most golfers who slice the ball do not understand why they slice it. They think about swinging left, or keeping their elbow tucked, or rotating their forearms. What they rarely think about — because nobody told them — is the precise mathematical relationship between face angle and swing path that determines every shot shape. Once you understand it, golf's ball flight stops looking like an unpredictable mystery and starts looking like a system with exactly two inputs.

This is that system.

---

## The D-Plane

When a golf club strikes a ball, two things determine where the ball goes: **face angle** and **swing path** (also called club path).

**Face angle** is where the clubface is pointing at the moment of impact — measured relative to the target line. Aim the face left, and the face is closed. Aim it right, it's open. Square means pointing directly at the target.

**Swing path** is the direction the club head is traveling through the impact zone — also measured relative to the target line. A path moving right of the target (for a right-handed golfer) is in-to-out. A path moving left is out-to-in.

The old instruction model said the ball starts in the direction of the swing path and curves based on the spin imparted by the face. TrackMan launch monitor data showed this was wrong. The ball actually starts **predominantly in the direction the face is pointing** — roughly 75–80% of its launch direction is determined by face angle, not path. The path matters, but primarily for curve.

The physics behind this is called **D-Plane theory**, introduced by physicist Theodore Jorgensen and popularized by coaches using launch monitor technology. The ball starts in the direction between the face and path, weighted heavily toward the face, and then curves away from the path. A face open to the path imparts sidespin that curves the ball right (for right-handers). A face closed to the path curves it left.

The key relationship: **face-to-path difference determines curve**. A face 5° open to the path will fade. A face 5° closed to the path will draw. The size of the difference determines how much the ball curves.

---

## The 9 Windows

Three face positions × three swing paths = nine distinct outcomes. Tiger's drill is a structured tour through all of them.

| | **In-to-Out Path** | **Straight Path** | **Out-to-In Path** |
|---|---|---|---|
| **Closed Face** | Hook | Pull Hook | Pull |
| **Square Face** | Draw | Straight | Fade |
| **Open Face** | Push | Push Slice | Slice |

The face position describes where the face points relative to the target at impact. The path describes the direction the club is traveling. Together they determine both where the ball starts and how much it curves.

Explore each window below:

<GolfFlightViz />

**Reading the visualization:** The ghost trail shows the full trajectory. The D-Plane diagram (bottom-left) shows face and path directions from a top-down view — the shaded area between them is the D-plane, and the ball launches into it. The club face view (top-right) shows how far the face is open or closed relative to the square reference line. Use the minimap or ← → keys to switch between all nine shots.

---

## Appendix A: The Banana Slice and the Pull Hook

The outer corners of the 9-window grid — Hook and Slice — produce the most exaggerated ball flights because both conditions amplify each other.

A **slice** (bottom-right cell): the face is wide open *and* the path is out-to-in. The ball starts right because the face points right. Then it curves further right because the face is even more open relative to the already-rightward path. Beginners trying to fix a slice often swing harder out-to-in to correct a perceived leftward miss, which makes the path worse and amplifies the slice.

A **banana slice** is the same scenario made extreme: a face 15–20° open, a path 10–15° out-to-in. The ball starts well right of target and curves dramatically further right, sometimes beyond 90° of total deviation.

A **hook** (top-left cell): face very closed, path very in-to-out. The ball starts left and curves further left. Beginners who over-correct a slice by closing the face — without fixing the path — often create this.

The fix for both: narrow the face-to-path angle. You can adjust the face, the path, or both.

---

## Appendix B: Gear Effect

There is a third factor that modifies ball flight from any given face and path combination: where on the face you actually strike the ball.

A modern driver face is curved — both horizontally (bulge) and vertically (roll). When you strike the ball off-center, the face twists slightly at impact. On a toe strike, the face twists open momentarily, imparting extra draw spin. A heel strike twists the face closed, imparting extra fade spin.

This is **gear effect**, named by analogy to meshing gears. The ball and face behave like two gears at the contact point: the face moving one way causes the ball to spin the other.

The practical implications:

- A toe strike curves left more than face/path numbers alone predict
- A heel strike curves right more
- The bulge on the face is intentionally designed to compensate: the face naturally aims further right for toe hits (to pre-correct for the expected leftward gear effect) and further left for heel hits

Low-handicap players who fade the ball often tee it slightly toward the heel side, using gear effect to add draw spin that counteracts their natural fade — without changing their swing.

Understanding face, path, and gear effect together gives you the full picture. Face and path set the baseline trajectory. Gear effect is the correction term. Tiger's 9 windows drill is about mastering face and path. Gear effect, when it enters, is a refinement layered on top of an already well-controlled shot.
````

- [ ] **Step 2: Type-check and build**

```bash
npx astro check
npm run build
```

Expected: zero type errors, build succeeds with no errors.

- [ ] **Step 3: Review the post end-to-end in dev server**

```bash
npm run dev
```

Navigate to `http://localhost:4321/blog/golf-ball-flight-laws`. Verify:

- Longform (wide) layout applied — `article-wrap--wide` class present
- All six sections render with correct heading hierarchy (h2 for D-Plane, 9 Windows, Appendices)
- 9-window table renders correctly
- `<GolfFlightViz />` appears inline, starts on Draw (window 4/9)
- All 9 windows work, minimap highlights correctly, animation loops
- D-Plane and Club Face HUDs update on every window switch
- Reading instructions paragraph appears below the viz
- No console errors

- [ ] **Step 4: Commit**

```bash
git add src/content/posts/golf-ball-flight-laws.mdx
git commit -m "feat: add golf ball flight laws blog post"
```

---

## Self-Review

**Spec coverage check:**
- ✅ `golf` topic added to `content.config.ts` — Task 1
- ✅ `GolfFlightViz.astro` — Tasks 2–5
- ✅ `GolfArc` Hermite curve (X: cubic Hermite, Z: linear, Y: sine) — Task 3
- ✅ Nine window data with faceAngle/pathAngle/endX/peakH — Task 3
- ✅ `THREE.NoToneMapping`, direct hex colors — Task 3
- ✅ Camera fixed at `(0, 0.42, 2.8)` looking at `(0, 0.18, −10)` — Task 3
- ✅ Ghost trail tube, 30% opacity, color matches arc type — Task 3
- ✅ Arc colors: blue (#4f8ef7) draw/hook, orange (#f47730) fade/slice, silver straight — Task 3
- ✅ D-Plane HUD with 2.5× angle scaling, flag, shaded sector — Task 4
- ✅ Club Face HUD with 3× angle scaling, driver crown, state label — Task 4
- ✅ Minimap 3×3 with `is-active` class, click-to-jump — Task 5
- ✅ ‹/› nav buttons + ← → keyboard + number keys 1–9 — Task 5
- ✅ Shot label + face/path subtitle updates per window — Task 5
- ✅ MDX post: hook, D-Plane, 9 windows, viz embed, Appendix A, Appendix B — Task 6
- ✅ `published: false`, `postLayout: longform`, `topic: golf` — Task 6

**Placeholder scan:** All steps contain exact code. No "TBD", no "handle edge cases", no "similar to above."

**Type consistency:**
- `GolfWindow` defined in Task 3, used in `buildTrail`, `updateDPlane`, `updateClubFace`, `goTo` — all consistent ✅
- `GolfArc` constructor `(faceAngle, ex, ez, ph)` matches call `new GolfArc(w.faceAngle, w.endX, END_Z, w.peakH)` ✅
- `svgMk`, `svgClear`, `svgArrow`, `svgFlag`, `svgText` defined in Task 4 before first use ✅
- `updateDPlane`, `updateClubFace`, `buildTrail`, `resetAnim` defined before `goTo` calls them ✅
- All DOM queries use `wrap.querySelector()` — scoped to component instance ✅
- `.gfv-mm-cell` uses `:global()` in CSS because cells are JS-injected ✅
