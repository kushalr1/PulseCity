import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { Skia, type SkImage } from '@shopify/react-native-skia';

import { sceneSetsV2, type SceneThemeV2 } from '../scene-assets-v2';
import { getFullSceneAssets } from '@/features/city-world/application/city-world-logic';
import type { PlaceMood } from '@/features/places/domain/place';
import { windowLightLayers } from '../window-light-assets';

const requests = new Map<string, Promise<boolean>>();
const decodedSceneImages = new Map<number, SkImage>();

export function getPredecodedSceneImage(source: number) {
  return decodedSceneImages.get(source);
}

export function preloadSceneSources(sources: readonly number[]) {
  const unique = [...new Set(sources)];
  const key = unique.join(',');
  const existing = requests.get(key);
  if (existing) return existing;

  const request = Asset.loadAsync(unique)
    .then(async (assets) => {
      const uris = assets.map((asset) => asset.localUri ?? asset.uri).filter(Boolean);
      const decoded = await Promise.all(assets.map(async (asset, index) => {
        const uri = asset.localUri ?? asset.uri;
        if (!uri) return false;
        try {
          const data = await Skia.Data.fromURI(uri);
          const image = Skia.Image.MakeImageFromEncoded(data);
          if (!image) return false;
          decodedSceneImages.set(unique[index], image);
          return true;
        } catch {
          return false;
        }
      }));
      const prefetched = uris.length === 0 || typeof Image.prefetch !== 'function' || await Image.prefetch(uris, { cachePolicy: 'memory-disk' });
      if (!decoded.every(Boolean)) console.warn('Some scene images could not be decoded ahead of display; using the image loader fallback.');
      return prefetched || decoded.every(Boolean);
    })
    .catch((error) => {
      requests.delete(key);
      console.warn('Scene preload failed; the scene will load on demand.', error);
      return false;
    });

  requests.set(key, request);
  return request;
}

export function preloadHomeMoodSets(theme: SceneThemeV2) {
  const moodSetSources = Object.values(sceneSetsV2)
    .filter((set) => (set.surface === 'hero' || set.surface === 'preview') && set.theme === theme)
    .flatMap((set) => set.assets.map((asset) => asset.source));
  const lightSources = ['hero', 'preview'].flatMap((surface) => [
    windowLightLayers[surface as 'hero' | 'preview'].far.thresholdSource,
    windowLightLayers[surface as 'hero' | 'preview'].far.coverageSource,
    windowLightLayers[surface as 'hero' | 'preview'].mid.thresholdSource,
    windowLightLayers[surface as 'hero' | 'preview'].mid.coverageSource,
  ]);
  return preloadSceneSources([...moodSetSources, ...lightSources]);
}

export function preloadFullMoodSet(theme: SceneThemeV2, mood: PlaceMood) {
  const set = getFullSceneAssets(theme, mood);
  return preloadSceneSources([
    ...set.assets.map((asset) => asset.source),
    windowLightLayers.full.far.thresholdSource,
    windowLightLayers.full.far.coverageSource,
    windowLightLayers.full.mid.thresholdSource,
    windowLightLayers.full.mid.coverageSource,
  ]);
}

export function fullMoodSetSources(theme: SceneThemeV2) {
  const moodSources = Object.values(sceneSetsV2)
    .filter((set) => set.surface === 'full' && set.theme === theme)
    .flatMap((set) => set.assets.map((asset) => asset.source));
  const fullLights = [
    windowLightLayers.full.far.thresholdSource,
    windowLightLayers.full.far.coverageSource,
    windowLightLayers.full.mid.thresholdSource,
    windowLightLayers.full.mid.coverageSource,
  ];
  return [...moodSources, ...fullLights];
}

export async function preloadFullMoodSets(theme: SceneThemeV2) {
  const sources = fullMoodSetSources(theme);
  await preloadSceneSources(sources);
  return sources.every((source) => decodedSceneImages.has(source));
}
