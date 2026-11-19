import type { Place } from '../domain/place';

/** Data source contract. Replace the mock adapter with a FastAPI adapter later. */
export interface PlaceRepository {
  getAll(): Promise<Place[]>;
  getById(id: string): Promise<Place | undefined>;
}
