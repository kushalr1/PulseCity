import { router } from 'expo-router';
import { useCallback } from 'react';

import HomeScreen from '@/features/home/presentation/home-screen';

export default function HomeRoute() {
  const onSavedPress = useCallback(() => router.push('/saved'), []);
  const onExplorePress = useCallback((category?: string) => router.push({ pathname: '/explore', params: category !== undefined ? { category, entry: Date.now().toString() } : { focus: '1', entry: Date.now().toString() } }), []);
  const onPlacePress = useCallback((id: string) => router.push({ pathname: '/place/[id]', params: { id } }), []);
  const onCityWorldPress = useCallback(() => router.push('/city-world'), []);
  const onSurprisePress = useCallback(() => router.push({ pathname: '/city-world', params: { launch: 'surprise' } }), []);
  return (
    <HomeScreen
      onSavedPress={onSavedPress}
      onExplorePress={onExplorePress}
      onPlacePress={onPlacePress}
      onCityWorldPress={onCityWorldPress}
      onSurprisePress={onSurprisePress}
    />
  );
}
