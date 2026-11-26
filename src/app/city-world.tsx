import { useLocalSearchParams } from 'expo-router';
import CityWorldScreen from '@/features/city-world/presentation/city-world-screen';

export default function CityWorldRoute() {
  const { launch } = useLocalSearchParams<{ launch?: string }>();
  return <CityWorldScreen launchSurprise={launch === 'surprise'} />;
}
