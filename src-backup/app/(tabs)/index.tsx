import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList, Pressable, RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../lib/auth';
import { sendTestReminder } from '../../lib/notifications';
import { getQueue } from '../../lib/ratings';
import { supabase } from '../../lib/supabase';
import { C } from '../../lib/theme';
import { MIN_RATINGS, todayStr } from '../../lib/utils';

const ORDER = ['breakfast', 'lunch', 'snacks', 'dinner'];
const EMOJI: Record<string, string> = { breakfast: '🍳', lunch: '🍛', snacks: '☕', dinner: '🍽️' };

type Meal = { id: string; meal_type: string; menu_items: string[] };
type Score = { meal_id: string; avg_stars: number; n: number };
type Mine = { stars: number | null; skipped: boolean };

export default function Today() {
  const router = useRouter();
  const { session, role } = useAuth();
  const uid = session?.user.id;
  const [meals, setMeals] = useState<Meal[]>([]);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [mine, setMine] = useState<Record<string, Mine>>({});
  const [pending, setPending] = useState<Record<string, Mine>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Offline-queued ratings are read first, so they show even with no network
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

  // Reload after offline ratings sync
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

  const header = (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.title}>Today's Mess</Text>
      <Text style={s.date}>
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
      </Text>
      <Text style={{ color: C.muted, fontSize: 12 }}>
  {session?.user.email} · role: {role}
</Text>
      <View style={s.links}>
        <Pressable onPress={() => router.push('../feedback')} hitSlop={8}>
          <Text style={s.link}>💬 Feedback</Text>
        </Pressable>
        <Pressable onPress={() => sendTestReminder('lunch')} hitSlop={8}>
          <Text style={s.link}>🔔 Test reminder</Text>
        </Pressable>
        <Pressable onPress={() => supabase.auth.signOut()} hitSlop={8}>
          <Text style={[s.link, { color: C.muted }]}>Sign out</Text>
        </Pressable>
      </View>
      {pendingCount > 0 && (
        <View style={s.banner}>
          <Text style={{ color: '#9C6B00', fontWeight: '600' }}>
            ⏳ {pendingCount} rating{pendingCount > 1 ? 's' : ''} saved offline. Will sync when you're back online.
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingTop: 56 }}
      data={meals}
      keyExtractor={(m) => m.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text style={s.empty}>
          {error ? `Couldn't load meals:\n${error}\n\nPull down to retry.` : 'No meals scheduled for today.'}
        </Text>
      }
      renderItem={({ item }) => {
        const sc = scores[item.id];
        const my = mine[item.id] ?? pending[item.id];
        const isPending = !mine[item.id] && !!pending[item.id];
        return (
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.mealName}>
                {EMOJI[item.meal_type]} {item.meal_type[0].toUpperCase() + item.meal_type.slice(1)}
              </Text>
              <View style={s.chip}>
                <Text style={s.chipText}>
                  {sc ? `★ ${sc.avg_stars} · ${sc.n} rating${sc.n > 1 ? 's' : ''}` : 'No score yet'}
                </Text>
              </View>
            </View>

            <Text style={s.items}>{item.menu_items.join(' • ')}</Text>

            {my ? (
              <View style={[s.btn, s.btnDone]}>
                <Text style={{ color: C.good, fontWeight: '700' }}>
                  {my.skipped ? '✓ Marked as skipped' : `✓ You rated ${'★'.repeat(my.stars ?? 0)}`}
                  {isPending ? '  (syncing…)' : ''}
                </Text>
              </View>
            ) : (
              <Pressable
                style={s.btn}
                onPress={() =>
                  router.push({ pathname: '/rate', params: { mealId: item.id, mealType: item.meal_type } })
                }
              >
                <Text style={s.btnText}>Rate this meal</Text>
              </Pressable>
            )}
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: C.text },
  date: { color: C.muted, marginTop: 2 },
  links: { flexDirection: 'row', gap: 18, marginTop: 12 },
  link: { color: C.primary, fontWeight: '600', fontSize: 13 },
  banner: { backgroundColor: '#FFF3BF', borderRadius: 12, padding: 12, marginTop: 14 },
  empty: { textAlign: 'center', color: C.muted, marginTop: 60, lineHeight: 22 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealName: { fontSize: 18, fontWeight: '700', color: C.text },
  chip: { backgroundColor: '#FFF3E0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { color: C.primary, fontWeight: '600', fontSize: 12 },
  items: { color: C.muted, marginVertical: 10, lineHeight: 20 },
  btn: { backgroundColor: C.primary, borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  btnDone: { backgroundColor: '#EBFBEE' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});