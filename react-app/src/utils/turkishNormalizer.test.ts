import { describe, it, expect } from 'vitest'

import {
  normalizeTurkishText,
  getPlateCodeByName,
  getProvinceByPlateCode,
  findClosestMatch,
} from './turkishNormalizer'

describe('turkishNormalizer', () => {
  describe('normalizeTurkishText', () => {
    it('should convert to lowercase', () => {
      expect(normalizeTurkishText('ANKARA')).toBe('ankara')
      expect(normalizeTurkishText('İSTANBUL')).toBe('istanbul')
    })

    it('should normalize Turkish characters', () => {
      expect(normalizeTurkishText('Şanlıurfa')).toBe('sanliurfa')
      expect(normalizeTurkishText('Çankırı')).toBe('cankiri')
      expect(normalizeTurkishText('Ağrı')).toBe('agri')
      expect(normalizeTurkishText('Muğla')).toBe('mugla')
      expect(normalizeTurkishText('Kütahya')).toBe('kutahya')
    })

    it('should handle dotted capital İ', () => {
      expect(normalizeTurkishText('İstanbul')).toBe('istanbul')
      expect(normalizeTurkishText('İzmir')).toBe('izmir')
    })

    it('should remove non-alphanumeric characters', () => {
      expect(normalizeTurkishText('Ankara-İli')).toBe('ankara')
      expect(normalizeTurkishText('İstanbul (Merkez)')).toBe('istanbulmerkez')
    })

    it('should strip location suffixes', () => {
      expect(normalizeTurkishText('Ankara İli')).toBe('ankara')
      expect(normalizeTurkishText('Ankara Şehri')).toBe('ankara')
      expect(normalizeTurkishText('Merkez İlçesi')).toBe('merkez')
    })

    it('should handle plate codes', () => {
      expect(normalizeTurkishText('06')).toBe('ankara')
      expect(normalizeTurkishText('34')).toBe('istanbul')
      expect(normalizeTurkishText('6')).toBe('ankara') // Without leading zero
    })

    it('should apply aliases', () => {
      expect(normalizeTurkishText('Afyon')).toBe('afyonkarahisar')
      expect(normalizeTurkishText('Antep')).toBe('gaziantep')
      expect(normalizeTurkishText('Urfa')).toBe('sanliurfa')
      expect(normalizeTurkishText('Maraş')).toBe('kahramanmaras')
    })

    it('should handle empty string', () => {
      expect(normalizeTurkishText('')).toBe('')
    })

    it('should handle whitespace', () => {
      expect(normalizeTurkishText('  Ankara  ')).toBe('ankara')
    })

    it('should handle mixed case', () => {
      expect(normalizeTurkishText('AnKaRa')).toBe('ankara')
      expect(normalizeTurkishText('İsTaNbUl')).toBe('istanbul')
    })

    it('should handle circumflex characters', () => {
      expect(normalizeTurkishText('Kâhta')).toBe('kahta')
      expect(normalizeTurkishText('Paşaköy')).toBe('pasakoy')
    })

    it('should skip alias check when requested', () => {
      const result = normalizeTurkishText('Antep', true)
      expect(result).toBe('antep') // Not converted to gaziantep
    })
  })

  describe('getPlateCodeByName', () => {
    it('should return plate code for province name', () => {
      expect(getPlateCodeByName('Ankara')).toBe('06')
      expect(getPlateCodeByName('İstanbul')).toBe('34')
      expect(getPlateCodeByName('Gaziantep')).toBe('27')
    })

    it('should handle aliases', () => {
      expect(getPlateCodeByName('Antep')).toBe('27')
      expect(getPlateCodeByName('Afyon')).toBe('03')
      expect(getPlateCodeByName('Urfa')).toBe('63')
    })

    it('should handle already plate codes', () => {
      expect(getPlateCodeByName('06')).toBe('06')
      expect(getPlateCodeByName('6')).toBe('06') // Pad with zero
      expect(getPlateCodeByName('34')).toBe('34')
    })

    it('should return null for unknown names', () => {
      expect(getPlateCodeByName('Unknown')).toBeNull()
      expect(getPlateCodeByName('XYZ')).toBeNull()
    })

    it('should return null for empty string', () => {
      expect(getPlateCodeByName('')).toBeNull()
    })

    it('should handle Turkish characters', () => {
      expect(getPlateCodeByName('Şanlıurfa')).toBe('63')
      expect(getPlateCodeByName('Çankırı')).toBe('18')
    })

    it('should be case insensitive', () => {
      expect(getPlateCodeByName('ankara')).toBe('06')
      expect(getPlateCodeByName('ANKARA')).toBe('06')
      expect(getPlateCodeByName('AnKaRa')).toBe('06')
    })
  })

  describe('getProvinceByPlateCode', () => {
    it('should return province name for plate code', () => {
      expect(getProvinceByPlateCode('06')).toBe('Ankara')
      expect(getProvinceByPlateCode('34')).toBe('İstanbul')
      expect(getProvinceByPlateCode('27')).toBe('Gaziantep')
    })

    it('should handle numeric input', () => {
      expect(getProvinceByPlateCode(6)).toBe('Ankara')
      expect(getProvinceByPlateCode(34)).toBe('İstanbul')
    })

    it('should pad single digit codes', () => {
      expect(getProvinceByPlateCode('6')).toBe('Ankara')
      expect(getProvinceByPlateCode('9')).toBe('Aydın')
    })

    it('should return null for invalid codes', () => {
      expect(getProvinceByPlateCode('00')).toBeNull()
      expect(getProvinceByPlateCode('99')).toBeNull()
      expect(getProvinceByPlateCode('ABC')).toBeNull()
    })

    it('should handle all 81 provinces', () => {
      for (let i = 1; i <= 81; i++) {
        const code = i.toString().padStart(2, '0')
        const province = getProvinceByPlateCode(code)
        expect(province).not.toBeNull()
        expect(typeof province).toBe('string')
      }
    })
  })

  describe('findClosestMatch', () => {
    const knownKeys = ['ankara', 'istanbul', 'izmir', 'antalya', 'bursa']

    it('should find exact match', () => {
      const result = findClosestMatch('ankara', knownKeys)
      expect(result).not.toBeNull()
      expect(result?.key).toBe('ankara')
      expect(result?.distance).toBe(0)
    })

    it('should find close match with typo', () => {
      const result = findClosestMatch('ankra', knownKeys)
      expect(result).not.toBeNull()
      expect(result?.key).toBe('ankara')
      expect(result?.distance).toBeLessThanOrEqual(2) // Compatible with dataMatcher threshold
    })

    it('should handle contains check', () => {
      const result = findClosestMatch('ankarail', knownKeys)
      expect(result).not.toBeNull()
      expect(result?.key).toBe('ankara')
    })

    it('should return null for no good match', () => {
      const result = findClosestMatch('xyz', knownKeys)
      expect(result).toBeNull()
    })

    it('should return null for empty input', () => {
      const result = findClosestMatch('', knownKeys)
      expect(result).toBeNull()
    })

    it('should return null for empty known keys', () => {
      const result = findClosestMatch('ankara', [])
      expect(result).toBeNull()
    })

    it('should find best match among multiple candidates', () => {
      const result = findClosestMatch('istanbu', knownKeys)
      expect(result).not.toBeNull()
      expect(result?.key).toBe('istanbul')
    })

    it('should handle short strings', () => {
      // fuse.js has limited effectiveness with very short strings (1-2 chars)
      // but handles real-world province name lengths (3+ chars) well
      const shortKeys = ['ank', 'ist', 'izm']
      const result = findClosestMatch('anl', shortKeys)
      expect(result).not.toBeNull()
      expect(result?.key).toBe('ank')
    })

    it('should prefer shorter distance', () => {
      const keys = ['ankara', 'antalya']
      const result = findClosestMatch('ankra', keys)
      expect(result?.key).toBe('ankara') // Distance 1 vs 3
    })
  })

  describe('integration', () => {
    it('should normalize and find plate code', () => {
      const normalized = normalizeTurkishText('Ankara İli')
      const plateCode = getPlateCodeByName(normalized)
      expect(plateCode).toBe('06')
    })

    it('should handle alias to plate code', () => {
      const normalized = normalizeTurkishText('Antep')
      const plateCode = getPlateCodeByName(normalized)
      expect(plateCode).toBe('27')
    })

    it('should round-trip plate code to name', () => {
      const plateCode = '06'
      const provinceName = getProvinceByPlateCode(plateCode)
      expect(provinceName).toBe('Ankara')

      const normalized = normalizeTurkishText(provinceName!)
      const backToPlate = getPlateCodeByName(normalized)
      expect(backToPlate).toBe(plateCode)
    })

    it('should handle fuzzy matching with normalization', () => {
      const input = 'Ankra İli' // Typo + suffix
      const normalized = normalizeTurkishText(input)
      const knownKeys = ['ankara', 'antalya', 'izmir']
      const match = findClosestMatch(normalized, knownKeys)

      expect(match).not.toBeNull()
      expect(match?.key).toBe('ankara')
    })
  })
})
