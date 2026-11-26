import { Image } from 'expo-image';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';

import { winterSceneSpec } from './winter-scene-spec';
import type { SceneMood } from '../scene-registry';
import { useCityWorldTransition } from '@/providers/city-world-transition-provider';

/* Reanimated SharedValue writes are intentional animation state. */
/* eslint react-hooks/immutability: off */

type Surface = 'hero' | 'preview';
type WinterLayer = { source: number; zIndex: number; sizePt?: readonly [number, number]; parallax?: number; offsetYPt?: number };
type WinterData = {
  artboardPt: readonly [number, number]; maxCameraPt: number; cameraSpeedPtPerS: number;
  moon: { x: number; y: number; glowR: number; parallax: number };
  stars: readonly { x: number; y: number; size: number; phase: number }[];
  layers: Record<string, WinterLayer>;
  districts: readonly { id: string; x: number; top: number; matches: number }[] | null;
  train: { speedPtPerS: number; y: number; sizePt: readonly [number, number]; metroLayerWidthPt: number } | null;
  winter: {
    flakes: readonly { x: number; y: number; z: number; phase: number; big: boolean }[];
    fogs: readonly { index: number; y: number; x: number; w: number; h: number; v: number; a: number; band: number | null }[];
    snowman: { x: number; y: number; scale: number; box: { x0: number; y0: number; w: number; h: number } };
  };
};

