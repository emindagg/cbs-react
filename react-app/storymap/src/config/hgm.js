/**
 * HGM Atlas API konfigürasyonu
 * API key'i buradan güncelle — tüm storymap modülleri bu dosyadan okur.
 */
export const HGM_API_KEY = 'ESqJcw5RWSD5Unw0CVYL2z8oP8gOqIUC';

export const HGM_TILE_URLS = {
    temel:     `https://atlas.harita.gov.tr/webservis/harita/hgm_harita/{z}/{x}/{y}.png?apikey=${HGM_API_KEY}`,
    uydu:      `https://atlas.harita.gov.tr/webservis/ortofoto/{z}/{x}/{y}.jpg?apikey=${HGM_API_KEY}`,
    gece:      `https://atlas.harita.gov.tr/webservis/harita/hgm_gece/{z}/{x}/{y}.png?apikey=${HGM_API_KEY}`,
    siyasi:    `https://atlas.harita.gov.tr/webservis/harita/hgm_siyasi/{z}/{x}/{y}.png?apikey=${HGM_API_KEY}`,
    yukseklik: `https://atlas.harita.gov.tr/webservis/harita/hgm_yukseklik/{z}/{x}/{y}.png?apikey=${HGM_API_KEY}`,
};
