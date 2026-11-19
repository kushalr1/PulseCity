import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Eyebrow } from '@/components/ui/eyebrow';
import { SaveButton } from '@/components/ui/save-button';
import { colors, contentMaxWidth } from '@/constants/theme';
import { usePlaces } from '@/providers/places-provider';

export default function PlaceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { places, loading, isSaved, toggleSaved } = usePlaces();
  const place = places.find((item) => item.id === id);

  if (!place) {
    return <SafeAreaView style={styles.safe}><View style={styles.missing}><Text style={styles.missingTitle}>{loading ? 'Loading place…' : 'Place not found'}</Text><Text style={styles.body}>This sample listing may no longer be available.</Text><Pressable onPress={() => router.replace('/')}><Text style={styles.backLink}>BACK TO HOME ↗</Text></Pressable></View></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <Image source={place.imageUrl} contentFit="cover" transition={300} style={StyleSheet.absoluteFill} accessibilityLabel={`${place.name} sample photo`} />
            <View style={styles.shade} />
            <View style={styles.heroControls}>
              <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.circleButton}><SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={colors.text} size={18} /></Pressable>
              <SaveButton saved={isSaved(place.id)} onPress={() => toggleSaved(place.id)} />
            </View>
            <View style={styles.photoCaption}><Text style={styles.photoBadge}>SAMPLE PLACE · NOT LIVE</Text></View>
          </View>
          <View style={styles.bodyContent}>
            <View style={styles.categoryLine}><Eyebrow>{place.category.toUpperCase()}</Eyebrow><View style={styles.rating}><SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor={colors.amber} size={14} /><Text style={styles.ratingText}>{place.rating} <Text style={styles.reviews}>({place.reviewCount} sample reviews)</Text></Text></View></View>
            <Text style={styles.name}>{place.name}</Text>
            <Text style={styles.tagline}>{place.tagline}</Text>
            <View style={styles.locationRow}><SymbolView name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }} tintColor={colors.mint} size={16} /><Text style={styles.location}>{place.neighborhood} · {place.city}</Text><Text style={styles.distance}>{place.distanceLabel}</Text></View>
            <View style={styles.rule} />
            <Text style={styles.sectionTitle}>The vibe</Text>
            <Text style={styles.description}>{place.description}</Text>
            <Text style={[styles.sectionTitle, styles.highlightsTitle]}>Good to know</Text>
            <View style={styles.highlights}>{place.highlights.map((highlight) => <View key={highlight} style={styles.highlight}><View style={[styles.highlightDot, { backgroundColor: place.accent }]} /><Text style={styles.highlightText}>{highlight}</Text></View>)}</View>
            <View style={styles.sampleNotice}><SymbolView name={{ ios: 'info.circle', android: 'info', web: 'info' }} tintColor={colors.amber} size={17} /><Text style={styles.noticeText}>Sample content for preview. Details, ratings, distance, and photos are not live or verified.</Text></View>
            <View style={styles.galleryHeading}><Text style={styles.sectionTitle}>A little look around</Text><Text style={styles.photoCount}>{place.gallery.length} SAMPLE PHOTOS</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>{place.gallery.map((image, index) => <Image key={`${place.id}-image-${index}`} source={image} contentFit="cover" transition={250} style={styles.galleryImage} accessibilityLabel={`${place.name} sample photo ${index + 1}`} />)}</ScrollView>
            <Pressable accessibilityRole="button" onPress={() => toggleSaved(place.id)} style={({ pressed }) => [styles.primaryButton, isSaved(place.id) && styles.savedButton, pressed && styles.pressed]}><Text style={styles.primaryText}>{isSaved(place.id) ? 'Saved to your places' : 'Save this place'}</Text><SymbolView name={{ ios: isSaved(place.id) ? 'heart.fill' : 'heart', android: isSaved(place.id) ? 'favorite' : 'favorite_border', web: isSaved(place.id) ? 'favorite' : 'favorite_border' }} tintColor={isSaved(place.id) ? colors.pink : '#171123'} size={17} /></Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, scroll: { flexGrow: 1, paddingBottom: 36, alignItems: 'center' }, content: { width: '100%', maxWidth: contentMaxWidth },
  hero: { height: 330, backgroundColor: colors.surfaceRaised, position: 'relative' }, shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,10,21,0.18)' }, heroControls: { position: 'absolute', top: 14, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }, circleButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,16,32,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }, photoCaption: { position: 'absolute', bottom: 18, left: 20 }, photoBadge: { color: colors.text, backgroundColor: 'rgba(16,16,32,0.78)', borderRadius: 12, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 7, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  bodyContent: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 30 }, categoryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, rating: { flexDirection: 'row', alignItems: 'center', gap: 6 }, ratingText: { color: colors.text, fontSize: 12, fontWeight: '700' }, reviews: { color: colors.textMuted, fontWeight: '400' }, name: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -1.2, marginTop: 15 }, tagline: { color: colors.textMuted, fontSize: 15, marginTop: 4 }, locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 19 }, location: { color: colors.text, fontSize: 12, fontWeight: '600', flex: 1 }, distance: { color: colors.textMuted, fontSize: 10 }, rule: { height: 1, backgroundColor: colors.border, marginVertical: 23 }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }, description: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginTop: 10 }, highlightsTitle: { marginTop: 25 }, highlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 }, highlight: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12 }, highlightDot: { width: 6, height: 6, borderRadius: 3 }, highlightText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  sampleNotice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 17, backgroundColor: 'rgba(255,198,109,0.09)', padding: 13, marginTop: 22 }, noticeText: { color: colors.amber, flex: 1, fontSize: 11, lineHeight: 17 }, galleryHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 27, marginBottom: 13 }, photoCount: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 }, gallery: { gap: 10 }, galleryImage: { width: 180, height: 122, borderRadius: 18, backgroundColor: colors.surfaceRaised }, primaryButton: { marginTop: 23, backgroundColor: colors.lilac, minHeight: 54, borderRadius: 19, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }, savedButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, primaryText: { color: '#171123', fontSize: 14, fontWeight: '800' }, pressed: { opacity: 0.84 }, missing: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 12 }, missingTitle: { color: colors.text, fontSize: 22, fontWeight: '700' }, body: { color: colors.textMuted, fontSize: 13 }, backLink: { color: colors.lilac, fontSize: 11, fontWeight: '800', marginTop: 8 },
});
