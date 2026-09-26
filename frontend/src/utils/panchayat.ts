import type { Language } from '@/types'
import type { SelectedLocation } from '@/components/farmer/LocationSearchModal'

// Translations for standard panchayats, blocks, and districts
export const PANCHAYAT_TRANSLATIONS: Record<string, { hi: string; mr: string; en: string; block: string; block_mr: string; block_en: string; lgd?: string }> = {
  'dhapewada': {
    hi: 'धापेवाड़ा',
    mr: 'धापेवाडा',
    en: 'Dhapewada',
    block: 'कलमेश्वर',
    block_mr: 'कळमेश्वर',
    block_en: 'Kalmeshwar',
    lgd: '184592',
  },
  'mohpa': {
    hi: 'मोहपा',
    mr: 'मोहपा',
    en: 'Mohpa',
    block: 'कलमेश्वर',
    block_mr: 'कळमेश्वर',
    block_en: 'Kalmeshwar',
    lgd: '184598',
  },
  'ubali': {
    hi: 'उबाली',
    mr: 'उबाळी',
    en: 'Ubali',
    block: 'कलमेश्वर',
    block_mr: 'कळमेश्वर',
    block_en: 'Kalmeshwar',
    lgd: '184605',
  },
  'kalmeshwar': {
    hi: 'कलमेश्वर',
    mr: 'कळमेश्वर',
    en: 'Kalmeshwar',
    block: 'कलमेश्वर',
    block_mr: 'कळमेश्वर',
    block_en: 'Kalmeshwar',
    lgd: '184590',
  },
  'bokhara': {
    hi: 'बोखरा',
    mr: 'बोखरा',
    en: 'Bokhara',
    block: 'कलमेश्वर',
    block_mr: 'कळमेश्वर',
    block_en: 'Kalmeshwar',
    lgd: '184612',
  },
  'ghoghali': {
    hi: 'घोघली',
    mr: 'घोगळी',
    en: 'Ghoghali',
    block: 'कलमेश्वर',
    block_mr: 'कळमेश्वर',
    block_en: 'Kalmeshwar',
    lgd: '184615',
  },
  'kalamna': {
    hi: 'कलमना',
    mr: 'कळमना',
    en: 'Kalamna',
    block: 'नागपुर ग्रामीण',
    block_mr: 'नागपूर ग्रामीण',
    block_en: 'Nagpur Rural',
    lgd: '184720',
  },
  'umred': {
    hi: 'उमरेड',
    mr: 'उमरेड',
    en: 'Umred',
    block: 'उमरेड',
    block_mr: 'उमरेड',
    block_en: 'Umred',
    lgd: '184850',
  },
  'katol': {
    hi: 'काटोल',
    mr: 'काटोल',
    en: 'Katol',
    block: 'काटोल',
    block_mr: 'काटोल',
    block_en: 'Katol',
    lgd: '184910',
  },
  'ramtek': {
    hi: 'रामटेक',
    mr: 'रामटेक',
    en: 'Ramtek',
    block: 'रामटेक',
    block_mr: 'रामटेक',
    block_en: 'Ramtek',
    lgd: '185030',
  },
  'hingna': {
    hi: 'हिंगणा',
    mr: 'हिंगणा',
    en: 'Hingna',
    block: 'हिंगणा',
    block_mr: 'हिंगणा',
    block_en: 'Hingna',
    lgd: '185140',
  },
}

export interface PanchayatDetails {
  panchayatName: string
  blockName: string
  districtName: string
  stateName: string
  lgdCode: string
  isGramPanchayat: boolean
  navLabel: string
  heroTitle: string
}

export function resolvePanchayatDetails(
  selectedLoc?: SelectedLocation | null,
  farmerData?: any,
  lang: Language = 'hi'
): PanchayatDetails {
  // Determine raw panchayat name
  const rawPanchayat =
    selectedLoc?.panchayat ||
    (selectedLoc?.is_panchayat ? selectedLoc?.name : '') ||
    farmerData?.panchayat_name ||
    farmerData?.panchayat ||
    selectedLoc?.name ||
    'Dhapewada'

  const normalized = rawPanchayat.toLowerCase().trim()
  const match = PANCHAYAT_TRANSLATIONS[normalized]

  let pName = rawPanchayat
  let bName = selectedLoc?.block || farmerData?.block || 'Kalmeshwar'
  let dName = selectedLoc?.district || farmerData?.district || 'Nagpur'
  let sName = selectedLoc?.state || farmerData?.state || 'Maharashtra'
  let lgd = match?.lgd || (selectedLoc?.panchayat_id ? `LGD: ${184590 + selectedLoc.panchayat_id}` : '184592')

  if (match) {
    pName = lang === 'en' ? match.en : lang === 'mr' ? match.mr : match.hi
    bName = lang === 'en' ? match.block_en : lang === 'mr' ? match.block_mr : match.block
  } else {
    // If raw name matches common dev values
    if (normalized.includes('dhapewada') || normalized.includes('धापेवा')) {
      pName = lang === 'en' ? 'Dhapewada' : lang === 'mr' ? 'धापेवाडा' : 'धापेवाड़ा'
      bName = lang === 'en' ? 'Kalmeshwar' : lang === 'mr' ? 'कळमेश्वर' : 'कलमेश्वर'
    } else if (normalized.includes('kalmeshwar') || normalized.includes('कलमेश्वर') || normalized.includes('कळमेश्वर')) {
      pName = lang === 'en' ? 'Kalmeshwar' : lang === 'mr' ? 'कळमेश्वर' : 'कलमेश्वर'
      bName = pName
    }
  }

  // District translation
  const dNorm = dName.toLowerCase().trim()
  if (dNorm.includes('nagpur') || dNorm.includes('नागपुर') || dNorm.includes('नागपूर')) {
    dName = lang === 'en' ? 'Nagpur' : lang === 'mr' ? 'नागपूर' : 'नागपुर'
  }

  // State translation
  const sNorm = sName.toLowerCase().trim()
  if (sNorm.includes('maharashtra') || sNorm.includes('महाराष्ट्र')) {
    sName = lang === 'en' ? 'Maharashtra' : 'महाराष्ट्र'
  }

  // Nav label (compact)
  const navPrefix = lang === 'en' ? '🏛️ GP:' : '🏛️ ग्रा.पं.'
  const navLabel = `${navPrefix} ${pName} · ${dName}`

  // Hero title
  const heroPrefix = lang === 'en' ? 'Gram Panchayat' : lang === 'mr' ? 'ग्रामपंचायत' : 'ग्राम पंचायत'
  const heroTitle = `${heroPrefix} ${pName}`

  return {
    panchayatName: pName,
    blockName: bName,
    districtName: dName,
    stateName: sName,
    lgdCode: lgd,
    isGramPanchayat: true,
    navLabel,
    heroTitle,
  }
}
