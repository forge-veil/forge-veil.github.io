import { describe, it, expect } from 'vitest'
import { expectedFreq, firstDigit, distribution, madScore, fitLabel } from './benford'

describe('expectedFreq', () => {
  it('returns log10(2) for digit 1', () => {
    expect(expectedFreq(1)).toBeCloseTo(Math.log10(2), 10)
  })
  it('returns log10(10/9) for digit 9', () => {
    expect(expectedFreq(9)).toBeCloseTo(Math.log10(10 / 9), 10)
  })
  it('sums to 1 across all digits', () => {
    const sum = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).reduce((s, d) => s + expectedFreq(d), 0)
    expect(sum).toBeCloseTo(1.0, 5)
  })
})

describe('firstDigit', () => {
  it('extracts 1 from 1', () => expect(firstDigit(1)).toBe(1))
  it('extracts 3 from 3000', () => expect(firstDigit(3000)).toBe(3))
  it('extracts 5 from 0.0057', () => expect(firstDigit(0.0057)).toBe(5))
  it('extracts 1 from 1.999', () => expect(firstDigit(1.999)).toBe(1))
  it('handles negatives', () => expect(firstDigit(-42)).toBe(4))
  it('returns null for 0', () => expect(firstDigit(0)).toBeNull())
  it('returns null for Infinity', () => expect(firstDigit(Infinity)).toBeNull())
  it('returns null for NaN', () => expect(firstDigit(NaN)).toBeNull())
  it('extracts 1 from 1e-7', () => expect(firstDigit(1e-7)).toBe(1))
  it('extracts 1 from 1e21', () => expect(firstDigit(1e21)).toBe(1))
})

describe('distribution', () => {
  it('returns an array of length 9', () => {
    expect(distribution([1, 2, 3])).toHaveLength(9)
  })
  it('values sum to 1 for non-empty input', () => {
    const dist = distribution([1, 10, 100, 20, 300, 5, 70, 800, 9000])
    expect(dist.reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 10)
  })
  it('index 0 is the frequency of digit 1', () => {
    expect(distribution([1, 10, 100])[0]).toBeCloseTo(1.0, 10)
  })
  it('skips zeros and non-finite values', () => {
    const dist = distribution([1, 0, NaN, Infinity, 10])
    expect(dist.reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 10)
  })
  it('returns all-zeros for empty input', () => {
    expect(distribution([])).toEqual(new Array(9).fill(0))
  })
  it('returns all-zeros when all values are filtered', () => {
    expect(distribution([0, 0, 0])).toEqual(new Array(9).fill(0))
  })
})

describe('madScore', () => {
  it('returns 0 for the perfect Benford distribution', () => {
    const perfect = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map(d => expectedFreq(d))
    expect(madScore(perfect)).toBeCloseTo(0, 10)
  })
  it('returns a positive value for a uniform distribution', () => {
    expect(madScore(new Array(9).fill(1 / 9))).toBeGreaterThan(0)
  })
  it('throws RangeError for wrong-length input', () => {
    expect(() => madScore([0.1, 0.2])).toThrow(RangeError)
  })
})

describe('fitLabel', () => {
  it('returns Good for mad = 0', () => expect(fitLabel(0)).toBe('Good'))
  it('returns Good for mad < 0.006', () => expect(fitLabel(0.005)).toBe('Good'))
  it('returns Close for mad = 0.006', () => expect(fitLabel(0.006)).toBe('Close'))
  it('returns Close for 0.006 ≤ mad < 0.012', () => expect(fitLabel(0.009)).toBe('Close'))
  it('returns Close for mad just below 0.012', () => expect(fitLabel(0.0119)).toBe('Close'))
  it('returns Suspicious for mad = 0.012', () => expect(fitLabel(0.012)).toBe('Suspicious'))
  it('returns Suspicious for mad > 0.012', () => expect(fitLabel(0.015)).toBe('Suspicious'))
})
