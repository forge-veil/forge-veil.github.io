import { describe, it, expect } from 'vitest'
import { rdbu, quantize, dequantize, boxMean, NINO_BOXES, MODELS, NODATA } from './enso'

describe('quantize/dequantize', () => {
  it('round-trips within scale precision', () => {
    expect(dequantize(quantize(2.2))).toBeCloseTo(2.2, 1)
    expect(dequantize(quantize(-1.35))).toBeCloseTo(-1.35, 1)
  })
  it('maps NaN to NODATA and back to null', () => {
    expect(quantize(NaN)).toBe(NODATA)
    expect(dequantize(NODATA)).toBeNull()
  })
  it('clamps out-of-range values', () => {
    expect(quantize(50)).toBeLessThanOrEqual(127)
    expect(quantize(-50)).toBeGreaterThanOrEqual(-127)
  })
})

describe('rdbu colormap', () => {
  it('is white near zero, blue cold, red warm', () => {
    const [r0, g0, b0] = rdbu(0)
    expect(r0).toBeGreaterThan(230)
    expect(g0).toBeGreaterThan(230)
    expect(b0).toBeGreaterThan(230)
    const cold = rdbu(-4)
    const warm = rdbu(4)
    expect(cold[2]).toBeGreaterThan(cold[0]) // blue dominates cold
    expect(warm[0]).toBeGreaterThan(warm[2]) // red dominates warm
  })
})

describe('boxMean', () => {
  it('averages only cells inside the box, ignoring NaN', () => {
    const box = { lon: [190, 240] as [number, number], lat: [-5, 5] as [number, number] }
    const rows = [
      { lat: 0, lon: 200, anom: 2 },
      { lat: 0, lon: 220, anom: 4 },
      { lat: 0, lon: 100, anom: 99 }, // outside lon
      { lat: 40, lon: 200, anom: 99 }, // outside lat
      { lat: 0, lon: 210, anom: NaN }, // NaN skipped
    ]
    expect(boxMean(rows, box)).toEqual({ mean: 3, n: 2 })
  })
})

describe('constants', () => {
  it('defines the four Niño regions with standard CPC coordinates', () => {
    const ids = NINO_BOXES.map((b) => b.id)
    expect(ids).toEqual(['nino4', 'nino34', 'nino3', 'nino12'])
    const n34 = NINO_BOXES.find((b) => b.id === 'nino34')!
    expect(n34.lon).toEqual([190, 240])
    expect(n34.lat).toEqual([-5, 5])
  })
  it('lists 14 forecast models', () => {
    expect(MODELS).toHaveLength(14)
    expect(MODELS[0].name).toBe('CMCC')
  })
})
