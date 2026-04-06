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
  TextEditorModule,
  NumberEditorModule,
  CellStyleModule,
  RenderApiModule,
  RowStyleModule,
  ModuleRegistry,
} from 'ag-grid-community'

export const baseGridModules = [
  ClientSideRowModelModule,
  LocaleModule,
]

export const filterModules = [
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
]

export const editorModules = [
  TextEditorModule,
  NumberEditorModule,
  CellStyleModule,
  RenderApiModule,
  RowStyleModule,
]

export const devModules = [
  ...(process.env.NODE_ENV !== 'production' ? [ValidationModule] : []),
]

export const fullGridModules = [
  ...baseGridModules,
  ...filterModules,
  ...editorModules,
  ...devModules,
]

ModuleRegistry.registerModules(fullGridModules)