export function WinterCityScene({ name, active, testID, mood: _mood, focused = true }: { name: Surface; active: boolean; testID: string; mood?: SceneMood; focused?: boolean }) {
  const spec = winterSceneSpec[name] as unknown as WinterData;
  const reduceMotion = useReducedMotion();
  const camera = useSharedValue(0);
  const clock = useSharedValue(0);
  const trainDistance = useSharedValue(0);
  const transition = useCityWorldTransition();
  const sharedTrainDistance = name === 'preview' ? transition.trainDistance : null;
  const trainMotion = sharedTrainDistance ?? trainDistance;
  const snowAmount = useSharedValue(1);
  const [size, setSize] = useState({ width: spec.artboardPt[0], height: spec.artboardPt[1] });
  const snowIntroStarted = useRef(false);
  const scale = size.width > 0 && size.height > 0 ? Math.max(size.width / spec.artboardPt[0], size.height / spec.artboardPt[1]) : 0;
  const artboardTop = size.height - spec.artboardPt[1] * scale;

  useEffect(() => {
    if (!active || !focused) return;
    if (reduceMotion) { snowIntroStarted.current = true; snowAmount.value = 1; return; }
    if (!snowIntroStarted.current) { snowIntroStarted.current = true; snowAmount.value = 0; snowAmount.value = withTiming(1, { duration: 1400, easing: Easing.linear }); }
  }, [active, focused, reduceMotion, snowAmount]);

  useEffect(() => {
    cancelAnimation(camera); cancelAnimation(clock);
    if (!sharedTrainDistance) cancelAnimation(trainDistance);
    if (!active || (!focused && !transition.active) || reduceMotion) { camera.value = 0; clock.value = 0; return; }
    const tripMs = spec.maxCameraPt / spec.cameraSpeedPtPerS * 1000;
    camera.value = withRepeat(withTiming(spec.maxCameraPt, { duration: tripMs, easing: Easing.linear }), -1, true);
    clock.value = withRepeat(withTiming(10 * Math.PI, { duration: 31_416, easing: Easing.linear }), -1, false);
    if (name === 'preview' && spec.train) {
      const travel = spec.train.metroLayerWidthPt + 200;
      trainMotion.value = withRepeat(withTiming(travel, { duration: (travel - trainMotion.value) / spec.train.speedPtPerS * 1000, easing: Easing.linear }), -1, false);
    }
    return () => { cancelAnimation(camera); cancelAnimation(clock); if (!sharedTrainDistance) cancelAnimation(trainDistance); };
  }, [active, camera, clock, focused, name, reduceMotion, spec, trainDistance, trainMotion, sharedTrainDistance, transition.active]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) => current.width === width && current.height === height ? current : { width, height });
  };
  const layers: { key: string; z: number; node: ReactNode }[] = [];
  for (const [key, layer] of Object.entries(spec.layers)) {
    if (['fog', 'flake_big', 'snowman_body', 'snowman_head', 'snowman_front', 'snowman_arm', 'beam_column', 'beam_halo', 'train', 'metro'].includes(key)) continue;
    layers.push({ key, z: layer.zIndex, node: <WinterImage key={key} id={`${testID}-layer-${key.replaceAll('_', '-')}`} layer={layer} camera={camera} scale={scale} height={spec.artboardPt[1]} width={spec.artboardPt[0]} moon={spec.moon} snowAmount={['farCaps', 'midCaps', 'frost'].includes(key) ? snowAmount : undefined} /> });
  }
  layers.push({ key: 'stars', z: 1, node: <View key="stars" pointerEvents="none" style={StyleSheet.absoluteFill}>{spec.stars.map((star, index) => <WinterStar key={index} id={`${testID}-star-${index}`} star={star} clock={clock} camera={camera} scale={scale} width={spec.artboardPt[0]} height={spec.artboardPt[1]} />)}</View> });

  for (const fog of spec.winter.fogs.filter((item) => item.band !== null && item.index !== 2)) {
    const alpha = fog.band === 0 ? 0.1 : 0.12;
    layers.push({ key: `fog-${fog.index}`, z: fog.band === 0 ? 4.5 : 7.5, node: <WinterFog key={`fog-${fog.index}`} id={`${testID}-fog-${fog.index}`} fog={fog} alpha={alpha} clock={clock} width={spec.artboardPt[0]} scale={scale} source={spec.layers.fog.source} /> });
  }

  for (const part of ['body', 'head', 'front', 'arm'] as const) {
    const layer = spec.layers[`snowman_${part}`];
    const order = { body: 16, head: 17, front: 18, arm: 19 }[part];
    layers.push({ key: `snowman-${part}`, z: order, node: <SnowmanPart key={part} id={`${testID}-layer-snowman-${part}`} source={layer.source} layer={layer} snowman={spec.winter.snowman} scale={scale} snowAmount={snowAmount} clock={clock} part={part} /> });
  }

  if (spec.districts) {
    const beamColumn = spec.layers.beam_column;
    const beamHalo = spec.layers.beam_halo;
    for (const district of spec.districts) {
      const x = district.x * spec.layers.mid.sizePt![0];
      const intensity = 0.12 + Math.min(2, district.matches) * 0.36;
      layers.push({ key: `beam-column-${district.id}`, z: beamColumn.zIndex, node: <WinterBeam key={`beam-${district.id}`} id={`${testID}-layer-beam-column-${district.id}`} layer={beamColumn} camera={camera} scale={scale} x={x - 6} y={0} width={12} height={Math.max(0, district.top - 4)} opacity={0.3 * intensity} /> });
      layers.push({ key: `beam-halo-${district.id}`, z: beamHalo.zIndex, node: <WinterBeam key={`halo-${district.id}`} id={`${testID}-layer-beam-halo-${district.id}`} layer={beamHalo} camera={camera} scale={scale} x={x - 22} y={district.top - 26} width={44} height={44} opacity={0.7 * intensity} /> });
    }
    const metro = spec.layers.metro;
    layers.push({ key: 'metro', z: metro.zIndex, node: <WinterImage key="metro" id={`${testID}-layer-metro`} layer={metro} camera={camera} scale={scale} width={spec.artboardPt[0]} height={spec.artboardPt[1]} moon={spec.moon} /> });
    const train = spec.layers.train;
    layers.push({ key: 'train', z: train.zIndex, node: <WinterTrain key="train" id={`${testID}-layer-train`} source={train.source} distance={trainMotion} camera={camera} scale={scale} y={spec.train?.y ?? 0} size={spec.train?.sizePt ?? [0, 0]} zIndex={train.zIndex} /> });
  }

  layers.push({ key: 'snowfall', z: 20, node: <View key="snowfall" testID={`${testID}-snowfall`} pointerEvents="none" style={StyleSheet.absoluteFill}>{spec.winter.flakes.map((flake, index) => <WinterFlake key={index} id={`${testID}-flake-${index}`} flake={flake} clock={clock} scale={scale} height={spec.artboardPt[1]} source={spec.layers.flake_big.source} snowAmount={snowAmount} />)}</View> });

  return <View testID={testID} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" onLayout={onLayout} style={StyleSheet.absoluteFill}>{scale > 0 ? <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: artboardTop, width: spec.artboardPt[0] * scale, height: spec.artboardPt[1] * scale, overflow: 'hidden' }}>{layers.sort((a, b) => a.z - b.z).map(({ key, node }) => <Fragment key={key}>{node}</Fragment>)}</View> : null}</View>;
}

