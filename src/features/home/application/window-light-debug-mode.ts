export type LightsDebugMode = 'raw' | 'red' | 'mask' | 'ramp' | 'all';
export type LightsDebugSurface = 'hero' | 'preview' | 'full';
export type LightsDebugLayer = 'far' | 'mid';

export function resolveLightsDebugMode(testFlag: string | undefined, forceAllWindows: boolean): LightsDebugMode | undefined {
  'worklet';
  if (testFlag === 'raw' || testFlag === 'red' || testFlag === 'mask' || testFlag === 'ramp') return testFlag;
  return forceAllWindows ? 'all' : undefined;
}

export function getLightsDebugBadgeLabel(mode: LightsDebugMode): string {
  return `LIGHTS DEBUG: ${mode}`;
}

export function isLightsDebugTarget(
  mode: LightsDebugMode,
  surface: LightsDebugSurface,
  layer: LightsDebugLayer,
): boolean {
  return mode === 'all' || (surface === 'preview' && layer === 'mid');
}
