import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';

import { colors } from '@/constants/theme';
import type { Place } from '@/features/places/domain/place';
import { usePlaces } from '@/providers/places-provider';
import { SaveButton } from '@/components/ui/save-button';
import { PlaceIllustration } from './place-illustration';

export function PlaceCard({ place, onPress, horizontal = false }: { place: Place; onPress: () => void; horizontal?: boolean }) {
  const { isSaved, toggleSaved } = usePlaces();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, horizontal && styles.horizontalCard, pressed && styles.pressed]}>
      <View style={[styles.imageFrame, horizontal && styles.horizontalImage]}>
        <PlaceIllustration place={place} />
        <View style={styles.categoryPill}><AppText style={styles.categoryText}>{place.category.toUpperCase()}</AppText></View>
        <View style={styles.save}><SaveButton saved={isSaved(place.id)} onPress={() => toggleSaved(place.id)} /></View>
      </View>
      <View style={styles.info}>
        <AppText style={styles.name} numberOfLines={1}>{place.name}</AppText>
        <AppText style={styles.tagline} numberOfLines={1}>{place.tagline}</AppText>
        <AppText style={styles.meta}>{place.neighborhood} · {place.city}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 278, backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  horizontalCard: { width: '100%', flexDirection: 'row', alignItems: 'center', minHeight: 126 },
  imageFrame: { height: 174, position: 'relative', overflow: 'hidden', backgroundColor: colors.surfaceRaised },
  horizontalImage: { width: 112, height: 126, flexShrink: 0 },
  categoryPill: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(16,16,32,0.78)', paddingVertical: 6, paddingHorizontal: 9, borderRadius: 14 },
  categoryText: { color: colors.text, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  save: { position: 'absolute', top: 9, right: 9 },
  info: { paddingHorizontal: 16, paddingVertical: 14, flex: 1, gap: 7 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  tagline: { color: colors.textMuted, fontSize: 12 },
  meta: { color: colors.textMuted, fontSize: 10, fontWeight: '500', marginTop: 3 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
