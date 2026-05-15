import { isValidCoordinateRange, parseSearchCoordinates } from '../../../utils/parseSearchCoordinates.js';

export class SearchManager {
    constructor(toolbarElement) {
        this.toolbar = toolbarElement;
        this.mapComponent = null;
        this.searchResults = [];
        this.selectedSearchIndex = -1;
        this.searchMarker = null;
        this.searchResultsContainer = null;
        this.searchDebounceTimer = null;
        
        this.setupUI();
    }

    setMapComponent(mapComponent) {
        this.mapComponent = mapComponent;
    }

    setupUI() {
        const searchInput = this.toolbar.querySelector('#toolbar-search');
        if (!searchInput) return;

        this.createSearchResultsContainer(searchInput);
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(this.searchDebounceTimer);
            
            if (query.length >= 3) {
                this.searchDebounceTimer = setTimeout(() => {
                    this.searchLocationWithResults(query);
                }, 300);
            } else {
                this.hideSearchResults();
            }
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (this.tryFocusOnParsedCoordinates(query)) {
                    return;
                }
                if (this.searchResults && this.searchResults.length > 0) {
                    this.selectSearchResult(this.searchResults[this.selectedSearchIndex >= 0 ? this.selectedSearchIndex : 0]);
                }
            }
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (!this.searchResults || this.searchResults.length === 0) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedSearchIndex = Math.min(this.selectedSearchIndex + 1, this.searchResults.length - 1);
                this.highlightSearchResult();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedSearchIndex = Math.max(this.selectedSearchIndex - 1, 0);
                this.highlightSearchResult();
            } else if (e.key === 'Escape') {
                this.hideSearchResults();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !this.searchResultsContainer?.contains(e.target)) {
                this.hideSearchResults();
            }
        });
    }

    createSearchResultsContainer(searchInput) {
        this.searchResultsContainer = document.createElement('div');
        this.searchResultsContainer.className = 'toolbar__search-results';
        this.searchResultsContainer.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-height: 300px;
            overflow-y: auto;
            z-index: 1001;
            margin-top: 4px;
        `;
        
        const searchWrapper = searchInput.parentElement;
        searchWrapper.style.position = 'relative';
        searchWrapper.appendChild(this.searchResultsContainer);
    }

    tryFocusOnParsedCoordinates(query) {
        const parsed = parseSearchCoordinates(query);
        if (!parsed) {
            return false;
        }

        if (!isValidCoordinateRange(parsed.lat, parsed.lng)) {
            this.showSearchMessage('Geçersiz koordinat aralığı');
            return true;
        }

        const label = `${parsed.lat.toFixed(6)}, ${parsed.lng.toFixed(6)}`;
        this.focusOnCoordinates(parsed.lat, parsed.lng, label);
        return true;
    }

    focusOnCoordinates(lat, lng, label) {
        this.selectSearchResult({
            lat: String(lat),
            lon: String(lng),
            display_name: label,
        });
    }

    showSearchMessage(message) {
        if (!this.searchResultsContainer) return;

        this.searchResultsContainer.innerHTML = `
            <div style="padding: 12px 15px; text-align: center; color: #666; font-size: 13px;">
                ${message}
            </div>
        `;
        this.searchResultsContainer.style.display = 'block';
        this.searchResults = [];
        this.selectedSearchIndex = -1;
    }

    async searchLocationWithResults(query) {
        if (this.tryFocusOnParsedCoordinates(query)) {
            return;
        }

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=tr`;
            
            const response = await fetch(url, {
                headers: { 'User-Agent': 'StoryMap/1.0' }
            });

            if (!response.ok) throw new Error('Arama başarısız');

            const data = await response.json();
            this.searchResults = data;
            this.selectedSearchIndex = -1;
            this.displaySearchResults();
        } catch (error) {
            this.searchResults = [];
            this.displaySearchResults();
        }
    }

    displaySearchResults() {
        if (!this.searchResultsContainer) return;
        
        if (this.searchResults.length === 0) {
            this.searchResultsContainer.innerHTML = `
                <div style="padding: 12px 15px; text-align: center; color: #666; font-size: 13px;">
                    Sonuç bulunamadı
                </div>
            `;
            this.searchResultsContainer.style.display = 'block';
            return;
        }

        this.searchResultsContainer.innerHTML = '';
        
        this.searchResults.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'toolbar__search-result-item';
            item.style.cssText = `
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                transition: background 0.2s;
            `;
            
            const displayName = result.display_name;
            const shortName = displayName.split(',')[0];
            
            item.innerHTML = `
                <div style="font-weight: 500; color: #333; font-size: 13px; margin-bottom: 2px;">
                    ${shortName}
                </div>
                <div style="font-size: 11px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${displayName}
                </div>
            `;
            
            item.addEventListener('mouseenter', () => {
                this.selectedSearchIndex = index;
                this.highlightSearchResult();
            });
            
            item.addEventListener('click', () => {
                this.selectSearchResult(result);
            });
            
            this.searchResultsContainer.appendChild(item);
        });
        
        this.searchResultsContainer.style.display = 'block';
    }

    highlightSearchResult() {
        if (!this.searchResultsContainer) return;
        
        const items = this.searchResultsContainer.querySelectorAll('.toolbar__search-result-item');
        items.forEach((item, index) => {
            item.style.background = index === this.selectedSearchIndex ? '#f5f5f5' : 'white';
        });
    }

    selectSearchResult(result) {
        const lon = parseFloat(result.lon);
        const lat = parseFloat(result.lat);
        const displayName = result.display_name.split(',')[0];
        
        if (this.mapComponent && this.mapComponent.map) {
            this.mapComponent.map.flyTo({
                center: [lon, lat],
                zoom: 13,
                duration: 1500
            });
            
            if (this.searchMarker) {
                this.searchMarker.remove();
            }
            
            const el = document.createElement('div');
            el.className = 'search-pin-marker';
            el.innerHTML = '<i class="fa-solid fa-location-dot"></i>';
            el.style.cssText = `
                font-size: 32px;
                color: #e74c3c;
                cursor: pointer;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                transform: translateY(-50%);
            `;
            
            this.searchMarker = new maplibregl.Marker({
                element: el,
                anchor: 'bottom'
            })
            .setLngLat([lon, lat])
            .setPopup(new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
                <div style="position: relative; padding: 12px 30px 12px 12px; font-family: 'Roboto', sans-serif; min-width: 180px;">
                    <button class="search-popup-close" style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        width: 24px;
                        height: 24px;
                        border: none;
                        background: #f0f0f0;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        color: #666;
                        transition: all 0.2s;
                    ">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    <strong style="color: #333; font-size: 14px;">${displayName}</strong>
                    <div style="font-size: 12px; color: #666; margin-top: 6px; line-height: 1.4;">
                        ${result.display_name}
                    </div>
                </div>
            `))
            .addTo(this.mapComponent.map);
            
            this.searchMarker.togglePopup();
            
            setTimeout(() => {
                const closeBtn = document.querySelector('.search-popup-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        this.removeSearchMarker();
                    });
                    closeBtn.addEventListener('mouseover', function() {
                        this.style.background='#e74c3c'; 
                        this.style.color='white';
                    });
                    closeBtn.addEventListener('mouseout', function() {
                        this.style.background='#f0f0f0'; 
                        this.style.color='#666';
                    });
                }
            }, 100);
        }
        
        const searchInput = this.toolbar.querySelector('#toolbar-search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.hideSearchResults();
    }

    removeSearchMarker() {
        if (this.searchMarker) {
            const marker = this.searchMarker;
            this.searchMarker = null;
            marker.remove();
        }
    }

    hideSearchResults() {
        if (this.searchResultsContainer) {
            this.searchResultsContainer.style.display = 'none';
        }
        this.searchResults = [];
        this.selectedSearchIndex = -1;
    }
}
