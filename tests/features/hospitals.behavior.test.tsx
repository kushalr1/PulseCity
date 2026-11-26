import { describe, expect, test } from '@jest/globals';
import { verifiedHospitals } from '@/data/verified-hospitals';
import { searchHospitals } from '@/features/places/application/hospital-search';
import { hospitalDirectionsUrl } from '@/features/places/application/hospital-directions';

describe('verified Gurugram hospitals', () => {
  test('stores only user-supplied fields and no coordinates', () => {
    expect(verifiedHospitals).toHaveLength(6);
    expect(verifiedHospitals.map(({ name }) => name)).toEqual([
      'Medanta – The Medicity',
      'Fortis Memorial Research Institute',
      'Artemis Hospital',
      'Max Hospital, Gurugram',
      'Paras Hospitals, Gurugram',
      'Civil Hospital, Sector 10 (Government)',
    ]);
    for (const hospital of verifiedHospitals) {
      expect(Object.keys(hospital).sort()).toEqual(['address', 'area', 'directionsQuery', 'id', 'name', 'sources', 'verifiedOn'].sort());
      expect(hospital.verifiedOn).toBe('2026-11-24');
      expect(hospital).not.toHaveProperty('latitude');
      expect(hospital).not.toHaveProperty('longitude');
      expect(hospital).not.toHaveProperty('phone');
      expect(hospital).not.toHaveProperty('hours');
      expect(hospital).not.toHaveProperty('rating');
    }
  });

  test('hospital and emergency searches return all hospitals; names return their matching record', () => {
    expect(searchHospitals('hospital', verifiedHospitals).map(({ id }) => id)).toEqual(verifiedHospitals.map(({ id }) => id));
    expect(searchHospitals('emergency', verifiedHospitals).map(({ id }) => id)).toEqual(verifiedHospitals.map(({ id }) => id));
    expect(searchHospitals('medanta the medicity', verifiedHospitals).map(({ id }) => id)).toEqual(['medanta-medicity']);
    expect(searchHospitals('Fortis Memorial Research Institute', verifiedHospitals).map(({ id }) => id)).toEqual(['fortis-fmri']);
  });

  test('directions hand off using the supplied directionsQuery', () => {
    expect(hospitalDirectionsUrl('ios', 'Fortis Memorial Research Institute, Sector 44, Gurugram'))
      .toBe('https://maps.apple.com/?daddr=Fortis%20Memorial%20Research%20Institute%2C%20Sector%2044%2C%20Gurugram');
    expect(hospitalDirectionsUrl('android', 'Medanta The Medicity, Sector 38, Gurugram'))
      .toBe('https://www.google.com/maps/dir/?api=1&destination=Medanta%20The%20Medicity%2C%20Sector%2038%2C%20Gurugram');
  });
});
