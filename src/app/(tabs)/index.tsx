import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card,
  Header,
  PrimaryButton,
  ProgressBar,
  VegIndicator,
} from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { sendTestReminder } from '../../lib/notifications';
import { getQueue } from '../../lib/ratings';
import { supabase } from '../../lib/supabase';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/designSystem';
import { MIN_RATINGS, todayStr } from '../../lib/utils';

const ORDER = ['breakfast', 'lunch', 'snacks', 'dinner'];
const EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🍛',
  snacks: '☕',
  dinner: '🍽️',
};

const MEAL_TIMES: Record<string, string> = {
  breakfast: '7:30 AM – 9:30 AM',
  lunch: '12:30 PM – 2:30 PM',
  snacks: '5:00 PM – 6:15 PM',
  dinner: '7:30 PM – 9:45 PM',
};

type Meal = { id: string; meal_type: string; menu_items: string[] };
type Score = { meal_id: string; avg_stars: number; n: number };
type Mine = { stars: number | null; skipped: boolean };

type PollOption = {
  id: string;
  title: string;
  description: string;
  isVeg: boolean;
  votes: number;
};

const INITIAL_POLL_OPTIONS: PollOption[] = [
  {
    id: 'opt-1',
    title: 'Paneer Tikka Biryani & Gulab Jamun',
    description: 'Dum-cooked saffron biryani, mint raita, roasted papad',
    isVeg: true,
    votes: 94,
  },
  {
    id: 'opt-2',
    title: 'Butter Chicken & Garlic Naan (Veg: Shahi Paneer)',
    description: 'Slow-simmered makhani gravy with tandoori breads & salad',
    isVeg: false,
    votes: 142,
  },
  {
    id: 'opt-3',
    title: 'South Indian Grand Feast & Payasam',
    description: 'Mysore masala dosa, lemon rice, medu vada, coconut chutney',
    isVeg: true,
    votes: 68,
  },
  {
    id: 'opt-4',
    title: 'Hakka Noodles & Chilli Paneer Bowl',
    description: 'Wok-tossed veg noodles, crispy veg spring rolls, Manchurian',
    isVeg: true,
    votes: 56,
  },
];

const POLL_STORAGE_KEY = '@mess_meter_poll_vote_v1';

const NON_VEG_REGEX = /(chicken|egg|fish|mutton|meat|beef|pork|keema|prawn)/i;
const isVegItem = (name: string): boolean => !NON_VEG_REGEX.test(name);

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

