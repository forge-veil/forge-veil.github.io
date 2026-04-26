export function expectedFreq(d: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9): number {
  return Math.log10(1 + 1 / d)
}

export function firstDigit(n: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null {
  if (!isFinite(n) || n === 0) return null
  const abs = Math.abs(n)
  const exp = Math.floor(Math.log10(abs))
  const d = Math.floor(abs / Math.pow(10, exp))
  return d >= 1 && d <= 9 ? (d as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) : null
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

export const DATASETS: Dataset[] = []
