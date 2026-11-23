import React, { useEffect, useState } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Card } from './ui';
import { useTheme } from '../theme/ThemeContext';
import { GLOBAL_STYLES, RADIUS, SPACING } from '../theme/designSystem';

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = RADIUS.sm,
  style,
}: {
  width?: number | `${number}%` | 'auto';
  height?: number | `${number}%`;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Skeleton for meal cards on Today screen */
export function MealCardSkeleton({ isElevated = false }: { isElevated?: boolean }) {
  return (
    <Card variant={isElevated ? 'elevated' : 'bordered'} style={s.mealCard}>
      <View style={[GLOBAL_STYLES.rowBetween, { marginBottom: SPACING.md }]}>
        <View style={GLOBAL_STYLES.rowStart}>
          <SkeletonBox width={10} height={10} borderRadius={5} style={{ marginRight: SPACING.sm }} />
          <SkeletonBox width={72} height={20} borderRadius={RADIUS.full} />
        </View>
        <SkeletonBox width={100} height={14} />
      </View>

      <SkeletonBox width="85%" height={20} style={{ marginBottom: SPACING.xs + 2 }} />
      <SkeletonBox width="55%" height={14} style={{ marginBottom: SPACING.md }} />

      {isElevated ? (
        <View style={s.elevatedBottom}>
          <SkeletonBox width="100%" height={44} borderRadius={RADIUS.md} />
        </View>
      ) : (
        <View style={GLOBAL_STYLES.rowBetween}>
          <SkeletonBox width={90} height={28} borderRadius={RADIUS.full} />
          <SkeletonBox width={60} height={20} borderRadius={RADIUS.full} />
        </View>
      )}
    </Card>
  );
}

/** Skeleton for Today screen list */
export function TodayScreenSkeleton() {
  return (
    <View style={s.screenContainer}>
      {/* Banner Skeleton */}
      <Card variant="bordered" style={{ marginBottom: SPACING.lg, padding: SPACING.md }}>
        <SkeletonBox width={120} height={14} style={{ marginBottom: SPACING.sm }} />
        <SkeletonBox width="70%" height={18} style={{ marginBottom: SPACING.xs }} />
        <SkeletonBox width="40%" height={12} />
      </Card>

      {/* Meals Skeletons */}
      <SkeletonBox width={130} height={14} style={{ marginBottom: SPACING.sm, marginTop: SPACING.xs }} />
      <MealCardSkeleton isElevated />
      <MealCardSkeleton />
      <MealCardSkeleton />
    </View>
  );
}

/** Skeleton for 2x2 Bento KPI Grid on Admin screen */
export function BentoGridSkeleton() {
  return (
    <View style={s.bentoContainer}>
      <View style={s.bentoRow}>
        <Card variant="bordered" style={s.statCard}>
          <SkeletonBox width={64} height={12} style={{ marginBottom: SPACING.sm }} />
          <SkeletonBox width={48} height={28} />
        </Card>
        <Card variant="bordered" style={s.statCard}>
          <SkeletonBox width={72} height={12} style={{ marginBottom: SPACING.sm }} />
          <SkeletonBox width={48} height={28} />
        </Card>
      </View>
      <View style={s.bentoRow}>
        <Card variant="bordered" style={s.statCard}>
          <SkeletonBox width={80} height={12} style={{ marginBottom: SPACING.sm }} />
          <SkeletonBox width={48} height={28} />
        </Card>
        <Card variant="bordered" style={s.statCard}>
          <SkeletonBox width={72} height={12} style={{ marginBottom: SPACING.sm }} />
          <SkeletonBox width={48} height={28} />
        </Card>
      </View>
    </View>
  );
}

/** Skeleton for Admin screen */
export function AdminScreenSkeleton() {
  return (
    <View style={s.screenContainer}>
      <BentoGridSkeleton />

      {/* Requires attention section */}
      <SkeletonBox width={140} height={14} style={{ marginBottom: SPACING.sm, marginTop: SPACING.md }} />
      <Card variant="bordered" style={{ marginBottom: SPACING.lg, padding: SPACING.md }}>
        <View style={GLOBAL_STYLES.rowBetween}>
          <View style={{ flex: 1 }}>
            <SkeletonBox width="60%" height={16} style={{ marginBottom: SPACING.xs }} />
            <SkeletonBox width="40%" height={12} />
          </View>
          <SkeletonBox width={50} height={24} borderRadius={RADIUS.full} />
        </View>
      </Card>

      {/* Average by meal */}
      <SkeletonBox width={120} height={14} style={{ marginBottom: SPACING.sm }} />
      <Card variant="bordered" style={{ padding: SPACING.md }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ marginBottom: i === 4 ? 0 : SPACING.md }}>
            <View style={[GLOBAL_STYLES.rowBetween, { marginBottom: SPACING.xs }]}>
              <SkeletonBox width={70} height={14} />
              <SkeletonBox width={40} height={14} />
            </View>
            <SkeletonBox width="100%" height={6} borderRadius={RADIUS.full} />
          </View>
        ))}
      </Card>
    </View>
  );
}

/** Skeleton for Trends screen */
export function TrendsScreenSkeleton() {
  return (
    <View style={s.screenContainer}>
      {/* Alert Banner skeleton */}
      <Card variant="bordered" style={{ marginBottom: SPACING.lg, padding: SPACING.md }}>
        <SkeletonBox width={140} height={14} style={{ marginBottom: SPACING.xs }} />
        <SkeletonBox width="80%" height={14} />
      </Card>

      {/* Chart 1 skeleton */}
      <Card variant="bordered" style={{ marginBottom: SPACING.lg, padding: SPACING.md }}>
        <SkeletonBox width={150} height={18} style={{ marginBottom: SPACING.md }} />
        <SkeletonBox width="100%" height={180} borderRadius={RADIUS.md} />
      </Card>

      {/* Chart 2 skeleton */}
      <Card variant="bordered" style={{ padding: SPACING.md }}>
        <SkeletonBox width={170} height={18} style={{ marginBottom: SPACING.md }} />
        <SkeletonBox width="100%" height={180} borderRadius={RADIUS.md} />
      </Card>
    </View>
  );
}

/** Skeleton for Weekly Voting screen */
export function VotingScreenSkeleton() {
  return (
    <View style={s.screenContainer}>
      <SkeletonBox width="60%" height={14} style={{ marginBottom: SPACING.md }} />
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} variant="bordered" style={{ marginBottom: SPACING.sm, padding: SPACING.md }}>
          <View style={GLOBAL_STYLES.rowBetween}>
            <View style={{ flex: 1, marginRight: SPACING.sm }}>
              <View style={[GLOBAL_STYLES.rowStart, { marginBottom: SPACING.xs }]}>
                <SkeletonBox width={8} height={8} borderRadius={4} style={{ marginRight: SPACING.sm }} />
                <SkeletonBox width="80%" height={16} />
              </View>
              <SkeletonBox width="50%" height={12} style={{ marginLeft: 16 }} />
            </View>
            <SkeletonBox width={36} height={16} />
          </View>
        </Card>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  screenContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  mealCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  elevatedBottom: {
    marginTop: SPACING.sm,
  },
  bentoContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
  },
});
