import type { PlaceRepository } from '@/features/places/application/place-repository';
import type { Place, PlaceMood } from '@/features/places/domain/place';

const areas = {
  s29: { name: 'Sector 29', latitude: 28.4595, longitude: 77.0266 },
  dlf4: { name: 'DLF Phase 4', latitude: 28.4672, longitude: 77.0815 },
  cyber: { name: 'Cyber City', latitude: 28.4948, longitude: 77.0895 },
  mg: { name: 'MG Road', latitude: 28.4795, longitude: 77.08 },
  gcr: { name: 'Golf Course Road', latitude: 28.4401, longitude: 77.101 },
  sohna: { name: 'Sohna Road', latitude: 28.4186, longitude: 77.0417 },
  old: { name: 'Old Gurugram', latitude: 28.4642, longitude: 77.0299 },
  s56: { name: 'Sector 56', latitude: 28.423, longitude: 77.103 },
} as const;

type AreaId = keyof typeof areas;
type PlaceInput = Omit<Place, 'city' | 'latitude' | 'longitude' | 'neighborhood'> & {
  area: AreaId;
  offset?: [longitude: number, latitude: number];
};

function place(input: PlaceInput): Place {
  const { area, offset = [0, 0], ...content } = input;
  const anchor = areas[area];
  return {
    ...content,
    city: 'Gurugram',
    neighborhood: anchor.name,
    latitude: anchor.latitude + offset[1],
    longitude: anchor.longitude + offset[0],
  };
}

const moods = (...values: PlaceMood[]): PlaceMood[] => values;

