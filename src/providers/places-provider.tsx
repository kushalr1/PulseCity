import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { mockPlaceRepository } from '@/data/mock-place-repository';
import type { PlaceRepository } from '@/features/places/application/place-repository';
import type { Place } from '@/features/places/domain/place';
import { useAppBootstrap } from '@/providers/app-bootstrap-provider';
import type { SavedPlaceSnapshot } from '@/features/storage/storage-schema';

type PlacesContextValue = {
  places: Place[];
  loading: boolean;
  savedIds: string[];
  savedPlaces: Place[];
  unavailableSavedPlaces: SavedPlaceSnapshot[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  removeSaved: (id: string) => void;
};

const PlacesContext = createContext<PlacesContextValue | null>(null);

export function PlacesProvider({ children, repository = mockPlaceRepository }: PropsWithChildren<{ repository?: PlaceRepository }>) {
  const { state, updateState } = useAppBootstrap();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const savedIds = useMemo(() => state?.savedPlaceIds ?? [], [state?.savedPlaceIds]);

  useEffect(() => {
    let active = true;
    repository.getAll().then((items) => {
      if (active) setPlaces(items);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [repository]);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);
  const removeSaved = useCallback((id: string) => {
    if (!state) return;
    const savedPlaces = state.savedPlaces.filter((item) => item.id !== id);
    updateState({ savedPlaces, savedPlaceIds: savedPlaces.map((item) => item.id) });
  }, [state, updateState]);
  const toggleSaved = useCallback((id: string) => {
    if (!state) return;
    if (state.savedPlaceIds.includes(id)) {
      removeSaved(id);
      return;
    }
    const place = places.find((item) => item.id === id);
    if (!place) return;
    const saved: SavedPlaceSnapshot = {
      id,
      savedAt: new Date().toISOString(),
      cached: { name: place.name, category: place.category, area: place.neighborhood },
    };
    const savedPlaces = [...state.savedPlaces, saved];
    updateState({ savedPlaces, savedPlaceIds: savedPlaces.map((item) => item.id) });
  }, [places, removeSaved, state, updateState]);

  const savedPlaces = places.filter((place) => savedIds.includes(place.id));
  const unavailableSavedPlaces = (state?.savedPlaces ?? []).filter((saved) => !places.some((place) => place.id === saved.id));
  const value = useMemo(() => ({
    places, loading, savedIds, savedPlaces, unavailableSavedPlaces, isSaved, toggleSaved, removeSaved,
  }), [places, loading, savedIds, savedPlaces, unavailableSavedPlaces, isSaved, toggleSaved, removeSaved]);

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
}

export function usePlaces() {
  const context = useContext(PlacesContext);
  if (!context) throw new Error('usePlaces must be used inside PlacesProvider');
  return context;
}
