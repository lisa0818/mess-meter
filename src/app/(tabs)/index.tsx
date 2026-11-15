import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Card, Header, PrimaryButton, VegDot } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { sendTestReminder } from '../../lib/notifications';
import { getQueue } from '../../lib/ratings';
import { supabase } from '../../lib/supabase';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/designSystem';
import { MIN_RATINGS, todayStr } from '../../lib/utils';

const ORDER = ['breakfast', 'lunch', 'snacks', 'dinner'];
const TIMINGS: Record<string, string> = {
  breakfast: '7:30 AM – 9:30 AM',
  lunch: '12:30 PM – 2:30 PM',
  snacks: '5:00 PM – 6:15 PM',
  dinner: '8:00 PM – 10:00 PM',
};
const EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🍛',
  snacks: '☕',
  dinner: '🍽️',
};

type Meal = { id: string; meal_type: string; menu_items: string[] };
type Score = { meal_id: string; avg_stars: number; n: number };
type Mine = { stars: number | null; skipped: boolean };

const isMealNonVeg = (items: string[]) => {
  const nonVegKeywords = ['chicken', 'egg', 'fish', 'mutton', 'meat', 'prawn', 'beef', 'pork'];
  const text = items.join(' ').toLowerCase();
  return nonVegKeywords.some((k) => text.includes(k));
};

export default function Today() {
  const router = useRouter();
  const { session } = useAuth();
  const uid = session?.user.id;
  const [meals, setMeals] = useState<Meal[]>([]);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [mine, setMine] = useState<Record<string, Mine>>({});
  const [pending, setPending] = useState<Record<string, Mine>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = (await getQueue()).filter((x) => x.user_id === uid);
    setPending(Object.fromEntries(q.map((x) => [x.meal_id, { stars: x.stars, skipped: x.skipped }])));

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
      ((m.data ?? []) as Meal[]).sort((a, b) => ORDER.indexOf(a.meal_type) - ORDER.indexOf(b.meal_type))
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
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  // Determine current active meal slot
  const currentSlot = useMemo(() => {
    if (hr < 11) return 'breakfast';
    if (hr < 16) return 'lunch';
    if (hr < 18) return 'snacks';
    return 'dinner';
  }, [hr]);

  // The active meal is the currently matching time slot if unrated, or the first unrated meal
  const activeMealId = useMemo(() => {
    if (meals.length === 0) return null;
    const currentMeal = meals.find((m) => m.meal_type === currentSlot);
    if (currentMeal && !(mine[currentMeal.id] || pending[currentMeal.id])) {
      return currentMeal.id;
    }
    const firstUnrated = meals.find((m) => !(mine[m.id] || pending[m.id]));
    return firstUnrated?.id || meals[0]?.id;
  }, [meals, currentSlot, mine, pending]);

  const top = (
    <View style={s.topContainer}>
      <View style={s.actions}>
        <Pressable
          style={s.pillGhost}
          onPress={() => router.push('/feedback')}
          hitSlop={6}
        >
          <Text style={s.pillGhostText}>💬 Feedback</Text>
        </Pressable>
        <Pressable
          style={s.pillGhost}
          onPress={() => sendTestReminder('lunch')}
          hitSlop={6}
        >
          <Text style={s.pillGhostText}>🔔 Test reminder</Text>
        </Pressable>
      </View>

      {pendingCount > 0 && (
        <View style={s.banner}>
          <Text style={s.bannerText}>
            ⏳ {pendingCount} rating{pendingCount > 1 ? 's' : ''} saved offline. Will sync automatically.
          </Text>
        </View>
      )}

      {meals.length > 0 && (
        <Text style={s.sectionHeader}>TODAY'S SCHEDULE</Text>
      )}
    </View>
  );

  return (
    <View style={s.container}>
      <Header
        title="Today's Mess"
        subtitle={`${greet} · ${date}`}
        right={
          <Pressable
            style={s.signout}
            onPress={() => supabase.auth.signOut()}
            hitSlop={8}
          >
            <Text style={s.signoutText}>Sign out</Text>
          </Pressable>
        }
      />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          style={s.list}
          contentContainerStyle={s.listContent}
          data={meals}
          keyExtractor={(m) => m.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListHeaderComponent={top}
          ListEmptyComponent={
            <Text style={s.empty}>
              {error ? `Couldn't load meals:\n${error}\n\nPull down to retry.` : 'No meals scheduled for today.'}
            </Text>
          }
          renderItem={({ item }) => {
            const sc = scores[item.id];
            const my = mine[item.id] ?? pending[item.id];
            const isPending = !mine[item.id] && !!pending[item.id];
            const isActive = item.id === activeMealId && !my;
            const isNonVeg = isMealNonVeg(item.menu_items);
            const mealTitle = item.meal_type[0].toUpperCase() + item.meal_type.slice(1);
            const mainDish = item.menu_items[0] || mealTitle;
            const otherItems = item.menu_items.slice(1);

            return (
              <Card
                elevated={isActive}
                variant={my ? 'subtle' : 'bordered'}
                style={[s.cardWrapper, isActive ? s.activeCard : s.mutedCard]}
              >
                {/* Header row: veg dot + title + rating badge */}
                <View style={GLOBAL_STYLES.rowBetween}>
                  <View style={[GLOBAL_STYLES.rowStart, { flex: 1, marginRight: SPACING.sm }]}>
                    <VegDot isVeg={!isNonVeg} style={{ marginRight: SPACING.sm }} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={isActive ? TYPOGRAPHY.h2 : TYPOGRAPHY.h3}
                        numberOfLines={1}
                      >
                        {mainDish}
                      </Text>
                      <Text style={s.mealMeta}>
                        {EMOJI[item.meal_type]} {mealTitle} · {TIMINGS[item.meal_type] || 'Standard timings'}
                      </Text>
                    </View>
                  </View>

                  {sc && sc.avg_stars > 0 ? (
                    <View style={s.scoreChip}>
                      <Text style={s.scoreChipText}>
                        ★ {Number(sc.avg_stars).toFixed(1)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Secondary items list */}
                {otherItems.length > 0 ? (
                  <Text style={s.menuDetails} numberOfLines={2}>
                    {otherItems.join(' • ')}
                  </Text>
                ) : null}

                {/* CTA / status row */}
                <View style={s.ctaContainer}>
                  {my ? (
                    <View style={GLOBAL_STYLES.successBadge}>
                      <Text style={GLOBAL_STYLES.successBadgeText}>
                        {my.skipped
                          ? 'Marked as skipped ✓'
                          : `Rated ${'★'.repeat(my.stars ?? 0)} ✓`}
                        {isPending ? ' (syncing…)' : ''}
                      </Text>
                    </View>
                  ) : (
                    <PrimaryButton
                      label="Rate this meal"
                      variant={isActive ? 'primary' : 'soft'}
                      style={{ minHeight: isActive ? 46 : 40 }}
                      onPress={() =>
                        router.push({
                          pathname: '/rate',
                          params: { mealId: item.id, mealType: item.meal_type },
                        })
                      }
                    />
                  )}
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  topContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  pillGhost: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  pillGhostText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  signout: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  signoutText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  banner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bannerText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: SPACING.xxl,
    lineHeight: 22,
    fontSize: 14,
  },
  cardWrapper: {
    marginBottom: SPACING.md,
  },
  activeCard: {
    marginBottom: SPACING.lg,
  },
  mutedCard: {
    opacity: 0.95,
  },
  mealMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scoreChip: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    alignSelf: 'flex-start',
  },
  scoreChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  menuDetails: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  ctaContainer: {
    marginTop: SPACING.md,
  },
});
