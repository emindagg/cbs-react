/**
 * OGM Web CBS Platform
 * Column Mapping & Data Validation Module
 * İl/İlçe veri eşleştirme ve doğrulama
 */

// Güvenli Logger helper'ları (Logger.* fonksiyon değilse console fallback)
const safeLogCM = (...args) => (window.Logger && typeof window.Logger.log === 'function') ? window.Logger.log(...args) : console.log(...args);
const safeWarnCM = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorCM = (...args) => (window.Logger && typeof window.Logger.error === 'function') ? window.Logger.error(...args) : console.error(...args);

class ColumnMapper {
    constructor() {
        // Veri durumu
        this.rawData = null;
        this.columns = [];
        this.mappedData = null;
        this.ambiguousMatches = [];
        
        // Sütun eşleştirmeleri
        this.columnMapping = {
            locationColumn: null,      // Konum sütunu (il sütunu)
            districtColumn: null,      // İlçe sütunu (karışık durumda)
            dataColumn: null,          // Veri sütunu
            locationLevel: 'province'  // 'province' veya 'mixed'
        };
        
        // Eşleştirme sonuçları
        this.matchResults = {
            successful: [],
            ambiguous: [],
            failed: []
        };
    }
    
    /**
     * Excel/CSV dosyasını yükle ve analiz et
     */
    loadFile(file) {
        return new Promise((resolve, reject) => {
            const fileName = file.name.toLowerCase();
            const isCSV = fileName.endsWith('.csv');
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    let jsonData;
                    
                    if (isCSV) {
                        const text = e.target.result;
                        jsonData = this.parseCSV(text);
                    } else {
                        const data = new Uint8Array(e.target.result);
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
                    
                    safeLogCM('✅ Dosya yüklendi:', jsonData.length, 'satır');
                    safeLogCM('📊 Sütunlar:', this.columns);
                    
                    resolve({
                        rowCount: jsonData.length,
                        columns: this.columns,
                        preview: jsonData.slice(0, 3)
                    });
                    
                } catch (error) {
                    safeErrorCM('Dosya okuma hatası:', error);
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
     * CSV parse et - RFC 4180 uyumlu (tırnak içi virgülleri destekler)
     */
    parseCSV(text) {
        const lines = text.trim().split(/\r?\n/);
        
        if (lines.length < 2) {
            throw new Error('CSV dosyası en az 2 satır içermelidir');
        }
        
        // İlk satırdan başlıkları al
        const headers = this.parseCSVLine(lines[0]);
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Boş satırları atla
            if (!line) {
                continue;
            }
            
            const values = this.parseCSVLine(line);
            
            // Sütun sayısı uyuşmuyorsa
            if (values.length !== headers.length) {
                const hasData = values.some(v => v !== '');
                if (!hasData) {
                    continue; // Boş satır, sessizce atla
                }
                // Veri var ama sütun sayısı yanlış - uyarı ver ve atla
                safeWarnCM(`Satır ${i + 1}: Sütun sayısı uyuşmuyor (Beklenen: ${headers.length}, Bulunan: ${values.length})`);
                continue;
            }
            
            const row = {};
            headers.forEach((header, index) => {
                const value = values[index];
                // Sayısal değerleri tespit et (binlik ayracını temizle)
                const cleanValue = value.replace(/\./g, '').replace(',', '.');
                const numValue = Number(cleanValue);
                row[header] = isNaN(numValue) ? value : numValue;
            });
            
            data.push(row);
        }
        
        return data;
    }

    /**
     * CSV satırını parse et (tırnak içi virgülleri destekler)
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                // Çift tırnak - quoted field başlangıcı veya sonu
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                // Virgül ve tırnak içinde değilsek - yeni field
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Son field'ı ekle
        result.push(current.trim());
        
        return result;
    }
    
    /**
     * Akıllı sütun tespiti - otomatik öneri
     */
    detectColumns() {
        if (!this.rawData || this.rawData.length === 0) {
            return null;
        }
        
        const suggestions = {
            locationColumn: null,
            districtColumn: null,
            dataColumn: null,
            locationLevel: null
        };
        
        // Konum sütunu tespiti - ÖNCEİlÇe TAM EŞLEŞMEİ KONTROL ET
        const provinceKeywords = [
            { exact: ['il', 'İl', 'IL'], contains: [] },
            { exact: ['şehir', 'Şehir', 'Sehir', 'sehir'], contains: [] },
            { exact: ['province', 'Province', 'PROVINCE'], contains: [] },
            { exact: ['city', 'City', 'CITY'], contains: [] }
        ];
        
        const districtKeywords = [
            { exact: ['ilçe', 'İlçe', 'Ilce', 'ilce', 'ILCE'], contains: [] },
            { exact: ['district', 'District', 'DISTRICT'], contains: [] }
        ];
        
        // İLK OLARAK: Tam eşleşen ilçe sütunu ara (ilçe keyword'u il keyword'u içeriyor)
        for (const col of this.columns) {
            const trimmed = col.trim();
            const normalized = trimmed.toLowerCase();
            
            // İlçe sütunu - tam eşleşme
            const isDistrictExact = districtKeywords.some(group => 
                group.exact.some(kw => trimmed === kw || normalized === kw.toLowerCase())
            );
            
            if (isDistrictExact) {
                suggestions.districtColumn = col;
                continue; // Bu sütun ilçe, il olarak işaretlenmesin
            }
        }
        
        // İKİNCİ OLARAK: İl sütunu ara
        for (const col of this.columns) {
            const trimmed = col.trim();
            const normalized = trimmed.toLowerCase();
            
            // Eğer bu sütun zaten ilçe olarak işaretlendiyse atla
            if (col === suggestions.districtColumn) {
                continue;
            }
            
            // İl sütunu - tam eşleşme
            const isProvinceExact = provinceKeywords.some(group => 
                group.exact.some(kw => trimmed === kw || normalized === kw.toLowerCase())
            );
            
            if (isProvinceExact && !suggestions.locationColumn) {
                suggestions.locationColumn = col;
            }
        }
        
        // ÜÇÜNCÜ OLARAK: Kısmi eşleşme (tam eşleşme bulunamadıysa)
        if (!suggestions.districtColumn) {
            for (const col of this.columns) {
                const normalized = col.toLowerCase().trim();
                
                // İlçe içeren sütun
                if (normalized.includes('ilçe') || normalized.includes('ilce') || normalized.includes('district')) {
                    suggestions.districtColumn = col;
                    break;
                }
            }
        }
        
        if (!suggestions.locationColumn) {
            for (const col of this.columns) {
                const normalized = col.toLowerCase().trim();
                
                // Eğer bu sütun zaten ilçe olarak işaretlendiyse atla
                if (col === suggestions.districtColumn) {
                    continue;
                }
                
                // İl içeren sütun (ama 'ilçe' içermeyen)
                if ((normalized.includes('il') || normalized.includes('şehir') || normalized.includes('sehir') || normalized.includes('province') || normalized.includes('city')) &&
                    !normalized.includes('ilçe') && !normalized.includes('ilce') && !normalized.includes('district')) {
                    suggestions.locationColumn = col;
                    break;
                }
            }
        }
        
        // Veri sütunu tespiti (sayısal sütunlar)
        const numericColumns = this.detectNumericColumns();
        if (numericColumns.length > 0) {
            suggestions.dataColumn = numericColumns[0]; // İlk sayısal sütun
        }
        
        // Konum seviyesi tespiti
        if (suggestions.locationColumn && suggestions.districtColumn) {
            suggestions.locationLevel = 'mixed';
        } else if (suggestions.locationColumn) {
            suggestions.locationLevel = 'province';
        } else {
            // İlk sütunu konum olarak varsay
            suggestions.locationColumn = this.columns[0];
            suggestions.locationLevel = 'auto'; // Otomatik tespit edilecek
        }
        
        safeLogCM('🔍 Otomatik sütun tespiti:');
        safeLogCM('  - İl sütunu:', suggestions.locationColumn);
        safeLogCM('  - İlçe sütunu:', suggestions.districtColumn);
        safeLogCM('  - Veri sütunu:', suggestions.dataColumn);
        safeLogCM('  - Konum seviyesi:', suggestions.locationLevel);
        
        return suggestions;
    }
    
    /**
     * Sayısal sütunları tespit et
     */
    detectNumericColumns() {
        if (!this.rawData || this.rawData.length === 0) {
            return [];
        }
        
        const numericColumns = [];
        
        this.columns.forEach(col => {
            // Konum sütunlarını atla
            const normalized = col.toLowerCase().trim();
            if (normalized.includes('il') || normalized.includes('ilçe') || 
                normalized.includes('şehir') || normalized.includes('province') || 
                normalized.includes('district') || col.startsWith('_')) {
                return;
            }
            
            // İlk 5 satırı kontrol et
            const sampleSize = Math.min(5, this.rawData.length);
            let numericCount = 0;
            
            for (let i = 0; i < sampleSize; i++) {
                const value = this.rawData[i][col];
                if (value !== null && value !== undefined && !isNaN(Number(value))) {
                    numericCount++;
                }
            }
            
            // %80'i sayısal ise kabul et
            if (numericCount / sampleSize >= 0.8) {
                numericColumns.push(col);
            }
        });
        
        return numericColumns;
    }
    
    /**
     * Sütun eşleştirmesini ayarla
     */
    setColumnMapping(mapping) {
        this.columnMapping = { ...this.columnMapping, ...mapping };
        safeLogCM('📋 Sütun eşleştirmesi ayarlandı:', this.columnMapping);
    }
    
    /**
     * Veriyi eşleştir ve doğrula
     */
    async matchData() {
        if (!this.rawData || !this.columnMapping.locationColumn) {
            throw new Error('Veri veya sütun eşleştirmesi eksik');
        }
        
        const { locationColumn, districtColumn, locationLevel } = this.columnMapping;
        
        this.matchResults = {
            successful: [],
            ambiguous: [],
            failed: []
        };
        
        safeLogCM('🔄 Veri eşleştirme başlatılıyor...');
        safeLogCM('📍 Konum seviyesi:', locationLevel);
        
        for (let i = 0; i < this.rawData.length; i++) {
            const row = this.rawData[i];
            const rowIndex = i + 2; // Excel satır numarası (başlık + 1)
            
            const result = {
                rowIndex,
                originalData: row,
                province: null,
                district: null,
                matched: false,
                ambiguous: false,
                error: null
            };
            
            try {
                if (locationLevel === 'mixed') {
                    // Karışık mod: Hem il hem ilçe sütunu var
                    await this.matchMixedMode(row, result, locationColumn, districtColumn);
                } else {
                    // İl modu (varsayılan)
                    await this.matchProvinceOrAuto(row, result, locationColumn);
                }
                
                if (result.matched && !result.ambiguous) {
                    this.matchResults.successful.push(result);
                } else if (result.ambiguous) {
                    this.matchResults.ambiguous.push(result);
                } else {
                    this.matchResults.failed.push(result);
                }
                
            } catch (error) {
                result.error = error.message;
                this.matchResults.failed.push(result);
            }
        }
        
        safeLogCM('✅ Eşleştirme tamamlandı:', {
            başarılı: this.matchResults.successful.length,
            belirsiz: this.matchResults.ambiguous.length,
            hatalı: this.matchResults.failed.length
        });
        
        return this.matchResults;
    }
    
    /**
     * Karışık mod eşleştirme (il + ilçe)
     */
    async matchMixedMode(row, result, locationColumn, districtColumn) {
        const provinceName = row[locationColumn]?.toString().trim();
        const districtName = row[districtColumn]?.toString().trim();
        
        if (!provinceName) {
            result.error = 'İl bilgisi boş';
            return;
        }
        
        // İl kontrolü
        const province = getProvince(provinceName);
        if (!province) {
            result.error = `"${provinceName}" ili bulunamadı`;
            return;
        }
        
        result.province = province.name;
        
        // İlçe boşsa sadece il seviyesi
        if (!districtName) {
            result.matched = true;
            result.level = 'province';
            return;
        }
        
        // İlçe kontrolü - BU İLE AİT OLMALI
        const matchingDistricts = this.findDistrictsByName(districtName);
        
        if (matchingDistricts.length === 0) {
            result.error = `"${districtName}" ilçesi bulunamadı`;
            return;
        }
        
        // Sadece bu ile ait ilçeyi bul (normalize ederek karşılaştır)
        const normalizedProvinceName = normalizeName(province.name);
        const districtInProvince = matchingDistricts.find(d => 
            normalizeName(d.province) === normalizedProvinceName
        );
        
        if (!districtInProvince) {
            // Debug için bulunan ilçeleri konsola yaz
            if (matchingDistricts.length <= 3) {
                safeWarnCM(`⚠️ "${districtName}" ilçesi bulunan iller:`, matchingDistricts.map(d => `${d.province} (${normalizeName(d.province)})`).join(', '));
                safeWarnCM(`   Aranan il: "${province.name}" (${normalizedProvinceName})`);
            }
            result.error = `"${districtName}" ilçesi "${province.name}" ilinde bulunamadı`;
            return;
        }
        
        result.district = districtInProvince.name;
        result.matched = true;
        result.level = 'district';
    }
    
    /**
     * İl veya otomatik mod eşleştirme
     */
    async matchProvinceOrAuto(row, result, locationColumn) {
        const locationName = row[locationColumn]?.toString().trim();
        
        if (!locationName) {
            result.error = 'Konum bilgisi boş';
            return;
        }
        
        // Önce il olarak dene
        const province = getProvince(locationName);
        if (province) {
            result.province = province.name;
            result.matched = true;
            result.level = 'province';
            return;
        }
        
        // İl değilse ilçe olarak dene
        const matchingDistricts = this.findDistrictsByName(locationName);
        
        if (matchingDistricts.length === 0) {
            result.error = `"${locationName}" il veya ilçe olarak bulunamadı`;
            return;
        }
        
        if (matchingDistricts.length === 1) {
            // Tek eşleşme
            result.province = matchingDistricts[0].province;
            result.district = matchingDistricts[0].name;
            result.matched = true;
            result.level = 'district';
        } else {
            // Birden fazla eşleşme - belirsiz
            result.ambiguous = true;
            result.ambiguousOptions = matchingDistricts;
            result.error = `"${locationName}" ${matchingDistricts.length} farklı ilde bulundu`;
        }
    }
    
    /**
     * İsme göre ilçeleri bul (birden fazla olabilir)
     * NOT: Bu fonksiyon GeoJSON yüklendikten sonra çalışacak
     */
    findDistrictsByName(districtName) {
        // Bu fonksiyon daha sonra GeoJSON'dan beslenecek
        // Şimdilik placeholder
        if (typeof window.districtIndex === 'undefined') {
            safeWarnCM('⚠️ İlçe indeksi henüz yüklenmedi');
            return [];
        }
        
        const normalized = normalizeName(districtName);
        return window.districtIndex[normalized] || [];
    }
    
    /**
     * Belirsiz eşleşmeyi çöz
     */
    resolveAmbiguity(rowIndex, selectedOption) {
        const ambiguousIndex = this.matchResults.ambiguous.findIndex(
            r => r.rowIndex === rowIndex
        );
        
        if (ambiguousIndex === -1) {
            safeErrorCM('Belirsiz eşleşme bulunamadı:', rowIndex);
            return false;
        }
        
        const result = this.matchResults.ambiguous[ambiguousIndex];
        result.province = selectedOption.province;
        result.district = selectedOption.name;
        result.matched = true;
        result.ambiguous = false;
        result.level = 'district';
        result.error = null;
        
        // Başarılı listeye taşı
        this.matchResults.ambiguous.splice(ambiguousIndex, 1);
        this.matchResults.successful.push(result);
        
        safeLogCM('✅ Belirsizlik çözüldü:', rowIndex, '→', selectedOption);
        return true;
    }
    
    /**
     * Toplu belirsizlik çözme (aynı isim için)
     */
    resolveBulkAmbiguity(districtName, selectedOption) {
        let resolvedCount = 0;
        
        const toResolve = this.matchResults.ambiguous.filter(r => {
            const originalName = r.originalData[this.columnMapping.locationColumn] || 
                                 r.originalData[this.columnMapping.districtColumn];
            return originalName?.toString().trim() === districtName;
        });
        
        toResolve.forEach(result => {
            this.resolveAmbiguity(result.rowIndex, selectedOption);
            resolvedCount++;
        });
        
        safeLogCM(`✅ ${resolvedCount} belirsizlik toplu çözüldü: ${districtName}`);
        return resolvedCount;
    }
    
    /**
     * Eşleştirilmiş veriyi dışa aktar
     */
    getMatchedData() {
        return this.matchResults.successful.map(result => ({
            ...result.originalData,
            _province: result.province,
            _district: result.district,
            _level: result.level
        }));
    }
    
    /**
     * Eşleştirme özeti
     */
    getSummary() {
        const total = this.rawData?.length || 0;
        const successful = this.matchResults.successful.length;
        const ambiguous = this.matchResults.ambiguous.length;
        const failed = this.matchResults.failed.length;
        
        return {
            total,
            successful,
            ambiguous,
            failed,
            successRate: total > 0 ? (successful / total * 100).toFixed(1) : 0
        };
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.ColumnMapper = ColumnMapper;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColumnMapper;
}
