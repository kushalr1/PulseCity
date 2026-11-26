import type { VerifiedHospital } from '@/features/places/domain/hospital';

/** User-supplied verified Gurugram hospital data. No coordinates are available. */
export const verifiedHospitals: VerifiedHospital[] = [
  {
    id: 'medanta-medicity',
    name: 'Medanta – The Medicity',
    area: 'Sector 38',
    address: 'CH Baktawar Singh Road, Sector 38, Gurugram, Haryana 122001',
    directionsQuery: 'Medanta The Medicity, Sector 38, Gurugram',
    sources: [
      'https://www.in.emb-japan.go.jp/PDF/Medanta%20THE%20MEDICITY.pdf',
      'https://www.magazine.medicaltourism.com/article/comprehensive-review-of-medanta-the-medicity-gurgaon',
    ],
    verifiedOn: '2026-11-24',
  },
  {
    id: 'fortis-fmri',
    name: 'Fortis Memorial Research Institute',
    area: 'Sector 44',
    address: 'Sector 44, Opposite HUDA City Centre, Gurugram, Haryana 122002',
    directionsQuery: 'Fortis Memorial Research Institute, Sector 44, Gurugram',
    sources: [
      'https://www.fortishealthcare.com/lp/fortis-gurugram-appointment',
      'https://housing.com/news/all-about-fortis-hospital-gurgaon',
    ],
    verifiedOn: '2026-11-24',
  },
  {
    id: 'artemis',
    name: 'Artemis Hospital',
    area: 'Sector 51',
    address: 'Sector 51, Gurugram, Haryana 122001',
    directionsQuery: 'Artemis Hospital, Sector 51, Gurugram',
    sources: [
      'https://www.in.emb-japan.go.jp/PDF/Artemis_20170315.pdf',
      'https://portal.nabh.co/Documents/AccreditedList/Hospitals/H-2010-0041_5th%20Edition_Name%20Change.pdf',
    ],
    verifiedOn: '2026-11-24',
  },
  {
    id: 'max-gurugram',
    name: 'Max Hospital, Gurugram',
    area: 'Sector 43 (Sushant Lok 1)',
    address: 'B Block, Sushant Lok 1, MF Husain Marg, near HUDA City Centre, Sector 43, Gurugram, Haryana 122001',
    directionsQuery: 'Max Hospital, Sushant Lok 1, Gurugram',
    sources: [
      'https://www.maxhealthcare.in/gurugram/hospital/best-stress-management-hospital-gurugram',
      'https://www.americanexpress.com/content/dam/amex/in/benefits/List_of_Locations_Max.pdf',
    ],
    verifiedOn: '2026-11-24',
  },
  {
    id: 'paras-gurugram',
    name: 'Paras Hospitals, Gurugram',
    area: 'Sector 43 (Sushant Lok Phase 1)',
    address: 'C-1, Sushant Lok Phase 1, Sector 43, Gurugram, Haryana 122002',
    directionsQuery: 'Paras Hospitals, Sushant Lok Phase 1, Gurugram',
    sources: [
      'https://parashospitals.com/our-achievements',
      'https://cghshospitals.com/facility/paras-hospital-4051',
    ],
    verifiedOn: '2026-11-24',
  },
  {
    id: 'civil-hospital-sector-10',
    name: 'Civil Hospital, Sector 10 (Government)',
    area: 'Sector 10',
    address: 'Basai Road, Sector 10, Gurugram, Haryana',
    directionsQuery: 'Civil Hospital Sector 10, Basai Road, Gurugram',
    sources: [
      'https://www.tribuneindia.com/news/haryana/gurugram-gets-administrative-financial-approval-for-872-bed-civil-hospital',
      'https://www.publicservicesmap.in/hospitals/centre/civil-hospital-sector-10-gurugram-gurugram-haryana-hosp6g03426',
    ],
    verifiedOn: '2026-11-24',
  },
];
