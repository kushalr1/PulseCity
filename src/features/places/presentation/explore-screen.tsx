import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/ui/app-text';
import { SymbolView } from 'expo-symbols';

import { AppScreen } from '@/components/layout/app-screen';
import { CategoryChip } from '@/components/ui/category-chip';
import { Eyebrow } from '@/components/ui/eyebrow';
import { EmptyState } from '@/components/ui/empty-state';
import { colors } from '@/constants/theme';
import { eventDateLabel, homeEvents } from '@/features/home/domain/home-events';
import { verifiedHospitals } from '@/data/verified-hospitals';
import { searchHospitals } from '@/features/places/application/hospital-search';
import { rankPlaces, selectSearchEvents } from '@/features/places/application/explore-search';
import { placeCategories, type PlaceCategory } from '@/features/places/domain/place';
import { PlaceCard } from '@/features/places/presentation/place-card';
import { HospitalResultCard } from '@/features/places/presentation/hospital-result-card';
import { usePlaces } from '@/providers/places-provider';

export default function ExploreScreen({ onPlacePress, onEventsPress = () => undefined }: { onPlacePress: (id: string) => void; onEventsPress?: (query: string) => void }) {
  const { places, loading } = usePlaces();
  const params = useLocalSearchParams<{ focus?: string; category?: string; entry?: string; query?: string }>();
  const input = useRef<React.ElementRef<typeof TextInput>>(null);
  const requestedCategory = (placeCategories as readonly string[]).includes(params.category ?? '') ? params.category as PlaceCategory : 'All';
  const requestedQuery = params.focus === '1' || requestedCategory !== 'All' ? '' : params.query ?? '';
  const routeKey = `${params.category ?? ''}:${params.focus ?? ''}:${params.entry ?? ''}:${params.query ?? ''}`;
  const [lastRouteKey, setLastRouteKey] = useState(routeKey);
  const [category, setCategory] = useState<PlaceCategory>(requestedCategory);
  const [query, setQuery] = useState(requestedQuery);
  if (routeKey !== lastRouteKey) {
    setLastRouteKey(routeKey);
    setCategory(requestedCategory);
    setQuery(requestedQuery);
  }
  useEffect(() => {
    if (params.focus === '1') {
      const timer = setTimeout(() => input.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [params.focus]);
  const filteredPlaces = useMemo(() => rankPlaces(query, places).filter((place) => category === 'All' || place.category === category), [places, category, query]);
  const matchingHospitals = useMemo(() => category === 'All' || category === 'Hospitals' ? searchHospitals(query, verifiedHospitals) : [], [category, query]);
  const matchingEvents = useMemo(() => selectSearchEvents(query, homeEvents, 3), [query]);
  const resultCount = filteredPlaces.length + matchingHospitals.length;

  return (
    <AppScreen>
      <View style={styles.topline}><Eyebrow>GOOD PLACES, GOOD DAYS</Eyebrow><Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}><AppText style={styles.clearText}>RESET</AppText></Pressable></View>
      <AppText style={styles.title}>Explore <AppText style={styles.titleAccent}>your city.</AppText></AppText>
      <AppText style={styles.subtitle}>Local discoveries, curated for your next chapter.</AppText>
      <View style={styles.mockNote}><SymbolView name={{ ios: 'info.circle.fill', android: 'info', web: 'info' }} tintColor={colors.amber} size={14} /><AppText style={styles.mockText}>Gurugram listings · distances only where positions are verified</AppText></View>
      <View style={styles.searchBox}><SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.textMuted} size={17} /><TextInput ref={input} value={query} onChangeText={setQuery} placeholder="Pharmacy, kirana, coffee, salon…" placeholderTextColor={colors.textMuted} style={styles.searchInput} returnKeyType="search" accessibilityLabel="Search Gurugram places and services" /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{placeCategories.map((item) => <CategoryChip key={item} label={item} selected={category === item} onPress={() => { setCategory(item); setQuery(''); }} />)}</ScrollView>
      <View style={styles.resultHeading}><AppText style={styles.resultCount}>{loading ? 'FINDING PLACES…' : `${resultCount} ${resultCount === 1 ? 'PLACE' : 'PLACES'}`}</AppText><AppText style={styles.resultCity}>GURUGRAM</AppText></View>
      <View style={styles.list}>{loading ? <AppText style={styles.loading}>Loading sample places…</AppText> : filteredPlaces.map((place) => <PlaceCard key={place.id} horizontal place={place} onPress={() => onPlacePress(place.id)} />)}</View>
      <View style={styles.list}>{matchingHospitals.map((hospital) => <HospitalResultCard key={hospital.id} hospital={hospital} />)}</View>
      {matchingEvents.length > 0 ? <View style={styles.eventGroup}>
        <View style={styles.eventHeading}><AppText style={styles.eventTitle}>Matching events</AppText><Pressable accessibilityRole="button" accessibilityLabel="See all in Events" onPress={() => onEventsPress(query)} style={styles.eventsLink}><AppText style={styles.eventsLinkText}>See all in Events ›</AppText></Pressable></View>
        {matchingEvents.map((event) => <View key={event.id} style={styles.eventRow}><View style={styles.eventCopy}><AppText style={styles.eventName}>{event.title}</AppText><AppText style={styles.eventMeta}>{eventDateLabel(event.daysFromNow)} · {event.time} · {event.venue}</AppText></View><AppText style={styles.demoTag}>DEMO</AppText></View>)}
      </View> : null}
      {!loading && resultCount === 0 ? <EmptyState title={category === 'Hospitals' ? 'No verified hospitals found' : 'No places found'} message={matchingEvents.length ? 'No places match this search. Matching events are listed below.' : category === 'Hospitals' ? 'Try another hospital name or clear the search.' : 'Try another search or choose a different category.'} actionLabel="Clear filters" onAction={() => { setQuery(''); setCategory('All'); }} /> : null}
      <AppText style={styles.disclaimer}>Demo place distances are straight-line estimates from your selected area. Verified hospitals have no distance until coordinates are verified.</AppText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 21 }, clear: { padding: 8 }, clearText: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 33, fontWeight: '800', letterSpacing: -1.1 }, titleAccent: { color: colors.lilac }, subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 7, marginBottom: 17 },
  mockNote: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: 'rgba(255,198,109,0.09)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 17 }, mockText: { color: colors.amber, fontSize: 10, fontWeight: '600', flexShrink: 1 },
  searchBox: { height: 52, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 15 }, searchInput: { color: colors.text, fontFamily: 'InterTight_400Regular', fontSize: 16, flex: 1, paddingVertical: 0 },
  chips: { gap: 8, paddingVertical: 18 }, resultHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, resultCount: { color: colors.text, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 }, resultCity: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  list: { gap: 11 }, loading: { color: colors.textMuted, textAlign: 'center', paddingVertical: 32 }, disclaimer: { color: colors.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 16, marginTop: 22 },
  eventGroup: { marginTop: 24, gap: 10 }, eventHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eventTitle: { color: colors.text, fontSize: 18, fontWeight: '700' }, eventsLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }, eventsLinkText: { color: colors.mint, fontSize: 12, fontWeight: '700' }, eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 68, padding: 12, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, eventCopy: { flex: 1, gap: 5 }, eventName: { color: colors.text, fontSize: 15, fontWeight: '700' }, eventMeta: { color: colors.textMuted, fontSize: 12 }, demoTag: { color: colors.amber, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
