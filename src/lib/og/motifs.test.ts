import { describe, it, expect } from 'vitest';
import { MOTIFS, motifFor } from './motifs';

describe('motifFor', () => {
  it('returns the explicit motif when ogMotif names a known one', () => {
    expect(motifFor({ ogMotif: 'schwarzschild-funnel', topic: 'mathematics' }))
      .toBe(MOTIFS['schwarzschild-funnel']);
  });
  it('falls back to the topic default when ogMotif is missing', () => {
    expect(motifFor({ topic: 'mathematics' })).toBe(MOTIFS['default-mathematics']);
  });
  it('falls back to the topic default when ogMotif is unknown', () => {
    expect(motifFor({ ogMotif: 'nope', topic: 'quantum-computing' }))
      .toBe(MOTIFS['default-quantum-computing']);
  });
  it('uses the neutral default for an unknown topic', () => {
    expect(motifFor({ topic: 'unheard-of' })).toBe(MOTIFS['default-neutral']);
  });
  it('every motif is a non-empty <svg> string', () => {
    for (const svg of Object.values(MOTIFS)) {
      expect(svg.trim().startsWith('<svg')).toBe(true);
      expect(svg).toContain('</svg>');
    }
  });
  it('has a gaussian-splat motif that is a well-formed svg', () => {
    const svg = MOTIFS['gaussian-splat'];
    expect(svg).toBeDefined();
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 340 340"');
    expect(svg.trim().endsWith('</svg>')).toBe(true);
  });
});
