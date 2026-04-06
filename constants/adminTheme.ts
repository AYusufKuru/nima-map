import { Platform } from 'react-native';

/** Yönetim paneli (web) — tutarlı renk ve ölçüler */
export const adminTheme = {
  bg: '#f1f5f9',
  bgTop: '#e8eef5',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  accent: '#4f46e5',
  accentLight: '#eef2ff',
  accentDark: '#4338ca',
  border: '#e2e8f0',
  borderFocus: '#a5b4fc',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  success: '#059669',
  chipInactive: '#f1f5f9',
  chipInactiveText: '#475569',
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusFull: 9999,
  maxContent: 1440,
  shadowCard: Platform.select({
    web: {
      boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)',
    },
    default: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
  }),
  shadowHeader: Platform.select({
    web: {
      boxShadow: '0 1px 6px rgba(15, 23, 42, 0.04)',
    },
    default: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
  }),
} as const;
