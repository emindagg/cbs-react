# Renk Ölçeği Entegrasyonu

Güncellendi: 2026-05-01

Bu belge, renk ölçeği ayarlarının Viz Wizard, store, render servisleri ve harita üstü lejant arasında nasıl aktığını açıklar. Özellik listesi için `docs/COLOR_SCALE_FEATURES.md` dosyasına bakılmalıdır.

## Güncel Entegrasyon Zinciri

Renk ölçeğiyle ilgili ana akış şu dosyalardan geçer:

1. `src/features/viz-wizard/steps/Step3/index.tsx`
2. `src/features/viz-wizard/steps/Step3/useVizWizardStep3.ts`
3. `src/stores/useVisualizationStore.ts`
4. `src/features/viz-wizard/hooks/useVizRender.ts`
5. `src/shared/visualization/index.ts`
6. `src/features/visualization/shared/VisualizationManager.ts`
7. Renderer servisleri:
   - `src/features/visualization/choropleth/services/ChoroplethRenderer.ts`
   - `src/features/visualization/bubble/services/BubbleRenderer.ts`
   - `src/features/visualization/point/services/PointRenderer.ts`
8. Harita üstü UI:
   - `src/features/legend/components/Container.tsx`
   - `src/components/layout/AppLayout.tsx`

Özet akış:

- Step 3 kullanıcı ayarlarını toplar.
- Store ayarları `vizSettings`, `colorConfig`, `mapTitle` ve `currentVisualization` altında tutar.
- `useVizRender()` render anında güncel store değerlerini okur, veriyi hazırlar ve `VisualizationManager` üzerinden doğru renderer'ı çağırır.
- Renderer MapLibre source/layer ifadelerini üretir.
- Render tamamlanınca `currentVisualization` snapshot'ı güncellenir.
- `LegendContainer` canlı wizard state'i yerine mümkün olduğunca render snapshot'ını kullanarak lejantı üretir.

## Step 3 Orkestrasyonu

`src/features/viz-wizard/steps/Step3/index.tsx` görselleştirme tipi, renk ölçeği, bubble/dot ayarları, özel aralık, veri dağılımı önizlemesi, harita ayarları, lejant ayarları ve harita başlığını aynı adımda yönetir.

`useVizWizardStep3()` şu state ve handler'ları bağlar:

- `vizSettings`
- `setVizSettings`
- `colorConfig`
- `setColorConfig`
- `setCustomRange`
- `setLegendConfig`
- `mapTitle`
- `setMapTitle`
- `useVizSuggestion()` çıktıları
- `useVizRender()` çıktıları
- panel aç/kapat state'leri
- `dataValues`

`dataValues`, renderer tarafındaki last-write-wins davranışına yakın durmak için aynı lokasyon anahtarında son değeri kullanacak şekilde dedupe edilir.

## Görünürlük Kuralları

| UI parçası | Gösterim koşulu |
|---|---|
| `ColorScaleConfig` | `choropleth` veya `bubble + colorColumn` |
| `ColorSchemePicker` | `ColorScaleConfig` ile aynı |
| `BubbleSettings` | Sadece `bubble` |
| `DotDensitySettings` | Sadece `dot` |
| `StepsSection` | `scaleType === 'steps'`, `dot` değil, tek renkli `bubble` değil |
| Akıllı öneri paneli | Sadece `choropleth` |
| `CustomRangeConfig` | Her zaman "Değer Aralığı" kartında |
| `DataDistributionPreview` | Toggle açık ve veri varsa |
| `LegendConfig` | Collapsible "Lejant Ayarları" panelinde |
| `MapTitleSection` | Collapsible harita başlığı panelinde |

## Ölçek Tipi Senkronizasyonu

`ColorScaleConfig.onScaleTypeChange` hem UI state'ini hem render state'ini günceller.

Sürekli moda geçiş:

```tsx
setColorConfig({ scaleType: 'continuous' })
setVizSettings({
  classificationMethod: 'continuous-linear',
  legendType: 'continuous',
  interpolation: colorConfig.interpolation ?? 'equidistant',
})
```

