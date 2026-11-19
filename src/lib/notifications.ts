import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

type Notif = typeof import('expo-notifications');

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let N: Notif | null = null;
let tried = false;

function load(): Notif | null {
  if (tried) return N;
  tried = true;
  if (Platform.OS === 'web') return null;
  try {
    N = require('expo-notifications') as Notif;
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    N = null;
  }
  return N;
}

/** Last tapped notification, or null when notifications are unavailable. */
export function useNotificationTap() {
  const n = load();
  return n ? n.useLastNotificationResponse() : null;
}

const SLOTS = [
  { type: 'breakfast', hour: 9, minute: 30 },
  { type: 'lunch', hour: 14, minute: 0 },
  { type: 'dinner', hour: 21, minute: 0 },
];

export async function setupReminders(): Promise<boolean> {
  const n = load();
  if (!n) return false;
  if (Platform.OS === 'android') {
    await n.setNotificationChannelAsync('meals', {
      name: 'Meal reminders',
      importance: n.AndroidImportance.HIGH,
    });
  }
  let { status } = await n.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await n.requestPermissionsAsync());
  if (status !== 'granted') return false;

  await n.cancelAllScheduledNotificationsAsync();
  for (const s of SLOTS) {
    await n.scheduleNotificationAsync({
      content: {
        title: `How was ${s.type}? 🍛`,
        body: 'Rate it in 10 seconds.',
        data: { meal: s.type },
      },
      trigger: {
        type: n.SchedulableTriggerInputTypes.DAILY,
        hour: s.hour,
        minute: s.minute,
        channelId: 'meals',
      },
    });
  }
  return true;
}

/** Cancels all active scheduled reminders */
export async function cancelReminders(): Promise<void> {
  const n = load();
  if (!n) return;
  try {
    await n.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore
  }
}

/** Registers device push token and syncs to Supabase profiles */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  const n = load();
  if (!n || Platform.OS === 'web') return null;
  try {
    let { status } = await n.getPermissionsAsync();
    if (status !== 'granted') {
      const res = await n.requestPermissionsAsync();
      status = res.status;
    }
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenData = await n.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tokenData?.data;

    if (token && userId) {
      await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
    }
    return token;
  } catch (e) {
    console.warn('Push token registration skipped or failed:', e);
    return null;
  }
}

/** For demos: fires a reminder 5 seconds from now. */
export async function sendTestReminder(mealType = 'lunch') {
  const n = load();
  if (!n) return;
  await n.scheduleNotificationAsync({
    content: {
      title: `How was ${mealType}? 🍛`,
      body: 'Tap to rate in 10 seconds.',
      data: { meal: mealType },
    },
    trigger: {
      type: n.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: 'meals',
    },
  });
}
