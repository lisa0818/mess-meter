import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card, Header, PrimaryButton } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { haptic } from '../../lib/haptics';
import {
  cancelReminders,
  registerForPushNotificationsAsync,
  sendTestReminder,
  setupReminders,
} from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/ThemeContext';
import {
  COLORS,
  GLOBAL_STYLES,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/designSystem';

export default function Profile() {
  const router = useRouter();
  const { session, email, hostelName, role, refreshProfile } = useAuth();
  const { themeMode, setThemeMode, isDark, colors } = useTheme();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [busyPassword, setBusyPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('reminders_enabled').then((val) => {
      if (val !== null) {
        setRemindersEnabled(val === 'true');
      }
    });
  }, []);

  const toggleReminders = async (val: boolean) => {
    haptic.selection();
    setRemindersEnabled(val);
    await AsyncStorage.setItem('reminders_enabled', String(val));
    if (val) {
      await setupReminders();
      if (session?.user?.id) {
        await registerForPushNotificationsAsync(session.user.id);
      }
      haptic.success();
      Alert.alert('Reminders active', 'Meal reminders are scheduled daily.');
    } else {
      await cancelReminders();
      haptic.light();
      Alert.alert('Reminders paused', 'Daily reminders have been disabled.');
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters long.');
      return;
    }
    setBusyPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusyPassword(false);
    if (error) {
      Alert.alert('Update failed', error.message);
    } else {
      Alert.alert('Success', 'Your password has been updated.');
      setNewPassword('');
      setChangingPassword(false);
    }
  };

  const handleLeaveHostel = () => {
    Alert.alert(
      'Leave hostel',
      'Are you sure you want to leave your current hostel? You will need an invite code to join again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error: rpcErr } = await supabase.rpc('leave_hostel');
              if (rpcErr && session?.user.id) {
                await supabase
                  .from('profiles')
                  .update({ hostel_id: null })
                  .eq('id', session.user.id);
              }
              await refreshProfile();
              router.replace('/join');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Could not leave hostel.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
  };

  const userInitial = (email?.[0] || session?.user.email?.[0] || 'U').toUpperCase();
  const displayEmail = email || session?.user.email || 'user@university.edu';
  const displayHostel = hostelName || 'Demo Hostel A';

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <Header
        title="Profile & Settings"
        subtitle="Account preferences & details"
      />

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Card */}
        <Card variant="bordered" style={s.profileCard}>
          <View style={[s.avatarCircle, { backgroundColor: colors.primaryLight }]}>
            <Text style={[s.avatarText, { color: colors.primary }]}>{userInitial}</Text>
          </View>

          <Text style={[TYPOGRAPHY.h2, { marginTop: SPACING.md, color: colors.textMain }]}>
            {displayEmail}
          </Text>

          <View style={[GLOBAL_STYLES.rowStart, { gap: SPACING.sm, marginTop: SPACING.xs }]}>
            <View
              style={
                role === 'admin'
                  ? [s.adminBadge, { backgroundColor: colors.secondaryLight }]
                  : [s.studentBadge, { backgroundColor: colors.surfaceSubtle }]
              }
            >
              <Text
                style={
                  role === 'admin'
                    ? [s.adminBadgeText, { color: colors.secondary }]
                    : [s.studentBadgeText, { color: colors.textSecondary }]
                }
              >
                {role === 'admin' ? 'Mess Admin' : 'Student'}
              </Text>
            </View>
            <Text style={[s.hostelTag, { color: colors.textMuted }]}>🏠 {displayHostel}</Text>
          </View>
        </Card>

        {/* Preferences Section */}
        <Text style={[s.sectionHeader, { color: colors.textMuted }]}>NOTIFICATIONS & ALERTS</Text>
        <Card variant="bordered">
          <View style={GLOBAL_STYLES.rowBetween}>
            <View style={{ flex: 1, marginRight: SPACING.md }}>
              <Text style={[TYPOGRAPHY.bodyBold, { color: colors.textMain }]}>Daily Meal Reminders</Text>
              <Text style={[s.subText, { color: colors.textMuted }]}>
                Receive alerts at breakfast, lunch, and dinner to rate food.
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={toggleReminders}
              trackColor={{ false: colors.surfaceSubtle, true: colors.primaryLight }}
              thumbColor={remindersEnabled ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={[s.divider, { backgroundColor: colors.border }]} />

          <Pressable
            style={GLOBAL_STYLES.rowBetween}
            onPress={() => sendTestReminder('lunch')}
            hitSlop={8}
          >
            <Text style={[TYPOGRAPHY.body, { color: colors.textMain }]}>Send Test Reminder Now</Text>
            <Text style={[s.actionLink, { color: colors.primary }]}>Test 🔔</Text>
          </Pressable>
        </Card>

        {/* Appearance Settings */}
        <Text style={[s.sectionHeader, { marginTop: SPACING.lg, color: colors.textMuted }]}>APPEARANCE</Text>
        <Card variant="bordered">
          <View style={s.themeRow}>
            {(
              [
                { mode: 'system', label: 'System', icon: '⚙️' },
                { mode: 'light', label: 'Light', icon: '☀️' },
                { mode: 'dark', label: 'Dark', icon: '🌙' },
              ] as const
            ).map((item) => {
              const active = themeMode === item.mode;
              return (
                <Pressable
                  key={item.mode}
                  onPress={() => {
                    haptic.selection();
                    setThemeMode(item.mode);
                  }}
                  style={[
                    s.themeBtn,
                    {
                      backgroundColor: active ? colors.primaryLight : colors.surfaceSubtle,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={s.themeIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      TYPOGRAPHY.caption,
                      {
                        color: active ? colors.primary : colors.textSecondary,
                        fontWeight: active ? '700' : '500',
                        marginTop: 4,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Security & Account Actions */}
        <Text style={[s.sectionHeader, { marginTop: SPACING.lg, color: colors.textMuted }]}>ACCOUNT & SECURITY</Text>
        <Card variant="bordered">
          {changingPassword ? (
            <View>
              <Text style={[s.label, { color: colors.textMuted }]}>NEW PASSWORD</Text>
              <TextInput
                style={[s.input, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, color: colors.textMain }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter at least 6 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoFocus
              />
              <View style={[GLOBAL_STYLES.rowBetween, { marginTop: SPACING.md }]}>
                <Pressable
                  onPress={() => {
                    setChangingPassword(false);
                    setNewPassword('');
                  }}
                  style={{ padding: SPACING.sm }}
                >
                  <Text style={[s.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>
                <PrimaryButton
                  label="Update Password"
                  onPress={handleUpdatePassword}
                  busy={busyPassword}
                  style={{ minHeight: 40, paddingHorizontal: SPACING.md }}
                />
              </View>
            </View>
          ) : (
            <Pressable
              style={GLOBAL_STYLES.rowBetween}
              onPress={() => setChangingPassword(true)}
              hitSlop={8}
            >
              <Text style={[TYPOGRAPHY.body, { color: colors.textMain }]}>Change Password</Text>
              <Text style={[s.chevron, { color: colors.textMuted }]}>→</Text>
            </Pressable>
          )}

          <View style={[s.divider, { backgroundColor: colors.border }]} />

          <Pressable
            style={GLOBAL_STYLES.rowBetween}
            onPress={handleLeaveHostel}
            hitSlop={8}
          >
            <Text style={[TYPOGRAPHY.body, { color: colors.danger }]}>Leave Current Hostel</Text>
            <Text style={[s.chevron, { color: colors.danger }]}>→</Text>
          </Pressable>

          <View style={[s.divider, { backgroundColor: colors.border }]} />

          <Pressable
            style={GLOBAL_STYLES.rowBetween}
            onPress={handleSignOut}
            hitSlop={8}
            disabled={signingOut}
          >
            <Text style={[TYPOGRAPHY.bodyBold, { color: colors.danger }]}>
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </Text>
            <Text style={[s.chevron, { color: colors.danger }]}>→</Text>
          </Pressable>
        </Card>

        {/* Help & Guide */}
        <Text style={[s.sectionHeader, { marginTop: SPACING.lg, color: colors.textMuted }]}>HELP & GUIDE</Text>
        <Card variant="bordered">
          <Pressable
            style={GLOBAL_STYLES.rowBetween}
            onPress={() => router.push({ pathname: '/onboarding', params: { fromProfile: 'true' } })}
            hitSlop={8}
          >
            <Text style={[TYPOGRAPHY.body, { color: colors.textMain }]}>View App Tour & Features</Text>
            <Text style={[s.chevron, { color: colors.textMuted }]}>→</Text>
          </Pressable>
        </Card>

        {/* App Footer */}
        <View style={s.footerContainer}>
          <Text style={[s.appVersion, { color: colors.textMuted }]}>Mess Meter v1.0.0</Text>
          <Text style={[s.appMotto, { color: colors.textMuted }]}>Anonymous student ratings. Real quality change.</Text>
        </View>
      </ScrollView>
    </View>
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
  profileCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  studentBadge: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 2,
  },
  studentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  adminBadge: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 2,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  hostelTag: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  subText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceSubtle,
    marginVertical: SPACING.md,
  },
  actionLink: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },
  chevron: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  label: {
    ...TYPOGRAPHY.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
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
  cancelText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  themeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: {
    fontSize: 20,
  },
  appVersion: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  appMotto: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
