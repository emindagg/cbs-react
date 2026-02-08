/**
 * Turkish Text Normalizer
 * Normalizes Turkish text for consistent matching
 * Includes fuzzy matching with Levenshtein distance
 */

// ── Province Aliases ────────────────────────────────────────────
// Comprehensive alias list for all 81 provinces + common abbreviations
const PROVINCE_ALIASES = new Map<string, string>([
  // Kahramanmaraş variants
  ['kmaras', 'kahramanmaras'],
  ['maras', 'kahramanmaras'],
  ['kahramanmaras', 'kahramanmaras'],

  // Şanlıurfa variants
  ['urfa', 'sanliurfa'],
  ['surfa', 'sanliurfa'],

  // Afyonkarahisar variants
  ['afyon', 'afyonkarahisar'],

  // Mersin / İçel
  ['icel', 'mersin'],
  ['icel', 'mersin'],

  // Gaziantep variants
  ['antep', 'gaziantep'],
  ['gantep', 'gaziantep'],

  // İstanbul variants
  ['ist', 'istanbul'],
  ['istanbulili', 'istanbul'],

  // Hatay / Antakya
  ['antakya', 'hatay'],

  // Elazığ
  ['elazig', 'elazig'],

  // Eskişehir
  ['eskisehir', 'eskisehir'],

  // Kırşehir
  ['kirsehir', 'kirsehir'],

  // Zonguldak
  ['zonguldak', 'zonguldak'],

  // Bolu
  ['bolu', 'bolu'],

  // Düzce
  ['duzce', 'duzce'],

  // Osmaniye
  ['osmaniye', 'osmaniye'],

  // Kilis
  ['kilis', 'kilis'],
])

// ── Plate Code → Province Name Mapping (01-81) ────────────────
const PLATE_CODE_MAP = new Map<string, string>([
  ['01', 'adana'], ['02', 'adiyaman'], ['03', 'afyonkarahisar'], ['04', 'agri'],
  ['05', 'amasya'], ['06', 'ankara'], ['07', 'antalya'], ['08', 'artvin'],
  ['09', 'aydin'], ['10', 'balikesir'], ['11', 'bilecik'], ['12', 'bingol'],
  ['13', 'bitlis'], ['14', 'bolu'], ['15', 'burdur'], ['16', 'bursa'],
  ['17', 'canakkale'], ['18', 'cankiri'], ['19', 'corum'], ['20', 'denizli'],
  ['21', 'diyarbakir'], ['22', 'edirne'], ['23', 'elazig'], ['24', 'erzincan'],
  ['25', 'erzurum'], ['26', 'eskisehir'], ['27', 'gaziantep'], ['28', 'giresun'],
  ['29', 'gumushane'], ['30', 'hakkari'], ['31', 'hatay'], ['32', 'isparta'],
  ['33', 'mersin'], ['34', 'istanbul'], ['35', 'izmir'], ['36', 'kars'],
  ['37', 'kastamonu'], ['38', 'kayseri'], ['39', 'kirklareli'], ['40', 'kirsehir'],
  ['41', 'kocaeli'], ['42', 'konya'], ['43', 'kutahya'], ['44', 'malatya'],
  ['45', 'manisa'], ['46', 'kahramanmaras'], ['47', 'mardin'], ['48', 'mugla'],
  ['49', 'mus'], ['50', 'nevsehir'], ['51', 'nigde'], ['52', 'ordu'],
  ['53', 'rize'], ['54', 'sakarya'], ['55', 'samsun'], ['56', 'siirt'],
  ['57', 'sinop'], ['58', 'sivas'], ['59', 'tekirdag'], ['60', 'tokat'],
  ['61', 'trabzon'], ['62', 'tunceli'], ['63', 'sanliurfa'], ['64', 'usak'],
  ['65', 'van'], ['66', 'yozgat'], ['67', 'zonguldak'], ['68', 'aksaray'],
  ['69', 'bayburt'], ['70', 'karaman'], ['71', 'kirikkale'], ['72', 'batman'],
  ['73', 'sirnak'], ['74', 'bartin'], ['75', 'ardahan'], ['76', 'igdir'],
  ['77', 'yalova'], ['78', 'karabuk'], ['79', 'kilis'], ['80', 'osmaniye'],
  ['81', 'duzce'],
])

