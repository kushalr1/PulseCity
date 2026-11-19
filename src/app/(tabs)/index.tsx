import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/layout/app-screen';
import { Eyebrow } from '@/components/ui/eyebrow';
import { PlaceCard } from '@/components/ui/place-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { colors } from '@/constants/theme';
import { placeCategories, type PlaceCategory } from '@/features/places/domain/place';
import { usePlaces } from '@/providers/places-provider';

export default function HomeScreen() {
  const { places, loading } = usePlaces();
  const featured = places[0];
  const categories = placeCategories.filter((category) => category !== 'All');

  return (
    <AppScreen>
      <View style={styles.topline}><Eyebrow>YOUR CITY, YOUR WAY</Eyebrow><View style={styles.location}><Text style={styles.locationPin}>⌖</Text><Text style={styles.locationText}>MULTI-CITY PREVIEW</Text></View></View>
      <Text style={styles.headline}>Find your kind{ '\n' }of <Text style={styles.headlineAccent}>city.</Text></Text>
      <Text style={styles.intro}>Little local finds that make a new place feel like yours.</Text>

      <View style={styles.sampleBanner}><View style={styles.sampleDot} /><Text style={styles.sampleText}>SAMPLE PICKS · NOT LIVE LISTINGS</Text></View>

      {featured ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`View featured place ${featured.name}`} onPress={() => router.push({ pathname: '/place/[id]', params: { id: featured.id } })} style={({ pressed }) => [styles.feature, pressed && styles.pressed]}>
          <Image source={featured.imageUrl} contentFit="cover" transition={300} style={StyleSheet.absoluteFill} />
          <View style={styles.featureShade} />
          <View style={styles.featureTag}><Text style={styles.featureTagText}>THE NEIGHBORHOOD EDIT</Text></View>
          <View style={styles.featureCopy}><Text style={styles.featureOverline}>YOUR NEXT REGULAR?</Text><Text style={styles.featureTitle}>{featured.name}</Text><Text style={styles.featureSub}>{featured.neighborhood} · {featured.category}</Text></View>
          <View style={styles.featureArrow}><Text style={styles.arrowText}>↗</Text></View>
        </Pressable>
      ) : loading ? <View style={styles.loadingCard}><Text style={styles.loadingText}>Finding your first favorite…</Text></View> : null}

      <View style={styles.section}><SectionHeading title="Start with a mood" subtitle="Pick what your day needs." action={<Text style={styles.seeAll}>6 CATEGORIES</Text>} />
        <View style={styles.categoryGrid}>{categories.map((category) => <CategoryTile key={category} category={category} onPress={() => router.push('/explore')} />)}</View>
      </View>

      <View style={styles.section}><SectionHeading title="Around the corner" subtitle="A few sample spots to get you started." action={<Pressable onPress={() => router.push('/explore')}><Text style={styles.seeAll}>EXPLORE ALL ↗</Text></Pressable>} />
        {loading ? <Text style={styles.loadingText}>Loading sample places…</Text> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.placeRow}>{places.slice(0, 5).map((place) => <PlaceCard key={place.id} place={place} onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })} />)}</ScrollView>}
      </View>
      <Text style={styles.footer}>Made for finding your people, one place at a time.</Text>
    </AppScreen>
  );
}

function CategoryTile({ category, onPress }: { category: Exclude<PlaceCategory, 'All'>; onPress: () => void }) {
  const item = categoryVisuals[category];
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.categoryTile, pressed && styles.pressed]}><View style={[styles.categoryIcon, { backgroundColor: `${item.color}20` }]}><Text style={[styles.categoryGlyph, { color: item.color }]}>{item.glyph}</Text></View><View style={styles.categoryCopy}><Text style={styles.categoryName}>{category}</Text><Text style={styles.categoryHint}>{item.hint}</Text></View><Text style={styles.categoryChevron}>↗</Text></Pressable>;
}

const categoryVisuals: Record<Exclude<PlaceCategory, 'All'>, { glyph: string; color: string; hint: string }> = {
  Gyms: { glyph: '↗', color: colors.lilac, hint: 'Move your way' }, Cafés: { glyph: '◒', color: colors.amber, hint: 'Find your corner' },
  Parks: { glyph: '✳', color: colors.mint, hint: 'Take a breather' }, Salons: { glyph: '✦', color: colors.pink, hint: 'Your reset ritual' },
  Shopping: { glyph: '◇', color: colors.lilac, hint: 'Local little finds' }, Essentials: { glyph: '＋', color: colors.mint, hint: 'Everyday, easier' },
};

const styles = StyleSheet.create({
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 22 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 7, paddingHorizontal: 10, backgroundColor: colors.surface },
  locationPin: { color: colors.mint, fontSize: 15 }, locationText: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  headline: { color: colors.text, fontSize: 42, lineHeight: 46, fontWeight: '800', letterSpacing: -1.8 }, headlineAccent: { color: colors.lilac },
  intro: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 18, maxWidth: 300 },
  sampleBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(85,220,193,0.09)', marginBottom: 14 },
  sampleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint }, sampleText: { color: colors.mint, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  feature: { height: 236, width: '100%', borderRadius: 28, overflow: 'hidden', backgroundColor: colors.surfaceRaised, justifyContent: 'space-between', padding: 18 },
  featureShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,10,21,0.2)' }, featureTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(16,16,32,0.78)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 }, featureTagText: { color: colors.text, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  featureCopy: { gap: 5 }, featureOverline: { color: colors.mint, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 }, featureTitle: { color: '#fff', fontSize: 27, fontWeight: '800', letterSpacing: -0.6 }, featureSub: { color: 'rgba(255,255,255,0.84)', fontSize: 12, fontWeight: '600' },
  featureArrow: { position: 'absolute', right: 18, bottom: 18, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lilac, alignItems: 'center', justifyContent: 'center' }, arrowText: { color: '#171123', fontSize: 21, fontWeight: '700' },
  section: { marginTop: 34 }, seeAll: { color: colors.lilac, fontSize: 9, letterSpacing: 0.9, fontWeight: '800', paddingBottom: 2 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, categoryTile: { width: '48.5%', flexGrow: 1, minHeight: 82, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, categoryGlyph: { fontSize: 18, fontWeight: '800' }, categoryCopy: { flex: 1, gap: 3 }, categoryName: { color: colors.text, fontSize: 12, fontWeight: '700' }, categoryHint: { color: colors.textMuted, fontSize: 9 }, categoryChevron: { color: colors.textMuted, fontSize: 14 },
  placeRow: { gap: 12, paddingRight: 4 }, loadingCard: { height: 150, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, loadingText: { color: colors.textMuted, fontSize: 13 }, footer: { color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 36, marginBottom: 12 }, pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
});
