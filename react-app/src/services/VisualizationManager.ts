/**
 * Visualization Manager
 * Handles GeoJSON loading and map visualization rendering
 */

import type { Map } from 'maplibre-gl';
import { normalizeTurkishText } from '../utils/turkishNormalizer';
import { calculateBreaks, suggestClassificationMethod } from '../utils/classificationMethods';
import type { VisualizationSettings, ClassificationMethod, ColorScheme } from '../types/visualization';

export class VisualizationManager {
  private map: Map;

  // Cached GeoJSON data
  private provincesGeoJSON: any | null = null;
  private districtsGeoJSON: any | null = null;

  // Province and district indexes
  private provinceIndex: Record<string, any> | null = null;
  private districtIndex: Record<string, any[]> | null = null;

  // Color schemes
  private colorSchemes: Record<ColorScheme, string[]> = {
    viridis: [
      '#440154',
      '#472777',
      '#3b528b',
      '#2c728e',
      '#21918c',
      '#27ad81',
      '#5ec962',
      '#aadc32',
      '#fde725',
    ],
    topographic: [
      '#4a6741',
      '#7b9971',
      '#b4c8a8',
      '#e8f1e1',
      '#f6e8c3',
      '#dfc27d',
      '#bf812d',
      '#8c510a',
      '#543005',
    ],
    diverging_orange_blue: [
      '#c66b20',
      '#dd8a4b',
      '#eeaa7b',
      '#f4c9a8',
      '#dcdcdc',
      '#90b9d7',
      '#5393c3',
      '#2a6ba1',
      '#11415c',
    ],
    greens: [
      '#f7fcf5',
      '#e5f5e0',
      '#c7e9c0',
      '#a1d99b',
      '#74c476',
      '#41ab5d',
      '#238b45',
      '#006d2c',
      '#00441b',
    ],
    reds: [
      '#fff5f0',
      '#fee0d2',
      '#fcbba1',
      '#fc9272',
      '#fb6a4a',
      '#ef3b2c',
      '#cb181d',
      '#a50f15',
      '#67000d',
    ],
    blues: [
      '#f7fbff',
      '#deebf7',
      '#c6dbef',
      '#9ecae1',
      '#6baed6',
      '#4292c6',
      '#2171b5',
      '#08519c',
      '#08306b',
    ],
    oranges: [
      '#fff5eb',
      '#fee6ce',
      '#fdd0a2',
      '#fdae6b',
      '#fd8d3c',
      '#f16913',
      '#d94801',
      '#a63603',
      '#7f2704',
    ],
    purples: [
      '#fcfbfd',
      '#efedf5',
      '#dadaeb',
      '#bcbddc',
      '#9e9ac8',
      '#807dba',
      '#6a51a3',
      '#54278f',
      '#3f007d',
    ],
  };

  constructor(map: Map) {
    this.map = map;
  }

  /**
   * Load province GeoJSON (81 provinces)
   */
  async loadProvincesGeoJSON(): Promise<any> {
    if (this.provincesGeoJSON) return this.provincesGeoJSON;

    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/emindagg/turkiye_json/main/turkiye.geojson'
      );
      this.provincesGeoJSON = await response.json();
      console.log('✅ Province GeoJSON loaded:', this.provincesGeoJSON.features.length, 'provinces');

      // Build province index
      this.buildProvinceIndex();