// ── Suffix patterns to strip from location names ───────────────
const LOCATION_SUFFIXES = [
  'ili', 'il', 'ilcesi', 'ilce', 'sehri', 'sehir',
  'province', 'city', 'district',
]

/**
 * Normalize Turkish text for consistent matching
 * - Lowercase
 * - Remove Turkish characters (ş→s, ğ→g, ç→c, ö→o, ü→u, ı→i)
 * - Remove dotted capital İ normalization (İ→i)
 * - Remove diacritics
 * - Remove non-alphanumeric characters
 * - Strip location suffixes (İli, İlçesi, Şehri)
 * - Apply aliases (Afyon→Afyonkarahisar, Urfa→Şanlıurfa)
 * - Check plate codes (34→İstanbul, 06→Ankara)
 */
export function normalizeTurkishText(
  text: string,
  skipAliasCheck = false,
): string {
  if (!text) return ''

  let normalized = text
    .toLowerCase()
    .trim()
    // Dotted capital İ normalization
    .replace(/i\u0307/g, 'i')
    .replace(/i̇/g, 'i')
    // Turkish ı → i
    .replace(/ı/g, 'i')
    // Circumflex characters
    .replace(/[â]/g, 'a')
    .replace(/[î]/g, 'i')
    .replace(/[û]/g, 'u')

  // Unicode NFD: separate diacritics
  try {
    normalized = normalized
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
  } catch (_e) {
    // Fallback if Unicode property escapes not supported
  }

  // Turkish special characters to ASCII
  normalized = normalized
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    // Remove non-alphanumeric characters
    .replace(/[^a-z0-9]/g, '')

  if (skipAliasCheck) return normalized

  // Check plate code mapping (e.g. "34" → "istanbul", "6" → "ankara")
  if (PLATE_CODE_MAP.has(normalized)) {
    return PLATE_CODE_MAP.get(normalized)!
  }
  // Zero-padded fallback: "6" → "06" → "ankara" (XLSX sends numbers without leading zeros)
  if (/^\d{1,2}$/.test(normalized)) {
    const padded = normalized.padStart(2, '0')
    if (PLATE_CODE_MAP.has(padded)) {
      return PLATE_CODE_MAP.get(padded)!
    }
  }

  // Strip common location suffixes (e.g. "ankaraili" → "ankara")
  for (const suffix of LOCATION_SUFFIXES) {
    if (normalized.endsWith(suffix) && normalized.length > suffix.length) {
      const stripped = normalized.slice(0, -suffix.length)
      // Only accept if stripped version is long enough to be a valid name
      if (stripped.length >= 2) {
        normalized = stripped
        break
      }
    }
  }

  // Alias check
  if (PROVINCE_ALIASES.has(normalized)) {
    return PROVINCE_ALIASES.get(normalized)!
  }

  return normalized
}

/**
 * Get province aliases map
 */
export function getProvinceAliases(): Map<string, string> {
  return new Map(PROVINCE_ALIASES)
}

