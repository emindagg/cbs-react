# TypeScript Strict Mode Enforcement - Requirements

## 📋 Overview

Projenin TypeScript strict mode'u zaten aktif ancak bazı yerlerde `any` kullanımı ve ESLint warning'leri mevcut. Bu spec, tüm `any` kullanımlarını kaldırarak tam tip güvenliği sağlamayı hedefler.

## 🎯 Goals

1. Tüm `@typescript-eslint/no-explicit-any` warning'lerini kaldır
2. `any` kullanımlarını uygun tiplerle değiştir
3. Tip güvenliğini artır
4. Runtime hata riskini azalt

## 👤 User Stories

### US-1: Developer - Tip Güvenliği
**As a** developer  
**I want** tüm kodun strict type checking'den geçmesini  
**So that** runtime'da tip hatalarıyla karşılaşmayayım

**Acceptance Criteria:**
- AC-1.1: `@typescript-eslint/no-explicit-any` kuralı `error` seviyesinde
- AC-1.2: Hiçbir dosyada `any` kullanımı yok (gerekli yerlerde `unknown` kullanılıyor)
- AC-1.3: Tüm MapLibre expression'ları tip güvenli

### US-2: Developer - Kod Kalitesi
**As a** developer  
**I want** IDE'nin tip hatalarını göstermesini  
**So that** hataları compile-time'da yakalayayım

**Acceptance Criteria:**
- AC-2.1: VSCode'da tip hataları görünüyor
- AC-2.2: `tsc --noEmit` 0 hata veriyor
- AC-2.3: Build başarılı

### US-3: Team - Sürdürülebilirlik
**As a** team member  
**I want** yeni kodun tip güvenli olmasını  
**So that** kod kalitesi düşmesin

**Acceptance Criteria:**
- AC-3.1: ESLint pre-commit hook'u `any` kullanımını engelliyor
- AC-3.2: CI/CD pipeline'da strict type checking var
- AC-3.3: Dokümantasyon güncel

## 🔍 Current State Analysis

### Mevcut `any` Kullanımları

1. **MapLibre Expressions (4 kullanım)**
   - `PointRenderer.ts`: `geometry as any` (line 155)
   - `PointRenderer.ts`: `zoomRadius as any` (line 406, 416)
   - `BubbleRenderer.ts`: `geometry as any` (line 183)
   - `useVizRender.ts`: `buildZoomRadius as any` (line 34)

2. **Style Properties (1 kullanım)**
   - `DataLayer.tsx`: `style as any` (line 19)

### TypeScript Config
- ✅ `strict: true` aktif
- ✅ `noUnusedLocals: true`
- ✅ `noUnusedParameters: true`
- ✅ `noFallthroughCasesInSwitch: true`

### ESLint Config
- ⚠️ `@typescript-eslint/no-explicit-any: warn` (should be `error`)

## 📊 Scope

### In Scope
- MapLibre expression type definitions
- Geometry type guards
- Style property types
- ESLint rule upgrade

### Out of Scope
- Third-party library type definitions
- Global type augmentation
- Complex generic types

## 🚧 Constraints

1. **MapLibre Types**: MapLibre expression types karmaşık, custom type tanımları gerekebilir
2. **Backward Compatibility**: Mevcut API'ler değişmemeli
3. **Performance**: Tip kontrolü build süresini artırmamalı

## 📈 Success Metrics

- [ ] 0 `any` kullanımı (gerekli yerlerde `unknown`)
- [ ] ESLint `no-explicit-any: error`
- [ ] `tsc --noEmit` 0 hata
- [ ] Build başarılı
- [ ] Tüm testler geçiyor

## 🔗 Dependencies

- ESLint cleanup (✅ Tamamlandı)
- TypeScript 5.9.3
- MapLibre GL types

## 📝 Notes

### MapLibre Expression Types
MapLibre expression'ları runtime'da değerlendirilen JSON array'ler. TypeScript'te tam tip güvenliği zor ama `unknown[]` veya custom type kullanılabilir.

### Geometry Type Guards
GeoJSON geometry tipleri için type guard fonksiyonları yazılabilir:
```typescript
function isPolygon(geometry: GeoJSON.Geometry): geometry is GeoJSON.Polygon {
  return geometry.type === 'Polygon'
}
```

## 🎯 Priority

**High** - Kod kalitesi ve sürdürülebilirlik için kritik

## ⏱️ Estimated Effort

**2-3 hours**
- MapLibre types: 1 hour
- Geometry type guards: 30 min
- Style types: 30 min
- ESLint config: 15 min
- Testing: 45 min
