import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, contentMaxWidth, spacing } from '@/constants/theme';

type Props = PropsWithChildren<{ scroll?: boolean; contentStyle?: StyleProp<ViewStyle> }>;

export function AppScreen({ children, scroll = true, contentStyle }: Props) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      ) : <View style={[styles.content, styles.inner, contentStyle]}>{children}</View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 120, alignItems: 'center' },
  inner: { width: '100%', maxWidth: contentMaxWidth },
});
