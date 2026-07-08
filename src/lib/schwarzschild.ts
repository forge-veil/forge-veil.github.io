// Geometric units: G = c = 1. Schwarzschild radius rs = 2M.

/** The Schwarzschild factor (1 − rs/r): appears in g_tt and (inverted) in g_rr. */
export function metricFactor(r: number, rs: number): number {
  return 1 - rs / r;
}

/** Flamm's paraboloid: embedding height of the spatial slice, z(r) = 2√(rs(r−rs)). */
export function flammZ(r: number, rs: number): number {
  if (r < rs) return 0;
  return 2 * Math.sqrt(rs * (r - rs));
}

/** Test-particle orbit in the equatorial plane, integrating the Binet equation. */
export function computeOrbit(opts: {
  rs: number; L: number; r0: number; dPhi: number; steps: number; relativistic?: boolean;
}): { x: number; y: number }[] {
  const { rs, L, r0, dPhi, steps, relativistic = true } = opts;
  const M = rs / 2;
  // u'' = f(u) = -u + M/L^2 + (relativistic ? 3M u^2 : 0)
  const accel = (u: number) =>
    -u + M / (L * L) + (relativistic ? 3 * M * u * u : 0);

  let u = 1 / r0;      // start at perihelion
  let du = 0;          // du/dφ = 0 there
  const pts: { x: number; y: number }[] = [];
  for (let s = 0; s <= steps; s++) {
    const phi = s * dPhi;
    const r = 1 / u;
    pts.push({ x: r * Math.cos(phi), y: r * Math.sin(phi) });
    // RK4 step on (u, du)
    const k1u = du,             k1v = accel(u);
    const k2u = du + 0.5 * dPhi * k1v, k2v = accel(u + 0.5 * dPhi * k1u);
    const k3u = du + 0.5 * dPhi * k2v, k3v = accel(u + 0.5 * dPhi * k2u);
    const k4u = du + dPhi * k3v,       k4v = accel(u + dPhi * k3u);
    u  += (dPhi / 6) * (k1u + 2 * k2u + 2 * k3u + k4u);
    du += (dPhi / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
  }
  return pts;
}

/** Photon path (null geodesic) in the equatorial plane. */
export function computeLightRay(opts: {
  rs: number; b: number; dPhi: number; steps: number;
}): { x: number; y: number }[] {
  const { rs, b, dPhi, steps } = opts;
  const M = rs / 2;
  const accel = (u: number) => -u + 3 * M * u * u;

  // Start far away on the incoming asymptote: u≈0, du/dφ ≈ 1/b.
  let u = 1e-6;
  let du = 1 / b;
  const pts: { x: number; y: number }[] = [];
  for (let s = 0; s <= steps; s++) {
    const phi = s * dPhi;
    if (u <= 0) break;            // escaped to infinity
    const r = 1 / u;
    pts.push({ x: r * Math.cos(phi), y: r * Math.sin(phi) });
    const k1u = du,             k1v = accel(u);
    const k2u = du + 0.5 * dPhi * k1v, k2v = accel(u + 0.5 * dPhi * k1u);
    const k3u = du + 0.5 * dPhi * k2v, k3v = accel(u + 0.5 * dPhi * k2u);
    const k4u = du + dPhi * k3v,       k4v = accel(u + dPhi * k3u);
    u  += (dPhi / 6) * (k1u + 2 * k2u + 2 * k3u + k4u);
    du += (dPhi / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
  }
  return pts;
}

/** Total change of heading between the ray's first and last segments (radians). */
export function deflectionAngle(rays: { x: number; y: number }[]): number {
  if (rays.length < 4) return 0;
  const a0 = Math.atan2(rays[1].y - rays[0].y, rays[1].x - rays[0].x);
  const n = rays.length;
  const a1 = Math.atan2(rays[n - 1].y - rays[n - 2].y, rays[n - 1].x - rays[n - 2].x);
  let d = a1 - a0;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

/** Height of a ball thrown up at t=0 and caught at t=T, peaking `apex` at t=T/2. */
export function throwHeight(t: number, T: number, apex: number): number {
  const s = t / T;
  return 4 * apex * s * (1 - s);
}

/** Weak-field local clock rate at a given height (1 at height 0). */
export function clockRate(height: number, gTilt: number): number {
  return 1 + gTilt * height;
}
