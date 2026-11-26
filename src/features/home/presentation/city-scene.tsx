import { Image } from 'expo-image';
import { Canvas, Group, Image as SkiaImage } from '@shopify/react-native-skia';
import { Fragment, memo, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { SceneLayer } from './city-scene-spec';
import { getSceneSet, type SceneMood, type SceneTheme } from '../scene-registry';
import { useCityWorldTransition } from '@/providers/city-world-transition-provider';
import { useCityWorldMood } from '@/providers/city-world-mood-provider';
import { getPredecodedSceneImage } from '../application/scene-preloader';
import { windowLightLayers } from '../window-light-assets';
import { getWindowLightUniforms, interpolateWindowPalette, type WindowPalette } from '../application/window-light-transition';
import { WindowLightsCanvas } from './window-lights-canvas';
import { useSceneTransitionProgressLog } from './use-scene-transition-progress-log';
import { SceneTransitionLayer } from './scene-transition-layer';

let lastLoggedWindowPaletteKey: string | undefined;
const loggedSceneDrawOrders = new Set<string>();

/* Reanimated SharedValue writes are intentional animation state. */
/* eslint react-hooks/immutability: off */

type CitySceneName = 'hero' | 'preview';

type CitySceneProps = {
  name: CitySceneName;
  active: boolean;
  testID: string;
  theme?: SceneTheme;
  mood?: SceneMood;
  focused?: boolean;
  windowBlend?: { from: WindowPalette; to: WindowPalette };
  windowProgress?: SharedValue<number>;
};

type SceneSize = { width: number; height: number };

function CitySceneImpl({ name, active, testID, theme = 'city', mood = 'chill', focused }: CitySceneProps) {
  const initialPalette = (getSceneSet(name, theme, mood).scene as any).palette as WindowPalette;
  const { progress: windowProgress, previousProgress, transitionFromMood } = useCityWorldMood();
  const [windowBlend, setWindowBlend] = useState(() => ({ from: initialPalette, to: initialPalette }));
  const windowBlendRef = useRef(windowBlend);
  const requested = useRef({ theme, mood });
  const surfaceTransitionActive = transitionFromMood !== null;
  const surfaceFromMood = surfaceTransitionActive ? transitionFromMood : mood;
  const surfaceProgress = windowProgress;
  const windowBlendKeys = { from: `${name}/${theme}/${surfaceFromMood}`, to: `${name}/${theme}/${mood}` };

  useEffect(() => {
    const next = { theme, mood };
    if (requested.current.theme === theme && requested.current.mood === mood) return;
    const previousBlend = windowBlendRef.current;
    const currentPalette = interpolateWindowPalette(previousBlend.from, previousBlend.to, previousProgress);
    const snapshot: WindowPalette = {
      lit: currentPalette.lit,
      win: currentPalette.win.map((channel) => channel * 255) as unknown as WindowPalette['win'],
      haze: currentPalette.haze.map((channel) => channel * 255) as unknown as WindowPalette['haze'],
      hazeAlpha: currentPalette.hazeAlpha,
    };
    const targetPalette = (getSceneSet(name, theme, mood).scene as any).palette as WindowPalette;
    const paletteKey = `${theme}/${mood}`;
    if (__DEV__ && lastLoggedWindowPaletteKey !== paletteKey) {
      lastLoggedWindowPaletteKey = paletteKey;
      console.info('[WindowLights] mood uniforms', {
        theme,
        mood,
        ...getWindowLightUniforms(interpolateWindowPalette(targetPalette, targetPalette, 1), 'mid'),
        hazeTopPt: windowLightLayers[name].mid.hazeTopPt ?? null,
      });
    }
    const nextBlend = { from: snapshot, to: targetPalette };
    windowBlendRef.current = nextBlend;
    setWindowBlend(nextBlend);
    requested.current = next;
  }, [mood, name, previousProgress, theme]);

  useSceneTransitionProgressLog(name, windowBlendKeys.from, windowBlendKeys.to, windowBlend.from, windowBlend.to, surfaceProgress);

  const fromRole = surfaceTransitionActive ? 'outgoing' : 'steady';
  const toRole = surfaceTransitionActive ? 'incoming' : 'steady';
  const fromOpacity = surfaceTransitionActive ? 1 : 0;
  const toOpacity = surfaceTransitionActive ? 0 : 1;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <SceneTransitionLayer progress={surfaceProgress} role={fromRole} initialOpacity={fromOpacity} applyOpacity={false} testID={`${testID}-from`}>
      {(sceneOpacity) => <CitySceneLayers name={name} active={active && surfaceTransitionActive} testID={`${testID}-from`} mood={surfaceFromMood} theme={theme} focused={focused ?? true} windowBlend={windowBlend} windowProgress={surfaceProgress} sceneOpacity={sceneOpacity} drawLights={false} animateEntrance={false} />}
    </SceneTransitionLayer>
    <SceneTransitionLayer progress={surfaceProgress} role={toRole} initialOpacity={toOpacity} applyOpacity={false} testID={`${testID}-to`}>
      {(sceneOpacity) => <CitySceneLayers name={name} active={active} testID={testID} mood={mood} theme={theme} focused={focused ?? true} windowBlend={windowBlend} windowProgress={surfaceProgress} sceneOpacity={sceneOpacity} animateEntrance />}
    </SceneTransitionLayer>
  </View>;
}

export const CityScene = memo(CitySceneImpl);

function CitySceneLayers({ name, active, testID, mood = 'chill', theme = 'city', focused, windowBlend, windowProgress, sceneOpacity, drawLights = true, animateEntrance = false }: CitySceneProps & { sceneOpacity: SharedValue<number>; drawLights?: boolean; animateEntrance?: boolean }) {
  const assetSet = getSceneSet(name, theme, mood);
  const scene = assetSet.scene as any;
  const layers = useMemo(() => Object.fromEntries(assetSet.assets.map((asset) => [asset.name, asset])), [assetSet]);
  const spec = useMemo(() => ({ artboardPt: assetSet.artboardPt, maxCameraPt: scene.maxCam, cameraSpeedPtPerS: 6, moon: scene.moon, stars: scene.stars, layers, districts: scene.districts, beamNormalBlendOpacityBoost: theme === 'winter' ? 1 : 1.5, train: scene.trainY === null ? null : { y: scene.trainY, sizePt: layers.train?.sizePt ?? [0, 0], metroLayerWidthPt: scene.layerWidths.metro ?? 0, speedPtPerS: 60 }, maxCam: scene.maxCam }), [assetSet, layers, scene, theme]);
  const sceneMoodGlowBoost = assetSet.glowBoost;
  const reduceMotion = useReducedMotion();
  const camera = useSharedValue(0);
  const clock = useSharedValue(0);
  const entrance = useSharedValue(0);
  const trainDistance = useSharedValue(0);
  const transition = useCityWorldTransition();
  const sharedTrainDistance = name === 'preview' ? transition.trainDistance : null;
  const trainMotion = sharedTrainDistance ?? trainDistance;
  const [size, setSize] = useState<SceneSize>(() => ({ width: spec.artboardPt[0], height: spec.artboardPt[1] }));
  const isHero = name === 'hero';
  const previewTravelDistance = (scene.layerWidths.metro ?? 0) + 200;
  const artboardWidth = spec.artboardPt[0];
  const artboardHeight = spec.artboardPt[1];
  const scale = size.width > 0 && size.height > 0
    ? Math.max(size.width / artboardWidth, size.height / artboardHeight)
    : 0;
  const artboardTop = size.height - artboardHeight * scale;
  const overlayOpacityStyle = useAnimatedStyle(() => ({ opacity: sceneOpacity.value }));
  const sceneImageKeys = new Set(['sky', 'moon_glow', 'moon', 'ridge', 'far', 'mid', 'near', 'vignette', 'shade', 'metro', 'frost']);
  const maxCameraPt = spec.maxCameraPt;
  const cameraSpeedPtPerS = spec.cameraSpeedPtPerS;

  useEffect(() => {
    cancelAnimation(camera);
    cancelAnimation(clock);
    if (!sharedTrainDistance) cancelAnimation(trainDistance);

    if (!active || (!focused && !transition.active) || reduceMotion) {
      camera.value = 0;
      clock.value = 0;
      if (!sharedTrainDistance) trainDistance.value = 0;
      if (reduceMotion || !animateEntrance) entrance.value = 1;
      return;
    }

    camera.value = withRepeat(
      withTiming(maxCameraPt, {
        duration: (maxCameraPt / cameraSpeedPtPerS) * 1000,
        easing: Easing.linear,
      }),
      -1,
      true,
    );
    // 10π seconds returns both the star twinkle and beam pulse to their starting phase.
    clock.value = withRepeat(withTiming(10 * Math.PI, { duration: 31_416, easing: Easing.linear }), -1, false);

    if (name === 'hero' && animateEntrance) {
      if (entrance.value < 1) {
        entrance.value = withTiming(1, { duration: 1800, easing: Easing.linear });
      }
    } else if (name === 'preview') {
      trainMotion.value = withRepeat(
        withTiming(previewTravelDistance, {
          duration: ((previewTravelDistance - trainMotion.value) / 60) * 1000,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    }

    return () => {
      cancelAnimation(camera);
      cancelAnimation(clock);
      if (!sharedTrainDistance) cancelAnimation(trainDistance);
    };
  }, [active, animateEntrance, camera, cameraSpeedPtPerS, clock, entrance, focused, isHero, maxCameraPt, name, reduceMotion, trainDistance, trainMotion, sharedTrainDistance, transition.active, previewTravelDistance]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) => current.width === width && current.height === height ? current : { width, height });
  };

  const children: { zIndex: number; key: string; element: React.ReactNode }[] = [];
  for (const [layerName, layer] of Object.entries(spec.layers) as [string, SceneLayer][]) {
    if (['beam_column', 'beam_halo', 'train', 'metro', 'fog', 'flake_big', 'snowman_body', 'snowman_head', 'snowman_front_red', 'snowman_front_blue', 'snowman_arm', 'farCaps', 'midCaps'].includes(layerName)) continue;
    children.push({
      zIndex: layer.zIndex,
      key: layerName,
      element: (
        <SceneImageLayer
          key={layerName}
          id={layerName}
          testID={`${testID}-layer-${layerName.replaceAll('_', '-')}`}
          layer={layer}
          camera={camera}
          entrance={isHero ? entrance : undefined}
          scale={scale}
          artboardWidth={artboardWidth}
          artboardHeight={artboardHeight}
          moon={spec.moon}
          sceneOpacity={sceneOpacity}
        />
      ),
    });
  }

  const far = spec.layers.far as SceneLayer;
  const mid = spec.layers.mid as SceneLayer;
  const farCaps = spec.layers.farCaps as SceneLayer | undefined;
  const midCaps = spec.layers.midCaps as SceneLayer | undefined;
  if (windowBlend && windowProgress && drawLights) {
    for (const [layerName, layer, cap] of [['far', far, farCaps], ['mid', mid, midCaps]] as const) {
      children.push({
        zIndex: layer.zIndex + 0.5,
        key: `window-lights-${layerName}`,
        element: <WindowLightsCanvas
          key={`window-lights-${layerName}`}
          surface={name}
          layer={layerName}
          width={artboardWidth * scale}
          height={artboardHeight * scale}
          scale={scale}
          camera={camera}
          from={windowBlend.from}
          to={windowBlend.to}
          progress={windowProgress}
          capSource={cap?.source}
          capY={cap?.offsetYPt ?? 0}
          capWidth={cap?.sizePt?.[0] ?? 0}
          capHeight={cap?.sizePt?.[1] ?? 0}
          entrance={isHero ? entrance : undefined}
          testID={`${testID}-window-lights-${layerName}`}
          zIndex={layer.zIndex + 0.5}
        />,
      });
    }
  }

  if (theme === 'winter') {
    const snowman = scene.snowman;
    const body = layers.snowman_body;
    if (snowman && body) {
      children.push({ zIndex: body.zIndex, key: 'winter-snowman', element: <WinterSnowman key="winter-snowman" scene={scene} layers={layers} scale={scale} camera={camera} clock={clock} testID={testID} /> });
    }
  }

  const stars = (
    <View key="stars" testID={`${testID}-layer-stars`} pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', zIndex: 1 }]}>
      {spec.stars.map((star: StarData, index: number) => (
        <TwinklingStar
          key={`${name}-star-${index}`}
          id={`${testID}-star-${index}`}
          star={star}
          camera={camera}
          clock={clock}
          scale={scale}
          artboardWidth={artboardWidth}
          artboardHeight={artboardHeight}
        />
      ))}
    </View>
  );
  children.push({ zIndex: 1, key: 'stars', element: stars });

  if (!isHero && 'districts' in spec) {
    const beamColumn = spec.layers.beam_column;
    const beamHalo = spec.layers.beam_halo;
    for (const district of spec.districts) {
      const x = district.x * spec.layers.mid.sizePt![0];
      const intensity = 0.12 + Math.min(2, district.matches) * 0.36;
      children.push({
        zIndex: beamColumn.zIndex,
        key: `beam-column-${district.id}`,
        element: (
          <BeamLayer
            key={`beam-column-${district.id}`}
            id={`${testID}-layer-beam-column-${district.id}`}
            source={beamColumn.source}
            camera={camera}
            clock={clock}
            x={x - 6}
            y={0}
            width={12}
            height={Math.max(0, district.top - 4)}
            scale={scale}
            parallax={spec.layers.mid.parallax ?? 0}
            zIndex={beamColumn.zIndex}
            opacity={0.42 * intensity * spec.beamNormalBlendOpacityBoost * sceneMoodGlowBoost}
            pulseX={district.x}
          />
        ),
      });
      children.push({
        zIndex: beamHalo.zIndex,
        key: `beam-halo-${district.id}`,
        element: (
          <BeamLayer
            key={`beam-halo-${district.id}`}
            id={`${testID}-layer-beam-halo-${district.id}`}
            camera={camera}
            clock={clock}
            x={x - 22}
            y={district.top - 26}
            width={44}
            height={44}
            scale={scale}
            parallax={spec.layers.mid.parallax ?? 0}
            zIndex={beamHalo.zIndex}
            opacity={0.7 * intensity * spec.beamNormalBlendOpacityBoost * sceneMoodGlowBoost}
            pulseX={district.x}
            pulse={false}
            source={beamHalo.source}
          />
        ),
      });
    }

    const metro = spec.layers.metro;
    children.push({
      zIndex: metro.zIndex,
      key: 'metro',
      element: (
        <SceneImageLayer
          key="metro"
          id="metro"
          testID={`${testID}-layer-metro`}
          layer={metro}
          camera={camera}
          scale={scale}
          artboardWidth={artboardWidth}
          artboardHeight={artboardHeight}
          moon={spec.moon}
          sceneOpacity={sceneOpacity}
        />
      ),
    });

    const train = spec.layers.train;
    children.push({
      zIndex: train.zIndex,
      key: 'train',
      element: (
        <TrainLayer
          id={`${testID}-layer-train`}
          source={train.source}
          camera={camera}
          distance={trainMotion}
          scale={scale}
          y={spec.train?.y ?? 0}
          width={spec.train?.sizePt[0] ?? 0}
          height={spec.train?.sizePt[1] ?? 0}
          zIndex={train.zIndex}
        />
      ),
    });
  }

  const drawOrder = [...children].sort((a, b) => a.zIndex - b.zIndex);
  if (__DEV__ && !loggedSceneDrawOrders.has(name)) {
    loggedSceneDrawOrders.add(name);
    console.info(`[SceneDrawOrder] ${name}`, drawOrder.flatMap(({ key, zIndex }) => {
      const baseName = key.replace(/^window-lights-/, '');
      const layer = spec.layers[baseName];
      const parallax = layer?.parallax ?? 0;
      const moon = spec.moon;
      const y = baseName === 'moon_glow' ? moon.y - moon.glowR : baseName === 'moon' ? moon.y - (layer?.sizePt?.[1] ?? 0) / 2 : layer?.offsetYPt ?? 0;
      const x = baseName === 'moon_glow'
        ? (moon.x - moon.glowR - camera.value * moon.parallax) * scale
        : baseName === 'moon'
          ? (moon.x - (layer?.sizePt?.[0] ?? 0) / 2 - camera.value * moon.parallax) * scale
          : -camera.value * parallax * scale;
      const opacity = baseName === 'mid' && entrance ? Math.min(1, 0.15 + entrance.value * 1.2) : 1;
      const row = { layer: key, zIndex, opacity, x, y: y * scale };
      if ((baseName === 'far' || baseName === 'mid') && theme === 'winter') {
        const caps = spec.layers[`${baseName}Caps`];
        if (caps) return [row, { layer: `${baseName}Caps`, zIndex: zIndex + 0.001, opacity: 1, x: -camera.value * (caps.parallax ?? parallax) * scale, y: (caps.offsetYPt ?? 0) * scale }];
      }
      return [row];
    }));
  }

  return (
    <View
      testID={testID}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={handleLayout}
      style={StyleSheet.absoluteFill}
    >
      {scale > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: artboardTop,
            width: artboardWidth * scale,
            height: artboardHeight * scale,
            overflow: 'hidden',
          }}
        >
          {drawOrder.map(({ key, element }) => (
            <Fragment key={key}>
              {sceneImageKeys.has(key) || key.startsWith('window-lights-')
                ? element
                : <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, overlayOpacityStyle]}>{element}</Animated.View>}
            </Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function WinterSnowman({ scene, layers, scale, camera, clock, testID }: { scene: any; layers: Record<string, any>; scale: number; camera: SharedValue<number>; clock: SharedValue<number>; testID: string }) {
  const snowman = scene.snowman;
  const parts = [
    ['body', layers.snowman_body], ['head', layers.snowman_head], ['front', layers.snowman_front], ['arm', layers.snowman_arm],
  ] as const;
  const x = (snowman.x + snowman.box.x0 * snowman.scale) * scale;
  const y = (snowman.y + snowman.box.y0 * snowman.scale) * scale;
  const width = snowman.box.w * snowman.scale * scale;
  const height = snowman.box.h * snowman.scale * scale;
  const root = useAnimatedStyle(() => ({ transform: [{ translateX: -camera.value * .6 * scale }, { rotate: `${.018 * Math.sin(1.3 * clock.value)}rad` }] }));
  return <Animated.View testID={`${testID}-layer-snowman-body`} pointerEvents="none" style={[{ position: 'absolute', left: x, top: y, width, height, zIndex: 16 }, root]}>
      {parts.map(([part, layer], index) => layer ? <Image key={part} source={layer.source} contentFit="fill" style={[StyleSheet.absoluteFill, { zIndex: index }]} /> : null)}
  </Animated.View>;
}

type SceneImageLayerProps = {
  id: string;
  testID: string;
  layer: SceneLayer;
  camera: SharedValue<number>;
  entrance?: SharedValue<number>;
  scale: number;
  artboardWidth: number;
  artboardHeight: number;
  moon: { x: number; y: number; glowR: number; parallax: number };
  sceneOpacity: SharedValue<number>;
  onLoad?: () => void;
};

function SceneImageLayer({
  id,
  testID,
  layer,
  camera,
  entrance,
  scale,
  artboardWidth,
  artboardHeight,
  moon,
  sceneOpacity,
  onLoad,
}: SceneImageLayerProps) {
  const isFill = id === 'sky' || id === 'vignette' || id === 'shade';
  let width = isFill ? artboardWidth : layer.sizePt?.[0] ?? 0;
  let height = isFill ? artboardHeight : layer.sizePt?.[1] ?? 0;
  let left = 0;
  let top = layer.offsetYPt ?? 0;
  let parallax = layer.parallax ?? 0;

  if (id === 'moon_glow') {
    left = moon.x - moon.glowR;
    top = moon.y - moon.glowR;
    width = moon.glowR * 2;
    height = moon.glowR * 2;
    parallax = moon.parallax;
  } else if (id === 'moon') {
    left = moon.x - width / 2;
    top = moon.y - height / 2;
    parallax = moon.parallax;
  }

  const loadedImage = getPredecodedSceneImage(layer.source);
  const entranceY = id === 'far' ? 20 : id === 'mid' ? 36 : 0;
  const animatedStyle = useAnimatedStyle(() => {
    const progress = entrance?.value ?? 1;
    const rise = 1 - (1 - progress) ** 3;
    const translateY = (1 - rise) * entranceY;
    const entranceOpacity = id === 'mid' && entrance ? Math.min(1, 0.15 + progress * 1.2) : 1;
    return {
      opacity: entranceOpacity * (loadedImage ? 1 : sceneOpacity.value),
      transform: [
        { translateX: -camera.value * parallax * scale },
        { translateY: translateY * scale },
      ],
    };
  });
  useEffect(() => { if (loadedImage) onLoad?.(); }, [loadedImage, onLoad]);

  const frame: ViewStyle = {
    position: 'absolute',
    left: left * scale,
    top: top * scale,
    width: width * scale,
    height: height * scale,
    zIndex: layer.zIndex,
  };

  return (
    <Animated.View testID={testID} style={[frame, animatedStyle]}>
      {loadedImage
        ? <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}><Group opacity={sceneOpacity}><SkiaImage image={loadedImage} x={0} y={0} width={width * scale} height={height * scale} fit="fill" /></Group></Canvas>
        : <Image source={layer.source} onLoad={onLoad} transition={0} cachePolicy="memory-disk" contentFit="fill" style={StyleSheet.absoluteFill} accessible={false} />}
    </Animated.View>
  );
}

type StarData = { x: number; y: number; size: number; phase: number };

function TwinklingStar({
  id,
  star,
  camera,
  clock,
  scale,
  artboardWidth,
  artboardHeight,
}: {
  id: string;
  star: StarData;
  camera: SharedValue<number>;
  clock: SharedValue<number>;
  scale: number;
  artboardWidth: number;
  artboardHeight: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const worldWidth = artboardWidth * 1.3;
    const rawX = star.x * worldWidth - camera.value * 0.04;
    const x = (((rawX % worldWidth) + worldWidth) % worldWidth) - artboardWidth * 0.15;
    const pulse = 0.8 * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock.value * 1.6 + star.phase)));
    return { opacity: pulse, transform: [{ translateX: x * scale }] };
  });

  return (
    <Animated.View
      testID={id}
      pointerEvents="none"
      style={[
        styles.star,
        { top: star.y * artboardHeight * scale, width: star.size * scale, height: star.size * scale },
        animatedStyle,
      ]}
    />
  );
}

