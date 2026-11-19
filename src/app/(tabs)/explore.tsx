import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AppScreen } from '@/components/layout/app-screen';
import { CategoryChip } from '@/components/ui/category-chip';
import { Eyebrow } from '@/components/ui/eyebrow';
import { EmptyState } from '@/components/ui/empty-state';
import { PlaceCard } from '@/components/ui/place-card';
import { colors } from '@/constants/theme';
import { placeCategories, type PlaceCategory } from '@/features/places/domain/place';
import { usePlaces } from '@/providers/places-provider';

export default function ExploreScreen() {
  const { places, loading } = usePlaces();
  const [category, setCategory] = useState<PlaceCategory>('All');
  const [query, setQuery] = useState('');
  const filteredPlaces = useMemo(() => places.filter((place) => {
    const matchesCategory = category === 'All' || place.category === category;
    const search = query.trim().toLowerCase();
    const matchesQuery = !search || `${place.name} ${place.category} ${place.neighborhood} ${place.city}`.toLowerCase().includes(search);
    return matchesCategory && matchesQuery;
  }), [places, category, query]);

  return (
    <AppScreen>
      <View style={styles.topline}><Eyebrow>GOOD PLACES, GOOD DAYS</Eyebrow><Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}><Text style={styles.clearText}>RESET</Text></Pressable></View>
      <Text style={styles.title}>Explore <Text style={styles.titleAccent}>your city.</Text></Text>
      <Text style={styles.subtitle}>Local discoveries, curated for your next chapter.</Text>
      <View style={styles.mockNote}><SymbolView name={{ ios: 'info.circle.fill', android: 'info', web: 'info' }} tintColor={colors.amber} size={14} /><Text style={styles.mockText}>Sample listings for preview · not live or location-aware</Text></View>
      <View style={styles.searchBox}><SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.textMuted} size={17} /><TextInput value={query} onChangeText={setQuery} placeholder="Try ‘coffee’ or ‘Indiranagar’" placeholderTextColor={colors.textMuted} style={styles.searchInput} returnKeyType="search" accessibilityLabel="Search sample places" /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{placeCategories.map((item) => <CategoryChip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView>
      <View style={styles.resultHeading}><Text style={styles.resultCount}>{loading ? 'FINDING PLACES…' : `${filteredPlaces.length} SAMPLE ${filteredPlaces.length === 1 ? 'PLACE' : 'PLACES'}`}</Text><Text style={styles.resultCity}>ALL SAMPLE CITIES</Text></View>
      <View style={styles.list}>{loading ? <Text style={styles.loading}>Loading sample places…</Text> : filteredPlaces.map((place) => <PlaceCard key={place.id} horizontal place={place} onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })} />)}</View>
      {!loading && filteredPlaces.length === 0 ? <EmptyState title="No matches yet" message="Try another search or choose a different category." actionLabel="Clear filters" onAction={() => { setQuery(''); setCategory('All'); }} /> : null}
      <Text style={styles.disclaimer}>These sample places and ratings are for interface preview only.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 21 }, clear: { padding: 8 }, clearText: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 33, fontWeight: '800', letterSpacing: -1.1 }, titleAccent: { color: colors.lilac }, subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 7, marginBottom: 17 },
  mockNote: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(255,198,109,0.09)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 17 }, mockText: { color: colors.amber, fontSize: 10, fontWeight: '600', flexShrink: 1 },
  searchBox: { height: 52, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 15 }, searchInput: { color: colors.text, fontSize: 13, flex: 1, paddingVertical: 0 },
  chips: { gap: 8, paddingVertical: 18 }, resultHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, resultCount: { color: colors.text, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 }, resultCity: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  list: { gap: 11 }, loading: { color: colors.textMuted, textAlign: 'center', paddingVertical: 32 }, disclaimer: { color: colors.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 16, marginTop: 22 },
});
