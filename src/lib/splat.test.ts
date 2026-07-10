import { describe, it, expect } from 'vitest';
import { quatToMat3, covariance3D, projectCovariance, invMat2, gaussian2D, alphaOver, alphaFromSigma, transmittance, evalSHRGB } from './splat';

const IDENT_Q: [number, number, number, number] = [1, 0, 0, 0];

describe('quatToMat3', () => {
  it('identity quaternion gives identity matrix', () => {
    const m = quatToMat3(IDENT_Q);
    expect(m).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });
  it('90° rotation about z maps +x to +y', () => {
    const s = Math.SQRT1_2;
    const m = quatToMat3([s, 0, 0, s]); // w=cos45, z=sin45
    // R * [1,0,0] = column 0 = (m[0], m[3], m[6])
    expect(m[0]).toBeCloseTo(0, 6);
    expect(m[3]).toBeCloseTo(1, 6);
    expect(m[6]).toBeCloseTo(0, 6);
  });
  it('normalizes an unnormalized quaternion', () => {
    const m = quatToMat3([2, 0, 0, 0]); // same as identity after normalize
    expect(m[0]).toBeCloseTo(1, 6);
    expect(m[4]).toBeCloseTo(1, 6);
    expect(m[8]).toBeCloseTo(1, 6);
  });
});

describe('covariance3D', () => {
  it('isotropic scale with identity rotation is diagonal', () => {
    const c = covariance3D([2, 2, 2], IDENT_Q);
    expect(c[0]).toBeCloseTo(4);
    expect(c[4]).toBeCloseTo(4);
    expect(c[8]).toBeCloseTo(4);
    expect(c[1]).toBeCloseTo(0);
  });
  it('is symmetric for an arbitrary rotation and scale', () => {
    const c = covariance3D([3, 1, 0.5], [0.5, 0.5, 0.5, 0.5]);
    expect(c[1]).toBeCloseTo(c[3], 10);
    expect(c[2]).toBeCloseTo(c[6], 10);
    expect(c[5]).toBeCloseTo(c[7], 10);
  });
  it('is positive semi-definite (diagonal entries non-negative)', () => {
    const c = covariance3D([3, 1, 0.5], [0.5, 0.5, 0.5, 0.5]);
    expect(c[0]).toBeGreaterThan(0);
    expect(c[4]).toBeGreaterThan(0);
    expect(c[8]).toBeGreaterThan(0);
  });
});

describe('projectCovariance', () => {
  it('projects an isotropic gaussian on the optical axis to a symmetric 2D covariance', () => {
    const cov3 = covariance3D([1, 1, 1], IDENT_Q);
    const p = projectCovariance(cov3, [0, 0, 5], 500); // 5 units down +z
    expect(p[1]).toBeCloseTo(p[2], 10); // symmetric off-diagonals
    expect(p[0]).toBeCloseTo(p[3], 6);  // xx ≈ yy on axis
    expect(p[0]).toBeGreaterThan(0);
  });
  it('a gaussian twice as far projects smaller (perspective shrink)', () => {
    const cov3 = covariance3D([1, 1, 1], IDENT_Q);
    const near = projectCovariance(cov3, [0, 0, 5], 500);
    const far = projectCovariance(cov3, [0, 0, 10], 500);
    expect(far[0]).toBeLessThan(near[0]);
  });
});

describe('gaussian2D', () => {
  it('is 1 at the center', () => {
    const inv = invMat2([1, 0, 0, 1]);
    expect(gaussian2D(0, 0, inv)).toBeCloseTo(1);
  });
  it('falls off with distance', () => {
    const inv = invMat2([1, 0, 0, 1]);
    expect(gaussian2D(2, 0, inv)).toBeLessThan(gaussian2D(1, 0, inv));
  });
  it('is anisotropic: wider covariance falls off slower along x', () => {
    const inv = invMat2([4, 0, 0, 1]); // wide in x
    expect(gaussian2D(2, 0, inv)).toBeGreaterThan(gaussian2D(0, 2, inv));
  });
});

describe('alphaFromSigma', () => {
  it('is 0 when density is 0', () => {
    expect(alphaFromSigma(0, 1)).toBeCloseTo(0);
  });
  it('approaches 1 for large density·length', () => {
    expect(alphaFromSigma(100, 1)).toBeGreaterThan(0.99);
  });
});

describe('transmittance', () => {
  it('is 1 before any sample', () => {
    expect(transmittance([1, 1, 1], [1, 1, 1], 0)).toBeCloseTo(1);
  });
  it('decreases monotonically', () => {
    const s = [0.5, 0.5, 0.5], d = [1, 1, 1];
    expect(transmittance(s, d, 2)).toBeLessThan(transmittance(s, d, 1));
  });
});

describe('alphaOver', () => {
  it('opaque front sample fully occludes back', () => {
    const r = alphaOver([1, 0, 0], 0, [0, 0, 1], 1); // dst empty, src opaque red
    expect(r.rgb[0]).toBeCloseTo(1);
    expect(r.a).toBeCloseTo(1);
  });
  it('accumulated alpha never exceeds 1', () => {
    let acc = { rgb: [0, 0, 0] as [number, number, number], a: 0 };
    for (let n = 0; n < 10; n++) acc = alphaOver(acc.rgb, acc.a, [1, 1, 1], 0.5);
    expect(acc.a).toBeLessThanOrEqual(1.0001);
  });
});

describe('evalSHRGB', () => {
  it('returns the DC term for zero higher-order coefficients', () => {
    const coeffs = Array.from({ length: 9 }, () => [0, 0, 0] as [number, number, number]);
    coeffs[0] = [0.5, 0.5, 0.5];
    const c = evalSHRGB(coeffs, [0, 0, 1]);
    // DC band constant is 0.2820948; color = 0.5 + 0.2820948*0.5 offset convention below
    expect(c[0]).toBeGreaterThan(0);
    expect(c[0]).toBeLessThanOrEqual(1);
  });
  it('changes with view direction when band-1 coefficients are non-zero', () => {
    const coeffs = Array.from({ length: 9 }, () => [0, 0, 0] as [number, number, number]);
    coeffs[0] = [0.5, 0.5, 0.5];
    coeffs[1] = [0.4, 0, 0]; // band-1 y term (basis -C1·y), red channel
    const up = evalSHRGB(coeffs, [0, 1, 0]);
    const down = evalSHRGB(coeffs, [0, -1, 0]);
    expect(up[0]).not.toBeCloseTo(down[0], 3);
  });
});
