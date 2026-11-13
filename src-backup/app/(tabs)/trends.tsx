import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator, Dimensions, RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { supabase } from '../../lib/supabase';
import { C } from '../../lib/theme';
import { dayLabel, daysAgoStr, MIN_RATINGS } from '../../lib/utils';

const W = Dimensions.get('window').width;
const CHART_W = W - 112;

type Row = { meal_id: string; meal_date: string; meal_type: string; avg_stars: number; n: number };

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const colorFor = (v: number) => (v >= 4 ? C.good : v >= 3 ? '#F59F00' : C.bad);

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
    if (error) { setError(error.message); return; }
    setError(null);
    setRows((data ?? []) as Row[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>;
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
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 4 }}>{v}</Text>
      ),
    };
  });

  const worst = [...rows].sort((a, b) => a.avg_stars - b.avg_stars)[0];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={C.primary}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
        />
      }
    >
      <Text style={s.title}>This week</Text>
      <Text style={s.sub}>How your hostel mess is doing, based on anonymous ratings.</Text>

      {error && <Text style={{ color: C.bad, marginTop: 16 }}>Couldn't load: {error}</Text>}

      {!error && rows.length === 0 && (
        <Text style={s.empty}>
          Not enough ratings yet. Scores appear once {MIN_RATINGS}+ students have rated a meal.
        </Text>
      )}

      {worst && (
        <View style={s.alert}>
          <Text style={{ fontSize: 12, color: C.bad, fontWeight: '700' }}>LOWEST RATED THIS WEEK</Text>
          <Text style={s.alertMain}>
            {dayLabel(worst.meal_date)} {worst.meal_type} · ★ {worst.avg_stars}
          </Text>
          <Text style={{ color: C.muted }}>{worst.n} ratings</Text>
        </View>
      )}

      {line.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Daily average</Text>
          <LineChart
            data={line}
            width={CHART_W}
            height={170}
            maxValue={5}
            noOfSections={5}
            spacing={Math.max(28, (CHART_W - 20) / Math.max(line.length, 1))}
            initialSpacing={12}
            color={C.primary}
            thickness={3}
            dataPointsColor={C.primary}
            curved
            isAnimated
            rulesColor={C.border}
            yAxisColor={C.border}
            xAxisColor={C.border}
            yAxisTextStyle={{ color: C.muted, fontSize: 11 }}
            xAxisLabelTextStyle={{ color: C.muted, fontSize: 11 }}
          />
        </View>
      )}

      {bars.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Average by meal</Text>
          <BarChart
            data={bars}
            width={CHART_W}
            height={160}
            maxValue={5}
            noOfSections={5}
            barWidth={38}
            spacing={22}
            initialSpacing={12}
            barBorderRadius={6}
            yAxisThickness={0}
            xAxisThickness={0}
            isAnimated
            rulesColor={C.border}
            yAxisTextStyle={{ color: C.muted, fontSize: 11 }}
            xAxisLabelTextStyle={{ color: C.muted, fontSize: 11 }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: C.text },
  sub: { color: C.muted, marginTop: 4, marginBottom: 18 },
  empty: { color: C.muted, textAlign: 'center', marginTop: 60, lineHeight: 22 },
  alert: { backgroundColor: '#FFF5F5', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#FFC9C9' },
  alertMain: { fontSize: 20, fontWeight: '800', color: C.text, marginVertical: 4, textTransform: 'capitalize' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardTitle: { fontWeight: '700', color: C.text, marginBottom: 14, fontSize: 16 },
});