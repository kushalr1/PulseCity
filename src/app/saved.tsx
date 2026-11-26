import { router } from 'expo-router';

import SavedScreen from '@/features/places/presentation/saved-screen';

export default function SavedRoute() {
  return (
    <SavedScreen
      onPlacePress={(id) => router.push({ pathname: '/place/[id]', params: { id } })}
      onExplorePress={() => router.push('/explore')}
    />
  );
}
