// Putt-at-the-cup physics for the flagstick lab.
//
// Units are inches and seconds. The hole is centred at the origin and the
// ball rolls in the +y direction. On the green the ball decelerates at a
// constant rate; once its centre is over the cup it is in free fall with no
// horizontal friction. It is holed once it has dropped `captureDepth` below
// the rim; if it reaches the rim before that, it pops out and keeps rolling,
// provided it still has the energy to climb back over the edge. The
// flagstick is a vertical cylinder at the cup centre.

export const CUP_RADIUS = 2.125; // 4.25" cup
export const BALL_RADIUS = 0.84; // 1.68" ball
export const G = 386.09; // in/s²
export const GREEN_DECEL = 21.6; // in/s², roughly a stimp-10 green

export interface Pin {
  id: string;
  label: string;
  diameter: number; // at ball height, inches (0 = pin out)
  restitution: number; // normal bounce coefficient for a gentle contact
  softSpeed?: number; // in/s; harder hits bounce less: e = e0 / (1 + vn / softSpeed)
  tangentialLoss: number; // fraction of glancing speed absorbed by the stick
}

// Diameters and bounce values are modelling assumptions, tuned so the
// off-centre make rates land near Mase's measurements.
export const PINS: Pin[] = [
  { id: 'out', label: 'Pin out', diameter: 0, restitution: 0, tangentialLoss: 0 },
  { id: 'fiberglass', label: 'Fiberglass', diameter: 0.5, restitution: 0.75, softSpeed: 60, tangentialLoss: 0 },
  { id: 'tapered', label: 'Tapered aluminum', diameter: 0.75, restitution: 0.8, softSpeed: 60, tangentialLoss: 0 },
  { id: 'dual', label: 'Dual-diameter aluminum', diameter: 0.7, restitution: 0.8, softSpeed: 60, tangentialLoss: 0 },
];

export interface SimParams {
  offset: number; // lateral distance of the ball's line from the cup centre
  speed: number; // ball speed as it reaches the front edge of the cup, in/s
  pin: Pin;
  captureDepth?: number;
  rimLoss?: number; // speed retained after popping out over the far rim
  record?: boolean;
}

export interface PathPoint {
  x: number;
  y: number;
  z: number;
}

export type Exit = 'lip' | 'back';

export interface SimResult {
  made: boolean;
  hitPin: boolean;
  /** How a missed ball that got over the cup left it: off the edge, or over the back */
  exit: Exit | null;
  path: PathPoint[];
}

const START_Y = -30; // Mase's ramp sat 2.5 ft short of the hole
const DT = 0.0002;
const MAX_T = 6;
const RECORD_EVERY = 25; // one point per 5 ms
const ROLL = 5 / 7; // a rolling ball accelerates at 5/7 of a sliding one

/** Ball speed at the hole for a putt that would roll `feet` past it. */
export function speedForOverrun(feet: number): number {
  return Math.sqrt(2 * GREEN_DECEL * feet * 12);
}