function WinterImage({ id, layer, camera, scale, width, height, moon, snowAmount }: { id: string; layer: WinterLayer; camera: SharedValue<number>; scale: number; width: number; height: number; moon: WinterData['moon']; snowAmount?: SharedValue<number> }) {
  const isFill = ['sky', 'frost', 'shade'].some((name) => id.endsWith(name));
  let layerWidth = isFill ? width : layer.sizePt?.[0] ?? 0;
  let layerHeight = isFill ? height : layer.sizePt?.[1] ?? 0;
  let left = 0; let top = layer.offsetYPt ?? 0; let parallax = layer.parallax ?? 0;
  if (id.endsWith('moon_glow')) { left = moon.x - moon.glowR; top = moon.y - moon.glowR; layerWidth = moon.glowR * 2; layerHeight = moon.glowR * 2; parallax = moon.parallax; }
  if (id.endsWith('moon')) { left = moon.x - layerWidth / 2; top = moon.y - layerHeight / 2; parallax = moon.parallax; }
  const animatedStyle = useAnimatedStyle(() => ({ opacity: snowAmount ? snowAmount.value : 1, transform: [{ translateX: -camera.value * parallax * scale }] }));
  return <Animated.View testID={id} style={[{ position: 'absolute', left: left * scale, top: top * scale, width: layerWidth * scale, height: layerHeight * scale, zIndex: layer.zIndex }, animatedStyle]}><Image source={layer.source} contentFit="fill" style={StyleSheet.absoluteFill} accessible={false} /></Animated.View>;
}

function WinterStar({ id, star, clock, camera, scale, width, height }: { id: string; star: { x: number; y: number; size: number; phase: number }; clock: SharedValue<number>; camera: SharedValue<number>; scale: number; width: number; height: number }) {
  const style = useAnimatedStyle(() => { const world = width * 1.3; const raw = star.x * world - camera.value * 0.04; const x = (((raw % world) + world) % world) - width * 0.15; const pulse = 0.55 * 0.8 * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock.value * 1.6 + star.phase))); return { opacity: pulse, transform: [{ translateX: x * scale }] }; });
  return <Animated.View testID={id} pointerEvents="none" style={[{ position: 'absolute', left: 0, top: star.y * height * scale, width: star.size * scale, height: star.size * scale, backgroundColor: '#FFF' }, style]} />;
}

function WinterFog({ id, fog, alpha, clock, width, scale, source }: { id: string; fog: WinterData['winter']['fogs'][number]; alpha: number; clock: SharedValue<number>; width: number; scale: number; source: number }) {
  return <View testID={id} pointerEvents="none" style={StyleSheet.absoluteFill}>{[-1, 0].map((copy) => <FogCopy key={copy} fog={fog} alpha={alpha} clock={clock} width={width} scale={scale} source={source} copy={copy} />)}</View>;
}

