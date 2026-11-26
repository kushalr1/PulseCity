import { sceneSetsV2, type SceneSetV2 } from './scene-assets-v2';

export type SceneSurface = 'hero' | 'preview' | 'full';
export type SceneMood = 'chill' | 'social' | 'nature' | 'active' | 'foodie' | 'explore';
export type SceneTheme = 'city' | 'winter';
export type SceneSelection = { surface: SceneSurface; mood: SceneMood; theme: SceneTheme };

export function resolveSceneSelection(surface: SceneSurface, mood: SceneMood, theme: SceneTheme): SceneSelection | null {
  return sceneSetsV2[`${surface}/${theme}/${mood}`] ? { surface, mood, theme } : null;
}

export function getSceneSet(surface: SceneSurface, theme: SceneTheme, mood: SceneMood): SceneSetV2 {
  const set = sceneSetsV2[`${surface}/${theme}/${mood}`];
  if (!set) throw new Error(`Missing ${surface} scene for ${theme}/${mood}`);
  return set;
}
