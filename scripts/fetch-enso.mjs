#!/usr/bin/env node
/**
 * Fetch NOAA OISST v2.1 daily anomalies (NOAA CoastWatch ERDDAP) and write a
 * compact gzipped Int8 binary + JSON meta under public/data/enso/.
 *
 * Rolling WINDOW_DAYS window, native 0.25 deg, latitude +-25, longitude 120..290.
 * A per-day cache in scripts/.enso-cache/ means reruns only fetch new days, so
 * the daily CI job is cheap and the first run backfills the whole window.
 *
 * Keep the constants below in sync with src/lib/enso.ts.
 *
 * Run: node scripts/fetch-enso.mjs   (or: npm run enso)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { gzipSync } from 'zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE = join(__dirname, '.enso-cache')
const OUT = join(__dirname, '../public/data/enso')
mkdirSync(CACHE, { recursive: true })
mkdirSync(OUT, { recursive: true })

// ── constants (keep in sync with src/lib/enso.ts) ────────────────────────────
const BASE = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncdcOisst21Agg.csv'
const LAT = [-25, 25]
const LON = [120, 290]
const SCALE = 0.05
const NODATA = -128
const WINDOW_DAYS = 120
const CONC = 6
// ERDDAP rejects requests without a User-Agent (403), so identify ourselves.
const UA = 'vatsal-bakshi.github.io ENSO tracker (+https://vatsalbakshi.com; daily NOAA OISST fetch)'
// Committed grid geometry, so a run can assemble cached days even if ERDDAP is unreachable.
const AXES_FILE = join(__dirname, 'enso-axes.json')
const BOXES = { 'nino4': [-5, 5, 160, 210], 'nino3.4': [-5, 5, 190, 240], 'nino3': [-5, 5, 210, 270], 'nino1+2': [-10, 0, 270, 280] }
const MODELS = [
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

const enc = (q) => encodeURIComponent(q)
const fieldUrl = (d) => `${BASE}?${enc(`anom[(${d}T12:00:00Z)][(0.0)][(${LAT[0]}):(${LAT[1]})][(${LON[0]}):(${LON[1]})]`)}`
const tropUrl = (d) => `${BASE}?${enc(`anom[(${d}T12:00:00Z)][(0.0)][(-20):4:(20)][(0):4:(360)]`)}`

async function getText(url) {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/csv, text/plain, */*' } })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const t = await r.text()
      if (t.startsWith('<')) throw new Error('bad body')
      return t
    } catch (e) {
      if (a === 3) throw e
      await new Promise((res) => setTimeout(res, 2000 * (a + 1)))
    }
  }
}

async function latestDate() {
  try {
    const t = await getText(`${BASE}?${enc('anom[(last)][(0.0)][(0):(0)][(200):(200)]')}`)
    return t.split('\n')[2].split(',')[0].slice(0, 10)
  } catch (e) {
    console.error('latestDate() failed:', e.message)
    return null
  }
}

function daysWindow(end, n) {
  const out = []
  const e = new Date(end + 'T00:00:00Z')
  for (let i = n - 1; i >= 0; i--) out.push(new Date(e.getTime() - i * 86400000).toISOString().slice(0, 10))
  return out
}

let AXES = null // { lats, lons, nLat, nLon, dLat, dLon, bounds }
function parseField(text) {
  const lines = text.split('\n')
  const rows = []
  for (let i = 2; i < lines.length; i++) {
    if (!lines[i]) continue
    const p = lines[i].split(',')
    rows.push([parseFloat(p[2]), parseFloat(p[3]), p[4] === 'NaN' ? NaN : parseFloat(p[4])])
  }
  if (!AXES) {
    const lats = [...new Set(rows.map((r) => r[0]))].sort((a, b) => a - b)
    const lons = [...new Set(rows.map((r) => r[1]))].sort((a, b) => a - b)
    const dLat = +(lats[1] - lats[0]).toFixed(4)
    const dLon = +(lons[1] - lons[0]).toFixed(4)
    AXES = {
      lats, lons, nLat: lats.length, nLon: lons.length, dLat, dLon,
      bounds: [
        +(lons[0] - dLon / 2).toFixed(3), +(lats[0] - dLat / 2).toFixed(3),
        +(lons[lons.length - 1] + dLon / 2).toFixed(3), +(lats[lats.length - 1] + dLat / 2).toFixed(3),
      ],
    }
    // persist geometry so cache-only runs (ERDDAP down) can still assemble frames
    try { writeFileSync(join(CACHE, 'axes.json'), JSON.stringify(AXES)); writeFileSync(AXES_FILE, JSON.stringify(AXES)) } catch {}
  }
  const { lats, lons, nLat, nLon } = AXES
  const li = new Map(lats.map((v, i) => [v, i]))
  const oi = new Map(lons.map((v, i) => [v, i]))
  const grid = new Int8Array(nLat * nLon).fill(NODATA)
  for (const [lat, lon, a] of rows) {
    const r = li.get(lat)
    const c = oi.get(lon)
    if (r === undefined || c === undefined || Number.isNaN(a)) continue
    grid[(nLat - 1 - r) * nLon + c] = Math.max(-127, Math.min(127, Math.round(a / SCALE))) // row 0 = north
  }
  const means = {}
  for (const [k, [y0, y1, x0, x1]] of Object.entries(BOXES)) {
    let s = 0, n = 0
    for (const [lat, lon, a] of rows) {
      if (Number.isNaN(a)) continue
      if (lat >= y0 && lat <= y1 && lon >= x0 && lon <= x1) { s += a; n++ }
    }
    means[k] = +(s / n).toFixed(3)
  }
  return { grid, means }
}

