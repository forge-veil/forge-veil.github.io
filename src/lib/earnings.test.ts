import { describe, it, expect } from 'vitest'
import {
  timestampToQuarterKey,
  earningsDateToQuarterKey,
  mergeQuarterlyData,
  computeStats,
} from './earnings'

describe('timestampToQuarterKey', () => {
  it('maps Jan to Q1', () => expect(timestampToQuarterKey(1704067200)).toBe('2024-Q1'))
  it('maps Apr to Q2', () => expect(timestampToQuarterKey(1711929600)).toBe('2024-Q2'))
  it('maps Jul to Q3', () => expect(timestampToQuarterKey(1719792000)).toBe('2024-Q3'))
  it('maps Oct to Q4', () => expect(timestampToQuarterKey(1727740800)).toBe('2024-Q4'))
})

describe('earningsDateToQuarterKey', () => {
  it('converts 4Q2023 to 2023-Q4', () => expect(earningsDateToQuarterKey('4Q2023')).toBe('2023-Q4'))
  it('converts 1Q2024 to 2024-Q1', () => expect(earningsDateToQuarterKey('1Q2024')).toBe('2024-Q1'))
  it('returns empty string for invalid input', () => expect(earningsDateToQuarterKey('bad')).toBe(''))
})

describe('mergeQuarterlyData', () => {
  const prices = [
    { quarter: '2023-Q1', price: 100 },
    { quarter: '2023-Q2', price: 120 },
    { quarter: '2023-Q3', price: 150 },
    { quarter: '2023-Q4', price: 200 },
    { quarter: '2024-Q1', price: 300 },
  ]
  const eps = [
    { quarter: '2023-Q1', eps: 1.0 },
    { quarter: '2023-Q2', eps: 1.5 },
    { quarter: '2023-Q3', eps: 2.0 },
    { quarter: '2023-Q4', eps: 2.5 },
    { quarter: '2024-Q1', eps: 3.0 },
  ]

  it('aligns price and eps by quarter key', () => {
    const m = mergeQuarterlyData(prices, eps)
    expect(m[0].price).toBe(100)
    expect(m[0].eps).toBe(1.0)
    expect(m[0].quarter).toBe('2023-Q1')
  })

  it('ttmEPS is null for first 3 quarters (window not full)', () => {
    const m = mergeQuarterlyData(prices, eps)
    expect(m[0].ttmEPS).toBeNull()
    expect(m[1].ttmEPS).toBeNull()
    expect(m[2].ttmEPS).toBeNull()
  })

  it('computes ttmEPS as sum of 4 consecutive EPS quarters', () => {
    const m = mergeQuarterlyData(prices, eps)
    // index 3: 1.0 + 1.5 + 2.0 + 2.5 = 7.0
    expect(m[3].ttmEPS).toBeCloseTo(7.0)
  })

  it('computes trailingPE as price / ttmEPS', () => {
    const m = mergeQuarterlyData(prices, eps)
    expect(m[3].trailingPE).toBeCloseTo(200 / 7, 2)
  })

  it('sets eps and ttmEPS to null when no EPS data exists for a quarter', () => {
    const m = mergeQuarterlyData([{ quarter: '2024-Q2', price: 400 }], [])
    expect(m[0].eps).toBeNull()
    expect(m[0].ttmEPS).toBeNull()
    expect(m[0].trailingPE).toBeNull()
  })
})

describe('computeStats', () => {
  const data = [
    { quarter: '2023-Q1', price: 100, eps: 1.0, ttmEPS: null,  trailingPE: null },
    { quarter: '2023-Q2', price: 120, eps: 1.5, ttmEPS: null,  trailingPE: null },
    { quarter: '2023-Q3', price: 150, eps: 2.0, ttmEPS: null,  trailingPE: null },
    { quarter: '2023-Q4', price: 200, eps: 2.5, ttmEPS: 7.0,   trailingPE: 200 / 7 },
    { quarter: '2024-Q1', price: 300, eps: 3.0, ttmEPS: 9.0,   trailingPE: 300 / 9 },
  ]

  it('returns currentPE from last data point', () => {
    expect(computeStats(data).currentPE).toBeCloseTo(300 / 9)
  })

  it('returns ttmEPS from last data point', () => {
    expect(computeStats(data).ttmEPS).toBeCloseTo(9.0)
  })

  it('computes epsGrowthPct as YoY: last quarter vs 4 quarters prior', () => {
    // eps[4]=3.0, eps[0]=1.0 → (3.0 - 1.0) / 1.0 * 100 = +200%
    expect(computeStats(data).epsGrowthPct).toBeCloseTo(200)
  })

  it('computes priceChangePct over the full range', () => {
    // first=100, last=300 → +200%
    expect(computeStats(data).priceChangePct).toBeCloseTo(200)
  })

  it('returns null epsGrowthPct when fewer than 5 data points', () => {
    expect(computeStats(data.slice(0, 4)).epsGrowthPct).toBeNull()
  })
})
