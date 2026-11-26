import { Platform } from 'react-native';
import '@/global.css';
import { designTokens } from '@/shared/design-system/tokens';

export const colors = designTokens.compatibility.colors;
export const spacing = designTokens.compatibility.spacing;
export const contentMaxWidth = designTokens.layout.contentMaxWidth;

// Keep starter component exports valid while those examples remain in the project.
export const Colors = {
  light: designTokens.compatibility.lightColors,
  dark: { text: colors.text, background: colors.background, backgroundElement: colors.surface, backgroundSelected: colors.surfaceRaised, textSecondary: colors.textMuted },
} as const;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export const Fonts = {
  sans: 'InterTight_400Regular',
  serif: 'Syne_600SemiBold',
  rounded: 'InterTight_500Medium',
  mono: 'InterTight_400Regular',
} as const;
export const Spacing = designTokens.compatibility.starterSpacing;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = contentMaxWidth;
