/**
 * PointManager - Nokta ve çizim yönetimi
 */

import { MARKER_STYLES, DRAWING_TYPE_NAMES, DRAWING_TYPE_ICONS } from '../constants/index.js';

export class PointManager {
    constructor(sidebarComponent) {
        this.sidebar = sidebarComponent;
        this.points = [];
    }

    /**
     * Nokta ekler
     * @param {Object} pointData - Nokta verileri
     * @returns {Object} Eklenen nokta
     */
    addPoint(pointData) {
        // Benzersiz ID garantisi için timestamp + random
        const uniqueId = pointData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const point = {
            id: uniqueId,
            title: pointData.title || `Nokta ${this.points.length + 1}`,
            description: pointData.description || '',
            coords: pointData.coords,
            color: pointData.color || '#ef4444',
            icon: pointData.icon || 'fa-map-marker-alt',
            style: pointData.style || 'default',
            shape: pointData.shape || 'circle',
            marker: pointData.marker,
            isNumber: pointData.isNumber || false,
            number: pointData.number || null,
            zoom: pointData.zoom,
            media: pointData.media || [],
            // Rota alanları (varsa koru)
            visitDay: pointData.visitDay,
            duration: pointData.duration,
            timestamp: pointData.timestamp,
            // Timeline alanları (içeri aktarma ve timeline şablonu için kritik)
            date: pointData.date,
            time: pointData.time,
            category: pointData.category,
            importance: pointData.importance,
            era: pointData.era,
            historicalContext: pointData.historicalContext,
            // Çizim öğesi alanları (import için kritik)
            isDrawing: pointData.isDrawing,
            drawingType: pointData.drawingType,
            mapLayerId: pointData.mapLayerId,
            radius: pointData.radius,
            text: pointData.text,
            textStyle: pointData.textStyle || 'boxed',
            textPlacement: pointData.textPlacement || 'left',
            leaderLine: pointData.leaderLine !== undefined ? pointData.leaderLine : false,
            leaderLineStyle: pointData.leaderLineStyle || 'gradient',
            labelOffsetX: pointData.labelOffsetX !== undefined ? pointData.labelOffsetX : null,
            labelOffsetY: pointData.labelOffsetY !== undefined ? pointData.labelOffsetY : null
        };
        
        console.log('[PointManager] addPoint:', {
            id: point.id,
            title: point.title,
            totalPoints: this.points.length + 1
        });
        
        this.points.push(point);
        
        // Undo için kaydet
        if (this.sidebar.onActionAdd) {
            this.sidebar.onActionAdd({
                type: 'add_point',
                data: { ...point }
            });
        }
        
        return point;
    }

    /**
     * Çizim ekler
     * @param {Object} drawingData - Çizim verileri
     * @returns {Object} Eklenen çizim
     */
    addDrawing(drawingData) {
        const drawing = {
            id: drawingData.id || Date.now(),
            type: drawingData.type,
            title: drawingData.title || `${DRAWING_TYPE_NAMES[drawingData.type] || 'Çizim'} ${this.points.length + 1}`,
            description: drawingData.description || '',
            coords: drawingData.coords,
            center: drawingData.center || null, // Daire merkezi
            color: drawingData.color || '#3b82f6',
            icon: DRAWING_TYPE_ICONS[drawingData.type] || 'fa-shapes',
            isDrawing: true,
            drawingType: drawingData.type,
            mapLayerId: drawingData.data?.id || null,
            marker: drawingData.marker || null, // Text marker referansı
            text: drawingData.text || '',
            textStyle: drawingData.textStyle || 'boxed',
            textPlacement: drawingData.textPlacement || 'left',
            leaderLine: drawingData.leaderLine !== undefined ? drawingData.leaderLine : false,
            leaderLineStyle: drawingData.leaderLineStyle || 'gradient',
            labelOffsetX: drawingData.labelOffsetX !== undefined ? drawingData.labelOffsetX : null,
            labelOffsetY: drawingData.labelOffsetY !== undefined ? drawingData.labelOffsetY : null,
            radius: drawingData.radius || 0,
            zoom: drawingData.zoom,
            bounds: drawingData.bounds || null
        };
        
        this.points.push(drawing);
        
        // Undo için kaydet
        if (this.sidebar.onActionAdd) {
            this.sidebar.onActionAdd({
                type: 'add_drawing',
                data: { ...drawing }
            });
        }
        
        return drawing;
    }

    /**
     * Nokta siler
     * @param {string|number} pointId - Nokta ID
     */
    removePoint(pointId) {
        const index = this.findPointIndex(pointId);
        if (index > -1) {
            this.points.splice(index, 1);
        }
    }

    /**
     * Nokta bulur
     * @param {string|number} pointId - Nokta ID
     * @returns {Object|undefined} Bulunan nokta
     */
    findPoint(pointId) {
        // Undefined veya null kontrolü
        if (pointId === undefined || pointId === null) {
            console.warn('[PointManager] findPoint: pointId is undefined or null');
            return undefined;
        }
        return this.points.find(p => p.id == pointId);
    }

    /**
     * Nokta indeksini bulur
     * @param {string|number} pointId - Nokta ID
     * @returns {number} Nokta indeksi
     */
    findPointIndex(pointId) {
        // Undefined veya null kontrolü
        if (pointId === undefined || pointId === null) {
            console.warn('[PointManager] findPointIndex: pointId is undefined or null');
            return -1;
        }
        return this.points.findIndex(p => p.id == pointId);
    }

    /**
     * Noktayı günceller
     * @param {string|number} pointId - Nokta ID
     * @param {Object} updates - Güncellemeler
     */
    updatePoint(pointId, updates) {
        const index = this.findPointIndex(pointId);
        if (index > -1) {
            this.points[index] = { ...this.points[index], ...updates };
        }
    }

    /**
     * Sonraki numarayı alır (numaralı marker'lar için)
     * @returns {number} Sonraki numara
     */
    getNextNumber() {
        const numberPoints = this.points.filter(p => 
            (p.isNumber === true || p.style === 'number') && p.number
        );
        if (numberPoints.length === 0) return 1;
        const maxNumber = Math.max(...numberPoints.map(p => parseInt(p.number) || 0));
        return maxNumber + 1;
    }

    /**
     * Stil seçimi yapar
     * @param {Object} point - Düzenlenen nokta
     * @param {string} styleId - Stil ID
     * @returns {Object} Güncellenmiş nokta
     */
    applyStyle(point, styleId) {
        const style = MARKER_STYLES.find(s => s.id === styleId);
        if (!style) return point;

        point.style = styleId;
        point.color = style.color;
        point.icon = style.icon;
        point.shape = style.shape || 'circle';
        point.isNumber = style.isNumber || false;

        if (style.isNumber && !point.number) {
            point.number = this.getNextNumber();
        }

        return point;
    }

    /**
     * Tüm noktaları temizler
     */
    clear() {
        this.points = [];
    }

    /**
     * Nokta sayısını döndürür
     * @returns {number} Nokta sayısı
     */
    get count() {
        return this.points.length;
    }
}
