import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <View style={styles.row}><View style={styles.copy}><AppText style={styles.title}>{title}</AppText>{subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}</View>{action}</View>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 16 }, copy: { gap: 4, flex: 1 }, title: { color: colors.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.4 }, subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18 } });
