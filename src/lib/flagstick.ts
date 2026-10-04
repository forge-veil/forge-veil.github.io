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
  // Fiberglass flexes: a gentle bounce that dies quickly on harder hits
  { id: 'fiberglass', label: 'Fiberglass', diameter: 0.5, restitution: 0.36, softSpeed: 30, tangentialLoss: 0 },
  { id: 'tapered', label: 'Tapered aluminum', diameter: 0.75, restitution: 0.55, softSpeed: 30, tangentialLoss: 0 },
  { id: 'dual', label: 'Dual-diameter aluminum', diameter: 0.7, restitution: 0.6, softSpeed: 30, tangentialLoss: 0 },
];

export interface SimParams {
  offset: number; // lateral distance of the ball's line from the cup centre
  speed: number; // ball speed as it reaches the front edge of the cup, in/s
  pin: Pin;
  captureDepth?: number;
  lipBounce?: number; // restitution of the ball off the cup's edge
  spinGrip?: number; // how strongly topspin makes a ball climb the lip it hits
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
const WALL_BOUNCE = 0.3; // restitution off the cup wall below the lip
const MAX_HOP = 0.12; // inches: the most a lip contact can pop the ball above the green

/** Ball speed at the hole for a putt that would roll `feet` past it. */
export function speedForOverrun(feet: number): number {
  return Math.sqrt(2 * GREEN_DECEL * feet * 12);
}

export function simulate(p: SimParams): SimResult {
  const captureDepth = p.captureDepth ?? DEFAULT_CAPTURE_DEPTH;
  const lipBounce = p.lipBounce ?? DEFAULT_LIP_BOUNCE;
  const spinGrip = p.spinGrip ?? DEFAULT_SPIN_GRIP;
  const R = CUP_RADIUS;
  const r = BALL_RADIUS;
  const pinR = p.pin.diameter / 2;
  const contactR = pinR + r;

  // Full 3D point-ball model. Z is the height of the ball's centre above the
  // green surface, so a ball resting on the green has Z = r. The cup's edge is
  // a ring of radius R at Z = 0: the ball rolls over it, pivots on it, and
  // bounces off it along the line from the contact point to its centre. That
  // is what turns a ball that catches the lip, sometimes sharply.
  let x = p.offset;
  let y = START_Y;
  let Z = r;
  let vx = 0;
  let vz = 0;
  // Back-solve the starting speed so the ball arrives at the cup at p.speed
  const runUp = -Math.sqrt(Math.max(R * R - x * x, 0)) - START_Y;
  let vy = Math.sqrt(p.speed ** 2 + 2 * GREEN_DECEL * Math.max(runUp, 0));

  // Topspin axis, fixed by the direction the ball was rolling on the green
  let spinX = 0;
  let spinY = 1;
  let hitPin = false;
  let touchedLip = false;
  let overCup = false;
  let exit: Exit | null = null;
  const path: PathPoint[] = [];
  const done = (made: boolean): SimResult => {
    if (p.record) path.push({ x, y, z: Z - r });
    return { made, hitPin, exit: made ? null : exit, path };
  };

  for (let step = 0, t = 0; t < MAX_T; step++, t += DT) {
    if (p.record && step % RECORD_EVERY === 0) path.push({ x, y, z: Z - r });

    const d0 = Math.hypot(x, y);
    const onGreen = d0 >= R && Z <= r + 1e-4;
    if (onGreen) {
      // Rolling on the green: constant deceleration, no vertical motion
      const sp = Math.hypot(vx, vy);
      if (sp <= GREEN_DECEL * DT) break; // stopped
      spinX = vx / sp;
      spinY = vy / sp;
      const k = (sp - GREEN_DECEL * DT) / sp;
      vx *= k;
      vy *= k;
      if (vz < 0) vz = 0;
    } else {
      vz -= G * DT;
    }

    x += vx * DT;
    y += vy * DT;
    Z += vz * DT;
    if (y > 90 || Math.abs(x) > 90) break;

    const d = Math.hypot(x, y) || 1e-9;
    const ux = x / d;
    const uy = y / d;

    if (d < R) {
      overCup = true;
      if (Z - r <= -captureDepth) return done(true);
    }

    // Cup wall below the lip keeps a dropped ball inside
    if (Z < 0 && d > R - r) {
      x = ux * (R - r);
      y = uy * (R - r);
      const vr = vx * ux + vy * uy;
      if (vr > 0) {
        vx -= (1 + WALL_BOUNCE) * vr * ux;
        vy -= (1 + WALL_BOUNCE) * vr * uy;
      }
    }

    // The lip: nearest point of the rim ring to the ball's centre
    const ex = ux * R;
    const ey = uy * R;
    const Dx = x - ex;
    const Dy = y - ey;
    const dist = Math.hypot(Dx, Dy, Z);
    if (dist < r && Z > -r) {
      const nx = Dx / dist;
      const ny = Dy / dist;
      const nz = Z / dist;
      x = ex + nx * r;
      y = ey + ny * r;
      Z = nz * r;
      const vn = vx * nx + vy * ny + vz * nz;
      // Topspin only drives the ball into the lip it is rolling toward; after a
      // bounce back across the cup the same spin is backspin and holds it in.
      const fx = spinX;
      const fy = spinY;
      const rollingOut = fx * ux + fy * uy > 0 && vx * fx + vy * fy > 0;
      if (vn < 0) {
        const j = (1 + lipBounce) * vn;
        vx -= j * nx;
        vy -= j * ny;
        vz -= j * nz;
        touchedLip = true;
        // Topspin: a ball rolling into the lip grips it and climbs over it in
        // the direction it was travelling. This is what pops firm putts out.
        if (rollingOut) {
          const fn = fx * nx + fy * ny; // travel direction projected onto the contact surface
          const tx = fx - fn * nx;
          const ty = fy - fn * ny;
          const tz = -fn * nz;
          const tl = Math.hypot(tx, ty, tz);
          if (tl > 1e-6 && tz > 0) {
            // Grip works when the ball meets the lip high (contact under it). A
            // ball that has already sunk meets the wall side-on and stays in.
            const climb = (spinGrip * -vn * nz * nz) / tl;
            vx += climb * tx;
            vy += climb * ty;
            vz += climb * tz;
          }
        }
        // A putt never leaves the ground off the lip: it climbs only as far as
        // the green plus a small hop. The rest of the kick goes sideways, in
        // the direction the lip shoves it, which is what makes a lip-out turn.
        const vzMax = Math.sqrt(2 * G * Math.max(r - Z + MAX_HOP, 0));
        if (vz > vzMax) {
          const excess = vz - vzMax;
          vz = vzMax;
          const hl = Math.hypot(nx, ny);
          if (hl > 1e-6) {
            vx += (excess * nx) / hl;
            vy += (excess * ny) / hl;
          }
        }
      }
    } else if (Math.hypot(x, y) >= R && Z < r) {
      // Beyond the lip the green carries the ball
      Z = r;
      if (vz < 0) vz = 0;
    }

    // Flagstick: a vertical cylinder at the centre of the cup
    if (pinR > 0) {
      const dp = Math.hypot(x, y);
      if (dp <= contactR && vx * x + vy * y < 0) {
        hitPin = true;
        const nx = x / dp;
        const ny = y / dp;
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
    }

    // Back out on the green after being over the cup: classify how it left
    if (overCup && exit === null && Math.hypot(x, y) > R + r && Z >= r - 1e-4) {
      const turn = Math.abs(Math.atan2(vx, vy)) * (180 / Math.PI);
      exit = touchedLip && turn > 12 ? 'lip' : 'back';
    }
  }

  return done(false);
}

export const DEFAULT_LIP_BOUNCE = 0.35;
let DEFAULT_SPIN_GRIP = 0; // set once spinGripFor is defined, below

/** A ball this far below rest is inside the cup's walls and cannot get out. */
export const DEFAULT_CAPTURE_DEPTH = 1.6;

/**
 * Spin grip chosen so a dead-centre putt with the pin out stays in up to
 * `limitFeet` of overrun and pops out beyond it (Mase: in at 8 ft, out at 9+).
 */
export function spinGripFor(limitFeet = 8.5): number {
  const speed = speedForOverrun(limitFeet);
  let lo = 0;
  let hi = 12;
  for (let i = 0; i < 34; i++) {
    const mid = (lo + hi) / 2;
    if (simulate({ offset: 0, speed, pin: PINS[0], spinGrip: mid }).made) lo = mid;
    else hi = mid;
  }
  return hi;
}

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

DEFAULT_SPIN_GRIP = spinGripFor();
export { DEFAULT_SPIN_GRIP };
