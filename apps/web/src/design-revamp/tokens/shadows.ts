export const shadows = {
  level1: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
  level2: '0 4px 6px -1px rgb(15 23 42 / 0.1)',
  level3: '0 10px 15px -3px rgb(15 23 42 / 0.1)',
  level4: '0 20px 25px -5px rgb(15 23 42 / 0.15)',
  level5: '0 25px 50px -12px rgb(15 23 42 / 0.25)',
} as const;

export type ShadowKey = keyof typeof shadows;
