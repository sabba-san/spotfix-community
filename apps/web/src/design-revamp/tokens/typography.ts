export const typography = {
  fontFamilies: {
    sans: 'Geist, system-ui, -apple-system, sans-serif',
    mono: 'Geist Mono, ui-monospace, monospace',
  },
  scale: {
    display: { mobile: 'text-3xl', desktop: 'clamp(2.5rem, 5vw, 4.5rem)' },
    h1: { mobile: 'text-2xl', desktop: 'clamp(1.875rem, 3vw, 3rem)' },
    h2: { mobile: 'text-xl', desktop: 'clamp(1.5rem, 2.5vw, 2.25rem)' },
    h3: { mobile: 'text-lg', desktop: 'text-xl' },
    body: { mobile: 'text-base', desktop: 'text-base' },
    bodySm: { mobile: 'text-sm', desktop: 'text-sm' },
    caption: { mobile: 'text-xs', desktop: 'text-xs' },
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;

export type TypographyKey = keyof typeof typography;
