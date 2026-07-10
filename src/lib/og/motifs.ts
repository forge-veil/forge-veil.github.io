// 2D SVG motifs (viewBox 0 0 340 340) evoking each post's hero visual.
// Muted strokes only, so they read on the #fafafa card.

const INK = '#1c1c1e', MUT = '#86868b', FAINT = '#c2c4cd';

export const MOTIFS: Record<string, string> = {
  // Flamm funnel profile + a small orbit ellipse.
  'schwarzschild-funnel': `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path d="M20 120 C 110 120, 150 150, 170 250 C 190 150, 230 120, 320 120" stroke="${INK}" stroke-width="3"/>
    <path d="M40 150 C 120 150, 155 175, 170 250 C 185 175, 220 150, 300 150" stroke="${FAINT}" stroke-width="2"/>
    <ellipse cx="170" cy="120" rx="90" ry="26" stroke="${MUT}" stroke-width="2"/>
    <circle cx="170" cy="250" r="7" fill="${INK}"/>
    <circle cx="256" cy="112" r="5" fill="${MUT}"/>
  </svg>`,
  // Warped coordinate-grid patch (the bump surface, projected).
  'riemannian-grid': `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg" fill="none">
    ${Array.from({ length: 7 }, (_, i) => {
      const y = 70 + i * 30;
      const d = Math.max(0, 30 - Math.abs(i - 3) * 8);
      return `<path d="M40 ${y} C 130 ${y - d}, 210 ${y - d}, 300 ${y}" stroke="${i === 3 ? INK : FAINT}" stroke-width="${i === 3 ? 2.5 : 1.5}"/>`;
    }).join('')}
    ${Array.from({ length: 7 }, (_, i) => {
      const x = 40 + i * 43;
      return `<path d="M${x} 70 L ${x} 250" stroke="${FAINT}" stroke-width="1.2"/>`;
    }).join('')}
  </svg>`,
  // Bloch sphere: circle + equator ellipse + state vector.
  'bloch-sphere': `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg" fill="none">
    <circle cx="170" cy="170" r="110" stroke="${MUT}" stroke-width="2"/>
    <ellipse cx="170" cy="170" rx="110" ry="34" stroke="${FAINT}" stroke-width="1.5"/>
    <line x1="170" y1="170" x2="238" y2="104" stroke="${INK}" stroke-width="3"/>
    <circle cx="238" cy="104" r="7" fill="${INK}"/>
    <circle cx="170" cy="170" r="3" fill="${MUT}"/>
  </svg>`,
  // Benford: descending logarithmic bars.
  'benford-bars': `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg">
    ${Array.from({ length: 9 }, (_, i) => {
      const h = 180 * Math.log10(1 + 1 / (i + 1)) / Math.log10(2);
      const x = 40 + i * 30;
      return `<rect x="${x}" y="${250 - h}" width="20" height="${h}" fill="${i === 0 ? INK : FAINT}"/>`;
    }).join('')}
    <line x1="34" y1="250" x2="306" y2="250" stroke="${MUT}" stroke-width="2"/>
  </svg>`,
  // Golf: launch-to-landing flight arc with apex.
  'golf-arc': `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path d="M40 250 Q 170 60, 300 250" stroke="${INK}" stroke-width="3"/>
    <circle cx="170" cy="120" r="6" fill="${MUT}"/>
    <circle cx="40" cy="250" r="5" fill="${INK}"/>
    <line x1="30" y1="250" x2="310" y2="250" stroke="${MUT}" stroke-width="2"/>
  </svg>`,
  // Topic defaults.
  'default-mathematics': `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg" fill="none">
    ${Array.from({ length: 5 }, (_, i) => `<ellipse cx="170" cy="170" rx="${40 + i * 26}" ry="${28 + i * 18}" stroke="${i === 0 ? INK : FAINT}" stroke-width="1.6"/>`).join('')}
  </svg>`,
  'default-quantum-computing': `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg" fill="none">
    <circle cx="170" cy="170" r="110" stroke="${MUT}" stroke-width="2"/>
    <ellipse cx="170" cy="170" rx="110" ry="34" stroke="${FAINT}" stroke-width="1.5"/>
    <line x1="170" y1="170" x2="238" y2="104" stroke="${INK}" stroke-width="3"/>
  </svg>`,
  // Concentric contour lines (nods at the pin-sheet greens).
  'default-personal': `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg" fill="none">
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${60 - i * 5} ${150 + i * 6} Q 170 ${80 - i * 8}, ${280 + i * 5} ${160 + i * 6}" stroke="${i === 2 ? INK : FAINT}" stroke-width="1.6"/>`).join('')}
  </svg>`,
  'default-neutral': `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg" fill="none">
    <circle cx="170" cy="170" r="90" stroke="${MUT}" stroke-width="2"/>
    <line x1="80" y1="170" x2="260" y2="170" stroke="${FAINT}" stroke-width="1.5"/>
    <line x1="170" y1="80" x2="170" y2="260" stroke="${FAINT}" stroke-width="1.5"/>
  </svg>`,
  // Gaussian splats: a few overlapping anisotropic ellipses at varied angles.
  'gaussian-splat': `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg" fill="none">
    <ellipse cx="150" cy="150" rx="70" ry="30" transform="rotate(25 150 150)" stroke="${FAINT}" stroke-width="2"/>
    <ellipse cx="195" cy="175" rx="58" ry="24" transform="rotate(-15 195 175)" stroke="${MUT}" stroke-width="2"/>
    <ellipse cx="165" cy="200" rx="44" ry="18" transform="rotate(55 165 200)" stroke="${INK}" stroke-width="2.5"/>
    <ellipse cx="205" cy="130" rx="34" ry="14" transform="rotate(-40 205 130)" stroke="${FAINT}" stroke-width="1.5"/>
    <circle cx="150" cy="150" r="3" fill="${INK}"/>
    <circle cx="195" cy="175" r="3" fill="${MUT}"/>
  </svg>`,
};

export function motifFor(opts: { ogMotif?: string; topic: string }): string {
  if (opts.ogMotif && MOTIFS[opts.ogMotif]) return MOTIFS[opts.ogMotif];
  const byTopic = `default-${opts.topic}`;
  if (MOTIFS[byTopic]) return MOTIFS[byTopic];
  return MOTIFS['default-neutral'];
}
