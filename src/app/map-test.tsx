import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import MapView, { UrlTile } from 'react-native-maps';
import { Platform, StyleSheet, View } from 'react-native';

const SECTOR_29 = { latitude: 28.4595, longitude: 77.0266 };

export default function MapTestRoute() {
  if (!__DEV__) {
    return <View style={styles.blocked}><AppText>Map test is available in development only.</AppText></View>;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...SECTOR_29, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
        mapType="none"
        rotateEnabled
        scrollEnabled
        zoomEnabled
        pitchEnabled
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          tileSize={256}
          shouldReplaceMapContent={Platform.OS === 'ios'}
          zIndex={-1}
        />
      </MapView>
      <View pointerEvents="none" style={styles.attribution}>
        <AppText style={styles.attributionText}>© OpenStreetMap contributors</AppText>
      </View>
      <View style={styles.title} pointerEvents="none">
        <AppText style={styles.titleText}>Development map test</AppText>
        <AppText style={styles.hint}>Pan and pinch to verify OSM tiles.</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9EEF1' },
  blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { position: 'absolute', top: 56, left: 16, right: 16, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.94)' },
  titleText: { color: '#121B2B', fontSize: 16, fontWeight: '700' },
  hint: { color: '#445064', fontSize: 14, marginTop: 2 },
  attribution: { position: 'absolute', bottom: 20, right: 8, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.92)' },
  attributionText: { color: '#30343B', fontSize: 11 },
});