Basamaklı moda dönüş:

```tsx
setColorConfig({ scaleType: 'steps' })
setVizSettings({
  classificationMethod: 'equal',
  legendType: 'discrete',
})
```

Interpolasyon mapping'i:

| İnterpolasyon | `classificationMethod` |
|---|---|
| `equidistant` | `continuous-linear` |
| `quantiles-4` | `continuous-quantile` |
| `quantiles-5` | `continuous-quantile` |
| `quantiles-10` | `continuous-quantile` |
| `natural-9` | `continuous-natural` |

Renderer seviyesinde stepped/continuous ayrımı esas olarak `settings.legendType` üzerinden uygulanır. Lejant tarafında ise `LegendContainer` renk barını üretirken `colorConfig.scaleType` değerini kullanır.

## Store Sözleşmesi

Renk ölçeğiyle ilgili iki ana state katmanı vardır.

### `vizSettings`

Renderer'a giden ana görselleştirme sözleşmesidir. Tipi `VisualizationSettings` olarak `src/types/visualization.ts` içinde tanımlıdır.

Renk ve lejantla ilişkili alanlar:

- `type`
- `classCount`
- `classificationMethod`
- `colorScheme`
- `legendType`
- `interpolation`
- `customBreaks`
- `customRange`
- `colorColumn`
- `noDataColor`
- `dataOnlyMode`
- `dataOnlyStyle`
- `showLabels`
- `showValues`
- `valueLabelFormat`
- `labelColor`
- `valueColor`
- `outlineColor`
- `outlineOpacity`

Bubble ve dot density için ek alanlar da aynı sözleşmede yer alır.

### `colorConfig`

Step 3 renk/lejant UI state'ini taşır:

```ts
export interface ColorConfiguration {
  column: string | null
  palette: ColorScheme
  scaleType: 'steps' | 'continuous'
  interpolation: InterpolationMethod
  customRange?: CustomRange
  legend: LegendConfiguration
}
```

Güncelleme davranışı:

- `setVizSettings()` önce `sanitizeVizSettings()` çalıştırır.
- `setColorConfig()` shallow merge yapar.
- `setLegendConfig()` nested `legend` merge yapar.
- `setCustomRange()` nested `customRange` merge yapar.

Clamp ve validasyon:

- `classCount`: 3-7 aralığına çekilir.
- `bubbleLegendCount`: 3-7 aralığına çekilir.
- `customBreaks.length`: 4-8 aralığında olmalıdır.
- Geçerli `customBreaks` geldiğinde `classCount`, sınır değeri sayısına göre güncellenir.
- Geçersiz `customBreaks` store tarafından mevcut değer korunarak reddedilir.

## Render Köprüsü

`src/features/viz-wizard/hooks/useVizRender.ts`, Step 3 state'ini renderer sözleşmesine dönüştürür.

Render sırasında yapılan işler:

1. Başarılı eşleşmelerden render datası çıkarılır.
2. Seçili veri sütunu zorunlu olarak kontrol edilir.
3. Sayısal değerler `numberFormatter` yerel ayıraç mantığıyla parse edilir.
4. Bubble bivariate modunda `colorColumn` ayrıca sayısallaştırılır.
5. Normalizasyon `applyNormalizationMulti()` ile render öncesinde uygulanır.
6. `renderSettings` içine `customRange` ve `valueLabelFormat` taşınır.
7. `VisualizationManager` seçili tipe göre çağrılır.
8. Render snapshot'ı `currentVisualization` içine yazılır.

`currentVisualization` şu alanları tutar:

- `type`
- `data`
- `column`
- `locationLevel`
- `renderSettings`

Bu snapshot, lejant ve style rehydrate akışları için kaynak kabul edilir.

## Güncelleme Tetikleyicileri

`useVizRender()` üç ayrı güncelleme yolu kullanır.

Tam render tetikleyen alanlar:

- `classificationMethod`
- `customBreaks`
- `classCount`
- `colorScheme`
- `legendType`
- `interpolation`
- `dotValue`
- `backdropFillOpacity`
- `customRange.enabled`
- `customRange.min`
- `customRange.max`
- `customRange.outOfRangeMode`
- `symbolFillColor`
- `colorColumn`
- `bubbleSizeMode`
- `symbolScaling`
- `symbolMinSize`
- `symbolMaxSize`
- `colorConfig.legend.format`

Paint-only güncellenen alanlar:

- `dotSize`
- `dotColor`
- `dotOpacity`
- `choroplethOpacity`
- `symbolStrokeColor`
- `symbolOpacity`
- `symbolStrokeWidth`

Display-only güncellenen alanlar:

- `showLabels`
- `showValues`
- `dataOnlyMode`
- `noDataColor`
- `labelColor`
- `valueColor`
- `outlineColor`
- `outlineOpacity`

Display-only yolda `VisualizationManager.updateDisplayOptions()` mevcut layer filtrelerini, dolgu/çizgi renklerini ve label layer'larını yerinde günceller.

## VisualizationManager

Gerçek dosya:

- `src/features/visualization/shared/VisualizationManager.ts`

Facade:

- `src/shared/visualization/index.ts`

`VisualizationManager` şu renderer'ları yönetir:

- `ChoroplethRenderer`
- `BubbleRenderer`
- `PointRenderer`

Ayrıca il/ilçe GeoJSON verisini yükler, province/district index oluşturur, visualization layer'larını temizler ve display-only güncellemeleri yönetir.

Önemli not: `src/shared/visualization/VisualizationManager.ts` adlı bir dosya yoktur; `src/shared/visualization/index.ts` yalnızca facade'dır.

## Choropleth Renderer

Dosya:

- `src/features/visualization/choropleth/services/ChoroplethRenderer.ts`

Akış:

1. Veri sütunundan sayısal değerleri çıkarır.
2. Özel aralık varsa renk domain'ini min/max içine clamp eder.
3. `classificationMethod + classCount` veya `customBreaks` ile break üretir.
4. `legendType === 'continuous'` ise 16 stop'lu `interpolate` ifadesi üretir.
5. Aksi halde `step` ifadesi üretir.
6. `custom` modda sınır dışı değerler için ek `case` koruması ekler.
7. Feature property'lerine `displayName`, `dataValue`, `hasData`, `inCustomRange` ekler.
8. Label point source'u üretir ve `applyLabelLayers()` çağırır.

Özel davranışlar:

- `gray` modu aralık dışı bölgeleri griye boyar.
- `transparent` modu aralık dışı bölgeleri filtreler.
- `noDataColor`, verisi olmayan polygon dolgusuna uygulanır.
- `dataOnlyMode` verisi olmayan bölgeleri gizleyebilir veya şeffaflaştırabilir.
- `choroplethOpacity` paint-only güncellenebilir.

## Bubble Renderer

Dosya:

- `src/features/visualization/bubble/services/BubbleRenderer.ts`

Akış:

1. Boyut sütunu için `dataColumn`, renk için `colorColumn || dataColumn` seçilir.
2. Veriler renderer içinde değil, `useVizRender()` tarafında normalize edilmiş kabul edilir.
3. Data map last-write-wins mantığıyla kurulur.
4. Size ve color değerleri ayrı hesaplanır.
5. `colorColumn` varsa bivariate renk ölçeği çalışır.
6. `colorColumn` yoksa sabit `symbolFillColor` veya varsayılan bubble rengi kullanılır.
7. `bubbleSizeMode === 'graduated'` ise boyut için break üretilir.
8. Bubbles centroid noktalara çevrilir.
9. Büyük kabarcıklar altta kalacak şekilde sıralanır.
10. Backdrop polygon source/layer'ları ve label source'u eklenir.

Özel davranışlar:

- Sürekli renk modunda 16 stop'lu LAB tabanlı ifade üretilir.
- Özel aralık renk değerlerine uygulanır, boyut değerlerine uygulanmaz.
- `transparent` özel aralık modu bubble filtrelerine yansır.
- Tek renkli bubble modunda renk lejantı bypass edilir.
- `noDataColor`, kabarcıklara değil backdrop polygon dolgusuna uygulanır.

