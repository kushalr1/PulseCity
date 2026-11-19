import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { colors } from '@/constants/theme';
import type { Place } from '@/features/places/domain/place';
import { usePlaces } from '@/providers/places-provider';
import { SaveButton } from './save-button';

export function PlaceCard({ place, onPress, horizontal = false }: { place: Place; onPress: () => void; horizontal?: boolean }) {
  const { isSaved, toggleSaved } = usePlaces();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, horizontal && styles.horizontalCard, pressed && styles.pressed]}>
      <View style={[styles.imageFrame, horizontal && styles.horizontalImage]}>
        <Image source={place.imageUrl} contentFit="cover" transition={250} style={StyleSheet.absoluteFill} accessibilityLabel={`${place.name}, ${place.category}`} />
        <View style={styles.categoryPill}><Text style={styles.categoryText}>{place.category.toUpperCase()}</Text></View>
        <View style={styles.save}><SaveButton saved={isSaved(place.id)} onPress={() => toggleSaved(place.id)} /></View>
      </View>
      <View style={styles.info}>
        <View style={styles.titleLine}><Text style={styles.name} numberOfLines={1}>{place.name}</Text><View style={styles.rating}><SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor={colors.amber} size={12} /><Text style={styles.ratingText}>{place.rating}</Text></View></View>
        <Text style={styles.tagline} numberOfLines={1}>{place.tagline}</Text>
        <View style={styles.metaLine}><Text style={styles.meta}>{place.neighborhood} · {place.city}</Text><Text style={styles.meta}>{place.priceLabel}</Text></View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 278, backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  horizontalCard: { width: '100%', flexDirection: 'row', alignItems: 'center', minHeight: 126 },
  imageFrame: { height: 174, position: 'relative', backgroundColor: colors.surfaceRaised },
  horizontalImage: { width: 112, height: 126, flexShrink: 0 },
  categoryPill: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(16,16,32,0.78)', paddingVertical: 6, paddingHorizontal: 9, borderRadius: 14 },
  categoryText: { color: colors.text, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  save: { position: 'absolute', top: 9, right: 9 },
  info: { paddingHorizontal: 16, paddingVertical: 14, flex: 1, gap: 7 },
  titleLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  tagline: { color: colors.textMuted, fontSize: 12 },
  metaLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, gap: 8 },
  meta: { color: colors.textMuted, fontSize: 10, fontWeight: '500' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