/** Approved v2.3 Gurugram demo content. Demo records are not live listings. */
export const mockPlaces: Place[] = [
  place({ id: 'leisure-valley', name: 'Leisure Valley Park', category: 'Parks', area: 's29', offset: [0.002, -0.001], kind: 'landmark', moods: moods('nature', 'chill', 'active'), moodRank: { nature: 3, active: 1, chill: 0 }, illustration: 'park', tagline: 'A green reset beside Sector 29.', description: 'Wide lawns and long walking paths right beside the Sector 29 food streets.', highlights: ['Evening walks', 'Open green space'], accent: '#2E7D4F' }),
  place({ id: 'aravalli', name: 'Aravalli Biodiversity Park', category: 'Parks', area: 'mg', offset: [0.022, 0.004], kind: 'landmark', moods: moods('nature', 'active', 'explore'), moodRank: { nature: 2, active: 2, explore: 1 }, illustration: 'park', tagline: 'Trails and birdsong inside the city.', description: 'Former quarry land restored with native Aravalli plants and quiet trails.', highlights: ['Morning walks', 'Birdwatching'], accent: '#2E7D4F' }),
  place({ id: 'galleria', name: 'Galleria Market', category: 'Markets', area: 'dlf4', kind: 'landmark', moods: moods('social', 'foodie', 'explore'), moodRank: { explore: 2, foodie: 2, social: 1 }, illustration: 'market', tagline: 'An open-air market made for a wander.', description: 'An open-air square ringed with shops, bakeries and casual places to eat.', highlights: ['Unplanned meet-ups', 'Snacks'], accent: '#C26A12' }),
  place({ id: 'cyberhub', name: 'DLF CyberHub', category: 'Restaurants', area: 'cyber', offset: [0.001, -0.002], kind: 'landmark', moods: moods('social', 'foodie'), moodRank: { social: 2, foodie: 2 }, illustration: 'restaurant', tagline: 'After-work tables under the towers.', description: 'The after-work dining strip under the Cyber City towers.', highlights: ['Team dinners', 'Big groups'], accent: '#B5432A' }),
  place({ id: 's29-market', name: 'Sector 29 Market', category: 'Restaurants', area: 's29', offset: [-0.002, 0.002], kind: 'landmark', moods: moods('foodie', 'social'), moodRank: { foodie: 3, social: 2 }, illustration: 'restaurant', tagline: 'A walkable cluster of kitchens and cafés.', description: 'A walkable cluster of kitchens, cafés and bars around Sector 29.', highlights: ['Birthdays', 'Mixed tastes'], accent: '#B5432A' }),
  place({ id: 'sadar', name: 'Sadar Bazaar', category: 'Markets', area: 'old', kind: 'landmark', moods: moods('explore', 'foodie'), moodRank: { explore: 3, foodie: 1 }, illustration: 'market', tagline: 'Old Gurugram market lanes.', description: 'Dense lanes of fabric, steel, spices and snacks in Old Gurugram.', highlights: ['Bargain hunting', 'Street snacks'], accent: '#C26A12' }),
  place({ id: 'ambience', name: 'Ambience Mall', category: 'Malls', area: 'cyber', offset: [0.01, 0.009], kind: 'landmark', moods: moods('social', 'chill'), moodRank: { social: 1, chill: 0 }, illustration: 'mall', tagline: 'An indoor all-rounder for a slow day.', description: 'A big indoor all-rounder for shopping, a film and a lazy wander.', highlights: ['Rainy days', 'Mixed groups'], accent: '#2C6E9E' }),
  place({ id: 'sultanpur', name: 'Sultanpur National Park', category: 'Parks', area: 'old', offset: [-0.13, 0.002], kind: 'landmark', moods: moods('nature', 'chill'), moodRank: { nature: 1 }, illustration: 'park', tagline: 'A protected wetland on the city edge.', description: 'A protected wetland known for migratory birds in the cooler months.', highlights: ['Early mornings', 'Birdwatching'], accent: '#2E7D4F' }),
  place({ id: 'damdama', name: 'Damdama Lake', category: 'Parks', area: 'sohna', offset: [0.09, -0.1], kind: 'landmark', moods: moods('nature', 'explore', 'active'), moodRank: { nature: 0, explore: 0, active: 0 }, illustration: 'park', tagline: 'A full-day escape in the Aravallis.', description: 'An Aravalli lake for a day in the hills. Water levels vary by season.', highlights: ['Day trips', 'Groups with a car'], accent: '#2E7D4F' }),
  place({ id: 'kavach', name: 'Kavach Pharmacy', category: 'Pharmacy', area: 's29', offset: [0.004, 0.003], kind: 'demo', moods: [], illustration: 'pharmacy', tagline: 'Everyday health basics nearby.', description: 'Neighbourhood chemist with a counter for prescriptions and everyday health basics.', highlights: ['Prescriptions', 'Everyday basics'], accent: '#1F8A70' }),
  place({ id: 'medicorner', name: 'MediCorner Chemist', category: 'Pharmacy', area: 'gcr', offset: [-0.003, 0.004], kind: 'demo', moods: [], illustration: 'pharmacy', tagline: 'Prescriptions and personal care.', description: 'A compact chemist with personal-care aisles.', highlights: ['Prescriptions', 'Personal care'], accent: '#1F8A70' }),
  place({ id: 'neem', name: 'Neem Health Store', category: 'Pharmacy', area: 'sohna', offset: [0.004, 0.002], kind: 'demo', moods: [], illustration: 'pharmacy', tagline: 'Chemist and wellness store.', description: 'Chemist and wellness store near Sohna Road.', highlights: ['Prescriptions', 'Wellness'], accent: '#1F8A70' }),
  place({ id: 'daily-basket', name: 'Daily Basket', category: 'Grocery', area: 'dlf4', offset: [0.003, -0.003], kind: 'demo', moods: [], illustration: 'grocery', tagline: 'Everyday groceries and household staples.', description: 'Everyday groceries, fresh produce and household staples.', highlights: ['Weekly shop', 'Quick top-up'], accent: '#3E8E2F' }),
  place({ id: 'green-crate', name: 'Green Crate Grocers', category: 'Grocery', area: 's56', offset: [-0.002, 0.002], kind: 'demo', moods: [], illustration: 'grocery', tagline: 'Fruit, vegetables and pantry basics.', description: 'Fruit, vegetables and pantry basics with a small organic shelf.', highlights: ['Fresh produce'], accent: '#3E8E2F' }),
  place({ id: 'mandi-fresh', name: 'Mandi Fresh', category: 'Grocery', area: 'old', offset: [0.004, -0.002], kind: 'demo', moods: moods('explore'), illustration: 'grocery', tagline: 'Fresh produce near the old market lanes.', description: 'A busy produce shop near the old market lanes.', highlights: ['Fresh produce', 'Bulk buys'], accent: '#3E8E2F' }),
  place({ id: 'second-draft', name: 'Second Draft Coffee', category: 'Cafés', area: 'gcr', offset: [0.002, -0.002], kind: 'demo', moods: moods('chill', 'social'), moodRank: { chill: 2, social: 2 }, illustration: 'cafe', tagline: 'Slow coffee and laptop-free conversations.', description: 'A slow-bar café for long, laptop-free conversations. Big windows, short menu.', highlights: ['Catch-ups', 'Quiet mornings'], accent: '#9A5B2E' }),
  place({ id: 'pinwheel', name: 'Pinwheel Game Café', category: 'Cafés', area: 'sohna', offset: [-0.003, 0.003], kind: 'demo', moods: moods('social', 'chill'), moodRank: { social: 3, chill: 1 }, illustration: 'cafe', tagline: 'Board games and big tables.', description: 'Shelves of board games and big tables for groups.', highlights: ['Groups of 4+', 'Game nights'], accent: '#9A5B2E' }),
  place({ id: 'kettle', name: 'Kettle & Kulhad', category: 'Cafés', area: 's29', offset: [-0.004, -0.002], kind: 'demo', moods: moods('chill', 'foodie'), moodRank: { chill: 3, foodie: 2 }, illustration: 'cafe', tagline: 'Chai in clay cups and a terrace for evenings.', description: 'Chai in clay cups, buttered buns and a terrace that catches the evening.', highlights: ['Chai breaks', 'Solo time'], accent: '#9A5B2E' }),
  place({ id: 'studio-shear', name: 'Studio Shear', category: 'Salons', area: 'mg', offset: [0.003, 0.002], kind: 'demo', moods: [], illustration: 'salon', tagline: 'Appointments on your terms.', description: 'Independent stylists, relaxed appointments and cuts that still feel like you.', highlights: ['Haircuts', 'Colour'], accent: '#B4467A' }),
  place({ id: 'groom-room', name: 'The Groom Room', category: 'Salons', area: 'cyber', offset: [-0.004, -0.004], kind: 'demo', moods: [], illustration: 'salon', tagline: 'Quick grooming near the office towers.', description: 'Quick grooming near the office towers.', highlights: ['Lunch-break trims'], accent: '#B4467A' }),
  place({ id: 'fixpoint', name: 'FixPoint Mobile Care', category: 'Mobile repair', area: 's29', offset: [0.005, -0.004], kind: 'demo', moods: [], illustration: 'repair', tagline: 'Screen, battery and charging-port repairs.', description: 'Screen, battery and charging-port repairs for most phone brands.', highlights: ['Screen repair', 'Battery'], accent: '#3B5BCC' }),
  place({ id: 'circuit-doctor', name: 'Circuit Doctor', category: 'Mobile repair', area: 'old', offset: [-0.003, 0.004], kind: 'demo', moods: [], illustration: 'repair', tagline: 'Phone and accessory repairs.', description: 'Phone and accessory repairs in the old market area.', highlights: ['Repairs', 'Accessories'], accent: '#3B5BCC' }),
  place({ id: 'ironline', name: 'Ironline Fitness', category: 'Gyms', area: 'gcr', offset: [-0.005, -0.004], kind: 'demo', moods: moods('active'), illustration: 'gym', tagline: 'Strength floor, classes and day passes.', description: 'Strength floor, classes and day passes for visitors.', highlights: ['Day passes', 'Classes'], accent: '#C2362E' }),
  place({ id: 'move-studio', name: 'Move Studio', category: 'Gyms', area: 'dlf4', offset: [-0.004, 0.003], kind: 'demo', moods: moods('active'), illustration: 'gym', tagline: 'Small-group mobility and training.', description: 'Small-group mobility, yoga and functional training.', highlights: ['Yoga', 'Small groups'], accent: '#C2362E' }),
  place({ id: 'low-tide', name: 'Low Tide Listening Room', category: 'Things to do', area: 'cyber', offset: [0.004, 0.004], kind: 'demo', moods: moods('social', 'chill'), moodRank: { social: 2, chill: 0 }, illustration: 'club', tagline: 'Vinyl sets at conversation-level volume.', description: 'A low-lit listening bar with vinyl sets and conversation-level volume.', highlights: ['Date night', 'Music'], accent: '#7A3FC2' }),
  place({ id: 'clay-chai', name: 'Clay & Chai Studio', category: 'Things to do', area: 'old', offset: [0.008, 0.006], kind: 'demo', moods: moods('explore', 'chill', 'social'), moodRank: { explore: 1, chill: 0, social: 0 }, illustration: 'workshop', tagline: 'Hands-on pottery and chai workshops.', description: 'Make a wonky kulhad, then drink chai from someone else’s. Hands-on evening workshops.', highlights: ['Something different', 'First dates'], accent: '#7C4DCC' }),
];

export const mockPlaceRepository: PlaceRepository = {
  async getAll() { return mockPlaces; },
  async getById(id) { return mockPlaces.find((item) => item.id === id); },
};
