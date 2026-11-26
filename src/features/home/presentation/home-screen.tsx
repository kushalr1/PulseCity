import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Image } from 'expo-image';
import { useIsFocused } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/ui/app-text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { designTokens } from '@/shared/design-system/tokens';
import { usePlaces } from '@/providers/places-provider';
import { AreaPickerSheet } from '@/features/location/area-picker-sheet';
import { requestCurrentLocation } from '@/features/location/current-location';
import { useAppBootstrap } from '@/providers/app-bootstrap-provider';
import { CityScene } from './city-scene';
import { distanceKm, getHomePreviewDistricts, getNearbyPlaces, getTonightPicks, sortCollectionsByMood } from '@/features/home/application/home-place-selection';
import { eventDateLabel, getUpcomingHomeEvents, homeEvents } from '@/features/home/domain/home-events';
import { homeCollections } from '@/features/home/domain/home-collections';
import type { PlaceMood } from '@/features/places/domain/place';
import { PlaceIllustration } from '@/features/places/presentation/place-illustration';
import { useCityWorldMood } from '@/providers/city-world-mood-provider';
import { useCityWorldTransition } from '@/providers/city-world-transition-provider';
import { preloadFullMoodSet, preloadHomeMoodSets } from '../application/scene-preloader';
import { isSurfaceVisible } from '../application/home-surface-visibility';
import { getLightsDebugBadgeLabel, resolveLightsDebugMode } from '../application/window-light-debug-mode';
import { collectionIllustrations, eventIllustrations } from './home-illustration-assets';

/* Reanimated SharedValue writes are intentional animation and layout state. */
/* eslint react-hooks/immutability: off */

type HomeEssential = {
  label: string;
  icon: SymbolViewProps['name'];
  color: string;
};