function parseTrop(text) {
  const lines = text.split('\n')
  let sw = 0, swv = 0
  for (let i = 2; i < lines.length; i++) {
    if (!lines[i]) continue
    const p = lines[i].split(',')
    if (p[4] === 'NaN' || p[4] === undefined) continue
    const w = Math.cos(parseFloat(p[2]) * Math.PI / 180)
    sw += w
    swv += w * parseFloat(p[4])
  }
  return +(swv / sw).toFixed(4)
}

async function ensureDay(d) {
  if (existsSync(join(CACHE, d + '.i8')) && existsSync(join(CACHE, d + '.json'))) return
  const [fieldText, tropText] = await Promise.all([getText(fieldUrl(d)), getText(tropUrl(d))])
  const { grid, means } = parseField(fieldText)
  const tropMean = parseTrop(tropText)
  writeFileSync(join(CACHE, d + '.i8'), Buffer.from(grid.buffer))
  writeFileSync(join(CACHE, d + '.json'), JSON.stringify({ means, tropMean }))
}

async function run() {
  // Load grid geometry up front (committed file, then any cache) so we never
  // depend on a live fetch just to know the grid shape.
  for (const f of [join(CACHE, 'axes.json'), AXES_FILE]) {
    if (!AXES && existsSync(f)) { try { AXES = JSON.parse(readFileSync(f, 'utf8')) } catch {} }
  }

  const cachedDays = () => readdirSync(CACHE).filter((f) => f.endsWith('.i8')).map((f) => f.slice(0, 10)).sort()
  let latest = await latestDate()
  if (!latest) {
    const cd = cachedDays()
    if (!cd.length) throw new Error('ERDDAP unreachable and no cached data to fall back on')
    latest = cd[cd.length - 1]
    console.warn(`ERDDAP unreachable; assembling from cached data through ${latest}`)
  }
  const dates = daysWindow(latest, WINDOW_DAYS)
  const missing = dates.filter((d) => !existsSync(join(CACHE, d + '.i8')))
  console.log(`latest ${latest}; window ${dates[0]}..${dates.at(-1)}; missing ${missing.length}`)

  let next = 0
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (next < missing.length) {
      const d = missing[next++]
      await ensureDay(d).catch((e) => console.error('FAIL', d, e.message))
    }
  }))

  // Grid geometry still unknown (no committed/cached axes, all fetches failed):
  // one last try, otherwise we cannot assemble anything.
  if (!AXES) {
    try { parseField(await getText(fieldUrl(dates.at(-1)))) }
    catch (e) { throw new Error('no grid geometry available: ' + e.message) }
  }

  const have = dates.filter((d) => existsSync(join(CACHE, d + '.i8')))
  if (!have.length) throw new Error('no frames available (fetch failed and cache empty)')
  const { nLat, nLon, dLat, dLon, bounds } = AXES
  const FLEN = nLat * nLon
  const frames = new Int8Array(have.length * FLEN)
  const means = []
  const tropMean = []
  have.forEach((d, i) => {
    frames.set(new Int8Array(readFileSync(join(CACHE, d + '.i8')).buffer), i * FLEN)
    const s = JSON.parse(readFileSync(join(CACHE, d + '.json'), 'utf8'))
    means.push(s.means)
    tropMean.push(s.tropMean)
  })

  // Neutral extension on purpose: a ".gz" name makes static hosts send
  // Content-Encoding: gzip, which auto-decompresses on fetch and breaks our
  // manual inflate. ".bin" keeps the gzip payload opaque to the transport.
  const gz = gzipSync(Buffer.from(frames.buffer))
  writeFileSync(join(OUT, 'frames.bin'), gz)
  const meta = {
    source: 'NOAA OISST v2.1 (CoastWatch ERDDAP: ncdcOisst21Agg)',
    variable: 'anom', baseline: '1971-2000 climatology',
    dates: have, nLat, nLon, dLat, dLon, bounds, scale: SCALE, nodata: NODATA,
    means, tropMean, models: MODELS,
  }
  writeFileSync(join(OUT, 'enso.json'), JSON.stringify(meta))
  console.log(`wrote ${have.length} frames; grid ${nLat}x${nLon}; frames.bin ${(gz.length / 1024 / 1024).toFixed(1)}MB; n3.4 ${means[0]['nino3.4']} -> ${means.at(-1)['nino3.4']}`)

  // prune cache days outside the window
  const keep = new Set(dates)
  for (const f of readdirSync(CACHE)) {
    const d = f.slice(0, 10)
    if (!keep.has(d)) { try { unlinkSync(join(CACHE, f)) } catch {} }
  }
}
run()
