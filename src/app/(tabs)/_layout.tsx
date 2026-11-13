import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAuth } from '../../lib/auth';
import {
  COLORS,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../theme/designSystem';

const TabIcon = ({ emoji }: { emoji: string }) => (
  <Text style={styles.tabIconText}>{emoji}</Text>
);

export default function TabsLayout() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <Tabs
      key={isAdmin ? 'admin' : 'student'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isAdmin ? COLORS.secondary : COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today's Menu",
          tabBarIcon: () => <TabIcon emoji="🍛" />,
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarIcon: () => <TabIcon emoji="📈" />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarActiveTintColor: COLORS.secondary,
          tabBarIcon: () => <TabIcon emoji="📊" />,
          tabBarButton: isAdmin ? undefined : () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    minHeight: 60,
    paddingBottom: SPACING.xs,
    paddingTop: SPACING.xs,
    ...SHADOWS.card,
  },
  tabBarLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  tabIconText: {
    fontSize: 20,
  },
});
