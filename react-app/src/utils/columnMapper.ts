/**
 * Column Mapper
 * Handles Excel/CSV file reading and column mapping with Turkish province/district data
 */

import * as XLSX from 'xlsx';
import { normalizeTurkishText } from './turkishNormalizer';
import type { ColumnMapping, FileInfo, MatchResult, MatchResults } from '../types/visualization';

export class ColumnMapper {
  rawData: any[] | null = null;
  columns: string[] = [];
  columnMapping: ColumnMapping = {
    locationColumn: null,
    districtColumn: null,
    dataColumn: null,
    locationLevel: 'province',
  };

  // Province and district indexes (will be set from store)
  provinceIndex: Record<string, any> | null = null;
  districtIndex: Record<string, any[]> | null = null;

  constructor() {}

  /**
   * Set province and district indexes
   */
  setIndexes(provinceIndex: Record<string, any> | null, districtIndex: Record<string, any[]> | null) {
    this.provinceIndex = provinceIndex;
    this.districtIndex = districtIndex;
  }

  /**
   * Load Excel/CSV file and parse it
   */
  async loadFile(file: File): Promise<FileInfo> {
    return new Promise((resolve, reject) => {
      const fileName = file.name.toLowerCase();
      const isCSV = fileName.endsWith('.csv');

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          let jsonData: any[];

          if (isCSV) {
            const text = e.target?.result as string;
            jsonData = this.parseCSV(text);
          } else {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet);
          }

          if (!jsonData || jsonData.length === 0) {
            reject(new Error('Dosyada veri bulunamadı'));
            return;
          }

          this.rawData = jsonData;
          this.columns = Object.keys(jsonData[0]);

          console.log('✅ File loaded:', jsonData.length, 'rows');
          console.log('📊 Columns:', this.columns);

          resolve({
            rowCount: jsonData.length,
            columns: this.columns,
            preview: jsonData.slice(0, 3),
          });
        } catch (error) {
          console.error('File read error:', error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Dosya okunamadı'));

      if (isCSV) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  /**
   * Parse CSV - RFC 4180 compliant (supports quoted commas)
   */
  private parseCSV(text: string): any[] {
    const lines = text.trim().split(/\r?\n/);

    if (lines.length < 2) {
      throw new Error('CSV dosyası en az 2 satır içermelidir');
    }

    // Get headers from first line
    const headers = this.parseCSVLine(lines[0]);
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      const values = this.parseCSVLine(line);

      // If column count doesn't match
      if (values.length !== headers.length) {
        const hasData = values.some((v) => v !== '');
        if (!hasData) continue; // Empty line, skip silently

        // Has data but wrong column count - warn and skip
        console.warn(
          `Row ${i + 1}: Column count mismatch (Expected: ${headers.length}, Found: ${values.length})`
        );
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        // Detect numeric values (clean thousand separator)
        const cleanValue = value.replace(/\./g, '').replace(',', '.');
        const numValue = Number(cleanValue);
        row[header] = isNaN(numValue) ? value : numValue;
      });

      data.push(row);
    }

    return data;
  }

  /**
   * Parse CSV line (supports quoted commas)
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // Quote - toggle quoted field
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // Comma and not in quotes - new field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current.trim());

    return result;
  }

  /**
   * Smart column detection - automatic suggestions
   */
  detectColumns(): {
    locationColumn: string | null;
    districtColumn: string | null;
    dataColumn: string | null;
    locationLevel: 'province' | 'district' | 'mixed' | 'auto';
  } | null {
    if (!this.rawData || this.rawData.length === 0) {
      return null;
    }

    const suggestions = {
      locationColumn: null as string | null,
      districtColumn: null as string | null,
      dataColumn: null as string | null,
      locationLevel: 'auto' as 'province' | 'district' | 'mixed' | 'auto',
    };

    const provinceKeywords = [
      { exact: ['il', 'İl', 'IL'], contains: [] },
      { exact: ['şehir', 'Şehir', 'Sehir', 'sehir'], contains: [] },
      { exact: ['province', 'Province', 'PROVINCE'], contains: [] },
      { exact: ['city', 'City', 'CITY'], contains: [] },
    ];

    const districtKeywords = [
      { exact: ['ilçe', 'İlçe', 'Ilce', 'ilce', 'ILCE'], contains: [] },
      { exact: ['district', 'District', 'DISTRICT'], contains: [] },
    ];

    // FIRST: Find exact match district column
    for (const col of this.columns) {
      const trimmed = col.trim();
      const normalized = trimmed.toLowerCase();

      const isDistrictExact = districtKeywords.some((group) =>
        group.exact.some((kw) => trimmed === kw || normalized === kw.toLowerCase())
      );

      if (isDistrictExact) {
        suggestions.districtColumn = col;
        break;
      }
    }

    // SECOND: Find province column
    for (const col of this.columns) {
      const trimmed = col.trim();
      const normalized = trimmed.toLowerCase();

      // Skip if already marked as district
      if (col === suggestions.districtColumn) continue;

      const isProvinceExact = provinceKeywords.some((group) =>
        group.exact.some((kw) => trimmed === kw || normalized === kw.toLowerCase())
      );

      if (isProvinceExact && !suggestions.locationColumn) {
        suggestions.locationColumn = col;
      }
    }

    // THIRD: Partial matching (if exact not found)
    if (!suggestions.districtColumn) {
      for (const col of this.columns) {
        const normalized = col.toLowerCase().trim();

        if (
          normalized.includes('ilçe') ||
          normalized.includes('ilce') ||
          normalized.includes('district')
        ) {
          suggestions.districtColumn = col;
          break;
        }
      }
    }

    if (!suggestions.locationColumn) {
      for (const col of this.columns) {
        const normalized = col.toLowerCase().trim();

        // Skip if already marked as district
        if (col === suggestions.districtColumn) continue;

        if (
          (normalized.includes('il') ||
            normalized.includes('şehir') ||
            normalized.includes('sehir') ||
            normalized.includes('province') ||
            normalized.includes('city')) &&
          !normalized.includes('ilçe') &&
          !normalized.includes('ilce') &&
          !normalized.includes('district')
        ) {
          suggestions.locationColumn = col;
          break;
        }
      }
    }

    // Data column detection (numeric columns)
    const numericColumns = this.detectNumericColumns();
    if (numericColumns.length > 0) {
      suggestions.dataColumn = numericColumns[0];
    }

    // Location level detection
    if (suggestions.locationColumn && suggestions.districtColumn) {
      suggestions.locationLevel = 'mixed';
    } else if (suggestions.locationColumn) {
      suggestions.locationLevel = 'province';
    } else {
      // Default to first column as location
      suggestions.locationColumn = this.columns[0];
      suggestions.locationLevel = 'auto';
    }

    console.log('🔍 Auto column detection:');
    console.log('  - Province column:', suggestions.locationColumn);
    console.log('  - District column:', suggestions.districtColumn);
    console.log('  - Data column:', suggestions.dataColumn);
    console.log('  - Location level:', suggestions.locationLevel);

    return suggestions;
  }

  /**
   * Detect numeric columns
   */
  detectNumericColumns(): string[] {
    if (!this.rawData || this.rawData.length === 0) {
      return [];
    }

    const numericColumns: string[] = [];

    for (const col of this.columns) {
      let numericCount = 0;
      let totalCount = 0;

      for (const row of this.rawData) {
        const value = row[col];
        if (value !== null && value !== undefined && value !== '') {
          totalCount++;
          if (typeof value === 'number' || !isNaN(Number(value))) {
            numericCount++;
          }
        }
      }

      // If >80% of values are numeric, consider it numeric column
      if (totalCount > 0 && numericCount / totalCount > 0.8) {
        numericColumns.push(col);
      }
    }

    return numericColumns;
  }

  /**
   * Set column mapping
   */
  setColumnMapping(mapping: Partial<ColumnMapping>) {
    this.columnMapping = { ...this.columnMapping, ...mapping };
  }

  /**
   * Match data with province/district GeoJSON
   */
  matchData(): MatchResults {
    if (!this.rawData || !this.columnMapping.locationColumn || !this.columnMapping.dataColumn) {
      throw new Error('Veri veya sütun eşleştirmesi eksik');
    }

    const results: MatchResults = {
      successful: [],
      ambiguous: [],
      failed: [],
    };

    this.rawData.forEach((row, index) => {
      const locationValue = row[this.columnMapping.locationColumn!];
      const districtValue = this.columnMapping.districtColumn
        ? row[this.columnMapping.districtColumn]
        : null;
      const dataValue = parseFloat(row[this.columnMapping.dataColumn!]);

      // Create match result
      const result: MatchResult = {
        rowIndex: index + 1,
        matched: false,
        ambiguous: false,
        originalData: row,
        value: dataValue,
      };

      if (!locationValue || isNaN(dataValue)) {
        result.error = 'Konum veya veri değeri eksik';
        results.failed.push(result);
        return;
      }

      // Normalize location name
      const normalizedLocation = normalizeTurkishText(String(locationValue));

      // Province level matching
      if (this.columnMapping.locationLevel === 'province') {
        if (!this.provinceIndex) {
          result.error = 'İl indeksi yüklenmedi';
          results.failed.push(result);
          return;
        }

        const provinceData = this.provinceIndex[normalizedLocation];
        if (provinceData) {
          result.matched = true;
          result.province = provinceData.name;
          result.location = provinceData.name;
          results.successful.push(result);
        } else {
          result.error = `İl bulunamadı: ${locationValue}`;
          results.failed.push(result);
        }
      }
      // District level matching
      else if (this.columnMapping.locationLevel === 'district') {
        if (!this.districtIndex) {
          result.error = 'İlçe indeksi yüklenmedi';
          results.failed.push(result);
          return;
        }

        const districtMatches = this.districtIndex[normalizedLocation];
        if (districtMatches && districtMatches.length > 0) {
          if (districtMatches.length === 1) {
            // Unique match
            result.matched = true;
            result.province = districtMatches[0].province;
            result.district = districtMatches[0].name;
            result.location = districtMatches[0].name;
            results.successful.push(result);
          } else {
            // Ambiguous - multiple districts with same name
            result.ambiguous = true;
            result.ambiguousOptions = districtMatches;
            result.location = String(locationValue);
            results.ambiguous.push(result);
          }
        } else {
          result.error = `İlçe bulunamadı: ${locationValue}`;
          results.failed.push(result);
        }
      }
      // Mixed level matching
      else if (this.columnMapping.locationLevel === 'mixed') {
        if (!this.provinceIndex || !this.districtIndex) {
          result.error = 'İl/İlçe indeksleri yüklenmedi';
          results.failed.push(result);
          return;
        }

        const normalizedProvince = this.columnMapping.locationColumn
          ? normalizeTurkishText(String(row[this.columnMapping.locationColumn]))
          : '';
        const normalizedDistrict = districtValue
          ? normalizeTurkishText(String(districtValue))
          : '';

        // Create composite key
        const compositeKey = `${normalizedProvince}_${normalizedDistrict}`;

        // Try to find in district index
        const districtMatches = this.districtIndex[normalizedDistrict];
        if (districtMatches && districtMatches.length > 0) {
          // Find exact match with province
          const exactMatch = districtMatches.find((d) => d.compositeKey === compositeKey);
          if (exactMatch) {
            result.matched = true;
            result.province = exactMatch.province;
            result.district = exactMatch.name;
            result.location = exactMatch.name;
            // Store province in original data for later use
            result.originalData._province = exactMatch.province;
            results.successful.push(result);
          } else {
            // Ambiguous - district found but province mismatch
            result.ambiguous = true;
            result.ambiguousOptions = districtMatches;
            result.location = String(districtValue);
            results.ambiguous.push(result);
          }
        } else {
          result.error = `İlçe bulunamadı: ${districtValue}`;
          results.failed.push(result);
        }
      }
    });

    console.log(
      `📊 Match results: ${results.successful.length} successful, ${results.ambiguous.length} ambiguous, ${results.failed.length} failed`
    );

    return results;
  }

  /**
   * Resolve bulk ambiguity for a location name
   */
  resolveBulkAmbiguity(_locationName: string, _selectedOption: any): number {
    // This will be implemented when we have match results in state
    // For now, just return 0
    return 0;
  }

  /**
   * Get matched data (only successful matches)
   */
  getMatchedData(): any[] {
    // This will be implemented after matchData is called
    // For now, return empty array
    return [];
  }

  /**
   * Get summary of match results
   */
  getSummary(): { successful: number; ambiguous: number; failed: number } {
    // This will be implemented after matchData is called
    return { successful: 0, ambiguous: 0, failed: 0 };
  }
}
