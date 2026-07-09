import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const load = (p: string) => readFileSync(require.resolve(p));

const geist400 = load('@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff');
const geist500 = load('@fontsource/geist-sans/files/geist-sans-latin-500-normal.woff');
const news400  = load('@fontsource/newsreader/files/newsreader-latin-400-normal.woff');

const INK = '#1c1c1e', MUT = '#86868b', HAIR = 'rgba(0,0,0,0.08)', BG = '#fafafa';

export function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

export interface CardData {
  title: string;
  description: string;
  topicLabel: string;
  seriesLabel?: string;
  motifSvg: string;
}

// Minimal element-tree helper (satori accepts { type, props }).
const el = (type: string, style: Record<string, unknown>, children?: unknown) =>
  ({ type, props: children === undefined ? { style } : { style, children } });

export async function renderOgPng(data: CardData): Promise<Buffer> {
  const motifDataUri = 'data:image/svg+xml;base64,' + Buffer.from(data.motifSvg).toString('base64');
  const topLabel = data.seriesLabel ?? data.topicLabel.toUpperCase();

  const tree = el('div', {
    width: '1200px', height: '630px', display: 'flex', flexDirection: 'column',
    backgroundColor: BG, padding: '64px', fontFamily: 'Geist',
    border: `1px solid ${HAIR}`, justifyContent: 'space-between',
  }, [
    // Top row: series/topic label (left) + topic (right)
    el('div', { display: 'flex', justifyContent: 'space-between', fontSize: '22px', letterSpacing: '2px', color: MUT }, [
      el('div', { display: 'flex' }, topLabel),
      el('div', { display: 'flex' }, data.seriesLabel ? data.topicLabel : ''),
    ]),
    // Middle: title + description (left), motif (right)
    el('div', { display: 'flex', flex: '1', alignItems: 'center', justifyContent: 'space-between' }, [
      el('div', { display: 'flex', flexDirection: 'column', maxWidth: '620px' }, [
        el('div', { display: 'flex', fontFamily: 'Newsreader', fontSize: '68px', lineHeight: 1.05, color: INK }, data.title),
        el('div', { display: 'flex', marginTop: '24px', fontSize: '28px', lineHeight: 1.4, color: MUT }, truncate(data.description, 120)),
      ]),
      { type: 'img', props: { src: motifDataUri, width: 320, height: 320, style: { marginLeft: '32px' } } },
    ]),
    // Footer: hairline + identity
    el('div', { display: 'flex', flexDirection: 'column' }, [
      el('div', { display: 'flex', height: '1px', backgroundColor: HAIR, marginBottom: '20px' }, ''),
      el('div', { display: 'flex', justifyContent: 'space-between', fontSize: '24px', color: MUT }, [
        el('div', { display: 'flex', color: INK }, 'Vatsal Bakshi'),
        el('div', { display: 'flex' }, 'vatsalbakshi.com'),
      ]),
    ]),
  ]);

  const svg = await satori(tree as never, {
    width: 1200, height: 630,
    fonts: [
      { name: 'Geist', data: geist400, weight: 400, style: 'normal' },
      { name: 'Geist', data: geist500, weight: 500, style: 'normal' },
      { name: 'Newsreader', data: news400, weight: 400, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return Buffer.from(png);
}
