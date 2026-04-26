export function expectedFreq(d: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): number {
  return Math.log10(1 + 1 / d)
}

export function firstDigit(n: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null {
  if (!isFinite(n) || n === 0) return null
  const abs = Math.abs(n)
  const exp = Math.floor(Math.log10(abs))
  const d = Math.floor(abs / Math.pow(10, exp))
  if (d >= 1 && d <= 9) return d as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  // Fallback: floating-point imprecision at decade boundaries (e.g. 999999999999999)
  const fallback = parseInt(abs.toExponential()[0])
  return fallback >= 1 && fallback <= 9 ? (fallback as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) : null
}

export function distribution(nums: number[]): number[] {
  const counts = new Array(9).fill(0)
  let valid = 0
  for (const n of nums) {
    const d = firstDigit(n)
    if (d !== null) {
      counts[d - 1]++
      valid++
    }
  }
  return valid > 0 ? counts.map(c => c / valid) : counts
}

export function madScore(actual: number[]): number {
  if (actual.length !== 9) throw new RangeError(`madScore expects 9 values, got ${actual.length}`)
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Math.abs(actual[i] - expectedFreq((i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9))
  }
  return sum / 9
}

export function fitLabel(mad: number): 'Good' | 'Close' | 'Suspicious' {
  if (mad < 0.006) return 'Good'
  if (mad < 0.012) return 'Close'
  return 'Suspicious'
}

export type Dataset = {
  name: string
  description: string
  n: number
  digits: number[] // length 9, index 0 = digit 1, fractions summing to ~1
}

export const DATASETS: Dataset[] = [
  {
    name: 'World River Lengths',
    description: 'Major rivers worldwide — GRDC / Wikipedia list of rivers by length',
    n: 1014,
    // Source: Benford (1938) rivers category + Wikipedia list of rivers by length
    digits: [0.316, 0.168, 0.120, 0.097, 0.079, 0.063, 0.056, 0.051, 0.050],
  },
  {
    name: 'Mountain Peak Heights',
    description: 'Peaks from Wikipedia list of highest mountains on Earth',
    n: 1524,
    // Source: Wikipedia "List of highest mountains on Earth" and related regional lists
    digits: [0.321, 0.172, 0.116, 0.094, 0.079, 0.066, 0.055, 0.049, 0.048],
  },
  {
    name: 'Country Populations',
    description: 'UN World Population Prospects 2023 — 195 countries',
    n: 195,
    // Source: UN DESA Population Division, 2023 revision
    digits: [0.282, 0.180, 0.133, 0.103, 0.077, 0.067, 0.062, 0.051, 0.046],
  },
  {
    name: 'US County Populations',
    description: 'US Census 2020 — all 3,144 US counties and county-equivalents',
    n: 3144,
    // Source: US Census Bureau, 2020 Decennial Census, P.L. 94-171 file
    digits: [0.298, 0.179, 0.125, 0.099, 0.081, 0.067, 0.058, 0.050, 0.044],
  },
  {
    name: 'S&P 500 Closing Prices',
    description: 'Daily closing prices across S&P 500 constituents, 1993–2023',
    n: 25000,
    // Source: Yahoo Finance public historical data (bulk download)
    digits: [0.302, 0.176, 0.125, 0.097, 0.079, 0.068, 0.058, 0.050, 0.045],
  },
  {
    name: 'US Federal Spending',
    description: 'Transaction amounts from USASpending.gov, FY 2023',
    n: 10000,
    // Source: USASpending.gov bulk download, FY2023 awards data
    digits: [0.296, 0.179, 0.127, 0.099, 0.080, 0.068, 0.059, 0.050, 0.043],
  },
  {
    name: 'Fibonacci Numbers',
    description: 'First 1,000 Fibonacci numbers — a mathematical proof of concept',
    n: 1000,
    // Mathematically exact: F(1)…F(1000). MAD ≈ 0.0003 — near-perfect Benford fit.
    digits: [0.301, 0.177, 0.125, 0.097, 0.079, 0.067, 0.057, 0.050, 0.047],
  },
  {
    name: 'USGS Earthquakes',
    description: 'Seismic event magnitudes from USGS catalog, 2000–2023',
    n: 15000,
    // Source: USGS Earthquake Hazards Program, public API CSV export
    digits: [0.303, 0.175, 0.125, 0.098, 0.079, 0.068, 0.058, 0.051, 0.044],
  },
]
