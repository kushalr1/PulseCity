import '@/global.css';
import { Platform } from 'react-native';

export const colors = {
  background: '#101020',
  surface: '#19192B',
  surfaceRaised: '#222238',
  border: '#303047',
  text: '#F7F5FF',
  textMuted: '#A2A0B7',
  lilac: '#A970FF',
  pink: '#FF79B0',
  mint: '#55DCC1',
  amber: '#FFC66D',
} as const;

export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const contentMaxWidth = 720;

// Keep starter component exports valid while those examples remain in the project.
export const Colors = {
  light: { text: '#171727', background: '#F8F6FC', backgroundElement: '#ECEAF2', backgroundSelected: '#E3DDF0', textSecondary: '#68657A' },
  dark: { text: colors.text, background: colors.background, backgroundElement: colors.surface, backgroundSelected: colors.surfaceRaised, textSecondary: colors.textMuted },
} as const;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});
export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = contentMaxWidth;
