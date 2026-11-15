import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card, Header, StatCard } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/designSystem';
import { dayLabel } from '../../lib/utils';

type Summary = {
  total_ratings: number;
  raters: number;
  members: number;
  avg_stars: number | null;
};
type Tag = { tag: string; n: number };
type TypeAvg = { meal_type: string; avg_stars: number; n: number };
type Worst = { meal_date: string; meal_type: string; avg_stars: number; n: number };

const ratingColor = (v: number) =>
  v >= 4 ? COLORS.success : v >= 3 ? COLORS.warning : COLORS.danger;

export default function Admin() {
  const [sum, setSum] = useState<Summary | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [types, setTypes] = useState<TypeAvg[]>([]);
  const [worst, setWorst] = useState<Worst[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, b, c, d] = await Promise.all([
      supabase.rpc('admin_summary', { p_days: 7 }),
      supabase.rpc('admin_tag_counts', { p_days: 7 }),
      supabase.rpc('admin_meal_type_avg', { p_days: 7 }),
      supabase.rpc('admin_worst_meals', { p_days: 7 }),
    ]);
    const err = a.error || b.error || c.error || d.error;
    if (err) {
      setError(err.message);
      return;
    }
    setError(null);
    setSum((a.data?.[0] as Summary) ?? null);
    setTags((b.data ?? []) as Tag[]);
    setTypes((c.data ?? []) as TypeAvg[]);
    setWorst((d.data ?? []) as Worst[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const participation =
    sum && sum.members > 0 ? Math.round((sum.raters / sum.members) * 100) : 0;
  const maxTag = Math.max(1, ...tags.map((t) => t.n));
  const lowestAvg = worst.length > 0 ? `★ ${worst[0].avg_stars}` : 'None';

  return (
    <View style={s.screen}>
      <Header
        title="Admin Dashboard"
        subtitle="Last 7 days · Demo Hostel A"
      />

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={COLORS.primary}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        {error && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>Couldn't load: {error}</Text>
          </View>
        )}

        {/* 2x2 Bento-Style KPI Grid */}
        <View style={s.bentoGrid}>
          <View style={s.bentoRow}>
            <StatCard
              label="TODAY'S AVG"
              value={sum?.avg_stars !== null && sum?.avg_stars !== undefined ? `★ ${sum.avg_stars}` : '–'}
            />
            <StatCard
              label="PARTICIPATION"
              value={`${participation}%`}
            />
          </View>
          <View style={s.bentoRow}>
            <StatCard
              label="TOTAL RATINGS"
              value={sum?.total_ratings ?? 0}
            />
            <StatCard
              label="LOWEST RATED"
              value={lowestAvg}
              accent={worst.length > 0 ? COLORS.danger : COLORS.secondary}
            />
          </View>
        </View>

        {/* Actionable Insights First: Requires Attention with left-border accent */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeader}>REQUIRES ATTENTION</Text>
          {worst.length === 0 ? (
            <Card variant="bordered">
              <Text style={s.emptyNotice}>No meals flagged for attention this week.</Text>
            </Card>
          ) : (
            worst.map((w, i) => (
              <View key={`${w.meal_date}-${w.meal_type}-${i}`} style={s.attentionCard}>
                <View style={GLOBAL_STYLES.rowBetween}>
                  <View style={{ flex: 1, marginRight: SPACING.sm }}>
                    <Text style={TYPOGRAPHY.bodyBold} numberOfLines={1}>
                      {dayLabel(w.meal_date)} · {w.meal_type[0].toUpperCase() + w.meal_type.slice(1)}
                    </Text>
                    <Text style={[TYPOGRAPHY.caption, { marginTop: 2 }]}>
                      {w.n} student{w.n !== 1 ? 's' : ''} reported issues
                    </Text>
                  </View>

                  <View style={s.alertBadge}>
                    <Text style={s.alertBadgeText}>
                      ★ {Number(w.avg_stars).toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Clean Data Lists: Average by Meal */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeader}>AVERAGE BY MEAL</Text>
          <Card variant="bordered">
            {types.length === 0 ? (
              <Text style={s.emptyNotice}>No meal data available.</Text>
            ) : (
              types.map((t) => (
                <View key={t.meal_type} style={s.mealItemRow}>
                  <View style={GLOBAL_STYLES.rowBetween}>
                    <Text style={s.mealTypeName}>
                      {t.meal_type[0].toUpperCase() + t.meal_type.slice(1)}
                    </Text>
                    <View style={s.ratingPill}>
                      <Text
                        style={[
                          s.ratingPillText,
                          { color: ratingColor(Number(t.avg_stars)) },
                        ]}
                      >
                        ★ {Number(t.avg_stars).toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={GLOBAL_STYLES.progressBarTrack}>
                    <View
                      style={[
                        GLOBAL_STYLES.progressBarFill,
                        {
                          width: `${Math.min(100, (Number(t.avg_stars) / 5) * 100)}%`,
                          backgroundColor: ratingColor(Number(t.avg_stars)),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>

        {/* Top Feedback Tags */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionHeader}>TOP FEEDBACK TAGS</Text>
          <Card variant="bordered">
            {tags.length === 0 ? (
              <Text style={s.emptyNotice}>No student tags recorded yet.</Text>
            ) : (
              tags.map((t) => {
                const isPositive = t.tag === 'Great taste';
                return (
                  <View key={t.tag} style={s.tagItemRow}>
                    <View style={GLOBAL_STYLES.rowBetween}>
                      <Text style={TYPOGRAPHY.body} numberOfLines={1}>
                        {t.tag}
                      </Text>
                      <Text style={TYPOGRAPHY.bodyBold}>{t.n}</Text>
                    </View>

                    <View style={GLOBAL_STYLES.progressBarTrack}>
                      <View
                        style={[
                          GLOBAL_STYLES.progressBarFill,
                          {
                            width: `${(t.n / maxTag) * 100}%`,
                            backgroundColor: isPositive ? COLORS.success : COLORS.danger,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </View>
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
  bentoGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sectionWrap: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  attentionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.danger,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  emptyNotice: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    paddingVertical: SPACING.xs,
  },
  mealItemRow: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  mealTypeName: {
    ...TYPOGRAPHY.bodyBold,
  },
  ratingPill: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagItemRow: {
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
});
