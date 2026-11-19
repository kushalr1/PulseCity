import { Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { colors } from '@/constants/theme';

export function SaveButton({ saved, onPress, size = 18 }: { saved: boolean; onPress: () => void; size?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={saved ? 'Remove from saved places' : 'Save place'} accessibilityState={{ selected: saved }} onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <SymbolView name={{ ios: saved ? 'heart.fill' : 'heart', android: saved ? 'favorite' : 'favorite_border', web: saved ? 'favorite' : 'favorite_border' }} tintColor={saved ? colors.pink : colors.text} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({ button: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: 'rgba(16,16,32,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }, pressed: { opacity: 0.75, transform: [{ scale: 0.94 }] } });
