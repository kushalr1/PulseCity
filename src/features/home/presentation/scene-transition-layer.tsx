import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { sceneOpacityForProgress, type SceneTransitionRole } from '../application/scene-transition-opacity';

type Props = {
  children: (opacity: SharedValue<number>) => ReactNode;
  progress?: SharedValue<number>;
  role?: SceneTransitionRole;
  initialOpacity?: number;
  opacity?: SharedValue<number>;
  applyOpacity?: boolean;
  testID?: string;
};

export function SceneTransitionLayer({ children, progress, role = 'steady', initialOpacity, opacity: suppliedOpacity, applyOpacity = true, testID }: Props) {
  const opacity = useDerivedValue(() => suppliedOpacity?.value ?? sceneOpacityForProgress(role, progress?.value ?? 1, initialOpacity));
  const style = useAnimatedStyle(() => ({ opacity: applyOpacity ? opacity.value : 1 }));
  return <Animated.View testID={testID} pointerEvents="box-none" style={[StyleSheet.absoluteFill, style]}>{children(opacity)}</Animated.View>;
}
