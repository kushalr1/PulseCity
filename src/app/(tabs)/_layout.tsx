import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { colors } from '@/constants/theme';

const tabIcons = {
  index: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  explore: { ios: 'safari', android: 'explore', web: 'explore' },
  saved: { ios: 'heart', android: 'favorite_border', web: 'favorite_border' },
} as const;

export default function TabLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.lilac,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { backgroundColor: '#171727', borderTopColor: colors.border, height: 82, paddingTop: 9, paddingBottom: 18 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      tabBarIcon: ({ focused, color }) => <SymbolView name={tabIcons[route.name as keyof typeof tabIcons]} tintColor={focused ? colors.lilac : color} size={20} />,
    })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
    </Tabs>
  );
}