function FogCopy({ fog, alpha, clock, width, scale, source, copy }: { fog: WinterData['winter']['fogs'][number]; alpha: number; clock: SharedValue<number>; width: number; scale: number; source: number; copy: number }) {
  const style = useAnimatedStyle(() => { const travel = clock.value * fog.v * 0.96; const x = ((fog.x + travel + width * 2) % (width * 2)) + copy * width * 2 - width * 0.3; return { opacity: fog.a * alpha, transform: [{ translateX: x * scale }] }; });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: (fog.y - fog.h) * scale, width: fog.w * scale, height: 2 * fog.h * scale }, style]}><Image source={source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>;
}

function SnowmanPart({ id, source, layer, snowman, scale, snowAmount, clock, part }: { id: string; source: number; layer: WinterLayer; snowman: WinterData['winter']['snowman']; scale: number; snowAmount: SharedValue<number>; clock: SharedValue<number>; part: 'body' | 'head' | 'front' | 'arm' }) {
  const style = useAnimatedStyle(() => ({ opacity: snowAmount.value, transform: [{ rotate: part === 'head' ? `${Math.sin(clock.value * 1.3) * 0.06}rad` : part === 'arm' ? `${Math.sin(clock.value * 2.4) * 0.5}rad` : `${Math.sin(clock.value * 1.3) * 0.3}rad` }] }));
  const x = (snowman.x + snowman.box.x0 * snowman.scale) * scale;
  const y = (snowman.y + snowman.box.y0 * snowman.scale) * scale;
  return <Animated.View testID={id} pointerEvents="none" style={[{ position: 'absolute', left: x, top: y, width: snowman.box.w * snowman.scale * scale, height: snowman.box.h * snowman.scale * scale, zIndex: layer.zIndex }, style]}><Image source={source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>;
}

function WinterFlake({ id, flake, clock, scale, height, source, snowAmount }: { id: string; flake: WinterData['winter']['flakes'][number]; clock: SharedValue<number>; scale: number; height: number; source: number; snowAmount: SharedValue<number> }) {
  const style = useAnimatedStyle(() => { const speed = 14 + 34 * flake.z; const y = ((flake.y + clock.value * speed) % height + height) % height; const x = flake.x + Math.sin(clock.value * 0.8 + flake.phase) * 8 * flake.z; return { opacity: (0.35 + 0.55 * flake.z) * snowAmount.value, transform: [{ translateX: x * scale }, { translateY: (y - flake.y) * scale }, { rotate: `${flake.phase}rad` }] }; });
  return <Animated.View testID={id} pointerEvents="none" style={[{ position: 'absolute', left: 0, top: flake.y * scale, width: (flake.big ? 12 : 1.2 + 3 * flake.z) * scale, height: (flake.big ? 12 : 1.2 + 3 * flake.z) * scale }, style]}>{flake.big ? <Image source={source} contentFit="fill" style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { borderRadius: 20, backgroundColor: '#FFF' }]} />}</Animated.View>;
}

function WinterBeam({ id, layer, camera, scale, x, y, width, height, opacity }: { id: string; layer: WinterLayer; camera: SharedValue<number>; scale: number; x: number; y: number; width: number; height: number; opacity: number }) {
  const style = useAnimatedStyle(() => ({ opacity, transform: [{ translateX: -camera.value * (layer.parallax ?? 0) * scale }] }));
  return <Animated.View testID={id} pointerEvents="none" style={[{ position: 'absolute', left: x * scale, top: y * scale, width: width * scale, height: height * scale, zIndex: layer.zIndex }, style]}><Image source={layer.source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>;
}

function WinterTrain({ id, source, distance, camera, scale, y, size, zIndex }: { id: string; source: number; distance: SharedValue<number>; camera: SharedValue<number>; scale: number; y: number; size: readonly [number, number]; zIndex: number }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: (distance.value - 100 - camera.value * 0.8) * scale }] }));
  return <Animated.View testID={id} pointerEvents="none" style={[{ position: 'absolute', left: 0, top: y * scale, width: size[0] * scale, height: size[1] * scale, zIndex }, style]}><Image source={source} contentFit="fill" style={StyleSheet.absoluteFill} /></Animated.View>;
}
