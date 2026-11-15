import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BackLink, Header, PollOption, PrimaryButton } from '../components/ui';
import {
  COLORS,
  GLOBAL_STYLES,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

interface PollItem {
  id: string;
  title: string;
  subtitle: string;
  isVeg: boolean;
  votes: number;
}

const INITIAL_OPTIONS: PollItem[] = [
  {
    id: 'opt-1',
    title: 'Paneer Butter Masala & Dal Makhani',
    subtitle: 'Served with Butter Naan & Jeera Rice',
    isVeg: true,
    votes: 42,
  },
  {
    id: 'opt-2',
    title: 'Hyderabadi Chicken Biryani & Mirchi Ka Salan',
    subtitle: 'Served with Onion Raita & Gulab Jamun',
    isVeg: false,
    votes: 68,
  },
  {
    id: 'opt-3',
    title: 'South Indian Thali Special',
    subtitle: 'Masala Dosa, Idli-Vada, Medu Vada & Filter Coffee',
    isVeg: true,
    votes: 25,
  },
  {
    id: 'opt-4',
    title: 'Chole Bhature & Punjabi Lassi',
    subtitle: 'Served with Pickle, Fried Chillies & Boondi Raita',
    isVeg: true,
    votes: 35,
  },
];

export default function WeeklyVoting() {
  const router = useRouter();
  const [options, setOptions] = useState<PollItem[]>(INITIAL_OPTIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  const handleSelect = (id: string) => {
    if (hasVoted) return;
    setSelectedId(id);
  };

  const handleConfirmVote = () => {
    if (!selectedId || hasVoted) return;
    setSubmitting(true);
    setTimeout(() => {
      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === selectedId ? { ...opt, votes: opt.votes + 1 } : opt
        )
      );
      setHasVoted(true);
      setSubmitting(false);
    }, 500);
  };

  return (
    <View style={s.container}>
      <Header
        title="Weekly Meal Voting"
        subtitle="Vote for Sunday's Special Dinner · Closes Friday 8 PM"
        left={<BackLink onPress={() => router.back()} />}
      />

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionHeader}>SELECT YOUR PREFERRED MENU</Text>

        <View style={s.pollList}>
          {options.map((opt) => {
            const isSelected = selectedId === opt.id;
            const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;

            return (
              <PollOption
                key={opt.id}
                title={opt.title}
                subtitle={opt.subtitle}
                isVeg={opt.isVeg}
                selected={isSelected}
                votesPercentage={hasVoted ? percentage : undefined}
                onSelect={() => handleSelect(opt.id)}
                disabled={hasVoted}
              />
            );
          })}
        </View>

        {hasVoted && (
          <View style={s.votedBadgeContainer}>
            <View style={GLOBAL_STYLES.successBadge}>
              <Text style={GLOBAL_STYLES.successBadgeText}>
                Vote Recorded ✓ Thank you for participating!
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom CTA */}
      {!hasVoted && (
        <View style={GLOBAL_STYLES.stickyBottomCTA}>
          <PrimaryButton
            label={selectedId ? 'Confirm Weekly Vote' : 'Select an Option Above'}
            onPress={handleConfirmVote}
            busy={submitting}
            variant={selectedId ? 'primary' : 'soft'}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + 40,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  pollList: {
    marginBottom: SPACING.lg,
  },
  votedBadgeContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
});
