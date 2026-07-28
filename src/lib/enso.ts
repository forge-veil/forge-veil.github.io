// Pure ENSO helpers and shared constants for the El Niño tracker.
// Used by the browser island (src/components/EnsoTracker.astro) and mirrored
// (constants only) by the data pipeline (scripts/fetch-enso.mjs).

export const SCALE = 0.05
export const NODATA = -128
export const SHIFT = 205
export const WINDOW_DAYS = 120
export const LAT: [number, number] = [-25, 25]
export const LON: [number, number] = [120, 290]

export type NinoBox = {
  id: string
  label: string
  lon: [number, number]
  lat: [number, number]
  emphasis?: boolean
}

// Standard NOAA CPC region definitions, longitudes in 0..360.
export const NINO_BOXES: NinoBox[] = [
  { id: 'nino4', label: 'Niño 4', lon: [160, 210], lat: [-5, 5] },
  { id: 'nino34', label: 'Niño 3.4', lon: [190, 240], lat: [-5, 5], emphasis: true },
  { id: 'nino3', label: 'Niño 3', lon: [210, 270], lat: [-5, 5] },
  { id: 'nino12', label: 'Niño 1+2', lon: [270, 280], lat: [-10, 0] },
]

// Maps a box id to the key used in the pipeline's per-frame `means` records.
export const BOX_KEYS: Record<string, string> = {
  nino4: 'nino4',
  nino34: 'nino3.4',
  nino3: 'nino3',
  nino12: 'nino1+2',
}

export type Model = {
  name: string
  group: 'NMME' | 'C3S' | 'seasonal'
  month: string
  peak: number
  date: string
}

// The 14 seasonal-forecast models from the article's figure (Jul 2026 init),
// each with its Niño 3.4 peak value and peak month.
export const MODELS: Model[] = [
  { name: 'CMCC', group: 'C3S', month: 'Dec', peak: 5.26, date: '2026-12-15' },
  { name: 'NASA-GEOS-S2S-2', group: 'NMME', month: 'Dec', peak: 4.31, date: '2026-12-15' },
  { name: 'NCAR-CESM1', group: 'NMME', month: 'Nov', peak: 4.24, date: '2026-11-15' },
  { name: 'NCEP-CFSv2', group: 'NMME', month: 'Nov', peak: 4.05, date: '2026-11-15' },
  { name: 'ECMWF SEAS5', group: 'C3S', month: 'Dec', peak: 3.92, date: '2026-12-15' },
  { name: 'JMA', group: 'C3S', month: 'Dec', peak: 3.82, date: '2026-12-15' },
  { name: 'BOM', group: 'C3S', month: 'Nov', peak: 3.68, date: '2026-11-15' },
  { name: 'ECCC-GEM5.2-NEMO', group: 'NMME', month: 'Nov', peak: 3.67, date: '2026-11-15' },
  { name: 'NCAR-CCSM4', group: 'NMME', month: 'Nov', peak: 3.22, date: '2026-11-15' },
  { name: 'Meteo-France', group: 'C3S', month: 'Nov', peak: 3.19, date: '2026-11-15' },
  { name: 'DWD', group: 'C3S', month: 'Dec', peak: 3.03, date: '2026-12-15' },
  { name: 'UKMO', group: 'C3S', month: 'Oct', peak: 2.93, date: '2026-10-15' },
  { name: 'ECCC-CanESM5', group: 'NMME', month: 'Dec', peak: 2.61, date: '2026-12-15' },
  { name: 'SINTEX-F', group: 'seasonal', month: 'SON', peak: 2.20, date: '2026-10-20' },
]
export const MEDIAN = 3.6
export const PK_LO = 2.2
export const PK_HI = 5.26

// RdBu diverging colormap (cold blue -> white -> warm red), domain [-5, 5] °C.
const ANCHORS: [number, number, number][] = [
  [5, 48, 97], [33, 102, 172], [67, 147, 195], [146, 197, 222], [209, 229, 240],
  [247, 247, 247],
  [253, 219, 199], [244, 165, 130], [214, 96, 77], [178, 24, 43], [103, 0, 31],
]
export function rdbu(v: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, (v + 5) / 10))
  const x = t * 10
  const i = Math.min(9, Math.floor(x))
  const f = x - i
  const a = ANCHORS[i]
  const b = ANCHORS[i + 1]
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ]
}

// °C anomaly -> Int8; NaN -> NODATA. Inverse of dequantize.
export function quantize(anom: number): number {
  if (Number.isNaN(anom)) return NODATA
  return Math.max(-127, Math.min(127, Math.round(anom / SCALE)))
}
export function dequantize(q: number): number | null {
  return q === NODATA ? null : q * SCALE
}

// Full-precision mean of the anomaly over cells whose centers fall in the box.
export function boxMean(
  rows: { lat: number; lon: number; anom: number }[],
  box: { lon: [number, number]; lat: [number, number] },
): { mean: number; n: number } {
  let s = 0
  let n = 0
  for (const r of rows) {
    if (Number.isNaN(r.anom)) continue
    if (r.lon >= box.lon[0] && r.lon <= box.lon[1] && r.lat >= box.lat[0] && r.lat <= box.lat[1]) {
      s += r.anom
      n++
    }
  }
  return { mean: n ? +(s / n).toFixed(3) : NaN, n }
}

export type EnsoMeta = {
  source: string
  variable: string
  baseline: string
  dates: string[]
  nLat: number
  nLon: number
  dLat: number
  dLon: number
  bounds: [number, number, number, number]
  scale: number
  nodata: number
  means: Record<string, number>[]
  tropMean: number[]
  models: Model[]
}
