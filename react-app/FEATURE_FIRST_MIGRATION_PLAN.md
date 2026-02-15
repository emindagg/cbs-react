# Feature-First Mimari Taşıma Planı

## 🎯 Hedef
Global components'teki domain-specific bileşenleri ilgili feature'lara taşımak.

---

## 📦 Taşıma 1: Legend Konsolidasyonu

### Mevcut Durum
```
src/
├── components/Legend/          # Generic legend bileşenleri
│   ├── DotDensityLegend.tsx
│   ├── DynamicLegend.tsx
│   ├── LegendBar.tsx
│   ├── LegendLabels.tsx
│   ├── SmartLabel.tsx
│   ├── useLabelCollision.ts
│   └── legend.types.ts
└── features/legend-dw/         # Datawrapper-style legend
    ├── Legend.tsx
    ├── components/
    └── utils/
```

### Hedef Yapı
```
src/features/legend/
├── components/
│   ├── DotDensityLegend.tsx    # Taşındı
│   ├── DynamicLegend.tsx       # Taşındı
│   ├── LegendBar.tsx           # Taşındı
│   ├── LegendLabels.tsx        # Taşındı
│   ├── SmartLabel.tsx          # Taşındı
│   ├── DatawrapperLegend.tsx   # legend-dw/Legend.tsx → yeniden adlandırıldı
│   ├── Config.tsx              # legend-dw/components/Config.tsx
│   ├── Container.tsx           # legend-dw/components/Container.tsx
│   └── BarContent.tsx          # legend-dw/components/BarContent.tsx
├── hooks/
│   └── useLabelCollision.ts    # Taşındı
├── types.ts                    # legend.types.ts → yeniden adlandırıldı
├── utils/                      # legend-dw/utils/
└── index.ts                    # Barrel export
```

### Kullanım Değişikliği
```typescript
// Önce:
import { DynamicLegend } from '@/components/Legend'
import { Legend } from '@/features/legend-dw'

// Sonra:
import { DynamicLegend, DatawrapperLegend } from '@/features/legend'
```

---

## 📦 Taşıma 2: Modal Wrapper'lar

### DataMapperModal

**Mevcut:** `src/components/modals/DataMapperModal.tsx`  
**Hedef:** `src/features/data-mapper/components/Modal.tsx`

**Kullanım:**
- `src/features/viz-wizard/steps/Step2.tsx`

**Değişiklik:**
```typescript
// Önce:
import DataMapperModal from '@/components/modals/DataMapperModal'

// Sonra:
import { DataMapperModal } from '@/features/data-mapper'
```

### ColumnMapperModal

**Mevcut:** `src/components/modals/ColumnMapperModal.tsx`  
**Hedef:** `src/features/data-import/components/ColumnMapperModal.tsx`

**Kullanım:**
- `src/features/data-import/components/DataImportSection.tsx`

**Değişiklik:**
```typescript
// Önce:
import ColumnMapperModal from '@/components/modals/ColumnMapperModal'

// Sonra:
import { ColumnMapperModal } from '@/features/data-import'
```

---

## 📦 Taşıma 3: Sidebar Section'lar

### Analiz

**SidebarVizWizard:**
- Feature: viz-wizard
- Hedef: `src/features/viz-wizard/components/SidebarSection.tsx`

**SidebarProjectManagement:**
- Feature: data-import (sadece DataImportSection wrapper'ı)
- Aksiyon: Sil, doğrudan DataImportSection kullan

**SidebarDataCreation, SidebarDataCatalog, SidebarTools, SidebarProjectPurpose:**
- Generic UI bileşenleri
- Aksiyon: Kalsın (gerçekten global)

---

## 🔄 Taşıma Sırası

1. ✅ **Modal Wrapper'lar** (en basit, az bağımlılık)
2. ✅ **Sidebar Section'lar** (orta karmaşıklık)
3. ✅ **Legend Konsolidasyonu** (en karmaşık, çok bağımlılık)

---

## ⚠️ Dikkat Edilecekler

1. **Import Path'leri:** Tüm import'lar güncellenecek
2. **Barrel Export:** Her feature'ın index.ts'i güncellenecek
3. **Type Export:** Type'lar da barrel'dan export edilecek
4. **CSS Dosyaları:** DynamicLegend.css taşınacak
5. **Test Dosyaları:** Varsa test dosyaları da taşınacak

---

## ✅ Doğrulama

Her taşıma sonrası:
```bash
npm run lint        # ESLint kontrol
npm run build       # Build başarılı mı
npm run test:run    # Testler geçiyor mu
```

---

**Hazırlayan:** Kiro AI  
**Tarih:** 15 Şubat 2026
