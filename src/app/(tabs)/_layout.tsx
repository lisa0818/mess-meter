import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../theme/ThemeContext';

function TabIcon({
  name,
  color,
  focused,
  size = 22,
}: {
  name: string;
  color: any;
  focused: boolean;
  size?: number;
}) {
  const strokeWidth = focused ? 2.2 : 1.8;

  switch (name) {
    case 'today':
      return (
        <Svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <Path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <Line x1="6" y1="2" x2="6" y2="4" />
          <Line x1="10" y1="2" x2="10" y2="4" />
          <Line x1="14" y1="2" x2="14" y2="4" />
        </Svg>
      );
    case 'vote':
      return (
        <Svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="m9 12 2 2 4-4" />
          <Path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" />
          <Path d="M9 3h6" />
        </Svg>
      );
    case 'menu':
      return (
        <Svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <Rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <Path d="M9 12h6" />
          <Path d="M9 16h6" />
        </Svg>
      );
    case 'admin':
      return (
        <Svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Rect x="3" y="3" width="7" height="9" rx="1" />
          <Rect x="14" y="3" width="7" height="5" rx="1" />
          <Rect x="14" y="12" width="7" height="9" rx="1" />
          <Rect x="3" y="16" width="7" height="5" rx="1" />
        </Svg>
      );
    case 'trends':
      return (
        <Svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <Polyline points="16 7 22 7 22 13" />
        </Svg>
      );
    case 'profile':
      return (
        <Svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );
    default:
      return null;
  }
}

export default function TabsLayout() {
  const { role } = useAuth();
  const { colors } = useTheme();
  const isAdmin = role === 'admin';

  return (
    <Tabs
      key={isAdmin ? 'admin-layout' : 'student-layout'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 82 : 62,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 0,
        },
      }}
    >
      {/* 1. Today Screen */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="today" color={color} focused={focused} />
          ),
        }}
      />

      {/* 2. Vote Screen (Visible for students) */}
      <Tabs.Screen
        name="voting"
        options={{
          title: 'Vote',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="vote" color={color} focused={focused} />
          ),
          href: isAdmin ? null : undefined,
          tabBarItemStyle: isAdmin ? { display: 'none' } : undefined,
        }}
      />

      {/* 3. Menu Management (Admin Only) */}
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="menu" color={color} focused={focused} />
          ),
          href: isAdmin ? undefined : null,
          tabBarItemStyle: isAdmin ? undefined : { display: 'none' },
        }}
      />

      {/* 4. Admin Dashboard (Admin Only) */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="admin" color={color} focused={focused} />
          ),
          href: isAdmin ? undefined : null,
          tabBarItemStyle: isAdmin ? undefined : { display: 'none' },
        }}
      />

      {/* 5. Trends (Visible for both) */}
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="trends" color={color} focused={focused} />
          ),
        }}
      />

      {/* 6. Profile & Settings (Visible for both) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
