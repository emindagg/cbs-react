---
trigger: always_on
---

# Feature-First Architecture (Özellik-Öncelikli Mimari)

**Genel kural:** Alan/özellik kodu yalnızca `src/features/[feature-name]` altında bulunur; domain'e özgü bileşenler `src/components` altında monolitik klasörlerde (örn. `components/visualization`) toplanmaz veya yeniden oluşturulmaz.

**Kısa referans:** Feature-First → domain kodu `src/features/<feature-name>`; `src/components` altında feature monoliti yok.

## 🏗️ Architecture: Feature-First

**Core Principle:**
Domain-specific logic and UI must reside in `src/features/[feature-name]`.
`src/components` is strictly for **domain-agnostic** UI elements (buttons, inputs, layouts) or **shared** utilities used by multiple features.

**✅ DO (Doğru Kullanım):**
- `src/features/viz-wizard/steps/Step1.tsx` (Feature specific logic)
- `src/features/data-mapper/components/Grid.tsx` (Feature specific component)
- `src/components/ui/Button.tsx` (Generic UI)
- `src/components/shared/MatchResultsTable.tsx` (Used by multiple features)

**❌ DON'T (Yanlış Kullanım):**
- `src/components/visualization/VizWizardStep1.tsx` (Domain logic in components folder - **FORBIDDEN**)
- `src/components/modals/DataMapperModal.tsx` (Better moved to `src/features/data-mapper/modals/`)

**Rule of Thumb:**
If a component imports a specific store, hook, or type from a feature, it likely belongs IN that feature.

**Enforcement:** ESLint KURAL 1 (components → features import yasak) şu an `warn`; layout/sidebar/modals feature’a taşındıktan sonra `error` yapılabilir. KURAL 2 (derin feature import = barrel/relative kullan) `error`.

## Structure
```
src/features/[feature-name]/
├── components/  ├── hooks/  ├── services/
├── utils/  ├── constants/  ├── types.ts  └── index.ts (required)
```

## Feature eşlemesi (CBS / görselleştirme)
- Görselleştirme / sihirbaz → `src/features/viz-wizard` (`@/features/viz-wizard`)
- Lejant (Datawrapper) → `src/features/legend-dw` (`@/features/legend-dw`)
- Veri eşleme (DataMapper, grid, kolon) → `src/features/data-mapper` (`@/features/data-mapper`)
- **Yasak:** `src/components/visualization` kullanılmaz veya yeniden oluşturulmaz; tüm bu kod ilgili feature'a yazılır.

## Rules
1. **Single Responsibility** - Bir dosya = bir görev
2. **Feature Isolation** - Feature'lar birbirini import etmez, global store kullanır
3. **Barrel Exports** - Her feature'da `index.ts` zorunlu

## Limits (Refactoring Triggers) — Pragmatik
- Components: >300 lines → extract hooks/logic
- Services: >400 lines → split into multiple services
- Hooks: >200 lines → extract to services
- Utils: >150 lines → categorize
- Constants: >100 lines → group by domain

## AI Instructions
- Mimari: Feature-First; yeni domain kodu ilgili `src/features/*` altına ekle, `src/components` altında feature monoliti oluşturma.
- Generate `index.ts` for every feature
- Warn if file exceeds limits
- Reject cross-feature imports
- Suggest extraction when file grows
- Always use TypeScript (no `any`)

**Priority: Maintainable > Clever**