const palette = designTokens.compatibility.colors;
const defaultSelectedArea = { name: 'Sector 29', city: 'Gurugram', latitude: undefined, longitude: undefined };
const lightsDebugMode = resolveLightsDebugMode(
  __DEV__ ? process.env.EXPO_PUBLIC_LIGHTS_TEST : undefined,
  __DEV__ && process.env.EXPO_PUBLIC_WINDOW_LIGHTS_DEBUG_ALL === '1',
);
const essentials: HomeEssential[] = [
  { label: 'Pharmacy', icon: { ios: 'cross.case', android: 'medical_services', web: 'medical_services' }, color: palette.mint },
  { label: 'Grocery', icon: { ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' }, color: designTokens.color.teal },
  { label: 'Cafés', icon: { ios: 'cup.and.saucer', android: 'coffee', web: 'coffee' }, color: palette.amber },
  { label: 'Salons', icon: { ios: 'scissors', android: 'content_cut', web: 'content_cut' }, color: palette.pink },
  { label: 'Markets', icon: { ios: 'storefront', android: 'storefront', web: 'storefront' }, color: palette.amber },
  { label: 'Mobile repair', icon: { ios: 'iphone.gen3', android: 'phone_android', web: 'phone_android' }, color: palette.lilac },
  { label: 'Gyms', icon: { ios: 'dumbbell', android: 'fitness_center', web: 'fitness_center' }, color: palette.pink },
  { label: 'Parks', icon: { ios: 'tree', android: 'park', web: 'park' }, color: palette.mint },
];

type HomeScreenProps = {
  onSavedPress: () => void;
  onExplorePress: (category?: string) => void;
  onPlacePress: (id: string) => void;
  onCityWorldPress?: () => void;
  onSurprisePress?: () => void;
};

export default function HomeScreen({ onSavedPress, onExplorePress, onPlacePress, onCityWorldPress, onSurprisePress }: HomeScreenProps) {
  const { places, loading, isSaved, toggleSaved } = usePlaces();
  const { state: bootstrapState, updateState } = useAppBootstrap();
  const selectedArea = bootstrapState?.selectedArea ?? defaultSelectedArea;
  const [areaPickerVisible, setAreaPickerVisible] = useState(false);
  const [areaPickerMessage, setAreaPickerMessage] = useState<string | undefined>();
  const [comingSoon, setComingSoon] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [appearanceVisible, setAppearanceVisible] = useState(false);
  const { mood, beginMoodTransition } = useCityWorldMood();
  const transition = useCityWorldTransition();
  const theme = bootstrapState?.theme ?? 'city';
  const origin = useMemo(() => areaCoordinates(selectedArea), [selectedArea]);
  const tonightPicks = useMemo(() => getTonightPicks(places, mood, origin).slice(0, 3), [mood, origin, places]);
  const previewDistricts = useMemo(() => getHomePreviewDistricts(places, mood), [mood, places]);
  const nearbyPlaces = useMemo(() => getNearbyPlaces(places, origin, 4), [origin, places]);
  const upcomingEvents = useMemo(() => getUpcomingHomeEvents(homeEvents), []);
  const orderedCollections = useMemo(() => sortCollectionsByMood(homeCollections, mood), [mood]);
  const openExploreAll = useCallback(() => onExplorePress(''), [onExplorePress]);
  const openAreaPicker = useCallback(() => {
    setAreaPickerMessage(undefined);
    setComingSoon(false);
    setAreaPickerVisible(true);
  }, []);
  const openAppearance = useCallback(() => setAppearanceVisible(true), []);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const scrollY = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const heroTop = useSharedValue(0);
  const heroHeight = useSharedValue(0);
  const bodyTop = useSharedValue(0);
  const bodyContentTop = useSharedValue(0);
  const previewTop = useSharedValue(0);
  const previewHeight = useSharedValue(0);
  const [sceneVisibility, setSceneVisibility] = useState({ hero: false, preview: false });
  const [readyMoodTheme, setReadyMoodTheme] = useState<'city' | 'winter' | null>(null);
  const commitSceneVisibility = useCallback((hero: boolean, preview: boolean) => {
    setSceneVisibility((current) => current.hero === hero && current.preview === preview ? current : { hero, preview });
  }, []);
  const syncSceneVisibility = useCallback(() => {
    const scrollTop = scrollY.value;
    const viewport = viewportHeight.value;
    const panelTop = bodyTop.value + bodyContentTop.value + previewTop.value;
    commitSceneVisibility(
      isSurfaceVisible(scrollTop, viewport, heroTop.value, heroHeight.value),
      isSurfaceVisible(scrollTop, viewport, panelTop, previewHeight.value),
    );
  }, [bodyContentTop, bodyTop, commitSceneVisibility, heroHeight, heroTop, previewHeight, previewTop, scrollY, viewportHeight]);
  const scrollHandler = useAnimatedScrollHandler({ onScroll: (event) => { scrollY.value = event.contentOffset.y; } });
  useAnimatedReaction(
    () => {
      const heroVisible = isSurfaceVisible(scrollY.value, viewportHeight.value, heroTop.value, heroHeight.value);
      const panelY = bodyTop.value + bodyContentTop.value + previewTop.value;
      const panelVisible = isSurfaceVisible(scrollY.value, viewportHeight.value, panelY, previewHeight.value);
      return { heroVisible, panelVisible };
    },
    (next, previous) => {
      if (!previous || next.heroVisible !== previous.heroVisible || next.panelVisible !== previous.panelVisible) {
        runOnJS(commitSceneVisibility)(next.heroVisible, next.panelVisible);
      }
    },
  );
  useEffect(() => {
    let active = true;
    void preloadHomeMoodSets(theme).then((ready) => { if (active && ready) setReadyMoodTheme(theme); });
    return () => { active = false; };
  }, [theme]);

  const cityWorldFrameRef = useRef<ComponentRef<typeof View>>(null);
  const openCityWorld = () => {
    if (!onCityWorldPress) return;
    const frame = cityWorldFrameRef.current;
    if (!frame || typeof frame.measureInWindow !== 'function') { onCityWorldPress(); return; }
    let navigated = false;
    const navigate = () => {
      if (navigated) return;
      navigated = true;
      onCityWorldPress();
    };
    const fallback = setTimeout(navigate, 120);
    frame.measureInWindow((x, y, width, height) => {
      clearTimeout(fallback);
      if (width > 0 && height > 0) transition.begin({ x, y, width, height });
      setTimeout(navigate, 16);
    });
  };
  const prepareCityWorld = () => { void preloadFullMoodSet(theme, mood); };

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <Animated.ScrollView
        testID="home-scroll-view"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={(event) => { viewportHeight.value = event.nativeEvent.layout.height; syncSceneVisibility(); }}
        onScroll={scrollHandler}
      >
        <View testID="home-hero-container" onLayout={(event) => { heroTop.value = event.nativeEvent.layout.y; heroHeight.value = event.nativeEvent.layout.height; syncSceneVisibility(); }} style={[styles.hero, { height: insets.top + 196 }]}>
          <CityScene name="hero" active={sceneVisibility.hero} focused={isFocused} testID="home-hero" theme={theme} mood={mood} />
          <HeroHeader city={selectedArea.city} area={selectedArea.name} topInset={insets.top} onAreaPress={openAreaPicker} onAppearancePress={openAppearance} onSavedPress={onSavedPress} />
          {lightsDebugMode ? <View pointerEvents="none" testID="window-lights-debug-badge" style={[styles.lightsDebugBadge, { top: insets.top + 4 }]}><Text style={styles.lightsDebugBadgeText}>{getLightsDebugBadgeLabel(lightsDebugMode)}</Text></View> : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search places, services, and events in Explore"
          accessibilityHint="Opens Explore search."
          onPress={() => onExplorePress(undefined)}
          style={({ pressed }) => [styles.search, pressed && styles.pressed]}
        >
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            tintColor={designTokens.color.textSecondary}
            size={21}
          />
          <AppText style={styles.searchText}>Search places, services, events…</AppText>
        </Pressable>

        <View onLayout={(event) => { bodyTop.value = event.nativeEvent.layout.y; syncSceneVisibility(); }} style={styles.body}>
          <View testID="home-body-content" onLayout={(event) => { bodyContentTop.value = event.nativeEvent.layout.y; syncSceneVisibility(); }} style={styles.bodyContent}>
            <EssentialsSection onExplorePress={onExplorePress} />

            <View onLayout={(event) => { previewTop.value = event.nativeEvent.layout.y; previewHeight.value = event.nativeEvent.layout.height; syncSceneVisibility(); }} style={styles.cityWorld} testID="city-world-card">
              <Pressable ref={cityWorldFrameRef} accessibilityRole="button" accessibilityLabel="Open City World" onPressIn={prepareCityWorld} onPress={() => { void openCityWorld(); }} style={styles.cityWorldScene}>
                <CityScene name="preview" active={sceneVisibility.preview} focused={isFocused} testID="city-world" theme={theme} mood={mood} />
                <View style={styles.cityWorldTop}><View style={styles.cityWorldCopy}>
                  <AppText style={styles.cityWorldEyebrow}>LATER TODAY · {moodLabel(mood).toUpperCase()}</AppText>
                  <AppText accessibilityRole="header" numberOfLines={1} style={styles.cityWorldTitle}>This evening</AppText>
                </View></View>
                <View testID="city-world-districts" style={styles.neighborhoods}>
                  {previewDistricts.map((district) => <NeighborhoodTag key={district.id} label={district.label} />)}
                </View>
              </Pressable>
              <ScrollView testID="city-world-mood-row" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moods}>
                {(['chill', 'social', 'nature', 'active', 'foodie', 'explore'] as PlaceMood[]).map((item) => <MoodChip key={item} mood={item} selected={mood === item} disabled={readyMoodTheme !== theme} onSelect={beginMoodTransition} />)}
              </ScrollView>
              <View testID="city-world-picks" style={styles.panelPicks}>
                {tonightPicks.map((place) => <View key={place.id} testID={`panel-pick-row-${place.id}`} style={styles.panelPickRow}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Open ${place.name}`} onPress={() => onPlacePress(place.id)} style={styles.panelPickMain}>
                    <PlaceIllustration place={place} compact small />
                    <View style={styles.panelPickCopy}><AppText style={styles.panelPickName} numberOfLines={1}>{place.name}</AppText><AppText style={styles.panelPickMeta} numberOfLines={1}>{place.category} · {place.neighborhood} · ≈ {distanceKm(origin, place) < 1 ? `${Math.round(distanceKm(origin, place) * 1000)} m` : `${distanceKm(origin, place).toFixed(1)} km`}</AppText></View>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${isSaved(place.id) ? 'Remove' : 'Save'} ${place.name}`} onPress={() => toggleSaved(place.id)} style={styles.panelSaveButton}><SymbolView name={{ ios: isSaved(place.id) ? 'bookmark.fill' : 'bookmark', android: 'bookmark', web: 'bookmark' }} tintColor="white" size={20} /></Pressable>
                </View>)}
                {!loading && tonightPicks.length === 0 ? <AppText style={styles.panelEmpty}>No {moodLabel(mood)} picks near {selectedArea.name} yet.</AppText> : null}
              </View>
              <View testID="city-world-panel-actions" style={styles.panelActions}>
                <Pressable accessibilityRole="button" onPressIn={prepareCityWorld} onPress={onSurprisePress ?? onCityWorldPress} style={styles.panelSurprise}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} tintColor="#07242A" size={19} /><AppText style={styles.panelSurpriseText}>Surprise me</AppText></Pressable>
                <Pressable accessibilityRole="button" onPressIn={prepareCityWorld} onPress={openCityWorld} style={styles.panelExplore}><AppText style={styles.panelExploreText}>Explore the city</AppText><SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor="white" size={20} /></Pressable>
              </View>
              <AppText style={styles.panelCaption}>Pick a district. Discover what’s happening.</AppText>
            </View>

            <NearbySection items={nearbyPlaces} area={selectedArea.name} onPlacePress={onPlacePress} onSeeAll={openExploreAll} />
            <EventsSection events={upcomingEvents} onEventPress={openExploreAll} />
            <CollectionsSection collections={orderedCollections} onOpen={openExploreAll} />
          </View>
        </View>
      </Animated.ScrollView>
      <View testID="home-demo-badge" pointerEvents="none" style={styles.floatingDemoBadge}>
        <AppText style={styles.demoBadgeText}>Demo data</AppText>
      </View>
      <AreaPickerSheet
        visible={areaPickerVisible}
        selectedArea={selectedArea}
        message={locationLoading ? 'Finding your location…' : areaPickerMessage}
        comingSoon={comingSoon}
        onClose={() => { setAreaPickerVisible(false); setComingSoon(false); }}
        onChoose={(area) => {
          updateState({ selectedArea: { name: area.name, city: area.city, latitude: area.latitude, longitude: area.longitude } });
          setAreaPickerVisible(false);
        }}
        onUseMyLocation={() => {
          if (locationLoading) return;
          setLocationLoading(true);
          setAreaPickerMessage(undefined);
          void requestCurrentLocation().then((result) => {
            if (result.status === 'located') {
              updateState({ selectedArea: result.area });
              setAreaPickerVisible(false);
            } else if (result.status === 'outside-coverage') {
              setComingSoon(true);
            } else if (result.status === 'permission-denied') {
              setAreaPickerMessage(`Location permission is off. Keeping ${selectedArea.name}; distances are approximate.`);
            } else {
              setAreaPickerMessage(`Could not get your location. Keeping ${selectedArea.name}; distances are approximate.`);
            }
          }).finally(() => setLocationLoading(false));
        }}
      />
      <Modal visible={appearanceVisible} transparent animationType="fade" onRequestClose={() => setAppearanceVisible(false)}>
        <View style={styles.appearanceBackdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close appearance" style={StyleSheet.absoluteFill} onPress={() => setAppearanceVisible(false)} />
          <View accessibilityViewIsModal style={styles.appearanceSheet}>
            <AppText accessibilityRole="header" style={styles.appearanceTitle}>Appearance</AppText>
            <AppText style={styles.appearanceSubtitle}>Change how PulseCity looks.</AppText>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: theme === 'city' }} onPress={() => { updateState({ theme: 'city' }); setAppearanceVisible(false); }} style={styles.themeOption}>
              <View style={[styles.themeSwatch, styles.citySwatch]} />
              <AppText style={styles.themeLabel}>City World</AppText>
              <AppText style={styles.themeSelected}>{theme === 'city' ? 'Selected' : ''}</AppText>
            </Pressable>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: theme === 'winter' }} onPress={() => { updateState({ theme: 'winter' }); setAppearanceVisible(false); }} style={styles.themeOption}>
              <View style={[styles.themeSwatch, styles.winterSwatch]} />
              <AppText style={styles.themeLabel}>Winter Wonderland</AppText>
              <AppText style={styles.themeSelected}>{theme === 'winter' ? 'Selected' : ''}</AppText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setAppearanceVisible(false)} style={styles.appearanceClose}>
              <AppText style={styles.appearanceCloseText}>Done</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function NeighborhoodTag({ label }: { label: string }) {
  return (
    <View style={styles.neighborhoodTag}>
      <View style={styles.neighborhoodDot} />
      <AppText style={styles.neighborhoodText}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: designTokens.color.cityWorldNight },
  scrollContent: { flexGrow: 1, backgroundColor: designTokens.color.canvas, paddingBottom: 112 },
  hero: {
    overflow: 'hidden',
    backgroundColor: designTokens.color.cityWorldNight,
    justifyContent: 'flex-start',
  },
  lightsDebugBadge: { position: 'absolute', left: 8, zIndex: 20, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#071421', borderWidth: 1, borderColor: '#FDE68A' },
  lightsDebugBadgeText: { color: '#FDE68A', fontSize: 10, fontWeight: '700' },
  heroContent: {
    width: '100%',
    maxWidth: designTokens.layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: designTokens.spacing.lg,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 },
  headerActions: { flexDirection: 'row', gap: 8 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: designTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  locationCopy: { gap: 2 },
  cityName: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700', letterSpacing: 1.1 },
  sectorName: { color: designTokens.color.white, fontSize: 17, fontWeight: '700' },
  savedButton: {
    width: designTokens.layout.minimumTouchTarget,
    height: designTokens.layout.minimumTouchTarget,
    borderRadius: designTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    position: 'relative',
  },
  appearanceBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(4,12,22,0.56)' },
  appearanceSheet: { paddingHorizontal: 24, paddingTop: 26, paddingBottom: 34, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: designTokens.color.surface },
  appearanceTitle: { color: designTokens.color.ink, fontSize: 24, fontWeight: '700' },
  appearanceSubtitle: { color: designTokens.color.textSecondary, fontSize: 16, marginTop: 4, marginBottom: 16 },
  themeOption: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: designTokens.color.border },
  themeSwatch: { width: 36, height: 36, borderRadius: 12 },
  citySwatch: { backgroundColor: '#123550' },
  winterSwatch: { backgroundColor: '#B9D5F4' },
  themeLabel: { flex: 1, color: designTokens.color.ink, fontSize: 16, fontWeight: '600' },
  themeSelected: { color: designTokens.color.teal, fontSize: 14, fontWeight: '700' },
  appearanceClose: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderRadius: 16, backgroundColor: designTokens.color.teal },
  appearanceCloseText: { color: designTokens.color.white, fontSize: 16, fontWeight: '700' },
  headline: {
    color: designTokens.color.white,
    fontSize: designTokens.typography.display.fontSize,
    lineHeight: designTokens.typography.display.lineHeight,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  search: {
    width: '92%',
    maxWidth: 358,
    height: 54,
    minHeight: 54,
    alignSelf: 'center',
    marginTop: -27,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: 16,
    backgroundColor: designTokens.color.surface,
    borderWidth: 1,
    borderColor: designTokens.color.border,
    ...designTokens.elevation.card,
  },
  searchText: { color: designTokens.color.textMuted, fontSize: designTokens.typography.bodySmall.fontSize, lineHeight: designTokens.typography.bodySmall.lineHeight, flex: 1, flexShrink: 1 },
  body: { width: '100%', alignItems: 'center', backgroundColor: designTokens.color.canvas },
  bodyContent: {
    width: '100%',
    maxWidth: designTokens.layout.contentMaxWidth,
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  sectionHeading: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.lg,
  },
  sectionTitle: {
    color: designTokens.color.ink,
    fontSize: designTokens.typography.titleSmall.fontSize,
    lineHeight: designTokens.typography.titleSmall.lineHeight,
    fontWeight: '700',
    letterSpacing: -0.35,
    flexShrink: 1,
  },
  allLink: { minHeight: designTokens.layout.minimumTouchTarget, flexDirection: 'row', alignItems: 'center', gap: 1, paddingHorizontal: 4, flexShrink: 0 },
  allText: { color: designTokens.color.teal, fontSize: 14, fontWeight: '700' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  category: { width: '25%', minHeight: 108, alignItems: 'center', paddingHorizontal: 4, paddingVertical: 5, borderRadius: designTokens.radius.md },
  categoryIcon: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: designTokens.color.surface,
    borderWidth: 1,
    borderColor: designTokens.color.border,
    ...designTokens.elevation.card,
  },
  categoryLabel: {
    width: '100%',
    color: designTokens.color.ink,
    fontSize: designTokens.typography.caption.fontSize,
    lineHeight: designTokens.typography.caption.lineHeight,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
  },
  cityWorld: {
    overflow: 'hidden',
    marginTop: 28,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 24,
    backgroundColor: '#07101A',
    ...designTokens.elevation.raised,
  },
  cityWorldScene: { height: 208, overflow: 'hidden', justifyContent: 'space-between', padding: 18 },
  cityWorldTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  cityWorldCopy: { flex: 1, minWidth: 0 },
  cityWorldEyebrow: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  cityWorldTitle: { color: designTokens.color.white, fontSize: 16, lineHeight: 20, fontWeight: '700', marginTop: 6, letterSpacing: -0.2, flexShrink: 1 },
  floatingDemoBadge: {
    position: 'absolute',
    right: designTokens.spacing.md,
    bottom: designTokens.spacing.xs,
    zIndex: 5,
    backgroundColor: designTokens.color.demoBackground,
    borderRadius: designTokens.radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
    ...designTokens.elevation.card,
  },
  demoBadgeText: { color: designTokens.color.demoText, fontSize: 11, fontWeight: '800' },
  neighborhoods: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  neighborhoodTag: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: designTokens.radius.pill,
    backgroundColor: 'rgba(7,16,26,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  neighborhoodDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: designTokens.color.mintGlow },
  neighborhoodText: { color: designTokens.color.white, fontSize: 13, fontWeight: '700' },
  discoverySection: { marginTop: designTokens.spacing.section },
  sectionTitleBlock: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
  sectionTitleCopy: { flex: 1 },
  sectionSubtitle: { color: designTokens.color.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 3 },
  placeRow: { gap: designTokens.spacing.sm, paddingBottom: designTokens.spacing.xs },
  moods: { height: 40, gap: 8, paddingHorizontal: 16 },
  moodPill: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 16, borderRadius: designTokens.radius.pill, backgroundColor: '#E9EDF1', borderWidth: 1, borderColor: designTokens.color.border },
  moodPillSelected: { backgroundColor: designTokens.color.white, borderColor: designTokens.color.white },
  moodPillDark: { height: 40, alignItems: 'center', flexDirection: 'row', gap: 7, paddingLeft: 10, paddingRight: 14, borderRadius: designTokens.radius.pill, borderWidth: 1 },
  moodPillUnselectedDark: { backgroundColor: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.14)' },
  moodPillSelectedDark: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  moodDot: { width: 10, height: 10, borderRadius: 5, shadowRadius: 5, shadowOpacity: 1, shadowOffset: { width: 0, height: 0 } },
  moodTextDark: { color: 'rgba(255,255,255,.85)', fontFamily: 'InterTight_600SemiBold', fontSize: 13.5, lineHeight: 18, includeFontPadding: false },
  moodTextSelectedDark: { color: '#091523' },
  panelPicks: { paddingTop: 6, paddingHorizontal: 16 },
  panelPickRow: { minHeight: 70.67, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,.10)' },
  panelPickMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  panelPickCopy: { flex: 1, minWidth: 0 },
  panelPickName: { color: 'white', fontFamily: 'InterTight_700Bold', fontSize: 15, lineHeight: 21 },
  panelPickMeta: { color: 'rgba(255,255,255,.72)', fontFamily: 'InterTight_400Regular', fontSize: 12.5, lineHeight: 17.5, marginTop: 2 },
  panelSaveButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  panelEmpty: { color: '#B9C4D0', paddingVertical: 18, textAlign: 'center', fontSize: 14 },
  panelActions: { height: 60, flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  panelSurprise: { flex: 1, height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8FE3D0' },
  panelSurpriseText: { color: '#07242A', fontSize: 15, fontWeight: '700' },
  panelExplore: { flex: 1, height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  panelExploreText: { color: 'white', fontSize: 15, fontWeight: '700' },
  panelCaption: { color: 'rgba(255,255,255,.70)', fontFamily: 'InterTight_400Regular', fontSize: 12.5, lineHeight: 17.5, textAlign: 'center', paddingTop: 10 },
  moodText: { color: designTokens.color.textSecondary, fontSize: 14, fontWeight: '600' },
  moodTextSelected: { color: designTokens.color.ink },
  nearbyList: { borderRadius: 22, backgroundColor: designTokens.color.surface, borderWidth: 1, borderColor: designTokens.color.border, overflow: 'hidden' },
  nearbyRow: { minHeight: 102, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: designTokens.color.border },
  nearbyCopy: { flex: 1, gap: 3 },
  nearbyName: { color: designTokens.color.ink, fontSize: 16, fontWeight: '700' },
  nearbyMeta: { color: designTokens.color.textSecondary, fontSize: 13 },
  distanceText: { color: designTokens.color.textSecondary, fontSize: 12 },
  eventList: { gap: 12 },
  eventCard: { minHeight: 118, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 22, backgroundColor: designTokens.color.surface, borderWidth: 1, borderColor: designTokens.color.border },
  eventArtwork: { width: 82, height: 92, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  eventCopy: { flex: 1, gap: 4 },
  eventCategory: { color: designTokens.color.teal, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  eventName: { color: designTokens.color.ink, fontSize: 16, lineHeight: 20, fontWeight: '700' },
  eventMeta: { color: designTokens.color.textSecondary, fontSize: 12 },
  eventSave: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  collectionRow: { gap: 14, paddingBottom: 12 },
  collectionCard: { width: 240, height: 270, overflow: 'hidden', justifyContent: 'flex-end', padding: 18, borderRadius: 28, backgroundColor: '#203F35' },
  collectionArt: { ...StyleSheet.absoluteFill, overflow: 'hidden', backgroundColor: '#2C684D' },
  collectionSubtitle: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  collectionTitle: { color: designTokens.color.white, fontSize: 24, lineHeight: 28, fontWeight: '700', marginTop: 6 },
  loadingText: { color: designTokens.color.textMuted, fontSize: designTokens.typography.bodySmall.fontSize, paddingVertical: designTokens.spacing.xl },
  pressed: { opacity: 0.78 },
});

const SectionTitle = memo(function SectionTitle({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionTitleBlock}><View style={styles.sectionTitleCopy}><AppText accessibilityRole="header" style={styles.sectionTitle}>{title}</AppText>{subtitle ? <AppText style={styles.sectionSubtitle}>{subtitle}</AppText> : null}</View>{action && onAction ? <Pressable accessibilityRole="button" onPress={onAction} style={styles.allLink}><AppText style={styles.allText}>{action}</AppText><SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={designTokens.color.teal} size={15} /></Pressable> : null}</View>;
});

function areaCoordinates(area: { latitude?: number; longitude?: number }) {
  return { latitude: area.latitude ?? 28.4595, longitude: area.longitude ?? 77.0266 };
}

const HeroHeader = memo(function HeroHeader({ city, area, topInset, onAreaPress, onAppearancePress, onSavedPress }: {
  city: string;
  area: string;
  topInset: number;
  onAreaPress: () => void;
  onAppearancePress: () => void;
  onSavedPress: () => void;
}) {
  return <View testID="home-hero-content" style={[styles.heroContent, { paddingTop: topInset }]}>
    <View style={styles.topRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Selected area, ${city}, ${area}`} onPress={onAreaPress} style={styles.location}>
        <View style={styles.locationIcon}><SymbolView name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }} tintColor={designTokens.color.white} size={22} /></View>
        <View style={styles.locationCopy}><AppText style={styles.cityName}>{city.toUpperCase()}</AppText><AppText style={styles.sectorName}>{area} ⌄</AppText></View>
      </Pressable>
      <View style={styles.headerActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Appearance" onPress={onAppearancePress} style={({ pressed }) => [styles.savedButton, pressed && styles.pressed]}><SymbolView name={{ ios: 'paintpalette.fill', android: 'palette', web: 'palette' }} tintColor={designTokens.color.white} size={21} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Saved places" onPress={onSavedPress} style={({ pressed }) => [styles.savedButton, pressed && styles.pressed]}>
          <SymbolView name={{ ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' }} tintColor={designTokens.color.white} size={21} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifications, coming soon" accessibilityState={{ disabled: true }} disabled style={styles.savedButton}><SymbolView name={{ ios: 'bell', android: 'notifications', web: 'notifications' }} tintColor={designTokens.color.white} size={21} /></Pressable>
      </View>
    </View>
    <AppText accessibilityRole="header" allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={styles.headline}>Coffee ka plan?</AppText>
  </View>;
});

const EssentialsSection = memo(function EssentialsSection({ onExplorePress }: { onExplorePress: (category?: string) => void }) {
  return <>
    <View style={styles.sectionHeading}>
      <AppText accessibilityRole="header" style={styles.sectionTitle}>Everyday essentials</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="Explore all places" onPress={() => onExplorePress('')} hitSlop={8} style={({ pressed }) => [styles.allLink, pressed && styles.pressed]}>
        <AppText style={styles.allText}>All</AppText>
        <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={designTokens.color.teal} size={15} />
      </Pressable>
    </View>
    <View style={styles.categoryGrid}>
      {essentials.map((category) => <Pressable key={category.label} accessibilityRole="button" accessibilityLabel={`Explore from ${category.label} category`} accessibilityHint="Opens Explore to browse sample places." onPress={() => onExplorePress(category.label)} style={({ pressed }) => [styles.category, pressed && styles.pressed]}>
        <View style={[styles.categoryIcon, { backgroundColor: `${category.color}1A` }]}><SymbolView name={category.icon} tintColor={category.color} size={24} /></View>
        <AppText style={styles.categoryLabel}>{category.label}</AppText>
      </Pressable>)}
    </View>
  </>;
});

const NearbySection = memo(function NearbySection({ items, area, onPlacePress, onSeeAll }: {
  items: ReturnType<typeof getNearbyPlaces>;
  area: string;
  onPlacePress: (id: string) => void;
  onSeeAll: () => void;
}) {
  return <View style={styles.discoverySection}>
    <SectionTitle title="Nearby" action="See all" onAction={onSeeAll} subtitle={`Everyday places around ${area}`} />
    <View style={styles.nearbyList}>{items.map(({ place, distanceKm }) => <Pressable key={place.id} accessibilityRole="button" onPress={() => onPlacePress(place.id)} style={styles.nearbyRow}>
      <PlaceIllustration place={place} compact /><View style={styles.nearbyCopy}><AppText style={styles.nearbyName} numberOfLines={1}>{place.name}</AppText><AppText style={styles.nearbyMeta}>{place.category} · {place.neighborhood}</AppText><AppText style={styles.distanceText}>≈ {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} from {area}</AppText></View>
      <SymbolView name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }} tintColor={designTokens.color.teal} size={18} />
    </Pressable>)}</View>
  </View>;
});

const EventsSection = memo(function EventsSection({ events, onEventPress }: { events: ReturnType<typeof getUpcomingHomeEvents>; onEventPress: () => void }) {
  return <View style={styles.discoverySection}>
    <SectionTitle title="Happening this week" action="All events" onAction={onEventPress} />
    <View style={styles.eventList}>{events.map((event) => <Pressable key={event.id} accessibilityRole="button" onPress={onEventPress} style={styles.eventCard}>
      <View style={[styles.eventArtwork, { backgroundColor: event.illustration === 'music' ? '#21143B' : '#E8E2F1' }]}><Image source={eventIllustrations[event.id]} contentFit="cover" contentPosition="center" style={StyleSheet.absoluteFill} /></View>
      <View style={styles.eventCopy}><AppText style={styles.eventCategory}>{event.category.toUpperCase()} · DEMO</AppText><AppText style={styles.eventName}>{event.title}</AppText><AppText style={styles.eventMeta}>{eventDateLabel(event.daysFromNow)} · {event.time}</AppText><AppText style={styles.eventMeta}>{event.venue}</AppText></View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Save ${event.title}`} onPress={() => {}} style={styles.eventSave}><SymbolView name={{ ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' }} tintColor={designTokens.color.ink} size={18} /></Pressable>
    </Pressable>)}</View>
  </View>;
});

const CollectionsSection = memo(function CollectionsSection({ collections, onOpen }: { collections: typeof homeCollections; onOpen: () => void }) {
  return <View style={styles.discoverySection}>
    <SectionTitle title="Collections" subtitle="Hand-picked guides" />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionRow}>{collections.map((collection) => <Pressable key={collection.id} accessibilityRole="button" onPress={onOpen} style={styles.collectionCard}>
      <View style={styles.collectionArt}><Image source={collectionIllustrations[collection.id]} contentFit="cover" contentPosition="center" style={StyleSheet.absoluteFill} /></View>
      <AppText style={styles.collectionSubtitle}>{collection.subtitle.toUpperCase()}</AppText><AppText style={styles.collectionTitle}>{collection.title}</AppText>
    </Pressable>)}</ScrollView>
  </View>;
});

function moodLabel(mood: PlaceMood) {
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

function moodColor(mood: PlaceMood) {
  return ({ chill: '#8FE3D0', social: '#FF7DB0', nature: '#CFF27F', active: '#8FD3FF', foodie: '#FFC46A', explore: '#C3A8FF' } as const)[mood];
}

const MoodChip = memo(function MoodChip({ mood, selected, disabled = false, onSelect }: { mood: PlaceMood; selected: boolean; disabled?: boolean; onSelect: (mood: PlaceMood) => void }) {
  const selectedOnPressIn = useRef(false);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const color = moodColor(mood);
  const pressIn = () => {
    scale.value = withTiming(0.95, { duration: 80 });
    selectedOnPressIn.current = true;
    onSelect(mood);
  };
  const pressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
    selectedOnPressIn.current = false;
  };
  return <Animated.View style={animatedStyle}>
    <Pressable testID={`mood-chip-${mood}`} accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPressIn={pressIn} onPressOut={pressOut} onPress={() => { if (!selectedOnPressIn.current) onSelect(mood); }} style={[styles.moodPillDark, selected ? styles.moodPillSelectedDark : styles.moodPillUnselectedDark]}>
      <View style={[styles.moodDot, { backgroundColor: color, shadowColor: color }]} />
      <AppText style={[styles.moodTextDark, selected && styles.moodTextSelectedDark]}>{moodLabel(mood)}</AppText>
    </Pressable>
  </Animated.View>;
});
