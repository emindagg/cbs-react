# Datawrapper-Style Color Interpolation Features

This document describes the advanced color interpolation and data classification features inspired by Datawrapper.

## Overview

We've implemented a comprehensive color interpolation system that provides professional-grade data visualization capabilities similar to Datawrapper. The system includes:

1. **Multiple Color Spaces** (RGB, HSL, LAB, HCL)
2. **Advanced Classification Methods** (Quantile, Jenks, Linear, Logarithmic, Rounded)
3. **Continuous and Classed Color Scales**
4. **Data Distribution Preview**
5. **Smart Classification Suggestions**

## Key Components

### 1. Color Interpolation Utilities (`src/utils/colorInterpolation.ts`)

#### Color Spaces

- **LAB** (Recommended): Perceptually uniform color space - produces the most natural-looking color transitions
- **HCL**: Cylindrical LAB - provides smooth, controlled transitions
- **HSL**: Hue-based - creates vibrant, saturated colors
- **RGB**: Standard interpolation - simplest but can produce "muddy" intermediate colors

#### Functions

```typescript
// Generate smooth color scale
generateColorScale(colors: string[], steps: number, colorSpace: ColorSpace): string[]

// Generate Bezier-interpolated scale (smoother)
generateBezierColorScale(colors: string[], steps: number, colorSpace: ColorSpace): string[]

// Get continuous color for normalized value (0-1)
interpolateColor(hex1: string, hex2: string, t: number, colorSpace: ColorSpace): string

// Generate diverging scales
generateDivergingScale(start: string, mid: string, end: string, steps: number, colorSpace: ColorSpace): string[]
```

### 2. Classification Methods (`src/utils/classificationMethods.ts`)

#### Available Methods

1. **Linear (Equal Interval)**
   - Divides data range into equal-width intervals
   - Best for: Uniformly distributed data
   - Example: 0-20, 20-40, 40-60, 60-80, 80-100

2. **Quantile (Equal Count)**
   - Each class has approximately the same number of values
   - Best for: Skewed distributions
   - Ensures balanced visual representation

3. **Jenks (Natural Breaks)**
   - Minimizes within-class variance
   - Best for: Data with natural clusters
   - Reveals patterns in the data

4. **Rounded Values**
   - Uses human-readable round numbers
   - Best for: Public-facing visualizations
   - Example: 0, 10, 25, 50, 100

5. **Logarithmic**
   - Exponential scale
   - Best for: Data with large range (e.g., population, income)
   - Highlights differences in small values

#### Smart Suggestions

The system automatically analyzes data distribution and recommends the best classification method:

```typescript
const recommendation = suggestClassificationMethod(values)
// Returns: { method, reason, emoji, warning }
```

Factors considered:
- **Coefficient of Variation (CV)**: Measures data heterogeneity
- **Skewness**: Detects asymmetric distributions
- **Outliers**: Identifies extreme values using IQR method
- **Logarithmic range**: Determines if exponential scale is appropriate

### 3. React Components

#### ColorScaleConfig

Advanced color scale configuration with:
- Color space selector
- Interpolation mode (Linear vs Bezier)
- Real-time preview
- Collapsible advanced settings

```tsx
<ColorScaleConfig
  colorScheme="viridis"
  classCount={5}
  classificationMethod="quantile"
  onColorSpaceChange={(space) => console.log(space)}
  onInterpolationModeChange={(mode) => console.log(mode)}
/>
```

#### DataDistributionPreview

Shows data distribution with:
- Histogram visualization
- Color-coded bins
- Statistical summary (min, max, mean, median, CV)
- Method-specific explanations
- Skewness and outlier warnings

```tsx
<DataDistributionPreview
  values={dataValues}
  colorScheme="viridis"
  classCount={5}
  classificationMethod="quantile"
/>
```

### 4. Enhanced Color Schemes (`src/constants/colorSchemes.ts`)

#### New Functions

```typescript
// Get interpolated palette with advanced color space support
getInterpolatedColorPalette(scheme: ColorScheme, count: number, space: ColorSpace): string[]

// Get continuous color for normalized value
getContinuousColor(value: number, scheme: ColorScheme, space: ColorSpace): string

// Get color with smooth interpolation
getContinuousColorForValue(value: number, values: number[], scheme: ColorScheme, space: ColorSpace): string
```

## Usage Examples

### Basic Usage

