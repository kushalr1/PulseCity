import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const readSource = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('tab layout registers exactly five visible app sections', async () => {
  const layout = await readSource('src/app/(tabs)/_layout.tsx');
  const visibleTabs = ['index', 'explore', 'map', 'events', 'profile'];

  for (const route of visibleTabs) {
    assert.match(layout, new RegExp(`<Tabs\\.Screen name="${route}"`));
  }

  assert.doesNotMatch(layout, /<Tabs\.Screen name="saved"/);
  assert.match(layout, /designTokens\.color\.teal/);
  assert.match(layout, /designTokens\.color\.surface/);
  assert.match(layout, /index: 'Home tab'/);
  assert.match(layout, /tabBarAccessibilityLabel: tabLabels\[route\.name as TabRouteName\]/);
});

test('Home exposes Saved navigation and Saved remains a root route', async () => {
  const home = await readSource('src/app/(tabs)/index.tsx');
  const homeScreen = await readSource('src/features/home/presentation/home-screen.tsx');
  const savedRoute = await readSource('src/app/saved.tsx');
  const rootLayout = await readSource('src/app/_layout.tsx');

  assert.match(homeScreen, /accessibilityLabel="Saved places"/);
  assert.match(home, /onSavedPress=\{\(\) => router\.push\('\/saved'\)\}/);
  assert.match(savedRoute, /features\/places\/presentation\/saved-screen/);
  assert.match(rootLayout, /Stack\.Screen name="saved"/);
  await assert.rejects(readSource('src/app/(tabs)/saved.tsx'), { code: 'ENOENT' });
});

test('Map, Events, and Profile routes render labelled placeholders', async () => {
  for (const route of ['map', 'events', 'profile']) {
    const source = await readSource(`src/app/(tabs)/${route}.tsx`);
    assert.match(source, /FeaturePlaceholder/);
    assert.match(source, new RegExp(`title="${route[0].toUpperCase()}${route.slice(1)}"`));
  }

  const placeholder = await readSource('src/components/ui/feature-placeholder.tsx');
  assert.match(placeholder, /PLACEHOLDER/);
});

test('root navigation wraps gesture screens in GestureHandlerRootView', async () => {
  const rootLayout = await readSource('src/app/_layout.tsx');

  assert.match(rootLayout, /import \{ GestureHandlerRootView \} from 'react-native-gesture-handler'/);
  assert.match(rootLayout, /<GestureHandlerRootView[^>]*>\s*<AppBootstrapProvider>/);
  assert.match(rootLayout, /<\/AppBootstrapProvider>\s*<\/GestureHandlerRootView>/);
});

test('Home, Explore, and Place Details routes only compose their feature screens', async () => {
  const routes = [
    ['src/app/(tabs)/index.tsx', '@/features/home/presentation/home-screen'],
    ['src/app/(tabs)/explore.tsx', '@/features/places/presentation/explore-screen'],
    ['src/app/place/[id].tsx', '@/features/places/presentation/place-details-screen'],
  ];

  for (const [path, featureScreen] of routes) {
    const source = await readSource(path);
    assert.ok(source.includes(`from '${featureScreen}'`), `${path} composes ${featureScreen}`);
    assert.doesNotMatch(source, /from ['"]react-native['"]/);
    assert.doesNotMatch(source, /StyleSheet\.create\(/);
  }

  const detailsRoute = await readSource('src/app/place/[id].tsx');
  assert.match(detailsRoute, /useLocalSearchParams/);
  assert.match(detailsRoute, /<PlaceDetailsScreen\s+id=\{id\}/);

  const placeCard = await readSource('src/features/places/presentation/place-card.tsx');
  assert.match(placeCard, /export function PlaceCard/);
  assert.doesNotMatch(await readSource('src/components/ui/place-card.tsx').catch(() => ''), /export function PlaceCard/);
  for (const path of [
    'src/features/home/presentation/home-screen.tsx',
    'src/features/places/presentation/explore-screen.tsx',
    'src/features/places/presentation/place-details-screen.tsx',
    'src/features/places/presentation/saved-screen.tsx',
  ]) {
    assert.doesNotMatch(await readSource(path), /from ['"]expo-router['"]/);
  }
});

test('City World opening preview is mounted above the route stack', async () => {
  const rootLayout = await readSource('src/app/_layout.tsx');

  const overlay = await readSource('src/features/home/presentation/city-world-transition-overlay.tsx');
  assert.doesNotMatch(overlay, /<Modal/);
  const cityWorld = await readSource('src/features/city-world/presentation/city-world-screen.tsx');
  assert.match(cityWorld, /<\/GestureDetector>\s*<CityWorldTransitionOverlay\s*\/>/);
  const home = await readSource('src/features/home/presentation/home-screen.tsx');
  assert.match(home, /await preloadFullMoodSet\(theme, mood\)/);
  assert.match(home, /frame\.measureInWindow\(\(x, y, width, height\)/);
  assert.match(home, /setTimeout\(navigate, 120\)/);
});

test('Home header matches approved location and saved controls', async () => {
  const home = await readSource('src/features/home/presentation/home-screen.tsx');
  assert.match(home, /ios: 'mappin\.and\.ellipse'/);
  assert.doesNotMatch(home, /savedCountBadge/);
});
