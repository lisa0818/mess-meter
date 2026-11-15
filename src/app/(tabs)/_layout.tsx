import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../lib/auth';
import { COLORS } from '../../theme/designSystem';

const icon = (e: string) => () => <Text style={{ fontSize: 20 }}>{e}</Text>;

export default function TabsLayout() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <Tabs
      key={isAdmin ? 'admin' : 'student'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('🍛') }} />
      <Tabs.Screen name="trends" options={{ title: 'Trends', tabBarIcon: icon('📈') }} />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: icon('📊'),
          tabBarButton: isAdmin ? undefined : () => null,
        }}
      />
    </Tabs>
  );
}