## Dot Density Renderer

Dosya:

- `src/features/visualization/point/services/PointRenderer.ts`

Bu akış sınıflandırılmış renk ölçeği kullanmaz.

Davranış:

- `dotValue` yoksa `calculateSmartDotValue()` kullanılır.
- Noktalar seeded PRNG ile polygon içine deterministik saçılır.
- `MAX_DOTS_PER_FEATURE` ve `MAX_TOTAL_DOTS` limitleri uygulanır.
- Tek `dotColor` ile render edilir.
- `gray` modu aralık dışı noktaları gri yapar.
- `transparent` modu aralık dışı noktaları filtreler.
- `noDataColor`, backdrop polygon dolgusuna uygulanır.

## Lejant Entegrasyonu

Harita üstü gerçek mount noktası:

- `src/components/layout/AppLayout.tsx`

```tsx
<LegendContainer />
```

Lejant seçici:

- `src/features/legend/components/Container.tsx`

`LegendContainer` şu girdilerle çalışır:

- `colorConfig`
- `vizSettings`
- `currentVisualization`
- `matchResults`

Önemli davranış:

- Render sonrası `currentVisualization.renderSettings` birincil kaynaktır.
- Render snapshot'ı yoksa `vizSettings` fallback olur.
- Bubble için legend min/max hesapları renderer'ın dedupe mantığıyla uyumlu olacak şekilde snapshot'tan çıkarılır.
- Bivariate bubble modunda renk lejantı `colorColumn` değerlerinden hesaplanır.

Lejant kırılımları:

- Continuous modda `[min, max]` kullanılır; özel aralık açıksa min/max özel aralıktan alınır.
- Steps modda `customBreaks` varsa doğrudan kullanılır.
- Steps modda `customBreaks` yoksa `calculateBreaks()` kullanılır.
- Steps modda özel aralık açıksa değerler lejant hesabında da clamp edilir.

Lejant renkleri:

- Continuous modda `getInterpolatedColorPalette(colorScheme, 30, 'lab')`
- Steps modda sınıf sayısı veya custom break sayısına göre `getInterpolatedColorPalette(...)`

Lejant bileşeni seçimi:

- `dot` için `DotDensityLegend`
- Tek renkli proportional bubble için sadece `BubbleSizeLegend`
- Tek renkli graduated bubble için sadece `BubbleSizeLegend`
- Bivariate bubble için renk lejantı ve boyut lejantı
- Dikey renk lejantı için `ColorLegend`
- Yatay renk lejantı için `DynamicLegend`

## Lejant Konfigürasyon Paneli

Facade:

- `src/shared/legend/index.ts`

Gerçek panel:

- `src/features/legend/components/Config.tsx`

Step 3 kullanımı:

```tsx
<LegendConfig
  config={colorConfig.legend}
  onChange={(config) => setLegendConfig(config)}
  classCount={vizSettings.classCount}
/>
```

Panelin yönettiği alanlar:

- `visible`
- `size`
- `orientation`
- `labels.type`
- `labels.customLabels`
- `format`
- `title.show`
- `title.text`
- `title.fontSize`
- `reverseOrder`
- north arrow store ayarları

Not: `LegendConfiguration.position` tipi vardır ve render bileşenleri bunu kullanır, ancak güncel config panelinde konum seçicisi yoktur.

## Sayı Formatı Entegrasyonu

Sayı formatı:

- `src/utils/numberFormatter.ts`

`LegendConfiguration.format`, `NumberFormat` tipindedir. UI `FORMAT_OPTIONS` listesini kullanır.

UI'de görünen formatlar:

- `1,000`
- `1,000.0`
- `1,000.00`
- `1,000.000`
- `0`
- `0.0`
- `0.00`
- `0.000`
- `0.[0]`
- `0.[00]`
- `0%`
- `0.0%`
- `0.00%`
- `0,0`
- `0a`
- `0.[0]a`