export default function Today() {
  const router = useRouter();
  const { session } = useAuth();
  const uid = session?.user.id;

  const [activeTab, setActiveTab] = useState<'meals' | 'poll'>('meals');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [mine, setMine] = useState<Record<string, Mine>>({});
  const [pending, setPending] = useState<Record<string, Mine>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll state
  const [pollOptions, setPollOptions] = useState<PollOption[]>(INITIAL_POLL_OPTIONS);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);

  // Load poll vote from storage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(POLL_STORAGE_KEY);
        if (saved) setSelectedVote(saved);
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleVote = async (optionId: string) => {
    if (selectedVote === optionId) return;

    const prevVote = selectedVote;
    setSelectedVote(optionId);

    setPollOptions((prev) =>
      prev.map((opt) => {
        if (opt.id === optionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        if (opt.id === prevVote) {
          return { ...opt, votes: Math.max(0, opt.votes - 1) };
        }
        return opt;
      })
    );

    try {
      await AsyncStorage.setItem(POLL_STORAGE_KEY, optionId);
    } catch {
      // ignore
    }
  };

  const load = useCallback(async () => {
    const q = (await getQueue()).filter((x) => x.user_id === uid);
    setPending(
      Object.fromEntries(
        q.map((x) => [x.meal_id, { stars: x.stars, skipped: x.skipped }])
      )
    );

    const today = todayStr();
    const [m, s, r] = await Promise.all([
      supabase.from('meals').select('id, meal_type, menu_items').eq('meal_date', today),
      supabase.rpc('meal_scores', { p_from: today, p_min: MIN_RATINGS }),
      supabase.from('ratings').select('meal_id, stars, skipped'),
    ]);

    if (m.error || s.error || r.error) {
      setError((m.error || s.error || r.error)!.message);
      return;
    }
    setError(null);
    setMeals(
      ((m.data ?? []) as Meal[]).sort(
        (a, b) => ORDER.indexOf(a.meal_type) - ORDER.indexOf(b.meal_type)
      )
    );
    setScores(Object.fromEntries((s.data ?? []).map((x: Score) => [x.meal_id, x])));
    setMine(Object.fromEntries((r.data ?? []).map((x: any) => [x.meal_id, x])));
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('ratings-synced', () => load());
    return () => sub.remove();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pendingCount = Object.keys(pending).length;
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const date = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const totalPollVotes = pollOptions.reduce((acc, curr) => acc + curr.votes, 0);

  const headerContent = (
    <View style={styles.topSection}>
      {/* View Switcher: Meals vs Weekly Poll */}
      <View style={styles.segmentedControl}>
        <Pressable
          style={[
            styles.segmentButton,
            activeTab === 'meals' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('meals')}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'meals' && styles.segmentTextActive,
            ]}
          >
            🍽️ Today's Menu
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentButton,
            activeTab === 'poll' && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveTab('poll')}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === 'poll' && styles.segmentTextActive,
            ]}
          >
            🗳️ Weekly Poll
          </Text>
        </Pressable>
      </View>

      {/* Quick Actions Row */}
      <View style={styles.actionPillsRow}>
        <Pressable
          style={styles.pill}
          onPress={() => router.push('/feedback')}
          accessibilityRole="button"
        >
          <Text style={styles.pillText}>💬 Feedback</Text>
        </Pressable>
        <Pressable
          style={styles.pill}
          onPress={() => sendTestReminder('lunch')}
          accessibilityRole="button"
        >
          <Text style={styles.pillText}>🔔 Test reminder</Text>
        </Pressable>
      </View>

      {/* Offline Pending Banner */}
      {pendingCount > 0 && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            ⏳ {pendingCount} rating{pendingCount > 1 ? 's' : ''} saved offline. Will sync when you're back online.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Mess Meter"
        subtitle={`${greet} · ${date}`}
        padBottom={SPACING.xxl + SPACING.md}
        right={
          <Pressable
            style={styles.signOutButton}
            onPress={() => supabase.auth.signOut()}
            hitSlop={SPACING.sm}
            accessibilityRole="button"
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : activeTab === 'meals' ? (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={meals}
          keyExtractor={(m) => m.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListHeaderComponent={headerContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {error
                ? `Couldn't load meals:\n${error}\n\nPull down to retry.`
                : 'No meals scheduled for today.'}
            </Text>
          }
          renderItem={({ item }) => {
            const sc = scores[item.id];
            const my = mine[item.id] ?? pending[item.id];
            const isPending = !mine[item.id] && !!pending[item.id];
            const mealTitle = capitalize(item.meal_type);
            const timing = MEAL_TIMES[item.meal_type] || '';

            return (
              <View style={[GLOBAL_STYLES.card, SHADOWS.card, styles.mealCard]}>
                {/* Meal Header: Badge & Score */}
                <View style={styles.mealHeaderRow}>
                  <View style={styles.mealTitleGroup}>
                    <View style={styles.mealIconCircle}>
                      <Text style={styles.mealIconEmoji}>
                        {EMOJI[item.meal_type] || '🍽️'}
                      </Text>
                    </View>
                    <View>
                      <View style={GLOBAL_STYLES.badge}>
                        <Text style={GLOBAL_STYLES.badgeText}>{mealTitle}</Text>
                      </View>
                      {timing ? (
                        <Text style={styles.mealTimingText}>{timing}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Score Pill with Star */}
                  {sc ? (
                    <View style={styles.scorePill}>
                      <Text style={styles.scoreStarIcon}>★</Text>
                      <Text style={styles.scoreValueText}>{sc.avg_stars}</Text>
                      <Text style={styles.scoreCountText}>({sc.n})</Text>
                    </View>
                  ) : (
                    <View style={styles.noScorePill}>
                      <Text style={styles.noScoreText}>Not rated yet</Text>
                    </View>
                  )}
                </View>

                {/* Menu Items with Veg/Non-Veg Indicators */}
                <View style={styles.menuItemsList}>
                  {item.menu_items.map((menuItem, idx) => {
                    const isVeg = isVegItem(menuItem);
                    return (
                      <View key={idx} style={styles.menuItemRow}>
                        {/* Dot indicator: COLORS.success for Veg, COLORS.danger for Non-Veg */}
                        <VegIndicator isVeg={isVeg} size="sm" />
                        <Text style={styles.menuItemTitle}>{menuItem}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Rating CTA Button */}
                {my ? (
                  <PrimaryButton
                    variant="done"
                    label={
                      (my.skipped
                        ? '✓ Marked as skipped'
                        : `✓ You rated ${'★'.repeat(my.stars ?? 0)}`) +
                      (isPending ? ' (syncing…)' : '')
                    }
                    style={styles.ratedButton}
                  />
                ) : (
                  <PrimaryButton
                    label="Rate this meal"
                    style={styles.rateButton}
                    onPress={() =>
                      router.push({
                        pathname: '/rate',
                        params: { mealId: item.id, mealType: item.meal_type },
                      })
                    }
                  />
                )}
              </View>
            );
          }}
        />
      ) : (
        /* Weekly Poll / Voting UI */
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={pollOptions}
          keyExtractor={(opt) => opt.id}
          ListHeaderComponent={
            <View>
              {headerContent}
              <View style={styles.pollHeaderCard}>
                <View style={styles.pollBadgeRow}>
                  <View style={GLOBAL_STYLES.badge}>
                    <Text style={GLOBAL_STYLES.badgeText}>WEEKLY VOTE</Text>
                  </View>
                  <Text style={styles.pollTallyText}>
                    {totalPollVotes} total votes cast
                  </Text>
                </View>
                <Text style={styles.pollQuestionTitle}>
                  Sunday Special Dinner Menu
                </Text>
                <Text style={styles.pollQuestionSubtitle}>
                  Choose the weekend special feast. The winning combo will be served this Sunday!
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedVote === item.id;
            const percentage =
              totalPollVotes > 0
                ? Math.round((item.votes / totalPollVotes) * 100)
                : 0;

            return (
              <Pressable
                onPress={() => handleVote(item.id)}
                accessibilityRole="button"
                style={[
                  GLOBAL_STYLES.card,
                  SHADOWS.card,
                  styles.pollOptionCard,
                  isSelected && styles.pollOptionCardSelected,
                ]}
              >
                <View style={styles.pollCardTopRow}>
                  <View style={styles.pollTitleGroup}>
                    <VegIndicator isVeg={item.isVeg} size="sm" showLabel />
                    <Text
                      style={[
                        styles.pollOptionTitle,
                        isSelected && styles.pollOptionTitleSelected,
                      ]}
                    >
                      {item.title}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={GLOBAL_STYLES.badge}>
                      <Text style={GLOBAL_STYLES.badgeText}>✓ Voted</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.pollOptionDescription}>
                  {item.description}
                </Text>

                {/* Vote Percentage and Progress Bar */}
                <View style={styles.pollProgressSection}>
                  <View style={styles.pollStatsRow}>
                    <Text style={styles.pollVotesText}>
                      {item.votes} votes
                    </Text>
                    <Text
                      style={[
                        styles.pollPercentText,
                        isSelected && styles.pollPercentTextSelected,
                      ]}
                    >
                      {percentage}%
                    </Text>
                  </View>

                  {/* Horizontal bar: COLORS.surfaceSubtle track, COLORS.primary fill */}
                  <ProgressBar
                    progress={percentage / 100}
                    trackColor={COLORS.surfaceSubtle}
                    fillColor={COLORS.primary}
                    height={8}
                  />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    marginTop: -SPACING.xl,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  topSection: {
    marginBottom: SPACING.sm,
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  signOutText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  segmentText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  actionPillsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  pill: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  pillText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  offlineBannerText: {
    ...TYPOGRAPHY.body,
    color: '#92400E',
    fontWeight: '600',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: SPACING.xxl,
    lineHeight: 22,
  },
  mealCard: {
    marginBottom: SPACING.md,
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  mealTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  mealIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIconEmoji: {
    fontSize: 22,
  },
  mealTimingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  scoreStarIcon: {
    color: COLORS.star,
    fontSize: 14,
    fontWeight: '700',
  },
  scoreValueText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMain,
    fontWeight: '700',
  },
  scoreCountText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  noScorePill: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  noScoreText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  menuItemsList: {
    marginVertical: SPACING.sm,
    gap: SPACING.xs + 2,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 2,
  },
  menuItemTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMain,
    flex: 1,
  },
  rateButton: {
    minHeight: 46,
    marginTop: SPACING.xs,
  },
  ratedButton: {
    minHeight: 46,
    marginTop: SPACING.xs,
  },
  pollHeaderCard: {
    ...GLOBAL_STYLES.card,
    ...SHADOWS.card,
    marginBottom: SPACING.md,
  },
  pollBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  pollTallyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pollQuestionTitle: {
    ...TYPOGRAPHY.h2,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  pollQuestionSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  pollOptionCard: {
    marginBottom: SPACING.md,
  },
  pollOptionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  pollCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  pollTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  pollOptionTitle: {
    ...TYPOGRAPHY.h3,
    flex: 1,
  },
  pollOptionTitleSelected: {
    color: COLORS.primary,
  },
  pollOptionDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.md + SPACING.xs,
  },
  pollProgressSection: {
    marginTop: SPACING.xs,
  },
  pollStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  pollVotesText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  pollPercentText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  pollPercentTextSelected: {
    color: COLORS.primary,
  },
});
