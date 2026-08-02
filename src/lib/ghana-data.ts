// Ghana's 16 official regions and their Metropolitan, Municipal, and District Assemblies (MMDAs)
// Source: Ministry of Local Government & Rural Development, Ghana
// Future-proof: to add new districts, just add them to the array for the relevant region.

export type GhanaRegion = {
  name: string
  districts: string[]
}

export const GHANA_REGIONS: GhanaRegion[] = [
  {
    name: 'Greater Accra',
    districts: [
      'Accra Metropolitan',
      'Ada East',
      'Ada West',
      'Adenta Municipal',
      'Ashiaman Municipal',
      'Awutu Senya East (Kasoa)',
      'Ga Central Municipal',
      'Ga East Municipal',
      'Ga South Municipal',
      'Ga West Municipal',
      'Kpone Katamanso',
      'Krowor Municipal (Nungua)',
      'La Dade-Kotopon Municipal',
      'La Nkwantanang-Madina Municipal',
      'Ledzokuku-Krowor Municipal',
      'Ningo-Prampram',
      'Okaikwei North Municipal',
      'Shai Osudoku',
      'Tema Metropolitan',
      'Tema West Municipal',
      'Weija/Gbawe Municipal',
    ],
  },
  {
    name: 'Ashanti',
    districts: [
      'Adansi Asokwa',
      'Adansi North',
      'Adansi South',
      'Afigya Kwabre South',
      'Afigya-Kwabre North',
      'Ahafo Ano South West',
      'Ahafo Ano North',
      'Ahafo Ano South East',
      'Akrofuom',
      'Amansie Central',
      'Amansie South',
      'Amansie West',
      'Asante Akim Central',
      'Asante Akim North',
      'Asante Akim South',
      'Asokore Mampong Municipal',
      'Asunafo North',
      'Asunafo South',
      'Atwima Kwanwoma',
      'Atwima Nwabiagya Municipal',
      'Atwima Nwabiagya North',
      'Bekwai Municipal',
      'Bosome Freho',
      'Bosomtwe',
      'Ejisu Municipal',
      'Ejura-Sekyedumase',
      'Juaben Municipal',
      'Kumasi Metropolitan',
      'Kwabre East',
      'Kwadasa Municipal',
      'Mampong Municipal',
      'Obuasi East',
      'Obuasi Municipal',
      'Offinso North',
      'Offinso Municipal',
      'Oforikrom Municipal',
      'Old Tafo Municipal',
      'Sekyere Afram Plains',
      'Sekyere Central',
      'Sekyere East',
      'Sekyere Kumawu',
      'Suame Municipal',
    ],
  },
  {
    name: 'Western',
    districts: [
      'Ahanta West',
      'Amenfi East',
      'Amenfi Central',
      'Amenfi West',
      'Anomabo (Abura-Asebu-Kwamankese)',
      'Bia East',
      'Bia West',
      'Bodi',
      'Effia-Kwesimintsim Municipal',
      'Ellembele',
      'Jomoro',
      'Juaboso',
      'Mpohor',
      'Nzema East',
      'Prestea-Huni Valley',
      'Sekondi-Takoradi Metropolitan',
      'Tarkwa-Nsuaem Municipal',
      'Wassa Amenfi East',
      'Wassa Amenfi West',
      'Wassa East',
    ],
  },
  {
    name: 'Western North',
    districts: [
      'Aowin',
      'Bia East',
      'Bia West',
      'Bodi',
      'Juaboso',
      'Sekeyere',
      'Sefwi Akontombra',
      'Sefwi Wiawso Municipal',
      'Suaman',
      'Akontombra',
      'Bibiani-Anhwiaso-Bekwai',
    ],
  },
  {
    name: 'Central',
    districts: [
      'Abura-Asebu-Kwamankese',
      'Agona East',
      'Agona West Municipal',
      'Ajumako-Enyan-Essiam',
      'Asikuma-Odoben-Brakwa',
      'Assin Fosu Municipal',
      'Assin North',
      'Assin South',
      'Awutu Senya East',
      'Awutu Senya West',
      'Cape Coast Metropolitan',
      'Effutu Municipal',
      'Ekumfi',
      'Gomoa East',
      'Gomoa West',
      'Komenda-Edina-Eguafo-Abirem',
      'Mfantsiman Municipal',
      'Twifo-Ati-Morkwa',
      'Twifo-Heman-Lower-Denkyira',
    ],
  },
  {
    name: 'Eastern',
    districts: [
      'Achiase',
      'Akuapim North',
      'Akuapim South',
      'Akyemansa',
      'Asuogyaman',
      'Atiwa East',
      'Atiwa West',
      'Ayensuano',
      'Birim Central',
      'Birim North',
      'Birim South',
      'Denkyembour',
      'East Akim',
      'Fanteakwa North',
      'Fanteakwa South',
      'Kwaebibirem',
      'Kwahu Afram Plains North',
      'Kwahu Afram Plains South',
      'Kwahu East',
      'Kwahu South',
      'Kwahu West',
      'Lower Manya Krobo',
      'New Abirem',
      'Nsawam-Adoagyiri',
      'Suhum Municipal',
      'Upper Manya Krobo',
      'Upper West Akim',
      'West Akim',
      'Yilo Krobo',
    ],
  },
  {
    name: 'Volta',
    districts: [
      'Adaklu',
      'Afadzato South',
      'Agortime-Ziope',
      'Akatsi North',
      'Akatsi South',
      'Anloga',
      'Awgu',
      'Biakoye',
      'Central Tongu',
      'Ho Municipal',
      'Ho West',
      'Hohoe Municipal',
      'Kadjebi',
      'Keta Municipal',
      'Ketu North',
      'Ketu South',
      'Kpando Municipal',
      'Krachi East',
      'Krachi Nchumuru',
      'Krachi West',
      'North Dayi',
      'North Tongu',
      'Nkwanta North',
      'Nkwanta South',
      'South Dayi',
      'South Tongu',
      'Anfoeta',
    ],
  },
  {
    name: 'Oti',
    districts: [
      'Biakoye',
      'Jasikan',
      'Kadjebi',
      'Krachi East',
      'Krachi Nchumuru',
      'Krachi West',
      'Nkwanta North',
      'Nkwanta South',
    ],
  },
  {
    name: 'Bono',
    districts: [
      'Banda',
      'Berekum East',
      'Berekum West',
      'Dormaa East',
      'Dormaa West',
      'Jaman North',
      'Jaman South',
      'Sunyani Municipal',
      'Sunyani West',
      'Tain',
      'Wenchi Municipal',
    ],
  },
  {
    name: 'Bono East',
    districts: [
      'Atebubu-Amantin',
      'Kintampo North',
      'Kintampo South',
      'Nkoranza North',
      'Nkoranza South',
      'Pru East',
      'Pru West',
      'Sene East',
      'Sene West',
      'Techiman Municipal',
      'Techiman North',
    ],
  },
  {
    name: 'Ahafo',
    districts: [
      'Asunafo North',
      'Asunafo South',
      'Asutifi North',
      'Asutifi South',
      'Tano North',
      'Tano South',
    ],
  },
  {
    name: 'Northern',
    districts: [
      'Bole',
      'Bunkpurugu Nakpanduri',
      'Central Gonja',
      'East Gonja',
      'East Mamprusi',
      'Gushegu',
      'Karaga',
      'Kpandai',
      'Kumbungu',
      'Mion',
      'Nanton',
      'Nanumba North',
      'Nanumba South',
      'North East Gonja',
      'North Gonja',
      'Sagnarigu',
      'Savelugu',
      'Sawla-Tuna-Kalba',
      'Tamale Metropolitan',
      'Tatale-Sanguli',
      'Tolon',
      'West Gonja',
      'West Mamprusi',
      'Yendi Municipal',
    ],
  },
  {
    name: 'North East',
    districts: [
      'Bunkpurugu Nakpanduri',
      'Chereponi',
      'East Mamprusi',
      'Mamprugu Moagduri',
      'West Mamprusi',
      'Yunyoo-Nasuan',
    ],
  },
  {
    name: 'Savannah',
    districts: [
      'Bole',
      'Central Gonja',
      'East Gonja',
      'North East Gonja',
      'North Gonja',
      'Sawla-Tuna-Kalba',
      'West Gonja',
    ],
  },
  {
    name: 'Upper East',
    districts: [
      'Bawku Municipal',
      'Bawku West',
      'Binduri',
      'Bolgatanga East',
      'Bolgatanga Municipal',
      'Bongo',
      'Builsa North',
      'Builsa South',
      'Garu',
      'Kassena-Nankana East',
      'Kassena-Nankana West',
      'Nabdam',
      'Pusiga',
      'Talensi',
      'Tempane',
    ],
  },
  {
    name: 'Upper West',
    districts: [
      'Daffiama-Bussie-Issa',
      'Jirapa',
      'Lambussie',
      'Lawra',
      'Nadowli-Kaleo',
      'Nandom',
      'Sissala East',
      'Sissala West',
      'Wa East',
      'Wa Municipal',
      'Wa West',
    ],
  },
]

