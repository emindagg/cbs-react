# Renk Ölçeği Entegrasyonu

Bu belge, renk ölçeği özelliğinin projede nasıl bağlandığını açıklar. `docs/COLOR_SCALE_FEATURES.md` hangi özelliklerin desteklendiğini anlatır; bu dosya ise o özelliklerin `Viz Wizard`, store, renderer ve lejant katmanları arasında nasıl aktığını gösterir.

## Entegrasyon Zinciri

Mevcut akış şu sırayla çalışır:

1. `src/features/viz-wizard/steps/Step3/index.tsx`
2. `src/features/viz-wizard/steps/Step3/useVizWizardStep3.ts`
3. `src/stores/useVisualizationStore.ts`
4. `src/features/viz-wizard/hooks/useVizRender.ts`
5. `src/shared/visualization/VisualizationManager.ts`
6. Renderer sınıfları:
   - `src/features/visualization/choropleth/services/ChoroplethRenderer.ts`
   - `src/features/visualization/bubble/services/BubbleRenderer.ts`
   - `src/features/visualization/point/services/PointRenderer.ts`
7. Harita üstü lejant:
   - `src/features/legend/components/Container.tsx`
   - `src/components/layout/AppLayout.tsx`

Özet olarak:

- Step 3 kullanıcı ayarlarını toplar
- Store bu ayarları `vizSettings` ve `colorConfig` içinde tutar
- `useVizRender()` bu state'i render ayarına dönüştürür
- `VisualizationManager` doğru renderer'ı çağırır
- `LegendContainer` mevcut görselleştirme state'ine göre uygun lejantı seçer

## Step 3 Orkestrasyonu

Ana orkestrasyon bileşeni `src/features/viz-wizard/steps/Step3/index.tsx` dosyasıdır.

`useVizWizardStep3()` hook'u şu alanları bağlar:

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

### Görünürlük Kuralları

Step 3 içinde renk ölçeğiyle ilgili paneller her durumda aynı görünmez:

| UI parçası | Gösterim koşulu |
|------------|------------------|
| `ColorScaleConfig` | `choropleth` veya `bubble` + `colorColumn` |
| `ColorSchemePicker` | `ColorScaleConfig` ile aynı |
| `BubbleSettings` | sadece `bubble` |
| `DotDensitySettings` | sadece `dot` |
| `StepsSection` | `scaleType === 'steps'` ve `dot` değil ve tek renkli `bubble` değil |
| Akıllı öneri paneli | sadece `choropleth` akışı |
| `CustomRangeConfig` | ayrı “Değer Aralığı” kartında her zaman |
| `LegendConfig` paneli | collapsible panel olarak kullanılabilir |
| `DataDistributionPreview` | ayrı toggle ile açılır |

### Ölçek Tipi Değiştiğinde

`ColorScaleConfig.onScaleTypeChange` yalnızca UI state'i değil, render state'ini de günceller:

```tsx
onScaleTypeChange={(type) => {
  setColorConfig({ scaleType: type })

  if (type === 'continuous') {
    setVizSettings({
      classificationMethod: 'continuous-linear',
      legendType: 'continuous',
      interpolation: colorConfig.interpolation ?? 'equidistant',
    })
  } else {
    setVizSettings({
      classificationMethod: 'equal',
      legendType: 'discrete',
    })
  }
}}
```

### İnterpolasyon Değiştiğinde

Sürekli modda seçilen preset, `vizSettings.classificationMethod` alanına map edilir:

| İnterpolasyon | `classificationMethod` |
|---------------|-------------------------|
| `equidistant` | `continuous-linear` |
| `quantiles-4` | `continuous-quantile` |
| `quantiles-5` | `continuous-quantile` |
| `quantiles-10` | `continuous-quantile` |
| `natural-9` | `continuous-natural` |

Bu mapping Step 3 içinde yapılır; renderer bu alanları doğrudan store'dan alır.

## Store ve Type Sözleşmesi

Renk ölçeği entegrasyonunda iki farklı state katmanı vardır:

### `vizSettings`

Renderer'a giden ana görselleştirme sözleşmesidir. `src/types/visualization.ts` içindeki `VisualizationSettings` üzerinden tanımlanır.

Renk ölçeğiyle ilgili başlıca alanlar:

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

Bubble ve dot density için de ek alanlar buradadır.

### `colorConfig`

Step 3 UI panelinin renk/lejant state'ini taşır:

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

### Store Güncelleme Davranışı

`src/stores/useVisualizationStore.ts` içinde:

- `setVizSettings()` doğrudan merge yapmaz, önce `sanitizeVizSettings()` çalıştırır
- `setColorConfig()` shallow merge yapar
- `setLegendConfig()` nested `legend` merge yapar
- `setCustomRange()` nested `customRange` merge yapar

### Clamp ve Validasyon Kuralları

