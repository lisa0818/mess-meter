import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const haptic = {
  /** Light tap for ratings, buttons, switches */
  light: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore unsupported platforms/devices
    }
  },

  /** Medium tap for primary actions, confirms, vote submission */
  medium: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore unsupported platforms/devices
    }
  },

  /** Subtle tick for selection changes (tags, segmented controls, tabs) */
  selection: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.selectionAsync();
    } catch {
      // Ignore unsupported platforms/devices
    }
  },

  /** Success notification haptic */
  success: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore unsupported platforms/devices
    }
  },

  /** Warning or error haptic */
  warning: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignore unsupported platforms/devices
    }
  },
};
