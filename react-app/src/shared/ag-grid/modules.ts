/**
 * AG Grid modül kayıtları
 * Her feature kendi ihtiyacına göre modülleri kaydedebilir
 * Bu dosya ortak modül setlerini export eder
 */

import {
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
  LocaleModule,
  ValidationModule,
} from 'ag-grid-community'

/**
 * Temel modüller (tüm grid'lerde kullanılır)
 */
export const baseGridModules = [
  ClientSideRowModelModule,
  LocaleModule,
]

/**
 * Filtre modülleri (filtre kullanılan grid'lerde)
 */
export const filterModules = [
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
]

/**
 * Geliştirme modülleri (sadece development'ta)
 */
export const devModules = [
  ...(process.env.NODE_ENV !== 'production' ? [ValidationModule] : []),
]

/**
 * Tam modül seti (filtre + temel)
 */
export const fullGridModules = [
  ...baseGridModules,
  ...filterModules,
  ...devModules,
]