`src/utils/legendClassCount.ts` ve `sanitizeVizSettings()` üzerinden:

- `classCount`: minimum `3`, maksimum `7`
- `bubbleLegendCount`: minimum `3`, maksimum `7`
- `customBreaks.length`: minimum `4`, maksimum `8`
- Geçerli `customBreaks` gelirse `classCount = customBreaks.length - 1` olacak şekilde normalize edilir
- Geçersiz `customBreaks` store tarafından reddedilir

## Veri Önizleme ve Öneri Entegrasyonu

### `DataDistributionPreview`

`src/features/viz-wizard/components/ColorScale/DistributionPreview.tsx`

Bu bileşen:

- stepped modda `calculateBreaks()`
- continuous modda `calculateBreaksFromInterpolation()`
- sınıf sayısı için `getClassCountFromInterpolation()`
- istatistikler için `calculateDataStats()`

kullanır.

Gösterilen bilgiler:

- min / max
- ortalama / medyan
- CV / skewness / outlier uyarıları
- sınıf bazlı histogram benzeri dağılım görünümü

### `useVizSuggestion`

`src/features/viz-wizard/hooks/useVizSuggestion.ts`

Bu hook:

- eşleşmiş verilerden sayısal değerleri çıkarır
- `suggestClassificationMethod()` çağırır
- Step 3 içinde öneri panelini besler

Mevcut implementasyonda öneri mekanizması yalnızca `quantile` veya `jenks` döndürür.

## Özel Aralık Entegrasyonu

### Step 3 Katmanı

`CustomRangeConfig` Step 3 içinde ayrı bir “Değer Aralığı” kartı olarak bulunur:

```tsx
<CustomRangeConfig
  customRange={colorConfig.customRange!}
  autoMin={dataValues.length > 0 ? Math.min(...dataValues) : 0}
  autoMax={dataValues.length > 0 ? Math.max(...dataValues) : 100}
  onChange={(range) => setCustomRange(range)}
/>
```

`src/features/viz-wizard/components/CustomRange/useCustomRange.ts` şu işlerden sorumludur:

- Türkçe sayı formatı ile input yönetimi
- `min < center < max` doğrulaması
- toggle davranışı
- `outOfRangeMode` korunumu

### Renderer Katmanı

Ortak çözümleyici `src/features/visualization/shared/customRange.ts` dosyasında yer alır.

Önemli notlar:

- renderer tarafında yalnızca `min` ve `max` uygulanır
- `center` şu an render davranışını değiştirmez
- varsayılan `outOfRangeMode` değeri `gray`'dir

## Renderer Entegrasyonu

### Choropleth

`src/features/visualization/choropleth/services/ChoroplethRenderer.ts`

Akış:

1. sayısal değerleri çıkarır
2. `customRange` varsa değerleri clamp eder
3. `classificationMethod + classCount` ile break üretir
4. `legendType === 'continuous'` ise 16 stop'lu `interpolate` ifadesi üretir
5. aksi halde `step` ifadesi üretir
6. `hasData`, `dataValue`, `displayName`, `inCustomRange` alanlarını feature'lara ekler

Ek davranışlar:

- `gray` modu aralık dışı bölgeleri gri boyar
- `transparent` modu katman filtresiyle çalışır
- `noDataColor` doğrudan no-data polygon renk ifadesine uygulanır
- `dataOnlyMode` no-data bölgeleri gizleyebilir veya şeffaflaştırabilir

### Bubble

`src/features/visualization/bubble/services/BubbleRenderer.ts`

Akış:

- `colorColumn` varsa bivariate mod çalışır
- yoksa kabarcıklar tek renk (`symbolFillColor` veya default) ile çizilir
- renk tarafında stepped/continuous expression üretimi choropleth ile aynı mantıktadır
- boyut tarafında `proportional` veya `graduated` radius hesaplanır

Ek davranışlar:

- backdrop polygon fill + outline katmanları ayrı source ile yönetilir
- kabarcıklar centroid noktalara çevrilir
- büyük kabarcıklar altta kalacak şekilde sıralanır
- `customRange` renk değerlerine uygulanır, boyut değerlerine uygulanmaz
- `noDataColor` kabarcıklara değil backdrop polygon katmanına uygulanır

### Dot Density

`src/features/visualization/point/services/PointRenderer.ts`

Bu akış sınıflandırılmış renk ölçeği kullanmaz.

Davranış:

- tek renkli nokta render eder
- `dotValue` ile nokta sayısını hesaplar
- seeded PRNG ile polygon içine deterministik saçılım yapar
- ayrı backdrop polygon katmanı kullanır
- `gray` modu aralık dışı noktaları gri yapar
- `transparent` modu aralık dışı noktaları filtreler
- `noDataColor` yine backdrop polygon katmanına uygulanır

## Render Tetikleme ve Paint-Only Güncellemeler