      return this.provincesGeoJSON;
    } catch (error) {
      console.error('❌ Failed to load province GeoJSON:', error);
      return null;
    }
  }

  /**
   * Load district GeoJSON (973 districts)
   */
  async loadDistrictsGeoJSON(): Promise<any> {
    if (this.districtsGeoJSON) return this.districtsGeoJSON;

    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/emindagg/turkiye_json/main/Hgk_ilce_FeaturesToJSON.geojson'
      );
      this.districtsGeoJSON = await response.json();
      console.log('✅ District GeoJSON loaded:', this.districtsGeoJSON.features.length, 'districts');

      // Build district index
      this.buildDistrictIndex();

      return this.districtsGeoJSON;
    } catch (error) {
      console.error('❌ Failed to load district GeoJSON:', error);
      return null;
    }
  }

  /**
   * Build province index for column mapping
   */
  private buildProvinceIndex() {
    if (!this.provincesGeoJSON || !this.provincesGeoJSON.features) return;

    const index: Record<string, any> = {};
    this.provinceIndex = index;

    this.provincesGeoJSON.features.forEach((feature: any) => {
      const props = feature.properties;

      // HGK format prioritizes ILAD property
      const provinceName =
        props.ILAD ||
        props.name ||
        props.NAME ||
        props.il_adi ||
        props.IL_ADI ||
        props.adm1_tr ||
        props.adm1_en ||
        props.province ||
        props.PROVINCE;

      if (provinceName) {
        const normalized = normalizeTurkishText(provinceName);

        index[normalized] = {
          name: provinceName,
          properties: props,
          geometry: feature.geometry,
        };
      }
    });

    console.log('✅ Province index built:', Object.keys(index).length, 'provinces');

    if (Object.keys(index).length === 0) {
      console.error('❌ Province index is empty! Check GeoJSON property names.');
    }
  }

  /**
   * Build district index for column mapping
   */
  private buildDistrictIndex() {
    if (!this.districtsGeoJSON || !this.districtsGeoJSON.features) return;

    const index: Record<string, any[]> = {};
    this.districtIndex = index;

    this.districtsGeoJSON.features.forEach((feature: any) => {
      const props = feature.properties;

      // HGK format prioritizes ILCEAD and ILAD properties
      const districtName =
        props.ILCEAD ||
        props.ILCE_ADI ||
        props.ilce_adi ||
        props.ilce ||
        props.name ||
        props.NAME ||
        props.ILCE ||
        props.district;
      const provinceName =
        props.ILAD || props.IL_ADI || props.il_adi || props.il || props.province || props.PROVINCE || props.IL;

      if (districtName) {
        const normalized = normalizeTurkishText(districtName);

        if (!index[normalized]) {
          index[normalized] = [];
        }

        // Create composite key (province + district)
        const provinceNormalized = provinceName ? normalizeTurkishText(provinceName) : '';
        const compositeKey = provinceNormalized ? `${provinceNormalized}_${normalized}` : normalized;

        index[normalized].push({
          name: districtName,
          province: provinceName || 'Bilinmiyor',
          compositeKey: compositeKey,
          properties: props,
          geometry: feature.geometry,
        });
      }
    });

    console.log('✅ District index built:', Object.keys(index).length, 'unique district names');

    if (Object.keys(index).length === 0) {
      console.error('❌ District index is empty! Check GeoJSON property names.');
    }
  }

  /**
   * Get province index
   */
  getProvinceIndex(): Record<string, any> | null {
    return this.provinceIndex;
  }

  /**
   * Get district index
   */
  getDistrictIndex(): Record<string, any[]> | null {
    return this.districtIndex;
  }

  /**
   * Get color palette for a given class count
   */
  private getColorPalette(colorScheme: ColorScheme, classCount: number): string[] {
    const fullPalette = this.colorSchemes[colorScheme];
    const step = Math.floor((fullPalette.length - 1) / (classCount - 1));
    const palette: string[] = [];

    for (let i = 0; i < classCount; i++) {
      const index = Math.min(i * step, fullPalette.length - 1);
      palette.push(fullPalette[index]);
    }

    return palette;
  }

  /**
   * Get color for a value based on breaks
   */
  private getColorForValue(value: number, breaks: number[], colorPalette: string[]): string {
    for (let i = 0; i < breaks.length - 1; i++) {
      if (value >= breaks[i] && value <= breaks[i + 1]) {
        return colorPalette[i];
      }
    }
    return colorPalette[colorPalette.length - 1];
  }

  /**
   * Render choropleth map
   */
  async renderChoropleth(
    userData: any[],
    dataColumn: string,
    settings: VisualizationSettings,
    locationLevel: 'province' | 'district' = 'province'
  ): Promise<void> {
    console.log('Rendering choropleth map:', { userData, dataColumn, settings, locationLevel });

    // Load appropriate GeoJSON
    const geojson =
      locationLevel === 'province'
        ? await this.loadProvincesGeoJSON()
        : await this.loadDistrictsGeoJSON();

    if (!geojson) {
      console.error('❌ GeoJSON data not loaded');
      return;
    }

    // Extract values for classification
    const values = userData.map((d: any) => parseFloat(d[dataColumn])).filter((v) => !isNaN(v) && v !== 0);

    if (values.length === 0) {
      console.warn('⚠️  No valid data for visualization');
      return;
    }

    // Calculate breaks
    const breaks = calculateBreaks(values, settings.classificationMethod, settings.classCount, settings.customBreaks);
    const colorPalette = this.getColorPalette(settings.colorScheme, settings.classCount);

    // Create data map
    const dataMap: Record<string, number> = {};
    userData.forEach((d: any) => {
      const locationName = d.location || d[Object.keys(d)[0]];
      if (locationName) {
        const normalizedKey = normalizeTurkishText(String(locationName));

        // For district level, use composite key
        if (locationLevel === 'district' && d._province) {
          const provinceName = d._province;
          const provinceNormalized = normalizeTurkishText(provinceName);
          const compositeKey = `${provinceNormalized}_${normalizedKey}`;
          dataMap[compositeKey] = parseFloat(d[dataColumn]);
        } else {
          dataMap[normalizedKey] = parseFloat(d[dataColumn]);
        }
      }
    });

    // Process all features
    const allFeatures: any[] = [];
    const featuresWithData: any[] = [];

    geojson.features.forEach((feature: any) => {
      const featureName =
        locationLevel === 'province'
          ? feature.properties.ILAD ||
            feature.properties.name ||
            feature.properties.NAME ||
            feature.properties.IL_ADI
          : feature.properties.ILCEAD ||
            feature.properties.ILCE_ADI ||
            feature.properties.name ||
            feature.properties.NAME;

      const normalizedFeatureName = normalizeTurkishText(featureName);

      // For district level, create composite key
      let dataValue: number | undefined;
      if (locationLevel === 'district') {
        const featureProvinceName =
          feature.properties.ILAD ||
          feature.properties.IL_ADI ||
          feature.properties.il_adi ||
          feature.properties.province;
        if (featureProvinceName) {
          const provinceNormalized = normalizeTurkishText(featureProvinceName);
          const compositeKey = `${provinceNormalized}_${normalizedFeatureName}`;
          dataValue = dataMap[compositeKey];
        } else {
          dataValue = dataMap[normalizedFeatureName];
        }
      } else {
        dataValue = dataMap[normalizedFeatureName];
      }

      // Set feature properties
      feature.properties.displayName = featureName;
      feature.properties.name = featureName;

      if (dataValue !== undefined && dataValue !== 0) {
        feature.properties.value = dataValue;
        feature.properties.dataValue = dataValue;
        feature.properties.color = this.getColorForValue(dataValue, breaks, colorPalette);
        feature.properties.hasData = true;
        featuresWithData.push(feature);
      } else {
        feature.properties.value = 0;
        feature.properties.dataValue = 0;
        feature.properties.color = '#dddddd';
        feature.properties.hasData = false;
      }

      allFeatures.push(feature);
    });

    const allFeaturesGeoJSON = {
      type: 'FeatureCollection' as const,
      features: allFeatures,
    };

    console.log(
      `📊 Visualization: ${userData.length} data → ${featuresWithData.length} ${locationLevel === 'province' ? 'provinces' : 'districts'} on map (Total: ${allFeatures.length})`
    );

    // Add source to map
    const sourceId = 'choropleth-source';
    if (this.map.getSource(sourceId)) {
      (this.map.getSource(sourceId) as any).setData(allFeaturesGeoJSON);
    } else {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: allFeaturesGeoJSON,
      });
    }

    // Create or update layers
    if (!this.map.getLayer('choropleth-fill')) {
      this.map.addLayer({
        id: 'choropleth-fill',
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 1,
        },
      });
    } else {
      this.map.setPaintProperty('choropleth-fill', 'fill-color', ['get', 'color']);
      this.map.setPaintProperty('choropleth-fill', 'fill-opacity', 1);
    }

    if (!this.map.getLayer('choropleth-outline')) {
      this.map.addLayer({
        id: 'choropleth-outline',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#6b7280',
          'line-width': 1,
          'line-opacity': 0.8,
        },
      });
    } else {
      this.map.setPaintProperty('choropleth-outline', 'line-color', '#6b7280');
      this.map.setPaintProperty('choropleth-outline', 'line-width', 1);
      this.map.setPaintProperty('choropleth-outline', 'line-opacity', 0.8);
    }
  }

  /**
   * Clear visualization
   */
  clearVisualization(): void {
    // Remove layers
    if (this.map.getLayer('choropleth-fill')) {
      this.map.removeLayer('choropleth-fill');
    }
    if (this.map.getLayer('choropleth-outline')) {
      this.map.removeLayer('choropleth-outline');
    }
    if (this.map.getLayer('bubble-circles')) {
      this.map.removeLayer('bubble-circles');
    }
    if (this.map.getLayer('dot-density-points')) {
      this.map.removeLayer('dot-density-points');
    }

    // Remove sources
    if (this.map.getSource('choropleth-source')) {
      this.map.removeSource('choropleth-source');
    }
    if (this.map.getSource('bubble-source')) {
      this.map.removeSource('bubble-source');
    }
    if (this.map.getSource('dot-density-source')) {
      this.map.removeSource('dot-density-source');
    }
  }

  /**
   * Suggest classification method based on data
   */
  suggestMethod(values: number[]): { method: ClassificationMethod; reason: string } {
    return suggestClassificationMethod(values);
  }
}
