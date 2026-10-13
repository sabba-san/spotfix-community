export const spacing = {
  base: 4,
  scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64] as const,
  touchTarget: {
    minHeight: 48,
    minWidth: 48,
    comfortable: 56,
  },
  section: {
    mobile: { py: 16, px: 4 },
    desktop: { py: 32, px: 6 },
  },
} as const;

export type SpacingKey = keyof typeof spacing;
