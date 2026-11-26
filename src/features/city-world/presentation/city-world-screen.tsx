import { Image } from 'expo-image';
import { router, useIsFocused } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { CityScene } from '@/features/home/presentation/city-scene';
import { CityWorldTransitionOverlay } from '@/features/home/presentation/city-world-transition-overlay';
import { canRevealScene } from '@/features/home/application/scene-readiness';
import { preloadFullMoodSets } from '@/features/home/application/scene-preloader';
import { PlaceIllustration } from '@/features/places/presentation/place-illustration';
import { WindowLightsCanvas } from '@/features/home/presentation/window-lights-canvas';
import { SceneTransitionLayer } from '@/features/home/presentation/scene-transition-layer';
import { useSceneTransitionProgressLog } from '@/features/home/presentation/use-scene-transition-progress-log';
import { snapshotWindowPalette, type WindowPalette } from '@/features/home/application/window-light-transition';
import type { Place, PlaceMood } from '@/features/places/domain/place';
import { usePlaces } from '@/providers/places-provider';
import { useAppBootstrap } from '@/providers/app-bootstrap-provider';
import { useCityWorldMood } from '@/providers/city-world-mood-provider';
import { useCityWorldTransition } from '@/providers/city-world-transition-provider';
import { designTokens } from '@/shared/design-system/tokens';
import { distanceKm } from '@/features/home/application/home-place-selection';
import { getAreaCoordinates } from '@/features/location/area-options';
import { districtPillPositions, districtPlaces, getFullSceneAssets, getSurpriseCandidate, districtForPlace, resolveFullMoodTransition, surpriseSearchDuration } from '../application/city-world-logic';

/* Reanimated SharedValue writes below are deliberate UI-thread animation state. */
/* eslint react-hooks/immutability: off */

type Theme = 'city' | 'winter';
type District = { id: string; name: string; x: number; top: number; matches: number; camForDistrict: number };
type SurprisePhase = 'search' | 'lock' | 'done';
type Surprise = { phase: SurprisePhase; progress: number; target: Place; districtId: string };
let fullDrawOrderLogged = false;
const moods: PlaceMood[] = ['chill', 'social', 'nature', 'active', 'foodie', 'explore'];
const moodDescriptions: Record<PlaceMood, string> = {
  chill: 'Slow down, Gurgaon.',
  social: 'Round up the group chat.',
  nature: 'Touch grass, Gurgaon edition.',
  active: 'Laptop off. Legs on.',
  foodie: 'Follow your appetite.',
  explore: 'Go beyond CyberHub.',
};

