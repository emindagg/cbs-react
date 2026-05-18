/**
 * MapMarkers - Marker yönetimi
 */

export class MapMarkers {
    constructor(map) {
        this.map = map;
        this.markers = [];
        this.currentClickHandler = null;
    }

    // Marker ekle
    addMarker(coords, options = {}) {
        if (!this.map) return null;

        const el = document.createElement('div');
        el.className = 'map-marker';
        
        const isTeardrop = options.shape === 'teardrop';
        const isNumber = options.isNumber || false;
        
        if (isTeardrop) {
            // Damla şekli (%35 büyütülmüş, beyaz border)
            el.style.width = '27px';
            el.style.height = '36px';
            el.style.backgroundColor = options.color || '#10b981';
            el.style.borderRadius = '50% 50% 50% 0';
            el.style.transform = 'rotate(-45deg)';
            el.style.border = '2px solid #fff';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';

            // İkon ekle
            const icon = document.createElement('i');
            icon.className = `fa-solid ${options.icon || 'fa-location-dot'}`;
            icon.style.color = 'white';
            icon.style.fontSize = '11px';
            icon.style.transform = 'rotate(45deg)'; // Damla döndürüldüğü için ikonu düzelt
            el.appendChild(icon);
        } else if (isNumber) {
            // Sayı şekli (%35 büyütülmüş, beyaz border)
            el.style.width = '27px';
            el.style.height = '27px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = options.color || '#3b82f6';
            el.style.border = '2px solid #fff';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';

            // Sayı ekle
            const numberSpan = document.createElement('span');
            numberSpan.className = 'marker-number';
            numberSpan.textContent = options.number || '1';
            numberSpan.style.color = 'white';
            numberSpan.style.fontSize = '12px';
            numberSpan.style.fontWeight = 'bold';
            numberSpan.style.fontFamily = 'Arial, sans-serif';
            el.appendChild(numberSpan);
        } else {
            // Yuvarlak şekil (%35 büyütülmüş, beyaz border)
            el.style.width = '26px';
            el.style.height = '26px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = options.color || '#3b82f6';
            el.style.border = '2px solid #fff';
            el.style.cursor = 'pointer';
            el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';

            // İkon ekle
            const icon = document.createElement('i');
            icon.className = `fa-solid ${options.icon || 'fa-map-marker-alt'}`;
            icon.style.color = 'white';
            icon.style.fontSize = '10px';
            el.appendChild(icon);
        }

        const marker = new maplibregl.Marker({ element: el })
            .setLngLat(coords)
            .addTo(this.map);

        // Popup ekle
        if (options.popup) {
            const popup = new maplibregl.Popup({ offset: 25 })
                .setHTML(`<div style="padding: 5px; font-size: 14px;">${options.popup}</div>`);
            marker.setPopup(popup);
        }

        // Options'ı marker nesnesine ekle (daha sonra kullanmak için)
        marker._options = options;
        
        this.markers.push(marker);
        return marker;
    }

