import type { PlaceRepository } from '@/features/places/application/place-repository';
import type { Place } from '@/features/places/domain/place';

const photo = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

/** Curated sample content for UI development. These are not live listings. */
export const mockPlaces: Place[] = [
  {
    id: 'form-house', name: 'Form House', category: 'Gyms', neighborhood: 'Indiranagar', city: 'Bengaluru',
    tagline: 'Move well. Feel everything.', description: 'A neighborhood strength and movement studio with thoughtful classes, good light, and a very welcoming first session.',
    imageUrl: photo('photo-1534438327276-14e5300c3a48'), gallery: [photo('photo-1534438327276-14e5300c3a48'), photo('photo-1571019613454-1cb2f99b2d8b')],
    rating: '4.9', reviewCount: 128, priceLabel: '₹₹', distanceLabel: '0.8 km away', highlights: ['Strength studio', 'Beginner friendly', 'Showers'], accent: '#A970FF',
  },
  {
    id: 'slow-bloom', name: 'Slow Bloom', category: 'Cafés', neighborhood: 'Indiranagar', city: 'Bengaluru',
    tagline: 'Coffee, plants, no rush.', description: 'A sunlit café for slow mornings, excellent pour-overs, and catching up with your new favorite people.',
    imageUrl: photo('photo-1495474472287-4d71bcdd2085'), gallery: [photo('photo-1495474472287-4d71bcdd2085'), photo('photo-1445116572660-236099ec97a0')],
    rating: '4.8', reviewCount: 96, priceLabel: '₹₹', distanceLabel: '1.2 km away', highlights: ['Specialty coffee', 'Pet friendly', 'Work friendly'], accent: '#FFC66D',
  },
  {
    id: 'green-mile', name: 'Cubbon Park', category: 'Parks', neighborhood: 'Central Bengaluru', city: 'Bengaluru',
    tagline: 'Your green reset button.', description: 'Big shady paths, old trees, and the kind of quiet that makes the city feel a little smaller.',
    imageUrl: photo('photo-1441974231531-c6227db76b6e'), gallery: [photo('photo-1441974231531-c6227db76b6e'), photo('photo-1500530855697-b586d89ba3ee')],
    rating: '4.9', reviewCount: 214, priceLabel: 'Free', distanceLabel: '2.4 km away', highlights: ['Open green space', 'Walking paths', 'Weekend market'], accent: '#55DCC1',
  },
  {
    id: 'good-cut', name: 'Good Cut Club', category: 'Salons', neighborhood: 'Koramangala', city: 'Bengaluru',
    tagline: 'A little reset, on your terms.', description: 'Independent stylists, relaxed appointments, and cuts that still feel like you when you get home.',
    imageUrl: photo('photo-1560066984-138dadb4c035'), gallery: [photo('photo-1560066984-138dadb4c035'), photo('photo-1521590832167-7bcbfaa6381f')],
    rating: '4.7', reviewCount: 74, priceLabel: '₹₹₹', distanceLabel: '1.7 km away', highlights: ['Independent stylists', 'Easy booking', 'Inclusive'], accent: '#FF79B0',
  },
  {
    id: 'weekend-edit', name: 'The Weekend Edit', category: 'Shopping', neighborhood: 'Jubilee Hills', city: 'Hyderabad',
    tagline: 'Find something that feels like you.', description: 'A small edit of local labels, thoughtful objects, and pieces worth keeping for a long time.',
    imageUrl: photo('photo-1441986300917-64674bd600d8'), gallery: [photo('photo-1441986300917-64674bd600d8'), photo('photo-1483985988355-763728e1935b')],
    rating: '4.6', reviewCount: 62, priceLabel: '₹₹₹', distanceLabel: '0.9 km away', highlights: ['Local designers', 'Small batches', 'Giftable finds'], accent: '#A970FF',
  },
  {
    id: 'daily-stop', name: 'Daily Stop Market', category: 'Essentials', neighborhood: 'Bandra West', city: 'Mumbai',
    tagline: 'The little things, sorted.', description: 'A friendly neighborhood market for pantry basics, fresh flowers, and those last-minute dinner ingredients.',
    imageUrl: photo('photo-1542838132-92c53300491e'), gallery: [photo('photo-1542838132-92c53300491e'), photo('photo-1543168256-418811576931')],
    rating: '4.8', reviewCount: 51, priceLabel: '₹₹', distanceLabel: '0.5 km away', highlights: ['Fresh produce', 'Open late', 'Local favorites'], accent: '#55DCC1',
  },
];

export const mockPlaceRepository: PlaceRepository = {
  async getAll() { return mockPlaces; },
  async getById(id) { return mockPlaces.find((place) => place.id === id); },
};