`src/features/viz-wizard/hooks/useVizRender.ts`

Bu hook iki ayrı güncelleme yolu kullanır:

- tam render:
  veri dağılımını etkileyen ayarlarda `VisualizationManager` yeniden çalışır
- paint-only update:
  yalnızca görünümü etkileyen ayarlarda `setPaintProperty()` kullanılır

Bu ayrım özellikle şu alanlarda önemlidir:

- `classificationMethod`
- `classCount`
- `colorScheme`
- `legendType`
- `interpolation`
- `customRange`
- `colorColumn`
- `symbolScaling`
- `symbolMinSize`
- `symbolMaxSize`

tam render tetiklerken;

- opaklık
- stroke
- dot size / dot color

gibi alanlar paint-only güncellenebilir.

## Lejant Entegrasyonu

### Konfigürasyon Paneli

`src/shared/legend/index.ts` yalnızca ince bir facade'dır ve dışarıya `LegendConfig` re-export eder.

Gerçek panel:

- `src/features/legend/components/Config.tsx`

Gerçek prop sözleşmesi:

```tsx
<LegendConfig
  config={colorConfig.legend}
  onChange={(config) => setLegendConfig(config)}
  classCount={vizSettings.classCount}
/>
```

Bu panel yalnızca lejant ayarlarını değil, aynı zamanda `useMapStore` üzerinden north arrow ayarlarını da yönetir.

### Harita Üstü Lejant

Harita üstü gerçek mount noktası:

- `src/components/layout/AppLayout.tsx`

```tsx
<LegendContainer />
```

`src/features/legend/components/Container.tsx` mevcut görselleştirmeye göre şu bileşenlerden uygun olanı seçer:

- `DynamicLegend`
- `ColorLegend`
- `BubbleSizeLegend`
- `DotDensityLegend`

Seçim şu state'lere göre yapılır:

- `vizSettings.type`
- `vizSettings.classificationMethod`
- `vizSettings.colorColumn`
- `vizSettings.bubbleSizeMode`
- `colorConfig.scaleType`
- `colorConfig.legend.orientation`

Bu nedenle entegrasyon dokümanında hayali bir `Legend.tsx` overlay bileşeninden değil, `LegendContainer` ve onun seçici mantığından söz edilmelidir.

## Sayı Formatı Entegrasyonu

`src/utils/numberFormatter.ts` içindeki `NumberFormat` union, legend config tarafında kullanılır.

Önemli notlar:

- `LegendConfiguration.format` tipi `string` değil `NumberFormat`
- UI select'i `FORMAT_OPTIONS` listesini kullanır
- type düzeyinde bulunan `0o` ve `custom` formatları legend select içinde sunulmaz
- geçersiz formatlar `coerceNumberFormat()` ile `1,000` değerine düşer

## Gerçek Kullanım Örneği

Step 3 içindeki gerçek entegrasyonun sadeleştirilmiş hali:

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
      onScaleTypeChange={(type) => { /* store sync */ }}
      onInterpolationChange={(interpolation) => { /* mapping sync */ }}
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

## Dikkat Edilecek Noktalar

- `docs/COLOR_SCALE_FEATURES.md` ile görev ayrımı korunmalı:
  bu dosya entegrasyon akışını, diğeri feature setini anlatır
- `classificationMethods.ts` diye bir dosya yoktur
- `StyleConfig.tsx` projede bulunur ama Step 3'ün ana entegrasyon yolu değildir
- `CustomRange.center` UI state'inde vardır ama renderer tarafında şu an kullanılmaz
- Dot density renk ölçeği sınıflandırması kullanmaz
- Bubble ve dot akışında `noDataColor` esasen backdrop polygon katmanına uygulanır

## İlgili Dosyalar

- `src/features/viz-wizard/steps/Step3/index.tsx`
- `src/features/viz-wizard/steps/Step3/useVizWizardStep3.ts`
- `src/features/viz-wizard/hooks/useVizRender.ts`
- `src/features/viz-wizard/hooks/useVizSuggestion.ts`
- `src/features/viz-wizard/components/ColorScale/Config.tsx`
- `src/features/viz-wizard/components/ColorScale/DistributionPreview.tsx`
- `src/features/viz-wizard/components/CustomRange/Config.tsx`
- `src/features/viz-wizard/components/CustomRange/useCustomRange.ts`
- `src/stores/useVisualizationStore.ts`
- `src/types/visualization.ts`
- `src/features/visualization/choropleth/services/ChoroplethRenderer.ts`
- `src/features/visualization/bubble/services/BubbleRenderer.ts`
- `src/features/visualization/point/services/PointRenderer.ts`
- `src/features/visualization/shared/customRange.ts`
- `src/features/legend/components/Config.tsx`
- `src/features/legend/components/Container.tsx`
- `src/components/layout/AppLayout.tsx`
