import type { PlaceMood } from '@/features/places/domain/place';

export type HomeCollection = {
  id: string;
  title: string;
  subtitle: string;
  mood: PlaceMood;
  artwork: 'park' | 'market' | 'restaurant' | 'cafe';
  placeIds: string[];
};

export const homeCollections: HomeCollection[] = [
  { id: 'touch-grass', title: 'Touch Grass, Gurgaon Edition', subtitle: '4 green escapes', mood: 'nature', artwork: 'park', placeIds: ['leisure-valley', 'aravalli', 'sultanpur', 'damdama'] },
  { id: 'first-weekend', title: 'Weekend sorted?', subtitle: 'New in town starter pack', mood: 'explore', artwork: 'market', placeIds: ['galleria', 'leisure-valley', 'sadar', 'cyberhub'] },
  { id: 'laptop-band', title: 'Laptop band, plans on', subtitle: 'After office', mood: 'social', artwork: 'restaurant', placeIds: ['cyberhub', 's29-market', 'low-tide', 'pinwheel'] },
  { id: 'coffee-conv', title: 'Coffee ka plan?', subtitle: 'Slow tables, long chats', mood: 'chill', artwork: 'cafe', placeIds: ['second-draft', 'kettle', 'pinwheel'] },
  { id: 'beyond-cyberhub', title: 'Beyond CyberHub', subtitle: 'Old lanes, new corners', mood: 'explore', artwork: 'market', placeIds: ['sadar', 'clay-chai', 'mandi-fresh', 'galleria'] },
];
