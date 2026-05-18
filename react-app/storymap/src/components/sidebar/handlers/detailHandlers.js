/**
 * Detay görünümü event handler'ları
 */

import { renderMediaItems } from '../renderers/index.js';
import { storageManager } from '../../../utils/storageManager.js';

export function setupDetailListeners(sidebar) {
    const container = sidebar.container;
    
    // Toggle button
    const toggleBtn = container.querySelector('#sidebar-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => sidebar.toggle());
    }

    // Geri butonu
    const backBtn = container.querySelector('#btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', () => sidebar.showListView());
    }

    // Tab buttons in detail view
    const detailTabs = container.querySelectorAll('.sidebar__detail-tab');
    detailTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            if (tabName === 'settings') {
                sidebar.currentTab = 'settings';
                sidebar.currentView = 'settings';
                sidebar.render();
            }
        });
    });

    // Medya yükleme
    setupMediaUploadListeners(sidebar);

    // Stil seçici
    setupStyleSelectorListeners(sidebar);

    // Renk seçici
    setupColorPickerListeners(sidebar);

    // Input değişiklikleri
    setupInputListeners(sidebar);

    // Footer butonları
    setupDetailFooterListeners(sidebar);
}

/**
 * Medya yükleme listener'ları
 */
function setupMediaUploadListeners(sidebar) {
    const container = sidebar.container;
    const mediaUploadArea = container.querySelector('#media-upload-area');
    const mediaInput = container.querySelector('#media-input');
    
    if (!mediaUploadArea || !mediaInput) return;
    
    mediaUploadArea.addEventListener('click', () => mediaInput.click());
    
    mediaInput.addEventListener('change', (e) => {
        handleMediaUpload(sidebar, e.target.files);
    });

    // Drag & drop
    if (sidebar.mediaManager) {
        sidebar.mediaManager.setupDragDrop(mediaUploadArea, (files) => {
            handleMediaUpload(sidebar, files);
        });
    }

    // Medya silme
    const mediaRemoveBtns = container.querySelectorAll('.sidebar__media-remove');
    mediaRemoveBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.mediaIndex);
            removeMedia(sidebar, index);
        });
    });

    // Medya caption inputları
    const captionInputs = container.querySelectorAll('.sidebar__media-caption');
    captionInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(input.dataset.mediaIndex);
            if (sidebar.editingPoint.media && sidebar.editingPoint.media[index]) {
                sidebar.editingPoint.media[index].caption = e.target.value;
            }
        });
    });
}

/**
 * Medya yükleme işleyici - MediaManager üzerinden yükler
 */
