import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import type { PlaceCategory } from '@/features/places/domain/place';

export function CategoryChip({ label, selected, onPress }: { label: PlaceCategory; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      <AppText style={[styles.label, selected && styles.selectedLabel]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 24, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  selected: { backgroundColor: colors.lilac, borderColor: colors.lilac },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  selectedLabel: { color: '#171123' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
