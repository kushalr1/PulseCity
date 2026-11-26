import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Syne_500Medium } from '@expo-google-fonts/syne/500Medium';
import { Syne_600SemiBold } from '@expo-google-fonts/syne/600SemiBold';
import { Syne_700Bold } from '@expo-google-fonts/syne/700Bold';
import { Syne_800ExtraBold } from '@expo-google-fonts/syne/800ExtraBold';
import { InterTight_400Regular } from '@expo-google-fonts/inter-tight/400Regular';
import { InterTight_500Medium } from '@expo-google-fonts/inter-tight/500Medium';
import { InterTight_600SemiBold } from '@expo-google-fonts/inter-tight/600SemiBold';
import { InterTight_700Bold } from '@expo-google-fonts/inter-tight/700Bold';
import { InterTight_800ExtraBold } from '@expo-google-fonts/inter-tight/800ExtraBold';

import { PlacesProvider } from '@/providers/places-provider';
import { AppBootstrapProvider, useAppBootstrap } from '@/providers/app-bootstrap-provider';
import { CityWorldMoodProvider } from '@/providers/city-world-mood-provider';
import { CityWorldTransitionProvider } from '@/providers/city-world-transition-provider';
import { getSceneSet } from '@/features/home/scene-registry';
import { preloadSceneSources } from '@/features/home/application/scene-preloader';
import { colors } from '@/constants/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Syne_500Medium,
    Syne_600SemiBold,
    Syne_700Bold,
    Syne_800ExtraBold,
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
    InterTight_800ExtraBold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppBootstrapProvider>
        <CityWorldMoodProvider>
          <CityWorldTransitionProvider>
            <AppShell fontsLoaded={fontsLoaded} />
          </CityWorldTransitionProvider>
        </CityWorldMoodProvider>
      </AppBootstrapProvider>
    </GestureHandlerRootView>
  );
}

function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready, state } = useAppBootstrap();
  const [heroAssetsReady, setHeroAssetsReady] = useState(false);
  const theme = state?.theme === 'winter' ? 'winter' : 'city';

  useEffect(() => {
    if (!ready) return;
    const hero = getSceneSet('hero', theme, 'chill');
    void preloadSceneSources(hero.assets.map((asset) => asset.source)).finally(() => setHeroAssetsReady(true));
  }, [ready, theme]);

  useEffect(() => {
    if (fontsLoaded && ready && heroAssetsReady) void SplashScreen.hideAsync();
  }, [fontsLoaded, heroAssetsReady, ready]);

  if (!fontsLoaded || !ready || !heroAssetsReady) return null;

  return (
    <PlacesProvider>
      <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background } }}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="place/[id]" options={{ animation: 'default', gestureEnabled: true }} />
          <Stack.Screen name="city-world" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: true }} />
          {__DEV__ ? <Stack.Screen name="map-test" /> : null}
        </Stack>
      </ThemeProvider>
    </PlacesProvider>
  );
}
