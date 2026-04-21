const TR_MONTHS: Record<string, number> = {
  'ocak': 0, 'oca': 0,
  'şubat': 1, 'şub': 1, 'subat': 1, 'sub': 1,
  'mart': 2, 'mar': 2,
  'nisan': 3, 'nis': 3,
  'mayıs': 4, 'may': 4, 'mayis': 4,
  'haziran': 5, 'haz': 5,
  'temmuz': 6, 'tem': 6,
  'ağustos': 7, 'ağu': 7, 'agustos': 7, 'agu': 7,
  'eylül': 8, 'eyl': 8, 'eylul': 8,
  'ekim': 9, 'eki': 9,
  'kasım': 10, 'kas': 10, 'kasim': 10,
  'aralık': 11, 'ara': 11, 'aralik': 11,
}

const EN_MONTHS: Record<string, number> = {
  'january': 0, 'jan': 0,
  'february': 1, 'feb': 1,
  'march': 2, 'mar': 2,
  'april': 3, 'apr': 3,
  'may': 4,
  'june': 5, 'jun': 5,
  'july': 6, 'jul': 6,
  'august': 7, 'aug': 7,
  'september': 8, 'sep': 8, 'sept': 8,
  'october': 9, 'oct': 9,
  'november': 10, 'nov': 10,
  'december': 11, 'dec': 11,
}

const ALL_MONTHS = { ...TR_MONTHS, ...EN_MONTHS }

const MIN_TS = 0
const MAX_TS = 4102444800000
const MIN_YEAR = 1900
const MAX_YEAR = 2100
const MAX_MONTH_INDEX = 11
const MAX_DAY_OF_MONTH = 31

function isValidTs(ts: number): boolean {
  return !Number.isNaN(ts) && ts > MIN_TS && ts < MAX_TS
}

function buildDate(y: number, m: number, d: number, h = 0, min = 0, s = 0): Date | null {
  if (y < MIN_YEAR || y > MAX_YEAR || m < 0 || m > MAX_MONTH_INDEX || d < 1 || d > MAX_DAY_OF_MONTH) return null
  const dt = new Date(y, m, d, h, min, s)
  if (Number.isNaN(dt.getTime())) return null
  return dt
}

function tryDMY(str: string): string | undefined {
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/i.exec(str)
  if (!m) return undefined
  const [, p1, p2, p3, h = '0', min = '0', s = '0'] = m
  const dt = buildDate(Number(p3), Number(p2) - 1, Number(p1), Number(h), Number(min), Number(s))
  return dt ? dt.toISOString() : undefined
}

function tryMDY(str: string): string | undefined {
  const m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/i.exec(str)
  if (!m) return undefined
  const [, p1, p2, p3, h = '0', min = '0', s = '0'] = m
  if (Number(p1) > 12) return undefined
  const dt = buildDate(Number(p3), Number(p1) - 1, Number(p2), Number(h), Number(min), Number(s))
  return dt ? dt.toISOString() : undefined
}

function tryYMD(str: string): string | undefined {
  const m = /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/i.exec(str)
  if (!m) return undefined
  const [, p1, p2, p3, h = '0', min = '0', s = '0'] = m
  const dt = buildDate(Number(p1), Number(p2) - 1, Number(p3), Number(h), Number(min), Number(s))
  return dt ? dt.toISOString() : undefined
}

