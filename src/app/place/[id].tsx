import { router, useLocalSearchParams } from 'expo-router';

import PlaceDetailsScreen from '@/features/places/presentation/place-details-screen';

export default function PlaceDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PlaceDetailsScreen
      id={id}
      onBack={() => router.canGoBack() ? router.back() : router.replace('/')}
      onHome={() => router.replace('/')}
    />
  );
}
