import { describe, it, expect } from 'vitest';
import { quatToMat3, covariance3D, projectCovariance } from './splat';

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
