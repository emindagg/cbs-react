/**
 * Turkish Text Normalizer
 * Normalizes Turkish text for consistent matching
 */

const PROVINCE_ALIASES = new Map<string, string>([
  ['afyon', 'afyonkarahisar'],
  ['icel', 'mersin'],
  ['sanliurfa', 'şanlıurfa'],
  ['urfa', 'şanlıurfa'],
  ['kmaras', 'kahramanmaraş'],
  ['antep', 'gaziantep'],
  ['diyarbakir', 'diyarbakır'],
])

/**
 * Normalize Turkish text for consistent matching
 * - Lowercase
 * - Remove Turkish characters (ş→s, ğ→g, ç→c, ö→o, ü→u, ı→i)
 * - Remove dotted capital İ normalization (İ→i)
 * - Remove diacritics
 * - Remove non-alphanumeric characters
 * - Apply aliases (Afyon→Afyonkarahisar, Urfa→Şanlıurfa)
 *
 * @param text - Text to normalize
 * @param skipAliasCheck - Skip alias replacement (to avoid infinite loop)
 * @returns Normalized text
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

  // Alias check (with recursion prevention)
  if (!skipAliasCheck && PROVINCE_ALIASES.has(normalized)) {
    const aliasValue = PROVINCE_ALIASES.get(normalized)!
    return normalizeTurkishText(aliasValue, true)
  }

  return normalized
}

/**
 * Get province aliases map
 */
export function getProvinceAliases(): Map<string, string> {
  return new Map(PROVINCE_ALIASES)
}
