import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Eyebrow } from '@/components/ui/eyebrow';
import { SaveButton } from '@/components/ui/save-button';
import { colors, contentMaxWidth } from '@/constants/theme';
import { usePlaces } from '@/providers/places-provider';
import { PlaceIllustration } from './place-illustration';

type PlaceDetailsScreenProps = {
  id: string;
  onBack: () => void;
  onHome: () => void;
};

export default function PlaceDetailsScreen({ id, onBack, onHome }: PlaceDetailsScreenProps) {
  const { places, loading, isSaved, toggleSaved } = usePlaces();
  const place = places.find((item) => item.id === id);

  if (!place) {
    return <SafeAreaView style={styles.safe}><View style={styles.missing}><AppText style={styles.missingTitle}>{loading ? 'Loading place…' : 'Place not found'}</AppText><AppText style={styles.body}>This sample listing may no longer be available.</AppText><Pressable onPress={onHome}><AppText style={styles.backLink}>BACK TO HOME ↗</AppText></Pressable></View></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.hero}>
            <PlaceIllustration place={place} hero />
            <View style={styles.heroControls}>
              <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.circleButton}><SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={colors.text} size={18} /></Pressable>
              <SaveButton saved={isSaved(place.id)} onPress={() => toggleSaved(place.id)} />
            </View>
            <View style={styles.photoCaption}>
              <AppText style={styles.photoBadge}>GURUGRAM · DEMO LISTING</AppText>
              <AppText style={styles.illustrationBadge}>Illustration — not a photo of this place</AppText>
            </View>
          </View>
          <View style={styles.bodyContent}>
            <View style={styles.categoryLine}><Eyebrow>{place.category.toUpperCase()}</Eyebrow></View>
            <AppText style={styles.name}>{place.name}</AppText>
            <AppText style={styles.tagline}>{place.tagline}</AppText>
            <View style={styles.locationRow}><SymbolView name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }} tintColor={colors.mint} size={16} /><AppText style={styles.location}>{place.neighborhood} · {place.city}</AppText></View>
            <View style={styles.rule} />
            <AppText style={styles.sectionTitle}>The vibe</AppText>
            <AppText style={styles.description}>{place.description}</AppText>
            <AppText style={[styles.sectionTitle, styles.highlightsTitle]}>Good to know</AppText>
            <View style={styles.highlights}>{place.highlights.map((highlight) => <View key={highlight} style={styles.highlight}><View style={[styles.highlightDot, { backgroundColor: place.accent }]} /><AppText style={styles.highlightText}>{highlight}</AppText></View>)}</View>
            <View style={styles.sampleNotice}><SymbolView name={{ ios: 'info.circle', android: 'info', web: 'info' }} tintColor={colors.amber} size={17} /><AppText style={styles.noticeText}>Demo listing. Check details with the venue before visiting.</AppText></View>
            <Pressable accessibilityRole="button" onPress={() => toggleSaved(place.id)} style={({ pressed }) => [styles.primaryButton, isSaved(place.id) && styles.savedButton, pressed && styles.pressed]}><AppText style={styles.primaryText}>{isSaved(place.id) ? 'Saved to your places' : 'Save this place'}</AppText><SymbolView name={{ ios: isSaved(place.id) ? 'bookmark.fill' : 'bookmark', android: isSaved(place.id) ? 'bookmark' : 'bookmark_border', web: isSaved(place.id) ? 'bookmark' : 'bookmark_border' }} tintColor={isSaved(place.id) ? colors.mint : '#171123'} size={17} /></Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, scroll: { flexGrow: 1, paddingBottom: 36, alignItems: 'center' }, content: { width: '100%', maxWidth: contentMaxWidth },
  hero: { height: 330, backgroundColor: colors.surfaceRaised, position: 'relative', justifyContent: 'center' }, heroControls: { position: 'absolute', top: 14, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' }, circleButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,16,32,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }, photoCaption: { position: 'absolute', bottom: 14, left: 20, gap: 6, alignItems: 'flex-start' }, photoBadge: { color: colors.text, backgroundColor: 'rgba(16,16,32,0.78)', borderRadius: 12, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 7, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, illustrationBadge: { color: colors.text, backgroundColor: 'rgba(16,16,32,0.78)', borderRadius: 12, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 7, fontSize: 10, fontWeight: '600' },
  bodyContent: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 30 }, categoryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, name: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -1.2, marginTop: 15 }, tagline: { color: colors.textMuted, fontSize: 15, marginTop: 4 }, locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 19 }, location: { color: colors.text, fontSize: 12, fontWeight: '600', flex: 1 }, rule: { height: 1, backgroundColor: colors.border, marginVertical: 23 }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }, description: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginTop: 10 }, highlightsTitle: { marginTop: 25 }, highlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 }, highlight: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12 }, highlightDot: { width: 6, height: 6, borderRadius: 3 }, highlightText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  sampleNotice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 17, backgroundColor: 'rgba(255,198,109,0.09)', padding: 13, marginTop: 22 }, noticeText: { color: colors.amber, flex: 1, fontSize: 11, lineHeight: 17 }, primaryButton: { marginTop: 23, backgroundColor: colors.lilac, minHeight: 54, borderRadius: 19, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }, savedButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, primaryText: { color: '#171123', fontSize: 14, fontWeight: '800' }, pressed: { opacity: 0.84 }, missing: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 12 }, missingTitle: { color: colors.text, fontSize: 22, fontWeight: '700' }, body: { color: colors.textMuted, fontSize: 13 }, backLink: { color: colors.lilac, fontSize: 11, fontWeight: '800', marginTop: 8 },
});
