import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import type { Place } from '@/features/places/domain/place';
import { useAppBootstrap } from '@/providers/app-bootstrap-provider';
import { getPlaceIllustrationSource } from './place-illustration-assets';

const icons: Record<string, NonNullable<SymbolViewProps['name']>> = {
  park: { ios: 'tree.fill', android: 'park', web: 'park' },
  market: { ios: 'storefront.fill', android: 'storefront', web: 'storefront' },
  restaurant: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  mall: { ios: 'building.2.fill', android: 'local_mall', web: 'local_mall' },
  pharmacy: { ios: 'cross.case.fill', android: 'medical_services', web: 'medical_services' },
  grocery: { ios: 'basket.fill', android: 'shopping_basket', web: 'shopping_basket' },
  cafe: { ios: 'cup.and.saucer.fill', android: 'coffee', web: 'coffee' },
  salon: { ios: 'scissors', android: 'content_cut', web: 'content_cut' },
  repair: { ios: 'iphone.gen3', android: 'phone_android', web: 'phone_android' },
  gym: { ios: 'dumbbell.fill', android: 'fitness_center', web: 'fitness_center' },
  club: { ios: 'music.note', android: 'music_note', web: 'music_note' },
  workshop: { ios: 'hands.sparkles.fill', android: 'handyman', web: 'handyman' },
  music: { ios: 'music.note', android: 'music_note', web: 'music_note' },
  comedy: { ios: 'theatermasks.fill', android: 'theater_comedy', web: 'theater_comedy' },
};

export function PlaceIllustration({ place, compact = false, small = false, hero = false }: { place: Pick<Place, 'id' | 'name' | 'category' | 'illustration' | 'accent'>; compact?: boolean; small?: boolean; hero?: boolean }) {
  const { state } = useAppBootstrap();
  const source = getPlaceIllustrationSource(place.id, state?.theme === 'winter' ? 'winter' : 'city');
  const symbol = icons[place.illustration] ?? icons.market!;
  return (
    <View accessibilityLabel={`${place.category} illustration`} style={[styles.frame, hero && styles.hero, compact && styles.compact, small && styles.small, { backgroundColor: `${place.accent}24` }]}>
      {source ? (
        <Image source={source} contentFit="cover" contentPosition="center" pointerEvents="none" style={StyleSheet.absoluteFill} />
      ) : (
        <>
          <View style={[styles.glow, { backgroundColor: `${place.accent}18` }]} />
          <SymbolView name={symbol} tintColor={place.accent} size={small ? 28 : compact ? 35 : 68} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { minHeight: 174, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  hero: StyleSheet.absoluteFill,
  compact: { width: 82, minHeight: 82, borderRadius: 20 },
  small: { width: 52, height: 52, minHeight: 52, borderRadius: 12 },
  glow: { position: 'absolute', width: 150, height: 150, borderRadius: 100 },
});
