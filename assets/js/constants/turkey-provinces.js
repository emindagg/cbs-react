// Türkiye İl Koordinatları (Merkez) — sağlam isim eşleştirme ve alias desteği
// Afyon (Afyonkarahisar) ve Mersin (İçel) gibi varyasyonlar dâhil.

// --- Yardımcılar ---
function normalizeName(raw) {
    if (!raw) return '';
    return raw
      .toLowerCase()
      .trim()
      // Noktalı büyük İ -> i + combining dot (i\u0307) normalizasyonu
      .replace(/i\u0307/g, 'i')
      .replace(/i̇/g, 'i')
      // Türkçe ı -> i
      .replace(/ı/g, 'i')
      // Şapkalı harfleri sadeleştir
      .replace(/[â]/g, 'a')
      .replace(/[î]/g, 'i')
      .replace(/[û]/g, 'u')
      // Unicode ayır: diyakritikleri kaldır (Ş, Ğ vb. korunur; aşağıda ayrıca ASCIIleştiriyoruz)
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      // Türkçe özel harfleri ASCII'ye yaklaştır (eşleşmeyi kolaylaştırır)
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ç/g, 'c')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .replace(/â|î|û/g, m => ({'â':'a','î':'i','û':'u'}[m]))
  }
  
  // --- Koordinatlar (WGS84) ---
  const coords = {
    'Adana': { lat: 37.0000, lon: 35.3213 },
    'Adıyaman': { lat: 37.7648, lon: 38.2786 },
    'Afyonkarahisar': { lat: 38.7568, lon: 30.5387 },
    'Ağrı': { lat: 39.7191, lon: 43.0503 },
    'Amasya': { lat: 40.6499, lon: 35.8353 },
    'Ankara': { lat: 39.9334, lon: 32.8597 },
    'Antalya': { lat: 36.8969, lon: 30.7133 },
    'Artvin': { lat: 41.1828, lon: 41.8183 },
    'Aydın': { lat: 37.8560, lon: 27.8416 },
    'Balıkesir': { lat: 39.6484, lon: 27.8826 },
    'Bilecik': { lat: 40.0567, lon: 30.0665 },
    'Bingöl': { lat: 38.8854, lon: 40.4980 },
    'Bitlis': { lat: 38.4001, lon: 42.1089 },
    'Bolu': { lat: 40.5760, lon: 31.5788 },
    'Burdur': { lat: 37.7203, lon: 30.2908 },
    'Bursa': { lat: 40.2669, lon: 29.0634 },
    'Çanakkale': { lat: 40.1553, lon: 26.4142 },
    'Çankırı': { lat: 40.6013, lon: 33.6134 },
    'Çorum': { lat: 40.5506, lon: 34.9556 },
    'Denizli': { lat: 37.7765, lon: 29.0864 },
    'Diyarbakır': { lat: 37.9144, lon: 40.2306 },
    'Edirne': { lat: 41.6771, lon: 26.5557 },
    'Elazığ': { lat: 38.6810, lon: 39.2264 },
    'Erzincan': { lat: 39.7500, lon: 39.4900 },
    'Erzurum': { lat: 39.9000, lon: 41.2700 },
    'Eskişehir': { lat: 39.7767, lon: 30.5206 },
    'Gaziantep': { lat: 37.0662, lon: 37.3833 },
    'Giresun': { lat: 40.9128, lon: 38.3895 },
    'Gümüşhane': { lat: 40.4602, lon: 39.4814 },
    'Hakkâri': { lat: 37.5744, lon: 43.7408 },
    'Hatay': { lat: 36.2025, lon: 36.1605 },
    'Isparta': { lat: 37.7648, lon: 30.5566 },
    'Mersin': { lat: 36.8121, lon: 34.6415 },
    'İstanbul': { lat: 41.0082, lon: 28.9784 },
    'İzmir': { lat: 38.4237, lon: 27.1428 },
    'Kars': { lat: 40.6167, lon: 43.1000 },
    'Kastamonu': { lat: 41.3887, lon: 33.7827 },
    'Kayseri': { lat: 38.7312, lon: 35.4787 },
    'Kırklareli': { lat: 41.7333, lon: 27.2167 },
    'Kırşehir': { lat: 39.1425, lon: 34.1709 },
    'Kocaeli': { lat: 40.8533, lon: 29.8815 },
    'Konya': { lat: 37.8667, lon: 32.4833 },
    'Kütahya': { lat: 39.4167, lon: 29.9833 },
    'Malatya': { lat: 38.3552, lon: 38.3095 },
    'Manisa': { lat: 38.6191, lon: 27.4289 },
    'Kahramanmaraş': { lat: 37.5858, lon: 36.9371 },
    'Mardin': { lat: 37.3212, lon: 40.7245 },
    'Muğla': { lat: 37.2153, lon: 28.3636 },
    'Muş': { lat: 38.9462, lon: 41.7539 },
    'Nevşehir': { lat: 38.6939, lon: 34.6857 },
    'Niğde': { lat: 37.9667, lon: 34.6833 },
    'Ordu': { lat: 40.9839, lon: 37.8764 },
    'Rize': { lat: 41.0201, lon: 40.5234 },
    'Sakarya': { lat: 40.6940, lon: 30.4358 },
    'Samsun': { lat: 41.2867, lon: 36.3300 },
    'Siirt': { lat: 37.9333, lon: 41.9500 },
    'Sinop': { lat: 42.0231, lon: 35.1531 },
    'Sivas': { lat: 39.7477, lon: 37.0179 },
    'Tekirdağ': { lat: 40.9833, lon: 27.5167 },
    'Tokat': { lat: 40.3167, lon: 36.5500 },
    'Trabzon': { lat: 41.0015, lon: 39.7178 },
    'Tunceli': { lat: 39.3074, lon: 39.4388 },
    'Şanlıurfa': { lat: 37.1591, lon: 38.7969 },
    'Uşak': { lat: 38.6823, lon: 29.4082 },
    'Van': { lat: 38.4891, lon: 43.4089 },
    'Yozgat': { lat: 39.8181, lon: 34.8147 },
    'Zonguldak': { lat: 41.4564, lon: 31.7987 },
    'Aksaray': { lat: 38.3687, lon: 34.0370 },
    'Bayburt': { lat: 40.2552, lon: 40.2249 },
    'Karaman': { lat: 37.1759, lon: 33.2287 },
    'Kırıkkale': { lat: 39.8468, lon: 33.5153 },
    'Batman': { lat: 37.8812, lon: 41.1351 },
    'Şırnak': { lat: 37.4187, lon: 42.4918 },
    'Bartın': { lat: 41.5811, lon: 32.4610 },
    'Ardahan': { lat: 41.1105, lon: 42.7022 },
    'Iğdır': { lat: 39.9237, lon: 44.0450 },
    'Yalova': { lat: 40.6500, lon: 29.2667 },
    'Karabük': { lat: 41.2061, lon: 32.6204 },
    'Kilis': { lat: 36.7184, lon: 37.1212 },
    'Osmaniye': { lat: 37.2130, lon: 36.1763 },
    'Düzce': { lat: 40.8438, lon: 31.1565 }
  };
  
  // --- Alias eşleştirme ---
  // normalizeName(key) -> Canonical Name
  const aliasMap = new Map([
    // En kritik aliaslar
    ['afyon', 'Afyonkarahisar'],
    ['icel', 'Mersin'],
    ['mersin', 'Mersin'],
    ['sanliurfa', 'Şanlıurfa'],
    ['urfa', 'Şanlıurfa'],
    // Türkçe karakterleri ASCII yazan olası girişler
    ['agri', 'Ağrı'], ['igdir', 'Iğdır'], ['hakkari', 'Hakkâri'], ['isparta', 'Isparta'], ['kutahya', 'Kütahya'],
    ['canakkale', 'Çanakkale'], ['cankiri', 'Çankırı'], ['corum', 'Çorum'], ['eskisehir', 'Eskişehir'], ['gumushane', 'Gümüşhane'],
    ['kirklareli', 'Kırklareli'], ['kirsehir', 'Kırşehir'], ['tekirdag', 'Tekirdağ'], ['usak', 'Uşak'], ['sirnak', 'Şırnak']
  ]);
  
  function getProvince(name) {
    const q = normalizeName(name);
    // 1) Alias ile doğrudan yakala
    const aliasHit = aliasMap.get(q);
    if (aliasHit && coords[aliasHit]) return { name: aliasHit, ...coords[aliasHit] };
    // 2) İsimlerden normalize eşleşmesi ara
    const key = Object.keys(coords).find(k => normalizeName(k) === q);
    return key ? { name: key, ...coords[key] } : null;
  }
  
  // Eski API ile uyumlu
  // eslint-disable-next-line no-unused-vars
  function findProvinceCoordinates(name) {
    const res = getProvince(name);
    return res ? { lat: res.lat, lon: res.lon } : null;
  }
  
  // Not: 0,0 alma sorunu genellikle "null döndü -> varsayılan 0,0" kalıbından gelir.
  // Kullandığınız tarafta null kontrolü yapın:
  //   const c = findProvinceCoordinates(input);
  //   if (!c) { /* hata göster */ } else { /* c.lat, c.lon kullan */ }
  
  /**
   * GeoJSON'dan ilçe indeksini oluştur
   * @param {Object} geojson - İl ve ilçe içeren GeoJSON (birleşik format)
   * @returns {Object} - normalize_isim -> [{name, province, lat, lon}]
   */
  // eslint-disable-next-line no-unused-vars
  function buildDistrictIndex(geojson) {
    const index = {};
    
    if (!geojson || !geojson.features) {
      Logger.error('❌ GeoJSON verisi geçersiz');
      return index;
    }
    
    Logger.log('🔍 İlçe indeksi oluşturuluyor...');
    let processedCount = 0;
    let skippedCount = 0;
    
    geojson.features.forEach((feature, idx) => {
      const props = feature.properties;
      
      // HGK format: ILAD (il), ILCEAD (ilçe)
      // Eğer hem ILAD hem ILCEAD varsa ilçe seviyesi
      const ilAdi = props.ILAD;
      const ilceAdi = props.ILCEAD;
      
      // Sadece ilçe feature'larını işle (hem ILAD hem ILCEAD gerekli)
      if (!ilAdi || !ilceAdi) {
        return;
      }
      
      const districtName = ilceAdi;
      // İl ismini getProvince ile normalize et ("ANKARA" -> "Ankara")
      const provinceObj = getProvince(ilAdi);
      const provinceName = provinceObj ? provinceObj.name : ilAdi;
      
      // Koordinat hesapla (centroid)
      let lat, lon;
      
      // Önce props'ta lat/lon var mı kontrol et
      if (props.latitude && props.longitude) {
        lat = parseFloat(props.latitude);
        lon = parseFloat(props.longitude);
      } else if (props.lat && props.lon) {
        lat = parseFloat(props.lat);
        lon = parseFloat(props.lon);
      } else if (feature.geometry) {
        // Geometry'den centroid hesapla
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0];
          lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
          lon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
        } else if (feature.geometry.type === 'MultiPolygon') {
          const firstPolygon = feature.geometry.coordinates[0][0];
          lat = firstPolygon.reduce((sum, c) => sum + c[1], 0) / firstPolygon.length;
          lon = firstPolygon.reduce((sum, c) => sum + c[0], 0) / firstPolygon.length;
        } else if (feature.geometry.type === 'Point') {
          lon = feature.geometry.coordinates[0];
          lat = feature.geometry.coordinates[1];
        } else {
          skippedCount++;
          Logger.warn(`⚠️ Feature ${idx}: Geometry tipi desteklenmiyor:`, feature.geometry.type);
          return;
        }
      } else {
        skippedCount++;
        return;
      }
      
      // Normalize et ve indekse ekle
      const normalized = normalizeName(districtName);
      
      if (!index[normalized]) {
        index[normalized] = [];
      }
      
      index[normalized].push({
        name: districtName,
        province: provinceName,
        lat,
        lon
      });
      
      processedCount++;
    });
    
    // Özet raporla
    const uniqueNames = Object.keys(index).length;
    const totalDistricts = Object.values(index).reduce((sum, arr) => sum + arr.length, 0);
    
    Logger.log('✅ İlçe indeksi oluşturuldu:');
    Logger.log(`  - Benzersiz ilçe ismi: ${uniqueNames}`);
    Logger.log(`  - Toplam ilçe: ${totalDistricts}`);
    Logger.log(`  - İşlenen: ${processedCount}, Atlanan: ${skippedCount}`);
    
    // Aynı isimli ilçeler varsa uyar
    const duplicates = Object.entries(index).filter(([_name, list]) => list.length > 1);
    if (duplicates.length > 0) {
      Logger.log(`⚠️ ${duplicates.length} ilçe ismi birden fazla ilde bulunuyor (beklenen durum):`);
      duplicates.slice(0, 5).forEach(([_name, list]) => {
        Logger.log(`  - "${list[0].name}": ${list.map(d => d.province).join(', ')}`);
      });
    }
    
    return index;
  }
  