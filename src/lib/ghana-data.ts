// Ghana geographic data: 16 regions + all MMDAs (districts) per region
// Source: Ghana Ministry of Local Government & Rural Development
// Future-proof: to add new districts, just update this object.

export const GHANA_REGIONS = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
] as const

export type GhanaRegion = typeof GHANA_REGIONS[number]

// All Metropolitan, Municipal and District Assemblies (MMDAs) by region
// Organized as a Record for O(1) lookup; easy to extend.
export const GHANA_DISTRICTS: Record<string, string[]> = {
  Ahafo: ['Asunafo North', 'Asunafo South', 'Asutifi North', 'Asutifi South', 'Tano North', 'Tano South'],
  Ashanti: [
    'Adansi Asokwa', 'Adansi North', 'Adansi South', 'Afigya Kwabre North', 'Afigya Kwabre South',
    'Ahafo Ano South West', 'Ahafo Ano North', 'Ahafo Ano South East', 'Amansie Central', 'Amansie South',
    'Amansie West', 'Asante Akim Central', 'Asante Akim North', 'Asante Akim South', 'Asokore Mampong',
    'Atwima Kwanwoma', 'Atwima Nwabiagya', 'Atwima Nwabiagya North', 'Bekwai', 'Bosome Freho',
    'Bosomtwe', 'Ejura-Sekyedumase', 'Ejisu', 'Juaben', 'Kumasi',
    'Kwabre East', 'Kwadaso', 'Mampong', 'Obuasi', 'Offinso',
    'Offinso North', 'Oforikrom', 'Old Tafo', 'Phyinaase', 'Sekyere Afram Plains',
    'Sekyere Central', 'Sekyere East', 'Sekyere Kumawu', 'Sekyere South', 'Suame',
  ],
  Bono: ['Banda', 'Berekum', 'Berekum East', 'Dormaa Central', 'Dormaa East', 'Dormaa West', 'Jaman North', 'Jaman South', 'Sunyani', 'Sunyani West', 'Tain', 'Wenchi'],
  'Bono East': ['Atebubu-Amantin', 'Banda', 'Bonte East', 'Kintampo North', 'Kintampo South', 'Nkoranza North', 'Nkoranza South', 'Pru', 'Pru East', 'Pru West', 'Sene East', 'Sene West', 'Techiman', 'Techiman North'],
  Central: [
    'Abura-Asebu-Kwamankese', 'Agona East', 'Agona West', 'Ajumako-Enyan-Esiam', 'Asikuma-Odoben-Brakwa',
    'Assin Fosu', 'Assin North', 'Assin South', 'Awutu Senya', 'Awutu Senya East', 'Birim Central',
    'Birim South', 'Cape Coast', 'Commenda', 'Dunkwa-on-Offin', 'Effutu',
    'Ekumfi', 'Gomoa East', 'Gomoa West', 'Komenda-Edina-Eguafo-Abirem', 'Kwahu East',
    'Mfantsiman', 'Nsawam-Adoagyiri', 'Nyakrom', 'Obuasi East', 'Saltpond',
    'Twifo-Atti Morkwa', 'Twifo-Hemang-Lower Denkyira', 'Upper Denkyira East', 'Upper Denkyira West',
  ],
  Eastern: [
    'Achiase', 'Akwapim North', 'Akwapim South', 'Akyemansa', 'Asuogyaman', 'Atiwa', 'Atiwa East',
    'Atiwa West', 'Ayensuano', 'Birim Central', 'Birim North', 'Birim South', 'Denkyembour',
    'East Akim', 'Fanteakwa', 'Fanteakwa South', 'Kwaebibirem', 'Kwahu Afram Plains North',
    'Kwahu Afram Plains South', 'Kwahu East', 'Kwahu South', 'Kwahu West', 'Kwabibirem',
    'Lower Manya', 'Lower West Akim', 'Nsawam-Adoagyiri', 'New Abirem', 'Suhum',
    'Upper Manya', 'Upper West Akim', 'West Akim', 'Yilo Krobo',
  ],
  'Greater Accra': [
    'Accra', 'Ada', 'Ada East', 'Ada West', 'Adenta', 'Ashaiman', 'Awutu Senya', 'Ga Central',
    'Ga East', 'Ga North', 'Ga South', 'Ga West', 'Kpone-Katamanso', 'Krowor', 'La',
    'La Dade-Kotopon', 'La Nkwantanang-Madina', 'Ledzokuku', 'Ningo-Prampram', 'Okaikwei North',
    'Shai-Osudoku', 'Tema', 'Tema West', 'Weija-Gbawe',
  ],
  'North East': ['Bunkpurugu-Nakpanduri', 'Chereponi', 'East Mamprusi', 'Mamprugu-Moaduri', 'West Mamprusi', 'Yunyoro-Nasuan'],
  Northern: [
    'Bole', 'Bunkpurugu-Yonyo', 'Central Gonja', 'East Gonja', 'East Mamprusi', 'Gushiegu',
    'Karaga', 'Kpandai', 'Kumbungu', 'Mamprusi', 'Mion', 'Nanton', 'Nanumba North', 'Nanumba South',
    'North East Gonja', 'North Gonja', 'Saboba', 'Sagnerigu', 'Savelugu', 'Sawla-Tuna-Kalba',
    'Sagnarigu', 'Tamale', 'Tatale-Sangule', 'Tolon', 'West Gonja', 'West Mamprusi', 'Yendi',
  ],
  Oti: ['Biakoye', 'Jasikan', 'Kadjebi', 'Krachi East', 'Krachi Nchumuru', 'Krachi West', 'Nkwanta North', 'Nkwanta South'],
  Savannah: ['Bole', 'Central Gonja', 'East Gonja', 'North East Gonja', 'North Gonja', 'Sawla-Tuna-Kalba', 'West Gonja'],
  'Upper East': [
    'Bawku', 'Bawku West', 'Binduri', 'Bolgatanga', 'Bolgatanga East', 'Bongo', 'Builsa North',
    'Builsa South', 'Garu', 'Kassena-Nankana', 'Kassena-Nankana West', 'Nabdam', 'Pusiga',
    'Talensi', 'Tempane', 'Wa East', 'Wa West',
  ],
  'Upper West': ['Daffiama-Bussie-Issa', 'Jirapa', 'Lambussie', 'Lawra', 'Nadowli-Kaleo', 'Nandom', 'Sissala East', 'Sissala West', 'Wa', 'Wa East', 'Wa West'],
  Volta: [
    'Agortime-Ziope', 'Akatsi North', 'Akatsi South', 'Anloga', 'Awgu', 'Central Tongu', 'Ho',
    'Ho West', 'Hohoe', 'Kadjebi', 'Keta', 'Ketu North', 'Ketu South', 'Kpando', 'Krachi East',
    'Krachi Nchumuru', 'Krachi West', 'North Dayi', 'Nkwanta North', 'Nkwanta South', 'South Dayi',
    'South Tongu', 'Adaklu', 'Afadjato South', 'Anfo', 'Ave', 'Biakoye', 'Jasikan',
  ],
  Western: [
    'Ahanta West', 'Amenfi Central', 'Amenfi East', 'Amenfi West', 'Ankomu', 'Aowin', 'Bia East',
    'Bia West', 'Bodi', 'Ellembelle', 'Jomoro', 'Juaboso', 'Mpohor', 'Nzema East', 'Prestea-Huni Valley',
    'Sefwi Akontombra', 'Sefwi Wiawso', 'Shama', 'Takoradi', 'Tarkwa-Nsuaem', 'Wassa Amenfi East',
    'Wassa Amenfi West', 'Wassa East',
  ],
  'Western North': ['Aowin', 'Bia East', 'Bia West', 'Bodi', 'Juaboso', 'Sefwi Akontombra', 'Sefwi Wiawso', 'Suaman', 'Wasaa Amenfi West'],
}

