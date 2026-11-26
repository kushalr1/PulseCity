import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { cityWorldTransitionDuration, transitionBounds } from '@/features/home/application/city-world-transition';
import { useAppBootstrap } from '@/providers/app-bootstrap-provider';
import { useCityWorldMood } from '@/providers/city-world-mood-provider';
import { useCityWorldTransition } from '@/providers/city-world-transition-provider';
import { CityScene } from './city-scene';

export function CityWorldTransitionOverlay() {
  const transition = useCityWorldTransition();
  const { state } = useAppBootstrap();
  const { mood } = useCityWorldMood();
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const end = { x: 0, y: 0, width, height };

  useEffect(() => {
    if (!transition.active || !transition.bounds) return;
    if (reduceMotion) {
      transition.finish();
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, { duration: cityWorldTransitionDuration(false) });
    // Keep the preview frame over the new route until its full-scene art is decoded.
    // The timeout is a safety valve if a device never delivers an image-load event.
    const timer = setTimeout(transition.finish, 2500);
    return () => clearTimeout(timer);
  }, [progress, reduceMotion, transition]);

  const frame = useAnimatedStyle(() => {
    if (!transition.bounds) return { opacity: 0 };
    const value = transitionBounds(transition.bounds, end, progress.value);
    return {
      opacity: transition.active ? 1 : 0,
      left: value.x,
      top: value.y,
      width: value.width,
      height: value.height,
      borderRadius: 24 * (1 - progress.value),
    };
  });

  if (!transition.active || !transition.bounds) return null;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.overlay]}>
    <Animated.View style={[styles.sceneFrame, frame]}>
      <CityScene name="preview" active focused testID="city-world-opening-transition" theme={state?.theme === 'winter' ? 'winter' : 'city'} mood={mood} />
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  overlay: { zIndex: 10000, elevation: 10000 },
  sceneFrame: { position: 'absolute', overflow: 'hidden', backgroundColor: '#06101D' },
});
