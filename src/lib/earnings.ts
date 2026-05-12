export interface QuarterPrice {
  quarter: string
  price: number
}

export interface EpsPoint {
  quarter: string
  eps: number
}

export interface MergedQuarter {
  quarter: string
  price: number
  eps: number | null
  ttmEPS: number | null
  trailingPE: number | null
}

export interface WidgetStats {
  currentPE: number | null
  ttmEPS: number | null
  epsGrowthPct: number | null
  priceChangePct: number
}

export interface TickerMeta {
  symbol: string
  name: string
  currentPrice: number
}

export interface TickerData {
  meta: TickerMeta
  merged: MergedQuarter[]
  stats: WidgetStats
}

export function timestampToQuarterKey(ts: number): string {
  const date = new Date(ts * 1000)
  const year = date.getUTCFullYear()
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1
  return `${year}-Q${quarter}`
}

export function earningsDateToQuarterKey(date: string): string {
  // Yahoo earnings dates come as "4Q2023" → normalise to "2023-Q4"
  const match = date.match(/^(\d)Q(\d{4})$/)
  if (!match) return ''
  return `${match[2]}-Q${match[1]}`
}

export function mergeQuarterlyData(
  prices: QuarterPrice[],
  eps: EpsPoint[]
): MergedQuarter[] {
  const epsMap = new Map(eps.map(e => [e.quarter, e.eps]))

  return prices.map((p, i) => {
    const quarterEps = epsMap.get(p.quarter) ?? null

    // TTM EPS: need 4 consecutive quarters in the window ending at i
    const window: number[] = []
    for (let j = Math.max(0, i - 3); j <= i; j++) {
      const e = epsMap.get(prices[j].quarter)
      if (e != null) window.push(e)
    }
    const ttmEPS = window.length === 4 ? window.reduce((a, b) => a + b, 0) : null
    const trailingPE = ttmEPS != null && ttmEPS > 0 ? p.price / ttmEPS : null

    return { quarter: p.quarter, price: p.price, eps: quarterEps, ttmEPS, trailingPE }
  })
}

export function computeStats(data: MergedQuarter[]): WidgetStats {
  const last = data[data.length - 1]
  const first = data[0]

  const epsGrowthPct = (() => {
    if (data.length < 5) return null
    const recent = data[data.length - 1].eps
    const yearAgo = data[data.length - 5].eps
    if (recent == null || yearAgo == null || yearAgo === 0) return null
    return ((recent - yearAgo) / Math.abs(yearAgo)) * 100
  })()

  const priceChangePct =
    first.price !== 0 ? ((last.price - first.price) / first.price) * 100 : 0

  return {
    currentPE: last.trailingPE,
    ttmEPS: last.ttmEPS,
    epsGrowthPct,
    priceChangePct,
  }
}
