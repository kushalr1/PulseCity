import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import type { SceneBounds } from '@/features/home/application/city-world-transition';

type TransitionContextValue = {
  active: boolean;
  bounds: SceneBounds | null;
  trainDistance: SharedValue<number>;
  begin: (bounds: SceneBounds) => void;
  finish: () => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function CityWorldTransitionProvider({ children }: PropsWithChildren) {
  const [active, setActive] = useState(false);
  const [bounds, setBounds] = useState<SceneBounds | null>(null);
  const trainDistance = useSharedValue(0);
  const value = useMemo<TransitionContextValue>(() => ({
    active,
    bounds,
    trainDistance,
    begin: (nextBounds) => { setBounds(nextBounds); setActive(true); },
    finish: () => { setActive(false); setBounds(null); },
  }), [active, bounds, trainDistance]);
  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
}

export function useCityWorldTransition() {
  const context = useContext(TransitionContext);
  if (!context) return { active: false, bounds: null, trainDistance: null, begin: () => undefined, finish: () => undefined };
  return context;
}
