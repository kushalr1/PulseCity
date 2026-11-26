import { AlphaType, Canvas, ColorType, FilterMode, Group, Image as SkiaImage, ImageShader, MipmapMode, Rect, Shader, Skia, useImage } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { calibrationRampSource, windowLightLayers, type WindowLightSurface } from '../window-light-assets';
import { getWindowLightUniforms, interpolateWindowPalette, type WindowPalette } from '../application/window-light-transition';
import { isLightsDebugTarget, resolveLightsDebugMode } from '../application/window-light-debug-mode';
import { RAMP_CALIBRATION_SHADER, WINDOW_LIGHT_SHADER } from './window-light-shader';
import { calibrationRampRect, windowLightPlacement } from '../application/window-light-placement';
import { getPredecodedSceneImage } from '../application/scene-preloader';

const RED_TEST_SHADER = 'half4 main(float2 xy) { return half4(1, 0, 0, 1); }';
const MASK_TEST_SHADER = `
uniform shader thr;
uniform shader cov;
half4 main(float2 xy) {
  half4 d = cov.eval(xy);
  return half4(d.g, d.g, d.g, d.g);
}`;
const lightsTestMode = resolveLightsDebugMode(
  __DEV__ ? process.env.EXPO_PUBLIC_LIGHTS_TEST : undefined,
  __DEV__ && process.env.EXPO_PUBLIC_WINDOW_LIGHTS_DEBUG_ALL === '1',
);
let rampColumnsLogged = false;
const shaderSource = lightsTestMode === 'raw'
  ? undefined
  : lightsTestMode === 'red'
    ? RED_TEST_SHADER
    : lightsTestMode === 'mask'
      ? MASK_TEST_SHADER
      : WINDOW_LIGHT_SHADER;
const effect = shaderSource ? Skia.RuntimeEffect.Make(shaderSource) : null;
const rampEffect = lightsTestMode === 'ramp' ? Skia.RuntimeEffect.Make(RAMP_CALIBRATION_SHADER) : null;
if (shaderSource && !effect) {
  console.error(`[Lights Debug] SkSL compile failed for mode: ${lightsTestMode ?? 'normal'}. Check preceding Skia compiler log.`);
}

type Props = {
  surface: WindowLightSurface;
  layer: 'far' | 'mid';
  width: number;
  height: number;
  scale: number;
  camera: SharedValue<number>;
  from: WindowPalette;
  to: WindowPalette;
  progress: SharedValue<number>;
  capSource?: number;
  capY?: number;
  capWidth?: number;
  capHeight?: number;
  capOpacity?: SharedValue<number>;
  entrance?: SharedValue<number>;
  onLoad?: (asset: string) => void;
  testID?: string;
  zIndex?: number;
};

