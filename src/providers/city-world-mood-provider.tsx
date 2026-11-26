import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { cancelAnimation, Easing, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import type { PlaceMood } from '@/features/places/domain/place';

const CityWorldMoodContext = createContext<{ mood: PlaceMood; transitionFromMood: PlaceMood | null; setMood: (mood: PlaceMood) => void; beginMoodTransition: (mood: PlaceMood) => void; progress: SharedValue<number>; previousProgress: number } | null>(null);

/* Shared-value writes run the mood animation on the UI thread by design. */
/* eslint react-hooks/immutability: off */

export function CityWorldMoodProvider({ children }: PropsWithChildren) {
  const [mood, setMoodState] = useState<PlaceMood>('chill');
  const moodRef = useRef<PlaceMood>('chill');
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const [previousProgress, setPreviousProgress] = useState(1);
  const [transitionFromMood, setTransitionFromMood] = useState<PlaceMood | null>(null);
  const progress = useSharedValue(1);
  const beginMoodTransition = useCallback((nextMood: PlaceMood) => {
    if (nextMood === moodRef.current) return;
    const previousMood = moodRef.current;
    setPreviousProgress(progress.value);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setTransitionFromMood(reduceMotion ? null : previousMood);
    cancelAnimation(progress);
    progress.value = reduceMotion ? 1 : 0;
    if (!reduceMotion) progress.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.cubic) });
    moodRef.current = nextMood;
    setMoodState(nextMood);
    if (!reduceMotion) transitionTimer.current = setTimeout(() => setTransitionFromMood(null), 800);
  }, [progress, reduceMotion]);
  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);
  const setMood = beginMoodTransition;
  const value = useMemo(() => ({ mood, transitionFromMood, setMood, beginMoodTransition, progress, previousProgress }), [beginMoodTransition, mood, previousProgress, progress, setMood, transitionFromMood]);
  return <CityWorldMoodContext.Provider value={value}>{children}</CityWorldMoodContext.Provider>;
}

export function useCityWorldMood() {
  const value = useContext(CityWorldMoodContext);
  const fallbackProgress = useSharedValue(1);
  return value ?? { mood: 'chill' as PlaceMood, transitionFromMood: null, setMood: () => undefined, beginMoodTransition: () => undefined, progress: fallbackProgress, previousProgress: 1 };
}
