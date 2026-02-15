# CBS React - Harita Görselleştirme Uygulaması

Modern, feature-first mimaride geliştirilmiş React tabanlı harita görselleştirme platformu.

## 🏗️ Mimari

### Feature-First Architecture

Proje, domain-driven design prensiplerine göre feature modülleri etrafında organize edilmiştir:

```
src/
├── features/           # Feature modülleri (domain logic)
│   ├── astronomy/      # Astronomi hesaplamaları
│   ├── basemap/        # Harita katmanları
│   ├── clustering/     # Nokta kümeleme
│   ├── data-import/    # Veri import/export
│   ├── data-mapper/    # Kolon eşleştirme
│   ├── geocoder/       # Adres arama
│   ├── globe-view/     # 3D küre görünümü
│   ├── legend/         # Harita lejantı
│   ├── map/            # Harita core
│   └── viz-wizard/     # Görselleştirme sihirbazı
├── components/         # Global UI bileşenleri
├── stores/             # Zustand state management
├── utils/              # Paylaşılan yardımcılar
└── types/              # Global TypeScript tipleri
```

### Mimari Kurallar

1. **Feature İzolasyonu**: Her feature kendi domain logic'ini içerir
2. **Barrel Exports**: Cross-feature import'lar sadece `index.ts` üzerinden
3. **Global Components**: Feature'lardan import yapamaz
4. **Store Access**: Feature'lar merkezi store'lara erişebilir

## 🚀 Kurulum

```bash
cd react-app
npm install
```

## 📦 Komutlar

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Build preview
npm run test         # Test watch mode
npm run test:run     # Test single run
npm run test:coverage # Coverage raporu
npm run lint         # ESLint kontrolü
npm run lint:fix     # ESLint otomatik düzeltme
```

## 🧪 Test

- **Framework**: Vitest + React Testing Library
- **Coverage**: 283 test
- **Test Dosyaları**: `*.test.ts` veya `*.test.tsx`

```bash
npm run test:run     # Tüm testleri çalıştır
npm run test:ui      # UI ile test
```

## 📋 Teknoloji Stack

### Core
- React 19.2
- TypeScript 5.9
- Vite 7.3

### Harita
- MapLibre GL 5.17
- React Map GL 8.1
- Turf.js 7.3

### State Management
- Zustand 5.0

### UI
- Tailwind CSS 4.1
- Framer Motion 12.31
- Lucide React (icons)

### Veri İşleme
- XLSX (Excel)
- ShpJS (Shapefile)
- ToGeoJSON (KML)
- Chroma.js (renk)
- D3 (scale, interpolation)

## 🎨 ESLint Kuralları

Feature-first mimarisini zorunlu kılan kurallar:

```javascript
// ❌ Yasak
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Button } from '@/features/ui/components/Button'

// ✅ Doğru
import { useAuth } from '@/features/auth'
import { Button } from '@/features/ui'
```

## 📊 Build Optimizasyonu

Vite yapılandırması vendor ve feature chunk'larına ayrılmıştır:
- React vendor (~200KB)
- Map vendor (~400KB)
- Data vendor (~300KB)
- Feature chunks (lazy load)

## 🔧 Geliştirme

### Yeni Feature Ekleme

```bash
src/features/my-feature/
├── components/
├── hooks/
├── utils/
├── types.ts
└── index.ts  # Public API (barrel export)
```

### ESLint Kontrol

```bash
npm run lint:strict  # Max warnings: 0
```

## 📝 Lisans

Private project
