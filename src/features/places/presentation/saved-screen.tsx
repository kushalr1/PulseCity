import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';

import { AppScreen } from '@/components/layout/app-screen';
import { Eyebrow } from '@/components/ui/eyebrow';
import { EmptyState } from '@/components/ui/empty-state';
import { colors } from '@/constants/theme';
import { PlaceCard } from '@/features/places/presentation/place-card';
import { usePlaces } from '@/providers/places-provider';

type SavedScreenProps = {
  onPlacePress: (id: string) => void;
  onExplorePress: () => void;
};

export default function SavedScreen({ onPlacePress, onExplorePress }: SavedScreenProps) {
  const { savedPlaces, unavailableSavedPlaces, removeSaved, loading } = usePlaces();
  const savedCount = savedPlaces.length + unavailableSavedPlaces.length;
  return (
    <AppScreen>
      <View style={styles.topline}><Eyebrow>YOUR LITTLE BLACK BOOK</Eyebrow><AppText style={styles.count}>{savedCount.toString().padStart(2, '0')}</AppText></View>
      <AppText style={styles.title}>Keep the <AppText style={styles.accent}>good ones.</AppText></AppText>
      <AppText style={styles.subtitle}>Places you want to come back to, all in one spot.</AppText>
      <View style={styles.sample}><View style={styles.dot} /><AppText style={styles.sampleText}>SAVED SAMPLE PICKS · ONLY ON THIS DEVICE SESSION</AppText></View>
      {loading ? <AppText style={styles.loading}>Loading saved places…</AppText> : savedCount ? <View style={styles.list}>
        {savedPlaces.map((place) => <PlaceCard key={place.id} horizontal place={place} onPress={() => onPlacePress(place.id)} />)}
        {unavailableSavedPlaces.map((saved) => <View key={saved.id} style={styles.unavailable}>
          <View style={styles.unavailableCopy}><AppText style={styles.unavailableTitle}>{saved.cached.name}</AppText><AppText style={styles.unavailableDescription}>No longer available · {saved.cached.category} · {saved.cached.area}</AppText></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove unavailable ${saved.cached.name}`} onPress={() => removeSaved(saved.id)} style={styles.removeButton}><AppText style={styles.removeText}>Remove</AppText></Pressable>
        </View>)}
      </View> : <EmptyState title="Your list starts here" message="Bookmark any place to save it for later. Your picks will show up here." actionLabel="Find a place" onAction={onExplorePress} />}
    </AppScreen>
  );
}

const styles = StyleSheet.create({ topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 21 }, count: { color: colors.pink, fontSize: 13, fontWeight: '800' }, title: { color: colors.text, fontSize: 33, fontWeight: '800', letterSpacing: -1.1 }, accent: { color: colors.pink }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 7, marginBottom: 18 }, sample: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(255,121,176,0.09)', marginBottom: 19, alignSelf: 'flex-start' }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.pink }, sampleText: { color: colors.pink, fontSize: 8, fontWeight: '800', letterSpacing: 0.7 }, list: { gap: 11 }, unavailable: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, unavailableCopy: { flex: 1, gap: 5 }, unavailableTitle: { color: colors.text, fontSize: 16, fontWeight: '700' }, unavailableDescription: { color: colors.textMuted, fontSize: 14 }, removeButton: { minWidth: 72, minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.surfaceRaised }, removeText: { color: colors.text, fontSize: 14, fontWeight: '600' }, loading: { color: colors.textMuted, textAlign: 'center', padding: 32 } });
