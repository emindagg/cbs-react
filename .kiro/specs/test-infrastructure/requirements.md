# Test Infrastructure Setup - Requirements

## 📋 Overview

React projesinde şu an hiç test infrastructure'ı yok. Bu spec, Vitest test framework'ünü kurup, kritik business logic için test coverage sağlamayı hedefler.

## 🎯 Goals

1. Vitest test framework'ünü kur ve yapılandır
2. Coverage reporting setup'ı yap
3. Kritik modüller için test dosyaları oluştur
4. CI/CD pipeline'a test entegrasyonu hazırla
5. Minimum %70 coverage hedefle

## 👤 User Stories

### US-1: Developer - Test Güvenliği
**As a** developer  
**I want** kodumun testlerle kapsanmasını  
**So that** değişiklik yaparken hata yapmaktan korkmayayım

**Acceptance Criteria:**
- AC-1.1: `npm test` komutu çalışıyor
- AC-1.2: Test sonuçları terminal'de görünüyor
- AC-1.3: Başarısız testler build'i engelliyor

### US-2: Developer - Coverage Görünürlüğü
**As a** developer  
**I want** hangi kodun test edilmediğini görmek istiyorum  
**So that** eksik testleri tamamlayayım

**Acceptance Criteria:**
- AC-2.1: `npm run test:coverage` coverage raporu gösteriyor
- AC-2.2: Coverage raporu HTML formatında oluşuyor
- AC-2.3: Coverage threshold'ları tanımlı (minimum %70)

### US-3: Team - Sürekli Kalite
**As a** team member  
**I want** her commit'te testlerin çalışmasını  
**So that** kod kalitesi düşmesin

**Acceptance Criteria:**
- AC-3.1: Pre-commit hook testleri çalıştırıyor
- AC-3.2: CI/CD pipeline'da test adımı var
- AC-3.3: Coverage düşerse build fail oluyor

## 🔍 Current State Analysis

### Mevcut Durum
- ❌ Test framework yok
- ❌ Test dosyaları yok
- ❌ Coverage reporting yok
- ✅ TypeScript strict mode aktif
- ✅ ESLint configured

### Test Edilmesi Gereken Kritik Modüller

**Priority 1 (Yüksek Risk):**
1. `src/utils/classification.ts` - Data classification algorithms
2. `src/utils/geometryUtils.ts` - Geometry calculations
3. `src/utils/geometryTypeGuards.ts` - Type guards (yeni oluşturuldu)
4. `src/utils/prng.ts` - PRNG algorithms
5. `src/features/viz-wizard/utils/dot-density.ts` - Dot density calculations

**Priority 2 (Orta Risk):**
6. `src/services/renderers/PointRenderer.ts` - Dot rendering logic
7. `src/services/renderers/BubbleRenderer.ts` - Bubble rendering logic
8. `src/services/renderers/ChoroplethRenderer.ts` - Choropleth rendering
9. `src/utils/mapExpressions.ts` - MapLibre expression builders
10. `src/utils/interpolation.ts` - Value interpolation

**Priority 3 (Düşük Risk):**
11. `src/utils/turkishNormalizer.ts` - Text normalization
12. `src/constants/colorSchemes.ts` - Color palette functions
13. React hooks (useVizRender, etc.)

## 📊 Scope

### In Scope
- Vitest framework kurulumu
- Coverage reporting (c8)
- Unit tests için kritik utils/services
- Test configuration (vitest.config.ts)
- Package.json scripts
- Basic CI/CD integration guide

### Out of Scope
- E2E tests (Playwright/Cypress)
- Visual regression tests
- Performance tests
- Integration tests (API mocking)
- Component tests (React Testing Library) - Phase 2

## 🚧 Constraints

1. **Framework Choice**: Vitest (Vite ile native uyumlu, hızlı)
2. **Coverage Tool**: c8 (Vitest built-in, V8 coverage)
3. **Test Location**: Co-located tests (`*.test.ts` yanında)
4. **Minimum Coverage**: %70 (pragmatik başlangıç)

## 📈 Success Metrics

- [ ] Vitest kurulu ve çalışıyor
- [ ] En az 10 test dosyası oluşturuldu
- [ ] Coverage raporu çalışıyor
- [ ] Kritik utils %80+ coverage
- [ ] Build pipeline'da test adımı var
- [ ] Dokümantasyon güncel (README)

## 🔗 Dependencies

- TypeScript 5.9.3 ✅
- Vite 7.3.1 ✅
- ESLint configured ✅
- Node.js (mevcut)

## 📝 Notes

### Test Stratejisi

**Unit Tests (Priority):**
- Pure functions (utils, calculations)
- Type guards
- Data transformations
- Algorithm correctness

**Integration Tests (Phase 2):**
- Renderer + MapLibre interaction
- Store + Component interaction
- File upload + parsing

**Component Tests (Phase 3):**
- React components
- User interactions
- Visual states

### Coverage Targets

```
src/utils/              → %90+ (pure functions, easy to test)
src/services/renderers/ → %70+ (MapLibre dependency, harder)
src/features/*/utils/   → %80+ (business logic)
src/components/         → %60+ (UI, Phase 3)
Overall:                → %70+ (pragmatic start)
```

## 🎯 Priority

**High** - Test infrastructure temel gereksinim, refactoring güvenliği için kritik

## ⏱️ Estimated Effort

**4-5 hours**
- Vitest setup: 30 min
- Configuration: 30 min
- Test files (10 modules): 2.5 hours
- Coverage setup: 30 min
- CI/CD guide: 30 min
- Documentation: 30 min

## 🔄 Phases

### Phase 1: Infrastructure (Bu Spec)
- Vitest kurulumu
- Coverage reporting
- Kritik utils testleri
- Basic CI/CD

### Phase 2: Integration Tests (Gelecek)
- Renderer integration tests
- Store tests
- File parsing tests

### Phase 3: Component Tests (Gelecek)
- React Testing Library
- User interaction tests
- Visual state tests
