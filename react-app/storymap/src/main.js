import { ModalComponent } from './components/ModalComponent.js';
import { StorymapManager } from './components/StorymapManager.js';
import { storageManager } from './utils/storageManager.js';
import { StoryMapComponent } from './components/storymap/StoryMapComponent.js';
import { templates } from './data/templates.js';
import { authManager } from './services/authManager.js';

// Check for dev mode or admin redirect BEFORE auth check
const urlParams = new URLSearchParams(window.location.search);
const isDevMode = urlParams.has('dev');
const isAdminRedirect = urlParams.get('admin') !== null || window.location.hash === '#admin';

// Admin redirect check
if (isAdminRedirect) {
    window.location.href = 'admin/index.html?admin';
}

// Auth check - skip in dev mode
if (!isDevMode) {
    if (!authManager.requireAuth()) {
        // requireAuth() handles redirect automatically
        throw new Error('Unauthorized');
    }
} else {
}

// View Mode Başlatıcı (Salt Okunur Mod)
class ViewModeApp {
    constructor(storyId) {
        this.storyId = storyId;
        this.modal = null;
        this.storyMapComponent = null;
        this.init();
    }

    async init() {
        try {
            // Story'yi yükle
            const story = await storageManager.getMap(parseInt(this.storyId));

            if (!story) {
                this.showError('Hikâye bulunamadı', 'Aradığınız hikâye mevcut değil veya silinmiş.');
                return;
            }

            // Template bilgisini belirle
            const templateKey = story.mapData?.template || 'point';
            const isStoryMap = templateKey === 'storymap';

            // Startup modal'ı gizle
            const startupModal = document.getElementById('startup-modal');
            if (startupModal) {
                startupModal.style.display = 'none';
            }

            // StoryMap özel durumu
            if (isStoryMap) {
                this.loadStoryMapViewer(story);
            } else {
                this.loadNormalViewer(story);
            }

        } catch (error) {
            console.error('[ViewModeApp] Error:', error);
            this.showError('Yükleme Hatası', 'Hikâye yüklenirken bir hata oluştu.');
        }
    }

    loadStoryMapViewer(story) {
        // StoryMap için özel viewer
        const storymapContainer = document.getElementById('storymap-container');
        if (storymapContainer) {
            storymapContainer.style.display = 'block';

            // Points'i steps formatına çevir
            const steps = (story.points || []).map((point, index) => ({
                id: point.id || index + 1,
                title: point.title,
                subtitle: point.subtitle || '',
                content: point.description || '',
                coords: point.coords,
                zoom: point.zoom || (point.isDrawing ? 12 : 12),
                media: point.media || [],
                facts: point.facts || [],
                tags: point.tags || [],
                isDrawing: point.isDrawing || false
            }));

            // StoryMapComponent başlat
            const template = templates['storymap'];
            this.storyMapComponent = new StoryMapComponent('storymap-container', {
                title: story.title,
                subtitle: story.desc,
                description: story.desc,
                steps: steps,
                drawings: this.extractDrawings(story.points || []),
                viewMode: true
            }, template);

            this.storyMapComponent.init();
        }
    }

    loadNormalViewer(story) {
        // Normal şablonlar için viewer
        this.modal = new ModalComponent('startup-modal', {
            viewMode: true,
            storyData: story
        });

        // startGame'i story data ile çağır
        this.modal.startGame(story);
    }

    extractDrawings(points) {
        return points
            .filter(p => p.isDrawing)
            .map(p => ({
                id: p.id,
                type: p.drawingType,
                coords: p.coords,
                color: p.color || '#3b82f6',
                title: p.title
            }));
    }

    showError(title, message) {
        // Hata sayfası göster
        document.body.innerHTML = `
            <div class="view-mode-error">
                <i class="fas fa-exclamation-circle view-mode-error__icon"></i>
                <h1 class="view-mode-error__title">${title}</h1>
                <p class="view-mode-error__message">${message}</p>
                <a href="index.html" class="view-mode-error__btn">
                    <i class="fas fa-home"></i> Ana Sayfaya Dön
                </a>
            </div>
        `;
    }
}

// Uygulama Başlatıcı
class App {
    constructor() {
        this.storymapManager = null;
        this.modal = null;
        this.init();
    }

    async init() {
        // Global error handler
        window.addEventListener('error', (e) => {
            if (e.filename) {
                console.error('[App] Dosya yükleme hatası:', e.filename, e.message);
            }
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            // Storage erişim hatalarını filtrele (beklenen hata)
            if (e.reason && e.reason.message && e.reason.message.includes('storage')) {
                e.preventDefault();
                return;
            }
            console.error('[App] Promise hatası:', e.reason);
        });

        // Home navigasyonu (hikâye seçme ekranına dön)
        window.addEventListener('navigate-home', () => {
            this.navigateToHome();
        });

        // StorymapManager events
        window.addEventListener('create-new-storymap', () => {
            this.showTemplateSelection();
        });

        window.addEventListener('open-storymap', (e) => {
            this.openStorymap(e.detail.id, e.detail.source);
        });

        // Çalışmalarım - StorymapManager'a geri dön
        window.addEventListener('show-storymap-manager', () => {
            this.backToStorymapManager();
        });

        // Initialize StorymapManager
        this.showStorymapManager();
    }

    async backToStorymapManager() {
        // Cleanup current modal if exists
        if (this.modal) {
            this.modal.destroy();
            this.modal = null;
        }

        // Hide all other UI elements
        const startupModal = document.getElementById('startup-modal');
        if (startupModal) startupModal.style.display = 'none';

        const mapToolbar = document.getElementById('map-toolbar');
        if (mapToolbar) {
            mapToolbar.classList.add('hidden');
            mapToolbar.style.removeProperty('display');
        }

        const mapContainer = document.getElementById('map-container');
        if (mapContainer) mapContainer.style.display = 'none';

        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) sidebarContainer.style.display = 'none';

