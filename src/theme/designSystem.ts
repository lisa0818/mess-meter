import { Platform, StyleSheet } from "react-native";

export const COLORS = {
  // Brand Colors
  primary: '#FF6B35',      // Appetizing Warm Orange (Buttons, Active Votes, Highlights)
  primaryLight: '#FFF0EB', // Soft Orange Tint (Selected Meal Cards, Badges)
  secondary: '#4F46E5',    // Indigo (Admin Dashboard Accents, Stats, Charts)
  secondaryLight: '#EEF2FF',

  // Backgrounds & Surfaces
  background: '#F8FAFC',   // Very light cool grey (Main Screen Background)
  surface: '#FFFFFF',      // Pure white (Meal Cards, Vote Containers, Admin Stat Boxes)
  surfaceSubtle: '#F1F5F9',// Light grey (Unselected progress bars, disabled states)

  // Typography Colors
  textMain: '#0F172A',     // Deep Slate (Headings, Meal Titles)
  textSecondary: '#475569',// Muted Slate (Subtitles, Meal Descriptions, Timings)
  textMuted: '#94A3B8',    // Placeholders, Inactive Icons
  textInverse: '#FFFFFF',  // Text on Primary/Secondary buttons

  // Semantic & Rating Colors
  star: '#F59E0B',         // Amber Gold (1-5 Star Ratings)
  success: '#10B981',      // Emerald (High rating, "Voted", Veg Indicator)
  danger: '#EF4444',       // Red (Low rating, "Report Issue", Non-Veg Indicator)
  warning: '#F59E0B',      // Medium rating alert for Admin
  border: '#E2E8F0',       // Card dividers & Input borders
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,  // Standard padding for cards and screens
  lg: 24,  // Section separation
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 12,   // Standard for buttons, inputs, and meal cards
  lg: 16,   // Modals and large dashboard widgets
  full: 9999, // Pills & Tags (e.g., "Breakfast", "Veg", Vote Counts)
};

export const TYPOGRAPHY = StyleSheet.create({
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.secondary, // Used in Admin Dashboard KPI cards
  },
});

export const SHADOWS = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});

// Reusable Layout & Component Styles
export const GLOBAL_STYLES = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  secondaryBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondaryLight,
    alignSelf: 'flex-start',
  },
  secondaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.success,
  },
  nonVegDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.danger,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  grid2Col: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  gridCol: {
    flex: 1,
  },
});
