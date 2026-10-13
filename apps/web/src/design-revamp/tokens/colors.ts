const SPOTFIX_BRAND_COLORS = {
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  brand: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  status: {
    reported: { light: '#ba1a1a', dark: '#f87171' },
    assigned: { light: '#1d4ed8', dark: '#60a5fa' },
    inProgress: { light: '#a33200', dark: '#fb923c' },
    resolved: { light: '#006e2d', dark: '#4ade80' },
    urgent: { light: '#5d2b89', dark: '#c084fc' },
  },
  role: {
    public: { light: '#2563eb', dark: '#60a5fa' },
    supervisor: { light: '#006a6a', dark: '#5eead4' },
    cleaner: { light: '#8e3100', dark: '#fb923c' },
    admin: { light: '#5d2b89', dark: '#c084fc' },
  },
} as const;

export default SPOTFIX_BRAND_COLORS;

export type StatusTone = keyof typeof SPOTFIX_BRAND_COLORS.status;
export type RoleAccent = keyof typeof SPOTFIX_BRAND_COLORS.role;
