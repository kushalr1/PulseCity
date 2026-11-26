import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { SymbolView } from 'expo-symbols';
import { colors } from '@/constants/theme';

export function EmptyState({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.wrap}><View style={styles.icon}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} tintColor={colors.lilac} size={24} /></View><AppText style={styles.title}>{title}</AppText><AppText style={styles.message}>{message}</AppText>{actionLabel && onAction ? <Pressable onPress={onAction} style={styles.button}><AppText style={styles.buttonText}>{actionLabel}</AppText></Pressable> : null}</View>;
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 12 }, icon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(169,112,255,0.13)', marginBottom: 4 }, title: { color: colors.text, fontSize: 19, fontWeight: '700', textAlign: 'center' }, message: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 300 }, button: { backgroundColor: colors.lilac, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 18, marginTop: 6 }, buttonText: { color: '#171123', fontSize: 13, fontWeight: '700' } });