function tryTextDate(str: string): string | undefined {
  const m1 = /^(\d{1,2})\s+(\p{L}+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/u.exec(str)
  if (m1) {
    const [, d, monthStr, y, h = '0', min = '0', s = '0'] = m1
    const month = ALL_MONTHS[monthStr.toLowerCase()]
    if (month !== undefined) {
      const dt = buildDate(Number(y), month, Number(d), Number(h), Number(min), Number(s))
      if (dt) return dt.toISOString()
    }
  }

  const m2 = /^(\p{L}+)\s+(\d{1,2}),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/u.exec(str)
  if (m2) {
    const [, monthStr, d, y, h = '0', min = '0', s = '0'] = m2
    const month = ALL_MONTHS[monthStr.toLowerCase()]
    if (month !== undefined) {
      const dt = buildDate(Number(y), month, Number(d), Number(h), Number(min), Number(s))
      if (dt) return dt.toISOString()
    }
  }

  const m3 = /^(\d{4})\s+(\p{L}+)\s+(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/u.exec(str)
  if (m3) {
    const [, y, monthStr, d, h = '0', min = '0', s = '0'] = m3
    const month = ALL_MONTHS[monthStr.toLowerCase()]
    if (month !== undefined) {
      const dt = buildDate(Number(y), month, Number(d), Number(h), Number(min), Number(s))
      if (dt) return dt.toISOString()
    }
  }

  return undefined
}

const UNIX_MS_YEAR_2000 = 946684800000
const UNIX_S_YEAR_2000 = 946684800
const UNIX_S_MAX = 4102444800
const MS_PER_SECOND = 1000

function tryUnixTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'number') return undefined
  if (value > UNIX_MS_YEAR_2000 && value < MAX_TS) return new Date(value).toISOString()
  if (value > UNIX_S_YEAR_2000 && value < UNIX_S_MAX) return new Date(value * MS_PER_SECOND).toISOString()
  return undefined
}

const EXCEL_SERIAL_MAX = 100000
const EXCEL_EPOCH_YEAR = 1899
const EXCEL_EPOCH_MONTH = 11
const EXCEL_EPOCH_DAY = 30
const MS_PER_DAY = 86400000

function tryExcelSerial(value: unknown): string | undefined {
  if (typeof value !== 'number') return undefined
  if (value > 1 && value < EXCEL_SERIAL_MAX) {
    const epoch = new Date(EXCEL_EPOCH_YEAR, EXCEL_EPOCH_MONTH, EXCEL_EPOCH_DAY)
    const ms = epoch.getTime() + value * MS_PER_DAY
    if (isValidTs(ms)) return new Date(ms).toISOString()
  }
  return undefined
}

function tryISO(str: string): string | undefined {
  const ts = new Date(str).getTime()
  if (isValidTs(ts)) return new Date(ts).toISOString()
  return undefined
}

export function parseDate(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined

  const unix = tryUnixTimestamp(value)
  if (unix) return unix

  const excel = tryExcelSerial(value)
  if (excel) return excel

  if (typeof value !== 'string' && typeof value !== 'number') return undefined

  const str = String(value).trim()
  if (str.length < 4 || str.length > 40) return undefined

  const ymd = tryYMD(str)
  if (ymd) return ymd

  const dmy = tryDMY(str)
  if (dmy) return dmy

  const text = tryTextDate(str)
  if (text) return text

  const mdy = tryMDY(str)
  if (mdy) return mdy

  const iso = tryISO(str)
  if (iso) return iso

  return undefined
}

const DATE_KEYS = [
  'date', 'tarih', 'timestamp', 'time', 'datetime', 'date_time',
  'created', 'createdAt', 'created_at', 'updated', 'updatedAt', 'updated_at',
  'modified', 'modifiedAt', 'modified_at',
  'zaman', 'event_date', 'olay_tarihi', 'baslangic', 'bitis',
  'start_date', 'end_date', 'occurrence', 'recorded',
]

const DATE_PARTIAL = [
  'date', 'tarih', 'time', 'zaman', 'when', 'created', 'updated', 'modified',
  'timestamp', 'recorded', 'occurred', 'event',
]

export function extractDateFromProperties(props: Record<string, unknown> | undefined): string | undefined {
  if (!props) return undefined

  for (const key of DATE_KEYS) {
    for (const [k, v] of Object.entries(props)) {
      if (k.toLowerCase() === key) {
        const parsed = parseDate(v)
        if (parsed) return parsed
      }
    }
  }

  for (const partial of DATE_PARTIAL) {
    for (const [k, v] of Object.entries(props)) {
      if (k.toLowerCase().includes(partial)) {
        const parsed = parseDate(v)
        if (parsed) return parsed
      }
    }
  }

  for (const [, v] of Object.entries(props)) {
    const MIN_DATE_LEN = 6
    const MAX_DATE_LEN = 35
    if (typeof v === 'string' && v.length >= MIN_DATE_LEN && v.length <= MAX_DATE_LEN) {
      const parsed = parseDate(v)
      if (parsed) return parsed
    }
  }

  return undefined
}
