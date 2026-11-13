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
import { Card, Header, PrimaryButton } from '../../components/ui';
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

const chipColors = (v: number) =>
  v >= 4 ? { bg: C.goodSoft, fg: C.good }
  : v >= 3 ? { bg: C.warnSoft, fg: C.warnText }
  : { bg: C.badSoft, fg: C.bad };

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

  const top = (
    <View>
      <View style={s.actions}>
        <Pressable style={s.pill} onPress={() => router.push('/feedback')}>
          <Text style={s.pillText}>💬 Feedback</Text>
        </Pressable>
        <Pressable style={s.pill} onPress={() => sendTestReminder('lunch')}>
          <Text style={s.pillText}>🔔 Test reminder</Text>
        </Pressable>
      </View>
      {pendingCount > 0 && (
        <View style={s.banner}>
          <Text style={{ color: C.warnText, fontWeight: '600' }}>
            ⏳ {pendingCount} rating{pendingCount > 1 ? 's' : ''} saved offline. Will sync when you're back online.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Header
        title="Today's Mess"
        subtitle={`${greet} · ${date}`}
        pad={48}
        right={
          <Pressable style={s.signout} onPress={() => supabase.auth.signOut()} hitSlop={8}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Sign out</Text>
          </Pressable>
        }
      />

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList
          style={{ flex: 1, marginTop: -26 }}
          contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 30 }}
          data={meals}
          keyExtractor={(m) => m.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
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
            const cc = sc ? chipColors(Number(sc.avg_stars)) : { bg: '#F3F4F6', fg: C.muted };
            return (
              <Card>
                <View style={s.row}>
                  <View style={s.iconWrap}><Text style={{ fontSize: 22 }}>{EMOJI[item.meal_type]}</Text></View>
                  <Text style={s.mealName}>
                    {item.meal_type[0].toUpperCase() + item.meal_type.slice(1)}
                  </Text>
                  <View style={[s.chip, { backgroundColor: cc.bg }]}>
                    <Text style={[s.chipText, { color: cc.fg }]}>
                      {sc ? `★ ${sc.avg_stars} · ${sc.n}` : 'No score yet'}
                    </Text>
                  </View>
                </View>

                <Text style={s.items}>{item.menu_items.join(' • ')}</Text>

                {my ? (
                  <PrimaryButton
                    variant="done"
                    label={
                      (my.skipped ? '✓ Marked as skipped' : `✓ You rated ${'★'.repeat(my.stars ?? 0)}`) +
                      (isPending ? '  (syncing…)' : '')
                    }
                    style={{ minHeight: 46 }}
                  />
                ) : (
                  <PrimaryButton
                    label="Rate this meal"
                    style={{ minHeight: 46 }}
                    onPress={() =>
                      router.push({ pathname: '/rate', params: { mealId: item.id, mealType: item.meal_type } })
                    }
                  />
                )}
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  signout: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  pill: {
    backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: C.border,
  },
  pillText: { color: C.primary, fontWeight: '700', fontSize: 13 },
  banner: { backgroundColor: C.warnSoft, borderRadius: 14, padding: 12, marginBottom: 14 },
  empty: { textAlign: 'center', color: C.muted, marginTop: 60, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  mealName: { flex: 1, fontSize: 18, fontWeight: '800', color: C.text },
  chip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontWeight: '700', fontSize: 12 },
  items: { color: C.muted, marginVertical: 12, lineHeight: 20 },
});