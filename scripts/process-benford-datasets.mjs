#!/usr/bin/env node
/**
 * Download and process real datasets for Benford's Law visualizations.
 * Outputs: src/data/benford/<slug>.csv and src/data/benford/<slug>.json
 *
 * Run: node scripts/process-benford-datasets.mjs
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/benford')
mkdirSync(OUT, { recursive: true })

const FETCHED_AT = new Date().toISOString()

// ── helpers ──────────────────────────────────────────────────────────────────

function firstDigit(n) {
  if (!isFinite(n) || n <= 0) return null
  const s = n.toExponential()
  const d = parseInt(s[0])
  return d >= 1 && d <= 9 ? d : null
}

function distribution(values) {
  const counts = new Array(9).fill(0)
  let valid = 0
  for (const v of values) {
    const d = firstDigit(v)
    if (d !== null) { counts[d - 1]++; valid++ }
  }
  return { counts, n: valid, digits: valid > 0 ? counts.map(c => c / valid) : counts }
}

function saveCsv(slug, values, header = 'value') {
  const clean = values.filter(v => v != null && isFinite(v) && v > 0)
  writeFileSync(join(OUT, `${slug}.csv`), [header, ...clean.map(String)].join('\n'), 'utf8')
}

function saveJson(slug, payload) {
  writeFileSync(join(OUT, `${slug}.json`), JSON.stringify(payload, null, 2), 'utf8')
  const d1 = (payload.digits[0] * 100).toFixed(1)
  console.log(`  ✓ ${slug}.json  n=${payload.n}  digit-1=${d1}%`)
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60000), ...opts })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

// ── 1. US City Populations (Census Bureau) ───────────────────────────────────

async function processCityPopulations() {
  console.log('Fetching US city populations from Census Bureau…')
  const url = 'https://api.census.gov/data/2020/dec/pl?get=P1_001N&for=place:*'
  const rows = await fetchJson(url)
  const values = rows.slice(1).map(r => parseFloat(r[0])).filter(v => isFinite(v) && v > 0)

  saveCsv('us-city-populations', values, 'population')
  const dist = distribution(values)
  saveJson('us-city-populations', {
    name: 'US City Populations',
    description: 'All 31,000+ incorporated US cities, towns, and villages — US Census Bureau 2020 Decennial Census',
    source: 'https://api.census.gov/data/2020/dec/pl',
    unit: 'persons',
    fetchedAt: FETCHED_AT,
    queryCode: `GET https://api.census.gov/data/2020/dec/pl
    ?get=P1_001N&for=place:*

P1_001N — total population, all incorporated places
Filter: P1_001N > 0`,
    ...dist,
  })
}

// ── 2. Mountain Peak Heights (Wikidata) ──────────────────────────────────────

async function processMountains() {
  console.log('Fetching mountain heights from Wikidata…')
  const sparql = `SELECT ?elev WHERE {
  { ?mountain wdt:P31 wd:Q8502 } UNION { ?mountain wdt:P31 wd:Q597 }
  ?mountain wdt:P2044 ?elev .
  FILTER(?elev > 500 && ?elev < 9000)
}
LIMIT 20000`
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(sparql)
  const json = await fetchJson(url, { headers: { 'User-Agent': 'benford-dataset-processor/1.0' } })

  const values = json.results.bindings
    .map(b => parseFloat(b.elev.value))
    .filter(v => isFinite(v) && v > 500 && v < 9000)

  saveCsv('mountains', values, 'height_m')
  const dist = distribution(values)
  saveJson('mountains', {
    name: 'Mountain Peak Heights',
    description: 'Elevations (m) of mountain and volcanic peaks 500–9,000 m — Wikidata (P2044), sourced from Wikipedia contributors',
    source: 'https://query.wikidata.org/#SELECT%20%3Felev%20WHERE%20%7B%0A%20%20%7B%20%3Fmountain%20wdt%3AP31%20wd%3AQ8502%20%7D%20UNION%20%7B%20%3Fmountain%20wdt%3AP31%20wd%3AQ597%20%7D%0A%20%20%3Fmountain%20wdt%3AP2044%20%3Felev%20.%0A%20%20FILTER(%3Felev%20%3E%20500%20%26%26%20%3Felev%20%3C%209000)%0A%7D%0ALIMIT%2020000',
    unit: 'm',
    fetchedAt: FETCHED_AT,
    queryCode: sparql,
    ...dist,
  })
}

// ── 3. Country Populations (World Bank) ──────────────────────────────────────

async function processCountryPopulations() {
  console.log('Fetching country populations from World Bank…')
  const url = 'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2022&per_page=300&mrv=1'
  const [, data] = await fetchJson(url)
  const values = data.filter(d => d.value != null && d.value > 0 && d.countryiso3code).map(d => d.value)

  saveCsv('country-populations', values, 'population')
  const dist = distribution(values)
  saveJson('country-populations', {
    name: 'Country Populations',
    description: 'World Bank population estimates, 2022 — all countries and territories',
    source: 'https://data.worldbank.org/indicator/SP.POP.TOTL',
    unit: 'persons',
    fetchedAt: FETCHED_AT,
    queryCode: `GET https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL
    ?format=json&date=2022&per_page=300&mrv=1

Indicator: SP.POP.TOTL (total population)
Filter: value != null && value > 0 && countryiso3code present`,
    ...dist,
  })
}

// ── 4. US County Populations (Census Bureau) ─────────────────────────────────

async function processCountyPopulations() {
  console.log('Fetching US county populations from Census Bureau…')
  const url = 'https://api.census.gov/data/2020/dec/pl?get=P1_001N,NAME&for=county:*'
  const rows = await fetchJson(url)
  const values = rows.slice(1).map(r => parseFloat(r[0])).filter(v => isFinite(v) && v > 0)

  saveCsv('us-county-populations', values, 'population')
  const dist = distribution(values)
  saveJson('us-county-populations', {
    name: 'US County Populations',
    description: 'US Census Bureau 2020 Decennial Census — all counties and county-equivalents',
    source: 'https://www.census.gov/programs-surveys/decennial-census/decade/2020/2020-census-results.html',
    unit: 'persons',
    fetchedAt: FETCHED_AT,
    queryCode: `GET https://api.census.gov/data/2020/dec/pl
    ?get=P1_001N,NAME&for=county:*

P1_001N — total population, all counties and county-equivalents
Filter: P1_001N > 0`,
    ...dist,
  })
}

// ── 5. Country GDPs (World Bank) ─────────────────────────────────────────────

async function processGDPs() {
  console.log('Fetching country GDPs from World Bank…')
  const url = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&date=2022&per_page=300&mrv=1'
  const [, data] = await fetchJson(url)
  const values = data.filter(d => d.value != null && d.value > 0 && d.countryiso3code).map(d => d.value)

  saveCsv('country-gdps', values, 'gdp_usd')
  const dist = distribution(values)
  saveJson('country-gdps', {
    name: 'Country GDPs',
    description: 'World Bank GDP (current USD), 2022 — all countries with available data',
    source: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD',
    unit: 'USD',
    fetchedAt: FETCHED_AT,
    queryCode: `GET https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD
    ?format=json&date=2022&per_page=300&mrv=1

Indicator: NY.GDP.MKTP.CD (GDP, current USD)
Filter: value != null && value > 0 && countryiso3code present`,
    ...dist,
  })
}

// ── 6. Country Land Areas (World Bank) ───────────────────────────────────────

async function processLandAreas() {
  console.log('Fetching country land areas from World Bank…')
  const url = 'https://api.worldbank.org/v2/country/all/indicator/AG.LND.TOTL.K2?format=json&date=2021&per_page=300&mrv=1'
  const [, data] = await fetchJson(url)
  const values = data.filter(d => d.value != null && d.value > 0 && d.countryiso3code).map(d => d.value)

  saveCsv('country-land-areas', values, 'area_km2')
  const dist = distribution(values)
  saveJson('country-land-areas', {
    name: 'Country Land Areas',
    description: 'World Bank land area (km²), 2021 — all countries and territories',
    source: 'https://data.worldbank.org/indicator/AG.LND.TOTL.K2',
    unit: 'km²',
    fetchedAt: FETCHED_AT,
    queryCode: `GET https://api.worldbank.org/v2/country/all/indicator/AG.LND.TOTL.K2
    ?format=json&date=2021&per_page=300&mrv=1

Indicator: AG.LND.TOTL.K2 (land area, km²)
Filter: value != null && value > 0 && countryiso3code present`,
    ...dist,
  })
}

// ── 7. Fibonacci Numbers (computed) ──────────────────────────────────────────

function processFibonacci() {
  console.log('Computing Fibonacci first digits…')
  const values = []
  let a = 1n, b = 1n
  for (let i = 0; i < 1000; i++) {
    values.push(parseFloat(a.toString().slice(0, 15)))
    ;[a, b] = [b, a + b]
  }
  saveCsv('fibonacci', values, 'value')
  const dist = distribution(values)
  saveJson('fibonacci', {
    name: 'Fibonacci Numbers',
    description: 'First 1,000 Fibonacci numbers — mathematically computed, not sampled',
    source: 'https://en.wikipedia.org/wiki/Fibonacci_sequence',
    unit: 'integer',
    fetchedAt: FETCHED_AT,
    queryCode: `// Computed with arbitrary-precision arithmetic (BigInt)
let a = 1n, b = 1n
for (let i = 0; i < 1000; i++) {
  values.push(a)  // record exact integer
  ;[a, b] = [b, a + b]
}`,
    ...dist,
  })
}

// ── 8. Powers of 2 (computed) ────────────────────────────────────────────────

function processPowersOf2() {
  console.log('Computing powers-of-2 first digits…')
  const values = []
  let v = 1n
  for (let i = 0; i < 10000; i++) {
    values.push(parseFloat(v.toString().slice(0, 15)))
    v *= 2n
  }
  saveCsv('powers-of-2', values, 'value')
  const dist = distribution(values)
  saveJson('powers-of-2', {
    name: 'Powers of 2',
    description: 'First 10,000 powers of 2 (2⁰ through 2⁹⁹⁹⁹) — mathematically computed',
    source: 'https://en.wikipedia.org/wiki/Power_of_two',
    unit: 'integer',
    fetchedAt: FETCHED_AT,
    queryCode: `// Computed with arbitrary-precision arithmetic (BigInt)
let v = 1n
for (let i = 0; i < 10000; i++) {
  values.push(v)  // record exact integer (2^i)
  v *= 2n
}`,
    ...dist,
  })
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Writing to ${OUT}\n`)
  console.log(`Timestamp: ${FETCHED_AT}\n`)

  processFibonacci()
  processPowersOf2()

  await processCountryPopulations()
  await processCountyPopulations()
  await processGDPs()
  await processLandAreas()
  await processCityPopulations()
  await processMountains()

  console.log('\nDone.')
}

main().catch(e => { console.error(e); process.exit(1) })