function BeamLayer({
  id,
  source,
  camera,
  clock,
  x,
  y,
  width,
  height,
  scale,
  parallax,
  zIndex,
  opacity,
  pulseX,
  pulse = true,
  onLoad,
}: {
  id: string;
  source?: number;
  camera: SharedValue<number>;
  clock: SharedValue<number>;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  parallax: number;
  zIndex: number;
  opacity: number;
  pulseX: number;
  pulse?: boolean;
  onLoad?: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, opacity * (pulse ? 0.85 + 0.15 * Math.sin(clock.value * 3 + pulseX * 9) : 1)),
    transform: [{ translateX: -camera.value * parallax * scale }],
  }));

  return (
    <Animated.View
      testID={id}
      pointerEvents="none"
      style={[styles.imageLayer, { left: x * scale, top: y * scale, width: width * scale, height: height * scale, zIndex }, animatedStyle]}
    >
      {source ? <Image source={source} onLoad={onLoad} transition={0} cachePolicy="memory-disk" contentFit="fill" style={StyleSheet.absoluteFill} accessible={false} /> : null}
    </Animated.View>
  );
}

function TrainLayer({
  id,
  source,
  camera,
  distance,
  scale,
  y,
  width,
  height,
  zIndex,
  onLoad,
}: {
  id: string;
  source: number;
  camera: SharedValue<number>;
  distance: SharedValue<number>;
  scale: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  onLoad?: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (distance.value - 100 - camera.value * 0.8) * scale }],
  }));

  return (
    <Animated.View
      testID={id}
      pointerEvents="none"
      style={[styles.imageLayer, { left: 0, top: y * scale, width: width * scale, height: height * scale, zIndex }, animatedStyle]}
    >
      <Image source={source} onLoad={onLoad} transition={0} cachePolicy="memory-disk" contentFit="fill" style={StyleSheet.absoluteFill} accessible={false} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  imageLayer: { position: 'absolute' },
  star: { position: 'absolute', left: 0, backgroundColor: '#FFFFFF' },
});
