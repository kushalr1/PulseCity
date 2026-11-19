import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { PlacesProvider } from '@/providers/places-provider';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <PlacesProvider>
      <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background } }}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="place/[id]" />
        </Stack>
      </ThemeProvider>
    </PlacesProvider>
  );
}