        const storymapContainer = document.getElementById('storymap-container');
        if (storymapContainer) {
            storymapContainer.innerHTML = '';
            storymapContainer.style.display = 'none';
        }

        const timelineContainer = document.getElementById('timelinejs-container');
        if (timelineContainer) timelineContainer.style.display = 'none';

        // Show StorymapManager and reload
        await this.showStorymapManager();
    }

    async showStorymapManager() {
        // Hide startup modal
        const startupModal = document.getElementById('startup-modal');
        if (startupModal) {
            startupModal.style.display = 'none';
        }

        // Create container for StorymapManager
        let managerContainer = document.getElementById('storymap-manager-container');
        if (!managerContainer) {
            managerContainer = document.createElement('div');
            managerContainer.id = 'storymap-manager-container';
            document.body.appendChild(managerContainer);
        }

        managerContainer.style.display = 'block';

        // Initialize StorymapManager
        this.storymapManager = new StorymapManager('storymap-manager-container');
        await this.storymapManager.init();
    }

    showTemplateSelection() {
        // Hide StorymapManager
        const managerContainer = document.getElementById('storymap-manager-container');
        if (managerContainer) {
            managerContainer.style.display = 'none';
        }

        // Hide map editor elements
        const mapToolbar = document.getElementById('map-toolbar');
        if (mapToolbar) {
            mapToolbar.classList.add('hidden');
            mapToolbar.style.removeProperty('display');
        }

        const mapContainer = document.getElementById('map-container');
        if (mapContainer) mapContainer.style.display = 'none';

        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) sidebarContainer.style.display = 'none';

        const storymapContainer = document.getElementById('storymap-container');
        if (storymapContainer) storymapContainer.style.display = 'none';

        const timelineContainer = document.getElementById('timelinejs-container');
        if (timelineContainer) timelineContainer.style.display = 'none';

        // Show startup modal for template selection
        const startupModal = document.getElementById('startup-modal');
        if (startupModal) {
            startupModal.style.display = 'flex';
        }

        // Input alanlarını temizle
        const titleInput = document.getElementById('input-title');
        if (titleInput) {
            titleInput.value = '';
        }

        const descInput = document.getElementById('input-desc');
        if (descInput) {
            descInput.value = '';
        }

        // Template seçimini varsayılana döndür
        const templateSelect = document.getElementById('template-select');
        if (templateSelect) {
            templateSelect.value = 'point';
        }


        // Initialize ModalComponent if not already
        if (!this.modal) {
            this.modal = new ModalComponent('startup-modal');
        }
    }

    async openStorymap(id, source) {
        try {
            // Load storymap data
            const story = await storageManager.getMap(id, source);

            if (!story) {
                throw new Error('Harita bulunamadı');
            }

            // Cleanup old modal if exists
            if (this.modal) {
                this.modal.destroy();
                this.modal = null;
            }

            // Hide StorymapManager
            const managerContainer = document.getElementById('storymap-manager-container');
            if (managerContainer) {
                managerContainer.style.display = 'none';
            }

            // Show startup modal (will be hidden by ModalComponent.startGame)
            const startupModal = document.getElementById('startup-modal');
            if (startupModal) {
                startupModal.style.display = 'flex';
            }

            // Initialize ModalComponent with viewMode false (edit mode)
            this.modal = new ModalComponent('startup-modal', {
                viewMode: false,
                storyData: story
            });

            // Start game with loaded story
            this.modal.startGame(story);

        } catch (error) {
            console.error('[App] Failed to open storymap:', error);
            alert('Harita açılırken hata oluştu');
        }
    }

    navigateToHome() {

        // Mevcut modal'ı temizle (eğer varsa)
        if (this.modal) {
            this.modal.destroy();
            this.modal = null;
        }

        // UI elementlerini temizle
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.innerHTML = '';
        }

        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = '';
        }

        const storymapContainer = document.getElementById('storymap-container');
        if (storymapContainer) {
            storymapContainer.innerHTML = '';
        }

        const timelineContainer = document.getElementById('timelinejs-container');
        if (timelineContainer) {
            timelineContainer.innerHTML = '';
        }


        // Şablon seçim modalını göster (yeni harita oluşturma)
        this.showTemplateSelection();
    }
}

// DOM yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    // URL parametrelerini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const storyId = urlParams.get('id');

    // View mode kontrolü
    if (mode === 'view' && storyId) {
        new ViewModeApp(storyId);
    } else {
        new App();
    }

    // Profil dropdown işlevi
    initProfileDropdown();
});

// Profil Dropdown İşlevi
function initProfileDropdown() {
    const profileBtn = document.querySelector('.toolbar__btn--profile');
    const dropdown = document.getElementById('profile-dropdown');

    if (!profileBtn || !dropdown) return;

    // Profil butonuna tıklama
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // Dropdown item'lara tıklama
    const dropdownItems = dropdown.querySelectorAll('[data-dropdown-action]');
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const action = item.getAttribute('data-dropdown-action');
            dropdown.classList.remove('active');

            // Dropdown actions
            if (action === 'my-work') {
                // StorymapManager'a geri dön
                window.dispatchEvent(new CustomEvent('show-storymap-manager'));
            } else if (action === 'logout') {
                if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
                    authManager.logout(); // Clears session and redirects to landing
                }
            }
        });
    });

    // Dışarıya tıklandığında dropdown'ı kapat
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}
