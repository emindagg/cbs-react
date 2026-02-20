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
] as const

/**
 * Filtre modülleri (filtre kullanılan grid'lerde)
 */
export const filterModules = [
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
] as const

/**
 * Geliştirme modülleri (sadece development'ta)
 */
export const devModules = [
  ...(process.env.NODE_ENV !== 'production' ? [ValidationModule] : []),
] as const

/**
 * Tam modül seti (filtre + temel)
 */
export const fullGridModules = [
  ...baseGridModules,
  ...filterModules,
  ...devModules,
] as const
