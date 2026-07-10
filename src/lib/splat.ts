// Pure math for the "Painting with Gaussians" post. No DOM, no three.js.
// Matrices are row-major flat arrays.

export type Vec3 = [number, number, number];
export type Mat3 = [number, number, number, number, number, number, number, number, number];
export type Mat2 = [number, number, number, number]; // [[a,b],[c,d]]
export type Quat = [number, number, number, number]; // [w, x, y, z]

// Rotation matrix from a (possibly unnormalized) quaternion [w,x,y,z].
export function quatToMat3(q: Quat): Mat3 {
  let [w, x, y, z] = q;
  const n = Math.hypot(w, x, y, z) || 1;
  w /= n; x /= n; y /= n; z /= n;
  const xx = x * x, yy = y * y, zz = z * z;
  const xy = x * y, xz = x * z, yz = y * z;
  const wx = w * x, wy = w * y, wz = w * z;
  return [
    1 - 2 * (yy + zz), 2 * (xy - wz),     2 * (xz + wy),
    2 * (xy + wz),     1 - 2 * (xx + zz), 2 * (yz - wx),
    2 * (xz - wy),     2 * (yz + wx),     1 - 2 * (xx + yy),
  ];
}

// Σ = R S Sᵀ Rᵀ, with S = diag(scale). Equivalent to M Mᵀ where M = R S.
export function covariance3D(scale: Vec3, q: Quat): Mat3 {
  const R = quatToMat3(q);
  const [sx, sy, sz] = scale;
  // M = R * diag(scale): scale each column of R.
  const M: Mat3 = [
    R[0] * sx, R[1] * sy, R[2] * sz,
    R[3] * sx, R[4] * sy, R[5] * sz,
    R[6] * sx, R[7] * sy, R[8] * sz,
  ];
  // Σ = M Mᵀ
  return [
    M[0] * M[0] + M[1] * M[1] + M[2] * M[2],
    M[0] * M[3] + M[1] * M[4] + M[2] * M[5],
    M[0] * M[6] + M[1] * M[7] + M[2] * M[8],
    M[3] * M[0] + M[4] * M[1] + M[5] * M[2],
    M[3] * M[3] + M[4] * M[4] + M[5] * M[5],
    M[3] * M[6] + M[4] * M[7] + M[5] * M[8],
    M[6] * M[0] + M[7] * M[1] + M[8] * M[2],
    M[6] * M[3] + M[7] * M[4] + M[8] * M[5],
    M[6] * M[6] + M[7] * M[7] + M[8] * M[8],
  ];
}

// EWA projection. camPos = Gaussian mean in CAMERA space (camera at origin, +z forward).
// Perspective Jacobian J of (x,y,z) -> focal*(x/z, y/z); Σ' = J Σ Jᵀ (2x2 block).
export function projectCovariance(cov3: Mat3, camPos: Vec3, focal: number): Mat2 {
  const [x, y, z] = camPos;
  const f = focal;
  // J is 2x3: rows = d(screenX,screenY)/d(x,y,z)
  const j00 = f / z, j02 = -f * x / (z * z);
  const j11 = f / z, j12 = -f * y / (z * z);
  // J Σ Jᵀ. Let J rows be a=(j00,0,j02), b=(0,j11,j12).
  const a: Vec3 = [j00, 0, j02];
  const b: Vec3 = [0, j11, j12];
  const Sa = mat3MulVec(cov3, a); // Σ a
  const Sb = mat3MulVec(cov3, b); // Σ b
  const aSa = dot(a, Sa);
  const aSb = dot(a, Sb);
  const bSb = dot(b, Sb);
  return [aSa, aSb, aSb, bSb];
}

function mat3MulVec(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export type RGB = [number, number, number];

export function invMat2(m: Mat2): Mat2 {
  const [a, b, c, d] = m;
  const det = a * d - b * c || 1e-12;
  const inv = 1 / det;
  return [d * inv, -b * inv, -c * inv, a * inv];
}

// exp(-1/2 · dᵀ Σ'⁻¹ d)
export function gaussian2D(dx: number, dy: number, invCov: Mat2): number {
  const [a, b, c, d] = invCov;
  const q = dx * (a * dx + b * dy) + dy * (c * dx + d * dy);
  return Math.exp(-0.5 * q);
}

// α = 1 - exp(-σ·δ)
export function alphaFromSigma(sigma: number, delta: number): number {
  return 1 - Math.exp(-sigma * delta);
}

// T_upTo = exp(-Σ_{ν<upTo} σ_ν δ_ν)
export function transmittance(sigmas: number[], deltas: number[], upTo: number): number {
  let s = 0;
  for (let n = 0; n < upTo; n++) s += sigmas[n] * deltas[n];
  return Math.exp(-s);
}

// Front-to-back "over": result = dst + (1 - dstA) · srcA · src ; a = dstA + (1-dstA)·srcA
export function alphaOver(dst: RGB, dstA: number, src: RGB, srcA: number): { rgb: RGB; a: number } {
  const w = (1 - dstA) * srcA;
  return {
    rgb: [dst[0] + w * src[0], dst[1] + w * src[1], dst[2] + w * src[2]],
    a: dstA + w,
  };
}

// Real spherical harmonics up to degree 2 (9 coefficients). dir must be a unit vector.
const SH_C0 = 0.28209479177387814;
const SH_C1 = 0.4886025119029199;
const SH_C2 = [1.0925484305920792, 1.0925484305920792, 0.31539156525252005, 1.0925484305920792, 0.5462742152960396];
export function evalSHRGB(coeffs: RGB[], dir: Vec3): RGB {
  const [x, y, z] = dir;
  const basis = [
    SH_C0,
    -SH_C1 * y, SH_C1 * z, -SH_C1 * x,
    SH_C2[0] * x * y, SH_C2[1] * y * z, SH_C2[2] * (2 * z * z - x * x - y * y),
    SH_C2[3] * x * z, SH_C2[4] * (x * x - y * y),
  ];
  const out: RGB = [0.5, 0.5, 0.5]; // 0.5 offset: coeffs encode deviation from mid-gray
  for (let ch = 0; ch < 3; ch++) {
    let acc = 0;
    for (let n = 0; n < 9; n++) acc += coeffs[n][ch] * basis[n];
    out[ch] = Math.min(1, Math.max(0, out[ch] + acc));
  }
  return out;
}
