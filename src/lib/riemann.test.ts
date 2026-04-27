import { describe, it, expect } from 'vitest';
import { surfaceZ, metricTensor, gaussianCurvature } from './riemann';

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
