# Renk İnterpolasyonu ve Legend Entegrasyonu

Bu dokümantasyon, React projenize gelişmiş renk interpolasyonu ve legend özelliklerinin nasıl entegre edileceğini açıklar.

## 📦 Kurulum

Gerekli bağımlılıklar zaten yüklenmiştir:

```bash
npm install d3-scale d3-color d3-interpolate chroma-js simple-statistics
```

## 🏗️ Mimari

### Yeni Bileşenler

#### 1. `ColorScaleConfig.tsx` (Güncellenmiş)
Renk skalası tipi (basamaklı/sürekli) ve interpolasyon metodu seçimi.

```tsx
<ColorScaleConfig
  colorScheme={vizSettings.colorScheme}
  classCount={vizSettings.classCount}
  scaleType={colorConfig.scaleType}
  interpolation={colorConfig.interpolation}
  onScaleTypeChange={(type) => setColorConfig({ scaleType: type })}
  onInterpolationChange={(method) => setColorConfig({ interpolation: method })}
/>
```

#### 2. `CustomRangeConfig.tsx` (Yeni)
Min, Center ve Max değerlerini manuel ayarlama.

```tsx
<CustomRangeConfig
  customRange={colorConfig.customRange}
  autoMin={autoMin}
  autoMax={autoMax}
  onChange={(range) => setCustomRange(range)}
/>
```

#### 3. `Legend.tsx` (Yeni)
Görselleştirme üzerinde gösterilecek lejant bileşeni.

```tsx
<Legend
  config={colorConfig.legend}
  breaks={breaks}
  colors={colors}
  scaleType={colorConfig.scaleType}
  onHover={(index) => handleLegendHover(index)}
/>
```

#### 4. `LegendConfig.tsx` (Yeni)
Lejant ayarları paneli (pozisyon, boyut, format, vb.).

```tsx
<LegendConfig
  config={colorConfig.legend}
  onChange={(config) => setLegendConfig(config)}
/>
```

#### 5. `StyleConfig.tsx` (Yeni)
Tüm ayarları tek bir panelde birleştiren entegre bileşen.

```tsx
<StyleConfig dataValues={dataValues} />
```

### Yeni Utility Fonksiyonları

#### `numberFormatter.ts`
Gelişmiş sayı formatlama.

```ts
import { formatNumber } from '@/utils/numberFormatter'

const formatted = formatNumber(1234.56, '1,000.00') // "1.234,56"
```

#### `classificationMethods.ts` (Güncellenmiş)
Interpolasyon metodları eklendi:

```ts
import {
  calculateBreaksFromInterpolation,
  INTERPOLATION_INFO,
  normalizeValue,
} from '@/utils/classificationMethods'

const breaks = calculateBreaksFromInterpolation(values, 'natural-9')
```

### Yeni Tipler

`types/visualization.ts` dosyasına eklenen tipler:

```ts
export type InterpolationMethod =
  | 'equidistant'      // Doğrusal
  | 'quantiles-5'      // Çeyrekler (4 grup)
  | 'quantiles-6'      // Beşlikler (5 grup)
  | 'quantiles-11'     // Onluklar (10 grup)
  | 'natural-9'        // Doğal kırılmalar (9 grup)

export type ColorScaleType = 'steps' | 'continuous'

export interface CustomRange {
  enabled: boolean
  min: number | null
  center: number | null
  max: number | null
}

export interface LegendConfiguration {
  visible: boolean
  position: LegendPosition
  size: number
  orientation: LegendOrientation
  labels: {
    type: LegendLabelType
    customLabels?: string[]
  }
  format: string
  title?: {
    show: boolean
    text: string
  }
  highlightOnHover: boolean
  reverseOrder: boolean
}

export interface ColorConfiguration {
  column: string | null
  palette: ColorScheme
  scaleType: ColorScaleType
  interpolation: InterpolationMethod
  customRange?: CustomRange
  legend: LegendConfiguration
}
```

### Store Güncellemeleri

`useVisualizationStore.ts` içinde yeni state:

```ts
const {
  colorConfig,           // Tüm renk konfigürasyonu
  setColorConfig,        // Genel ayarları güncelle
  setLegendConfig,       // Lejant ayarlarını güncelle
  setCustomRange,        // Özel aralığı güncelle
} = useVisualizationStore()
```

## 🎨 Kullanım Örnekleri

### Örnek 1: Basit Entegrasyon

```tsx
import { StyleConfig } from '@/components/visualization'

function MyVisualizationPanel() {
  const dataValues = [100, 250, 500, 750, 1000, 1500]

  return (
    <div>
      <h2>Görselleştirme Ayarları</h2>
      <StyleConfig dataValues={dataValues} />
    </div>
  )
}
```

### Örnek 2: Adım Adım Kullanım

