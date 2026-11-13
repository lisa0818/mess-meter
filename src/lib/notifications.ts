import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type Notif = typeof import('expo-notifications');

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let N: Notif | null = null;
let tried = false;

function load(): Notif | null {
  if (tried) return N;
  tried = true;
  if (Platform.OS === 'web' || isExpoGo) return null; // never touch the module in Expo Go
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