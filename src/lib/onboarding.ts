import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_STORAGE_KEY = '@mess_meter_onboarding_completed';

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  } catch {
    // Ignore storage failures
  }
}
