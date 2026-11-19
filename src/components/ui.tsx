import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { haptic } from '../lib/haptics';
import { useTheme } from '../theme/ThemeContext';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

export function Header({
  title,
  subtitle,
  left,
  right,
  children,
  pad = SPACING.md,
}: {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  pad?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.background, paddingBottom: pad }]}>
      {left ? <View style={styles.headerLeft}>{left}</View> : null}
      <View style={GLOBAL_STYLES.rowBetween}>
        <View style={{ flex: 1, marginRight: SPACING.sm }}>
          <Text
            style={[TYPOGRAPHY.h1, { color: colors.textMain }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[TYPOGRAPHY.caption, { marginTop: SPACING.xs, color: colors.textSecondary }]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function BackLink({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.backLink}>
      <Text style={[styles.backLinkText, { color: colors.primary }]}>← Back</Text>
    </Pressable>
  );
}

export function Card({
  children,
  style,
  variant = 'bordered',
  elevated = false,
  muted = false,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'bordered' | 'elevated' | 'subtle';
  elevated?: boolean;
  muted?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const chosenVariant = elevated ? 'elevated' : muted ? 'subtle' : variant;

  const dynamicBg: ViewStyle = {
    backgroundColor:
      chosenVariant === 'subtle' ? colors.surfaceSubtle : colors.surface,
    borderColor: colors.border,
  };

  const cardStyle: StyleProp<ViewStyle> = [
    styles.cardBase,
    dynamicBg,
    chosenVariant === 'elevated' && styles.cardElevated,
    chosenVariant === 'bordered' && styles.cardBordered,
    chosenVariant === 'subtle' && styles.cardSubtle,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          haptic.light();
          onPress();
        }}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
        ]}
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
}: {
  label: string;
  onPress?: () => void;
  busy?: boolean;
  variant?: 'primary' | 'soft' | 'secondary' | 'done' | 'ghost';
  style?: StyleProp<ViewStyle>;
}) {
  const { isDark, colors } = useTheme();
  const isDone = variant === 'done';
  const isPrimary = variant === 'primary';

  let containerStyle: StyleProp<ViewStyle> = [styles.btnPrimary, { backgroundColor: colors.primary }];
  let textStyle: any = [styles.btnTextPrimary, { color: colors.textInverse }];

  if (isPrimary) {
    containerStyle = [styles.btnPrimary, { backgroundColor: colors.primary }];
    textStyle = [styles.btnTextPrimary, { color: colors.textInverse }];
  } else if (isDone) {
    containerStyle = [
      styles.btnDone,
      { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' },
    ];
    textStyle = [styles.btnTextDone, { color: colors.success }];
  } else {
    // soft, secondary, ghost
    containerStyle = [styles.btnGhost, { backgroundColor: colors.surfaceSubtle }];
    textStyle = [styles.btnTextGhost, { color: colors.textSecondary }];
  }

  const handlePress = () => {
    if (onPress) {
      if (isPrimary) haptic.light();
      else haptic.selection();
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={busy || isDone}
      style={({ pressed }) => [
        containerStyle,
        pressed && !isDone ? { opacity: 0.88, transform: [{ scale: 0.98 }] } : null,
        busy ? { opacity: 0.6 } : null,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={isPrimary ? colors.textInverse : colors.primary} size="small" />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

export function VegDot({
  isVeg = true,
  size = 8,
  style,
}: {
  isVeg?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isVeg ? colors.success : colors.danger,
        },
        style,
      ]}
    />
  );
}

export function StatCard({
  label,
  value,
  accent,
  style,
}: {
  label: string;
  value: string | number;
  accent?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[TYPOGRAPHY.statNumber, { color: accent || colors.secondary }]}>
        {value}
      </Text>
    </View>
  );
}

export function PollOption({
  title,
  subtitle,
  selected = false,
  votesPercentage,
  onSelect,
  isVeg,
  disabled = false,
  style,
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  votesPercentage?: number;
  onSelect?: () => void;
  isVeg?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptic.selection();
        onSelect?.();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pollOptionContainer,
        {
          backgroundColor: selected ? colors.primaryLight : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
        selected ? styles.pollOptionSelected : styles.pollOptionUnselected,
        pressed && !disabled ? { opacity: 0.9, transform: [{ scale: 0.99 }] } : null,
        style,
      ]}
    >
      <View style={GLOBAL_STYLES.rowBetween}>
        <View style={[GLOBAL_STYLES.rowStart, { flex: 1, marginRight: SPACING.sm }]}>
          {isVeg !== undefined ? <VegDot isVeg={isVeg} style={{ marginRight: SPACING.sm }} /> : null}
          <Text
            style={[
              selected ? TYPOGRAPHY.bodyBold : TYPOGRAPHY.body,
              { color: selected ? colors.textMain : colors.textSecondary, flex: 1 },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {votesPercentage !== undefined ? (
          <Text
            style={[
              TYPOGRAPHY.bodyBold,
              { color: selected ? colors.primary : colors.textMain },
            ]}
          >
            {Math.round(votesPercentage)}%
          </Text>
        ) : null}
      </View>

      {subtitle ? (
        <Text style={[TYPOGRAPHY.caption, { color: colors.textMuted, marginTop: SPACING.xs }]}>
          {subtitle}
        </Text>
      ) : null}

      {votesPercentage !== undefined ? (
        <View style={[GLOBAL_STYLES.progressBarTrack, { backgroundColor: colors.surfaceSubtle, marginTop: SPACING.sm }]}>
          <View
            style={[
              GLOBAL_STYLES.progressBarFill,
              {
                width: `${Math.min(100, Math.max(0, votesPercentage))}%`,
                backgroundColor: selected ? colors.primary : colors.border,
              },
            ]}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

export function MealCard({
  mealType,
  dishName,
  items = [],
  timing,
  score,
  scoreCount,
  isActive = false,
  isRated = false,
  ratingBadgeText,
  isVeg,
  onRate,
}: {
  mealType: string;
  dishName?: string;
  items?: string[];
  timing?: string;
  score?: number;
  scoreCount?: number;
  isActive?: boolean;
  isRated?: boolean;
  ratingBadgeText?: string;
  isVeg?: boolean;
  onRate?: () => void;
}) {
  const { colors } = useTheme();
  const title = dishName || (mealType[0].toUpperCase() + mealType.slice(1));

  return (
    <Card
      variant={isActive ? 'elevated' : isRated ? 'subtle' : 'bordered'}
      style={isActive ? { marginBottom: SPACING.lg } : { marginBottom: SPACING.md }}
    >
      <View style={[GLOBAL_STYLES.rowBetween, { marginBottom: SPACING.xs }]}>
        <View style={[GLOBAL_STYLES.rowStart, { flex: 1, marginRight: SPACING.sm }]}>
          {isVeg !== undefined ? <VegDot isVeg={isVeg} style={{ marginRight: SPACING.sm }} /> : null}
          <Text
            style={[isActive ? TYPOGRAPHY.h2 : TYPOGRAPHY.h3, { color: colors.textMain }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {score !== undefined && score > 0 ? (
          <View style={GLOBAL_STYLES.badge}>
            <Text style={GLOBAL_STYLES.badgeText}>
              ★ {score.toFixed(1)} {scoreCount ? `(${scoreCount})` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      {timing ? (
        <Text style={[TYPOGRAPHY.caption, { color: colors.textMuted, marginBottom: SPACING.xs }]}>
          {timing}
        </Text>
      ) : null}

      {items.length > 0 ? (
        <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary, marginTop: SPACING.xs, marginBottom: SPACING.md }]}>
          {items.join(' • ')}
        </Text>
      ) : null}

      {isRated ? (
        <View style={GLOBAL_STYLES.successBadge}>
          <Text style={GLOBAL_STYLES.successBadgeText}>
            {ratingBadgeText || 'Rated ✓'}
          </Text>
        </View>
      ) : onRate ? (
        <PrimaryButton
          label="Rate this meal"
          onPress={onRate}
          variant={isActive ? 'primary' : 'ghost'}
          style={{ minHeight: 44 }}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 54,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  headerLeft: {
    marginBottom: SPACING.sm,
  },
  backLink: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardBase: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  cardElevated: {
    ...SHADOWS.card,
  },
  cardBordered: {
    borderWidth: 1,
  },
  cardSubtle: {},
  btnPrimary: {
    borderRadius: RADIUS.md,
    minHeight: 46,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextPrimary: {
    fontSize: 15,
    fontWeight: '600',
  },
  btnGhost: {
    borderRadius: RADIUS.md,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextGhost: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnDone: {
    borderRadius: RADIUS.full,
    minHeight: 38,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  btnTextDone: {
    fontSize: 13,
    fontWeight: '600',
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  pollOptionContainer: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  pollOptionUnselected: {
    borderWidth: 1,
  },
  pollOptionSelected: {
    borderWidth: 1.5,
  },
});
