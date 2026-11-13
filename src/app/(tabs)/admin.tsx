import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Header, ProgressBar } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SHADOWS,
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

type AdminTab = 'overview' | 'meals' | 'poll';

const POLL_RESULTS_PREVIEW = [
  { title: 'Butter Chicken & Garlic Naan (Veg option)', votes: 142, pct: 40 },
  { title: 'Paneer Tikka Biryani & Gulab Jamun', votes: 94, pct: 26 },
  { title: 'South Indian Grand Feast & Payasam', votes: 68, pct: 19 },
  { title: 'Hakka Noodles & Chilli Paneer Bowl', votes: 56, pct: 15 },
];

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export default function Admin() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  const participation =
    sum && sum.members > 0 ? Math.round((sum.raters / sum.members) * 100) : 0;
  const maxTag = Math.max(1, ...tags.map((t) => t.n));

  // Compute metrics for the 2-column KPI grid
  const lowestMeal = worst.length > 0 ? worst[0] : null;
  const totalVotesCast = (sum?.total_ratings ?? 0) + 360; // ratings + poll votes

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={COLORS.secondary}
          onRefresh={onRefresh}
        />
      }
    >
      <Header
        title="Admin Dashboard"
        subtitle="Mess Oversight · Last 7 Days · Hostel A"
        variant="secondary"
        padBottom={SPACING.xxl + SPACING.md}
        right={
          <View style={GLOBAL_STYLES.secondaryBadge}>
            <Text style={GLOBAL_STYLES.secondaryBadgeText}>Admin Mode</Text>
          </View>
        }
      />

      <View style={styles.contentWrapper}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Couldn't load: {error}</Text>
          </View>
        ) : null}

        {/* Active Tabs differentiated by COLORS.secondary (#4F46E5) */}
        <View style={styles.tabBar}>
          <Pressable
            style={[
              styles.tabItem,
              activeTab === 'overview' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('overview')}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'overview' && styles.tabTextActive,
              ]}
            >
              Overview
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tabItem,
              activeTab === 'meals' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('meals')}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'meals' && styles.tabTextActive,
              ]}
            >
              Meal Breakdown
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeTab === 'poll' && styles.tabItemActive]}
            onPress={() => setActiveTab('poll')}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'poll' && styles.tabTextActive,
              ]}
            >
              Weekly Poll
            </Text>
          </Pressable>
        </View>

        {/* 2-Column Grid of GLOBAL_STYLES.card for Top-Level KPIs */}
        <View style={styles.kpiGrid}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            {/* KPI 1: Today's Avg Rating */}
            <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.kpiCard]}>
              <Text style={styles.kpiLabel}>Today's Avg Rating</Text>
              <Text style={TYPOGRAPHY.statNumber}>
                ★ {sum?.avg_stars != null ? sum.avg_stars : '–'}
              </Text>
              <Text style={styles.kpiSubtitle}>Target: 4.0+ out of 5.0</Text>
            </View>

            {/* KPI 2: Total Votes Cast */}
            <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.kpiCard]}>
              <Text style={styles.kpiLabel}>Total Votes Cast</Text>
              <Text style={TYPOGRAPHY.statNumber}>{totalVotesCast}</Text>
              <Text style={styles.kpiSubtitle}>
                {sum?.total_ratings ?? 0} ratings · 360 poll votes
              </Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.kpiRow}>
            {/* KPI 3: Lowest Rated Meal */}
            <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.kpiCard]}>
              <Text style={styles.kpiLabel}>Lowest Rated Meal</Text>
              <Text style={[TYPOGRAPHY.statNumber, styles.warningStatNumber]}>
                {lowestMeal ? `★ ${lowestMeal.avg_stars}` : 'None'}
              </Text>
              <Text style={styles.kpiSubtitle} numberOfLines={1}>
                {lowestMeal
                  ? `${capitalize(lowestMeal.meal_type)} · ${lowestMeal.n} ratings`
                  : 'All meals above 3.5'}
              </Text>
            </View>

            {/* KPI 4: Student Participation */}
            <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.kpiCard]}>
              <Text style={styles.kpiLabel}>Participation</Text>
              <Text style={TYPOGRAPHY.statNumber}>{participation}%</Text>
              <Text style={styles.kpiSubtitle}>
                {sum?.raters ?? 0} of {sum?.members ?? 0} students
              </Text>
            </View>
          </View>
        </View>

        {/* Content based on Active Tab */}
        {activeTab === 'overview' && (
          <View>
            {/* Simple Data Visualization: Chart Bars using COLORS.secondary (#4F46E5) */}
            <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.sectionCard]}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Average Rating by Meal</Text>
                <View style={GLOBAL_STYLES.secondaryBadge}>
                  <Text style={GLOBAL_STYLES.secondaryBadgeText}>5.0 Scale</Text>
                </View>
              </View>

              {types.length === 0 ? (
                <Text style={styles.emptyCardText}>No ratings recorded yet.</Text>
              ) : null}

              <View style={styles.barsList}>
                {types.map((t) => {
                  const progressRatio = Math.min(1, Math.max(0, t.avg_stars / 5));
                  return (
                    <View key={t.meal_type} style={styles.barItemRow}>
                      <Text style={styles.barItemLabel}>{capitalize(t.meal_type)}</Text>
                      <View style={styles.barItemTrack}>
                        {/* Chart bar using COLORS.secondary (#4F46E5) */}
                        <ProgressBar
                          progress={progressRatio}
                          fillColor={COLORS.secondary}
                          trackColor={COLORS.surfaceSubtle}
                          height={12}
                        />
                      </View>
                      <View style={styles.barScoreGroup}>
                        <Text style={styles.barScoreValue}>{t.avg_stars}</Text>
                        <Text style={styles.barScoreCount}>({t.n})</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Top Feedback Tags: Simple Progress Bars and Clean List */}
            <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.sectionCard]}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Top Feedback Tags</Text>
                <Text style={styles.cardHeaderCount}>Last 7 Days</Text>
              </View>

              {tags.length === 0 ? (
                <Text style={styles.emptyCardText}>No tag feedback recorded yet.</Text>
              ) : null}

              <View style={styles.barsList}>
                {tags.map((t) => {
                  const ratio = Math.min(1, Math.max(0, t.n / maxTag));
                  const isPositive = t.tag === 'Great taste';
                  const barColor = isPositive ? COLORS.success : COLORS.secondary;

                  return (
                    <View key={t.tag} style={styles.barItemRow}>
                      <Text style={styles.barItemTagLabel} numberOfLines={1}>
                        {t.tag}
                      </Text>
                      <View style={styles.barItemTrack}>
                        <ProgressBar
                          progress={ratio}
                          fillColor={barColor}
                          trackColor={COLORS.surfaceSubtle}
                          height={10}
                        />
                      </View>
                      <Text style={styles.barTagCount}>{t.n}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Needs Attention / Flagged Meals: Clean List */}
            <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.sectionCard]}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Needs Attention</Text>
                <View style={styles.dangerBadge}>
                  <Text style={styles.dangerBadgeText}>Action Required</Text>
                </View>
              </View>

              {worst.length === 0 ? (
                <Text style={styles.emptyCardText}>No meal issues flagged this week.</Text>
              ) : null}

              <View style={styles.worstList}>
                {worst.map((w, i) => (
                  <View key={i} style={styles.worstRow}>
                    <View>
                      <Text style={styles.worstMealTitle}>
                        {dayLabel(w.meal_date)} · {capitalize(w.meal_type)}
                      </Text>
                      <Text style={styles.worstMealSubtitle}>
                        {w.n} student reviews
                      </Text>
                    </View>
                    <View style={styles.worstScoreBadge}>
                      <Text style={styles.worstScoreText}>★ {w.avg_stars}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'meals' && (
          <View>
            {/* Meal Breakdown: Detailed Clean List with Secondary Chart Bars */}
            <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.sectionCard]}>
              <Text style={styles.cardHeaderTitle}>Ratings by Meal Session</Text>
              <Text style={styles.sectionSubtitle}>
                Performance index by morning, afternoon, snack, and night services.
              </Text>

              <View style={styles.barsList}>
                {types.map((t) => {
                  const ratio = t.avg_stars / 5;
                  return (
                    <View key={t.meal_type} style={styles.mealBreakdownCard}>
                      <View style={styles.mealBreakdownHeader}>
                        <Text style={styles.mealBreakdownTitle}>
                          {capitalize(t.meal_type)}
                        </Text>
                        <Text style={styles.mealBreakdownRating}>
                          ★ {t.avg_stars} / 5.0
                        </Text>
                      </View>
                      <ProgressBar
                        progress={ratio}
                        fillColor={COLORS.secondary}
                        trackColor={COLORS.surfaceSubtle}
                        height={10}
                      />
                      <View style={styles.mealBreakdownFooter}>
                        <Text style={styles.mealBreakdownSample}>
                          {t.n} student evaluations
                        </Text>
                        <Text style={styles.mealBreakdownStatus}>
                          {t.avg_stars >= 4
                            ? 'Excellent'
                            : t.avg_stars >= 3
                            ? 'Satisfactory'
                            : 'Needs Improvement'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'poll' && (
          <View>
            {/* Weekly Poll Live Results with Secondary Chart Bars */}
            <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.sectionCard]}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeaderTitle}>Sunday Special Poll Results</Text>
                <View style={GLOBAL_STYLES.secondaryBadge}>
                  <Text style={GLOBAL_STYLES.secondaryBadgeText}>Live Tally</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                360 student votes collected for this weekend's feast.
              </Text>

              <View style={styles.barsList}>
                {POLL_RESULTS_PREVIEW.map((item, idx) => (
                  <View key={idx} style={styles.pollResultItem}>
                    <View style={styles.pollResultHeader}>
                      <Text style={styles.pollResultName} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.pollResultPct}>{item.pct}%</Text>
                    </View>
                    {/* Chart bar using COLORS.secondary (#4F46E5) */}
                    <ProgressBar
                      progress={item.pct / 100}
                      fillColor={COLORS.secondary}
                      trackColor={COLORS.surfaceSubtle}
                      height={12}
                    />
                    <Text style={styles.pollResultVotes}>
                      {item.votes} votes cast
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  tabItemActive: {
    backgroundColor: COLORS.secondary,
  },
  tabText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  tabTextActive: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  kpiGrid: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  kpiCard: {
    flex: 1,
    padding: SPACING.md,
    marginBottom: 0,
    justifyContent: 'center',
  },
  kpiLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  kpiSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  warningStatNumber: {
    color: COLORS.warning,
  },
  sectionCard: {
    marginBottom: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardHeaderTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  cardHeaderCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  emptyCardText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginVertical: SPACING.md,
    textAlign: 'center',
  },
  barsList: {
    gap: SPACING.sm + 2,
    marginTop: SPACING.xs,
  },
  barItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  barItemLabel: {
    ...TYPOGRAPHY.bodyBold,
    width: 80,
    fontSize: 13,
  },
  barItemTagLabel: {
    ...TYPOGRAPHY.body,
    width: 100,
    fontSize: 13,
  },
  barItemTrack: {
    flex: 1,
  },
  barScoreGroup: {
    width: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  barScoreValue: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
    fontSize: 13,
  },
  barScoreCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  barTagCount: {
    ...TYPOGRAPHY.bodyBold,
    width: 32,
    textAlign: 'right',
    color: COLORS.textMain,
    fontSize: 13,
  },
  dangerBadge: {
    backgroundColor: '#FEE2E2',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  dangerBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontWeight: '700',
  },
  worstList: {
    marginTop: SPACING.xs,
  },
  worstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  worstMealTitle: {
    ...TYPOGRAPHY.bodyBold,
  },
  worstMealSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  worstScoreBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  worstScoreText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontWeight: '800',
  },
  mealBreakdownCard: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  mealBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealBreakdownTitle: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 15,
  },
  mealBreakdownRating: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  mealBreakdownFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  mealBreakdownSample: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  mealBreakdownStatus: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  pollResultItem: {
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  pollResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pollResultName: {
    ...TYPOGRAPHY.bodyBold,
    flex: 1,
    marginRight: SPACING.sm,
  },
  pollResultPct: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.secondary,
  },
  pollResultVotes: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
});
