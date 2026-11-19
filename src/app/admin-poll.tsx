import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BackLink, Card, Header, PrimaryButton, VegDot } from '../components/ui';
import { useAuth } from '../lib/auth';
import { createPoll } from '../lib/polls';
import { useTheme } from '../theme/ThemeContext';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

interface OptionDraft {
  title: string;
  subtitle: string;
  is_veg: boolean;
}

const getDefaultDates = () => {
  const now = new Date();
  const sunday = new Date(now);
  const day = now.getDay();
  const diff = day === 0 ? 7 : 7 - day;
  sunday.setDate(now.getDate() + diff);
  const p = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${sunday.getFullYear()}-${p(sunday.getMonth() + 1)}-${p(sunday.getDate())}`;

  const friday = new Date(sunday);
  friday.setDate(sunday.getDate() - 2);
  friday.setHours(20, 0, 0, 0);

  return {
    mealDate: dateStr,
    closesAt: friday.toISOString(),
  };
};

export default function AdminPoll() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { session, hostelId, role } = useAuth();
  const { colors } = useTheme();
  const uid = session?.user.id;

  const defaults = getDefaultDates();
  const [title, setTitle] = useState("Sunday's Special Feast");
  const [mealDate, setMealDate] = useState(params.date || defaults.mealDate);
  const [closesAt, setClosesAt] = useState(defaults.closesAt);
  const [busy, setBusy] = useState(false);

  const [options, setOptions] = useState<OptionDraft[]>([
    {
      title: 'Paneer Butter Masala & Dal Makhani',
      subtitle: 'Served with Butter Naan & Jeera Rice',
      is_veg: true,
    },
    {
      title: 'Hyderabadi Chicken Biryani & Salan',
      subtitle: 'Served with Onion Raita & Gulab Jamun',
      is_veg: false,
    },
  ]);

  const addOption = () => {
    if (options.length >= 6) {
      Alert.alert('Limit reached', 'A poll can have at most 6 options.');
      return;
    }
    setOptions((prev) => [
      ...prev,
      { title: '', subtitle: '', is_veg: true },
    ]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      Alert.alert('Minimum options', 'A poll must have at least 2 options.');
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, key: keyof OptionDraft, value: any) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [key]: value } : opt))
    );
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a title for the poll.');
      return;
    }

    const validOptions = options.filter((o) => o.title.trim().length > 0);
    if (validOptions.length < 2) {
      Alert.alert('Incomplete options', 'Please provide at least 2 complete dish options.');
      return;
    }

    if (!uid || role !== 'admin') {
      Alert.alert('Not authorized', 'Admin access required to publish polls.');
      return;
    }

    // Validate and format dates for PostgreSQL DATE and TIMESTAMPTZ
    const parsedMeal = new Date(mealDate.trim());
    if (isNaN(parsedMeal.getTime())) {
      Alert.alert('Invalid target date', 'Please enter a valid date in YYYY-MM-DD format.');
      return;
    }
    const p = (n: number) => String(n).padStart(2, '0');
    const formattedMealDate = `${parsedMeal.getFullYear()}-${p(parsedMeal.getMonth() + 1)}-${p(parsedMeal.getDate())}`;

    const parsedCloses = new Date(closesAt.trim());
    const formattedClosesAt = isNaN(parsedCloses.getTime())
      ? defaults.closesAt
      : parsedCloses.toISOString();

    setBusy(true);
    try {
      await createPoll(
        {
          hostel_id: hostelId,
          title: title.trim(),
          meal_date: formattedMealDate,
          closes_at: formattedClosesAt,
          options: validOptions.map((o) => ({
            title: o.title.trim(),
            subtitle: o.subtitle.trim(),
            is_veg: o.is_veg,
          })),
        },
        uid
      );

      Alert.alert('Poll Published', 'Students can now vote on this menu.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Publish failed', e?.message || 'Could not create poll.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Create Weekly Poll"
        subtitle="Set up meal choices for student voting"
        left={<BackLink onPress={() => router.back()} />}
      />

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Poll Metadata */}
        <Card variant="bordered">
          <Text style={[s.label, { color: colors.textMuted }]}>POLL TITLE</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMain }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Sunday Special Dinner"
            placeholderTextColor={colors.textMuted}
          />

          <View style={[GLOBAL_STYLES.rowBetween, { gap: SPACING.sm, marginTop: SPACING.md }]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.label, { color: colors.textMuted }]}>TARGET DATE</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMain }]}
                value={mealDate}
                onChangeText={setMealDate}
                placeholder="e.g. 2026-11-22"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.label, { color: colors.textMuted }]}>CLOSES AT</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMain }]}
                value={closesAt}
                onChangeText={setClosesAt}
                placeholder="e.g. Friday 8:00 PM"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </Card>

        {/* Options List */}
        <View style={[GLOBAL_STYLES.rowBetween, { marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>
          <Text style={[s.sectionHeader, { color: colors.textMuted }]}>MENU OPTIONS ({options.length})</Text>
          <Pressable onPress={addOption} hitSlop={8}>
            <Text style={[s.addOptionText, { color: colors.primary }]}>+ Add Option</Text>
          </Pressable>
        </View>

        {options.map((opt, index) => (
          <Card key={index} variant="bordered" style={s.optionCard}>
            <View style={GLOBAL_STYLES.rowBetween}>
              <View style={GLOBAL_STYLES.rowStart}>
                <VegDot isVeg={opt.is_veg} style={{ marginRight: SPACING.xs }} />
                <Text style={[TYPOGRAPHY.h3, { color: colors.textMain }]}>Choice #{index + 1}</Text>
              </View>

              {options.length > 2 && (
                <Pressable onPress={() => removeOption(index)} hitSlop={8}>
                  <Text style={s.removeText}>Remove</Text>
                </Pressable>
              )}
            </View>

            <TextInput
              style={[s.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMain, marginTop: SPACING.sm }]}
              value={opt.title}
              onChangeText={(val) => updateOption(index, 'title', val)}
              placeholder="Dish Name (e.g. Chole Bhature & Lassi)"
              placeholderTextColor={colors.textMuted}
            />

            <TextInput
              style={[s.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMain, marginTop: SPACING.xs }]}
              value={opt.subtitle}
              onChangeText={(val) => updateOption(index, 'subtitle', val)}
              placeholder="Sides / details (optional)"
              placeholderTextColor={colors.textMuted}
            />

            <View style={[GLOBAL_STYLES.rowBetween, { marginTop: SPACING.sm }]}>
              <Text style={[TYPOGRAPHY.body, { color: colors.textSecondary }]}>Vegetarian dish</Text>
              <Switch
                value={opt.is_veg}
                onValueChange={(val) => updateOption(index, 'is_veg', val)}
                trackColor={{ false: colors.surfaceSubtle, true: colors.primaryLight }}
                thumbColor={opt.is_veg ? colors.primary : colors.textMuted}
              />
            </View>
          </Card>
        ))}

        <PrimaryButton
          label="Publish Poll for Students"
          onPress={handlePublish}
          busy={busy}
          style={{ marginTop: SPACING.md, marginBottom: SPACING.xl }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  label: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
  },
  addOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textMain,
  },
  optionCard: {
    marginBottom: SPACING.sm,
  },
  removeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontWeight: '600',
  },
});
