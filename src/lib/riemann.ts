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

// Christoffel symbols Γ^k_{ij} computed numerically via finite differences of the metric.
// Returns gamma[k][i][j] for k,i,j ∈ {0,1}.
export function christoffelSymbols(
  u: number, v: number, amp: number, sigma: number
): [[[number,number],[number,number]],[[number,number],[number,number]]] {
  if (sigma <= 0) throw new RangeError('sigma must be greater than 0');
  const h = 1e-5;
  const g   = metricTensor(u,   v,   amp, sigma);
  const gu1 = metricTensor(u+h, v,   amp, sigma);
  const gum = metricTensor(u-h, v,   amp, sigma);
  const gv1 = metricTensor(u,   v+h, amp, sigma);
  const gvm = metricTensor(u,   v-h, amp, sigma);

  // dg[m][j][k] = ∂_m g_{jk},  m=0 → ∂/∂u,  m=1 → ∂/∂v
  const dg: [number[][], number[][]] = [
    [[0,0],[0,0]],
    [[0,0],[0,0]],
  ];
  for (let j = 0; j < 2; j++) {
    for (let k = 0; k < 2; k++) {
      dg[0][j][k] = (gu1[j][k] - gum[j][k]) / (2*h);
      dg[1][j][k] = (gv1[j][k] - gvm[j][k]) / (2*h);
    }
  }

  const [[g11,g12],[,g22]] = g;
  const det = g11*g22 - g12*g12;
  const ginv = [[g22/det, -g12/det], [-g12/det, g11/det]];

  // Γ^k_{ij} = ½ g^{kl} (∂_i g_{jl} + ∂_j g_{il} − ∂_l g_{ij})
  const gamma = [[[0,0],[0,0]],[[0,0],[0,0]]] as
    [[[number,number],[number,number]],[[number,number],[number,number]]];

  for (let k = 0; k < 2; k++) {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        let sum = 0;
        for (let l = 0; l < 2; l++) {
          sum += ginv[k][l] * (dg[i][j][l] + dg[j][i][l] - dg[l][i][j]);
        }
        gamma[k][i][j] = 0.5 * sum;
      }
    }
  }
  return gamma;
}
