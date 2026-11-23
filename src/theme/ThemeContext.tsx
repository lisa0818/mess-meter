import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { ColorPalette, COLORS_DARK, COLORS_LIGHT } from './designSystem';

const emptySubscribe = () => () => {};

export type ThemeMode = 'system' | 'light' | 'dark';

export function getTypography(colors: ColorPalette) {
  return {
    h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5, color: colors.textMain },
    h2: { fontSize: 20, fontWeight: '700' as const, color: colors.textMain },
    h3: { fontSize: 16, fontWeight: '600' as const, color: colors.textMain },
    body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, color: colors.textSecondary },
    bodyBold: { fontSize: 14, fontWeight: '600' as const, color: colors.textMain },
    caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
    statNumber: { fontSize: 28, fontWeight: '800' as const, color: colors.secondary },
  };
}

export type ThemeTypography = ReturnType<typeof getTypography>;

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  colors: ColorPalette;
  typography: ThemeTypography;
}

const THEME_STORAGE_KEY = '@mess_meter_theme_mode_v1';

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  setThemeMode: async () => {},
  isDark: false,
  colors: COLORS_LIGHT,
  typography: getTypography(COLORS_LIGHT),
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeModeState(stored);
      }
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Ignore
    }
  };

  // On Web with SSR, prevent hydration mismatch by rendering baseline on first pass,
  // then updating after mount. On native, render theme immediately.
  const isDark =
    Platform.OS === 'web' && !isClient
      ? false
      : themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
  const typography = getTypography(colors);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, colors, typography }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
