import type { HomeEvent } from '@/features/home/domain/home-events';
import type { Place } from '@/features/places/domain/place';

/** Return only matches, ordered by name exactness before category/area matches. */
export function rankPlaces(query: string, places: Place[]) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return places;

  return places
    .map((place, index) => {
      const name = place.name.toLocaleLowerCase();
      const category = place.category.toLocaleLowerCase();
      const area = place.neighborhood.toLocaleLowerCase();
      const searchable = `${name} ${category} ${area} ${place.city.toLocaleLowerCase()}`;
      let score = -1;
      if (name === normalized) score = 0;
      else if (name.startsWith(normalized)) score = 1;
      else if (name.includes(normalized)) score = 2;
      else if (category.includes(normalized)) score = 3;
      else if (area.includes(normalized) || searchable.includes(normalized)) score = 4;
      return { place, index, score };
    })
    .filter(({ score }) => score >= 0)
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .map(({ place }) => place);
}

/** Events are a small bonus group: only query matches, never past items, at most three. */
export function selectSearchEvents(query: string, events: HomeEvent[], limit = 3) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized || limit <= 0) return [];
  return events
    .filter((event) => event.daysFromNow >= 0)
    .filter((event) => `${event.title} ${event.category} ${event.venue}`.toLocaleLowerCase().includes(normalized))
    .sort((left, right) => left.daysFromNow - right.daysFromNow)
    .slice(0, limit);
}