export function simulate(p: SimParams): SimResult {
  const captureDepth = p.captureDepth ?? DEFAULT_CAPTURE_DEPTH;
  const rimLoss = p.rimLoss ?? 0.7;
  const pinR = p.pin.diameter / 2;
  const contactR = pinR + BALL_RADIUS;
  const r = BALL_RADIUS;

  let x = p.offset;
  let y = START_Y;
  let z = 0;
  let vz = 0;
  // Back-solve the starting speed so the ball arrives at the cup at p.speed
  const runUp = -Math.sqrt(Math.max(CUP_RADIUS ** 2 - x * x, 0)) - START_Y;
  let vx = 0;
  let vy = Math.sqrt(p.speed ** 2 + 2 * GREEN_DECEL * Math.max(runUp, 0));

  // green: rolling on the surface. edge: centre over the hole, ball pivoting
  // on the lip. air: falling free inside the cup.
  let phase: 'green' | 'edge' | 'air' = 'green';
  let hitPin = false;
  let exit: Exit | null = null;
  const path: PathPoint[] = [];
  const done = (made: boolean): SimResult => {
    if (p.record) path.push({ x, y, z });
    return { made, hitPin, exit: made ? null : exit, path };
  };

  for (let step = 0, t = 0; t < MAX_T; step++, t += DT) {
    if (p.record && step % RECORD_EVERY === 0) path.push({ x, y, z });

    if (phase !== 'air') {
      const sp = Math.hypot(vx, vy);
      if (sp <= GREEN_DECEL * DT) break; // stopped
      const k = (sp - GREEN_DECEL * DT) / sp;
      vx *= k;
      vy *= k;
    }

    if (phase === 'green') {
      x += vx * DT;
      y += vy * DT;
      if (Math.hypot(x, y) < CUP_RADIUS) phase = 'edge';
      if (y > 90 || Math.abs(x) > 90) break;
      continue;
    }

    if (phase === 'edge') {
      // The ball pivots on the lip at the point nearest its centre. Gravity's
      // torque about that point pulls it toward the middle of the hole, which
      // bends a glancing ball's path around the edge.
      const d = Math.hypot(x, y);
      const s = CUP_RADIUS - d; // how far the centre is inside the lip
      const nx = x / d;
      const ny = y / d;
      if (s <= 0) {
        // Back over the lip onto the green: a lip-out
        phase = 'green';
        z = 0;
        exit = 'lip';
        continue;
      }
      const sinT = Math.min(s / r, 0.999);
      const cosT = Math.sqrt(1 - sinT * sinT);
      const vIn = -(vx * nx + vy * ny); // speed toward the hole centre
      // It leaves the lip once the edge can no longer hold it on its arc
      if (sinT > 0.95 || (vIn > 0 && vIn * vIn >= G * r * cosT)) {
        phase = 'air';
        vz = -vIn * (sinT / cosT);
        continue;
      }
      const aIn = ROLL * G * sinT * cosT;
      vx -= nx * aIn * DT;
      vy -= ny * aIn * DT;
      x += vx * DT;
      y += vy * DT;
      z = r * cosT - r;
      continue;
    }

    // In the air over the cup: free fall, straight-line horizontal motion
    vz -= G * DT;
    z += vz * DT;
    if (z <= -captureDepth) return done(true);

    const d = Math.hypot(x, y);
    if (pinR > 0 && d <= contactR && vx * x + vy * y < 0) {
      hitPin = true;
      const nx = x / d;
      const ny = y / d;
      const vn = vx * nx + vy * ny;
      const tx = vx - vn * nx;
      const ty = vy - vn * ny;
      const keep = 1 - p.pin.tangentialLoss;
      const e = Math.min(
        0.95,
        p.pin.softSpeed ? p.pin.restitution / (1 + Math.abs(vn) / p.pin.softSpeed) : p.pin.restitution,
      );
      vx = tx * keep - e * vn * nx;
      vy = ty * keep - e * vn * ny;
      x = nx * contactR;
      y = ny * contactR;
    }

    x += vx * DT;
    y += vy * DT;

    if (Math.hypot(x, y) >= CUP_RADIUS && vx * x + vy * y > 0) {
      // At the far wall. It escapes only if, after the rim takes its share, it
      // still has the energy to lift its centre back up by the drop so far.
      const vh2 = (vx * vx + vy * vy) * rimLoss * rimLoss;
      if (vh2 < 2 * G * -z) {
        z = -captureDepth;
        return done(true);
      }
      phase = 'green';
      exit = 'back';
      z = 0;
      vx *= rimLoss;
      vy *= rimLoss;
    }
  }

  return done(false);
}

/**
 * Drop needed to hold the ball, chosen so a dead-centre putt with the pin out
 * stays in up to `limitFeet` of overrun (Mase: in at 8 ft, out at 9+).
 */
export function captureDepthFor(limitFeet = 8.5): number {
  const speed = speedForOverrun(limitFeet);
  let lo = 0.05;
  let hi = 3;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (simulate({ offset: 0, speed, pin: PINS[0], captureDepth: mid }).made) lo = mid;
    else hi = mid;
  }
  return lo;
}

export const DEFAULT_CAPTURE_DEPTH = captureDepthFor();

/** Deterministic PRNG so batches are reproducible in tests. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number): number {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface Shot {
  offset: number;
  speed: number;
  made: boolean;
  hitPin: boolean;
}

export interface BatchOptions {
  pin: Pin;
  n: number;
  overrunFeet: number;
  speedJitter?: number; // relative standard deviation
  rand?: () => number;
  /** Sample offsets from this range instead of the full cup width. */
  offsetRange?: [number, number];
}

/** Monte Carlo: lines spread uniformly across the cup, speed jittered. */
export function runBatch(o: BatchOptions): Shot[] {
  const rand = o.rand ?? Math.random;
  const base = speedForOverrun(o.overrunFeet);
  const jitter = o.speedJitter ?? 0.05;
  const [lo, hi] = o.offsetRange ?? [-CUP_RADIUS, CUP_RADIUS];
  const shots: Shot[] = [];
  for (let i = 0; i < o.n; i++) {
    const offset = lo + (hi - lo) * rand();
    const speed = Math.max(1, base * (1 + jitter * gaussian(rand)));
    const r = simulate({ offset, speed, pin: o.pin });
    shots.push({ offset, speed, made: r.made, hitPin: r.hitPin });
  }
  return shots;
}

/**
 * Lines that strike the stick but not squarely: the 72% of pin contacts
 * Mase tested. "Dead centre" is the inner 28% of the contact width.
 */
export function offCenterBand(pin: Pin): [number, number] {
  const contact = (pin.diameter > 0 ? pin.diameter : PINS[1].diameter) / 2 + BALL_RADIUS;
  return [0.28 * contact, contact];
}

/** Mase's measured off-centre make rates at 4.5 ft overrun (90 putts each). */
export const MASE_OFF_CENTER: Record<string, number> = {
  out: 81 / 90,
  fiberglass: 55 / 90,
  tapered: 32 / 90,
  dual: 34 / 90,
};
