export type HomeEvent = {
  id: string;
  title: string;
  category: string;
  venue: string;
  daysFromNow: number;
  time: string;
  description: string;
  illustration: 'music' | 'workshop' | 'comedy';
};

export const homeEvents: HomeEvent[] = [
  { id: 'acoustic', title: 'Acoustic Evenings', category: 'Music', venue: 'Low Tide Listening Room', daysFromNow: 3, time: '8:00 PM', description: 'Two short acoustic sets and a vinyl hour in between.', illustration: 'music' },
  { id: 'clay-night', title: 'Clay & Chai: Beginner Wheel Night', category: 'Workshop', venue: 'Clay & Chai Studio', daysFromNow: 0, time: '7:00 PM', description: 'A first-timer session on the pottery wheel.', illustration: 'workshop' },
  { id: 'open-mic', title: 'Open Mic Comedy Night', category: 'Comedy', venue: 'Pinwheel Game Café', daysFromNow: 1, time: '8:30 PM', description: 'Five-minute sets from new comics between board-game tables.', illustration: 'comedy' },
];

export function getUpcomingHomeEvents(events: HomeEvent[], limit = 3) {
  return events
    .filter((event) => event.daysFromNow >= 0)
    .sort((left, right) => left.daysFromNow - right.daysFromNow)
    .slice(0, limit);
}

export function eventDateLabel(daysFromNow: number) {
  if (daysFromNow === 0) return 'Today';
  if (daysFromNow === 1) return 'Tomorrow';
  return `In ${daysFromNow} days`;
}
