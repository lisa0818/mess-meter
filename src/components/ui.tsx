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
  return (
    <View style={[styles.headerContainer, { paddingBottom: pad }]}>
      {left ? <View style={styles.headerLeft}>{left}</View> : null}
      <View style={GLOBAL_STYLES.rowBetween}>
        <View style={{ flex: 1, marginRight: SPACING.sm }}>
          <Text style={TYPOGRAPHY.h1} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[TYPOGRAPHY.caption, { marginTop: SPACING.xs }]}>
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
  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.backLink}>
      <Text style={styles.backLinkText}>← Back</Text>
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
  const chosenVariant = elevated ? 'elevated' : muted ? 'subtle' : variant;

  const cardStyle: StyleProp<ViewStyle> = [
    styles.cardBase,
    chosenVariant === 'elevated' && styles.cardElevated,
    chosenVariant === 'bordered' && styles.cardBordered,
    chosenVariant === 'subtle' && styles.cardSubtle,
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && { opacity: 0.9 }]}>
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
  const isDone = variant === 'done';
  const isPrimary = variant === 'primary';

  let containerStyle: StyleProp<ViewStyle> = styles.btnPrimary;
  let textStyle = styles.btnTextPrimary;

  if (isPrimary) {
    containerStyle = styles.btnPrimary;
    textStyle = styles.btnTextPrimary;
  } else if (isDone) {
    containerStyle = styles.btnDone;
    textStyle = styles.btnTextDone;
  } else {
    // soft, secondary, ghost
    containerStyle = styles.btnGhost;
    textStyle = styles.btnTextGhost;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={busy || isDone}
      style={({ pressed }) => [
        containerStyle,
        pressed && !isDone ? { opacity: 0.85 } : null,
        busy ? { opacity: 0.6 } : null,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={isPrimary ? COLORS.textInverse : COLORS.primary} size="small" />
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
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isVeg ? COLORS.success : COLORS.danger,
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
  return (
    <View style={[styles.statCard, style]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[TYPOGRAPHY.statNumber, accent ? { color: accent } : null]}>
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
  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pollOptionContainer,
        selected ? styles.pollOptionSelected : styles.pollOptionUnselected,
        pressed && !disabled ? { opacity: 0.88 } : null,
        style,
      ]}
    >
      <View style={GLOBAL_STYLES.rowBetween}>
        <View style={[GLOBAL_STYLES.rowStart, { flex: 1, marginRight: SPACING.sm }]}>
          {isVeg !== undefined ? <VegDot isVeg={isVeg} style={{ marginRight: SPACING.sm }} /> : null}
          <Text
            style={[
              selected ? TYPOGRAPHY.bodyBold : TYPOGRAPHY.body,
              { color: selected ? COLORS.textMain : COLORS.textSecondary, flex: 1 },
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
              { color: selected ? COLORS.primary : COLORS.textMain },
            ]}
          >
            {Math.round(votesPercentage)}%
          </Text>
        ) : null}
      </View>

      {subtitle ? (
        <Text style={[TYPOGRAPHY.caption, { marginTop: SPACING.xs }]}>{subtitle}</Text>
      ) : null}

      {votesPercentage !== undefined ? (
        <View style={[GLOBAL_STYLES.progressBarTrack, { marginTop: SPACING.sm }]}>
          <View
            style={[
              GLOBAL_STYLES.progressBarFill,
              {
                width: `${Math.min(100, Math.max(0, votesPercentage))}%`,
                backgroundColor: selected ? COLORS.primary : COLORS.border,
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
  const title = dishName || (mealType[0].toUpperCase() + mealType.slice(1));

  return (
    <Card
      variant={isActive ? 'elevated' : isRated ? 'subtle' : 'bordered'}
      style={isActive ? { marginBottom: SPACING.lg } : { marginBottom: SPACING.md }}
    >
      <View style={[GLOBAL_STYLES.rowBetween, { marginBottom: SPACING.xs }]}>
        <View style={[GLOBAL_STYLES.rowStart, { flex: 1, marginRight: SPACING.sm }]}>
          {isVeg !== undefined ? <VegDot isVeg={isVeg} style={{ marginRight: SPACING.sm }} /> : null}
          <Text style={isActive ? TYPOGRAPHY.h2 : TYPOGRAPHY.h3} numberOfLines={1}>
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
        <Text style={[TYPOGRAPHY.caption, { marginBottom: SPACING.xs }]}>{timing}</Text>
      ) : null}

      {items.length > 0 ? (
        <Text style={[TYPOGRAPHY.body, { marginTop: SPACING.xs, marginBottom: SPACING.md }]}>
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
    color: COLORS.textSecondary,
  },
  cardBase: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  cardElevated: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  cardBordered: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardSubtle: {
    backgroundColor: COLORS.surfaceSubtle,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    minHeight: 46,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextPrimary: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
  btnGhost: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextGhost: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  btnDone: {
    backgroundColor: '#DCFCE7',
    borderRadius: RADIUS.full,
    minHeight: 38,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  btnTextDone: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '600',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pollOptionSelected: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
});