    // Metin marker ekle
    addTextMarker(coords, text, options = {}) {
        if (!this.map) return null;

        const styleId        = options.textStyle      || 'boxed';
        const placement      = options.textPlacement  || 'right';
        const leaderLineStyle= options.leaderLineStyle|| 'solid';
        const showLeaderLine = options.leaderLine === true;
        const textValue      = (text || options.text  || '').trim() || 'Metin';
        const leaderColor    = options.leaderColor    || '#0f766e';
        const anchorColor    = options.anchorColor    || '#0f766e';

        const styleMap = {
            plain: { background: 'transparent', borderColor: 'transparent', textColor: '#111827', shadow: 'none' },
            boxed: { background: '#ffffff',      borderColor: '#d1d5db',     textColor: '#111827', shadow: '0 4px 12px rgba(17,24,39,.12)' },
            dark:  { background: '#0f172a',      borderColor: '#0f172a',     textColor: '#f8fafc', shadow: '0 4px 12px rgba(15,23,42,.25)' },
            halo:  { background: 'transparent', borderColor: 'transparent', textColor: '#ffffff', shadow: 'none' },
            glass: { background: 'rgba(255, 255, 255, 0.45)', borderColor: 'rgba(255, 255, 255, 0.65)', textColor: '#1e293b', shadow: '0 8px 32px rgba(15, 23, 42, 0.08)' }
        };
        const style = styleMap[styleId] || styleMap.boxed;

        const dashMap = { solid: 'none', dashed: '8,5', dotted: '2,5' };
        const svgDash = dashMap[leaderLineStyle] || 'none';

        // --- Kapsayıcı ---
        const el = document.createElement('div');
        el.className = `map-text-marker map-text-marker--${styleId}`;
        el.style.cssText = `
            position: relative;
            width: 0;
            height: 0;
            overflow: visible;
            pointer-events: none;
            user-select: none;
        `;

        // Sabit koordinat referansı (container'ın 0,0 noktası = harita koordinatı)
        const AX = 0, AY = 0; // anchor SVG koordinatları

        // --- SVG Leader Line ---
        let svgEl = null, svgLine = null, linearGrad = null;
        if (showLeaderLine) {
            svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgEl.style.cssText = `
                position: absolute;
                top: 0; left: 0;
                width: 1px; height: 1px;
                overflow: visible;
                pointer-events: none;
                z-index: 1;
            `;
            svgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            svgLine.setAttribute('stroke-width', '1.5');
            svgLine.setAttribute('stroke-linecap', 'round');
            svgLine.style.filter = 'drop-shadow(0 1px 1.5px rgba(15, 23, 42, 0.18))';

            if (leaderLineStyle === 'gradient') {
                const gradId = `grad-${Math.random().toString(36).substr(2, 9)}`;
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                linearGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                linearGrad.setAttribute('id', gradId);
                linearGrad.setAttribute('gradientUnits', 'userSpaceOnUse');

                const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop1.setAttribute('offset', '0%');
                stop1.setAttribute('stop-color', leaderColor);
                stop1.setAttribute('stop-opacity', '1');

                const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop2.setAttribute('offset', '100%');
                stop2.setAttribute('stop-color', leaderColor);
                stop2.setAttribute('stop-opacity', '0.15');

                linearGrad.appendChild(stop1);
                linearGrad.appendChild(stop2);
                defs.appendChild(linearGrad);
                svgEl.appendChild(defs);

                svgLine.setAttribute('stroke', `url(#${gradId})`);
            } else {
                svgLine.setAttribute('stroke', leaderColor);
            }

            if (svgDash !== 'none') svgLine.setAttribute('stroke-dasharray', svgDash);
            svgEl.appendChild(svgLine);
            el.appendChild(svgEl);
        }

        // --- Anchor Dot ---
        const anchorDot = document.createElement('div');
        anchorDot.style.cssText = `
            position: absolute;
            left: 0; top: 0;
            width: 12px; height: 12px;
            transform: translate(-50%,-50%);
            border-radius: 50%;
            background: ${anchorColor};
            border: 2px solid #ffffff;
            box-shadow: 0 1px 4px rgba(15,23,42,.35);
            z-index: 2;
            pointer-events: none;
            display: ${showLeaderLine ? 'block' : 'none'};
        `;
        el.appendChild(anchorDot);

        // --- Label ---
        const label = document.createElement('div');
        label.className = 'map-text-marker__label';
        label.textContent = textValue;
        label.style.cssText = `
            position: absolute;
            width: max-content;
            max-width: 200px;
            padding: 10px 14px;
            box-sizing: border-box;
            border-radius: 4px;
            background: ${style.background};
            border: 1px solid ${style.borderColor};
            color: ${style.textColor};
            box-shadow: ${style.shadow};
            font-size: 12px;
            line-height: 1.45;
            font-weight: 600;
            white-space: pre-wrap;
            word-break: break-word;
            text-align: center;
            backdrop-filter: ${styleId === 'glass' ? 'blur(12px)' : 'none'};
            -webkit-backdrop-filter: ${styleId === 'glass' ? 'blur(12px)' : 'none'};
            cursor: ${showLeaderLine ? 'grab' : 'default'};
            pointer-events: auto;
            z-index: 3;
            transform: translate(-50%, -50%);
            ${styleId === 'halo' ? `
                -webkit-text-stroke: 3px #000000;
                paint-order: stroke fill;
                color: #ffffff;
                font-weight: 500;
            ` : ''}
        `;

        // Label başlangıç ofseti (kayıtlıysa restore, değilse placement'tan hesapla)
        let lx = options.labelOffsetX !== undefined ? options.labelOffsetX : null;
        let ly = options.labelOffsetY !== undefined ? options.labelOffsetY : null;

        if (lx === null || ly === null) {
            if (!showLeaderLine) {
                lx = 0; ly = 0;
            } else {
                const dist = 90;
                if      (placement === 'right')  { lx = dist;  ly = 0;    }
                else if (placement === 'left')   { lx = -dist; ly = 0;    }
                else if (placement === 'top')    { lx = 0;     ly = -dist;}
                else                             { lx = 0;     ly = dist; }
            }
        }

        label.style.left = `${lx}px`;
        label.style.top  = `${ly}px`;
        el.appendChild(label);

        // SVG line'ı güncelle
        function updateSvgLine() {
            if (!svgLine) return;
            const lRect  = label.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            // label merkezi, el origin'e göre
            const cx = (lRect.left + lRect.width  / 2) - elRect.left;
            const cy = (lRect.top  + lRect.height / 2) - elRect.top;

            let x2 = cx;
            let y2 = cy;

            // Çizgiyi kutunun dış sınırında kesme (özellikle Düz/transparan etiketlerde okunurluk için)
            const margin = -8;
            const w = lRect.width + (margin * 2);
            const h = lRect.height + (margin * 2);
            const absCx = Math.abs(cx);
            const absCy = Math.abs(cy);

            if (absCx > 0.01 || absCy > 0.01) {
                const tx = absCx > 0 ? (w / 2) / absCx : Infinity;
                const ty = absCy > 0 ? (h / 2) / absCy : Infinity;
                const t = Math.min(tx, ty);

                if (t < 1) {
                    x2 = cx - t * cx;
                    y2 = cy - t * cy;
                } else {
                    // Eğer anchor nokta kutunun içindeyse çizgi görünmesin (0 uzunlukta çiz)
                    x2 = AX;
                    y2 = AY;
                }
            }

            svgLine.setAttribute('x1', AX);
            svgLine.setAttribute('y1', AY);
            svgLine.setAttribute('x2', x2);
            svgLine.setAttribute('y2', y2);

            // Eğer gradient kullanılıyorsa gradient doğrultusunu çizgiye göre güncelle
            if (linearGrad) {
                linearGrad.setAttribute('x1', '0');
                linearGrad.setAttribute('y1', '0');
                linearGrad.setAttribute('x2', x2.toString());
                linearGrad.setAttribute('y2', y2.toString());
            }
        }

        requestAnimationFrame(updateSvgLine);

        // --- Sürükleme ---
        if (showLeaderLine) {
            let dragging = false;
            let startPx, startPy, startLx, startLy;

            label.addEventListener('pointerdown', (e) => {
                dragging = true;
                startPx  = e.clientX;
                startPy  = e.clientY;
                startLx  = lx;
                startLy  = ly;
                label.style.cursor = 'grabbing';
                label.setPointerCapture(e.pointerId);
                e.stopPropagation();
                // MapLibre mouse eventleri kullandığından dragPan kapatılmalı
                if (this.map) {
                    this.map.dragPan.disable();
                    this.map.scrollZoom.disable();
                }
            });

            label.addEventListener('pointermove', (e) => {
                if (!dragging) return;
                lx = startLx + (e.clientX - startPx);
                ly = startLy + (e.clientY - startPy);
                label.style.left = `${lx}px`;
                label.style.top  = `${ly}px`;
                updateSvgLine();
                e.stopPropagation();
            });

            const onPointerUp = (e) => {
                if (!dragging) return;
                dragging = false;
                label.style.cursor = 'grab';

                // Harita kontrollerini geri aç
                if (this.map) {
                    this.map.dragPan.enable();
                    this.map.scrollZoom.enable();
                }

                // Ofseti marker._options'a kaydet (updateTextMarker restore edebilsin)
                if (marker) {
                    marker._options.labelOffsetX = lx;
                    marker._options.labelOffsetY = ly;
                }
                e.stopPropagation();

                // pointerup'tan sonra browser bir click olayı tetikler.
                // Bu click, label üzerindeki showPointDetail listener'ını çalıştırıp
                // metni sıfırlar. Bir kereliğine capture phase'de yakalayıp yutuyoruz.
                const absorbClick = (ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    label.removeEventListener('click', absorbClick, true);
                };
                label.addEventListener('click', absorbClick, true);
            };
            label.addEventListener('pointerup',     onPointerUp);
            label.addEventListener('pointercancel', onPointerUp);
        }

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat(coords)
            .addTo(this.map);

        marker._options = {
            ...options,
            text: textValue, textStyle: styleId, textPlacement: placement,
            leaderLine: showLeaderLine, leaderLineStyle,
            labelOffsetX: lx, labelOffsetY: ly
        };
        this.markers.push(marker);
        return marker;
    }

