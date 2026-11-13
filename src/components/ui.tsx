import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

type HeaderProps = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  padBottom?: number;
  variant?: 'primary' | 'secondary' | 'neutral';
};

export function Header({
  title,
  subtitle,
  left,
  right,
  children,
  padBottom = SPACING.xxl,
  variant = 'neutral',
}: HeaderProps) {
  const gradientColors =
    variant === 'secondary'
      ? ([COLORS.secondary, '#312E81'] as const)
      : variant === 'primary'
      ? ([COLORS.primary, '#C2410C'] as const)
      : (['#0F172A', '#1E293B'] as const);

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.headerContainer, { paddingBottom: padBottom }]}
    >
      {left ? <View style={styles.headerLeft}>{left}</View> : null}
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        {right ? <View style={styles.headerRight}>{right}</View> : null}
      </View>
      {children}
    </LinearGradient>
  );
}

export function BackLink({
  onPress,
  label = '← Back',
  light = true,
}: {
  onPress: () => void;
  label?: string;
  light?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={SPACING.md}
      style={styles.backButton}
      accessibilityRole="button"
    >
      <Text style={[styles.backText, light ? styles.backTextLight : styles.backTextDark]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Card({
  children,
  style,
  selected = false,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  selected?: boolean;
  onPress?: () => void;
}) {
  const cardStyle = [
    GLOBAL_STYLES.card,
    SHADOWS.card,
    selected && styles.cardSelected,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.cardPressed]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  busy,
  variant = 'primary',
  style,
  textStyle,
}: {
  label: string;
  onPress?: () => void;
  busy?: boolean;
  variant?: 'primary' | 'secondary' | 'soft' | 'done';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const isDone = variant === 'done';
  const isSecondary = variant === 'secondary';
  const isSoft = variant === 'soft';

  const containerStyle = [
    styles.buttonBase,
    isSecondary && styles.buttonSecondary,
    isSoft && styles.buttonSoft,
    isDone && styles.buttonDone,
    style,
  ];

  const labelColor = isDone
    ? COLORS.success
    : isSoft
    ? COLORS.primary
    : COLORS.textInverse;

  return (
    <Pressable
      onPress={onPress}
      disabled={busy || isDone}
      style={({ pressed }) => [
        containerStyle,
        pressed && !busy && !isDone && styles.buttonPressed,
        busy && styles.buttonDisabled,
      ]}
      accessibilityRole="button"
    >
      {busy ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <Text
          style={[
            GLOBAL_STYLES.primaryButtonText,
            { color: labelColor },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/**
 * Standard Indian veg/non-veg indicator mark:
 * Green dot for Veg (COLORS.success)
 * Red dot for Non-Veg (COLORS.danger)
 */
export function VegIndicator({
  isVeg,
  showLabel = false,
  size = 'md',
}: {
  isVeg: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}) {
  const color = isVeg ? COLORS.success : COLORS.danger;
  const isSm = size === 'sm';

  return (
    <View style={styles.vegIndicatorRow}>
      <View
        style={[
          styles.dietaryBox,
          isSm && styles.dietaryBoxSm,
          { borderColor: color },
        ]}
      >
        <View
          style={[
            styles.dietaryDot,
            isSm && styles.dietaryDotSm,
            { backgroundColor: color },
          ]}
        />
      </View>
      {showLabel ? (
        <Text style={[styles.dietaryLabel, { color }]}>
          {isVeg ? 'Veg' : 'Non-Veg'}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Star Rating Display & Selector:
 * Active stars must use COLORS.star (#F59E0B)
 * Unselected stars must use COLORS.border (#E2E8F0)
 */
export function StarRating({
  rating,
  maxStars = 5,
  size = 28,
  interactive = false,
  onRate,
}: {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (stars: number) => void;
}) {
  const starsArray = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <View style={styles.starRow}>
      {starsArray.map((num) => {
        const isActive = num <= rating;
        const starColor = isActive ? COLORS.star : COLORS.border;

        if (interactive && onRate) {
          return (
            <Pressable
              key={num}
              onPress={() => onRate(num)}
              hitSlop={SPACING.xs}
              style={styles.interactiveStar}
              accessibilityRole="button"
              accessibilityLabel={`${num} of ${maxStars} stars`}
            >
              <Text style={[styles.starGlyph, { fontSize: size, color: starColor }]}>
                ★
              </Text>
            </Pressable>
          );
        }

        return (
          <Text
            key={num}
            style={[styles.starGlyph, { fontSize: size, color: starColor }]}
          >
            ★
          </Text>
        );
      })}
    </View>
  );
}

/**
 * Horizontal Progress Bar:
 * COLORS.surfaceSubtle as track, fill customizable (default COLORS.primary)
 */
export function ProgressBar({
  progress,
  fillColor = COLORS.primary,
  height = 8,
  trackColor = COLORS.surfaceSubtle,
}: {
  progress: number; // 0 to 1
  fillColor?: string;
  height?: number;
  trackColor?: string;
}) {
  const clampedProgress = Math.min(1, Math.max(0, isNaN(progress) ? 0 : progress));
  const percentStr = `${Math.round(clampedProgress * 100)}%`;

  return (
    <View style={[styles.progressTrack, { height, backgroundColor: trackColor }]}>
      <View
        style={[
          styles.progressFill,
          { width: percentStr as any, backgroundColor: fillColor },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 56,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: RADIUS.lg + SPACING.sm,
    borderBottomRightRadius: RADIUS.lg + SPACING.sm,
  },
  headerLeft: {
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: '#94A3B8',
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textInverse,
    fontSize: 26,
  },
  headerRight: {
    marginLeft: SPACING.sm,
  },
  backButton: {
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
  },
  backText: {
    ...TYPOGRAPHY.bodyBold,
  },
  backTextLight: {
    color: '#E2E8F0',
  },
  backTextDark: {
    color: COLORS.textMain,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  cardPressed: {
    opacity: 0.9,
  },
  buttonBase: {
    ...GLOBAL_STYLES.primaryButton,
    minHeight: 50,
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
  },
  buttonSoft: {
    backgroundColor: COLORS.primaryLight,
  },
  buttonDone: {
    backgroundColor: '#DCFCE7',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  vegIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dietaryBox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: RADIUS.sm / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  dietaryBoxSm: {
    width: 11,
    height: 11,
    borderWidth: 1.2,
    borderRadius: 2,
  },
  dietaryDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
  },
  dietaryDotSm: {
    width: 4,
    height: 4,
  },
  dietaryLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  interactiveStar: {
    padding: SPACING.xs,
  },
  starGlyph: {
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});
