import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '../../lib/auth';
import { C } from '../../lib/theme';

const icon = (e: string) => () => <Text style={{ fontSize: 20 }}>{e}</Text>;

export default function TabsLayout() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <Tabs
      key={isAdmin ? 'admin' : 'student'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.border },
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