```typescript
import { generateColorScale } from '../utils/colorInterpolation'
import { calculateBreaks } from '../utils/classificationMethods'

// Generate color scale
const colors = ['#440154', '#21918c', '#fde725']
const palette = generateColorScale(colors, 10, 'lab')

// Calculate breaks
const values = [10, 20, 25, 30, 50, 100, 150, 200]
const breaks = calculateBreaks(values, 'quantile', 5)
```

### Advanced Interpolation

```typescript
import { generateBezierColorScale } from '../utils/colorInterpolation'

// Smoother transitions with Bezier interpolation
const smoothPalette = generateBezierColorScale(
  ['#440154', '#21918c', '#fde725'],
  20,
  'lab'
)
```

### Continuous Scales

```typescript
import { getContinuousColor } from '../constants/colorSchemes'

// Map value to continuous color
const normalizedValue = (value - min) / (max - min)
const color = getContinuousColor(normalizedValue, 'viridis', 'lab')
```

### Smart Classification

```typescript
import { suggestClassificationMethod, calculateBreaks } from '../utils/classificationMethods'

const values = [/* your data */]
const suggestion = suggestClassificationMethod(values)

console.log(`Recommended: ${suggestion.method}`)
console.log(`Reason: ${suggestion.reason}`)

if (suggestion.warning) {
  console.warn(suggestion.warning)
}

const breaks = calculateBreaks(values, suggestion.method, 5)
```

## Integration with Visualization Wizard

The features are integrated into `VizWizardStep4`:

1. **Color Scheme Selection**: Choose from predefined palettes
2. **Classification Method**: Select or accept smart suggestions
3. **Advanced Settings**: Configure color space and interpolation mode
4. **Data Preview**: View distribution and histogram before rendering
5. **Real-time Preview**: See color scale changes immediately

## Best Practices

### When to Use Each Color Space

1. **LAB** (Default)
   - Most situations
   - Scientific visualizations
   - Perceptually accurate colors

2. **HCL**
   - Diverging color schemes
   - Smooth gradients
   - Maintaining constant brightness

3. **HSL**
   - Vibrant visualizations
   - Rainbow gradients
   - Marketing materials

4. **RGB**
   - Simple linear interpolation
   - When color accuracy isn't critical
   - Legacy compatibility

### Classification Method Selection

| Data Type | Recommended Method | Reason |
|-----------|-------------------|---------|
| Uniform distribution | Linear | Equal intervals make sense |
| Skewed data | Quantile | Ensures visual balance |
| Clustered data | Jenks | Reveals natural groups |
| Large range (>100x) | Logarithmic | Shows detail in small values |
| Public-facing | Rounded | Easy-to-read numbers |

### Performance Considerations

- **Classed scales**: Fast, simple, clear breaks
- **Continuous scales**: Smooth but more computation
- **Bezier interpolation**: Smoothest but slowest

For large datasets (>10,000 points), prefer classed scales with LAB color space.

## Turkish Localization

All UI elements support Turkish language:

- Renk Uzayı (Color Space)
- Sınıflandırma (Classification)
- Veri Dağılımı (Data Distribution)
- Yüzdelik (Quantile)
- Doğal Kırılma (Natural Breaks/Jenks)
- Logaritmik (Logarithmic)

## Technical Details

### Color Space Conversion Accuracy

- **RGB ↔ LAB**: Uses D65 illuminant, accurate for sRGB
- **RGB ↔ HCL**: Cylindrical transformation of LAB
- **RGB ↔ HSL**: Standard HSL conversion

### Jenks Algorithm

Implements Fisher-Jenks Natural Breaks optimization:
- O(n²k) time complexity where n = data points, k = classes
- Dynamic programming approach
- Minimizes within-class variance
- Fallback to quantile for edge cases

### Data Statistics

Comprehensive statistics calculated:
- **CV (Coefficient of Variation)**: stdDev / mean × 100
- **Skewness**: (mean - median) / range
- **IQR**: Q3 - Q1 (for outlier detection)
- **Outliers**: Values outside [Q1 - 1.5×IQR, Q3 + 1.5×IQR]

## Future Enhancements

Potential additions:
- Custom color palette creator
- Color-blind safe palette suggestions
- Export color scales for other tools
- A/B testing different classification methods
- Animated transitions between scales
- Multi-hue diverging scales

## References

- [Datawrapper Blog: Color Interpolation](https://www.datawrapper.de/blog/interpolation-for-color-scales-and-maps)
- [CIE LAB Color Space](https://en.wikipedia.org/wiki/CIELAB_color_space)
- [Jenks Natural Breaks](https://en.wikipedia.org/wiki/Jenks_natural_breaks_optimization)
- [ColorBrewer](https://colorbrewer2.org/)
