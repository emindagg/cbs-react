import { storageManager } from '../utils/storageManager.js';
import { migrationHelper } from '../utils/migrationHelper.js';
import { authManager } from '../services/authManager.js';
import { toast } from '../utils/toast.js';
import { customConfirm } from '../utils/customPrompt.js';

/**
 * StorymapManager - Harita yönetim paneli
 * Backend ve yerel haritaları listeler, migration sağlar
 */
export class StorymapManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.storymaps = [];
        this.isAuthenticated = authManager.isAuthenticated();
        this.selectedForMigration = new Set();
    }

    async init() {
        // Show loading state
        this.renderLoading();

        try {
            await this.loadStorymaps();
            this.render();
            this.setupEventListeners();
        } catch (error) {
            console.error('[StorymapManager] Init failed:', error);
            this.renderError('Haritalar yüklenirken hata oluştu');
        }
    }

    async loadStorymaps() {
        try {
            // getAllMaps() returns hybrid list (backend + local)
            this.storymaps = await storageManager.getAllMaps();
        } catch (error) {
            console.error('[StorymapManager] Failed to load storymaps:', error);
            toast.error('Haritalar yüklenirken hata oluştu');
            this.storymaps = [];
        }
    }

    renderLoading() {
        this.container.innerHTML = `
            <div class="storymap-manager">
                <div class="storymap-manager__loading">
                    <div class="spinner"></div>
                    <h3>Haritalar yükleniyor...</h3>
                    <p>Lütfen bekleyin</p>
                </div>
            </div>
        `;
    }

    renderError(message) {
        this.container.innerHTML = `
            <div class="storymap-manager">
                <div class="storymap-manager__error">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Hata</h3>
                    <p>${message}</p>
                    <button class="btn btn--primary" onclick="window.location.reload()">
                        <i class="fas fa-redo"></i>
                        Tekrar Dene
                    </button>
                </div>
            </div>
        `;
    }

    render() {
        const backendMaps = this.storymaps.filter(m => m.source === 'backend');
        const localMaps = this.storymaps.filter(m => m.source === 'indexeddb');

        this.container.innerHTML = `
            <div class="storymap-manager">
                <!-- Header -->
                <div class="storymap-manager__header">
                    <div class="header-title">
                        <div class="header-icon">
                            <i class="fas fa-folder"></i>
                        </div>
                        <h2 class="storymap-manager__title">Çalışmalarım</h2>
                    </div>
                    <div class="storymap-manager__actions">
                        ${this.isAuthenticated && localMaps.length > 0 ? `
                            <button class="btn btn--secondary" id="btn-migrate-all">
                                <i class="fas fa-cloud-upload-alt"></i>
                                Yerel Haritaları Sunucuya Yükle (${localMaps.length})
                            </button>
                        ` : ''}
                        <button class="btn btn--secondary" id="btn-import">
                            <i class="fas fa-upload"></i>
                            Projeyi İçe Aktar
                        </button>
                        <button class="btn btn--primary" id="btn-create-new">
                            <i class="fas fa-plus"></i>
                            Yeni Harita Oluştur
                        </button>
                    </div>
                </div>

                <!-- Toolbar -->
                <div class="toolbar">
                    <div class="search-container">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" class="search-input" placeholder="Harita ara..." id="search-input">
                    </div>
                    <div class="filter-tabs">
                        <button class="filter-tab ${!this.activeFilter ? 'active' : ''}" data-filter="all">
                            Tümü (${this.storymaps.length})
                        </button>
                        ${this.isAuthenticated ? `
                            <button class="filter-tab ${this.activeFilter === 'backend' ? 'active' : ''}" data-filter="backend">
                                Sunucu (${backendMaps.length})
                            </button>
                        ` : ''}
                        <button class="filter-tab ${this.activeFilter === 'local' ? 'active' : ''}" data-filter="local">
                            Yerel (${localMaps.length})
                        </button>
                    </div>
                </div>

                <!-- Table Container -->
                ${this.storymaps.length > 0 ? `
                    <div class="table-container">
                        <div class="table-header">
                            <div class="table-header-cell">Proje Adı</div>
                            <div class="table-header-cell">Durum</div>
                        </div>
                        <ul class="project-list" id="storymap-list">
                            ${this.renderStorymapList()}
                        </ul>
                    </div>
                ` : `
                    <div class="storymap-manager__empty">
                        <i class="fas fa-map"></i>
                        <h3>Henüz harita oluşturmadınız</h3>
                        <p>Yeni bir harita oluşturarak başlayın</p>
                    </div>
                `}
            </div>
        `;
    }

    renderStorymapList() {
        if (this.storymaps.length === 0) return '';

        return this.storymaps.map(map => {
            const isBackend = map.source === 'backend';
            const isReadOnly = map.isReadOnly;
            const canMigrate = !isBackend && this.isAuthenticated;
            const isShared = map.isShared === true;
            const hasPublicKey = map.publicKey && map.publicKey.length > 0;

            return `
                <li class="project-item" data-id="${map.id}" data-source="${map.source}">
                    <!-- Project Icon -->
                    <div class="project-icon ${isBackend ? 'server' : 'local'}">
                        <i class="fas fa-${isBackend ? 'cloud' : 'hdd'}"></i>
                    </div>

                    <!-- Project Info -->
                    <div class="project-info">
                        <div class="project-title">${this.escapeHtml(map.title || 'İsimsiz Harita')}</div>
                        <div class="project-meta">
                            <span class="project-meta-item">
                                <i class="far fa-clock"></i>
                                ${this.formatDate(map.createdAt)}
                            </span>
                            <span class="project-meta-separator"></span>
                            <span class="project-meta-item">
                                <i class="fas ${this.getTemplateIcon(map.templateName)}"></i>
                                ${this.getTemplateLabel(map.templateName)}
                            </span>
                        </div>
                    </div>

                    <!-- Project Actions -->
                    <div class="project-actions">
                        <div class="status-badges">
                            <span class="badge badge-${isBackend ? 'server' : 'local'}">
                                ${isBackend ? 'Sunucu' : 'Yerel'}
                            </span>
                            ${isShared ? `<span class="badge badge-shared">Paylaşıldı</span>` : ''}
                            ${isReadOnly ? `<span class="badge badge-readonly">Salt Okunur</span>` : ''}
                        </div>

                        <div class="action-buttons">
                            ${isShared && hasPublicKey ? `
                                <button class="action-btn" data-action="show-code" data-public-key="${map.publicKey}" title="Paylaşım kodu">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            ` : ''}
                            ${!isReadOnly ? `
                                <button class="action-btn delete" data-action="delete" data-id="${map.id}" data-source="${map.source}" title="Sil">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                            <button class="btn-open" data-action="open" data-id="${map.id}" data-source="${map.source}">
                                ${isReadOnly ? 'Görüntüle' : 'Aç'}
                            </button>
                        </div>
                    </div>
                </li>
            `;
        }).join('');
    }

    renderStorymapCards() {
        if (this.storymaps.length === 0) return '';

        return this.storymaps.map(map => {
            const isBackend = map.source === 'backend';
            const isReadOnly = map.isReadOnly;
            const canMigrate = !isBackend && this.isAuthenticated;
            const isShared = map.isShared === true;
            const hasPublicKey = map.publicKey && map.publicKey.length > 0;

            return `
                <div class="storymap-card" data-id="${map.id}" data-source="${map.source}">
                    ${!isReadOnly ? `
                        <button class="storymap-card__delete" data-action="delete" data-id="${map.id}" data-source="${map.source}" title="Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}

                    ${isReadOnly ? `
                        <div class="storymap-card__readonly">
                            <i class="fas fa-lock"></i>
                        </div>
                    ` : ''}

                    <!-- Card Content -->
                    <div class="storymap-card__content">
                        <h3 class="storymap-card__title">${this.escapeHtml(map.title || 'İsimsiz Harita')}</h3>
                        <p class="storymap-card__desc">${this.escapeHtml(map.description || 'Açıklama yok')}</p>

                        <div class="storymap-card__meta">
                            <span class="storymap-card__template">
                                <i class="fas fa-layer-group"></i>
                                ${this.getTemplateLabel(map.templateName)}
                            </span>
                            <span class="storymap-card__date">
                                <i class="fas fa-calendar"></i>
                                ${this.formatDate(map.createdAt)}
                            </span>
                        </div>
                    </div>

                    <!-- Card Actions -->
                    <div class="storymap-card__actions">
                        <button class="btn-action btn-action--primary" data-action="open" data-id="${map.id}" data-source="${map.source}">
                            <i class="fas fa-folder-open"></i>
                            ${isReadOnly ? 'Görüntüle' : 'Aç'}
                        </button>

                        ${canMigrate ? `
                            <button class="btn-action btn-action--success" data-action="migrate" data-id="${map.id}">
                                <i class="fas fa-cloud-upload-alt"></i>
                                Sunucuya Yükle
                            </button>
                        ` : ''}

                        ${isShared && hasPublicKey ? `
                            <button class="btn-action btn-action--info" data-action="show-code" data-public-key="${map.publicKey}">
                                <i class="fas fa-share-alt"></i>
                                Paylaşım Kodu
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Create new button
        const btnCreateNew = this.container.querySelector('#btn-create-new');
        if (btnCreateNew) {
            btnCreateNew.addEventListener('click', () => this.onCreateNew());
        }

        // Migrate all button
        const btnMigrateAll = this.container.querySelector('#btn-migrate-all');
        if (btnMigrateAll) {
            btnMigrateAll.addEventListener('click', () => this.migrateAllMaps());
        }

        // Import button
        const btnImport = this.container.querySelector('#btn-import');
        if (btnImport) {
            btnImport.addEventListener('click', () => this.onImport());
        }

        // Search input
        const searchInput = this.container.querySelector('#search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterBySearch(e.target.value);
            });
        }

        // Filter tabs
        const filterTabs = this.container.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.applyFilter(filter);
            });
        });

        // Action buttons in list view
        const actionBtns = this.container.querySelectorAll('.action-btn, .btn-open');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.currentTarget.dataset.action;
                let id = e.currentTarget.dataset.id;
                const source = e.currentTarget.dataset.source;
                const publicKey = e.currentTarget.dataset.publicKey;

                // IndexedDB IDs are numbers, backend IDs are GUIDs (strings)
                if (source === 'indexeddb') {
                    id = parseInt(id, 10);
                }

                if (action === 'open') {
                    this.openStorymap(id, source);
                } else if (action === 'delete') {
                    this.deleteStorymap(id, source);
                } else if (action === 'show-code') {
                    this.showShareCodeModal(publicKey);
                }
            });
        });

        // Delete buttons (for card view - backward compatibility)
        const deleteBtns = this.container.querySelectorAll('.storymap-card__delete');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                let id = e.currentTarget.dataset.id;
                const source = e.currentTarget.dataset.source;

                if (source === 'indexeddb') {
                    id = parseInt(id, 10);
                }

                this.deleteStorymap(id, source);
            });
        });
    }

    applyFilter(filter) {
        this.activeFilter = filter === 'all' ? null : filter;

        const items = this.container.querySelectorAll('.project-item, .storymap-card');
        items.forEach(item => {
            const source = item.dataset.source;

            // Map filter name to actual source value
            let shouldShow = false;
            if (!this.activeFilter) {
                shouldShow = true; // Show all
            } else if (this.activeFilter === 'backend' && source === 'backend') {
                shouldShow = true;
            } else if (this.activeFilter === 'local' && source === 'indexeddb') {
                shouldShow = true;
            }

            item.style.display = shouldShow ? '' : 'none';
        });

        // Update active filter tab
        const filterTabs = this.container.querySelectorAll('.filter-tab, .filter-btn');
        filterTabs.forEach(tab => {
            const tabFilter = tab.dataset.filter;
            if (tabFilter === filter) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    filterBySearch(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const items = this.container.querySelectorAll('.project-item, .storymap-card');

        items.forEach(item => {
            const title = item.querySelector('.project-title, .storymap-card__title');
            const titleText = title ? title.textContent.toLowerCase() : '';
            const shouldShow = titleText.includes(term) || term === '';

            item.style.display = shouldShow ? '' : 'none';
        });
    }


    async migrateAllMaps() {
        const confirmed = await customConfirm('Tüm yerel haritalarınız sunucuya yüklenecek. Devam etmek istiyor musunuz?', {
            title: 'Haritaları Yükle',
            confirmText: 'Yükle',
            cancelText: 'İptal',
            type: 'info'
        });
        
        if (!confirmed) return;

        // Show progress modal
        this.showMigrationProgress();

        try {
            const results = await migrationHelper.migrateAllMaps((current, total, title) => {
                this.updateMigrationProgress(current, total, title);
            });

            this.hideMigrationProgress();

            if (results.failed === 0) {
                toast.success(`${results.success} harita başarıyla yüklendi!`);
            } else {
                toast.warning(`${results.success} başarılı, ${results.failed} başarısız`);
                if (results.errors.length > 0) {
                    console.error('[StorymapManager] Migration errors:', results.errors);
                }
            }

            // Reload list
            await this.loadStorymaps();
            this.render();
            this.setupEventListeners();
        } catch (error) {
            this.hideMigrationProgress();
            console.error('[StorymapManager] Migration failed:', error);
            toast.error('Migration başarısız oldu');
        }
    }

    showMigrationProgress() {
        const modal = document.createElement('div');
        modal.id = 'migration-progress-modal';
        modal.className = 'migration-progress-modal';
        modal.innerHTML = `
            <div class="migration-progress-modal__content">
                <div class="migration-progress-modal__icon">
                    <i class="fas fa-cloud-upload-alt"></i>
                </div>
                <h3>Haritalar Sunucuya Yükleniyor</h3>
                <div class="migration-progress-modal__bar">
                    <div class="migration-progress-modal__bar-fill" id="migration-progress-bar"></div>
                </div>
                <p class="migration-progress-modal__text" id="migration-progress-text">Başlıyor...</p>
                <p class="migration-progress-modal__detail" id="migration-progress-detail"></p>
            </div>
        `;
        document.body.appendChild(modal);
    }

    updateMigrationProgress(current, total, title) {
        const bar = document.getElementById('migration-progress-bar');
        const text = document.getElementById('migration-progress-text');
        const detail = document.getElementById('migration-progress-detail');

        if (bar && text && detail) {
            const percent = Math.round((current / total) * 100);
            bar.style.width = `${percent}%`;
            text.textContent = `${current} / ${total} harita`;
            detail.textContent = title;
        }
    }

    hideMigrationProgress() {
        const modal = document.getElementById('migration-progress-modal');
        if (modal) {
            modal.remove();
        }
    }

    async migrateSingleMap(localId) {
        try {
            toast.info('Harita sunucuya yükleniyor...');

            await storageManager.migrateMapToBackend(localId);

            // Başarılı migration sonrası yerel kopyayı sil
            await storageManager.deleteMapFromIndexedDB(localId);

            toast.success('Harita başarıyla yüklendi!');

            // Reload list
            await this.loadStorymaps();
            this.render();
            this.setupEventListeners();
        } catch (error) {
            console.error('[StorymapManager] Single migration failed:', error);
            toast.error('Yükleme başarısız oldu');
        }
    }

    openStorymap(id, source) {
        // Dispatch event to main app
        window.dispatchEvent(new CustomEvent('open-storymap', {
            detail: { id, source }
        }));
    }

    async deleteStorymap(id, source) {
        const confirmed = await customConfirm('Bu haritayı silmek istediğinizden emin misiniz?', {
            confirmText: 'Sil',
            cancelText: 'İptal',
            type: 'danger'
        });
        
        if (!confirmed) return;

        try {
            await storageManager.deleteMap(id, source);
            toast.success('Harita silindi');

            // Reload list
            await this.loadStorymaps();
            this.render();
            this.setupEventListeners();
        } catch (error) {
            console.error('[StorymapManager] Delete failed:', error);
            toast.error('Silme başarısız oldu');
        }
    }

    onCreateNew() {
        // Dispatch event to show template selection modal
        window.dispatchEvent(new CustomEvent('create-new-storymap'));
    }

    onImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.style.display = 'none';

        input.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            try {
                const text = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.onerror = () => reject(new Error('Dosya okunamadı'));
                    reader.readAsText(file, 'utf-8');
                });

                let imported;
                try {
                    imported = JSON.parse(text);
                } catch (err) {
                    toast.error('Geçerli bir JSON dosyası değil');
                    console.error('[StorymapManager] Import JSON parse error:', err);
                    return;
                }

                const hasTitle = imported.title && String(imported.title).trim();
                const hasSteps = Array.isArray(imported.steps) && imported.steps.length > 0;
                const hasPoints = Array.isArray(imported.points) && imported.points.length > 0;
                if (!hasTitle && !hasSteps && !hasPoints) {
                    toast.error('Dosyada başlık, adım veya nokta bulunamadı');
                    return;
                }

                const templateKey = imported.mapData?.template && ['point', 'route', 'timeline', 'storymap'].includes(imported.mapData.template)
                    ? imported.mapData.template
                    : 'point';
                const data = {
                    title: (imported.title && String(imported.title).trim()) || 'İçe aktarılan harita',
                    desc: imported.desc ?? '',
                    templateName: templateKey,
                    steps: Array.isArray(imported.steps) ? imported.steps : [],
                    points: Array.isArray(imported.points) ? imported.points : [],
                    mapData: imported.mapData && typeof imported.mapData === 'object' ? imported.mapData : {}
                };

                await storageManager.saveMapToIndexedDB(data);
                toast.success('Harita içe aktarıldı');
                await this.loadStorymaps();
                this.render();
                this.setupEventListeners();
            } catch (error) {
                console.error('[StorymapManager] Import failed:', error);
                toast.error(error.message || 'İçe aktarma başarısız oldu');
            } finally {
                input.remove();
            }
        }, { once: true });

        document.body.appendChild(input);
        input.click();
    }

    showShareCodeModal(publicKey) {
        const modal = document.createElement('div');
        modal.className = 'share-code-modal';
        modal.innerHTML = `
            <div class="share-code-modal__backdrop"></div>
            <div class="share-code-modal__content">
                <div class="share-code-modal__header">
                    <h3>
                        <i class="fas fa-share-alt"></i>
                        Paylaşım Kodu
                    </h3>
                    <button class="share-code-modal__close" title="Kapat">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="share-code-modal__body">
                    <div class="share-code-field">
                        <label>Paylaşım Kodu</label>
                        <div class="share-code-field__input-group">
                            <input type="text" readonly value="${publicKey}" id="share-code-input">
                            <button class="btn-copy" title="Kopyala">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>

                    <div class="share-code-info">
                        <i class="fas fa-info-circle"></i>
                        <p>Bu kodu kullanarak haritanızı başkalarıyla paylaşabilirsiniz. Kod ile herkes haritanızı görüntüleyebilir.</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close handlers
        const closeModal = () => {
            modal.classList.add('share-code-modal--closing');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.share-code-modal__backdrop').addEventListener('click', closeModal);
        modal.querySelector('.share-code-modal__close').addEventListener('click', closeModal);

        // Copy handler
        const copyBtn = modal.querySelector('.btn-copy');
        copyBtn.addEventListener('click', () => {
            const input = document.getElementById('share-code-input');
            input.select();
            document.execCommand('copy');

            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.classList.add('btn-copy--success');

            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
                copyBtn.classList.remove('btn-copy--success');
            }, 2000);

            toast.success('Paylaşım kodu kopyalandı');
        });

        // Show animation
        requestAnimationFrame(() => {
            modal.classList.add('share-code-modal--active');
        });
    }

    // Helper methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getTemplateLabel(templateName) {
        const labels = {
            'point': 'Nokta Bazlı',
            'route': 'Rota Bazlı',
            'timeline': 'Zaman Çizelgesi',
            'storymap': 'Hikâye Haritası'
        };
        return labels[templateName] || templateName || 'Bilinmiyor';
    }

    getTemplateIcon(templateName) {
        const icons = {
            'point': 'fa-map-marker-alt',
            'route': 'fa-route',
            'timeline': 'fa-clock',
            'storymap': 'fa-book-open'
        };
        return icons[templateName] || 'fa-map';
    }

    formatDate(dateString) {
        if (!dateString) return 'Tarih yok';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Bugün';
        if (diffDays === 1) return 'Dün';
        if (diffDays < 7) return `${diffDays} gün önce`;

        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
