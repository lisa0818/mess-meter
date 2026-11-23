import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Card, Header } from '../../components/ui';
import { TrendsScreenSkeleton } from '../../components/Skeleton';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/designSystem';
import { dayLabel, daysAgoStr, MIN_RATINGS } from '../../lib/utils';

const W = Dimensions.get('window').width;
const CHART_W = W - 88;

type Row = {
  meal_id: string;
  meal_date: string;
  meal_type: string;
  avg_stars: number;
  n: number;
};

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export default function Trends() {
  const { isDark, colors } = useTheme();

  const ratingColor = (v: number) =>
    v >= 4 ? colors.success : v >= 3 ? colors.warning : colors.danger;
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

  if (loading) {
    return (
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        <Header
          title="Weekly Trends"
          subtitle="Mess satisfaction overview based on anonymous ratings"
        />
        <TrendsScreenSkeleton />
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
      frontColor: ratingColor(v),
      topLabelComponent: () => (
        <Text style={[s.barTopLabel, { color: colors.textSecondary }]}>{v}</Text>
      ),
    };
  });

  const worst = [...rows].sort((a, b) => a.avg_stars - b.avg_stars)[0];

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <Header
        title="Weekly Trends"
        subtitle="Mess satisfaction overview based on anonymous ratings"
      />

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        {error && (
          <View style={[s.errorBanner, { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' }]}>
            <Text style={[s.errorText, { color: colors.danger }]}>Couldn&apos;t load: {error}</Text>
          </View>
        )}

        {!error && rows.length === 0 && (
          <Text style={[s.emptyNotice, { color: colors.textMuted }]}>
            Not enough ratings yet. Scores appear once {MIN_RATINGS}+ students have rated a meal.
          </Text>
        )}

        {/* Actionable insight first: Lowest rated item with danger accent */}
        {worst && (
          <View style={[s.alertCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={s.alertLabel}>LOWEST RATED THIS WEEK</Text>
            <View style={[GLOBAL_STYLES.rowBetween, { marginTop: SPACING.xs }]}>
              <Text style={[TYPOGRAPHY.h3, { color: colors.textMain }]}>
                {dayLabel(worst.meal_date)} · {cap(worst.meal_type)}
              </Text>
              <View style={[s.alertBadge, { backgroundColor: isDark ? '#450A0A' : '#FEE2E2' }]}>
                <Text style={[s.alertBadgeText, { color: colors.danger }]}>
                  ★ {Number(worst.avg_stars).toFixed(1)}
                </Text>
              </View>
            </View>
            <Text style={[s.alertSub, { color: colors.textMuted }]}>{worst.n} student ratings recorded</Text>
          </View>
        )}

        {/* Daily Average Chart */}
        {line.length > 0 && (
          <Card variant="bordered" style={s.chartCard}>
            <Text style={[s.cardTitle, { color: colors.textMain }]}>Daily Average</Text>
            <LineChart
              data={line}
              width={CHART_W}
              height={170}
              maxValue={5}
              noOfSections={5}
              spacing={Math.max(28, (CHART_W - 20) / Math.max(line.length, 1))}
              initialSpacing={12}
              color={colors.primary}
              thickness={2.5}
              dataPointsColor={colors.primary}
              curved
              isAnimated
              rulesColor={colors.border}
              yAxisColor={colors.border}
              xAxisColor={colors.border}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 11 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 11 }}
            />
          </Card>
        )}

        {/* Average by Meal Chart */}
        {bars.length > 0 && (
          <Card variant="bordered" style={s.chartCard}>
            <Text style={[s.cardTitle, { color: colors.textMain }]}>Average by Meal</Text>
            <BarChart
              data={bars}
              width={CHART_W}
              height={160}
              maxValue={5}
              noOfSections={5}
              barWidth={36}
              spacing={22}
              initialSpacing={12}
              barBorderRadius={RADIUS.sm}
              yAxisThickness={0}
              xAxisThickness={0}
              isAnimated
              rulesColor={colors.border}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 11 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 11 }}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyNotice: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xxl,
    lineHeight: 22,
  },
  alertCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.danger,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertLabel: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.danger,
    fontWeight: '700',
  },
  alertBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  alertSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  chartCard: {
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  barTopLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  axisLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
