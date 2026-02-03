/**
 * UI State Manager
 * Manages button styling and selection states for analysis tools
 */

(function() {
    'use strict';

    // ==========================================
    // BUTTON SELECTION STYLING
    // ==========================================
    
    /**
     * Apply or remove selected styling to a button element
     * @param {HTMLElement} element - The button element
     * @param {Object} options - Styling options
     * @param {string} options.bg - Background color class
     * @param {string} options.ring - Ring color class
     * @param {string} options.border - Border classes (space-separated)
     * @param {boolean} options.isSelected - Whether button is selected
     */
    function setSelectedStyles(element, options) {
        if (!element) return;
        const { bg, ring, border } = options;
        const isSelected = options.isSelected;
        element.classList.toggle('ring-1', isSelected);
        if (bg) element.classList.toggle(bg, isSelected);
        if (ring) element.classList.toggle(ring, isSelected);
        // Border için boşluklarla ayrılmış class'ları tek tek toggle et
        if (border) {
            border.split(' ').forEach(cls => {
                if (cls.trim()) element.classList.toggle(cls, isSelected);
            });
        }
    }

    /**
     * Update measurement tool button selection states
     */
    function updateMeasurementSelection() {
        const distanceBtn = document.getElementById('measure-distance');
        const areaBtn = document.getElementById('measure-area');
        
        // Mesafe ölçümü için yeni sistem (distanceMeasurementTool) kullan
        const isDistanceActive = window.distanceMeasurementTool ? window.distanceMeasurementTool.isActive : false;
        // Alan ölçümü için yeni sistem (areaMeasurementTool) kullan
        const isAreaActive = window.areaMeasurementTool ? window.areaMeasurementTool.isActive : false;
        
        setSelectedStyles(distanceBtn, { 
            bg: 'bg-blue-100', 
            ring: 'ring-blue-300', 
            border: 'border-l-4 border-blue-500', 
            isSelected: isDistanceActive 
        });
        setSelectedStyles(areaBtn, { 
            bg: 'bg-green-100', 
            ring: 'ring-green-300', 
            border: 'border-l-4 border-green-500', 
            isSelected: isAreaActive 
        });
    }

    /**
     * Update cluster button selection state
     */
    function updateClusterButtonSelection() {
        const clusterBtn = document.getElementById('toggle-cluster');
        const clusterGroup = window.clusterGroup;
        
        setSelectedStyles(clusterBtn, { 
            bg: 'bg-gray-100', 
            ring: 'ring-gray-300', 
            border: 'border-l-4 border-gray-400', 
            isSelected: window.map && clusterGroup && window.map.hasLayer(clusterGroup) 
        });
    }

    /**
     * Update heatmap button selection state
     */
    function updateHeatButtonSelection() {
        const heatBtn = document.getElementById('toggle-heatmap');
        const heatLayer = window.heatLayer;
        
        setSelectedStyles(heatBtn, { 
            bg: 'bg-red-100', 
            ring: 'ring-red-300', 
            border: 'border-l-4 border-red-500', 
            isSelected: !!heatLayer 
        });
    }

    /**
     * Update analysis tool button selection states (convex hull, voronoi, nearest facility)
     */
    function updateAnalysisButtonSelection() {
        const convexBtn = document.getElementById('build-convex');
        const voronoiBtn = document.getElementById('build-voronoi');
        const nearestBtn = document.getElementById('nearest-facility');
        const analysisStates = window.analysisStates || {};
        
        setSelectedStyles(convexBtn, { 
            bg: 'bg-orange-100', 
            ring: 'ring-orange-300', 
            border: 'border-l-4 border-orange-500', 
            isSelected: analysisStates.convex 
        });
        setSelectedStyles(voronoiBtn, { 
            bg: 'bg-teal-100', 
            ring: 'ring-teal-300', 
            border: 'border-l-4 border-teal-500', 
            isSelected: analysisStates.voronoi 
        });
        setSelectedStyles(nearestBtn, { 
            bg: 'bg-pink-100', 
            ring: 'ring-pink-300', 
            border: 'border-l-4 border-pink-500', 
            isSelected: analysisStates.nearest 
        });
    }

    // ==========================================
    // EXPORT TO WINDOW
    // ==========================================
    
    window.uiStateManager = {
        setSelectedStyles,
        updateMeasurementSelection,
        updateClusterButtonSelection,
        updateHeatButtonSelection,
        updateAnalysisButtonSelection
    };

    // Browser global export (export as UIStateManager for tests)
    window.UIStateManager = window.uiStateManager;

})();
