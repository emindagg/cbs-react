/**
 * Toggle3DControl - Küre/Globe Görünüm Kontrolü
 * 
 * Haritayı düz (mercator) ve küre (globe) görünümü arasında geçiş yapar.
 */

export class Toggle3DControl {
    constructor() {
        this.isGlobe = false;
        this.container = null;
        this.button = null;
        this.map = null;
    }

    onAdd(map) {
        this.map = map;
        
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.className = 'maplibregl-ctrl-3d';
        this.button.title = 'Küre Görünümü';
        this.button.setAttribute('aria-label', 'Küre Görünümü');
        this.button.textContent = '2D';
        
        this.button.addEventListener('click', () => this.toggleGlobe());
        
        this.container.appendChild(this.button);
        
        return this.container;
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = null;
    }

    toggleGlobe() {
        this.isGlobe = !this.isGlobe;
        
        if (this.isGlobe) {
            // Küre görünümüne geç
            this.map.setProjection({ type: 'globe' });
            this.button.classList.add('maplibregl-ctrl-3d--active');
            this.button.title = 'Düz Harita';
            this.button.textContent = '3D';
        } else {
            // Düz harita görünümüne geç
            this.map.setProjection({ type: 'mercator' });
            this.button.classList.remove('maplibregl-ctrl-3d--active');
            this.button.title = 'Küre Görünümü';
            this.button.textContent = '2D';
        }
    }
}
