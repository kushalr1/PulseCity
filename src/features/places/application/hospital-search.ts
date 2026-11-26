import type { VerifiedHospital } from '@/features/places/domain/hospital';

function normalize(value: string) {
  return value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

const petHospitalPhrases = ['animal hospital', 'pet clinic', 'pet doctor', 'veterinary', 'vet'];

export function searchHospitals(query: string, hospitals: VerifiedHospital[]) {
  const normalized = normalize(query);
  if (!normalized) return hospitals;
  if (petHospitalPhrases.some((phrase) => normalized.includes(phrase))) return [];
  if (normalized === 'hospital' || normalized === 'hospitals' || normalized.includes('emergency')) return hospitals;

  const nameMatches = hospitals
    .map((hospital, index) => ({ hospital, index, name: normalize(hospital.name) }))
    .filter(({ name }) => name.includes(normalized))
    .sort((left, right) => Number(!left.name.startsWith(normalized)) - Number(!right.name.startsWith(normalized)) || left.index - right.index)
    .map(({ hospital }) => hospital);
  if (nameMatches.length) return nameMatches;
  if (normalized.split(' ').includes('hospital')) return hospitals;
  return [];
}
