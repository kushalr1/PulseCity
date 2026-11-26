import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { designTokens } from '@/shared/design-system/tokens';

const tabIcons = {
  index: { ios: 'house', android: 'home', web: 'home' },
  explore: { ios: 'safari', android: 'explore', web: 'explore' },
  map: { ios: 'map', android: 'map', web: 'map' },
  events: { ios: 'calendar', android: 'calendar_month', web: 'event' },
  profile: { ios: 'person.crop.circle', android: 'person', web: 'person' },
} as const;
type TabRouteName = keyof typeof tabIcons;
const tabLabels = {
  index: 'Home tab',
  explore: 'Explore tab',
  map: 'Map tab',
  events: 'Events tab',
  profile: 'Profile tab',
} as const;

export default function TabLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: designTokens.color.teal,
      tabBarInactiveTintColor: designTokens.color.textMuted,
      tabBarStyle: styles.bar,
      tabBarItemStyle: styles.item,
      tabBarLabelStyle: styles.label,
      tabBarLabelPosition: 'below-icon',
      tabBarAccessibilityLabel: tabLabels[route.name as TabRouteName],
      tabBarIcon: ({ focused, color }) => (
        <View style={styles.iconFrame}>
          {focused ? <View style={styles.activeIndicator} /> : null}
          <SymbolView name={tabIcons[route.name as TabRouteName]} tintColor={color} size={21} />
        </View>
      ),
    })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="events" options={{ title: 'Events' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 82,
    paddingTop: 7,
    paddingBottom: 18,
    backgroundColor: designTokens.color.surface,
    borderTopColor: designTokens.color.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  },
  item: { paddingTop: 3 },
  label: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  iconFrame: { width: 32, height: 26, alignItems: 'center', justifyContent: 'center' },
  activeIndicator: {
    position: 'absolute',
    top: -9,
    width: 27,
    height: 3,
    borderRadius: designTokens.radius.pill,
    backgroundColor: designTokens.color.teal,
  },
});