export default function CityWorldScreen({ launchSurprise = false }: { launchSurprise?: boolean } = {}) {
  const { places, isSaved, toggleSaved } = usePlaces();
  const launch = launchSurprise ? 'surprise' : undefined;
  const launchHandled = useRef(false);
  const { mood, setMood, progress: moodProgress } = useCityWorldMood();
  const transition = useCityWorldTransition();
  const { active: transitionActive, finish: finishTransition } = transition;
  const { state } = useAppBootstrap();
  const selectedArea = state?.selectedArea ?? { name: 'Sector 29', city: 'Gurugram' };
  const origin = getAreaCoordinates(selectedArea);
  const theme: Theme = state?.theme === 'winter' ? 'winter' : 'city';
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scale = Math.max(width / 390, height / 844);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [moodPickerOpen, setMoodPickerOpen] = useState(false);
  const [surprise, setSurprise] = useState<Surprise | null>(null);
  const [transitionFrom, setTransitionFrom] = useState<{ mood: PlaceMood; theme: Theme } | null>(null);
  const [transitionFromPalette, setTransitionFromPalette] = useState<WindowPalette | null>(null);
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [showOpeningFallback, setShowOpeningFallback] = useState(true);
  const [fullMoodSetsTheme, setFullMoodSetsTheme] = useState<Theme | null>(null);
  const fullMoodSetsReady = fullMoodSetsTheme === theme;
  const openingOpacity = useSharedValue(0);
  const outgoingMoodOpacity = useDerivedValue(() => 1 - moodProgress.value);
  const fallbackOpacity = useSharedValue(1);
  const entrance = useSharedValue(0);
  const snowAmount = useSharedValue(0);
  const camera = useSharedValue(409.5);
  const cameraTarget = useSharedValue(409.5);
  const focusing = useSharedValue(false);
  const cameraVelocity = useSharedValue(0);
  const dragging = useSharedValue(false);
  const clock = useSharedValue(0);
  const searchProgress = useSharedValue(0);
  const searchFrom = useSharedValue(0);
  const searchTo = useSharedValue(0);
  const searchActive = useSharedValue(false);
  const dim = useSharedValue(0);
  const dragHintOpacity = useSharedValue(1);
  const flashRadius = useSharedValue(16);
  const dragHintStyle = useAnimatedStyle(() => ({ opacity: dragHintOpacity.value }));
  const fallbackStyle = useAnimatedStyle(() => ({ opacity: fallbackOpacity.value }));
  const repeatCount = useRef(0);
  const currentSet = useRef({ mood, theme });
  const transitionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedSceneAssets = useRef(new Map<string, Set<string>>());
  const surpriseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scene = useMemo(() => getFullSceneAssets(theme, mood), [theme, mood]);
  const sceneData = scene.scene as any;
  const sceneKey = `full/${theme}/${mood}`;
  const semanticWindowFrom = (transitionFrom ? getFullSceneAssets(transitionFrom.theme, transitionFrom.mood) : scene).scene.palette as WindowPalette;
  const windowBlendTo = sceneData.palette as WindowPalette;
  const windowBlendRef = useRef({ from: semanticWindowFrom, to: windowBlendTo });
  const windowBlendFrom = transitionFromPalette ?? semanticWindowFrom;
  const transitionFromKey = transitionFrom ? `full/${transitionFrom.theme}/${transitionFrom.mood}` : sceneKey;
  useSceneTransitionProgressLog('full', transitionFromKey, sceneKey, windowBlendFrom, windowBlendTo, moodProgress);
  const districts = sceneData.districts as District[];
  const selectedDistrict = districts.find((district) => district.id === districtId) ?? null;
  const selectedPlaces = selectedDistrict ? districtPlaces(places, selectedDistrict.id, mood) : [];
  const requiredSceneAssets = useMemo(() => scene.assets
    .filter((asset) => ['sky', 'ridge', 'far', 'mid', 'metro', 'near', 'vignette', 'farCaps', 'midCaps', 'frost'].includes(asset.name))
    .map((asset) => asset.name).concat(['window_far', 'window_mid']), [scene]);
  const onSceneAssetLoad = useCallback((asset: string, key: string) => {
    const loaded = loadedSceneAssets.current.get(key) ?? new Set<string>();
    loaded.add(asset);
    loadedSceneAssets.current.set(key, loaded);
    if (key === sceneKey && canRevealScene(requiredSceneAssets, loaded)) setReadyKey(key);
  }, [requiredSceneAssets, sceneKey]);

  useEffect(() => {
    if (!transitionFrom) windowBlendRef.current = { from: windowBlendTo, to: windowBlendTo };
  }, [transitionFrom, windowBlendTo]);

  const startMoodTransition = useCallback((nextMood: PlaceMood, nextTheme: Theme = theme) => {
    if (!fullMoodSetsReady) return;
    const transition = resolveFullMoodTransition(currentSet.current, nextTheme, nextMood);
    if (transition.fromKey === transition.toKey) return;
    const paletteSnapshot = snapshotWindowPalette(windowBlendRef.current.from, windowBlendRef.current.to, moodProgress.value);
    const targetPalette = getFullSceneAssets(nextTheme, nextMood).scene.palette as WindowPalette;
    currentSet.current = transition.to;
    windowBlendRef.current = { from: paletteSnapshot, to: targetPalette };
    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    setTransitionFromPalette(paletteSnapshot);
    setTransitionFrom(reduceMotion ? null : transition.from);
    transitionTimeout.current = setTimeout(() => { setTransitionFrom(null); setTransitionFromPalette(null); }, reduceMotion ? 0 : 800);
    setDistrictId(null);
    setMood(transition.to.mood);
  }, [fullMoodSetsReady, moodProgress, reduceMotion, setMood, theme]);

  useEffect(() => {
    let active = true;
    void preloadFullMoodSets(theme).then((ready) => {
      if (!active) return;
      if (ready) setFullMoodSetsTheme(theme);
      if (!ready) console.warn(`[City World] ${theme} mood assets are not fully decoded; mood changes stay disabled.`);
    });
    return () => { active = false; };
  }, [theme]);

  useEffect(() => {
    if (readyKey !== sceneKey) return;
    if (transitionFrom) return;
    const duration = reduceMotion ? 0 : 250;
    openingOpacity.value = reduceMotion ? 1 : withTiming(1, { duration });
    fallbackOpacity.value = reduceMotion ? 0 : withTiming(0, { duration });
    transitionTimeout.current = setTimeout(() => setShowOpeningFallback(false), duration);
  }, [fallbackOpacity, openingOpacity, readyKey, reduceMotion, sceneKey, transitionFrom]);

  useEffect(() => {
    if (readyKey === sceneKey && transitionActive) finishTransition();
  }, [finishTransition, readyKey, sceneKey, transitionActive]);

  useEffect(() => {
    entrance.value = reduceMotion ? 1 : 0;
    if (focused && !reduceMotion) entrance.value = withTiming(1, { duration: 1800, easing: Easing.linear });
  }, [entrance, focused, reduceMotion]);

  useEffect(() => {
    snowAmount.value = reduceMotion
      ? (theme === 'winter' ? 1 : 0)
      : withTiming(theme === 'winter' ? 1 : 0, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [reduceMotion, snowAmount, theme]);

  useEffect(() => () => {
    if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    surpriseTimers.current.forEach(clearTimeout);
    cancelAnimation(camera);
    cancelAnimation(dim);
  }, [camera, dim]);

  useFrameCallback((frame) => {
    if (!focused) return;
    const dt = Math.min((frame.timeSincePreviousFrame ?? 16) / 1000, 0.05);
    if (!reduceMotion) clock.value += dt;
    if (searchActive.value) {
      const p = searchProgress.value;
      const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      camera.value = searchFrom.value + (searchTo.value - searchFrom.value) * e
        + Math.sin(e * Math.PI) * sceneData.W * .25 * (searchTo.value >= searchFrom.value ? -1 : 1);
      return;
    }
    if (focusing.value) {
      const delta = cameraTarget.value - camera.value;
      if (Math.abs(delta) <= .5) {
        camera.value = cameraTarget.value;
        focusing.value = false;
      } else {
        camera.value += delta * (1 - Math.pow(.003, dt));
      }
      return;
    }
    if (reduceMotion) return;
    if (!dragging.value && Math.abs(cameraVelocity.value) > 0.5) {
      camera.value = Math.min(sceneData.maxCam, Math.max(0, camera.value + cameraVelocity.value * dt));
      cameraVelocity.value *= Math.pow(0.05, dt);
      if (camera.value <= 0 || camera.value >= sceneData.maxCam) cameraVelocity.value = 0;
    }
  }, focused);

  const clearSurpriseTimers = () => {
    surpriseTimers.current.forEach(clearTimeout);
    surpriseTimers.current = [];
  };

  const revealResult = useCallback((target: Place, targetDistrict: string) => {
    const point = districts.find((item) => item.id === targetDistrict);
    const lockCamera = point?.camForDistrict ?? 409.5;
    searchActive.value = false;
    focusing.value = false;
    camera.value = lockCamera;
    setSurprise({ phase: 'done', progress: 1, target, districtId: targetDistrict });
    dim.value = withTiming(0, { duration: 300 });
    setDistrictId(null);
  }, [camera, dim, districts, focusing, searchActive, setDistrictId, setSurprise]);

  const runSurprise = () => {
    const target = getSurpriseCandidate(places, mood);
    if (!target) {
      dim.value = 0;
      setSurprise({ phase: 'done', progress: 1, target: null as unknown as Place, districtId: 's29' });
      return;
    }
    const targetDistrict = districtForPlace(target);
    const district = districts.find((item) => item.id === targetDistrict) ?? districts[0];
    setDistrictId(null);
    clearSurpriseTimers();
    repeatCount.current += 1;
    const duration = surpriseSearchDuration(repeatCount.current - 1, reduceMotion);
    if (reduceMotion) {
      dim.value = 0;
      revealResult(target, targetDistrict);
      return;
    }
    setSurprise({ phase: 'search', progress: 0, target, districtId: targetDistrict });
    focusing.value = false;
    searchFrom.value = camera.value;
    searchTo.value = district.camForDistrict;
    searchProgress.value = 0;
    searchActive.value = true;
    cameraVelocity.value = 0;
    dim.value = withTiming(0.45, { duration: 1200 });
    searchProgress.value = withTiming(1, { duration, easing: Easing.linear });
    surpriseTimers.current.push(setTimeout(() => {
      searchActive.value = false;
      camera.value = searchTo.value;
      flashRadius.value = 16;
      flashRadius.value = withTiming(146, { duration: 450, easing: Easing.out(Easing.cubic) });
      setSurprise((value) => value ? { ...value, phase: 'lock', progress: 0 } : value);
    }, duration));
    surpriseTimers.current.push(setTimeout(() => {
      revealResult(target, targetDistrict);
    }, duration + 450));
  };

  useEffect(() => {
    if (launch === 'surprise' && places.length > 0 && !launchHandled.current) {
      launchHandled.current = true;
      runSurprise();
    }
  // Route intent is consumed once. Re-running when mood or render state changes would replay surprise.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launch, places.length]);

  const skipSurprise = useCallback(() => {
    if (!surprise || surprise.phase === 'done') return;
    clearSurpriseTimers();
    searchActive.value = false;
    cancelAnimation(searchProgress);
    revealResult(surprise.target, surprise.districtId);
  }, [surprise, searchActive, searchProgress, revealResult]);

  const focusDistrict = (district: District) => {
    setDistrictId(district.id);
    cameraVelocity.value = 0;
    searchActive.value = false;
    if (reduceMotion) {
      camera.value = district.camForDistrict;
      focusing.value = false;
    } else {
      cameraTarget.value = district.camForDistrict;
      focusing.value = true;
    }
  };

  const pan = Gesture.Pan()
    .hitSlop({ left: 20 })
    .activeOffsetX([-8, 8])
    .failOffsetY([-18, 18])
    .onBegin(() => {
      dragging.value = true;
      focusing.value = false;
      cameraVelocity.value = 0;
      cancelAnimation(camera);
      dragHintOpacity.value = withTiming(0, { duration: 250 });
    })
    .onChange((event) => { camera.value = Math.min(sceneData.maxCam, Math.max(0, camera.value - event.changeX / scale / 0.6)); })
    .onEnd((event) => { cameraVelocity.value = -event.velocityX / scale / 0.6; })
    .onFinalize(() => { dragging.value = false; });
  // Gesture callbacks run on the UI thread after render; bridge state work back to JS.
  // eslint-disable-next-line react-hooks/refs
  const skipTap = Gesture.Tap().onEnd(() => { runOnJS(skipSurprise)(); });
  const worldGesture = Gesture.Simultaneous(pan, skipTap);
  const close = () => { clearSurpriseTimers(); finishTransition(); router.back(); };
  const openMap = () => { setDistrictId(null); router.replace('/(tabs)/map'); };

  return (
    <View style={styles.screen} testID="city-world-screen">
      <GestureDetector gesture={worldGesture}>
        <View style={styles.worldTouchArea}>
          {showOpeningFallback && !transitionFrom ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, fallbackStyle]}><CityScene name="preview" active focused testID="city-world-opening-fallback" theme={theme} mood={mood} /></Animated.View> : null}
          {transitionFrom ? <FullSceneCanvas theme={transitionFrom.theme} mood={transitionFrom.mood} places={places} camera={camera} clock={clock} entrance={entrance} snowAmount={snowAmount} searchProgress={searchProgress} opacity={outgoingMoodOpacity} windowProgress={moodProgress} windowFrom={windowBlendFrom} windowTo={windowBlendTo} drawLights={false} selected={surprise?.phase === 'done' ? surprise.districtId : districtId} surprise={surprise} scale={scale} dim={dim} flashRadius={flashRadius} /> : null}
          <FullSceneCanvas theme={theme} mood={mood} places={places} camera={camera} clock={clock} entrance={entrance} snowAmount={snowAmount} searchProgress={searchProgress} opacity={transitionFrom ? moodProgress : openingOpacity} windowProgress={moodProgress} windowFrom={windowBlendFrom} windowTo={windowBlendTo} selected={surprise?.phase === 'done' ? surprise.districtId : districtId} surprise={surprise} scale={scale} dim={dim} flashRadius={flashRadius} onDistrictPress={focusDistrict} onSceneAssetLoad={(asset) => onSceneAssetLoad(asset, sceneKey)} />
          <View pointerEvents="none" style={styles.sceneBottomFade}>
            {Array.from({ length: 32 }, (_, index) => <View key={`fade-${index}`} style={[styles.sceneFadeBand, { top: index * 10, backgroundColor: `rgba(7,16,26,${(0.85 * index) / 31})` }]} />)}
          </View>
          <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 10 }]}>
            <View style={styles.header}>
              <Pressable accessibilityRole="button" accessibilityLabel="Close City World" onPress={close} style={styles.iconButton}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} tintColor="white" size={22} /></Pressable>
              <View style={styles.headerTitle}><AppText allowFontScaling={false} numberOfLines={1} style={styles.title}>{surprise ? 'Surprise me' : 'Explore the city'}</AppText></View>
              {surprise
                ? <Pressable accessibilityRole="button" accessibilityLabel="Surprise filters" onPress={() => setMoodPickerOpen(true)} style={styles.iconButton}><SymbolView name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }} tintColor="white" size={21} /></Pressable>
                : <Pressable accessibilityRole="button" accessibilityLabel={`Choose mood, ${mood[0].toUpperCase() + mood.slice(1)}`} onPress={() => setMoodPickerOpen(true)} style={styles.moodPillButton}><View style={[styles.liveDot, { backgroundColor: moodColor(mood) }]} /><AppText style={styles.moodPillLabel}>{mood[0].toUpperCase() + mood.slice(1)}</AppText><SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} tintColor="white" size={14} /></Pressable>}
            </View>
            {!surprise || surprise.phase !== 'done' ? <View pointerEvents="none" style={[styles.headlineOverlay, { top: insets.top + 72 }]}>
              <AppText style={styles.introEyebrow}>ILLUSTRATED CITY · NOT TO SCALE</AppText>
              <AppText style={styles.fullHeadline}>{surprise?.phase === 'search' || surprise?.phase === 'lock' ? (theme === 'winter' ? 'Shaking the snow globe…' : 'Lighting up a destination…') : 'Pick a district.\nSee what’s\nhappening.'}</AppText>
            </View> : null}
            {!districtId && !surprise ? <Animated.View pointerEvents="none" style={[styles.dragHint, dragHintStyle]}><AppText style={styles.dragHintText}>Drag to look around</AppText></Animated.View> : null}
            <View style={styles.flexSpacer} />
            {surprise?.phase === 'done' ? null : <View style={styles.bottomPanel}>
              {surprise ? <Pressable accessibilityRole="button" onPress={skipSurprise} style={styles.skipButton}><AppText style={styles.skipText}>Skip</AppText></Pressable> : <><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.districtChoices}>
                {([
                  ['old', 'Old Gurugram', 'Markets & local finds'],
                  ['s29', 'Sector 29', 'Food & nightlife'],
                  ['cyber', 'Cyber City', 'After-office hangouts'],
                  ['galleria', 'Galleria', 'Shopping & cafés'],
                  ['green', 'Green Edge', 'Parks & open space'],
                ] as const).map(([id, name, description]) => (
                  <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Select district ${name}`} accessibilityState={{ selected: districtId === id }} onPress={() => {
                    const district = districts.find((item) => item.id === id);
                    if (district) focusDistrict(district);
                  }} style={[styles.districtChoice, districtId === id && styles.districtChoiceSelected]}>
                    <AppText style={styles.districtChoiceName}>{name}</AppText>
                    <AppText style={styles.districtChoiceDescription}>{description}</AppText>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.bottomActions}>
                <Pressable accessibilityRole="button" onPress={runSurprise} style={styles.surpriseButton}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} tintColor="#07242A" size={19} /><AppText style={styles.surpriseText}>Surprise me</AppText></Pressable>
                <Pressable accessibilityRole="button" onPress={openMap} style={styles.mapButton}><SymbolView name={{ ios: 'map', android: 'map', web: 'map' }} tintColor="white" size={19} /><AppText style={styles.mapText}>Real map</AppText></Pressable>
              </View></>}
            </View>}
          </View>
        </View>
      </GestureDetector>
      <CityWorldTransitionOverlay />

      <Modal visible={moodPickerOpen} transparent animationType="slide" onRequestClose={() => setMoodPickerOpen(false)}>
        <View style={styles.modalShade}>
          <Pressable accessibilityLabel="Close mood picker" onPress={() => setMoodPickerOpen(false)} style={StyleSheet.absoluteFill} />
          <View style={[styles.moodSheet, { paddingBottom: insets.bottom + 18 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.moodSheetHeader}>
              <View><AppText style={styles.moodSheetTitle}>Mood</AppText><AppText style={styles.moodSheetSubtitle}>Changes the lighting and which places we suggest first.</AppText></View>
            </View>
            {!fullMoodSetsReady ? <AppText style={styles.moodPreparation}>Preparing mood scenes…</AppText> : null}
            {moods.map((item) => {
              const label = item[0].toUpperCase() + item.slice(1);
              const selected = mood === item;
              return <Pressable key={item} disabled={!fullMoodSetsReady} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: !fullMoodSetsReady }} accessibilityLabel={`${label}. ${moodDescriptions[item]}`} onPress={() => { startMoodTransition(item); setMoodPickerOpen(false); }} style={[styles.moodOption, selected && styles.moodOptionSelected, !fullMoodSetsReady && styles.moodOptionDisabled]}>
                <View style={[styles.moodColorDot, { backgroundColor: moodColor(item) }]} /><View style={styles.moodOptionCopy}><AppText style={styles.moodOptionName}>{label}</AppText><AppText style={styles.moodOptionDescription}>{moodDescriptions[item]}</AppText></View>
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>{selected ? <View style={styles.radioInner} /> : null}</View>
              </Pressable>;
            })}
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(selectedDistrict && !surprise)} transparent animationType="slide" onRequestClose={() => setDistrictId(null)}>
        {selectedDistrict ? <View style={styles.districtModal}><Pressable accessibilityLabel="Close district details" onPress={() => setDistrictId(null)} style={StyleSheet.absoluteFill} /><View style={[styles.detailSheet, { paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.sheetHandle} /><View style={styles.detailHeading}><View><AppText style={styles.eyebrowDark}>DISTRICT · ILLUSTRATIVE</AppText><AppText style={styles.detailTitle}>{selectedDistrict.name}</AppText></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setDistrictId(null)} style={styles.closeButton}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} tintColor={designTokens.color.ink} size={20} /></Pressable></View>
          <AppText style={styles.detailTag}>{districtTag(selectedDistrict.id)}</AppText><AppText style={styles.detailDescription}>{districtDescription(selectedDistrict.id)}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.knownTags}>{districtKnown(selectedDistrict.id).map((tag) => <AppText key={tag} style={styles.knownTag}>{tag}</AppText>)}</ScrollView>
          <AppText style={styles.picksHeading}>{selectedPlaces.length ? `PICKS FOR ${mood.toUpperCase()}` : 'WORTH A LOOK'}</AppText>
          {selectedPlaces.length ? selectedPlaces.slice(0, 4).map((place) => <Pressable key={place.id} accessibilityRole="button" accessibilityLabel={`Open ${place.name}`} onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })} style={styles.pickRow}><PlaceIllustration place={place} compact /><View style={styles.pickCopy}><AppText style={styles.pickName}>{place.name}</AppText><AppText style={styles.pickMeta}>{place.category} · ≈ {formatDistance(distanceKm(origin, place))}</AppText></View><SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={designTokens.color.ink} size={18} /></Pressable>) : <AppText style={styles.emptyText}>No {mood} demo picks for this district yet.</AppText>}
          <View style={styles.bottomActions}><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/explore', params: { district: selectedDistrict.id } })} style={styles.realMapButton}><SymbolView name={{ ios: 'safari', android: 'explore', web: 'explore' }} tintColor="white" size={18} /><AppText style={styles.realMapText}>Explore this area</AppText></Pressable><Pressable accessibilityRole="button" onPress={openMap} style={styles.realMapSecondary}><SymbolView name={{ ios: 'map', android: 'map', web: 'map' }} tintColor={designTokens.color.ink} size={18} /><AppText style={styles.realMapSecondaryText}>Open in Map</AppText></Pressable></View>
        </View></View> : null}
      </Modal>

      <Modal visible={Boolean(surprise?.phase === 'done')} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => { setSurprise(null); dim.value = reduceMotion ? 0 : withTiming(0, { duration: 300 }); }}>
        <View style={styles.resultModalShade}><Pressable accessibilityLabel="Close suggestion" onPress={() => { setSurprise(null); dim.value = reduceMotion ? 0 : withTiming(0, { duration: 300 }); }} style={StyleSheet.absoluteFill} /><View style={[styles.resultSheet, { paddingBottom: 18 }]}>
          <View style={styles.sheetHandle} /><AppText style={styles.eyebrowDark}>THE CITY PICKED · {surprise?.target ? districtName(districtForPlace(surprise.target)) : ''}</AppText>
          {surprise?.target ? <><PlaceIllustration place={surprise.target} /><AppText style={styles.demoLabel}>DEMO SUGGESTION · NOT A VERIFIED RECOMMENDATION</AppText><AppText style={styles.detailTitle}>{surprise.target.name}</AppText><AppText style={styles.pickMeta}>{surprise.target.category} · {surprise.target.neighborhood} · ≈ {formatDistance(distanceKm(origin, surprise.target))}</AppText><AppText style={styles.detailDescription}>{surprise.target.description}</AppText></> : <AppText style={styles.detailDescription}>No matching demo suggestions for this mood yet.</AppText>}
          <View style={styles.surpriseResultActions}><Pressable accessibilityRole="button" accessibilityLabel={surprise?.target && isSaved(surprise.target.id) ? 'Remove from saved places' : 'Save place'} onPress={() => { if (surprise?.target) toggleSaved(surprise.target.id); }} style={styles.surpriseSaveButton}><SymbolView name={{ ios: surprise?.target && isSaved(surprise.target.id) ? 'bookmark.fill' : 'bookmark', android: 'bookmark', web: 'bookmark' }} tintColor={designTokens.color.ink} size={20} /></Pressable><Pressable accessibilityRole="button" onPress={() => { if (surprise?.target) { setSurprise(null); router.push({ pathname: '/place/[id]', params: { id: surprise.target.id } }); } }} style={styles.realMapButton}><AppText style={styles.realMapText}>Open details</AppText></Pressable><Pressable accessibilityRole="button" onPress={runSurprise} style={styles.realMapSecondary}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} tintColor={designTokens.color.ink} size={17} /><AppText style={styles.realMapSecondaryText}>Try again</AppText></Pressable></View>
        </View></View>
      </Modal>
    </View>
  );
}

function FullSceneCanvas({ theme, mood, places, camera, clock, entrance, snowAmount, searchProgress, opacity, windowProgress, windowFrom, windowTo, drawLights = true, selected, surprise, scale, dim, flashRadius, onDistrictPress, onSceneAssetLoad }: {
  theme: Theme; mood: PlaceMood; places: Place[]; camera: SharedValue<number>; clock: SharedValue<number>; entrance: SharedValue<number>; snowAmount: SharedValue<number>; searchProgress: SharedValue<number>;
  opacity: SharedValue<number>; windowProgress: SharedValue<number>; windowFrom: WindowPalette; windowTo: WindowPalette; selected: string | null; surprise: Surprise | null; scale: number; onDistrictPress?: (district: District) => void; onSceneAssetLoad?: (asset: string) => void;
  drawLights?: boolean;
  dim: SharedValue<number>; flashRadius: SharedValue<number>;
}) {
  const set = useMemo(() => getFullSceneAssets(theme, mood), [theme, mood]);
  const source = useCallback((name: string) => set.assets.find((asset) => asset.name === name), [set]);
  const data = set.scene as any;
  const width = 390 * scale;
  const height = 844 * scale;
  const midWidth = data.layerWidths.mid;
  const districtMeta = (data.districts as District[]).map((district) => ({
    ...district,
    matches: districtPlaces(places, district.id, mood).length,
  }));
  const pillTops = districtPillPositions(districtMeta, midWidth, selected ?? (surprise?.phase === 'search' ? surprise.districtId : null));
  const frost = source('frost');
  const vignette = source('vignette');

  useEffect(() => {
    if (!__DEV__ || fullDrawOrderLogged) return;
    fullDrawOrderLogged = true;
    const rows = [
      { layer: 'sky', zIndex: 0, opacity: 1, x: 0, y: 0 },
      { layer: 'stars', zIndex: 1, opacity: 1, x: 0, y: 0 },
      { layer: 'moon_glow', zIndex: 2, opacity: 1, x: (data.moon.x - data.moon.glowR - camera.value * data.moon.parallax) * scale, y: (data.moon.y - data.moon.glowR) * scale },
      { layer: 'moon', zIndex: 3, opacity: 1, x: (data.moon.x - data.moon.r - camera.value * data.moon.parallax) * scale, y: (data.moon.y - data.moon.r) * scale },
      ...set.assets.filter((asset) => ['ridge', 'far', 'farCaps', 'mid', 'midCaps', 'metro', 'near'].includes(asset.name)).map((asset) => ({ layer: asset.name, zIndex: asset.name === 'farCaps' ? (source('far')?.zIndex ?? 6) + 0.6 : asset.name === 'midCaps' ? (source('mid')?.zIndex ?? 9) + 0.6 : asset.zIndex, opacity: asset.name.endsWith('Caps') ? snowAmount.value : 1, x: -camera.value * (asset.parallax ?? 0) * scale, y: (asset.offsetYPt ?? 0) * scale })),
      { layer: 'far lights', zIndex: (source('far')?.zIndex ?? 6) + 0.5, opacity: 1, x: -camera.value * (source('far')?.parallax ?? 0.3) * scale, y: (source('far')?.offsetYPt ?? 0) * scale },
      { layer: 'mid lights', zIndex: (source('mid')?.zIndex ?? 9) + 0.5, opacity: 1, x: -camera.value * (source('mid')?.parallax ?? 0.6) * scale, y: (source('mid')?.offsetYPt ?? 0) * scale },
      { layer: 'beam_column + beam_halo', zIndex: 11, opacity: 0.42 * set.glowBoost, x: -camera.value * 0.6 * scale, y: 0 },
      { layer: 'train', zIndex: 14, opacity: 1, x: -camera.value * 0.8 * scale, y: (data.trainY ?? 0) * scale },
      { layer: 'snowmen', zIndex: 16, opacity: theme === 'winter' ? snowAmount.value : 0, x: -camera.value * 0.6 * scale, y: 0 },
      { layer: 'car_head + car_tail', zIndex: 17, opacity: clock.value > 0 ? 1 : 0, x: -camera.value * scale, y: 844 * 0.87 * scale },
      { layer: 'surprise_cone', zIndex: 18.5, opacity: surprise?.phase === 'search' ? Math.min(1, set.glowBoost) : 0, x: 195 * scale, y: 844 * scale },
      { layer: 'surprise_flash', zIndex: 18.6, opacity: surprise?.phase === 'lock' ? 1 : 0, x: 0, y: 0 },
      { layer: theme === 'winter' ? 'frost' : 'vignette', zIndex: 20, opacity: theme === 'winter' ? snowAmount.value : (vignette?.opacity ?? 1), x: 0, y: 0 },
    ].sort((left, right) => left.zIndex - right.zIndex);
    console.info('[SceneDrawOrder] full', rows);
  }, [camera, clock, data, scale, set, snowAmount, source, surprise, theme, vignette]);

  return <SceneTransitionLayer testID={`full-scene-${theme}-${mood}`} opacity={opacity}>
    {() => <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
    <Image pointerEvents="none" source={source('sky')?.source} onLoad={() => onSceneAssetLoad?.('sky')} transition={0} cachePolicy="memory-disk" contentFit="fill" style={{ position: 'absolute', left: 0, top: 0, width, height, zIndex: 0 }} />
    <ImageLayer source={source('moon_glow')?.source} x={(data.moon.x - data.moon.glowR) * scale} y={(data.moon.y - data.moon.glowR) * scale} width={data.moon.glowR * 2 * scale} height={data.moon.glowR * 2 * scale} camera={camera} parallax={data.moon.parallax} scale={scale} zIndex={2} />
    <ImageLayer source={source('moon')?.source} x={(data.moon.x - data.moon.r) * scale} y={(data.moon.y - data.moon.r) * scale} width={data.moon.r * 2 * scale} height={data.moon.r * 2 * scale} camera={camera} parallax={data.moon.parallax} scale={scale} zIndex={3} />
    {data.stars.map((star: any, i: number) => <Star key={`star-${i}`} star={star} clock={clock} scale={scale} zIndex={1} />)}
    {theme === 'winter' ? <WinterFog set={set} clock={clock} scale={scale} zIndex={5} /> : null}
    {set.assets.filter((asset) => ['ridge', 'far'].includes(asset.name)).map((asset) => {
      const linked = asset.name === 'farCaps' ? source('far') : asset.name === 'midCaps' ? source('mid') : asset;
      const parallax = asset.parallax ?? linked?.parallax ?? ({ ridge: .12, far: .3, farCaps: .3, mid: .6, midCaps: .6, metro: .8, near: 1 } as Record<string, number>)[asset.name];
      const y = (asset.offsetYPt ?? 0) * scale;
      const entranceOffset = asset.name === 'far' ? 20 : asset.name === 'mid' ? 36 : 0;
      const fadeIn = asset.name === 'mid';
      return <ImageLayer key={asset.name} source={asset.source} x={0} y={y} width={asset.sizePt[0] * scale} height={asset.sizePt[1] * scale} camera={camera} parallax={parallax} scale={scale} zIndex={asset.zIndex} testID={`full-layer-${asset.name}`} entrance={entrance} entranceOffset={entranceOffset} fadeIn={fadeIn} snowAmount={asset.name === 'farCaps' || asset.name === 'midCaps' ? snowAmount : undefined} onLoad={() => onSceneAssetLoad?.(asset.name)} />;
    })}
    {drawLights ? <WindowLightsCanvas surface="full" layer="far" width={width} height={height} scale={scale} camera={camera} from={windowFrom} to={windowTo} progress={windowProgress} capSource={source('farCaps')?.source} capY={source('farCaps')?.offsetYPt ?? 0} capWidth={source('farCaps')?.sizePt[0] ?? 0} capHeight={source('farCaps')?.sizePt[1] ?? 0} capOpacity={snowAmount} entrance={entrance} onLoad={onSceneAssetLoad} testID="full-window-lights-far" zIndex={(source('far')?.zIndex ?? 6) + 0.5} /> : null}
    {set.assets.filter((asset) => asset.name === 'mid').map((asset) => <ImageLayer key={asset.name} source={asset.source} x={0} y={(asset.offsetYPt ?? 0) * scale} width={asset.sizePt[0] * scale} height={asset.sizePt[1] * scale} camera={camera} parallax={asset.parallax ?? .6} scale={scale} zIndex={asset.zIndex} testID="full-layer-mid" entrance={entrance} entranceOffset={36} fadeIn onLoad={() => onSceneAssetLoad?.(asset.name)} />)}
    {drawLights ? <WindowLightsCanvas surface="full" layer="mid" width={width} height={height} scale={scale} camera={camera} from={windowFrom} to={windowTo} progress={windowProgress} capSource={source('midCaps')?.source} capY={source('midCaps')?.offsetYPt ?? 0} capWidth={source('midCaps')?.sizePt[0] ?? 0} capHeight={source('midCaps')?.sizePt[1] ?? 0} capOpacity={snowAmount} entrance={entrance} onLoad={onSceneAssetLoad} testID="full-window-lights-mid" zIndex={(source('mid')?.zIndex ?? 9) + 0.5} /> : null}
    {districtMeta.map((district) => <Beam key={`beam-${district.id}`} set={set} district={district} camera={camera} clock={clock} scale={scale} selected={selected} surprise={surprise} />)}
    {set.assets.filter((asset) => asset.name === 'metro').map((asset) => <ImageLayer key={asset.name} source={asset.source} x={0} y={(asset.offsetYPt ?? 0) * scale} width={asset.sizePt[0] * scale} height={asset.sizePt[1] * scale} camera={camera} parallax={asset.parallax ?? .8} scale={scale} zIndex={asset.zIndex} testID="full-layer-metro" onLoad={() => onSceneAssetLoad?.('metro')} />)}
    <Train set={set} data={data} camera={camera} clock={clock} scale={scale} zIndex={14} />
    {set.assets.filter((asset) => asset.name === 'near').map((asset) => <ImageLayer key={asset.name} source={asset.source} x={0} y={(asset.offsetYPt ?? 0) * scale} width={asset.sizePt[0] * scale} height={asset.sizePt[1] * scale} camera={camera} parallax={asset.parallax ?? 1} scale={scale} zIndex={asset.zIndex} testID="full-layer-near" onLoad={() => onSceneAssetLoad?.('near')} />)}
    {theme === 'winter' ? <WinterAtmosphere set={set} camera={camera} clock={clock} snowAmount={snowAmount} scale={scale} zIndex={16} /> : null}
    <Traffic set={set} data={data} camera={camera} clock={clock} scale={scale} zIndex={17} />
    {districtMeta.map((district) => <DistrictPill key={`pill-${district.id}`} district={district} camera={camera} midWidth={midWidth} scale={scale} top={pillTops[district.id]} selected={selected === district.id} onPress={() => onDistrictPress?.(district)} />)}
    {(surprise?.phase === 'search' || surprise?.phase === 'lock') && theme === 'city' ? <SurpriseCone set={set} camera={camera} district={districtMeta.find((item) => item.id === surprise.districtId) ?? districtMeta[0]} searchProgress={searchProgress} scale={scale} zIndex={18.5} /> : null}
    {surprise?.phase === 'lock' ? <Flash source={source('surprise_flash')?.source} radius={flashRadius} district={districtMeta.find((item) => item.id === surprise.districtId) ?? districtMeta[0]} camera={camera} midWidth={midWidth} scale={scale} glowBoost={theme === 'city' ? set.glowBoost : 1} zIndex={18.6} /> : null}
    {theme === 'winter' ? <WinterSnowfall set={set} camera={camera} clock={clock} snowAmount={snowAmount} searchProgress={searchProgress} scale={scale} surprise={surprise} districts={districtMeta} zIndex={19.1} /> : null}
    {frost ? <AnimatedFrost source={frost.source} width={width} height={height} snowAmount={snowAmount} zIndex={20} onLoad={() => onSceneAssetLoad?.('frost')} /> : null}
    {vignette ? <Image pointerEvents="none" source={vignette.source} onLoad={() => onSceneAssetLoad?.('vignette')} transition={0} cachePolicy="memory-disk" contentFit="fill" style={{ position: 'absolute', left: 0, top: 0, width, height, zIndex: vignette.zIndex, opacity: vignette.opacity ?? 1 }} /> : null}
    <DimOverlay dim={dim} theme={theme} zIndex={21} />
    </View>}
  </SceneTransitionLayer>;
}

// Separate component keeps each asset layer transform driven by the shared camera value.
function ImageLayer({ source, x, y, width, height, camera, parallax, scale, zIndex = 0, testID, entrance, entranceOffset = 0, fadeIn = false, snowAmount, onLoad }: any) {
  const style = useAnimatedStyle(() => {
    const e = entrance?.value ?? 1;
    const rise = Math.pow(1 - e, 3);
    return { opacity: (fadeIn ? Math.min(1, .15 + 1.2 * e) : 1) * (snowAmount?.value ?? 1), transform: [{ translateX: (x ?? 0) - camera.value * (parallax ?? 0) * scale }, { translateY: rise * entranceOffset * scale }] };
  });
  return <Animated.View testID={testID} style={[{ position: 'absolute', left: 0, top: y, width, height, zIndex }, style]}><Image pointerEvents="none" source={source} onLoad={onLoad} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>;
}

function Star({ star, clock, scale, zIndex = 1 }: any) {
  const style = useAnimatedStyle(() => ({ opacity: .8 * (.35 + .65 * (.5 + .5 * Math.sin(1.6 * clock.value + star.phase))) }));
  return <Animated.View style={[{ position: 'absolute', left: star.x * 390 * scale, top: star.y * 844 * scale, width: star.size * scale, height: star.size * scale, borderRadius: 4, backgroundColor: '#E9F4FF', zIndex }, style]} />;
}

function Beam({ set, district, camera, clock, scale, selected, surprise }: any) {
  const column = set.assets.find((item: any) => item.name === 'beam_column');
  const halo = set.assets.find((item: any) => item.name === 'beam_halo');
  const winter = set.theme === 'winter';
  const boosted = winter ? 1 : set.glowBoost;
  const columnStrength = winter ? .3 : .42;
  const special = selected === district.id ? 1.6 : surprise?.phase === 'lock' && surprise.districtId === district.id ? 1.5 : selected || surprise?.phase === 'lock' ? .08 : .12 + .36 * Math.min(2, district.matches);
  const x = district.x * (set.scene as any).layerWidths.mid;
  const columnStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, columnStrength * special * (.85 + .15 * Math.sin(3 * clock.value + 9 * district.x)) * boosted), transform: [{ translateX: -camera.value * .6 * scale }] }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, .7 * special * boosted), transform: [{ translateX: -camera.value * .6 * scale }] }));
  const top = (district.top - 128) * scale;
  if (!column || !halo) return null;
  return <>
    <Animated.View style={[{ position: 'absolute', left: x * scale - 6 * scale, top, width: 12 * scale, height: 128 * scale, zIndex: 11 }, columnStyle]}><Image source={column.source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>
    <Animated.View style={[{ position: 'absolute', left: x * scale - 22 * scale, top: (district.top - 22) * scale, width: 44 * scale, height: 44 * scale, zIndex: 12 }, haloStyle]}><Image source={halo.source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>
  </>;
}

function DistrictPill({ district, camera, midWidth, scale, top, selected, onPress }: any) {
  const pillWidth = Math.max(84, district.name.length * 7.5 + 44);
  const style = useAnimatedStyle(() => {
    const center = (district.x * midWidth - camera.value * .6) * scale;
    const left = Math.min(390 * scale - pillWidth * scale - 6, Math.max(6, center - pillWidth * scale / 2));
    return { left, opacity: center > 12 * scale && center < 378 * scale ? 1 : 0 };
  });
  return <Animated.View style={[styles.districtPill, { top: top * scale, width: pillWidth * scale }, selected && styles.districtPillSelected, style]}><Pressable hitSlop={4} accessibilityRole="button" accessibilityLabel={`Show ${district.name}`} onPress={onPress} style={styles.districtPillContent}><View style={styles.liveDot} /><AppText style={styles.districtText}>{district.name}</AppText></Pressable></Animated.View>;
}

function Traffic({ set, data, camera, clock, scale, zIndex = 17 }: any) {
  const head = set.assets.find((item: any) => item.name === 'car_head');
  const tail = set.assets.find((item: any) => item.name === 'car_tail');
  if (!head || !tail) return null;
  return <>{(data.cars as any[]).map((car, index) => <Car key={`car-${index}`} car={car} index={index} source={car.lane === 0 ? head.source : tail.source} camera={camera} clock={clock} scale={scale} traffic={data.palette.traffic} glow={set.theme === 'winter' ? .6 : set.glowBoost} nearWidth={data.layerWidths.near} zIndex={zIndex} />)}</>;
}

function Train({ set, data, camera, clock, scale, zIndex = 14 }: any) {
  const train = set.assets.find((asset: any) => asset.name === 'train');
  const style = useAnimatedStyle(() => {
    const x = (clock.value * 60 % (data.layerWidths.metro + 200)) - 100 - camera.value * .8;
    return { transform: [{ translateX: x * scale }] };
  });
  if (!train) return null;
  return <Animated.View style={[{ position: 'absolute', left: 0, top: (data.trainY ?? 0) * scale, width: train.sizePt[0] * scale, height: train.sizePt[1] * scale, zIndex }, style]}><Image source={train.source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>;
}

function Car({ car, index, source, camera, clock, scale, traffic, glow, nearWidth, zIndex = 17 }: any) {
  const carLength = 12 + 20 * car.v * traffic;
  const style = useAnimatedStyle(() => {
    const direction = car.lane === 0 ? 1 : -1;
    const position = ((car.x + direction * car.v * traffic * clock.value * .03) % 1 + 1) % 1;
    const x = position * nearWidth - camera.value;
    const visible = x >= -30 && x <= 420;
    return { transform: [{ translateX: (x - (car.lane === 0 ? carLength : 0)) * scale }, { scaleX: car.lane === 0 ? -1 : 1 }], opacity: clock.value > 0 && visible ? Math.min(1, (car.lane === 0 ? .95 : .6) * glow) : 0 };
  });
  const length = carLength * scale;
  return <Animated.View style={[{ position: 'absolute', left: 0, top: (car.lane === 0 ? 844 * .87 : 844 * .9) * scale, width: length, height: 2 * scale, zIndex }, style]}><Image source={source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>;
}

function WinterAtmosphere({ set, camera, clock, snowAmount, scale, zIndex = 16 }: any) {
  const snowmen = (set.scene as any).snowmen as any[];
  const body = set.assets.find((asset: any) => asset.name === 'snowman_body');
  const head = set.assets.find((asset: any) => asset.name === 'snowman_head');
  const frontRed = set.assets.find((asset: any) => asset.name === 'snowman_front_red');
  const frontBlue = set.assets.find((asset: any) => asset.name === 'snowman_front_blue');
  const arm = set.assets.find((asset: any) => asset.name === 'snowman_arm');
  return <>{snowmen.map((snowman, index) => body && head && frontRed && frontBlue && arm ? <Snowman key={`snowman-${index}`} snowman={snowman} camera={camera} clock={clock} snowAmount={snowAmount} scale={scale} body={body.source} head={head.source} front={(snowman.k ? frontBlue : frontRed).source} arm={arm.source} zIndex={zIndex} /> : null)}</>;
}

function WinterFog({ set, clock, scale, zIndex = 5 }: any) {
  const fog = set.assets.find((asset: any) => asset.name === 'fog');
  if (!fog) return null;
  return <>{((set.scene as any).fogs as any[]).map((item, index) => <FogBand key={`fog-${index}`} fog={item} source={fog.source} clock={clock} scale={scale} zIndex={zIndex} />)}</>;
}

function WinterSnowfall({ set, camera, clock, snowAmount, searchProgress, scale, surprise, districts, zIndex = 19.1 }: any) {
  const flakes = (set.scene as any).flakes as any[];
  const target = districts.find((item: any) => item.id === surprise?.districtId);
  const big = set.assets.find((asset: any) => asset.name === 'flake_big');
  return <>{flakes.map((flake, index) => <Snowflake key={`flake-${index}`} flake={flake} clock={clock} snowAmount={snowAmount} searchProgress={searchProgress} camera={camera} midWidth={(set.scene as any).layerWidths.mid} scale={scale} bigSource={big?.source} target={surprise?.phase === 'search' || surprise?.phase === 'lock' ? target : null} zIndex={zIndex} />)}</>;
}

function FogBand({ fog, source, clock, scale, zIndex = 5 }: any) {
  const style = useAnimatedStyle(() => {
    const drift = ((fog.x + fog.v * .96 * clock.value) % 780 + 780) % 780 - 117;
    return { transform: [{ translateX: drift * scale }], opacity: fog.a * (fog.band === 0 ? .1 : .12) };
  });
  const frameStyle = { position: 'absolute' as const, left: 0, top: (fog.y - fog.h) * scale, width: fog.w * scale, height: fog.h * 2 * scale, zIndex };
  return <>
    <Animated.View style={[frameStyle, style]}><Image source={source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>
    <Animated.View style={[frameStyle, style, { left: 780 * scale }]}><Image source={source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>
  </>;
}

function Snowman({ snowman, camera, clock, snowAmount, scale, body, head, front, arm, zIndex = 16 }: any) {
  const root = useAnimatedStyle(() => ({ opacity: snowAmount.value, transform: [{ translateX: (snowman.layerX - camera.value * .6 - 27 * snowman.scale) * scale }, { rotate: `${.06 * Math.sin(1.3 * clock.value + snowman.k)}rad` }] }));
  const headStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${.06 * Math.sin(1.3 * clock.value + snowman.k)}rad` }] }));
  const armStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${.5 * Math.sin(2.4 * clock.value + 2 * snowman.k)}rad` }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: (snowman.y - 78 * snowman.scale) * scale, width: 54 * snowman.scale * scale, height: 78 * snowman.scale * scale, zIndex }, root]}>
    <Image source={body} contentFit="fill" style={StyleSheet.absoluteFill} />
    <Animated.View style={[StyleSheet.absoluteFill, headStyle]}><Image source={head} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>
    <Image source={front} contentFit="fill" style={StyleSheet.absoluteFill} />
    <Animated.View style={[StyleSheet.absoluteFill, armStyle]}><Image source={arm} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>
  </Animated.View>;
}

function Snowflake({ flake, clock, snowAmount, searchProgress, camera, midWidth, scale, bigSource, target, zIndex = 19.1 }: any) {
  const style = useAnimatedStyle(() => {
    const fallingY = ((flake.y + clock.value * (14 + 34 * flake.z)) % 892) - 24;
    const fallingX = flake.x + Math.sin(.8 * clock.value + flake.phase) * 8 * flake.z;
    const orbit = target ? .85 : 0;
    const targetX = target ? target.x * midWidth - camera.value * .6 : 0;
    const targetY = target?.top ?? 0;
    const p = searchProgress.value;
    const g = target ? (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2) : 0;
    const x = fallingX * (1 - orbit * g) + (targetX + Math.cos(flake.phase + 3 * clock.value) * (10 + 24 * flake.z)) * orbit * g;
    const y = fallingY * (1 - orbit * g) + (targetY + Math.sin(flake.phase + 3 * clock.value) * (10 + 20 * flake.z)) * orbit * g;
    return { transform: [{ translateX: x * scale }, { translateY: (y - flake.y) * scale }], opacity: (.35 + .55 * flake.z) * snowAmount.value };
  });
  const size = (flake.big ? 12 : 1.2 + 3 * flake.z) * scale;
  return <Animated.View style={[{ position: 'absolute', left: flake.x * scale, top: flake.y * scale, width: size, height: size, borderRadius: size, backgroundColor: flake.big ? 'transparent' : 'white', zIndex }, style]}>{flake.big && bigSource ? <Image source={bigSource} contentFit="fill" style={StyleSheet.absoluteFill} /> : null}</Animated.View>;
}

function SurpriseCone({ set, camera, district, searchProgress, scale, zIndex = 18.5 }: any) {
  const source = set.assets.find((asset: any) => asset.name === 'surprise_cone')?.source;
  const meta = (set.scene as any).layerWidths;
  const bx = 195;
  const by = 864;
  const length = Math.hypot(district.x * meta.mid - bx, district.top - by) + 30;
  const style = useAnimatedStyle(() => {
    const p = searchProgress.value;
    const x = district.x * meta.mid - camera.value * .6 + Math.sin(p * 14) * (1 - p) * 80;
    const angle = Math.atan2(district.top - by, x - bx);
    return { width: (Math.hypot(x - bx, district.top - by) + 30) * scale, height: 58 * (Math.hypot(x - bx, district.top - by) + 30) / 400 * scale, opacity: p > 0 ? Math.min(1, set.glowBoost) : 0, transform: [{ rotate: `${angle}rad` }] };
  });
  if (!source) return null;
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: bx * scale, top: by * scale - 29 * length / 400 * scale, width: length * scale, height: 58 * length / 400 * scale, transformOrigin: 'left center', zIndex }, style]}><Image source={source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>;
}

function Flash({ source, radius, district, camera, midWidth, scale, glowBoost = 1, zIndex = 18.6 }: any) {
  const style = useAnimatedStyle(() => ({ width: radius.value * 2 * scale, height: radius.value * 2 * scale, opacity: radius.value > 16 ? Math.max(0, .9 * (1 - (radius.value - 16) / 130)) * Math.min(1, glowBoost) : 0 }));
  const x = (district.x * midWidth - camera.value * .6) * scale;
  const y = district.top * scale;
  return source ? <Animated.View style={[{ position: 'absolute', left: x, top: y, borderRadius: 200, zIndex }, style]}><Image source={source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View> : null;
}

function DimOverlay({ dim, theme, zIndex = 21 }: any) {
  const style = useAnimatedStyle(() => ({ opacity: dim.value * (theme === 'winter' ? .7 : 1) }));
  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme === 'winter' ? '#0A142D' : '#00000A', zIndex }, style]} />;
}

function AnimatedFrost({ source, width, height, snowAmount, zIndex = 20, onLoad }: { source: number; width: number; height: number; snowAmount: SharedValue<number>; zIndex?: number; onLoad?: () => void }) {
  const style = useAnimatedStyle(() => ({ opacity: snowAmount.value }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width, height, zIndex }, style]}><Image source={source} onLoad={onLoad} transition={0} cachePolicy="memory-disk" contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>;
}

function moodColor(mood: PlaceMood) {
  return ({ chill: '#8FE1D1', social: '#FF79B0', nature: '#C5EF6C', active: '#7BCBFF', foodie: '#FFB64F', explore: '#B99AFF' } as const)[mood];
}

function districtTag(id: string) {
  return ({ old: 'Markets & local finds', s29: 'Food & nightlife', cyber: 'After-office hangouts', galleria: 'Shopping & cafés', green: 'Parks & open space' } as Record<string, string>)[id] ?? 'Local finds';
}

function districtKnown(id: string) {
  return ({ old: ['Street food', 'Local markets', 'Long walks'], s29: ['Dinner plans', 'Late evenings', 'Park walks'], cyber: ['After work', 'Coffee breaks', 'Group plans'], galleria: ['Cafés', 'Shopping', 'Slow afternoons'], green: ['Park walks', 'Open air', 'Nature'] } as Record<string, string[]>)[id] ?? [];
}

function districtName(id: string) {
  return ({ old: 'Old Gurugram', s29: 'Sector 29', cyber: 'Cyber City', galleria: 'Galleria', green: 'Green Edge' } as Record<string, string>)[id] ?? 'Gurugram';
}

function districtDescription(id: string) {
  return ({ old: 'Explore familiar lanes, local markets and everyday finds around Old Gurugram.', s29: 'Kitchens, cafés and bars clustered round Leisure Valley.', cyber: 'After-office cafés, shared tables and late plans in Cyber City.', galleria: 'Browse cafés, shops and relaxed corners around Galleria.', green: 'Find open paths, gardens and outdoor places around Gurugram.' } as Record<string, string>)[id] ?? 'Explore places around this part of Gurugram.';
}

function formatDistance(distance: number) {
  return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#06101D' },
  worldTouchArea: { flex: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  headerTitle: { flex: 1, alignItems: 'center' },
  moodPillButton: { height: 40, maxWidth: 135, borderRadius: 22, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' },
  moodPillLabel: { color: 'white', fontFamily: 'InterTight_600SemiBold', fontSize: 14 },
  title: { color: 'white', fontFamily: 'Syne_700Bold', fontSize: 16, lineHeight: 20, textAlign: 'center', flexShrink: 1 },
  eyebrow: { color: '#B8C7D5', fontSize: 11, fontFamily: 'InterTight_700Bold', letterSpacing: 1.1 },
  flexSpacer: { flex: 1 },
  iconButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.18)', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sceneBottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 320, zIndex: 1 },
  sceneFadeBand: { position: 'absolute', left: 0, right: 0, height: 11 },
  bottomPanel: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, backgroundColor: 'transparent', zIndex: 2 },
  headlineOverlay: { position: 'absolute', left: 28, right: 30, zIndex: 2 },
  fullHeadline: { color: 'white', fontFamily: 'Syne_700Bold', fontSize: 32, lineHeight: 33, textShadowColor: 'rgba(0,0,0,.35)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 2 }, marginTop: 7, maxWidth: 295 },
  dragHint: { position: 'absolute', top: '46%', alignSelf: 'center' },
  dragHintText: { color: 'rgba(255,255,255,.72)', fontSize: 12 },
  skipButton: { minHeight: 44, alignSelf: 'center', paddingHorizontal: 20, justifyContent: 'center' },
  skipText: { color: 'white', fontSize: 15, fontFamily: 'InterTight_600SemiBold' },
  introCopy: { paddingHorizontal: 4, paddingBottom: 12 },
  introEyebrow: { color: '#8FE1D1', fontFamily: 'InterTight_700Bold', fontSize: 11, letterSpacing: 1.1 },
  introTitle: { color: 'white', fontFamily: 'Syne_700Bold', fontSize: 18, marginTop: 5 },
  districtChoices: { height: 48, gap: 8, alignItems: 'center' },
  districtChoice: { width: 144, height: 48, minHeight: 48, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 14, borderColor: 'rgba(255,255,255,.2)', borderWidth: 1, backgroundColor: 'rgba(255,255,255,.07)', justifyContent: 'center' },
  districtChoiceSelected: { backgroundColor: 'rgba(143,225,209,.18)', borderColor: '#8FE1D1' },
  districtChoiceName: { color: 'white', fontFamily: 'InterTight_700Bold', fontSize: 13, lineHeight: 16 },
  districtChoiceDescription: { color: '#BBC5D0', fontFamily: 'InterTight_500Medium', fontSize: 10, lineHeight: 12, marginTop: 0 },
  bottomActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  surpriseButton: { flex: 1, height: 46, borderRadius: 14, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8FE3D0' },
  surpriseText: { color: '#07242A', fontSize: 16, fontFamily: 'InterTight_700Bold' },
  mapButton: { flex: 1, height: 46, borderRadius: 14, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  mapText: { color: 'white', fontSize: 16, fontFamily: 'InterTight_700Bold' },
  moodSheet: { backgroundColor: '#F6F7F9', paddingHorizontal: 20, paddingTop: 12, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '86%' },
  moodSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  moodSheetTitle: { color: designTokens.color.ink, fontFamily: 'Syne_700Bold', fontSize: 24, marginTop: 3 },
  moodSheetSubtitle: { color: '#596579', fontSize: 14, marginTop: 4, maxWidth: 280 },
  moodPreparation: { color: '#596579', fontSize: 14, marginBottom: 8 },
  moodColorDot: { width: 14, height: 14, borderRadius: 7 },
  moodOption: { minHeight: 62, paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#DDE1E6', flexDirection: 'row', alignItems: 'center', gap: 12 },
  moodOptionSelected: { backgroundColor: '#E9F6F3', borderRadius: 14 },
  moodOptionDisabled: { opacity: 0.55 },
  moodOptionCopy: { flex: 1 },
  moodOptionName: { color: designTokens.color.ink, fontFamily: 'InterTight_700Bold', fontSize: 16 },
  moodOptionDescription: { color: '#626F81', fontSize: 14, marginTop: 2 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#8B95A4', alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: '#087F70' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#087F70' },
  districtPill: { position: 'absolute', zIndex: 22, minHeight: 36, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, backgroundColor: 'rgba(5,16,28,.88)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  districtPillContent: { minHeight: 36, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  districtPillSelected: { borderColor: '#8FE1D1' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#8FE1D1' },
  districtText: { color: 'white', fontSize: 14, fontFamily: 'InterTight_700Bold' },
  modalShade: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.45)' },
  districtModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  detailTag: { color: '#087F70', fontSize: 15, fontFamily: 'InterTight_700Bold', marginTop: 3 },
  knownTags: { gap: 8, paddingVertical: 10 },
  knownTag: { overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: '#DDE1E6', paddingHorizontal: 10, paddingVertical: 6, color: '#293446', fontSize: 12 },
  detailSheet: { backgroundColor: '#F6F7F9', paddingHorizontal: 20, paddingTop: 12, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '82%' },
  resultModalShade: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.6)' },
  resultSheet: { backgroundColor: '#F6F7F9', paddingHorizontal: 20, paddingTop: 12, borderRadius: 28, gap: 12, marginHorizontal: 16, maxHeight: '78%', alignSelf: 'stretch' },
  surpriseResultActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  surpriseSaveButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#E9EDF1' },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#C6CBD2', alignSelf: 'center', marginBottom: 10 },
  detailHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrowDark: { color: '#697486', fontFamily: 'InterTight_700Bold', fontSize: 11, letterSpacing: 1 },
  detailTitle: { color: designTokens.color.ink, fontFamily: 'Syne_700Bold', fontSize: 24, marginTop: 4 },
  closeButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E9EDF1', alignItems: 'center', justifyContent: 'center' },
  detailDescription: { color: '#596579', fontSize: 16, lineHeight: 23, marginTop: 8 },
  picksHeading: { color: designTokens.color.ink, fontFamily: 'InterTight_700Bold', fontSize: 17, marginTop: 14, marginBottom: 2 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#DDE1E6' },
  pickCopy: { flex: 1 },
  pickName: { color: designTokens.color.ink, fontFamily: 'InterTight_700Bold', fontSize: 16 },
  pickMeta: { color: '#5F6A7C', fontSize: 14, marginTop: 3 },
  demoLabel: { color: '#087F70', fontFamily: 'InterTight_600SemiBold', fontSize: 12, marginTop: 4 },
  emptyText: { color: '#626F81', fontSize: 15, paddingVertical: 14 },
  realMapButton: { minHeight: 48, borderRadius: 16, backgroundColor: '#172532', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  realMapText: { color: 'white', fontFamily: 'InterTight_700Bold', fontSize: 15 },
  realMapSecondary: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: '#E9EDF1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  realMapSecondaryText: { color: designTokens.color.ink, fontFamily: 'InterTight_700Bold', fontSize: 15 },
});
