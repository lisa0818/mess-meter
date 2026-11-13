import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Header } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { C, R, shadow } from '../../lib/theme';
import { dayLabel } from '../../lib/utils';

type Summary = { total_ratings: number; raters: number; members: number; avg_stars: number | null };
type Tag = { tag: string; n: number };
type TypeAvg = { meal_type: string; avg_stars: number; n: number };
type Worst = { meal_date: string; meal_type: string; avg_stars: number; n: number };

const colorFor = (v: number) => (v >= 4 ? C.good : v >= 3 ? '#F59E0B' : C.bad);

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
    if (err) { setError(err.message); return; }
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
    return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  const participation = sum && sum.members > 0 ? Math.round((sum.raters / sum.members) * 100) : 0;
  const maxTag = Math.max(1, ...tags.map((t) => t.n));

  const tiles = [
    { num: String(sum?.total_ratings ?? 0), lbl: 'Ratings' },
    { num: `${participation}%`, lbl: 'Participation' },
    { num: String(sum?.avg_stars ?? '–'), lbl: 'Avg ★' },
  ];

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={C.primary}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
        />
      }
    >
      <Header title="Management view" subtitle="Last 7 days · Demo Hostel A" pad={60} />

      <View style={{ paddingHorizontal: 20, marginTop: -40 }}>
        {error && <Text style={{ color: C.bad, marginBottom: 12 }}>Couldn't load: {error}</Text>}

        <View style={s.tiles}>
          {tiles.map((t) => (
            <View key={t.lbl} style={[s.tile, shadow]}>
              <Text style={s.tileNum}>{t.num}</Text>
              <Text style={s.tileLbl}>{t.lbl}</Text>
            </View>
          ))}
        </View>

        <Card>
          <Text style={s.cardTitle}>Average by meal</Text>
          {types.map((t) => (
            <View key={t.meal_type} style={s.barRow}>
              <Text style={s.barLbl}>{t.meal_type}</Text>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${(t.avg_stars / 5) * 100}%`, backgroundColor: colorFor(t.avg_stars) }]} />
              </View>
              <Text style={s.barVal}>{t.avg_stars}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={s.cardTitle}>Top feedback tags</Text>
          {tags.length === 0 && <Text style={{ color: C.muted }}>No tags yet.</Text>}
          {tags.map((t) => (
            <View key={t.tag} style={s.barRow}>
              <Text style={[s.barLbl, { width: 104 }]} numberOfLines={1}>{t.tag}</Text>
              <View style={s.barTrack}>
                <View
                  style={[
                    s.barFill,
                    { width: `${(t.n / maxTag) * 100}%`, backgroundColor: t.tag === 'Great taste' ? C.good : C.bad },
                  ]}
                />
              </View>
              <Text style={s.barVal}>{t.n}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={s.cardTitle}>Needs attention</Text>
          {worst.length === 0 && <Text style={{ color: C.muted }}>Nothing flagged.</Text>}
          {worst.map((w, i) => (
            <View key={i} style={s.worstRow}>
              <Text style={{ color: C.text, textTransform: 'capitalize', fontWeight: '600' }}>
                {dayLabel(w.meal_date)} {w.meal_type}
              </Text>
              <View style={[s.badge, { backgroundColor: C.badSoft }]}>
                <Text style={{ color: C.bad, fontWeight: '800' }}>
                  ★ {w.avg_stars} <Text style={{ fontWeight: '400' }}>({w.n})</Text>
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tiles: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tile: {
    flex: 1, backgroundColor: C.card, borderRadius: R.card, padding: 14,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  tileNum: { fontSize: 24, fontWeight: '800', color: C.primary },
  tileLbl: { color: C.muted, fontSize: 12, marginTop: 2 },
  cardTitle: { fontWeight: '800', color: C.text, marginBottom: 12, fontSize: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLbl: { width: 84, color: C.text, textTransform: 'capitalize', fontSize: 13 },
  barTrack: { flex: 1, height: 12, backgroundColor: '#F1EEE8', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 12, borderRadius: 6 },
  barVal: { width: 36, textAlign: 'right', fontWeight: '800', color: C.text },
  worstRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  badge: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
});