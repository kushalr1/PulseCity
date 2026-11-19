import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/layout/app-screen';
import { Eyebrow } from '@/components/ui/eyebrow';
import { EmptyState } from '@/components/ui/empty-state';
import { PlaceCard } from '@/components/ui/place-card';
import { colors } from '@/constants/theme';
import { usePlaces } from '@/providers/places-provider';

export default function SavedScreen() {
  const { savedPlaces, loading } = usePlaces();
  return (
    <AppScreen>
      <View style={styles.topline}><Eyebrow>YOUR LITTLE BLACK BOOK</Eyebrow><Text style={styles.count}>{savedPlaces.length.toString().padStart(2, '0')}</Text></View>
      <Text style={styles.title}>Keep the <Text style={styles.accent}>good ones.</Text></Text>
      <Text style={styles.subtitle}>Places you want to come back to, all in one spot.</Text>
      <View style={styles.sample}><View style={styles.dot} /><Text style={styles.sampleText}>SAVED SAMPLE PICKS · ONLY ON THIS DEVICE SESSION</Text></View>
      {loading ? <Text style={styles.loading}>Loading saved places…</Text> : savedPlaces.length ? <View style={styles.list}>{savedPlaces.map((place) => <PlaceCard key={place.id} horizontal place={place} onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })} />)}</View> : <EmptyState title="Your list starts here" message="Tap the heart on any place to save it for later. Your picks will show up here." actionLabel="Find a place" onAction={() => router.push('/explore')} />}
    </AppScreen>
  );
}

const styles = StyleSheet.create({ topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 21 }, count: { color: colors.pink, fontSize: 13, fontWeight: '800' }, title: { color: colors.text, fontSize: 33, fontWeight: '800', letterSpacing: -1.1 }, accent: { color: colors.pink }, subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 7, marginBottom: 18 }, sample: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(255,121,176,0.09)', marginBottom: 19, alignSelf: 'flex-start' }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.pink }, sampleText: { color: colors.pink, fontSize: 8, fontWeight: '800', letterSpacing: 0.7 }, list: { gap: 11 }, loading: { color: colors.textMuted, textAlign: 'center', padding: 32 } });
