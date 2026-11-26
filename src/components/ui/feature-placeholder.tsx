import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { designTokens } from '@/shared/design-system/tokens';

type Props = { title: string; description: string };

export function FeaturePlaceholder({ title, description }: Props) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.badge}>
          <AppText style={styles.badgeText}>COMING SOON · PLACEHOLDER</AppText>
        </View>
        <AppText accessibilityRole="header" style={styles.title}>{title}</AppText>
        <AppText style={styles.description}>{description}</AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: designTokens.color.canvas },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: designTokens.spacing.xl },
  badge: {
    minHeight: designTokens.layout.minimumTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: designTokens.spacing.md,
    borderRadius: designTokens.radius.pill,
    backgroundColor: designTokens.color.demoBackground,
  },
  badgeText: { color: designTokens.color.demoText, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { color: designTokens.color.ink, fontSize: designTokens.typography.display.fontSize, lineHeight: designTokens.typography.display.lineHeight, fontWeight: '700', marginTop: designTokens.spacing.xl },
  description: { maxWidth: 300, color: designTokens.color.textSecondary, fontSize: designTokens.typography.body.fontSize, lineHeight: designTokens.typography.body.lineHeight, textAlign: 'center', marginTop: designTokens.spacing.sm },
});
