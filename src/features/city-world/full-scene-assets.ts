import { sceneSetsV2 } from '@/features/home/scene-assets-v2';

export type FullSceneAsset = { name: string; source: number; zIndex: number; sizePt: readonly [number, number]; offsetYPt?: number; parallax?: number; opacity?: number; role: string };
export type FullSceneSet = { key: string; theme: 'city' | 'winter'; mood: string; glowBoost: number; artboardPt: readonly [number, number]; assets: FullSceneAsset[]; scene: any };

export const fullSceneSets: Record<string, FullSceneSet> = Object.fromEntries(
  Object.entries(sceneSetsV2)
    .filter(([key]) => key.startsWith('full/'))
    .map(([key, set]) => [key, set as FullSceneSet]),
);
