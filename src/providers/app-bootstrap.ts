import type { SavedEventSnapshot, SavedPlaceSnapshot } from '@/features/storage/storage-schema';

export type BootstrapArea = { name: string; city: string; latitude?: number; longitude?: number };

export type AppBootstrapState = {
  selectedArea: BootstrapArea;
  savedPlaceIds: string[];
  savedEventIds: string[];
  savedPlaces: SavedPlaceSnapshot[];
  savedEvents: SavedEventSnapshot[];
  demoSignedIn: boolean;
  theme: 'city' | 'winter';
};

export const DEFAULT_APP_BOOTSTRAP_STATE: AppBootstrapState = {
  selectedArea: { name: 'Sector 29', city: 'Gurugram' },
  savedPlaceIds: [],
  savedEventIds: [],
  savedPlaces: [],
  savedEvents: [],
  demoSignedIn: false,
  theme: 'city',
};

export type BootstrapLogger = (message: string, error: unknown) => void;
export type BootstrapHydration = {
  initialState: Promise<AppBootstrapState>;
  hydratedState: Promise<AppBootstrapState | null>;
};

const defaultLogger: BootstrapLogger = (message, error) => console.error(message, error);

export function beginAppBootstrapHydration(
  hydrate: () => Promise<AppBootstrapState>,
  logger: BootstrapLogger = defaultLogger,
  timeoutMs = 1500,
): BootstrapHydration {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const hydratedState = Promise.resolve()
    .then(hydrate)
    .then(normalizeBootstrapState)
    .catch((error: unknown) => {
      logger('PulseCity storage hydration failed; starting with defaults.', error);
      return null;
    });

  const timeoutState = new Promise<null>((resolve) => {
    timeout = setTimeout(() => {
      logger('PulseCity storage hydration timed out; starting with defaults.', new Error(`Storage hydration timed out after ${timeoutMs} ms`));
      resolve(null);
    }, timeoutMs);
  });

  const initialState = Promise.race([hydratedState, timeoutState]).then((state) => {
    if (timeout) clearTimeout(timeout);
    return state ?? cloneDefaultState();
  });

  return { initialState, hydratedState };
}

export async function loadAppBootstrapState(
  hydrate: () => Promise<AppBootstrapState>,
  logger: BootstrapLogger = defaultLogger,
  timeoutMs = 1500,
): Promise<AppBootstrapState> {
  return beginAppBootstrapHydration(hydrate, logger, timeoutMs).initialState;
}

export function mergeHydratedBootstrapState(
  hydrated: AppBootstrapState,
  pending: Partial<AppBootstrapState>,
): AppBootstrapState {
  const savedPlaces = mergeSnapshots(hydrated.savedPlaces, pending.savedPlaces ?? []);
  const savedEvents = mergeSnapshots(hydrated.savedEvents, pending.savedEvents ?? []);
  return {
    ...hydrated,
    ...pending,
    selectedArea: pending.selectedArea ?? hydrated.selectedArea,
    savedPlaces,
    savedEvents,
    savedPlaceIds: savedPlaces.map(({ id }) => id),
    savedEventIds: savedEvents.map(({ id }) => id),
    // Keep values changed while the fallback screen was visible.
    demoSignedIn: pending.demoSignedIn ?? hydrated.demoSignedIn,
    theme: pending.theme ?? hydrated.theme,
  };
}

export function mergeBootstrapUpdate(
  current: AppBootstrapState,
  patch: Partial<AppBootstrapState>,
): AppBootstrapState {
  const next = { ...current, ...patch };
  if (patch.savedPlaces) {
    next.savedPlaces = patch.savedPlaces;
    next.savedPlaceIds = patch.savedPlaces.map(({ id }) => id);
  }
  if (patch.savedEvents) {
    next.savedEvents = patch.savedEvents;
    next.savedEventIds = patch.savedEvents.map(({ id }) => id);
  }
  return next;
}

function normalizeBootstrapState(state: AppBootstrapState): AppBootstrapState {
  return {
    selectedArea: state.selectedArea ?? { ...DEFAULT_APP_BOOTSTRAP_STATE.selectedArea },
    savedPlaceIds: Array.isArray(state.savedPlaceIds) ? state.savedPlaceIds : [],
    savedEventIds: Array.isArray(state.savedEventIds) ? state.savedEventIds : [],
    savedPlaces: Array.isArray(state.savedPlaces) ? state.savedPlaces : [],
    savedEvents: Array.isArray(state.savedEvents) ? state.savedEvents : [],
    demoSignedIn: state.demoSignedIn === true,
    theme: state.theme === 'winter' ? 'winter' : 'city',
  };
}

function mergeSnapshots<T extends { id: string }>(stored: T[], pending: T[]): T[] {
  const byId = new Map(stored.map((item) => [item.id, item]));
  for (const item of pending) byId.set(item.id, item);
  return [...byId.values()];
}

function cloneDefaultState(): AppBootstrapState {
  return {
    ...DEFAULT_APP_BOOTSTRAP_STATE,
    selectedArea: { ...DEFAULT_APP_BOOTSTRAP_STATE.selectedArea },
    savedPlaceIds: [],
    savedEventIds: [],
    savedPlaces: [],
    savedEvents: [],
  };
}