export const GHANA_REGION_NAMES = GHANA_REGIONS.map(r => r.name)

export function getDistrictsForRegion(regionName: string): string[] {
  return GHANA_REGIONS.find(r => r.name === regionName)?.districts ?? []
}

// Validate Ghana phone number
// Accepts: +233XXXXXXXXX, 233XXXXXXXXX, 0XXXXXXXXX (where X is digit, 9 digits after prefix)
// Ghana mobile numbers: 024, 025, 026, 027, 028, 029, 054, 055, 053, 057, 059
export function validateGhanaPhone(phone: string): { valid: boolean; normalized?: string; error?: string } {
  if (!phone) return { valid: false, error: 'Phone number is required' }
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Check valid Ghana mobile prefixes
  let normalized = digits
  let prefix = ''
  
  if (digits.startsWith('233') && digits.length === 12) {
    prefix = digits.slice(3, 5) // e.g. "24", "55"
    normalized = '0' + digits.slice(3)
  } else if (digits.startsWith('0') && digits.length === 10) {
    prefix = digits.slice(1, 3)
    normalized = digits
  } else if (digits.length === 9) {
    prefix = digits.slice(0, 2)
    normalized = '0' + digits
  } else {
    return { valid: false, error: 'Enter a valid Ghana mobile number (e.g. 0241234567 or +233241234567)' }
  }
  
  const validPrefixes = ['24', '25', '26', '27', '28', '29', '54', '55', '53', '57', '59', '20', '50', '51', '52', '56']
  if (!validPrefixes.includes(prefix)) {
    return { valid: false, error: 'Invalid Ghana mobile prefix. Valid prefixes: 024, 025, 026, 027, 054, 055, 057, 059' }
  }
  
  return { valid: true, normalized }
}

// Validate GhanaPost GPS digital address
// Format: XX-XXX-XXXX (e.g. GA-123-4567)
export function validateDigitalAddress(addr: string): { valid: boolean; error?: string } {
  if (!addr) return { valid: true } // optional field
  const pattern = /^[A-Z]{2}-\d{3,4}-\d{2,4}$/i
  if (!pattern.test(addr.trim())) {
    return { valid: false, error: 'Invalid format. Example: GA-123-4567' }
  }
  return { valid: true }
}