async function handleMediaUpload(sidebar, files) {
    if (!files || files.length === 0) return;

    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB limit (resimler için)
    const MAX_VIDEO_SIZE = 30 * 1024 * 1024; // 30MB limit (videolar için)
    const filesArray = Array.from(files);

    // Dosya formatı kontrolü - sadece resim ve video kabul et
    const invalidFiles = filesArray.filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type) && !ALLOWED_VIDEO_TYPES.includes(f.type));
    if (invalidFiles.length > 0) {
        alert(`Desteklenmeyen dosya formatı!\n\nKabul edilen resim formatları: JPG, PNG, GIF, WebP, SVG, BMP\nKabul edilen video formatları: MP4, WebM, OGG\n\nGeçersiz dosyalar: ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
    }

    // Dosya boyutu kontrolü
    const oversizedFiles = filesArray.filter(f => {
        const isVideo = f.type.startsWith('video/');
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        return f.size > maxSize;
    });
    if (oversizedFiles.length > 0) {
        alert(`Bazı dosyalar çok büyük!\nResimler için maksimum: 10MB\nVideolar için maksimum: 30MB\nBüyük dosyalar: ${oversizedFiles.map(f => f.name).join(', ')}`);
        return;
    }

    // Yükleme göstergesi
    const mediaGrid = sidebar.container.querySelector('#media-grid');
    if (mediaGrid) {
        const loader = document.createElement('div');
        loader.className = 'sidebar__media-loader';
        loader.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor...';
        loader.style.cssText = 'padding: 20px; text-align: center; color: #6b7280;';
        mediaGrid.appendChild(loader);
    }

    // MediaManager üzerinden yükle (backend mode: CDN, aksi halde: base64)
    if (sidebar.mediaManager) {
        if (!sidebar.editingPoint.media) sidebar.editingPoint.media = [];
        await sidebar.mediaManager.handleUpload(filesArray, sidebar.editingPoint, () => {
            const loader = sidebar.container.querySelector('.sidebar__media-loader');
            if (loader) loader.remove();
            updateMediaGrid(sidebar);
            console.log('[Media] All files uploaded via MediaManager');
        });
    } else {
        // Fallback: MediaManager yoksa base64 kullan (IndexedDB mode)
        let loadedCount = 0;
        filesArray.forEach((file, index) => {
            setTimeout(() => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const mediaItem = {
                        type: file.type.startsWith('video/') ? 'video' : 'image',
                        url: e.target.result,
                        name: file.name
                    };
                    if (!sidebar.editingPoint.media) sidebar.editingPoint.media = [];
                    sidebar.editingPoint.media.push(mediaItem);
                    loadedCount++;
                    if (loadedCount === filesArray.length) {
                        const loader = sidebar.container.querySelector('.sidebar__media-loader');
                        if (loader) loader.remove();
                        updateMediaGrid(sidebar);
                    }
                };
                reader.onerror = () => {
                    loadedCount++;
                    if (loadedCount === filesArray.length) {
                        const loader = sidebar.container.querySelector('.sidebar__media-loader');
                        if (loader) loader.remove();
                        updateMediaGrid(sidebar);
                    }
                };
                reader.readAsDataURL(file);
            }, index * 50);
        });
    }
}

/**
 * Medya silme işleyici
 */
function removeMedia(sidebar, index) {
    if (sidebar.editingPoint.media && sidebar.editingPoint.media[index]) {
        sidebar.editingPoint.media.splice(index, 1);
        updateMediaGrid(sidebar);
    }
}

/**
 * Medya grid'ini günceller
 */
function updateMediaGrid(sidebar) {
    const mediaGrid = sidebar.container.querySelector('#media-grid');
    if (!mediaGrid) return;
    
    mediaGrid.innerHTML = renderMediaItems(sidebar.editingPoint.media);
    
    // Silme butonlarına listener ekle
    const mediaRemoveBtns = mediaGrid.querySelectorAll('.sidebar__media-remove');
    mediaRemoveBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.mediaIndex);
            removeMedia(sidebar, index);
        });
    });

    // Caption input listener'ları ekle
    const captionInputs = mediaGrid.querySelectorAll('.sidebar__media-caption');
    captionInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(input.dataset.mediaIndex);
            if (sidebar.editingPoint.media && sidebar.editingPoint.media[index]) {
                sidebar.editingPoint.media[index].caption = e.target.value;
            }
        });
    });
}

/**
 * Stil seçici listener'ları
 */
function setupStyleSelectorListeners(sidebar) {
    const container = sidebar.container;
    const styleSelectorBtn = container.querySelector('#style-selector-btn');
    const styleDropdown = container.querySelector('#style-dropdown');
    
    if (!styleSelectorBtn || !styleDropdown) return;
    
    styleSelectorBtn.addEventListener('click', () => {
        styleDropdown.classList.toggle('sidebar__style-dropdown--open');
    });

    const styleOptions = styleDropdown.querySelectorAll('.sidebar__style-option');
    styleOptions.forEach(option => {
        option.addEventListener('click', () => {
            const styleId = option.dataset.styleId;
            sidebar.selectStyle(styleId);
            styleDropdown.classList.remove('sidebar__style-dropdown--open');
        });
    });

    // Dropdown dışına tıklayınca kapat
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sidebar__style-selector')) {
            styleDropdown.classList.remove('sidebar__style-dropdown--open');
        }
    });
}

/**
 * Renk seçici listener'ları
 */
function setupColorPickerListeners(sidebar) {
    const colorOptions = sidebar.container.querySelectorAll('.sidebar__color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            const color = option.dataset.color;
            sidebar.selectColor(color);
        });
    });
}

/**
 * Input listener'ları
 */
function setupInputListeners(sidebar) {
    const container = sidebar.container;

    const titleInput = container.querySelector('#point-title');
    const descInput = container.querySelector('#point-description');
    const zoomInput = container.querySelector('#point-zoom');
    const zoomValue = container.querySelector('#point-zoom-value');
    const textContentInput = container.querySelector('#point-text-content');
    const leaderLineInput = container.querySelector('#point-leader-line');

    if (titleInput) {
        titleInput.addEventListener('input', (e) => {
            sidebar.editingPoint.title = e.target.value;
        });
    }

    if (descInput) {
        descInput.addEventListener('input', (e) => {
            sidebar.editingPoint.description = e.target.value;
        });
    }

    if (zoomInput) {
        zoomInput.addEventListener('input', (e) => {
            const zoom = Math.max(1, Math.min(18, parseInt(e.target.value, 10) || 10));
            sidebar.editingPoint.zoom = zoom;
            if (zoomValue) zoomValue.textContent = zoom;
            if (sidebar.onPointZoomPreview) {
                sidebar.onPointZoomPreview(sidebar.editingPoint, zoom);
            }
        });
    }

    if (textContentInput) {
        textContentInput.addEventListener('input', (e) => {
            sidebar.editingPoint.text = e.target.value;
            if (sidebar.editingPoint.drawingType === 'text' && !sidebar.editingPoint.title) {
                sidebar.editingPoint.title = e.target.value.substring(0, 20) || 'Metin';
            }
            if (sidebar.onPointTextPreview) {
                sidebar.onPointTextPreview(sidebar.editingPoint);
            }
        });
    }

    if (leaderLineInput) {
        leaderLineInput.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            sidebar.editingPoint.leaderLine = isChecked;

            if (isChecked) {
                // Eğer ofset sıfır veya tanımlı değilse, kullanıcının belirtme çizgisini 
                // hemen görebilmesi için metni sola (-110px) kaydırıyoruz (uzun kutularda da çizgi görünsün)
                const currentX = sidebar.editingPoint.labelOffsetX;
                const currentY = sidebar.editingPoint.labelOffsetY;
                if (!currentX && !currentY) {
                    sidebar.editingPoint.labelOffsetX = -110;
                    sidebar.editingPoint.labelOffsetY = 0;
                    if (sidebar.editingPoint.marker?._options) {
                        sidebar.editingPoint.marker._options.labelOffsetX = -110;
                        sidebar.editingPoint.marker._options.labelOffsetY = 0;
                    }
                }
            } else {
                // Belirtme çizgisi kapatıldığında metni tekrar merkeze (0, 0) çekiyoruz
                sidebar.editingPoint.labelOffsetX = 0;
                sidebar.editingPoint.labelOffsetY = 0;
                if (sidebar.editingPoint.marker?._options) {
                    sidebar.editingPoint.marker._options.labelOffsetX = 0;
                    sidebar.editingPoint.marker._options.labelOffsetY = 0;
                }
            }

            const styleField = container.querySelector('#leader-line-style-field');
            if (styleField) {
                styleField.style.display = isChecked ? 'block' : 'none';
            }

            if (sidebar.onPointTextPreview) {
                sidebar.onPointTextPreview(sidebar.editingPoint);
            }
        });
    }

    // Rota bilgileri input'ları
    const visitDayInput = container.querySelector('#point-visitday');
    const timestampInput = container.querySelector('#point-timestamp');

    if (visitDayInput) {
        visitDayInput.addEventListener('input', (e) => {
            sidebar.editingPoint.visitDay = parseInt(e.target.value) || 1;
            console.log('[Input] visitDay changed to:', sidebar.editingPoint.visitDay);
        });
    }

    if (timestampInput) {
        timestampInput.addEventListener('input', (e) => {
            sidebar.editingPoint.timestamp = e.target.value;
        });
    }

    // Timeline bilgileri input'ları
    const dateInput = container.querySelector('#point-date');
    const categoryInput = container.querySelector('#point-category');

    if (dateInput) {
        dateInput.addEventListener('input', (e) => {
            sidebar.editingPoint.date = e.target.value;
            console.log('[Input] date changed to:', sidebar.editingPoint.date);
        });
    }

    if (categoryInput) {
        categoryInput.addEventListener('change', (e) => {
            sidebar.editingPoint.category = e.target.value;
            console.log('[Input] category changed to:', sidebar.editingPoint.category);
        });
    }

    const textStyleButtons = container.querySelectorAll('[data-text-style]');
    textStyleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const styleId = button.dataset.textStyle;
            sidebar.editingPoint.textStyle = styleId;
            textStyleButtons.forEach(btn => btn.classList.remove('sidebar__text-style-option--active'));
            button.classList.add('sidebar__text-style-option--active');
            if (sidebar.onPointTextPreview) {
                sidebar.onPointTextPreview(sidebar.editingPoint);
            }
        });
    });


    const leaderStyleButtons = container.querySelectorAll('[data-leader-line-style]');
    leaderStyleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const styleId = button.dataset.leaderLineStyle;
            sidebar.editingPoint.leaderLineStyle = styleId;
            leaderStyleButtons.forEach(btn => btn.classList.remove('sidebar__leader-line-option--active'));
            button.classList.add('sidebar__leader-line-option--active');
            if (sidebar.onPointTextPreview) {
                sidebar.onPointTextPreview(sidebar.editingPoint);
            }
        });
    });
}

/**
 * Detay footer butonları listener'ları
 */
function setupDetailFooterListeners(sidebar) {
    const container = sidebar.container;
    
    const savePointBtn = container.querySelector('#btn-save-point');
    if (savePointBtn) {
        savePointBtn.addEventListener('click', () => sidebar.savePointDetail());
    }

    const deletePointBtn = container.querySelector('#btn-delete-point');
    if (deletePointBtn) {
        deletePointBtn.addEventListener('click', () => {
            if (confirm('Bu noktayı silmek istediğinize emin misiniz?')) {
                sidebar.deleteCurrentPoint();
            }
        });
    }
}
