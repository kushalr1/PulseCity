import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import { decodeStoredAppState, type StoredAppState } from '@/features/storage/storage-schema';
import {
  beginAppBootstrapHydration,
  mergeBootstrapUpdate,
  mergeHydratedBootstrapState,
  type AppBootstrapState,
} from '@/providers/app-bootstrap';

const STORAGE_KEY = 'pulsecity:app-bootstrap:v1';
type AppBootstrapContextValue = {
  state: AppBootstrapState | null;
  ready: boolean;
  updateState: (patch: Partial<AppBootstrapState>) => void;
};
const AppBootstrapContext = createContext<AppBootstrapContextValue | null>(null);

type AppBootstrapProviderProps = PropsWithChildren<{ hydrationTimeoutMs?: number }>;

export function AppBootstrapProvider({ children, hydrationTimeoutMs = 1500 }: AppBootstrapProviderProps) {
  const [state, setState] = useState<AppBootstrapState | null>(null);
  const stateRef = useRef<AppBootstrapState | null>(null);
  const pendingPatchRef = useRef<Partial<AppBootstrapState>>({});
  const hydrationSucceededRef = useRef(false);

  const publishState = useCallback((nextState: AppBootstrapState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  useEffect(() => {
    let active = true;
    const hydration = beginAppBootstrapHydration(async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const stored = decodeStoredAppState(raw);
      return toBootstrapState(stored);
    }, undefined, hydrationTimeoutMs);

    void hydration.initialState.then((initialState) => {
      if (active && stateRef.current === null) publishState(initialState);
    });

    void hydration.hydratedState.then((hydratedState) => {
      if (!active || !hydratedState) return;
      hydrationSucceededRef.current = true;
      const merged = mergeHydratedBootstrapState(hydratedState, pendingPatchRef.current);
      const hadPendingChanges = Object.keys(pendingPatchRef.current).length > 0;
      pendingPatchRef.current = {};
      publishState(merged);
      if (hadPendingChanges) persistState(merged);
    });

    return () => { active = false; };
  }, [hydrationTimeoutMs, publishState]);

  const updateState = useCallback((patch: Partial<AppBootstrapState>) => {
    const current = stateRef.current;
    if (!current) return;
    pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
    const next = mergeBootstrapUpdate(current, patch);
    publishState(next);
    if (hydrationSucceededRef.current) persistState(next);
  }, [publishState]);

  const value = useMemo(() => ({ state, ready: state !== null, updateState }), [state, updateState]);
  return <AppBootstrapContext.Provider value={value}>{children}</AppBootstrapContext.Provider>;
}

function persistState(next: AppBootstrapState) {
  const stored: StoredAppState = {
    version: 1,
    selectedArea: next.selectedArea,
    demoSignedIn: next.demoSignedIn,
    theme: next.theme,
    savedPlaces: next.savedPlaces,
    savedEvents: next.savedEvents,
  };
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored)).catch((error) => {
    console.error('PulseCity storage write failed.', error);
  });
}

function toBootstrapState(stored: StoredAppState): AppBootstrapState {
  return {
    selectedArea: stored.selectedArea,
    savedPlaceIds: stored.savedPlaces.map((item) => item.id),
    savedEventIds: stored.savedEvents.map((item) => item.id),
    savedPlaces: stored.savedPlaces,
    savedEvents: stored.savedEvents,
    demoSignedIn: stored.demoSignedIn,
    theme: stored.theme,
  };
}

export function useAppBootstrap() {
  const context = useContext(AppBootstrapContext);
  if (!context) throw new Error('useAppBootstrap must be used inside AppBootstrapProvider');
  return context;
}
