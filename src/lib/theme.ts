import {
  COLORS,
  RADIUS,
  SHADOWS,
} from '../theme/designSystem';

/**
 * Legacy Theme Aliases mapped directly to the unified Design System.
 */
export const C = {
  bg: COLORS.background,
  card: COLORS.surface,
  primary: COLORS.primary,
  primarySoft: COLORS.primaryLight,
  navy: '#0F172A',
  navy2: '#1E293B',
  onDark: '#94A3B8',
  text: COLORS.textMain,
  muted: COLORS.textSecondary,
  border: COLORS.border,
  good: COLORS.success,
  goodSoft: '#DCFCE7',
  bad: COLORS.danger,
  badSoft: '#FEE2E2',
  star: COLORS.star,
  warnSoft: '#FEF3C7',
  warnText: '#92400E',
};

export const R = { card: RADIUS.md, btn: RADIUS.md };

export const shadow = SHADOWS.card;
