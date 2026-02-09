/**
 * Data List Manager
 * Manages the sidebar data list UI and data removal functionality
 * Part of the modularized initialization system
 */

/**
 * Update the data list in the sidebar
 * Shows all markers with click-to-locate and double-click-to-change-color
 * Handles large datasets (>1000 items) with simplified view
 */
function updateDataList() {
    const dataListDiv = document.getElementById('data-list');
    if (!dataListDiv) return;

    // Empty state
    if (window.userMarkers.length === 0) {
        dataListDiv.innerHTML = `
            <div class="flex items-center justify-center py-8 text-gray-400">
                <div class="text-center">
                    <i class="fa-solid fa-database text-2xl mb-2 opacity-50"></i>
                    <p class="text-sm">Henüz veri eklenmedi</p>
                    <p class="text-xs mt-1">Haritaya tıklayarak veri eklemeye başlayın</p>
                </div>
            </div>
        `;
        return;
    }

    // 🚀 PERFORMANCE: Simplified list for large datasets
    if (window.userMarkers.length > 1000) {
        dataListDiv.innerHTML = `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <i class="fa-solid fa-database text-blue-600 text-2xl mb-2"></i>
                <p class="text-sm font-semibold text-blue-900">${window.userMarkers.length.toLocaleString('tr-TR')} Veri Yüklendi</p>
                <p class="text-xs text-blue-700 mt-1">Büyük veri seti nedeniyle liste gösterilmiyor</p>
                <p class="text-xs text-blue-600 mt-2">💡 Haritada zoom yaparak verileri görüntüleyin</p>
            </div>
        `;
        return;
    }

    // Normal list rendering for reasonable dataset sizes
    dataListDiv.innerHTML = '';
    window.userMarkers.forEach((marker, index) => {
        const listItem = document.createElement('div');
        listItem.className = 'group flex items-center justify-between bg-gray-50 hover:bg-white border border-gray-200 hover:border-purple-300 p-1.5 rounded shadow-sm hover:shadow transition-all duration-200 mb-1.5';

        // Determine color class based on marker type
        let colorClass = 'bg-blue-500';
        let colorStyle = '';

        if (marker.type === 'area') {
            colorClass = 'bg-emerald-500';
        } else if (marker.type === 'route') {
            colorClass = 'bg-orange-500';
        } else if (marker.type === 'circle') {
            colorClass = 'bg-purple-500';
        }

        // Use custom color if specified
        if (marker.color) {
            colorStyle = `style="background-color: ${marker.color};"`;
            colorClass = '';
        }

        listItem.innerHTML = `
            <div class="flex items-center flex-1 min-w-0 cursor-pointer" data-index="${index}" title="Tek tıkla: Haritada göster | Çift tıkla: Renk değiştir">
                <div class="flex-shrink-0 w-2 h-2 ${colorClass} rounded-full mr-2" ${colorStyle}></div>
                <p class="text-xs font-medium text-gray-800 truncate hover:text-emerald-600">${marker.name}</p>
            </div>
            <button class="flex-shrink-0 ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200 group-hover:opacity-100 opacity-0" onclick="removeData(${index})" title="Veriyi Sil">
                <i class="fa-solid fa-trash text-xs"></i>
            </button>
        `;

        // Handle double-click to change color
        const clickableArea = listItem.querySelector('[data-index]');
        let clickTimer = null;
        let isDoubleClick = false;

        clickableArea.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isDoubleClick = true;
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
            }

            // Close any open popups (MapLibre GL JS way)
            const popups = document.getElementsByClassName('maplibregl-popup');
            if (popups.length) {
                for (let popup of popups) {
                    popup.remove();
                }
            }

            window.markerManager.changeDataColor(index, marker, window.userMarkers, updateDataList);
            setTimeout(() => { isDoubleClick = false; }, 300);
        });

        // Handle single-click to show on map
        clickableArea.addEventListener('click', (_e) => {
            if (isDoubleClick) return;

            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
            }

            clickTimer = setTimeout(() => {
                if (!isDoubleClick) {
                    window.markerManager.showDataOnMap(marker);
                }
                clickTimer = null;
            }, 300);
        });

        dataListDiv.appendChild(listItem);
    });
}

/**
 * Setup data list handlers
 * Creates the removeData() function that handles data deletion
 */
function setupDataListHandlers() {
    window.removeData = function(index) {
        const removed = window.userMarkers.splice(index, 1)[0];
        if (!removed) {
            updateDataList();
            return;
        }

        // Pass the ID to markerManager.removeData()
        window.markerManager.removeData(removed.id);

        updateDataList();

        // Refresh heatmap if exists
        if (typeof window.spatialAnalysis !== 'undefined' && window.spatialAnalysis.refreshHeatmapIfAny) {
            try {
                window.spatialAnalysis.refreshHeatmapIfAny();
            } catch(e) {
                Logger.warn('Failed to refresh heatmap:', e);
            }
        }
    };
}

// Make functions globally available
window.updateDataList = updateDataList;
window.setupDataListHandlers = setupDataListHandlers;
