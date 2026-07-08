import { describe, it, expect } from 'vitest';
import { metricFactor, flammZ, computeOrbit } from './schwarzschild';
import { computeLightRay, deflectionAngle, throwHeight, clockRate } from './schwarzschild';

const RS = 1;

describe('metricFactor', () => {
  it('is zero at the horizon r = rs', () => {
    expect(metricFactor(RS, RS)).toBeCloseTo(0, 10);
  });
  it('approaches 1 far from the mass', () => {
    expect(metricFactor(1e6, RS)).toBeCloseTo(1, 5);
  });
  it('is negative inside the horizon', () => {
    expect(metricFactor(0.5, RS)).toBeLessThan(0);
  });
});

describe('flammZ', () => {
  it('is zero at the throat r = rs', () => {
    expect(flammZ(RS, RS)).toBeCloseTo(0, 10);
  });
  it('grows like sqrt away from the throat', () => {
    // z(2rs) = 2*sqrt(rs*rs) = 2*rs
    expect(flammZ(2 * RS, RS)).toBeCloseTo(2 * RS, 10);
  });
  it('clamps to 0 below the throat (no real embedding inside)', () => {
    expect(flammZ(0.5, RS)).toBe(0);
  });
});

describe('computeOrbit', () => {
  const base = { rs: 0.4, L: 1.0, r0: 5, dPhi: 0.01, steps: 700 };

  it('Newtonian orbit returns near its start after 2π (closes)', () => {
    const pts = computeOrbit({ ...base, relativistic: false });
    // find index closest to phi = 2π
    const i2pi = Math.round((2 * Math.PI) / base.dPhi);
    const p = pts[i2pi], p0 = pts[0];
    const d = Math.hypot(p.x - p0.x, p.y - p0.y);
    expect(d).toBeLessThan(0.15); // ellipse closes
  });

  it('relativistic orbit does NOT close after 2π (precession)', () => {
    const pts = computeOrbit({ ...base, relativistic: true });
    const i2pi = Math.round((2 * Math.PI) / base.dPhi);
    const p = pts[i2pi], p0 = pts[0];
    const d = Math.hypot(p.x - p0.x, p.y - p0.y);
    expect(d).toBeGreaterThan(0.2); // perihelion has advanced
  });

  it('stays bounded (does not fly off or plunge to 0) for a stable orbit', () => {
    const pts = computeOrbit({ ...base, relativistic: true });
    for (const p of pts) {
      const r = Math.hypot(p.x, p.y);
      expect(r).toBeGreaterThan(0.5);
      expect(r).toBeLessThan(20);
    }
  });
});

describe('computeLightRay / deflectionAngle', () => {
  it('deflects a grazing ray by ~2·rs/b (Einstein value)', () => {
    const rs = 0.05, b = 1;
    const rays = computeLightRay({ rs, b, dPhi: 0.002, steps: 3000 });
    const got = deflectionAngle(rays);
    const expected = 2 * rs / b; // = 4M/b
    expect(got).toBeGreaterThan(0.6 * expected);
    expect(got).toBeLessThan(1.6 * expected);
  });

  it('deflects less for a larger impact parameter', () => {
    const near = deflectionAngle(computeLightRay({ rs: 0.05, b: 1, dPhi: 0.002, steps: 3000 }));
    const far  = deflectionAngle(computeLightRay({ rs: 0.05, b: 3, dPhi: 0.002, steps: 3000 }));
    expect(far).toBeLessThan(near);
  });
});

describe('throwHeight', () => {
  it('is zero at launch and catch', () => {
    expect(throwHeight(0, 2, 3)).toBeCloseTo(0, 10);
    expect(throwHeight(2, 2, 3)).toBeCloseTo(0, 10);
  });
  it('peaks at the apex at t = T/2', () => {
    expect(throwHeight(1, 2, 3)).toBeCloseTo(3, 10);
  });
  it('is symmetric about the apex', () => {
    expect(throwHeight(0.5, 2, 3)).toBeCloseTo(throwHeight(1.5, 2, 3), 10);
  });
});

describe('clockRate', () => {
  it('ticks faster higher up (weak field)', () => {
    expect(clockRate(2, 0.05)).toBeGreaterThan(clockRate(0, 0.05));
  });
  it('is 1 at the reference height', () => {
    expect(clockRate(0, 0.05)).toBeCloseTo(1, 10);
  });
});
