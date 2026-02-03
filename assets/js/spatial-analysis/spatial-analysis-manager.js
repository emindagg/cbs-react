/**
 * Unified Spatial Analysis & Measurement Tools - MapLibre GL JS
 * Handles buffer analysis, clustering, heatmaps, convex hull, voronoi, nearest facility
 * Dependencies: MapLibre GL JS, Turf.js
 */

(function() {
'use strict';

    // Güvenli Logger helper'ları (Logger.* fonksiyon değilse console fallback)
    const safeLogSA = (...args) => (window.Logger && typeof window.Logger.log === 'function') ? window.Logger.log(...args) : console.log(...args);
    const safeWarnSA = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);
    const safeErrorSA = (...args) => (window.Logger && typeof window.Logger.error === 'function') ? window.Logger.error(...args) : console.error(...args);

    // Reference utility functions
    const { formatNumber, formatArea, showEducationalFeedback } = window;
    
    /**
     * Helper: Haritada görünür olan veriyi al
     * window.userMarkers yerine haritadaki gerçek marker'ları kullan
     */
    function getVisibleMarkersFromMap() {
        const visibleMarkers = [];
        
        // 🚀 PERFORMANS: Clustering aktifse window.userMarkers'ı kullan
        if (window.clusteringEnabled) {
            // Clustering aktifken DOM marker yok, direkt userMarkers'ı kullan
            return window.userMarkers || [];
        }
        
        // 1. Haritadaki point marker'ları al (window.markerManager.markers Map'inden)
        if (window.markerManager && window.markerManager.markers) {
            window.markerManager.markers.forEach((marker, id) => {
                // window.userMarkers'tan ilgili datayı bul
                const markerData = window.userMarkers.find(m => m.id === id);
                if (markerData) {
                    visibleMarkers.push(markerData);
                }
            });
        }
        
        // 2. Haritadaki geometries'leri al (area, route, circle)
        if (window.markerManager && window.markerManager.geometries) {
            window.markerManager.geometries.forEach(geometryId => {
                const geometryData = window.userMarkers.find(m => m.id === geometryId);
                if (geometryData && !visibleMarkers.find(m => m.id === geometryId)) {
                    visibleMarkers.push(geometryData);
                }
            });
        }
        
        // 3. Eğer hiç marker bulunamadıysa ama userMarkers varsa, onları kullan
        if (visibleMarkers.length === 0 && window.userMarkers && window.userMarkers.length > 0) {
            return window.userMarkers;
        }
        
        return visibleMarkers;
    }
    
    // Minimal bildirim sistemi
    function showMinimalNotification(message) {
        // window.showFeedback'i kullan (utils-core.js'den)
        if (typeof window.showFeedback === 'function') {
            window.showFeedback(message, 'warning', 3000);
        }
    }
    
    // Renk skalaları tanımları
    const heatmapColorSchemes = {
        maplibre: {
            name: 'Varsayılan',
            colors: [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(33,102,172,0)',    // Şeffaf mavi (düşük)
                0.2, 'rgb(103,169,207)',    // Açık mavi
                0.4, 'rgb(209,229,240)',    // Çok açık mavi
                0.6, 'rgb(253,219,199)',    // Açık turuncu
                0.8, 'rgb(239,138,98)',     // Turuncu
                1, 'rgb(178,24,43)'         // Koyu kırmızı (yüksek)
            ]
        },
        gradient: {
            name: 'Renk 1',
            colors: [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(14,165,233,0)',    // Şeffaf açık mavi (düşük)
                0.25, 'rgb(14,165,233)',    // Açık mavi
                0.50, 'rgb(34,197,94)',     // Yeşil
                0.75, 'rgb(253,224,71)',    // Sarı
                0.875, 'rgb(251,146,60)',   // Turuncu
                1, 'rgb(185,28,28)'         // Kırmızı (yüksek)
            ]
        },
        viridis: {
            name: 'Renk 2',
            colors: [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(68,1,84,0)',        // Şeffaf mor (düşük)
                0.2, 'rgb(59,82,139)',      // Koyu mavi
                0.4, 'rgb(33,144,140)',     // Turkuaz
                0.6, 'rgb(92,200,99)',      // Yeşil
                0.8, 'rgb(253,231,37)',     // Sarı
                1, 'rgb(253,224,71)'        // Açık sarı (yüksek)
            ]
        },
        sunset: {
            name: 'Renk 3',
            colors: [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(254,237,177,0)',    // Şeffaf açık sarı (düşük)
                0.2, 'rgb(254,204,92)',     // Açık sarı
                0.4, 'rgb(253,141,60)',     // Turuncu
                0.6, 'rgb(240,59,32)',      // Kırmızı-turuncu
                0.8, 'rgb(189,0,38)',       // Koyu kırmızı
                1, 'rgb(128,0,38)'          // Koyu kırmızı (yüksek)
            ]
        },
        custom: {
            name: 'Renk 4',
            colors: [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(137,186,197,0)',    // Şeffaf açık mavi (düşük)
                0.25, 'rgb(137,186,197)',   // #89BAC5 - Açık mavi
                0.50, 'rgb(173,114,164)',   // #AD72A4 - Mor
                0.75, 'rgb(193,78,114)',    // #C14E72 - Pembe
                0.875, 'rgb(210,33,25)',    // #D22119 - Kırmızı
                1, 'rgb(255,241,0)'         // #FFF100 - Sarı (yüksek)
            ]
        }
    };
    
    let currentColorScheme = 'maplibre'; // Varsayılan: Varsayılan
    
    // Renk skalasını değiştir
    function changeHeatmapColorScheme(scheme) {
        if (!window.map.getLayer('heatmap-layer')) return;
        
        currentColorScheme = scheme;
        const colorSchemeObj = heatmapColorSchemes[scheme];
        
        if (colorSchemeObj && colorSchemeObj.colors) {
            window.map.setPaintProperty('heatmap-layer', 'heatmap-color', colorSchemeObj.colors);
            
            // UI güncellemesi
            const schemeNameEl = document.getElementById('heat-color-scheme-name');
            if (schemeNameEl) {
                schemeNameEl.textContent = colorSchemeObj.name;
            }
            
            // Dropdown item'larını güncelle
            updateColorSchemeDropdown();
        }
    }
    
    // Dropdown item'larını güncelle
    function updateColorSchemeDropdown() {
        const dropdownItems = document.querySelectorAll('.heat-color-option');
        dropdownItems.forEach(item => {
            const scheme = item.dataset.scheme;
            if (scheme === currentColorScheme) {
                item.classList.add('bg-purple-100', 'font-semibold');
                item.classList.remove('hover:bg-purple-50');
            } else {
                item.classList.remove('bg-purple-100', 'font-semibold');
                item.classList.add('hover:bg-purple-50');
            }
        });
    }
    
    // Buffer analysis state
    window.bufferAnalysisState = {
        mode: 'normal', // 'normal', 'union', 'intersection', 'difference'
        showOverlaps: false,
        showStats: false,
        currentBuffers: [],
        currentMarkers: []
    };

    // ==========================================
    // CLUSTERING (MapLibre Native)
    // ==========================================

    // Setup cluster event handlers (only once)
    function setupClusterEventHandlers() {
        // Check if already registered
        if (window._clusterEventsRegistered) {
            safeLogSA('⚠️ Cluster event handler\'ları zaten eklenmiş, tekrar eklenmedi');
            return;
        }

        // Click on cluster to zoom (async version)
        window.map.on('click', 'clusters', async (e) => {
            const features = window.map.queryRenderedFeatures(e.point, {
                layers: ['clusters']
            });

            if (!features || features.length === 0) return;

            const clusterId = features[0].properties.cluster_id;
            const source = window.map.getSource('markers');

            if (!source) return;

            try {
                // Use async version of getClusterExpansionZoom
                const zoom = await source.getClusterExpansionZoom(clusterId);

                window.map.easeTo({
                    center: features[0].geometry.coordinates,
                    zoom: zoom
                });
            } catch (err) {
                safeErrorSA('Cluster expansion error:', err);
            }
        });

        // Click on unclustered point to show popup
        window.map.on('click', 'unclustered-point', (e) => {
            if (!e.features || e.features.length === 0) return;

            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;

            // Ensure popup appears over the correct copy of the feature
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new maplibregl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                    <div style="font-family: sans-serif; padding: 4px;">
                        <strong>${properties.name || 'İsimsiz'}</strong><br>
                        <small>Tür: ${properties.type || 'point'}</small>
                    </div>
                `)
                .addTo(window.map);

            safeLogSA('🗨️ Popup gösterildi:', properties.name);
        });

        // Change cursor on hover - clusters
        window.map.on('mouseenter', 'clusters', () => {
            window.map.getCanvas().style.cursor = 'pointer';
        });
        window.map.on('mouseleave', 'clusters', () => {
            window.map.getCanvas().style.cursor = '';
        });

        // Change cursor on hover - unclustered points
        window.map.on('mouseenter', 'unclustered-point', () => {
            window.map.getCanvas().style.cursor = 'pointer';
        });
        window.map.on('mouseleave', 'unclustered-point', () => {
            window.map.getCanvas().style.cursor = '';
        });

        // Mark as registered
        window._clusterEventsRegistered = true;
        safeLogSA('✅ Cluster event handler\'ları başarıyla kayıt edildi');
    }

    function toggleClustering() {
        const button = document.getElementById('toggle-cluster');

        // 3 state cycle: normal → clustered → hidden → normal
        // Initialize state if not exists
        if (!window.clusteringState) {
            window.clusteringState = 'normal'; // 'normal' | 'clustered' | 'hidden'
        }

        safeLogSA('🔄 toggleClustering çağrıldı. Şu anki state:', window.clusteringState);

        if (window.clusteringState === 'normal') {
            // State 1 → 2: Enable clustering
            safeLogSA('📍 State geçişi: normal → clustered');
            enableClustering();
            window.clusteringState = 'clustered';
            if (button) {
                button.classList.add('tool-selected');
                button.style.backgroundColor = '#dbeafe'; // Light blue
                // Update icon
                const icon = button.querySelector('i');
                if (icon) {
                    icon.className = 'fa-solid fa-object-group mr-2 text-blue-600';
                }
            }
        } else if (window.clusteringState === 'clustered') {
            // State 2 → 3: Hide all points
            safeLogSA('📍 State geçişi: clustered → hidden');
            hideAllPoints();
            window.clusteringState = 'hidden';
            if (button) {
                button.classList.add('tool-selected');
                button.style.backgroundColor = '#fee2e2'; // Light red
                // Update icon to eye-slash
                const icon = button.querySelector('i');
                if (icon) {
                    icon.className = 'fa-solid fa-eye-slash mr-2 text-red-600';
                }
            }
        } else {
            // State 3 → 1: Show normal markers
            safeLogSA('📍 State geçişi: hidden → normal');
            showNormalMarkers();
            window.clusteringState = 'normal';
            if (button) {
                button.classList.remove('tool-selected');
                button.style.backgroundColor = '';
                // Reset icon
                const icon = button.querySelector('i');
                if (icon) {
                    icon.className = 'fa-solid fa-object-group mr-2 text-gray-600';
                }
            }
        }

        safeLogSA('✅ Yeni state:', window.clusteringState);
    }
    
    function enableClustering() {
        // 🚀 PERFORMANS: Batch import sırasında çağrılabilir (marker'lar henüz yok)
        const visibleMarkers = getVisibleMarkersFromMap();
        
        // Batch import sırasında marker'lar henüz yoksa boş source oluştur
        const allowEmpty = arguments[0] === true; // enableClustering(true) = boş source'a izin ver
        
        if (visibleMarkers.length === 0 && !allowEmpty) {
            if (typeof showEducationalFeedback === 'function') {
                showEducationalFeedback('⚠️ Kümeleme analizi için "Veri Toplama" alanında en az 1 nokta verisi bulunması gerekir. Lütfen önce veri ekleyin.');
            }
            return;
        }
        
        // Hide individual markers (but keep them in the Map for later re-display)
        if (window.markerManager && window.markerManager.markers) {
            let removedCount = 0;
            window.markerManager.markers.forEach(marker => {
                marker.remove();
                removedCount++;
            });
            safeLogSA(`✅ ${removedCount} HTML marker DOM'dan kaldırıldı (markerManager'da saklanıyor)`);
            // DO NOT clear the markers Map - we need it to restore markers when clustering is disabled
        }
        
        // Create GeoJSON from visible markers on map (not from database)
        // Batch import sırasında boş olabilir
        const features = visibleMarkers.filter(data => data.type === 'point').map(data => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [data.lon, data.lat]
            },
            properties: {
                id: data.id,
                name: data.name,
                type: data.type
            }
        }));
        
        const geojson = {
            type: 'FeatureCollection',
            features: features
        };
        
safeLogSA(`⚡ Clustering aktif ediliyor: ${features.length} nokta`);

        // Add or update clustered source
        const existingSource = window.map.getSource('markers');

        if (!existingSource) {
            // Source doesn't exist, create it
            window.map.addSource('markers', {
                type: 'geojson',
                data: geojson,
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50
            });
            safeLogSA('✅ Cluster source oluşturuldu');
        } else {
            // Source exists, check if it's a cluster source
            // Note: MapLibre doesn't expose cluster property, so we need to check if clustering is working
            // Workaround: If source exists, remove and recreate with cluster: true
            // This ensures we always have a proper cluster source in clustered mode

            // Remove layers first
            if (window.map.getLayer('clusters')) {
                window.map.removeLayer('clusters');
            }
            if (window.map.getLayer('cluster-count')) {
                window.map.removeLayer('cluster-count');
            }
            if (window.map.getLayer('unclustered-point')) {
                window.map.removeLayer('unclustered-point');
            }

            // Remove and recreate source with cluster: true
            window.map.removeSource('markers');
            window.map.addSource('markers', {
                type: 'geojson',
                data: geojson,
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50
            });
            safeLogSA('✅ Source yeniden oluşturuldu (cluster: true)');
        }

        // Add cluster layers if not exist
        if (!window.map.getLayer('clusters')) {
            window.map.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'markers',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': [
                        'step',
                        ['get', 'point_count'],
                        '#51bbd6', 100,
                        '#f1f075', 750,
                        '#f28cb1'
                    ],
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20, 100,
                        30, 750,
                        40
                    ]
                }
            });
            safeLogSA('✅ Clusters layer oluşturuldu');
        } else {
            // Layer exists, just make sure it's visible
            window.map.setLayoutProperty('clusters', 'visibility', 'visible');
            safeLogSA('✅ Clusters layer zaten var, görünür yapıldı');
        }

        if (!window.map.getLayer('cluster-count')) {
            window.map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'markers',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-font': ['Noto Sans Regular'],
                    'text-size': 12
                },
                paint: {
                    'text-color': '#ffffff'
                }
            });
            safeLogSA('✅ Cluster-count layer oluşturuldu');
        } else {
            window.map.setLayoutProperty('cluster-count', 'visibility', 'visible');
            safeLogSA('✅ Cluster-count layer zaten var, görünür yapıldı');
        }

        if (!window.map.getLayer('unclustered-point')) {
            window.map.addLayer({
                id: 'unclustered-point',
                type: 'circle',
                source: 'markers',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': '#11b4da',
                    'circle-radius': 2,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#fff'
                }
            });
            safeLogSA('✅ Unclustered-point layer oluşturuldu');
        } else {
            // Restore filter for clustered mode (show only unclustered points)
            window.map.setFilter('unclustered-point', ['!', ['has', 'point_count']]);
            window.map.setLayoutProperty('unclustered-point', 'visibility', 'visible');
            safeLogSA('✅ Unclustered-point layer zaten var, filter restore edildi, görünür yapıldı');
        }

        // Register event handlers (only once, first time)
        setupClusterEventHandlers();
        
        window.clusteringEnabled = true;
        window.clusteringState = 'clustered'; // Update state

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('✅ Nokta kümeleme aktif edildi.');
        }
    }
    
    function disableClustering() {
        // Remove cluster layers
        if (window.map.getLayer('clusters')) {
            window.map.removeLayer('clusters');
        }
        if (window.map.getLayer('cluster-count')) {
            window.map.removeLayer('cluster-count');
        }
        if (window.map.getLayer('unclustered-point')) {
            window.map.removeLayer('unclustered-point');
        }
        if (window.map.getSource('markers')) {
            window.map.removeSource('markers');
        }

        // Show individual markers again (only those that were on map before clustering)
        if (window.markerManager && window.markerManager.markers) {
            window.markerManager.markers.forEach((marker, id) => {
                const el = marker.getElement();
                if (el) {
                    el.style.display = ''; // Restore display
                    if (!marker._map) {
                        // If marker was removed, re-add it
                        marker.addTo(window.map);
                    }
                }
            });
        }

        window.clusteringEnabled = false;
        window.clusteringState = 'normal'; // Update state

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('❌ Nokta kümeleme kapatıldı.');
        }
    }

    function hideAllPoints() {
        safeLogSA('👁️‍🗨️ hideAllPoints çağrıldı');

        // Hide cluster layers if they exist (don't remove, just hide)
        if (window.map.getLayer('clusters')) {
            window.map.setLayoutProperty('clusters', 'visibility', 'none');
            safeLogSA('✅ clusters layer gizlendi');
        }
        if (window.map.getLayer('cluster-count')) {
            window.map.setLayoutProperty('cluster-count', 'visibility', 'none');
            safeLogSA('✅ cluster-count layer gizlendi');
        }
        if (window.map.getLayer('unclustered-point')) {
            window.map.setLayoutProperty('unclustered-point', 'visibility', 'none');
            safeLogSA('✅ unclustered-point layer gizlendi');
        }

        // Hide all HTML markers
        // Note: If coming from clustered state, markers are already removed from DOM
        // In that case, we don't need to do anything - they're already "hidden"
        if (window.markerManager && window.markerManager.markers) {
            let hiddenCount = 0;
            let alreadyRemovedCount = 0;

            window.markerManager.markers.forEach((marker, id) => {
                const el = marker.getElement();

                // Check if marker is in DOM (has _map property)
                if (marker._map) {
                    // Marker is in DOM, hide it
                    if (el) {
                        el.style.display = 'none';
                        hiddenCount++;
                    }
                } else {
                    // Marker was already removed from DOM (clustered state)
                    alreadyRemovedCount++;
                }
            });

            safeLogSA(`✅ ${hiddenCount} HTML marker gizlendi, ${alreadyRemovedCount} marker zaten DOM'da değildi`);
        }

        window.clusteringState = 'hidden'; // Update state

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('👁️ Tüm noktalar gizlendi.');
        }
    }

    function showNormalMarkers() {
        safeLogSA('🔄 showNormalMarkers çağrıldı. Mevcut state:', window.clusteringState);

        // Strategy: Use MapLibre layers for performance (like layer-style-panel does)
        // Instead of creating 1000+ HTML markers, use unclustered-point layer without filter

        const hasMarkers = window.markerManager && window.markerManager.markers && window.markerManager.markers.size > 0;
        safeLogSA('📍 Mevcut HTML marker sayısı:', hasMarkers ? window.markerManager.markers.size : 0);

        if (hasMarkers) {
            // Case 1: Small dataset - HTML markers exist, show them
            safeLogSA('✅ Küçük dataset: HTML marker\'lar gösteriliyor');

            // Hide cluster layers
            if (window.map.getLayer('clusters')) {
                window.map.setLayoutProperty('clusters', 'visibility', 'none');
            }
            if (window.map.getLayer('cluster-count')) {
                window.map.setLayoutProperty('cluster-count', 'visibility', 'none');
            }
            if (window.map.getLayer('unclustered-point')) {
                window.map.setLayoutProperty('unclustered-point', 'visibility', 'none');
            }

            // Show HTML markers
            let shownCount = 0;
            window.markerManager.markers.forEach((marker, id) => {
                try {
                    marker.addTo(window.map);
                    const el = marker.getElement();
                    if (el) {
                        el.style.display = '';
                        el.style.visibility = 'visible';
                        el.style.opacity = '1';
                        shownCount++;
                    }
                } catch (error) {
                    safeErrorSA('Marker gösterme hatası:', error);
                }
            });

            safeLogSA(`✅ ${shownCount} HTML marker gösterildi`);

        } else {
            // Case 2: Large dataset - Use MapLibre layer for performance
            safeLogSA('✅ Büyük dataset: MapLibre layer kullanılıyor (performanslı)');

            // CRITICAL: Convert cluster source to NON-cluster source
            // Normal mode = NO clustering at any zoom level!
            // Solution: Remove and recreate source with cluster: false

            // 1. Remove old cluster source (if exists)
            if (window.map.getSource('markers')) {
                // First remove layers using this source
                if (window.map.getLayer('clusters')) {
                    window.map.removeLayer('clusters');
                    safeLogSA('🗑️ clusters layer kaldırıldı');
                }
                if (window.map.getLayer('cluster-count')) {
                    window.map.removeLayer('cluster-count');
                    safeLogSA('🗑️ cluster-count layer kaldırıldı');
                }
                if (window.map.getLayer('unclustered-point')) {
                    window.map.removeLayer('unclustered-point');
                    safeLogSA('🗑️ unclustered-point layer kaldırıldı');
                }

                // Now remove source
                window.map.removeSource('markers');
                safeLogSA('🗑️ Eski cluster source kaldırıldı');
            }

            // 2. Create NON-cluster source with all points
            if (window.userMarkers && window.userMarkers.length > 0) {
                const pointMarkers = window.userMarkers.filter(m => m.type === 'point');

                const features = pointMarkers.map(data => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [data.lon, data.lat]
                    },
                    properties: {
                        id: data.id,
                        name: data.name,
                        type: data.type
                    }
                }));

                const geojson = {
                    type: 'FeatureCollection',
                    features: features
                };

                // Create NON-cluster source
                window.map.addSource('markers', {
                    type: 'geojson',
                    data: geojson,
                    cluster: false  // ← NO CLUSTERING!
                });
                safeLogSA(`✅ NON-cluster source oluşturuldu (${features.length} nokta, zoom out\'ta da kaybolmaz)`);

                // 3. Add simple circle layer (no filter needed, no clustering)
                window.map.addLayer({
                    id: 'unclustered-point',
                    type: 'circle',
                    source: 'markers',
                    paint: {
                        'circle-color': '#11b4da',
                        'circle-radius': 6,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff'
                    }
                });
                safeLogSA('✅ unclustered-point layer eklendi (tüm noktalar her zoom\'da görünür)');

                // Event handlers already registered, they work on 'unclustered-point' layer
                safeLogSA('✅ Click popup event zaten aktif');
            } else {
                safeLogSA('⚠️ userMarkers verisi bulunamadı!');
            }
        }

        window.clusteringEnabled = false;
        window.clusteringState = 'normal'; // Update state

        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('✅ Noktalar tek tek gösteriliyor.');
        }
    }

    // ==========================================
    // HEATMAP (MapLibre Native)
    // ==========================================
    
    function toggleHeatmap() {
        const button = document.getElementById('toggle-heatmap');
        const controls = document.getElementById('heat-controls');
        
        if (!window.heatmapEnabled) {
            enableHeatmap();
            if (button) {
                button.classList.add('tool-selected');
            }
            // Ayarlar panelini göster
            if (controls) {
                controls.style.display = 'flex';
                controls.classList.add('active');
            }
            // Renk skalası butonunu göster
            const colorToggleBtn = document.getElementById('toggle-heatmap-color');
            const colorDropdown = document.getElementById('heat-color-dropdown');
            if (colorToggleBtn) {
                colorToggleBtn.style.display = 'flex';
                colorToggleBtn.classList.add('active'); // CSS'teki !important için gerekli
            }
            if (colorDropdown) {
                colorDropdown.classList.add('hidden'); // Başlangıçta kapalı
            }
        } else {
            disableHeatmap();
            if (button) {
                button.classList.remove('tool-selected');
            }
            // Ayarlar panelini gizle
            if (controls) {
                controls.style.display = 'none';
                controls.classList.remove('active');
            }
            // Renk skalası butonunu gizle
            const colorToggleBtn = document.getElementById('toggle-heatmap-color');
            const colorDropdown = document.getElementById('heat-color-dropdown');
            if (colorToggleBtn) {
                colorToggleBtn.style.display = 'none';
                colorToggleBtn.classList.remove('active'); // CSS override için
            }
            if (colorDropdown) {
                colorDropdown.classList.add('hidden'); // Dropdown'ı da gizle
            }
        }
    }
    
    function enableHeatmap() {
        // Haritadaki görünür verileri al (database yerine)
        const visibleMarkers = getVisibleMarkersFromMap();
        
        // Filter only point data from visible markers on map
        const pointData = visibleMarkers.filter(data => data.type === 'point');
        
        if (pointData.length === 0) {
            if (typeof showEducationalFeedback === 'function') {
                showEducationalFeedback('⚠️ Isı Haritası analizi için "Veri Toplama" alanında en az 1 nokta verisi bulunması gerekir. Lütfen önce veri ekleyin.');
            }
            return;
        }
        
        // Create GeoJSON from point markers
        const features = pointData.map(data => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [data.lon, data.lat]
            },
            properties: {
                value: data.value || 1,
                name: data.name || 'Nokta'
            }
        }));
        
        const geojson = {
            type: 'FeatureCollection',
            features: features
        };
        
        // Add heatmap source
        if (!window.map.getSource('heatmap-data')) {
            try {
                window.map.addSource('heatmap-data', {
                    type: 'geojson',
                    data: geojson
                });
            } catch (err) {
safeErrorSA('❌ Error adding heatmap source:', err);
                return;
            }
            
            // Add heatmap layer (MapLibre native)
            try {
                window.map.addLayer({
                id: 'heatmap-layer',
                type: 'heatmap',
                source: 'heatmap-data',
                maxzoom: 15,
                paint: {
                    // Increase the heatmap weight based on frequency and property value
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'value'],
                        0, 0,
                        6, 1
                    ],
                    // Increase the heatmap color weight by zoom level
                    // heatmap-intensity is a multiplier on top of heatmap-weight
                    // Base intensity: 3 (can be changed via slider)
                    // Zoom interpolation: 0->2x, 9->3x, 15->5x
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 2,
                        9, 3,
                        15, 5
                    ],
                    // Color ramp for heatmap. Domain is 0 (low) to 1 (high).
                    // MapLibre official colors: blue (low) -> orange -> red (high)
                    'heatmap-color': heatmapColorSchemes[currentColorScheme].colors,
                    // Adjust the heatmap radius by zoom level
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 8,
                        9, 25,
                        15, 50
                    ],
                    // Transition from heatmap to circle layer by zoom level
                    'heatmap-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 0.9,
                        9, 0.8,
                        11, 0.3,
                        13, 0
                    ]
                }
            });
            } catch (err) {
safeErrorSA('❌ Error adding heatmap layer:', err);
                return;
            }
            
            // Add circle layer for individual points at high zoom
            try {
                window.map.addLayer({
                id: 'heatmap-point',
                type: 'circle',
                source: 'heatmap-data',
                minzoom: 10,
                paint: {
                    // Size circle radius by zoom level
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10, 2,
                        15, 8,
                        18, 15
                    ],
                    // Color circle by heatmap color ramp
                    'circle-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'value'],
                        0, 'rgb(103,169,207)',
                        2, 'rgb(209,229,240)',
                        4, 'rgb(253,219,199)',
                        6, 'rgb(178,24,43)'
                    ],
                    'circle-stroke-color': 'white',
                    'circle-stroke-width': 1,
                    // Transition from heatmap to circle layer by zoom level
                    'circle-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10, 0,
                        12, 0.8
                    ]
                }
            });
            } catch (err) {
safeErrorSA('❌ Error adding heatmap-point layer:', err);
                // Continue even if circle layer fails
            }
            
        } else {
            window.map.getSource('heatmap-data').setData(geojson);
        }
        
        window.heatmapEnabled = true;
        
        // Hide original point markers
        hideOriginalMarkers();
        
        // Initialize slider handlers
        initializeHeatmapSliders();
        
        // Initialize color scheme toggle
        initializeHeatmapColorToggle();
        
        // Renk skalası butonunu göster
        const colorToggleBtn = document.getElementById('toggle-heatmap-color');
        const colorDropdown = document.getElementById('heat-color-dropdown');
        if (colorToggleBtn) {
            colorToggleBtn.style.display = 'flex';
            colorToggleBtn.classList.add('active'); // CSS'teki !important için gerekli
        }
        if (colorDropdown) {
            colorDropdown.classList.add('hidden'); // Başlangıçta kapalı
        }
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('🔥 Isı haritası aktif edildi.');
        }
    }
    
    function disableHeatmap() {
        // Remove circle layer
        if (window.map.getLayer('heatmap-point')) {
            window.map.removeLayer('heatmap-point');
        }
        // Remove heatmap layer
        if (window.map.getLayer('heatmap-layer')) {
            window.map.removeLayer('heatmap-layer');
        }
        // Remove source
        if (window.map.getSource('heatmap-data')) {
            window.map.removeSource('heatmap-data');
        }
        
        window.heatmapEnabled = false;
        
        // Renk skalası butonunu gizle
        const colorToggleBtn = document.getElementById('toggle-heatmap-color');
        const colorDropdown = document.getElementById('heat-color-dropdown');
        if (colorToggleBtn) {
            colorToggleBtn.style.display = 'none';
            colorToggleBtn.classList.remove('active'); // CSS override için
        }
        if (colorDropdown) {
            colorDropdown.classList.add('hidden'); // Dropdown'ı da gizle
        }
        
        // Show original point markers again
        showOriginalMarkers();
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('❌ Isı haritası kapatıldı.');
        }
    }
    
    // Helper function to hide original markers
    function hideOriginalMarkers() {
        if (!window.markerManager || !window.markerManager.markers) return;
        
        // Hide all maplibregl.Marker instances from MarkerManager
        window.markerManager.markers.forEach((marker, id) => {
            const el = marker.getElement();
            if (el) {
                el.style.display = 'none';
            }
        });
    }
    
    // Helper function to show original markers
    function showOriginalMarkers() {
        if (!window.markerManager || !window.markerManager.markers) return;
        
        // Show all maplibregl.Marker instances from MarkerManager
        window.markerManager.markers.forEach((marker, id) => {
            const el = marker.getElement();
            if (el) {
                el.style.display = '';
            }
        });
    }
    
    function initializeHeatmapSliders() {
        const radiusSlider = document.getElementById('heat-radius');
        const blurSlider = document.getElementById('heat-blur');
        const intensitySlider = document.getElementById('heat-intensity');
        const radiusVal = document.getElementById('heat-radius-val');
        const blurVal = document.getElementById('heat-blur-val');
        const intensityVal = document.getElementById('heat-intensity-val');
        
        if (radiusSlider && !radiusSlider._initialized) {
            radiusSlider.addEventListener('input', (e) => {
                const radius = parseInt(e.target.value);
                if (radiusVal) radiusVal.textContent = radius;
                
                if (window.map.getLayer('heatmap-layer')) {
                    window.map.setPaintProperty('heatmap-layer', 'heatmap-radius', [
                        'interpolate', ['linear'], ['zoom'],
                        0, radius / 20,
                        15, radius
                    ]);
                }
            });
            radiusSlider._initialized = true;
        }
        
        if (blurSlider && !blurSlider._initialized) {
            blurSlider.addEventListener('input', (e) => {
                const blur = parseInt(e.target.value);
                if (blurVal) blurVal.textContent = blur;
                
                // Note: MapLibre doesn't have heatmap-blur, we use opacity instead
                if (window.map.getLayer('heatmap-layer')) {
                    const opacity = blur / 30; // Scale 8-30 to 0.27-1
                    window.map.setPaintProperty('heatmap-layer', 'heatmap-opacity', [
                        'interpolate', ['linear'], ['zoom'],
                        7, opacity,
                        15, opacity * 0.6
                    ]);
                }
            });
            blurSlider._initialized = true;
        }
        
        if (intensitySlider && !intensitySlider._initialized) {
            let intensityTimeout;
            
            intensitySlider.addEventListener('input', (e) => {
                const baseIntensity = parseInt(e.target.value);
                if (intensityVal) intensityVal.textContent = baseIntensity;
                
                // Debounce: Performans için az güncelleme
                clearTimeout(intensityTimeout);
                intensityTimeout = setTimeout(() => {
                    if (window.map.getLayer('heatmap-layer')) {
                        // Zoom bazlı interpolasyon: Kullanıcı değeri base (zoom 9) olarak kullanılır
                        // Zoom 0: base * 0.67, Zoom 9: base, Zoom 15: base * 1.67
                        const zoom0Intensity = baseIntensity * 0.67;
                        const zoom15Intensity = baseIntensity * 1.67;
                        
                        window.map.setPaintProperty('heatmap-layer', 'heatmap-intensity', [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, Math.max(0.5, zoom0Intensity),  // Minimum 0.5
                            9, baseIntensity,
                            15, Math.min(10, zoom15Intensity)  // Maximum 10
                        ]);
                    }
                }, 50); // 50ms debounce - performans için kısa
            });
            intensitySlider._initialized = true;
        }
    }
    
    function initializeHeatmapColorToggle() {
        const toggleBtn = document.getElementById('toggle-heatmap-color');
        const dropdown = document.getElementById('heat-color-dropdown');
        
        if (toggleBtn && !toggleBtn._initialized) {
            
            // Toggle dropdown açma/kapama
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('hidden');
                
                if (isOpen) {
                    dropdown.classList.remove('hidden');
                    toggleBtn.classList.add('bg-purple-50');
                } else {
                    dropdown.classList.add('hidden');
                    toggleBtn.classList.remove('bg-purple-50');
                }
            });
            
            toggleBtn._initialized = true;
        }
        
        // Dropdown item'larına tıklama eventi
        if (dropdown) {
            const options = dropdown.querySelectorAll('.heat-color-option');
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const scheme = option.dataset.scheme;
                    changeHeatmapColorScheme(scheme);
                    dropdown.classList.add('hidden');
                    toggleBtn.classList.remove('bg-purple-50');
                });
            });
            
            // Dropdown dışına tıklayınca kapat
            document.addEventListener('click', (e) => {
                if (!toggleBtn.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.add('hidden');
                    toggleBtn.classList.remove('bg-purple-50');
                }
            });
            
            // İlk dropdown güncellemesi
            updateColorSchemeDropdown();
        }
    }

    // ==========================================
    // BUFFER ANALYSIS (Turf.js + MapLibre)
    // ==========================================
    
    /**
     * Create union of all buffers (merge overlapping areas)
     */
    function createUnionBuffers(buffers) {
        if (buffers.length === 0) return turf.featureCollection([]);
        
        try {
            let union = buffers[0];
            for (let i = 1; i < buffers.length; i++) {
                union = turf.union(union, buffers[i]);
            }
            
            // Calculate total area
            const totalArea = turf.area(union);
            const areaKm2 = (totalArea / 1000000).toFixed(2);
            
            union.properties = {
                id: 'union-buffer',
                name: 'Birleşik Etki Alanı',
                area: `${parseFloat(areaKm2).toLocaleString('tr-TR')} km²`,
                bufferCount: buffers.length
            };
            
            return turf.featureCollection([union]);
        } catch (error) {
safeErrorSA('Union hesaplama hatası:', error);
            return turf.featureCollection(buffers);
        }
    }
    
    /**
     * Create intersection areas (only overlapping regions)
     */
    function createIntersectionBuffers(buffers) {
        if (buffers.length < 2) return turf.featureCollection([]);
        
        const intersections = [];
        
        // Find all intersections between buffer pairs
        for (let i = 0; i < buffers.length; i++) {
            for (let j = i + 1; j < buffers.length; j++) {
                try {
                    const intersection = turf.intersect(buffers[i], buffers[j]);
                    if (intersection) {
                        const area = turf.area(intersection);
                        intersection.properties = {
                            id: `intersection-${i}-${j}`,
                            name: `Çakışma: ${buffers[i].properties.name} & ${buffers[j].properties.name}`,
                            area: formatArea(area),
                            type: 'intersection'
                        };
                        intersections.push(intersection);
                    }
                } catch (error) {
safeWarnSA('Kesişim hesaplama hatası:', error);
                }
            }
        }
        
        return turf.featureCollection(intersections);
    }
    
    /**
     * Create difference areas (non-overlapping regions)
     */
    function createDifferenceBuffers(buffers) {
        if (buffers.length < 2) return turf.featureCollection(buffers);
        
        const differences = [];
        
        // For each buffer, subtract all others
        buffers.forEach((buffer, index) => {
            try {
                let diff = buffer;
                for (let i = 0; i < buffers.length; i++) {
                    if (i !== index) {
                        const result = turf.difference(diff, buffers[i]);
                        if (result) {
                            diff = result;
                        }
                    }
                }
                
                if (diff && turf.area(diff) > 0) {
                    diff.properties = {
                        ...buffer.properties,
                        name: `${buffer.properties.name} (Benzersiz)`,
                        type: 'difference'
                    };
                    differences.push(diff);
                }
            } catch (error) {
safeWarnSA('Fark hesaplama hatası:', error);
                differences.push(buffer);
            }
        });
        
        return turf.featureCollection(differences);
    }
    
    function bufferAnalysis() {
        if (window.userMarkers.length === 0) {
            showMinimalNotification('⚠️ Etki Alanı (Buffer) analizi için "Veri Toplama" alanında en az 1 veri bulunması gerekir. Lütfen önce veri ekleyin.');
            return;
        }
        
        // Radius dialog
        const radius = prompt('Etki alanı yarıçapını metre cinsinden girin:', window.lastBufferRadius || '500');
        if (!radius || isNaN(radius)) return;
        
        window.lastBufferRadius = parseFloat(radius);
        
        // Create buffers using Turf.js
        const buffers = window.userMarkers.map((data, index) => {
            const point = turf.point([data.lon, data.lat]);
            const buffered = turf.buffer(point, radius / 1000, { units: 'kilometers' });
            buffered.properties = {
                id: data.id,
                name: data.name,
                radius: radius,
                color: ['purple', 'orange', 'pink', 'cyan', 'lime'][index % 5]
            };
            return buffered;
        });
        
        const featureCollection = turf.featureCollection(buffers);
        
        // Add/update buffer source
        if (!window.map.getSource('buffers')) {
            window.map.addSource('buffers', {
                type: 'geojson',
                data: featureCollection
            });
            
            window.map.addLayer({
                id: 'buffer-fills',
                type: 'fill',
                source: 'buffers',
                paint: {
                    'fill-color': '#9333ea',
                    'fill-opacity': 0.3
                }
            });
            
            window.map.addLayer({
                id: 'buffer-outlines',
                type: 'line',
                source: 'buffers',
                paint: {
                    'line-color': '#9333ea',
                    'line-width': 2
                }
            });
        } else {
            window.map.getSource('buffers').setData(featureCollection);
        }
        
        window.bufferActive = true;
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`✅ ${window.userMarkers.length} nokta için ${radius}m etki alanı analizi tamamlandı.`);
        }
    }
    
    /**
     * Create buffer analysis with multiple radii (for different markers)
     * @param {Object} radii - Object with marker IDs as keys and radius values
     * @param {Array} markers - Array of marker data objects
     */
    function createBufferAnalysisMultiple(radii, markers) {
        if (!radii || Object.keys(radii).length === 0) {
            showMinimalNotification('⚠️ Yarıçap değerleri belirtilmedi.');
            return;
        }
        
        // Create buffers using Turf.js
        const buffers = markers.map((data, index) => {
            const radius = radii[data.id] || 500; // Default 500m if not specified
            const point = turf.point([data.lon, data.lat]);
            const buffered = turf.buffer(point, radius / 1000, { units: 'kilometers' });
            
            // Calculate buffer area
            const area = turf.area(buffered);
            const areaKm2 = (area / 1000000).toFixed(2);
            const areaHa = (area / 10000).toFixed(2);
            
            // Format area
            let areaStr;
            if (area < 10000) {
                areaStr = `${Math.round(area).toLocaleString('tr-TR')} m²`;
            } else if (area < 1000000) {
                areaStr = `${parseFloat(areaHa).toLocaleString('tr-TR')} ha`;
            } else {
                areaStr = `${parseFloat(areaKm2).toLocaleString('tr-TR')} km²`;
            }
            
            // Calculate perimeter
            const perimeter = turf.length(turf.polygonToLine(buffered), { units: 'meters' });
            const perimeterStr = perimeter < 1000 
                ? `${Math.round(perimeter).toLocaleString('tr-TR')} m`
                : `${(perimeter / 1000).toFixed(2).toLocaleString('tr-TR')} km`;
            
            buffered.properties = {
                id: data.id,
                name: data.name,
                radius: radius,
                area: areaStr,
                perimeter: perimeterStr,
                centerLat: data.lat.toFixed(5),
                centerLon: data.lon.toFixed(5),
                color: ['purple', 'orange', 'pink', 'cyan', 'lime'][index % 5]
            };
            return buffered;
        });
        
        // Store buffers and markers in state
        window.bufferAnalysisState.currentBuffers = buffers;
        window.bufferAnalysisState.currentMarkers = markers;
        
        // Process buffers based on current mode
        let featureCollection;
        switch (window.bufferAnalysisState.mode) {
            case 'union':
                featureCollection = createUnionBuffers(buffers);
                break;
            case 'intersection':
                featureCollection = createIntersectionBuffers(buffers);
                break;
            case 'difference':
                featureCollection = createDifferenceBuffers(buffers);
                break;
            default: // 'normal'
                featureCollection = turf.featureCollection(buffers);
        }
        
        // Store buffer label markers
        if (!window.bufferLabelMarkers) {
            window.bufferLabelMarkers = [];
        }
        
        // Remove old label markers
        window.bufferLabelMarkers.forEach(marker => marker.remove());
        window.bufferLabelMarkers = [];
        
        // Create HTML markers for labels
        markers.forEach((data) => {
            const radius = radii[data.id] || 500;
            const radiusLabel = `${Number(radius).toLocaleString('tr-TR')} m`;
            
            // Create HTML element for label
            const labelEl = document.createElement('div');
            labelEl.className = 'buffer-label';
            labelEl.textContent = radiusLabel;
            const color = getBufferModeColor(window.bufferAnalysisState.mode); // Use current mode color
            labelEl.style.cssText = `
                background: ${color};
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                white-space: nowrap;
                pointer-events: none;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
                transform: translateZ(0);
                will-change: transform;
            `;
            
            // Create MapLibre marker
            const labelMarker = new maplibregl.Marker({
                element: labelEl,
                anchor: 'center'
            })
                .setLngLat([data.lon, data.lat])
                .addTo(window.map);
            
            window.bufferLabelMarkers.push(labelMarker);
        });
        
        // Add/update buffer source
        const buffersSource = window.map.getSource('buffers');
        
        if (!buffersSource) {
            // Get current mode color
            const color = getBufferModeColor(window.bufferAnalysisState.mode);
            
            // Create buffer source and layers
            window.map.addSource('buffers', {
                type: 'geojson',
                data: featureCollection
            });
            
            window.map.addLayer({
                id: 'buffer-fills',
                type: 'fill',
                source: 'buffers',
                paint: {
                    'fill-color': color,
                    'fill-opacity': 0.35
                }
            });
            
            window.map.addLayer({
                id: 'buffer-outlines',
                type: 'line',
                source: 'buffers',
                paint: {
                    'line-color': color,
                    'line-width': 2,
                    'line-dasharray': [2, 2]
                }
            });
            
        } else {
            // Update existing buffer source
            buffersSource.setData(featureCollection);
        }
        
        window.bufferActive = true;
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`✅ ${markers.length} nokta için etki alanı analizi tamamlandı.`);
        }
    }

    // ==========================================
    // CONVEX HULL (Turf.js + MapLibre)
    // ==========================================
    
    function buildConvexHull() {
        // Toggle: Eğer zaten aktifse kapat
        if (window.analysisStates.convex) {
            // Temizle
            if (window.map.getLayer('convex-hull-fill')) {
                window.map.removeLayer('convex-hull-fill');
            }
            if (window.map.getLayer('convex-hull-outline')) {
                window.map.removeLayer('convex-hull-outline');
            }
            if (window.map.getSource('convex-hull')) {
                window.map.removeSource('convex-hull');
            }
            window.analysisStates.convex = false;
            
            if (typeof showEducationalFeedback === 'function') {
                showEducationalFeedback('❌ Dış sınır temizlendi.');
            }
            return;
        }
        
        // Haritadaki görünür verileri al
        const visibleMarkers = getVisibleMarkersFromMap();
        
        if (visibleMarkers.length < 3) {
            showMinimalNotification('⚠️ Dış Sınır analizi için "Veri Toplama" alanında en az 3 nokta bulunması gerekir. Lütfen önce veri ekleyin.');
            return;
        }
        
        const points = turf.featureCollection(
            visibleMarkers.map(data => turf.point([data.lon, data.lat]))
        );
        
        const hull = turf.convex(points);
        
        if (!hull) { 
            showMinimalNotification('⚠️ Dış sınır (convex hull) oluşturulamadı. Lütfen en az 3 nokta ekleyin.');
            return; 
        }
        
        // Add convex hull source
        if (!window.map.getSource('convex-hull')) {
            window.map.addSource('convex-hull', {
                type: 'geojson',
                data: hull
            });
            
            window.map.addLayer({
                id: 'convex-hull-fill',
                type: 'fill',
                source: 'convex-hull',
                paint: {
                    'fill-color': '#f97316',
                    'fill-opacity': 0.2
                }
            });
            
            window.map.addLayer({
                id: 'convex-hull-outline',
                type: 'line',
                source: 'convex-hull',
                paint: {
                    'line-color': '#f97316',
                    'line-width': 2
                }
            });
        } else {
            window.map.getSource('convex-hull').setData(hull);
        }
        
        window.analysisStates.convex = true;
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback('✅ Konveks kabuk (dış sınır) oluşturuldu.');
        }
    }

    // ==========================================
    // VORONOI DIAGRAM (Turf.js + MapLibre)
    // ==========================================
    
    function buildVoronoi() {
        // Toggle: Eğer zaten aktifse kapat
        if (window.analysisStates.voronoi) {
            // Temizle
            if (window.map.getLayer('voronoi-fill')) {
                window.map.removeLayer('voronoi-fill');
            }
            if (window.map.getLayer('voronoi-outline')) {
                window.map.removeLayer('voronoi-outline');
            }
            if (window.map.getSource('voronoi')) {
                window.map.removeSource('voronoi');
            }
            window.analysisStates.voronoi = false;
            
            if (typeof showEducationalFeedback === 'function') {
                showEducationalFeedback('❌ En yakın alanlar temizlendi.');
            }
            return;
        }
        
        // Haritadaki görünür verileri al
        const visibleMarkers = getVisibleMarkersFromMap();
        
        if (visibleMarkers.length < 2) {
            showMinimalNotification('⚠️ En Yakın Alanlar analizi için "Veri Toplama" alanında en az 2 nokta bulunması gerekir. Lütfen önce veri ekleyin.');
            return;
        }
        
        // 1. Sadece point tipindeki verileri filtrele (voronoi sadece nokta verileriyle çalışır)
        const pointMarkers = visibleMarkers.filter(data => 
            (data.type === 'point' || !data.type) && 
            data.lon != null && 
            data.lat != null
        );
        
        if (pointMarkers.length < 2) {
            showMinimalNotification('⚠️ Voronoi analizi için en az 2 nokta verisi gereklidir.');
            return;
        }
        
        // 2. Geçerli koordinatları filtrele ve duplicate koordinatları temizle
        const validPointsMap = new Map();
        const validPoints = [];
        
        pointMarkers.forEach(data => {
            const lon = parseFloat(data.lon);
            const lat = parseFloat(data.lat);
            
            // Koordinat doğrulama
            if (!isNaN(lon) && !isNaN(lat) && isFinite(lon) && isFinite(lat)) {
                // Duplicate koordinatları temizle (aynı konumda birden fazla nokta varsa sadece birini al)
                const key = `${lon.toFixed(6)},${lat.toFixed(6)}`;
                if (!validPointsMap.has(key)) {
                    validPointsMap.set(key, turf.point([lon, lat]));
                    validPoints.push(turf.point([lon, lat]));
                }
            }
        });
        
        if (validPoints.length < 2) {
            showMinimalNotification('⚠️ Voronoi analizi için en az 2 geçerli ve farklı konum gereklidir.');
            return;
        }
        
        try {
            const points = turf.featureCollection(validPoints);
            
            // 3. Bounding box hesapla ve doğrula
            const bbox = turf.bbox(points);
            
            if (!bbox || bbox.length !== 4 || bbox.some(v => !isFinite(v))) {
                showMinimalNotification('⚠️ Harita sınırları hesaplanamadı.');
                return;
            }
            
            // 4. Voronoi oluştur
            const voronoi = turf.voronoi(points, { bbox });
            
            // 5. Voronoi sonucunu doğrula
            if (!voronoi || !voronoi.type || voronoi.type !== 'FeatureCollection' || 
                !voronoi.features || voronoi.features.length === 0) {
safeErrorSA('Voronoi sonucu geçersiz:', voronoi);
                showMinimalNotification('⚠️ Voronoi diyagramı oluşturulamadı.');
                return;
            }
            
            // 6. Add voronoi source
            if (!window.map.getSource('voronoi')) {
                window.map.addSource('voronoi', {
                    type: 'geojson',
                    data: voronoi
                });
                
                window.map.addLayer({
                    id: 'voronoi-fill',
                    type: 'fill',
                    source: 'voronoi',
                    paint: {
                        'fill-color': '#14b8a6',
                        'fill-opacity': 0.1
                    }
                });
                
                window.map.addLayer({
                    id: 'voronoi-outline',
                    type: 'line',
                    source: 'voronoi',
                    paint: {
                        'line-color': '#14b8a6',
                        'line-width': 1
                    }
                });
            } else {
                window.map.getSource('voronoi').setData(voronoi);
            }
            
            window.analysisStates.voronoi = true;
            
            if (typeof showEducationalFeedback === 'function') {
                showEducationalFeedback('✅ Voronoi diyagramı (en yakın alanlar) oluşturuldu.');
            }
        } catch (error) {
safeErrorSA('Voronoi hatası:', error);
            showMinimalNotification('⚠️ Voronoi diyagramı oluşturulurken hata oluştu: ' + error.message);
        }
    }

    // ==========================================
    // NEAREST FACILITY (Turf.js + MapLibre)
    // ==========================================
    
    function nearestFacility() {
        // Toggle: Eğer zaten aktifse kapat
        if (window.analysisStates.nearest) {
            // Temizle
            if (window.map.getLayer('nearest-facility-label')) {
                window.map.removeLayer('nearest-facility-label');
            }
            if (window.map.getLayer('nearest-facility-line')) {
                window.map.removeLayer('nearest-facility-line');
            }
            if (window.map.getSource('nearest-facility')) {
                window.map.removeSource('nearest-facility');
            }
            window.analysisStates.nearest = false;
            
            if (typeof showEducationalFeedback === 'function') {
                showEducationalFeedback('❌ En yakın iki nokta temizlendi.');
            }
            return;
        }
        
        // Haritadaki görünür verileri al
        const visibleMarkers = getVisibleMarkersFromMap();
        
        if (visibleMarkers.length < 2) {
            showMinimalNotification('⚠️ En Yakın İki Nokta analizi için "Veri Toplama" alanında en az 2 nokta bulunması gerekir. Lütfen önce veri ekleyin.');
            return;
        }
        
        // Find two closest points from visible markers on map
        let minDistance = Infinity;
        let closestPair = null;
        
        for (let i = 0; i < visibleMarkers.length; i++) {
            for (let j = i + 1; j < visibleMarkers.length; j++) {
                const from = turf.point([visibleMarkers[i].lon, visibleMarkers[i].lat]);
                const to = turf.point([visibleMarkers[j].lon, visibleMarkers[j].lat]);
                const distance = turf.distance(from, to, { units: 'kilometers' });
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPair = [visibleMarkers[i], visibleMarkers[j]];
                }
            }
        }
        
        if (!closestPair) return;
        
        // Mesafe formatını dinamik olarak belirle (metre/km)
        const distanceText = minDistance < 1 
            ? `${Math.round(minDistance * 1000)} m`
            : `${minDistance.toFixed(2)} km`;
        
        // Line feature oluştur - mesafe bilgisini properties'e ekle
        const line = turf.lineString([
            [closestPair[0].lon, closestPair[0].lat],
            [closestPair[1].lon, closestPair[1].lat]
        ], {
            distance: distanceText,
            distanceValue: minDistance
        });
        
        // Add nearest facility line
        if (!window.map.getSource('nearest-facility')) {
            window.map.addSource('nearest-facility', {
                type: 'geojson',
                data: line
            });
            
            window.map.addLayer({
                id: 'nearest-facility-line',
                type: 'line',
                source: 'nearest-facility',
                paint: {
                    'line-color': '#ec4899',
                    'line-width': 3
                }
            });
            
            // İlk symbol layer'ı bul (label'ı en üste eklemek için)
            const layers = window.map.getStyle().layers;
            const firstSymbolLayer = layers.find(l => l.type === 'symbol');
            const beforeId = firstSymbolLayer ? firstSymbolLayer.id : undefined;
            
            // Mesafe etiketi layer'ı ekle (çizginin üzerine - backgroundsuz, minimal, siyah renk)
            window.map.addLayer({
                id: 'nearest-facility-label',
                type: 'symbol',
                source: 'nearest-facility',
                layout: {
                    'symbol-placement': 'line',
                    'text-field': ['get', 'distance'],
                    'text-font': ['Noto Sans Regular'],
                    'text-size': 11,
                    'text-offset': [0, 0],
                    'text-allow-overlap': true,
                    'text-ignore-placement': true
                },
                paint: {
                    'text-color': '#000000',  // Siyah renk
                    'text-halo-width': 0  // Background yok
                }
            }, beforeId);  // En üste ekle (symbol layer'ların arasında)
        } else {
            window.map.getSource('nearest-facility').setData(line);
            
            // Label layer varsa güncelle (yoksa ekle)
            if (!window.map.getLayer('nearest-facility-label')) {
                const layers = window.map.getStyle().layers;
                const firstSymbolLayer = layers.find(l => l.type === 'symbol');
                const beforeId = firstSymbolLayer ? firstSymbolLayer.id : undefined;
                
                window.map.addLayer({
                    id: 'nearest-facility-label',
                    type: 'symbol',
                    source: 'nearest-facility',
                    layout: {
                        'symbol-placement': 'line',
                        'text-field': ['get', 'distance'],
                        'text-font': ['Noto Sans Regular'],
                        'text-size': 11,
                        'text-offset': [0, 0],
                        'text-allow-overlap': true,
                        'text-ignore-placement': true
                    },
                    paint: {
                        'text-color': '#000000',  // Siyah renk
                        'text-halo-width': 0
                    }
                }, beforeId);
            }
        }
        
        window.analysisStates.nearest = true;
        
        const distanceKm = distanceText;
        
        // 🎯 İki noktaya zoom yap - ölçek 10 km olacak şekilde
        // 10 km genişlik için gerekli zoom seviyesini hesapla
        // Formül: zoom = log2(40075 / width_in_km)
        const targetWidthKm = 10; // 10 km
        const earthCircumferenceKm = 40075; // Dünya çevresi (km)
        const targetZoom = Math.log2(earthCircumferenceKm / targetWidthKm);
        
        // İki noktanın ortasına zoom yap
        const centerLon = (closestPair[0].lon + closestPair[1].lon) / 2;
        const centerLat = (closestPair[0].lat + closestPair[1].lat) / 2;
        
        window.map.flyTo({
            center: [centerLon, centerLat],
            zoom: targetZoom,
            duration: 1500
        });
        
        if (typeof showEducationalFeedback === 'function') {
            showEducationalFeedback(`✅ En yakın iki nokta: ${closestPair[0].name} - ${closestPair[1].name} (${distanceKm})`);
        }
    }

    // ==========================================
    // INITIALIZE CLICK HANDLERS FOR ANALYSIS LAYERS
    // ==========================================
    
    let analysisHandlersInitialized = false;
    
    function initializeAnalysisClickHandlers() {
        if (!window.map || analysisHandlersInitialized) return;
        
        analysisHandlersInitialized = true;
        
        // Buffer click handler
        window.map.on('click', 'buffer-fills', (e) => {
            if (e.features && e.features.length > 0) {
                const props = e.features[0].properties;
                
                const popupContent = `
                    <div class="font-sans text-sm">
                        <div class="font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-200">
                            <i class="fa-solid fa-circle-dot mr-1.5 text-purple-600"></i>
                            ${props.name}
                        </div>
                        <div class="text-xs text-gray-600 space-y-1">
                            <div><strong>Yarıçap:</strong> ${Number(props.radius).toLocaleString('tr-TR')} m</div>
                            <div class="mt-2 pt-2 border-t border-gray-200">
                                <div><strong>Alan:</strong> ${props.area}</div>
                                <div><strong>Çevre:</strong> ${props.perimeter}</div>
                            </div>
                        </div>
                    </div>
                `;
                
                new maplibregl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(popupContent)
                    .addTo(window.map);
            }
        });
        
        // Buffer hover handlers
        window.map.on('mouseenter', 'buffer-fills', () => {
            window.map.getCanvas().style.cursor = 'pointer';
        });
        
        window.map.on('mouseleave', 'buffer-fills', () => {
            window.map.getCanvas().style.cursor = '';
        });
    }
    
    // Initialize when map is loaded
    if (window.map && typeof window.map.loaded === 'function' && window.map.loaded()) {
        initializeAnalysisClickHandlers();
    } else if (window.map && typeof window.map.on === 'function') {
        window.map.on('load', initializeAnalysisClickHandlers);
    } else {
        // Map not ready yet, wait for it
        const waitForMap = setInterval(() => {
            if (window.map && typeof window.map.on === 'function') {
                clearInterval(waitForMap);
                if (window.map.loaded()) {
                    initializeAnalysisClickHandlers();
                } else {
                    window.map.on('load', initializeAnalysisClickHandlers);
                }
            }
        }, 100);
    }
    
    // Expose initialization function for manual triggering if needed
    window.initializeAnalysisClickHandlers = initializeAnalysisClickHandlers;
    
    // ==========================================
    // BUFFER MODE CONTROL FUNCTIONS
    // ==========================================
    
    /**
     * Get color for buffer mode
     */
    function getBufferModeColor(mode) {
        const colors = {
            'normal': '#10b981',      // Emerald
            'union': '#3b82f6',       // Blue
            'intersection': '#f59e0b', // Amber/Orange
            'difference': '#8b5cf6'   // Purple
        };
        return colors[mode] || '#10b981';
    }
    
    /**
     * Change buffer display mode and refresh visualization
     */
    function setBufferMode(mode) {
        window.bufferAnalysisState.mode = mode;
        
        // Update buffer layer colors
        const color = getBufferModeColor(mode);
        if (window.map.getLayer('buffer-fills')) {
            window.map.setPaintProperty('buffer-fills', 'fill-color', color);
        }
        if (window.map.getLayer('buffer-outlines')) {
            window.map.setPaintProperty('buffer-outlines', 'line-color', color);
        }
        
        // Update label marker colors
        if (window.bufferLabelMarkers && window.bufferLabelMarkers.length > 0) {
            window.bufferLabelMarkers.forEach(marker => {
                const labelEl = marker.getElement();
                if (labelEl) {
                    labelEl.style.background = color;
                }
            });
        }
        
        refreshBufferVisualization();
    }
    
    /**
     * Refresh buffer visualization with current mode
     */
    function refreshBufferVisualization() {
        const { currentBuffers, currentMarkers } = window.bufferAnalysisState;
        
        if (currentBuffers.length === 0) return;
        
        // Recreate buffers with current mode
        const radii = {};
        currentMarkers.forEach((marker, index) => {
            radii[marker.id] = currentBuffers[index].properties.radius;
        });
        
        createBufferAnalysisMultiple(radii, currentMarkers);
    }
    
    /**
     * Calculate and display buffer statistics
     */
    function calculateBufferStatistics() {
        const { currentBuffers } = window.bufferAnalysisState;
        
        if (currentBuffers.length === 0) return null;
        
        let totalArea = 0;
        let overlappingPairs = 0;
        let totalOverlapArea = 0;
        
        // Calculate total area
        currentBuffers.forEach(buffer => {
            totalArea += turf.area(buffer);
        });
        
        // Check for overlaps
        for (let i = 0; i < currentBuffers.length; i++) {
            for (let j = i + 1; j < currentBuffers.length; j++) {
                try {
                    const intersection = turf.intersect(currentBuffers[i], currentBuffers[j]);
                    if (intersection) {
                        overlappingPairs++;
                        totalOverlapArea += turf.area(intersection);
                    }
                } catch (error) {
                    // Ignore intersection errors
                }
            }
        }
        
        // Calculate union area
        let unionArea = 0;
        try {
            let union = currentBuffers[0];
            for (let i = 1; i < currentBuffers.length; i++) {
                union = turf.union(union, currentBuffers[i]);
            }
            unionArea = turf.area(union);
        } catch (error) {
            unionArea = totalArea;
        }
        
        return {
            bufferCount: currentBuffers.length,
            totalArea: formatArea(totalArea),
            unionArea: formatArea(unionArea),
            overlappingPairs: overlappingPairs,
            overlapArea: formatArea(totalOverlapArea),
            overlapPercentage: ((totalOverlapArea / totalArea) * 100).toFixed(1)
        };
    }
    
    /**
     * Show buffer statistics panel
     */
    function showBufferStatistics() {
        const stats = calculateBufferStatistics();
        
        if (!stats) {
            showMinimalNotification('⚠️ Önce etki alanı analizi yapmalısınız.');
            return;
        }
        
        // Calculate additional statistics
        const state = window.bufferAnalysisState;
        const buffers = state ? state.currentBuffers : [];
        
        let bufferDetails = [];
        if (buffers && buffers.length > 0) {
            bufferDetails = buffers.map((buffer, idx) => {
                const props = buffer.properties || {};
                // Radius is stored in meters, convert to km for display
                const radiusM = props.radius || 0;
                const radiusKm = radiusM / 1000;
                return {
                    name: props.name || `Buffer ${idx + 1}`,
                    radiusKm: radiusKm,
                    radiusM: radiusM,
                    area: turf.area(buffer) / 1000000,
                    perimeter: props.perimeter || 'N/A'
                };
            });
        }
        
        const radii = bufferDetails.map(b => b.radiusKm).filter(r => !isNaN(r) && r > 0);
        const avgRadius = radii.length > 0 ? (radii.reduce((a, b) => a + b, 0) / radii.length).toFixed(2) : '0';
        const minRadius = radii.length > 0 ? Math.min(...radii).toFixed(2) : '0';
        const maxRadius = radii.length > 0 ? Math.max(...radii).toFixed(2) : '0';
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'buffer-stats-overlay';
        overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: rgba(0, 0, 0, 0.5) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
            backdrop-filter: blur(2px);
            pointer-events: auto !important;
            animation: fadeIn 0.2s ease-in;
        `;
        
        // Create modal panel
        const panel = document.createElement('div');
        panel.style.cssText = `
            background: white !important;
            border-radius: 12px !important;
            padding: 0 !important;
            max-width: 700px !important;
            max-height: 85vh !important;
            width: 90% !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
            position: relative !important;
            z-index: 1000000 !important;
            overflow: hidden !important;
            animation: slideIn 0.3s ease-out;
        `;
        
        panel.innerHTML = `
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .stats-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .stats-table th {
                    background: #10b981;
                    color: white;
                    padding: 10px 8px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .stats-table td {
                    padding: 10px 8px;
                    border-bottom: 1px solid #f3f4f6;
                    color: #374151;
                }
                .stats-table tr:last-child td {
                    border-bottom: none;
                }
                .stats-table tr:hover {
                    background: #faf5ff;
                }
                .stat-card {
                    background: #f9fafb;
                    border-radius: 6px;
                    padding: 10px 12px;
                    border: 1px solid #e5e7eb;
                }
                .stat-card:hover {
                    background: #f3f4f6;
                }
                .stat-label {
                    font-size: 10px;
                    color: #6b7280;
                    margin-bottom: 4px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }
                .stat-value {
                    font-size: 18px;
                    font-weight: 600;
                    color: #10b981;
                }
                .stat-value-normal {
                    font-size: 15px;
                    font-weight: 600;
                    color: #111827;
                }
                .modal-header {
                    background: #10b981;
                    color: white;
                    padding: 16px 20px;
                    border-radius: 12px 12px 0 0;
                }
                .modal-body {
                    padding: 20px;
                    max-height: calc(85vh - 150px);
                    overflow-y: auto;
                }
                .modal-body::-webkit-scrollbar {
                    width: 8px;
                }
                .modal-body::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 4px;
                }
                .modal-body::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 4px;
                }
                .modal-body::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
                .btn-export {
                    background: #10b981;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-export:hover {
                    background: #059669;
                }
                .btn-close {
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-close:hover {
                    background: #4b5563;
                }
            </style>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <h3 style="font-size: 16px; font-weight: 600; margin: 0;">
                            Etki Analizi İstatistikleri
                        </h3>
                        <button id="close-stats-modal" style="background: none; border: none; font-size: 20px; cursor: pointer; color: white; line-height: 1; opacity: 0.8;">
                            ×
                        </button>
                    </div>
                </div>
                
                <div class="modal-body">
                    <!-- Genel İstatistikler -->
                    <div style="margin-bottom: 20px;">
                        <h4 style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                            Genel İstatistikler
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;">
                            <div class="stat-card">
                                <div class="stat-label">Etki Alanı Sayısı</div>
                                <div class="stat-value">${stats.bufferCount}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Toplam Alan</div>
                                <div class="stat-value-normal">${stats.totalArea}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Birleşik Alan</div>
                                <div class="stat-value-normal">${stats.unionArea}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Yarıçap İstatistikleri -->
                    <div style="margin-bottom: 20px;">
                        <h4 style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                            Yarıçap Analizi
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px;">
                            <div class="stat-card">
                                <div class="stat-label">Ortalama</div>
                                <div class="stat-value-normal">${avgRadius} km</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Minimum</div>
                                <div class="stat-value-normal">${minRadius} km</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Maksimum</div>
                                <div class="stat-value-normal">${maxRadius} km</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Çakışma Analizi -->
                    ${stats.overlappingPairs > 0 ? `
                        <div style="margin-bottom: 20px; padding: 12px; background: #fef3c7; border-radius: 6px; border: 1px solid #fbbf24;">
                            <h4 style="font-size: 12px; font-weight: 600; color: #92400e; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                                Çakışma Tespit Edildi
                            </h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
                                <div style="background: white; padding: 8px 10px; border-radius: 6px;">
                                    <div class="stat-label" style="color: #92400e;">Çakışan Çift</div>
                                    <div style="font-size: 16px; font-weight: 600; color: #d97706;">${stats.overlappingPairs}</div>
                                </div>
                                <div style="background: white; padding: 8px 10px; border-radius: 6px;">
                                    <div class="stat-label" style="color: #92400e;">Çakışma Oranı</div>
                                    <div style="font-size: 16px; font-weight: 600; color: #d97706;">%${stats.overlapPercentage}</div>
                                </div>
                                <div style="background: white; padding: 8px 10px; border-radius: 6px;">
                                    <div class="stat-label" style="color: #92400e;">Çakışma Alanı</div>
                                    <div style="font-size: 14px; font-weight: 600; color: #d97706;">${stats.overlapArea}</div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div style="margin-bottom: 20px; padding: 12px; background: #d1fae5; border-radius: 6px; border: 1px solid #10b981;">
                            <h4 style="font-size: 12px; font-weight: 600; color: #065f46; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                                Çakışma Yok
                            </h4>
                            <p style="font-size: 11px; color: #047857; margin: 0;">
                                Etki alanları birbirinden bağımsız.
                            </p>
                        </div>
                    `}
                    
                    <!-- Detaylı Etki Alanı Tablosu -->
                    ${bufferDetails.length > 0 ? `
                        <div style="margin-bottom: 16px;">
                            <h4 style="font-size: 12px; font-weight: 600; color: #6b7280; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                                Etki Alanı Detayları
                            </h4>
                            <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb;">
                                <table class="stats-table">
                                    <thead>
                                        <tr>
                                            <th>İsim</th>
                                            <th>Yarıçap</th>
                                            <th>Alan</th>
                                            <th>Çevre</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${bufferDetails.map(b => `
                                            <tr>
                                                <td style="font-weight: 600; color: #10b981;">${b.name}</td>
                                                <td>${b.radiusKm.toFixed(2)} km</td>
                                                <td>${b.area.toFixed(2)} km²</td>
                                                <td>${b.perimeter}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="padding: 12px 20px; border-top: 1px solid #e5e7eb; background: white; display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="export-stats-btn" class="btn-export">
                        CSV İndir
                    </button>
                    <button id="close-stats-btn" class="btn-close">
                        Kapat
                    </button>
                </div>
            </div>
        `;
        
        overlay.appendChild(panel);
        
        try {
            document.body.appendChild(overlay);
safeLogSA('✅ Modal DOM\'a eklendi');
        } catch (error) {
safeErrorSA('❌ Modal eklenirken hata:', error);
            return;
        }
        
        // Close handlers
        const closeModal = () => {
            try {
                if (overlay.parentNode) {
                    document.body.removeChild(overlay);
safeLogSA('✅ Modal kapatıldı');
                }
            } catch (error) {
safeErrorSA('❌ Modal kapatılırken hata:', error);
            }
        };
        
        // Export to CSV function
        const exportToCSV = () => {
            try {
                // CSV Header
                let csv = 'Etki Analizi İstatistikleri\n\n';
                
                // Genel İstatistikler
                csv += 'Genel İstatistikler\n';
                csv += 'Etki Alanı Sayısı,' + stats.bufferCount + '\n';
                csv += 'Toplam Alan,' + stats.totalArea + '\n';
                csv += 'Birleşik Alan,' + stats.unionArea + '\n\n';
                
                // Yarıçap İstatistikleri
                csv += 'Yarıçap Analizi\n';
                csv += 'Ortalama Yarıçap,' + avgRadius + ' km\n';
                csv += 'Minimum Yarıçap,' + minRadius + ' km\n';
                csv += 'Maksimum Yarıçap,' + maxRadius + ' km\n\n';
                
                // Çakışma İstatistikleri
                csv += 'Çakışma Analizi\n';
                csv += 'Çakışan Çift Sayısı,' + stats.overlappingPairs + '\n';
                csv += 'Çakışma Oranı,%' + stats.overlapPercentage + '\n';
                if (stats.overlappingPairs > 0) {
                    csv += 'Çakışma Alanı,' + stats.overlapArea + '\n';
                }
                csv += '\n';
                
                // Etki Alanı Detayları
                if (bufferDetails.length > 0) {
                    csv += 'Etki Alanı Detayları\n';
                    csv += 'İsim,Yarıçap (km),Alan (km²),Çevre\n';
                    bufferDetails.forEach(b => {
                        csv += `${b.name},${b.radiusKm.toFixed(2)},${b.area.toFixed(2)},${b.perimeter}\n`;
                    });
                }
                
                // Download
                const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                const now = new Date();
                const filename = `etki_analizi_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}-${now.getMinutes().toString().padStart(2,'0')}.csv`;
                
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                showMinimalNotification('❌ CSV dosyası oluşturulurken hata oluştu.');
            }
        };
        
        // Use setTimeout to prevent immediate closing
        setTimeout(() => {
            const closeBtn1 = document.getElementById('close-stats-modal');
            const closeBtn2 = document.getElementById('close-stats-btn');
            const exportBtn = document.getElementById('export-stats-btn');
            
            if (closeBtn1) {
                closeBtn1.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeModal();
                });
            }
            if (closeBtn2) {
                closeBtn2.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeModal();
                });
            }
            if (exportBtn) {
                exportBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    exportToCSV();
                });
            }
            
            // Prevent panel clicks from closing
            panel.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeModal();
                }
            });
            
safeLogSA('✅ Modal event listeners eklendi');
        }, 100);
        
safeLogSA('✅ Modal gösteriliyor');
    }
    
    // ==========================================
    // EXPORT PUBLIC API
    // ==========================================

    window.spatialAnalysis = {
        toggleClustering,
        toggleHeatmap,
        bufferAnalysis,
        createBufferAnalysisMultiple,
        buildConvexHull,
        buildVoronoi,
        nearestFacility,
        // Buffer mode functions
        setBufferMode,
        refreshBufferVisualization,
        calculateBufferStatistics,
        showBufferStatistics
    };

})();

/**
 * SpatialAnalysis - DI-enabled wrapper class
 *
 * Provides dependency injection support for the spatial analysis system.
 * Wraps the existing spatialAnalysis IIFE functions with DI capabilities.
 *
 * @example
 * // New DI style:
 * const analysis = new SpatialAnalysis({
 *     map: mapInstance,
 *     stateManager: stateManager,
 *     eventBus: eventBus
 * });
 *
 * // Old style (still works):
 * window.spatialAnalysis.toggleClustering();
 */
class SpatialAnalysis {
    /**
     * Create a new SpatialAnalysis instance with DI support
     * @param {Object} mapOrDeps - Either a map instance (old style) or dependencies object (new DI style)
     */
    constructor(mapOrDeps) {
        // Constructor overloading for backward compatibility
        if (mapOrDeps && typeof mapOrDeps === 'object' && mapOrDeps.map) {
            // New DI style
            this.map = mapOrDeps.map;
            this.state = mapOrDeps.stateManager || null;
            this.events = mapOrDeps.eventBus || null;
            this.config = mapOrDeps.config || null;
            this._useDI = true;
        } else {
            // Old style (backward compatible)
            this.map = mapOrDeps || window.map;
            this.state = null;
            this.events = null;
            this.config = null;
            this._useDI = false;
        }

        // Store reference to the global spatialAnalysis API
        this._api = window.spatialAnalysis;

        // Initialize state if using DI
        if (this._useDI) {
            this._initializeStateWithDI();
        }

safeLogSA(`✅ SpatialAnalysis initialized (DI mode: ${this._useDI})`);
    }

    /**
     * Initialize state in StateManager (DI mode only)
     * @private
     */
    _initializeStateWithDI() {
        if (!this.state) return;

        // Initialize analysis state paths
        if (!this.state.has('analysis.clusteringEnabled')) {
            this.state.set('analysis.clusteringEnabled', false);
        }
        if (!this.state.has('analysis.heatmapEnabled')) {
            this.state.set('analysis.heatmapEnabled', false);
        }
        if (!this.state.has('analysis.bufferActive')) {
            this.state.set('analysis.bufferActive', false);
        }
        if (!this.state.has('analysis.lastBufferRadius')) {
            this.state.set('analysis.lastBufferRadius', 500);
        }
        if (!this.state.has('analysis.states')) {
            this.state.set('analysis.states', {
                convex: false,
                voronoi: false,
                nearest: false
            });
        }
        if (!this.state.has('analysis.bufferAnalysisState')) {
            this.state.set('analysis.bufferAnalysisState', {
                mode: 'normal',
                showOverlaps: false,
                showStats: false,
                currentBuffers: [],
                currentMarkers: []
            });
        }

        // Sync window globals with state (bidirectional)
        this._syncStateWithGlobals();
    }

    /**
     * Sync state with window globals
     * @private
     */
    _syncStateWithGlobals() {
        if (!this.state) return;

        // Watch for state changes and sync to globals
        this.state.subscribe('analysis.clusteringEnabled', (value) => {
            window.clusteringEnabled = value;
        });
        this.state.subscribe('analysis.heatmapEnabled', (value) => {
            window.heatmapEnabled = value;
        });
        this.state.subscribe('analysis.bufferActive', (value) => {
            window.bufferActive = value;
        });
        this.state.subscribe('analysis.lastBufferRadius', (value) => {
            window.lastBufferRadius = value;
        });
    }

    /**
     * Emit event (DI mode only)
     * @private
     */
    _emitEvent(eventName, data) {
        if (this._useDI && this.events) {
            this.events.emitSync(eventName, data);
        }
    }

    /**
     * Update state (DI mode only)
     * @private
     */
    _updateState(path, value) {
        if (this._useDI && this.state) {
            this.state.set(path, value);
        }
    }

    // ==========================================
    // PUBLIC API - Delegates to window.spatialAnalysis
    // ==========================================

    /**
     * Toggle clustering
     */
    toggleClustering() {
        this._api.toggleClustering();

        if (this._useDI) {
            const enabled = window.clusteringEnabled;
            this._updateState('analysis.clusteringEnabled', enabled);
            this._emitEvent(enabled ? 'analysis:clustering:enabled' : 'analysis:clustering:disabled', {
                enabled
            });
        }
    }

    /**
     * Toggle heatmap
     */
    toggleHeatmap() {
        this._api.toggleHeatmap();

        if (this._useDI) {
            const enabled = window.heatmapEnabled;
            this._updateState('analysis.heatmapEnabled', enabled);
            this._emitEvent(enabled ? 'analysis:heatmap:enabled' : 'analysis:heatmap:disabled', {
                enabled
            });
        }
    }

    /**
     * Buffer analysis
     */
    bufferAnalysis() {
        this._api.bufferAnalysis();

        if (this._useDI) {
            this._updateState('analysis.bufferActive', window.bufferActive);
            this._updateState('analysis.lastBufferRadius', window.lastBufferRadius);
            this._emitEvent('analysis:buffer:created', {
                radius: window.lastBufferRadius,
                count: window.userMarkers ? window.userMarkers.length : 0
            });
        }
    }

    /**
     * Create buffer analysis with multiple radii
     * @param {Object} radii - Radii for each marker
     * @param {Array} markers - Marker data
     */
    createBufferAnalysisMultiple(radii, markers) {
        this._api.createBufferAnalysisMultiple(radii, markers);

        if (this._useDI) {
            this._updateState('analysis.bufferActive', window.bufferActive);
            this._updateState('analysis.bufferAnalysisState', window.bufferAnalysisState);
            this._emitEvent('analysis:buffer:created', {
                radii,
                count: markers.length
            });
        }
    }

    /**
     * Build convex hull
     */
    buildConvexHull() {
        this._api.buildConvexHull();

        if (this._useDI) {
            this._updateState('analysis.states', window.analysisStates);
            this._emitEvent(window.analysisStates.convex ? 'analysis:convexhull:created' : 'analysis:convexhull:cleared', {
                active: window.analysisStates.convex
            });
        }
    }

    /**
     * Build voronoi diagram
     */
    buildVoronoi() {
        this._api.buildVoronoi();

        if (this._useDI) {
            this._updateState('analysis.states', window.analysisStates);
            this._emitEvent(window.analysisStates.voronoi ? 'analysis:voronoi:created' : 'analysis:voronoi:cleared', {
                active: window.analysisStates.voronoi
            });
        }
    }

    /**
     * Nearest facility analysis
     */
    nearestFacility() {
        this._api.nearestFacility();

        if (this._useDI) {
            this._updateState('analysis.states', window.analysisStates);
            this._emitEvent(window.analysisStates.nearest ? 'analysis:nearest:found' : 'analysis:nearest:cleared', {
                active: window.analysisStates.nearest
            });
        }
    }

    /**
     * Set buffer mode
     * @param {string} mode - Buffer mode
     */
    setBufferMode(mode) {
        this._api.setBufferMode(mode);

        if (this._useDI) {
            this._updateState('analysis.bufferAnalysisState', window.bufferAnalysisState);
            this._emitEvent('analysis:buffer:modeChanged', { mode });
        }
    }

    /**
     * Refresh buffer visualization
     */
    refreshBufferVisualization() {
        this._api.refreshBufferVisualization();
    }

    /**
     * Calculate buffer statistics
     * @returns {Object} Statistics
     */
    calculateBufferStatistics() {
        return this._api.calculateBufferStatistics();
    }

    /**
     * Show buffer statistics
     */
    showBufferStatistics() {
        this._api.showBufferStatistics();
    }
}

// Make the class globally available
if (typeof window !== 'undefined') {
    window.SpatialAnalysis = SpatialAnalysis;
}