```tsx
import { useState } from 'react'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import {
  ColorScaleConfig,
  CustomRangeConfig,
  LegendConfig,
  Legend,
} from '@/components/visualization'
import { calculateBreaksFromInterpolation } from '@/utils/classificationMethods'

function AdvancedVisualization() {
  const {
    colorConfig,
    setColorConfig,
    setLegendConfig,
    setCustomRange,
    vizSettings,
  } = useVisualizationStore()

  const dataValues = [100, 250, 500, 750, 1000, 1500]

  // Min ve Max hesaplama
  const autoMin = Math.min(...dataValues)
  const autoMax = Math.max(...dataValues)

  // Breaks hesaplama
  const breaks = calculateBreaksFromInterpolation(
    dataValues,
    colorConfig.interpolation
  )

  // Renkleri al
  const colors = getColorsForBreaks(breaks, vizSettings.colorScheme)

  return (
    <div className="space-y-6">
      {/* Renk Skalası Ayarları */}
      <section>
        <h3>Renk Skalası</h3>
        <ColorScaleConfig
          colorScheme={vizSettings.colorScheme}
          classCount={vizSettings.classCount}
          scaleType={colorConfig.scaleType}
          interpolation={colorConfig.interpolation}
          onScaleTypeChange={(type) => setColorConfig({ scaleType: type })}
          onInterpolationChange={(method) => setColorConfig({ interpolation: method })}
        />
      </section>

      {/* Özel Aralık - Sadece continuous için */}
      {colorConfig.scaleType === 'continuous' && (
        <section>
          <h3>Özel Aralık</h3>
          <CustomRangeConfig
            customRange={colorConfig.customRange!}
            autoMin={autoMin}
            autoMax={autoMax}
            onChange={(range) => setCustomRange(range)}
          />
        </section>
      )}

      {/* Lejant Ayarları */}
      <section>
        <h3>Lejant Ayarları</h3>
        <LegendConfig
          config={colorConfig.legend}
          onChange={(config) => setLegendConfig(config)}
        />
      </section>

      {/* Harita Üzerinde Lejant */}
      <div className="relative">
        <div id="map" style={{ width: '100%', height: '500px' }}>
          {/* Harita bileşeniniz */}
        </div>

        {/* Lejant overlay */}
        <Legend
          config={colorConfig.legend}
          breaks={breaks}
          colors={colors}
          scaleType={colorConfig.scaleType}
          onHover={(index) => {
            console.log('Hovering legend item:', index)
            // Harita üzerinde ilgili özellikleri vurgula
          }}
        />
      </div>
    </div>
  )
}
```

### Örnek 3: Renk Hesaplama

```tsx
import { getContinuousColorForValue, getColorForValue } from '@/constants/colorSchemes'
import { calculateBreaksFromInterpolation } from '@/utils/classificationMethods'

function calculateFeatureColor(value: number, dataValues: number[]) {
  const { colorConfig, vizSettings } = useVisualizationStore()

  if (colorConfig.scaleType === 'continuous') {
    // Sürekli renk skalası
    return getContinuousColorForValue(
      value,
      dataValues,
      vizSettings.colorScheme
    )
  } else {
    // Basamaklı renk skalası
    const breaks = calculateBreaksFromInterpolation(
      dataValues,
      colorConfig.interpolation
    )
    const colors = getInterpolatedColorPalette(
      vizSettings.colorScheme,
      breaks.length - 1
    )

    return getColorForValue(value, breaks, colors)
  }
}
```

## 🎯 Özellikler

### ✅ Renk Skalası Tipleri
- **Basamaklı (Steps)**: Belirgin renk kırılmaları
- **Sürekli (Continuous)**: Yumuşak gradyan geçişleri

### ✅ İnterpolasyon Metodları
- **Doğrusal (Equidistant)**: Eşit aralıklar
- **Çeyrekler (Quartiles)**: 4 eşit grup
- **Beşlikler (Quintiles)**: 5 eşit grup
- **Onluklar (Deciles)**: 10 eşit grup
- **Doğal Kırılmalar (Natural)**: Jenks algoritması ile 9 grup

### ✅ Özel Aralık
- Min, Center, Max manuel ayarlama
- Farklı zaman dilimlerinde tutarlı renklendirme
- Validasyon ve hata mesajları

### ✅ Lejant Özellikleri
- 8 farklı pozisyon seçeneği
- Yatay/Dikey orientasyon
- Özelleştirilebilir boyut
- 16+ sayı formatı seçeneği
- Başlık gösterme/gizleme
- Hover vurgulama
- Sıralama ters çevirme

## 📊 Sayı Format Seçenekleri

```ts
'1,000'       // 1.234
'1,000.0'     // 1.234,5
'1,000.00'    // 1.234,56
'0%'          // 12%
'0.0%'        // 12,3%
'0a'          // 1k, 123k
'0.[0]a'      // 1k, 123,4k
```

## 🔧 Gelişmiş Kullanım

### Custom Format İçin Formatter Genişletme

```ts
// numberFormatter.ts içinde custom format ekle
export function formatNumber(value: number, format: NumberFormat): string {
  // ... mevcut kodlar

  if (format === 'custom') {
    // Kendi custom formatınızı ekleyin
    return customFormatter(value)
  }
}
```

### Legend Pozisyon CSS Özelleştirme

```css
/* globals.css veya styles.css */
.legend.above {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.legend.inside-right-bottom {
  position: absolute;
  bottom: 20px;
  right: 20px;
}
```

## 🐛 Sorun Giderme

### Renk Gradyanı Görünmüyor
- `colorInterpolation.ts` dosyasının doğru import edildiğinden emin olun
- `chroma-js` kütüphanesinin yüklü olduğunu kontrol edin

### Lejant Hover Çalışmıyor
- `onHover` prop'unun `Legend` bileşenine geçildiğinden emin olun
- `highlightOnHover` ayarının `true` olduğunu kontrol edin

### Store Güncellenmiyor
- `setColorConfig`, `setLegendConfig`, `setCustomRange` fonksiyonlarının doğru çağrıldığından emin olun
- React DevTools ile store state'ini kontrol edin

## 📚 Ek Kaynaklar

- [D3 Scale Documentation](https://github.com/d3/d3-scale)
- [Chroma.js Documentation](https://gka.github.io/chroma.js/)
- [ColorBrewer Palettes](https://colorbrewer2.org/)

## 🎉 Sonuç

Artık projenizde profesyonel renk interpolasyonu ve lejant özellikleri kullanabilirsiniz!

Herhangi bir sorunuz olursa lütfen dokümantasyonu inceleyin veya issue açın.
