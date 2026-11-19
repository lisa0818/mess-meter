import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card, Header, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../theme/ThemeContext';
import { copyDayMenu, deleteMeal, getMealsForDate, Meal, upsertMeal } from '../../lib/meals';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/designSystem';

const SLOTS = [
  { type: 'breakfast', label: 'Breakfast', emoji: '🍳', timing: '7:30 AM – 9:30 AM' },
  { type: 'lunch', label: 'Lunch', emoji: '🍛', timing: '12:30 PM – 2:30 PM' },
  { type: 'snacks', label: 'Snacks', emoji: '☕', timing: '5:00 PM – 6:15 PM' },
  { type: 'dinner', label: 'Dinner', emoji: '🍽️', timing: '8:00 PM – 10:00 PM' },
];

const fmtDate = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export default function MenuManagement() {
  const router = useRouter();
  const { hostelId } = useAuth();
  const { isDark, colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>(() => fmtDate(new Date()));
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<string>('');
  const [savingSlot, setSavingSlot] = useState<string | null>(null);

  // Generate 7 days around the current week
  const dateList = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + (i - 1)); // Yesterday through +5 days
    return {
      iso: fmtDate(d),
      dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: fmtDate(d) === fmtDate(new Date()),
    };
  });

  const loadMeals = useCallback(async () => {
    try {
      const data = await getMealsForDate(selectedDate, hostelId);
      setMeals(data);
    } catch (e: any) {
      Alert.alert('Error loading menu', e?.message || 'Could not fetch meals.');
    }
  }, [selectedDate, hostelId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadMeals().finally(() => setLoading(false));
    }, [loadMeals])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
  };

  const startEdit = (slotType: string, existingItems: string[] = []) => {
    setEditingSlot(slotType);
    setDraftItems(existingItems.join(', '));
  };

  const cancelEdit = () => {
    setEditingSlot(null);
    setDraftItems('');
  };

  const handleSaveSlot = async (slotType: string) => {
    const items = draftItems
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

    if (items.length === 0) {
      Alert.alert('Empty menu', 'Please enter at least one dish name.');
      return;
    }

    setSavingSlot(slotType);
    try {
      const existing = meals.find((m) => m.meal_type === slotType);
      await upsertMeal({
        id: existing?.id,
        hostel_id: hostelId,
        meal_date: selectedDate,
        meal_type: slotType,
        menu_items: items,
      });
      await loadMeals();
      setEditingSlot(null);
      setDraftItems('');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message || 'Something went wrong.');
    } finally {
      setSavingSlot(null);
    }
  };

  const handleDeleteSlot = (slotType: string) => {
    const existing = meals.find((m) => m.meal_type === slotType);
    if (!existing?.id) return;

    Alert.alert(
      'Delete meal',
      `Are you sure you want to remove ${slotType} for this date?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeal(existing.id!);
              await loadMeals();
            } catch (e: any) {
              Alert.alert('Could not delete', e?.message || 'Error deleting meal.');
            }
          },
        },
      ]
    );
  };

  const handleCopyYesterday = async () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevStr = fmtDate(prevDate);

    Alert.alert(
      'Copy previous day menu',
      `Copy all meals from ${prevStr} to ${selectedDate}? Existing meals on this date will be replaced.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy & Replace',
          onPress: async () => {
            try {
              setLoading(true);
              const count = await copyDayMenu(prevStr, selectedDate, hostelId);
              await loadMeals();
              Alert.alert('Success', `Copied ${count} meals from previous day.`);
            } catch (e: any) {
              Alert.alert('Copy failed', e?.message || 'Could not copy menu.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[s.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Menu Management"
        subtitle="Schedule and customize daily hostel menus"
      />

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Horizontal Date Selector Strip */}
        <Text style={[s.sectionHeader, { color: colors.textMuted }]}>SELECT DATE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.dateStrip}
        >
          {dateList.map((d) => {
            const isSelected = d.iso === selectedDate;
            return (
              <Pressable
                key={d.iso}
                onPress={() => {
                  setSelectedDate(d.iso);
                  setEditingSlot(null);
                }}
                style={[
                  s.dateChip,
                  isSelected
                    ? [s.dateChipActive, { backgroundColor: colors.primary }]
                    : [s.dateChipInactive, { backgroundColor: colors.surface, borderColor: colors.border }],
                ]}
              >
                <Text
                  style={[
                    s.dateChipDay,
                    isSelected ? s.dateChipDayActive : [s.dateChipDayInactive, { color: colors.textMuted }],
                  ]}
                >
                  {d.dayName}
                </Text>
                <Text
                  style={[
                    s.dateChipNum,
                    isSelected ? s.dateChipNumActive : [s.dateChipNumInactive, { color: colors.textMain }],
                  ]}
                >
                  {d.dayNum}
                </Text>
                {d.isToday && (
                  <View
                    style={[
                      s.todayIndicator,
                      { backgroundColor: isSelected ? colors.textInverse : colors.primary },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quick Actions Row */}
        <View style={s.quickActionsRow}>
          <Pressable
            style={[s.quickActionBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
            onPress={handleCopyYesterday}
            hitSlop={6}
          >
            <Text style={[s.quickActionText, { color: colors.textSecondary }]}>📋 Copy Previous Day</Text>
          </Pressable>
          <Pressable
            style={[s.quickActionBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/admin-poll', params: { date: selectedDate } })}
            hitSlop={6}
          >
            <Text style={[s.quickActionText, { color: colors.textSecondary }]}>🗳️ Create Poll for Date</Text>
          </Pressable>
        </View>

        {/* Meal Slots List */}
        <Text style={[s.sectionHeader, { marginTop: SPACING.lg, color: colors.textMuted }]}>
          MEAL SCHEDULE FOR {selectedDate}
        </Text>

        {loading ? (
          <View style={s.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          SLOTS.map((slot) => {
            const mealData = meals.find((m) => m.meal_type === slot.type);
            const isEditing = editingSlot === slot.type;
            const hasItems = mealData && mealData.menu_items.length > 0;
            const isSaving = savingSlot === slot.type;

            return (
              <Card key={slot.type} variant="bordered" style={s.slotCard}>
                <View style={GLOBAL_STYLES.rowBetween}>
                  <View style={GLOBAL_STYLES.rowStart}>
                    <Text style={s.slotEmoji}>{slot.emoji}</Text>
                    <View>
                      <Text style={[TYPOGRAPHY.h3, { color: colors.textMain }]}>{slot.label}</Text>
                      <Text style={[s.slotTiming, { color: colors.textMuted }]}>{slot.timing}</Text>
                    </View>
                  </View>

                  {!isEditing && (
                    <Pressable
                      onPress={() => startEdit(slot.type, mealData?.menu_items)}
                      style={[s.editPill, { backgroundColor: colors.surfaceSubtle }]}
                    >
                      <Text style={[s.editPillText, { color: colors.primary }]}>
                        {hasItems ? 'Edit' : '+ Add'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Body: Items Display OR Editor */}
                {isEditing ? (
                  <View style={[s.editContainer, { borderTopColor: colors.surfaceSubtle }]}>
                    <Text style={[s.inputHint, { color: colors.textMuted }]}>
                      Enter dishes separated by commas (e.g. "Dal Makhani, Butter Roti, Gulab Jamun"):
                    </Text>
                    <TextInput
                      style={[s.inputBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMain }]}
                      value={draftItems}
                      onChangeText={setDraftItems}
                      placeholder="Paneer Tikka, Jeera Rice, Salad..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      autoFocus
                    />

                    <View style={s.editBtnRow}>
                      <Pressable
                        style={s.cancelBtn}
                        onPress={cancelEdit}
                        disabled={isSaving}
                      >
                        <Text style={[s.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                      </Pressable>

                      <PrimaryButton
                        label={isSaving ? 'Saving...' : 'Save Items'}
                        onPress={() => handleSaveSlot(slot.type)}
                        busy={isSaving}
                        style={s.saveBtn}
                      />
                    </View>
                  </View>
                ) : hasItems ? (
                  <View style={[s.itemsContainer, { borderTopColor: colors.surfaceSubtle }]}>
                    <Text style={[s.itemsText, { color: colors.textMain }]}>
                      {mealData!.menu_items.join(' • ')}
                    </Text>

                    <View style={s.itemFooterRow}>
                      <Pressable
                        onPress={() => handleDeleteSlot(slot.type)}
                        hitSlop={6}
                      >
                        <Text style={s.deleteText}>Delete meal</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Text style={[s.emptySlotText, { color: colors.textMuted }]}>
                    No menu items entered yet for {slot.label.toLowerCase()}.
                  </Text>
                )}
              </Card>
            );
          })
        )}
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
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  dateStrip: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  dateChip: {
    width: 60,
    height: 72,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  dateChipInactive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateChipActive: {
    backgroundColor: COLORS.primary,
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateChipDayInactive: {
    color: COLORS.textMuted,
  },
  dateChipDayActive: {
    color: COLORS.textInverse,
  },
  dateChipNum: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  dateChipNumInactive: {
    color: COLORS.textMain,
  },
  dateChipNumActive: {
    color: COLORS.textInverse,
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  slotCard: {
    marginBottom: SPACING.md,
  },
  slotEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  slotTiming: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  editPill: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  itemsContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceSubtle,
  },
  itemsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMain,
    lineHeight: 22,
  },
  itemFooterRow: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontWeight: '600',
  },
  emptySlotText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  editContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceSubtle,
  },
  inputHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  inputBox: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.textMain,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  editBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
  },
  cancelBtnText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    minHeight: 40,
    paddingHorizontal: SPACING.md,
  },
  centerLoading: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
});
