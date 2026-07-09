import { describe, it, expect } from 'vitest';
import { truncate, renderOgPng } from './card';
import { MOTIFS } from './motifs';

describe('truncate', () => {
  it('leaves short strings unchanged', () => {
    expect(truncate('short', 20)).toBe('short');
  });
  it('cuts long strings and adds an ellipsis without mid-word breaks', () => {
    const out = truncate('the quick brown fox jumps over', 15);
    expect(out.length).toBeLessThanOrEqual(16);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('renderOgPng', () => {
  it('produces a valid 1200x630 PNG buffer', async () => {
    const png = await renderOgPng({
      title: 'The Shape of Gravity',
      description: 'How mass curves spacetime, and why gravity is the curvature of time.',
      topicLabel: 'mathematics',
      seriesLabel: 'GEOMETRY OF CURVED SPACES · PART 2',
      motifSvg: MOTIFS['schwarzschild-funnel'],
    });
    expect(Buffer.isBuffer(png)).toBe(true);
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  }, 20000);
});