export function WindowLightsCanvas({
  surface,
  layer,
  width,
  height,
  scale,
  camera,
  from,
  to,
  progress,
  capSource,
  capY = 0,
  capWidth = 0,
  capHeight = 0,
  capOpacity,
  entrance,
  onLoad,
  testID,
  zIndex = 0,
}: Props) {
  const geometry = windowLightLayers[surface][layer];
  const loadedThresholdImage = useImage(geometry.thresholdSource);
  const loadedCoverageImage = useImage(geometry.coverageSource);
  const thresholdImage = getPredecodedSceneImage(geometry.thresholdSource) ?? loadedThresholdImage;
  const coverageImage = getPredecodedSceneImage(geometry.coverageSource) ?? loadedCoverageImage;
  const rampImage = useImage(calibrationRampSource);
  const capImage = useImage(capSource ?? null);
  const isTestMode = lightsTestMode === 'raw' || lightsTestMode === 'red' || lightsTestMode === 'mask' || lightsTestMode === 'ramp';
  const isDebugTarget = lightsTestMode ? isLightsDebugTarget(lightsTestMode, surface, layer) : false;
  const drawMode = isTestMode && !isDebugTarget ? undefined : lightsTestMode;
  const palette = useDerivedValue(() => interpolateWindowPalette(from, to, progress.value));
  const placement = useDerivedValue(() => windowLightPlacement(
    geometry,
    camera.value,
    scale,
    entrance?.value ?? 1,
    layer === 'far' ? 20 : 36,
  ));
  const scaleTransform = [{ scale }];
  const cameraTransform = useDerivedValue(() => [{ translateX: placement.value.translateX }]);
  const layerTransform = useDerivedValue(() => [{ translateY: placement.value.translateY }]);
  const entranceOpacity = useDerivedValue(() => {
    const value = entrance?.value ?? 1;
    return layer === 'mid' && entrance ? Math.min(1, 0.15 + value * 1.2) : 1;
  });
  const capAlpha = useDerivedValue(() => capOpacity?.value ?? 1);
  const uniforms = useDerivedValue(() => ({
    ...getWindowLightUniforms(palette.value, layer, drawMode === 'all'),
    hazeTopPt: geometry.hazeTopPt ?? 1e9,
  }));

  useEffect(() => {
    if (thresholdImage && coverageImage) onLoad?.(layer === 'far' ? 'window_far' : 'window_mid');
  }, [coverageImage, layer, onLoad, thresholdImage]);
  useEffect(() => {
    if (capImage && capSource !== undefined) onLoad?.(layer === 'far' ? 'farCaps' : 'midCaps');
  }, [capImage, capSource, layer, onLoad]);

  useEffect(() => {
    if (!__DEV__ || lightsTestMode !== 'ramp' || !rampImage || rampColumnsLogged) return;
    rampColumnsLogged = true;
    try {
      const samples = Array.from({ length: 16 }, (_, index) => {
        const x = 240 + index;
        const pixels = rampImage.readPixels(x, 0, { width: 1, height: 1, alphaType: AlphaType.Opaque, colorType: ColorType.Gray_8 });
        const sampled = Number(pixels?.[0]);
        const value = Number.isFinite(sampled) ? Math.floor(sampled + 0.5) : null;
        return { x, floorV: value };
      });
      console.info('[Lights Ramp] floor(v), x=240..255', samples);
      console.info('[Lights Ramp] red columns', samples.filter(({ x, floorV }) => floorV === null || floorV !== x).map(({ x }) => x));
    } catch (error) {
      console.warn('[Lights Ramp] pixel readback failed', error);
    }
  }, [rampImage]);

  const canDraw = isTestMode && !isDebugTarget
    ? false
    : drawMode === 'red'
      ? Boolean(effect)
      : drawMode === 'ramp'
        ? Boolean(rampImage && rampEffect)
        : Boolean(thresholdImage && coverageImage && (drawMode === 'raw' || effect));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width, height, zIndex }]}>
      {canDraw ? (
        <Canvas testID={testID} pointerEvents="none" style={[StyleSheet.absoluteFill, { width, height }]}>
          <Group transform={scaleTransform}>
            <Group transform={cameraTransform}>
              <Group transform={layerTransform} opacity={entranceOpacity}>
                {drawMode === 'red' ? (
                  <Rect x={0} y={0} width={placement.value.rect.width} height={placement.value.rect.height}>
                    <Shader source={effect!} uniforms={{}} />
                  </Rect>
                ) : drawMode === 'raw' ? (
                  <SkiaImage image={coverageImage!} x={0} y={0} width={geometry.sizePt[0]} height={geometry.sizePt[1]} fit="fill" />
                ) : drawMode === 'ramp' ? (
                    <Rect x={calibrationRampRect.x} y={calibrationRampRect.y} width={calibrationRampRect.width} height={calibrationRampRect.height}>
                    <Shader source={rampEffect!} uniforms={{}}>
                        <ImageShader image={rampImage!} fit="fill" rect={calibrationRampRect} sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }} tx="clamp" ty="clamp" />
                    </Shader>
                  </Rect>
                ) : (
                  <Rect x={0} y={0} width={placement.value.rect.width} height={placement.value.rect.height}>
                    <Shader
                      source={effect!}
                      uniforms={drawMode === 'mask' ? {} : uniforms}
                    >
                      <ImageShader image={thresholdImage!} fit="fill" rect={placement.value.rect} sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }} tx="decal" ty="decal" />
                      <ImageShader image={coverageImage!} fit="fill" rect={placement.value.rect} sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }} tx="decal" ty="decal" />
                    </Shader>
                  </Rect>
                )}
                {drawMode === undefined || drawMode === 'all'
                  ? capImage && capSource !== undefined
                    ? <SkiaImage image={capImage} x={0} y={capY} width={capWidth} height={capHeight} opacity={capAlpha} fit="fill" />
                    : null
                  : null}
              </Group>
            </Group>
          </Group>
        </Canvas>
      ) : null}
    </View>
  );
}
