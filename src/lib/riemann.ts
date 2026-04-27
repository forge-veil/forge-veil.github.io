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
  // h² × max(∂³g) ≪ 1 for amp≲2, sigma≳0.3; gives ~8 significant digits
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
  if (Math.abs(det) < 1e-12) throw new RangeError('metric tensor is singular or near-singular');
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

// RHS of geodesic ODE: d[u,v,vu,vv]/dt = [vu, vv, accel_u, accel_v]
function geodesicRHS(
  u: number, v: number, vu: number, vv: number,
  amp: number, sigma: number
): [number, number, number, number] {
  const G = christoffelSymbols(u, v, amp, sigma);
  const au = -(G[0][0][0]*vu*vu + 2*G[0][0][1]*vu*vv + G[0][1][1]*vv*vv);
  const av = -(G[1][0][0]*vu*vu + 2*G[1][0][1]*vu*vv + G[1][1][1]*vv*vv);
  return [vu, vv, au, av];
}

function rk4Step(
  u: number, v: number, vu: number, vv: number,
  dt: number, amp: number, sigma: number
): [number, number, number, number] {
  const [k1u,k1v,k1vu,k1vv] = geodesicRHS(u,v,vu,vv,amp,sigma);
  const [k2u,k2v,k2vu,k2vv] = geodesicRHS(u+dt*k1u/2,v+dt*k1v/2,vu+dt*k1vu/2,vv+dt*k1vv/2,amp,sigma);
  const [k3u,k3v,k3vu,k3vv] = geodesicRHS(u+dt*k2u/2,v+dt*k2v/2,vu+dt*k2vu/2,vv+dt*k2vv/2,amp,sigma);
  const [k4u,k4v,k4vu,k4vv] = geodesicRHS(u+dt*k3u,v+dt*k3v,vu+dt*k3vu,vv+dt*k3vv,amp,sigma);
  return [
    u  + dt*(k1u +2*k2u +2*k3u +k4u )/6,
    v  + dt*(k1v +2*k2v +2*k3v +k4v )/6,
    vu + dt*(k1vu+2*k2vu+2*k3vu+k4vu)/6,
    vv + dt*(k1vv+2*k2vv+2*k3vv+k4vv)/6,
  ];
}

function shoot(
  u0:number, v0:number, vu0:number, vv0:number,
  nSteps:number, amp:number, sigma:number
): Array<[number,number]> {
  const dt = 1.0 / nSteps;
  const path: Array<[number,number]> = [[u0,v0]];
  let [u,v,vu,vv] = [u0,v0,vu0,vv0];
  for (let i = 0; i < nSteps; i++) {
    [u,v,vu,vv] = rk4Step(u,v,vu,vv,dt,amp,sigma);
    path.push([u,v]);
  }
  return path;
}

// Connect (u0,v0) to (u1,v1) via the shortest geodesic using iterative shooting.
export function computeGeodesic(
  u0: number, v0: number, u1: number, v1: number,
  amp: number, sigma: number,
  nSteps = 60, nIter = 25
): Array<[number, number]> {
  const du = u1-u0, dv = v1-v0;
  const dist = Math.sqrt(du*du + dv*dv);
  if (dist < 1e-8) return [[u0,v0]];

  // Initial guess: straight-line velocity scaled to reach target in t=1
  let vu = du, vv = dv;
  let lastPath = shoot(u0, v0, vu, vv, nSteps, amp, sigma);

  for (let iter = 0; iter < nIter; iter++) {
    const [eu, ev] = lastPath[lastPath.length-1];
    const errU = eu-u1, errV = ev-v1;
    if (Math.sqrt(errU*errU + errV*errV) < 1e-5) return lastPath;
    vu -= errU * 0.6;
    vv -= errV * 0.6;
    lastPath = shoot(u0, v0, vu, vv, nSteps, amp, sigma);
  }
  console.warn('computeGeodesic: shooting did not converge', { u0, v0, u1, v1 });
  return lastPath;
}

// Parallel transport vector v0 along a coordinate path using ∇_γ' v = 0.
// Returns the transported vector at each path point.
export function parallelTransport(
  path: Array<[number, number]>,
  v0: [number, number],
  amp: number, sigma: number
): Array<[number, number]> {
  const vectors: Array<[number, number]> = [[v0[0], v0[1]]];
  for (let i = 0; i < path.length-1; i++) {
    const [u, v] = path[i];
    const [du, dv] = [path[i+1][0]-u, path[i+1][1]-v];
    const [wu, wv] = vectors[i];
    const G = christoffelSymbols(u, v, amp, sigma);
    // dw^k/ds = -Γ^k_{ij} (du^i/ds) w^j
    const dwu = -(G[0][0][0]*du*wu + G[0][0][1]*du*wv + G[0][1][0]*dv*wu + G[0][1][1]*dv*wv);
    const dwv = -(G[1][0][0]*du*wu + G[1][0][1]*du*wv + G[1][1][0]*dv*wu + G[1][1][1]*dv*wv);
    vectors.push([wu+dwu, wv+dwv]);
  }
  return vectors;
}
