// Surface: z(u,v) = amp * exp(-r² / (2σ²))
export function surfaceZ(u: number, v: number, amp: number, sigma: number): number {
  if (sigma <= 0) throw new RangeError('sigma must be greater than 0');
  return amp * Math.exp(-(u * u + v * v) / (2 * sigma * sigma));
}

// Metric tensor g_ij at (u,v) for the graph surface z(u,v)
// g = I + [∂z/∂u, ∂z/∂v]^T [∂z/∂u, ∂z/∂v]
export type Metric2x2 = [[number, number], [number, number]];

export function metricTensor(u: number, v: number, amp: number, sigma: number): Metric2x2 {
  if (sigma <= 0) throw new RangeError('sigma must be greater than 0');
  const e = Math.exp(-(u * u + v * v) / (2 * sigma * sigma));
  const zu = (-amp * u / (sigma * sigma)) * e;
  const zv = (-amp * v / (sigma * sigma)) * e;
  return [
    [1 + zu * zu, zu * zv],
    [zu * zv, 1 + zv * zv],
  ];
}

// Gaussian curvature K at (u,v) for z = amp*exp(-r²/2σ²)
// K = (f_uu*f_vv - f_uv²) / (1 + f_u² + f_v²)²
export function gaussianCurvature(u: number, v: number, amp: number, sigma: number): number {
  if (sigma <= 0) throw new RangeError('sigma must be greater than 0');
  const r2 = u * u + v * v;
  const s2 = sigma * sigma;
  const e = Math.exp(-r2 / (2 * s2));
  const fuu = (amp * (u * u / s2 - 1) / s2) * e;
  const fvv = (amp * (v * v / s2 - 1) / s2) * e;
  const fuv = (amp * u * v / (s2 * s2)) * e;
  const fu = (-amp * u / s2) * e;
  const fv = (-amp * v / s2) * e;
  const denom = 1 + fu * fu + fv * fv;
  return (fuu * fvv - fuv * fuv) / (denom * denom);
}
