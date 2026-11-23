import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BackLink, Header, PollOption, PrimaryButton } from '../../components/ui';
import { VotingScreenSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../lib/auth';
import { haptic } from '../../lib/haptics';
import { useTheme } from '../../theme/ThemeContext';
import {
  castVote,
  getActivePolls,
  getMyVote,
  getPollDetails,
  getPollResults,
  Poll,
  PollOptionResult,
} from '../../lib/polls';
import {
  COLORS,
  GLOBAL_STYLES,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/designSystem';

const DEMO_FALLBACK_OPTIONS: PollOptionResult[] = [
  {
    option_id: 'opt-1',
    title: 'Paneer Butter Masala & Dal Makhani',
    subtitle: 'Served with Butter Naan & Jeera Rice',
    is_veg: true,
    votes: 42,
  },
  {
    option_id: 'opt-2',
    title: 'Hyderabadi Chicken Biryani & Mirchi Ka Salan',
    subtitle: 'Served with Onion Raita & Gulab Jamun',
    is_veg: false,
    votes: 68,
  },
  {
    option_id: 'opt-3',
    title: 'South Indian Thali Special',
    subtitle: 'Masala Dosa, Idli-Vada, Medu Vada & Filter Coffee',
    is_veg: true,
    votes: 25,
  },
  {
    option_id: 'opt-4',
    title: 'Chole Bhature & Punjabi Lassi',
    subtitle: 'Served with Pickle, Fried Chillies & Boondi Raita',
    is_veg: true,
    votes: 35,
  },
];

export default function WeeklyVoting() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const params = useLocalSearchParams<{ pollId?: string }>();
  const { session, hostelId, role } = useAuth();
  const isAdmin = role === 'admin';
  const uid = session?.user.id;

  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOptionResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadPollData = useCallback(async () => {
    try {
      let poll: Poll | null = null;
      if (params.pollId) {
        poll = await getPollDetails(params.pollId);
      } else {
        const activeList = await getActivePolls(hostelId);
        if (activeList.length > 0) {
          poll = activeList[0];
        }
      }

      if (poll) {
        setActivePoll(poll);
        const results = await getPollResults(poll.id);
        setOptions(results.length > 0 ? results : DEMO_FALLBACK_OPTIONS);

        if (uid) {
          const myVote = await getMyVote(poll.id, uid);
          if (myVote) {
            setSelectedId(myVote);
            setHasVoted(true);
          }
        }
      } else {
        // Fallback for initial demo or when no poll in DB yet
        setActivePoll({
          id: 'demo-poll',
          hostel_id: hostelId ?? null,
          title: "Sunday's Special Dinner",
          meal_date: 'Sunday',
          closes_at: 'Friday 8 PM',
          status: 'open',
        });
        setOptions(DEMO_FALLBACK_OPTIONS);
      }
    } catch (e: any) {
      console.warn('Load poll error:', e?.message);
      setOptions(DEMO_FALLBACK_OPTIONS);
    }
  }, [params.pollId, hostelId, uid]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPollData().finally(() => setLoading(false));
    }, [loadPollData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPollData();
    setRefreshing(false);
  };

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  const handleSelect = (id: string) => {
    if (hasVoted || isAdmin) return;
    haptic.selection();
    setSelectedId(id);
  };

  const handleConfirmVote = async () => {
    if (!selectedId || hasVoted || isAdmin) return;
    haptic.medium();
    setSubmitting(true);

    try {
      if (activePoll && activePoll.id !== 'demo-poll' && uid) {
        await castVote(activePoll.id, selectedId, uid);
        await loadPollData();
      } else {
        // Demo mode state update
        setOptions((prev) =>
          prev.map((opt) =>
            opt.option_id === selectedId ? { ...opt, votes: opt.votes + 1 } : opt
          )
        );
      }
      haptic.success();
      setHasVoted(true);
    } catch (e: any) {
      haptic.warning();
      if (e?.message === 'ALREADY_VOTED') {
        Alert.alert('Already Voted', 'You have already recorded your vote for this poll.');
        setHasVoted(true);
      } else {
        Alert.alert('Vote Failed', e?.message || 'Could not record vote. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const subtitle = isAdmin
    ? `Admin View · ${activePoll ? activePoll.title : "Sunday's Special"} · ${totalVotes} student votes`
    : activePoll
    ? `Vote for ${activePoll.title} · Closes ${activePoll.closes_at}`
    : "Vote for Sunday's Special Dinner · Closes Friday 8 PM";

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <Header
        title="Weekly Meal Voting"
        subtitle={subtitle}
        left={params.pollId ? <BackLink onPress={() => router.back()} /> : undefined}
      />

      {loading ? (
        <VotingScreenSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <Text style={[s.sectionHeader, { color: colors.textMuted }]}>
            {isAdmin ? 'LIVE STUDENT CHOICES' : 'SELECT YOUR PREFERRED MENU'}
          </Text>

          {isAdmin && (
            <View style={{ marginBottom: SPACING.md }}>
              <View style={[GLOBAL_STYLES.badge, { backgroundColor: colors.surfaceSubtle, paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.md }]}>
                <Text style={[TYPOGRAPHY.caption, { color: colors.primary, fontWeight: '700' }]}>
                  👑 Admin View · Live student votes tally ({totalVotes} total votes)
                </Text>
              </View>
            </View>
          )}

          <View style={s.pollList}>
            {options.map((opt) => {
              const isSelected = selectedId === opt.option_id;
              const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;

              return (
                <PollOption
                  key={opt.option_id}
                  title={opt.title}
                  subtitle={opt.subtitle}
                  isVeg={opt.is_veg}
                  selected={isSelected}
                  votesPercentage={isAdmin || hasVoted ? percentage : undefined}
                  onSelect={() => handleSelect(opt.option_id)}
                  disabled={isAdmin || hasVoted}
                />
              );
            })}
          </View>

          {!isAdmin && hasVoted && (
            <View style={s.votedBadgeContainer}>
              <View style={[GLOBAL_STYLES.successBadge, { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' }]}>
                <Text style={[GLOBAL_STYLES.successBadgeText, { color: colors.success }]}>
                  Vote Recorded ✓ Thank you for participating!
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Sticky Bottom CTA for students only */}
      {!isAdmin && !hasVoted && !loading && (
        <View style={[GLOBAL_STYLES.stickyBottomCTA, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
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
    paddingBottom: SPACING.xxl + 60,
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
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
