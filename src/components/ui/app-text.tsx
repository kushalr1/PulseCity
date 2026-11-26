import { StyleSheet, Text, type TextProps } from 'react-native';

const interTightFamilies: Record<number, string> = {
  400: 'InterTight_400Regular',
  500: 'InterTight_500Medium',
  600: 'InterTight_600SemiBold',
  700: 'InterTight_700Bold',
  800: 'InterTight_800ExtraBold',
};

const syneFamilies: Record<number, string> = {
  500: 'Syne_500Medium',
  600: 'Syne_600SemiBold',
  700: 'Syne_700Bold',
  800: 'Syne_800ExtraBold',
};

function normalizeWeight(weight: unknown) {
  if (typeof weight === 'number') return weight;
  if (weight === 'bold') return 700;
  if (typeof weight === 'string') {
    const parsed = Number(weight);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 400;
}

export function AppText({ style, ...props }: TextProps) {
  const styles = StyleSheet.flatten(style);
  const weight = normalizeWeight(styles?.fontWeight);
  const display = (styles?.fontSize ?? 16) >= 26;
  const family = styles?.fontFamily ?? (display
    ? syneFamilies[weight] ?? syneFamilies[700]
    : interTightFamilies[weight] ?? interTightFamilies[400]);

  return <Text {...props} style={[style, { fontFamily: family }]} />;
}
