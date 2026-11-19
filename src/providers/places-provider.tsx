import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { mockPlaceRepository } from '@/data/mock-place-repository';
import type { PlaceRepository } from '@/features/places/application/place-repository';
import type { Place } from '@/features/places/domain/place';

type PlacesContextValue = {
  places: Place[];
  loading: boolean;
  savedIds: string[];
  savedPlaces: Place[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
};

const PlacesContext = createContext<PlacesContextValue | null>(null);

export function PlacesProvider({ children, repository = mockPlaceRepository }: PropsWithChildren<{ repository?: PlaceRepository }>) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  // Starter bookmarks keep the Saved screen useful in the sample experience.
  const [savedIds, setSavedIds] = useState<string[]>(['slow-bloom', 'green-mile']);

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
  const toggleSaved = useCallback((id: string) => {
    setSavedIds((current) => current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]);
  }, []);

  const value = useMemo(() => ({
    places, loading, savedIds, savedPlaces: places.filter((place) => savedIds.includes(place.id)), isSaved, toggleSaved,
  }), [places, loading, savedIds, isSaved, toggleSaved]);

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
}

export function usePlaces() {
  const context = useContext(PlacesContext);
  if (!context) throw new Error('usePlaces must be used inside PlacesProvider');
  return context;
}
