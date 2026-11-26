import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { gurugramAreaOptions, type GurugramAreaOption } from '@/features/location/area-options';
import type { BootstrapArea } from '@/providers/app-bootstrap';
import { colors } from '@/constants/theme';

type Props = {
  visible: boolean;
  selectedArea: BootstrapArea;
  message?: string;
  comingSoon?: boolean;
  onClose: () => void;
  onChoose: (area: GurugramAreaOption) => void;
  onUseMyLocation: () => void;
};

export function AreaPickerSheet({ visible, selectedArea, message, comingSoon, onClose, onChoose, onUseMyLocation }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close area picker" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, comingSoon && styles.fullScreen]}>
          <View style={styles.grabber} />
          <AppText accessibilityRole="header" style={styles.title}>{comingSoon ? 'Coming soon' : 'Choose your area'}</AppText>
          <AppText style={styles.description}>{comingSoon ? 'PulseCity is coming to your city soon.' : 'Discover places and events around Gurugram.'}</AppText>
          {message ? <AppText accessibilityRole="alert" style={styles.message}>{message}</AppText> : null}
          {comingSoon ? <Pressable accessibilityRole="button" onPress={onClose} style={styles.option}><AppText style={styles.optionTitle}>Back to Gurugram</AppText></Pressable> : <>
            <Pressable accessibilityRole="button" onPress={onUseMyLocation} style={styles.locationButton}><AppText style={styles.locationButtonText}>Use my location</AppText></Pressable>
            <AppText style={styles.sectionLabel}>GURUGRAM AREAS</AppText>
            {gurugramAreaOptions.map((area) => (
              <Pressable key={area.name} accessibilityRole="button" accessibilityState={{ selected: selectedArea.name === area.name }} onPress={() => onChoose(area)} style={styles.option}>
                <AppText style={styles.optionTitle}>{area.name}</AppText>
                <AppText style={styles.optionCity}>Gurugram</AppText>
              </Pressable>
            ))}
          </>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(4,9,18,0.58)' },
  sheet: { maxHeight: '88%', backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 32 },
  fullScreen: { flex: 1, maxHeight: '100%', justifyContent: 'center', borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingTop: 48 },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, marginBottom: 18 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700' },
  description: { color: colors.textMuted, fontSize: 16, lineHeight: 22, marginTop: 6, marginBottom: 14 },
  message: { color: colors.amber, fontSize: 16, marginBottom: 12 },
  locationButton: { minHeight: 48, borderRadius: 14, backgroundColor: colors.mint, justifyContent: 'center', alignItems: 'center', marginBottom: 17 },
  locationButtonText: { color: '#081A1A', fontSize: 16, fontWeight: '700' },
  sectionLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  option: { minHeight: 56, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, justifyContent: 'center' },
  optionTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  optionCity: { color: colors.textMuted, fontSize: 14 },
});
