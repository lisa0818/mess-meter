import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Roughly 30 min after each meal ends
const SLOTS = [
  { type: 'breakfast', hour: 9, minute: 30 },
  { type: 'lunch', hour: 14, minute: 0 },
  { type: 'dinner', hour: 21, minute: 0 },
];

export async function setupReminders(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('meals', {
      name: 'Meal reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return false;

  await Notifications.cancelAllScheduledNotificationsAsync(); // avoids duplicates
  for (const s of SLOTS) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `How was ${s.type}? 🍛`,
        body: 'Rate it in 10 seconds.',
        data: { meal: s.type },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
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
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `How was ${mealType}? 🍛`,
      body: 'Tap to rate in 10 seconds.',
      data: { meal: mealType },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: 'meals',
    },
  });
}