// Validate Ghana phone number
// Accepts formats: 0244123456, +233244123456, 233244123456
// Ghana mobile prefixes: 020, 023, 024, 025, 026, 027, 028, 029, 050, 051, 052, 053, 054, 055, 056, 057, 059
export function validateGhanaPhone(phone: string): { valid: boolean; normalized?: string; error?: string } {
  if (!phone) return { valid: false, error: 'Phone number is required.' }
  const cleaned = phone.replace(/[\s\-()]/g, '')
  // Normalize: convert +233 or 233 prefix to 0
  let normalized = cleaned
  if (normalized.startsWith('+233')) normalized = '0' + normalized.slice(4)
  else if (normalized.startsWith('233')) normalized = '0' + normalized.slice(3)

  // Must be 10 digits starting with 0
  if (!/^0\d{9}$/.test(normalized)) {
    return { valid: false, error: 'Phone number must be 10 digits (e.g. 0244123456).' }
  }
  // Valid Ghana mobile prefixes
  const validPrefixes = ['020', '023', '024', '025', '026', '027', '028', '029', '050', '051', '052', '053', '054', '055', '056', '057', '059']
  const prefix = normalized.slice(0, 3)
  if (!validPrefixes.includes(prefix)) {
    return { valid: false, error: `Invalid Ghana mobile prefix (${prefix}). Use 024, 025, 026, 027, 029, 054, 055, etc.` }
  }
  return { valid: true, normalized }
}

// Validate GhanaPost GPS digital address format: e.g. GA-123-4567
export function validateDigitalAddress(addr: string): { valid: boolean; error?: string } {
  if (!addr) return { valid: true } // optional
  const cleaned = addr.trim().toUpperCase()
  // Format: 2-3 letters, hyphen, 3-4 digits, hyphen, 3-4 digits
  if (!/^[A-Z]{2,3}-\d{3,4}-\d{3,4}$/.test(cleaned)) {
    return { valid: false, error: 'Digital address must be in format GA-123-4567.' }
  }
  return { valid: true }
}

// Get districts for a region (empty array if region not found)
export function getDistrictsForRegion(region: string): string[] {
  return GHANA_DISTRICTS[region] ?? []
}

// All specialties for the signup dropdown
export const SPECIALTIES = [
  'Emergency Medicine',
  'Internal Medicine',
  'Cardiology',
  'ICU Nursing',
  'Pediatric Nursing',
  'Anesthesiology',
  'Family Medicine',
  'Diagnostic Radiology',
  'Obstetrics & Gynecology',
  'Physiotherapy',
  'Pharmacy',
  'Geriatrics',
  'Psychology',
  'Surgery',
  'Orthopaedics',
  'General Practice',
  'Pediatrics',
  'Dermatology',
  'Neurology',
  'Oncology',
  'Psychiatry',
  'Pathology',
  'Nephrology',
  'Endocrinology',
  'Gastroenterology',
  'Pulmonology',
  'Rheumatology',
  'Urology',
  'ENT (Otolaryngology)',
  'Ophthalmology',
  'Dentistry',
  'Radiography',
  'Medical Laboratory Science',
  'Nutrition & Dietetics',
  'Occupational Therapy',
  'Speech Therapy',
  'Midwifery',
  'Community Health',
  'Health Administration',
  'Other',
] as const
