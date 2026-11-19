import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  DeviceEventEmitter,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { haptic } from '../lib/haptics';
import { setOnboardingCompleted } from '../lib/onboarding';
import { useTheme } from '../theme/ThemeContext';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../theme/designSystem';

interface Slide {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
  pills: string[];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: '🍽️',
    iconBg: COLORS.primaryLight,
    title: "Rate Today's Meals",
    subtitle:
      'Score breakfast, lunch, snacks, and dinner in 10 seconds. Completely anonymous, offline-ready, and directly heard by mess staff.',
    pills: ['🔒 100% Anonymous', '⏱️ 10s Daily', '⚡ Works Offline'],
  },
  {
    id: '2',
    icon: '📊',
    iconBg: COLORS.secondaryLight,
    title: 'Track Quality Trends',
    subtitle:
      'Watch ratings update in real-time as classmates rate. Mess committees and admins get actionable data on what needs improvement.',
    pills: ['📈 Live Scores', '🏆 Top & Worst Meals', '⚖️ Committee KPIs'],
  },
  {
    id: '3',
    icon: '🗳️',
    iconBg: COLORS.primaryLight,
    title: 'Shape the Weekly Menu',
    subtitle:
      'Cast your vote on Sunday specials and upcoming dishes. Democratic, transparent, and built for hostel residents.',
    pills: ['✨ Special Feasts', '🍱 Veg & Non-Veg', '🗳️ Democratic Voice'],
  },
];

export default function Onboarding() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fromProfile?: string }>();
  const { session, hostelId } = useAuth();
  const { isDark, colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const handleFinish = async () => {
    haptic.medium();
    await setOnboardingCompleted();
    DeviceEventEmitter.emit('onboarding-completed');

    if (params.fromProfile === 'true') {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/profile');
      }
    } else if (session && hostelId) {
      router.replace('/');
    } else if (session && !hostelId) {
      router.replace('/join');
    } else {
      router.replace('/login');
    }
  };

  const goToSlide = (index: number) => {
    if (index < 0 || index >= SLIDES.length) return;
    haptic.selection();
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      haptic.light();
      setActiveIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const onTouchStart = (e: GestureResponderEvent) => {
    touchStartX.current = e.nativeEvent.pageX;
  };

  const onTouchEnd = (e: GestureResponderEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.nativeEvent.pageX - touchStartX.current;
    touchStartX.current = null;

    // Minimum swipe threshold of 40px
    if (dx < -40) {
      // Swiped left -> advance slide
      if (activeIndex < SLIDES.length - 1) {
        haptic.light();
        setActiveIndex((prev) => prev + 1);
      }
    } else if (dx > 40) {
      // Swiped right -> go to previous slide
      if (activeIndex > 0) {
        haptic.light();
        setActiveIndex((prev) => prev - 1);
      }
    }
  };

  const isLast = activeIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[activeIndex];

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]}>
      {/* Top Bar: Brand and Skip */}
      <View style={s.topBar}>
        <View style={[s.brandBadge, { backgroundColor: colors.surfaceSubtle }]}>
          <Text style={[s.brandBadgeText, { color: colors.primary }]}>MESS METER</Text>
        </View>
        <Pressable
          onPress={handleFinish}
          hitSlop={14}
          style={s.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={[s.skipText, { color: colors.textMuted }]}>Skip</Text>
        </Pressable>
      </View>

      {/* Swipeable Slide Card */}
      <View
        style={s.slideContainer}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <View
          style={[
            s.iconBox,
            { backgroundColor: isDark ? colors.surfaceSubtle : currentSlide.iconBg },
          ]}
        >
          <Text style={s.iconEmoji}>{currentSlide.icon}</Text>
        </View>

        <Text style={[s.title, { color: colors.textMain }]}>{currentSlide.title}</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>{currentSlide.subtitle}</Text>

        <View style={s.pillRow}>
          {currentSlide.pills.map((pill, i) => (
            <View
              key={i}
              style={[
                s.pill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[s.pillText, { color: colors.textSecondary }]}>{pill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Area: Interactive Slider Pills and Primary CTA */}
      <View style={s.bottomContainer}>
        {/* Pagination Pills */}
        <View style={s.dotsRow}>
          {SLIDES.map((_, index) => {
            const active = index === activeIndex;
            return (
              <Pressable
                key={index}
                onPress={() => goToSlide(index)}
                hitSlop={14}
                style={s.dotTouch}
                accessibilityRole="button"
                accessibilityLabel={`Go to slide ${index + 1}`}
              >
                <View
                  style={[
                    s.dot,
                    active
                      ? [s.dotActive, { backgroundColor: colors.primary }]
                      : [s.dotInactive, { backgroundColor: colors.border }],
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Primary CTA */}
        <PrimaryButton
          label={isLast ? 'Get Started' : 'Next →'}
          onPress={handleNext}
          style={s.nextButton}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
  },
  topBar: {
    ...GLOBAL_STYLES.rowBetween,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    height: 50,
  },
  brandBadge: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  brandBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.2,
  },
  skipButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textMuted,
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  iconEmoji: {
    fontSize: 54,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  pill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dotTouch: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: RADIUS.full,
  },
  dotActive: {
    width: 28,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: 10,
    backgroundColor: COLORS.border,
  },
  nextButton: {
    width: '100%',
  },
});