// ── Plate Code → Display Name (Turkish) ─────────────────────────
const PLATE_DISPLAY_MAP = new Map<string, string>([
  ['01', 'Adana'], ['02', 'Adıyaman'], ['03', 'Afyonkarahisar'], ['04', 'Ağrı'],
  ['05', 'Amasya'], ['06', 'Ankara'], ['07', 'Antalya'], ['08', 'Artvin'],
  ['09', 'Aydın'], ['10', 'Balıkesir'], ['11', 'Bilecik'], ['12', 'Bingöl'],
  ['13', 'Bitlis'], ['14', 'Bolu'], ['15', 'Burdur'], ['16', 'Bursa'],
  ['17', 'Çanakkale'], ['18', 'Çankırı'], ['19', 'Çorum'], ['20', 'Denizli'],
  ['21', 'Diyarbakır'], ['22', 'Edirne'], ['23', 'Elazığ'], ['24', 'Erzincan'],
  ['25', 'Erzurum'], ['26', 'Eskişehir'], ['27', 'Gaziantep'], ['28', 'Giresun'],
  ['29', 'Gümüşhane'], ['30', 'Hakkari'], ['31', 'Hatay'], ['32', 'Isparta'],
  ['33', 'Mersin'], ['34', 'İstanbul'], ['35', 'İzmir'], ['36', 'Kars'],
  ['37', 'Kastamonu'], ['38', 'Kayseri'], ['39', 'Kırklareli'], ['40', 'Kırşehir'],
  ['41', 'Kocaeli'], ['42', 'Konya'], ['43', 'Kütahya'], ['44', 'Malatya'],
  ['45', 'Manisa'], ['46', 'Kahramanmaraş'], ['47', 'Mardin'], ['48', 'Muğla'],
  ['49', 'Muş'], ['50', 'Nevşehir'], ['51', 'Niğde'], ['52', 'Ordu'],
  ['53', 'Rize'], ['54', 'Sakarya'], ['55', 'Samsun'], ['56', 'Siirt'],
  ['57', 'Sinop'], ['58', 'Sivas'], ['59', 'Tekirdağ'], ['60', 'Tokat'],
  ['61', 'Trabzon'], ['62', 'Tunceli'], ['63', 'Şanlıurfa'], ['64', 'Uşak'],
  ['65', 'Van'], ['66', 'Yozgat'], ['67', 'Zonguldak'], ['68', 'Aksaray'],
  ['69', 'Bayburt'], ['70', 'Karaman'], ['71', 'Kırıkkale'], ['72', 'Batman'],
  ['73', 'Şırnak'], ['74', 'Bartın'], ['75', 'Ardahan'], ['76', 'Iğdır'],
  ['77', 'Yalova'], ['78', 'Karabük'], ['79', 'Kilis'], ['80', 'Osmaniye'],
  ['81', 'Düzce'],
])

/**
 * Get province display name by plate code
 * "06" → "Ankara", "6" → "Ankara"
 */
export function getProvinceByPlateCode(code: string | number): string | null {
  const padded = String(code).trim().padStart(2, '0')
  return PLATE_DISPLAY_MAP.get(padded) || null
}

/**
 * Get all plate codes with display names (for dropdowns/autocomplete)
 * Returns array of { code: "06", name: "Ankara" }
 */
export function getAllPlateCodesWithNames(): Array<{ code: string; name: string }> {
  return Array.from(PLATE_DISPLAY_MAP.entries()).map(([code, name]) => ({ code, name }))
}

// ── Levenshtein Distance ────────────────────────────────────────

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length

  if (m === 0) return n
  if (n === 0) return m

  // Use single-row DP for memory efficiency
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array<number>(n + 1)

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,      // insertion
        prev[j] + 1,          // deletion
        prev[j - 1] + cost,   // substitution
      )
    }
    ;[prev, curr] = [curr, prev]
  }

  return prev[n]
}

/**
 * Dynamic threshold based on text length
 */
function getMaxDistance(textLength: number): number {
  if (textLength <= 3) return 1
  if (textLength <= 6) return 2
  return 3
}

/**
 * Find the closest match from a set of known keys using fuzzy matching.
 * Returns the best match and its distance, or null if no good match found.
 *
 * Also checks if the input "contains" a known key or vice versa.
 */
export function findClosestMatch(
  input: string,
  knownKeys: string[],
): { key: string; distance: number } | null {
  if (!input || knownKeys.length === 0) return null

  const maxDist = getMaxDistance(input.length)
  let bestKey = ''
  let bestDist = Infinity

  for (const key of knownKeys) {
    // Exact match — skip fuzzy
    if (key === input) return { key, distance: 0 }

    // Contains check: "ankarail" contains "ankara", "merkez" in "merkezefendi"
    if (key.length >= 3 && input.includes(key)) {
      return { key, distance: 0 }
    }
    if (input.length >= 3 && key.includes(input)) {
      return { key, distance: 1 }
    }

    // Levenshtein distance
    const dist = levenshteinDistance(input, key)
    if (dist < bestDist) {
      bestDist = dist
      bestKey = key
    }
  }

  if (bestDist <= maxDist) {
    return { key: bestKey, distance: bestDist }
  }

  return null
}