Tipte bulunan `0o` ve `custom` değerleri select içinde sunulmaz. Geçersiz formatlar `coerceNumberFormat()` ile fallback değere çekilir.

## Style Rehydrate Entegrasyonu

`src/features/visualization/hooks/useVisualizationLayerPersistence.ts`, basemap style değişimlerinde mevcut visualization layer'larını yeniden kurar.

Davranış:

- `currentVisualization` snapshot'ı yoksa işlem yapmaz.
- Aktif layer zaten varsa tekrar render etmez.
- Style yüklendikten sonra doğru renderer'ı çağırır.
- Visualization layer'larını tekrar stack'in üstüne taşır.

## Gerçek Step 3 Kullanım Örneği

Sadeleştirilmiş akış:

```tsx
const {
  vizSettings,
  setVizSettings,
  colorConfig,
  setColorConfig,
  setCustomRange,
  setLegendConfig,
  dataValues,
} = useVizWizardStep3()

{(vizSettings.type === 'choropleth' || (vizSettings.type === 'bubble' && vizSettings.colorColumn)) && (
  <>
    <ColorScaleConfig
      colorScheme={vizSettings.colorScheme}
      classCount={vizSettings.classCount}
      scaleType={colorConfig.scaleType}
      interpolation={colorConfig.interpolation}
      onScaleTypeChange={(type) => { /* colorConfig + vizSettings sync */ }}
      onInterpolationChange={(interpolation) => { /* continuous method mapping */ }}
    />

    <ColorSchemePicker
      value={vizSettings.colorScheme}
      onChange={(scheme) => setVizSettings({ colorScheme: scheme })}
    />
  </>
)}

<CustomRangeConfig
  customRange={colorConfig.customRange!}
  autoMin={dataValues.length > 0 ? Math.min(...dataValues) : 0}
  autoMax={dataValues.length > 0 ? Math.max(...dataValues) : 100}
  onChange={(range) => setCustomRange(range)}
/>

<LegendConfig
  config={colorConfig.legend}
  onChange={(config) => setLegendConfig(config)}
  classCount={vizSettings.classCount}
/>
```

## Eski Referanslara Dikkat

- `VizWizardStep4` güncel runtime akışında yoktur; Step 3 eski Step 4 görevlerini de üstlenir.
- `src/utils/classificationMethods.ts` yoktur.
- `src/shared/visualization/VisualizationManager.ts` yoktur; gerçek manager `src/features/visualization/shared/VisualizationManager.ts` içindedir.
- `kmeans` sınıflandırması yoktur.
- Ana koroplet `StepsSection` içinde `stddev` gösterilmez.
- `CustomRange.center` renderer hesaplarında kullanılmaz.
- Bubble ve dot akışında `noDataColor` esasen backdrop polygon katmanına uygulanır.
- Tek renkli bubble modunda renk ölçeği ve renk lejantı bypass edilir.
- Dot density basamaklı/sürekli renk sınıflandırması kullanmaz.
- Lejant hover vurgulaması için güncel bir config alanı yoktur.

## İlgili Testler

- `src/utils/classification.test.ts`
- `src/utils/interpolation.test.ts`
- `src/utils/legendClassCount.test.ts`
- `src/constants/colorSchemes.test.ts`
- `src/stores/useVisualizationStore.test.ts`
- `src/features/viz-wizard/hooks/useVizRender.test.ts`
- `src/features/viz-wizard/steps/Step3/components/StepsSection.test.tsx`
- `src/features/viz-wizard/steps/Step3/components/CustomBreaksInput.test.tsx`
- `src/features/visualization/shared/customRange.test.ts`
- `src/features/visualization/choropleth/services/ChoroplethRenderer.test.ts`
- `src/features/visualization/bubble/services/BubbleRenderer.test.ts`
- `src/features/visualization/point/services/PointRenderer.test.ts`
- `src/features/legend/components/Container.test.tsx`
- `src/features/legend/components/BarContent.test.tsx`
- `src/features/legend/components/LegendLabels.test.tsx`
