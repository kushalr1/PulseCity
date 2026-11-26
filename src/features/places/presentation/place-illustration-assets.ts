// Generated static requires from the approved v2.3 illustration manifest.
// Require the logical .png name; Metro selects the available @3x density file.
export type IllustrationTheme = 'city' | 'winter';
export const placeIllustrations: Record<string, Record<IllustrationTheme, number>> = {
  'ambience': { city: require('../../../../assets/illustrations/places/city/ambience.png'), winter: require('../../../../assets/illustrations/places/winter/ambience.png') },
  'aravalli': { city: require('../../../../assets/illustrations/places/city/aravalli.png'), winter: require('../../../../assets/illustrations/places/winter/aravalli.png') },
  'circuit-doctor': { city: require('../../../../assets/illustrations/places/city/circuit-doctor.png'), winter: require('../../../../assets/illustrations/places/winter/circuit-doctor.png') },
  'clay-chai': { city: require('../../../../assets/illustrations/places/city/clay-chai.png'), winter: require('../../../../assets/illustrations/places/winter/clay-chai.png') },
  'cyberhub': { city: require('../../../../assets/illustrations/places/city/cyberhub.png'), winter: require('../../../../assets/illustrations/places/winter/cyberhub.png') },
  'daily-basket': { city: require('../../../../assets/illustrations/places/city/daily-basket.png'), winter: require('../../../../assets/illustrations/places/winter/daily-basket.png') },
  'damdama': { city: require('../../../../assets/illustrations/places/city/damdama.png'), winter: require('../../../../assets/illustrations/places/winter/damdama.png') },
  'fixpoint': { city: require('../../../../assets/illustrations/places/city/fixpoint.png'), winter: require('../../../../assets/illustrations/places/winter/fixpoint.png') },
  'galleria': { city: require('../../../../assets/illustrations/places/city/galleria.png'), winter: require('../../../../assets/illustrations/places/winter/galleria.png') },
  'green-crate': { city: require('../../../../assets/illustrations/places/city/green-crate.png'), winter: require('../../../../assets/illustrations/places/winter/green-crate.png') },
  'groom-room': { city: require('../../../../assets/illustrations/places/city/groom-room.png'), winter: require('../../../../assets/illustrations/places/winter/groom-room.png') },
  'ironline': { city: require('../../../../assets/illustrations/places/city/ironline.png'), winter: require('../../../../assets/illustrations/places/winter/ironline.png') },
  'kavach': { city: require('../../../../assets/illustrations/places/city/kavach.png'), winter: require('../../../../assets/illustrations/places/winter/kavach.png') },
  'kettle': { city: require('../../../../assets/illustrations/places/city/kettle.png'), winter: require('../../../../assets/illustrations/places/winter/kettle.png') },
  'leisure-valley': { city: require('../../../../assets/illustrations/places/city/leisure-valley.png'), winter: require('../../../../assets/illustrations/places/winter/leisure-valley.png') },
  'low-tide': { city: require('../../../../assets/illustrations/places/city/low-tide.png'), winter: require('../../../../assets/illustrations/places/winter/low-tide.png') },
  'mandi-fresh': { city: require('../../../../assets/illustrations/places/city/mandi-fresh.png'), winter: require('../../../../assets/illustrations/places/winter/mandi-fresh.png') },
  'medicorner': { city: require('../../../../assets/illustrations/places/city/medicorner.png'), winter: require('../../../../assets/illustrations/places/winter/medicorner.png') },
  'move-studio': { city: require('../../../../assets/illustrations/places/city/move-studio.png'), winter: require('../../../../assets/illustrations/places/winter/move-studio.png') },
  'neem': { city: require('../../../../assets/illustrations/places/city/neem.png'), winter: require('../../../../assets/illustrations/places/winter/neem.png') },
  'pinwheel': { city: require('../../../../assets/illustrations/places/city/pinwheel.png'), winter: require('../../../../assets/illustrations/places/winter/pinwheel.png') },
  's29-market': { city: require('../../../../assets/illustrations/places/city/s29-market.png'), winter: require('../../../../assets/illustrations/places/winter/s29-market.png') },
  'sadar': { city: require('../../../../assets/illustrations/places/city/sadar.png'), winter: require('../../../../assets/illustrations/places/winter/sadar.png') },
  'second-draft': { city: require('../../../../assets/illustrations/places/city/second-draft.png'), winter: require('../../../../assets/illustrations/places/winter/second-draft.png') },
  'studio-shear': { city: require('../../../../assets/illustrations/places/city/studio-shear.png'), winter: require('../../../../assets/illustrations/places/winter/studio-shear.png') },
  'sultanpur': { city: require('../../../../assets/illustrations/places/city/sultanpur.png'), winter: require('../../../../assets/illustrations/places/winter/sultanpur.png') },
};

export function getPlaceIllustrationSource(id: string, theme: IllustrationTheme): number | undefined {
  return placeIllustrations[id]?.[theme] ?? placeIllustrations[id]?.city;
}
