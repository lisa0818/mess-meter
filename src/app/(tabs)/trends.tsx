import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Header } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/designSystem';
import { dayLabel, daysAgoStr, MIN_RATINGS } from '../../lib/utils';

const W = Dimensions.get('window').width;
const CHART_W = W - 96;

type Row = {
  meal_id: string;
  meal_date: string;
  meal_type: string;
  avg_stars: number;
  n: number;
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const colorFor = (v: number) =>
  v >= 4 ? COLORS.success : v >= 3 ? COLORS.warning : COLORS.danger;

export default function Trends() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('meal_scores', {
      p_from: daysAgoStr(6),
      p_min: MIN_RATINGS,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setError(null);
    setRows((data ?? []) as Row[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Daily average (weighted by number of ratings)
  const byDate: Record<string, { sum: number; n: number }> = {};
  rows.forEach((r) => {
    if (!byDate[r.meal_date]) byDate[r.meal_date] = { sum: 0, n: 0 };
    byDate[r.meal_date].sum += Number(r.avg_stars) * r.n;
    byDate[r.meal_date].n += r.n;
  });
  const dates = Object.keys(byDate).sort();
  const line = dates.map((d) => ({
    value: +(byDate[d].sum / byDate[d].n).toFixed(1),
    label: dayLabel(d),
  }));

  // Average per meal type
  const byType: Record<string, { sum: number; n: number }> = {};
  rows.forEach((r) => {
    if (!byType[r.meal_type]) byType[r.meal_type] = { sum: 0, n: 0 };
    byType[r.meal_type].sum += Number(r.avg_stars) * r.n;
    byType[r.meal_type].n += r.n;
  });
  const bars = Object.keys(byType).map((t) => {
    const v = +(byType[t].sum / byType[t].n).toFixed(1);
    return {
      value: v,
      label: cap(t),
      frontColor: colorFor(v),
      topLabelComponent: () => (
        <Text style={styles.chartBarTopLabel}>{v}</Text>
      ),
    };
  });

  const worst = [...rows].sort((a, b) => a.avg_stars - b.avg_stars)[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={COLORS.primary}
          onRefresh={onRefresh}
        />
      }
    >
      <Header
        title="Weekly Trends"
        subtitle="Mess quality over the last 7 days"
        padBottom={SPACING.xxl + SPACING.md}
      />

      <View style={styles.contentWrapper}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Couldn't load: {error}</Text>
          </View>
        ) : null}

        {!error && rows.length === 0 ? (
          <Text style={styles.emptyText}>
            Not enough ratings yet. Scores appear once {MIN_RATINGS}+ students have rated a meal.
          </Text>
        ) : null}

        {worst ? (
          <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.alertCard]}>
            <View style={styles.alertHeaderRow}>
              <Text style={styles.alertBadge}>LOWEST RATED THIS WEEK</Text>
              <Text style={styles.alertStarRating}>★ {worst.avg_stars}</Text>
            </View>
            <Text style={styles.alertMainText}>
              {dayLabel(worst.meal_date)} {cap(worst.meal_type)}
            </Text>
            <Text style={styles.alertSubText}>
              Based on {worst.n} student evaluations
            </Text>
          </View>
        ) : null}

        {line.length > 0 ? (
          <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.chartCard]}>
            <Text style={styles.chartTitle}>Daily Average Rating</Text>
            <LineChart
              data={line}
              width={CHART_W}
              height={170}
              maxValue={5}
              noOfSections={5}
              spacing={Math.max(28, (CHART_W - 20) / Math.max(line.length, 1))}
              initialSpacing={12}
              color={COLORS.primary}
              thickness={3}
              dataPointsColor={COLORS.primary}
              curved
              isAnimated
              rulesColor={COLORS.border}
              yAxisColor={COLORS.border}
              xAxisColor={COLORS.border}
              yAxisTextStyle={styles.axisLabelText}
              xAxisLabelTextStyle={styles.axisLabelText}
            />
          </View>
        ) : null}

        {bars.length > 0 ? (
          <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.chartCard]}>
            <Text style={styles.chartTitle}>Average Rating by Meal</Text>
            <BarChart
              data={bars}
              width={CHART_W}
              height={160}
              maxValue={5}
              noOfSections={5}
              barWidth={36}
              spacing={22}
              initialSpacing={14}
              barBorderRadius={RADIUS.sm}
              yAxisThickness={0}
              xAxisThickness={0}
              isAnimated
              rulesColor={COLORS.border}
              yAxisTextStyle={styles.axisLabelText}
              xAxisLabelTextStyle={styles.axisLabelText}
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    paddingHorizontal: SPACING.md,
    marginTop: -SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xxl,
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.danger,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECDD3',
    marginBottom: SPACING.md,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  alertBadge: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertStarRating: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.danger,
  },
  alertMainText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textMain,
    marginVertical: 2,
  },
  alertSubText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  chartCard: {
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  chartTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  chartBarTopLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: SPACING.xs,
  },
  axisLabelText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontSize: 10,
  },
});
