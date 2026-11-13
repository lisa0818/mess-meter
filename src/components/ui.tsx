import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { C, R, shadow } from '../lib/theme';

export function Header({
  title, subtitle, left, right, children, pad = 44,
}: {
  title: string; subtitle?: string; left?: ReactNode; right?: ReactNode;
  children?: ReactNode; pad?: number;
}) {
  return (
    <LinearGradient
      colors={[C.navy, C.navy2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: pad,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      }}
    >
      {left}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          {subtitle ? <Text style={{ color: C.onDark, fontSize: 13, marginBottom: 2 }}>{subtitle}</Text> : null}
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>{title}</Text>
        </View>
        {right}
      </View>
      {children}
    </LinearGradient>
  );
}

export function BackLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} style={{ marginBottom: 14 }}>
      <Text style={{ color: C.onDark, fontSize: 16 }}>← Back</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        { backgroundColor: C.card, borderRadius: R.card, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
        shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PrimaryButton({
  label, onPress, busy, variant = 'primary', style,
}: {
  label: string; onPress?: () => void; busy?: boolean;
  variant?: 'primary' | 'soft' | 'done'; style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'primary' ? C.primary : variant === 'done' ? C.goodSoft : C.primarySoft;
  const fg = variant === 'primary' ? '#fff' : variant === 'done' ? C.good : C.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || variant === 'done'}
      style={({ pressed }) => [
        {
          backgroundColor: bg, borderRadius: R.btn, minHeight: 52,
          alignItems: 'center', justifyContent: 'center',
          opacity: busy ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '800', fontSize: 16 }}>{label}</Text>}
    </Pressable>
  );
}