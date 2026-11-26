import { router } from 'expo-router';

import ExploreScreen from '@/features/places/presentation/explore-screen';

export default function ExploreRoute() {
  return <ExploreScreen
    onPlacePress={(id) => router.push({ pathname: '/place/[id]', params: { id } })}
    onEventsPress={(query) => router.push({ pathname: '/events', params: { query } })}
  />;
}
