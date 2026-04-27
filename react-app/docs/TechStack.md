# TechStack — CBS React

## Uygulama Katmanı
- React 19
- TypeScript 5.x
- Vite 7

## Harita ve Mekansal Analiz
- MapLibre GL JS
- react-map-gl
- Turf.js

## State ve Veri Yönetimi
- Zustand
- IndexedDB (persist/storage katmanı)

## UI ve Stil
- Tailwind CSS
- Font Awesome (ikonlar)
- react-hot-toast (bildirimler)

## Test ve Kalite
- Vitest
- Testing Library
- TypeScript type-check (`pnpm exec tsc --noEmit`)

## Paket Yönetimi
- pnpm

## Mimari Notları
- Feature-first / vertical-slice yaklaşımı
- Reusable component odaklı yapı
- Merkezi store üzerinden çizim ve veri yönetimi

## Son Milestone Teknik Güncellemeleri (2026-04-27)
- `useDataManagementStore` içinde çizim geçmişi için undo/redo stack eklendi.
- Veri oluşturma çizim akışında global klavye dinleyicisi ile `Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z` bağlandı.
- Terrain Analysis polygon seçici metni Türkçeleştirildi.
