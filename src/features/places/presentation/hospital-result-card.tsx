import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import type { VerifiedHospital } from '@/features/places/domain/hospital';
import { hospitalDirectionsUrl } from '@/features/places/application/hospital-directions';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatVerifiedOn(value: string) {
  const [year, month, day] = value.split('-');
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}

export function HospitalResultCard({ hospital }: { hospital: VerifiedHospital }) {
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  return (
    <View style={styles.card}>
      <AppText style={styles.name}>{hospital.name}</AppText>
      <AppText style={styles.area}>{hospital.area}</AppText>
      <AppText style={styles.address}>{hospital.address}</AppText>
      <AppText style={styles.verified}>Real place · address verified {formatVerifiedOn(hospital.verifiedOn)}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Directions to ${hospital.name}`}
        onPress={() => { void Linking.openURL(hospitalDirectionsUrl(platform, hospital.directionsQuery)); }}
        style={({ pressed }) => [styles.directions, pressed && styles.pressed]}
      >
        <AppText style={styles.directionsText}>Directions</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 7, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  name: { color: colors.text, fontSize: 17, lineHeight: 22, fontWeight: '700' },
  area: { color: colors.text, fontSize: 14, fontWeight: '600' },
  address: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  verified: { color: colors.mint, fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: 2 },
  directions: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 14, backgroundColor: colors.surfaceRaised, marginTop: 5 },
  directionsText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