    // Marker ekleme modunu aktif et
    enableMarkerMode(callback, onFinish) {
        this.disableMode();
        
        if (!this.map) return;

        const clickHandler = (e) => {
            const coords = [e.lngLat.lng, e.lngLat.lat];
            const marker = this.addMarker(coords, {
                color: '#ef4444',
                popup: 'Yeni Nokta'
            });
            
            // Tek nokta eklendikten sonra modu kapat
            this.disableMode();
            if (onFinish) onFinish();
            
            if (callback) {
                callback({
                    type: 'marker',
                    coords: coords,
                    marker: marker
                });
            }
        };

        this.map.on('click', clickHandler);
        this.map.getCanvas().style.cursor = 'crosshair';
        this.currentClickHandler = clickHandler;
    }

    // Modu devre dışı bırak
    disableMode() {
        if (this.map && this.currentClickHandler) {
            this.map.off('click', this.currentClickHandler);
            this.map.getCanvas().style.cursor = '';
            this.currentClickHandler = null;
        }
    }

    // Tüm markerları temizle
    clearMarkers() {
        this.markers.forEach(m => m.remove());
        this.markers = [];
    }

    // Belirli bir markerı sil
    removeMarker(marker) {
        if (!marker) return;
        marker.remove();
        this.markers = this.markers.filter(m => m !== marker);
    }

    // Marker listesini güncelle (örn: basemap değişiminden sonra)
    setMarkers(newMarkers) {
        this.markers = newMarkers;
    }

    getMarkers() {
        return this.markers;
    }
}
