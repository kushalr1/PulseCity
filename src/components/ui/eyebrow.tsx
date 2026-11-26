import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';

export function Eyebrow({ children, style }: { children: string; style?: ViewStyle }) {
  return <View style={[styles.wrap, style]}><View style={styles.dot} /><AppText style={styles.text}>{children}</AppText></View>;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint },
  text: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
});
