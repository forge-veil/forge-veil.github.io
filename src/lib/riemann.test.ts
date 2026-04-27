import { describe, it, expect } from 'vitest';
import { surfaceZ, metricTensor, gaussianCurvature, christoffelSymbols } from './riemann';

const AMP = 1.1, SIG = 0.8;

describe('surfaceZ', () => {
  it('peaks at origin', () => {
    expect(surfaceZ(0, 0, AMP, SIG)).toBeCloseTo(AMP, 10);
  });
  it('decays away from origin', () => {
    expect(surfaceZ(3, 0, AMP, SIG)).toBeLessThan(0.01);
  });
  it('is zero when amp is zero', () => {
    expect(surfaceZ(0, 0, 0, SIG)).toBe(0);
  });
});

describe('metricTensor', () => {
  it('equals identity on flat surface (amp=0)', () => {
    const g = metricTensor(1, 1, 0, SIG);
    expect(g[0][0]).toBeCloseTo(1);
    expect(g[0][1]).toBeCloseTo(0);
    expect(g[1][0]).toBeCloseTo(0);
    expect(g[1][1]).toBeCloseTo(1);
  });
  it('is symmetric', () => {
    const g = metricTensor(0.5, 0.3, AMP, SIG);
    expect(g[0][1]).toBeCloseTo(g[1][0], 10);
  });
  it('is positive definite (det > 0, g11 > 0)', () => {
    const g = metricTensor(0.5, 0.3, AMP, SIG);
    expect(g[0][0]).toBeGreaterThan(0);
    expect(g[0][0] * g[1][1] - g[0][1] * g[1][0]).toBeGreaterThan(0);
  });
  it('g11 > 1 at bump flank (slope in u direction)', () => {
    const g = metricTensor(0.6, 0, AMP, SIG);
    expect(g[0][0]).toBeGreaterThan(1);
  });
});

describe('gaussianCurvature', () => {
  it('is positive at origin (dome-shaped)', () => {
    expect(gaussianCurvature(0, 0, AMP, SIG)).toBeGreaterThan(0);
  });
  it('is zero on flat surface (amp=0)', () => {
    expect(gaussianCurvature(1, 1, 0, SIG)).toBeCloseTo(0, 10);
  });
  it('changes sign near r=sigma (inflection circle)', () => {
    const kInner = gaussianCurvature(0.5 * SIG, 0, AMP, SIG);
    const kOuter = gaussianCurvature(1.5 * SIG, 0, AMP, SIG);
    expect(kInner).toBeGreaterThan(0);
    expect(kOuter).toBeLessThan(0);
  });
});

describe('christoffelSymbols', () => {
  it('are all zero on flat surface (amp=0)', () => {
    const g = christoffelSymbols(1, 1, 0, SIG);
    for (let k = 0; k < 2; k++)
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++)
          expect(g[k][i][j]).toBeCloseTo(0, 5);
  });
  it('are symmetric in lower indices: Γ^k_{ij} = Γ^k_{ji}', () => {
    const g = christoffelSymbols(0.5, 0.3, AMP, SIG);
    for (let k = 0; k < 2; k++)
      expect(g[k][0][1]).toBeCloseTo(g[k][1][0], 6);
  });
  it('are symmetric in u and v at origin (by surface symmetry)', () => {
    const g = christoffelSymbols(0, 0, AMP, SIG);
    // At origin of a radially symmetric bump, Γ^0_{00} = Γ^1_{11} by symmetry
    expect(g[0][0][0]).toBeCloseTo(g[1][1][1], 5);
  });
  it('throws RangeError when sigma <= 0', () => {
    expect(() => christoffelSymbols(0, 0, AMP, 0)).toThrow(RangeError);
  });
});

describe('invalid inputs', () => {
  it('throws RangeError when sigma <= 0 (surfaceZ)', () => {
    expect(() => surfaceZ(0, 0, 1, 0)).toThrow(RangeError);
    expect(() => surfaceZ(0, 0, 1, -1)).toThrow(RangeError);
  });
  it('throws RangeError when sigma <= 0 (metricTensor)', () => {
    expect(() => metricTensor(0, 0, 1, 0)).toThrow(RangeError);
  });
  it('throws RangeError when sigma <= 0 (gaussianCurvature)', () => {
    expect(() => gaussianCurvature(0, 0, 1, 0)).toThrow(RangeError);
  });
});
