import { Tabs } from 'expo-router';
import { Home, SlidersHorizontal, Target, Users } from 'lucide-react-native';

import { colors, fonts, touch } from '@/ui/theme';

const ICON_SIZE = 22;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarItemStyle: { minHeight: touch.navItem },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Home color={color} size={ICON_SIZE} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="metas"
        options={{
          title: 'Metas',
          tabBarIcon: ({ color }) => <Target color={color} size={ICON_SIZE} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="hogar"
        options={{
          title: 'Hogar',
          tabBarIcon: ({ color }) => <Users color={color} size={ICON_SIZE} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => (
            <SlidersHorizontal color={color} size={ICON_SIZE} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
