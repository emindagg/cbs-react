/**
 * Detay görünümü event handler'ları
 */

import { renderMediaItems, renderEmbedItems } from '../renderers/index.js';
import { getEmbedSourceUrl, isEmbedContent, isVideoFile } from '../../../utils/mediaType.js';
import { authManager } from '../../../services/authManager.js';

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
    const photoBtn = container.querySelector('#media-photo-btn');
    const videoBtn = container.querySelector('#media-video-btn');
    const photoInput = container.querySelector('#media-photo-input');
    const videoInput = container.querySelector('#media-video-input');
    
    // Video bağlantısı ekleme elementleri
    const videoLinkBtn = container.querySelector('#media-video-link-btn');
    const linkInputContainer = container.querySelector('#media-link-input-container');
    const linkInput = container.querySelector('#media-video-link-input');
    const linkSubmitBtn = container.querySelector('#media-video-link-submit');
    const linkCancelBtn = container.querySelector('#media-video-link-cancel');

    const embedBtn = container.querySelector('#media-embed-btn');
    const embedInputContainer = container.querySelector('#embed-input-container');
    const embedTitleInput = container.querySelector('#embed-title-input');
    const embedUrlInput = container.querySelector('#embed-url-input');
    const embedSubmitBtn = container.querySelector('#embed-submit');
    const embedCancelBtn = container.querySelector('#embed-cancel');
    
    setupMediaItemListeners(sidebar, container);
    setupEmbedItemListeners(sidebar, container);

    if (!mediaUploadArea || !photoInput || !videoInput) return;
    
    if (photoBtn) {
        photoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            photoInput.click();
        });
    }

    if (embedBtn && embedInputContainer && !authManager.isStudent()) {
        embedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = embedInputContainer.style.display === 'none';
            embedInputContainer.style.display = isHidden ? 'block' : 'none';
            if (isHidden && embedUrlInput) {
                embedUrlInput.focus();
            }
        });
    }

    if (embedCancelBtn && embedInputContainer && !authManager.isStudent()) {
        embedCancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            embedInputContainer.style.display = 'none';
            if (embedTitleInput) embedTitleInput.value = '';
            if (embedUrlInput) embedUrlInput.value = '';
        });
    }

    if (embedSubmitBtn && embedUrlInput && embedInputContainer && !authManager.isStudent()) {
        embedSubmitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rawInput = embedUrlInput.value.trim();
            const sourceUrl = getEmbedSourceUrl(rawInput);

            if (!sourceUrl) {
                alert('Lütfen bir yerleştirme bağlantısı veya iframe kodu giriniz!');
                return;
            }

            const embedItem = {
                type: 'embed',
                url: sourceUrl,
                title: embedTitleInput?.value.trim() || 'Yerleştirme',
                caption: '',
                source: 'embed'
            };

            if (!isEmbedContent(embedItem)) {
                alert('Lütfen geçerli bir http/https yerleştirme bağlantısı giriniz. Doğrudan dosya bağlantıları yerleştirme olarak eklenemez.');
                return;
            }

            if (!sidebar.editingPoint.embeds) {
                sidebar.editingPoint.embeds = [];
            }

            sidebar.editingPoint.embeds.push(embedItem);
            if (embedTitleInput) embedTitleInput.value = '';
            embedUrlInput.value = '';
            embedInputContainer.style.display = 'none';
            updateEmbedGrid(sidebar);
        });

        embedUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                embedSubmitBtn.click();
            }
        });
    }

    if (videoBtn) {
        videoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            videoInput.click();
        });
    }

    // Video Bağlantısı Ekle butonu ve formu
    if (videoLinkBtn && linkInputContainer) {
        videoLinkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = linkInputContainer.style.display === 'none';
            linkInputContainer.style.display = isHidden ? 'block' : 'none';
            if (isHidden) {
                if (mediaUploadArea) {
                    mediaUploadArea.classList.add('sidebar__media-upload--link-active');
                }
                if (linkInput) {
                    setTimeout(() => linkInput.focus(), 50);
                }
            } else {
                if (mediaUploadArea) {
                    mediaUploadArea.classList.remove('sidebar__media-upload--link-active');
                }
            }
        });
    }

    if (linkCancelBtn && linkInputContainer) {
        linkCancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            linkInputContainer.style.display = 'none';
            if (mediaUploadArea) {
                mediaUploadArea.classList.remove('sidebar__media-upload--link-active');
            }
            if (linkInput) linkInput.value = '';
        });
    }

    if (linkSubmitBtn && linkInput && linkInputContainer) {
        linkSubmitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let link = linkInput.value.trim();
            if (!link) {
                alert('Lütfen bir video bağlantısı giriniz!');
                return;
            }

            // Protokol (http:// veya https://) eksikse otomatik olarak ekle
            if (!/^https?:\/\//i.test(link)) {
                link = 'https://' + link;
            }

            try {
                // Basit URL kontrolü
                new URL(link);
                
                if (!sidebar.editingPoint.media) {
                    sidebar.editingPoint.media = [];
                }

                sidebar.editingPoint.media.push({
                    type: 'video',
                    url: link,
                    name: 'Video Bağlantısı',
                    caption: '',
                    source: 'link'
                });

                linkInput.value = '';
                linkInputContainer.style.display = 'none';
                if (mediaUploadArea) {
                    mediaUploadArea.classList.remove('sidebar__media-upload--link-active');
                }
                updateMediaGrid(sidebar);
            } catch (err) {
                alert('Lütfen geçerli bir internet adresi (URL) giriniz!');
            }
        });

        // Enter tuşu ile de eklenebilsin
        linkInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                linkSubmitBtn.click();
            }
        });
    }
    
    photoInput.addEventListener('change', (e) => {
        handleMediaUpload(sidebar, e.target.files);
        e.target.value = '';
    });

    videoInput.addEventListener('change', (e) => {
        handleMediaUpload(sidebar, e.target.files);
        e.target.value = '';
    });

    // Drag & drop
    if (sidebar.mediaManager) {
        sidebar.mediaManager.setupDragDrop(mediaUploadArea, (files) => {
            handleMediaUpload(sidebar, files);
        });
    }

}

/**
 * Yerleştirme bloğu listener'ları
 */
function setupEmbedItemListeners(sidebar, root) {
    if (authManager.isStudent()) return;

    const embedRemoveBtns = root.querySelectorAll('.sidebar__embed-remove');
    embedRemoveBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.embedIndex, 10);
            removeEmbed(sidebar, index);
        });
    });

    const titleInputs = root.querySelectorAll('.sidebar__embed-title-input');
    titleInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const index = parseInt(input.dataset.embedIndex, 10);
            if (sidebar.editingPoint.embeds && sidebar.editingPoint.embeds[index]) {
                sidebar.editingPoint.embeds[index].title = e.target.value;
            }
        });
    });

    const urlInputs = root.querySelectorAll('.sidebar__embed-url');
    urlInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(input.dataset.embedIndex, 10);
            const sourceUrl = getEmbedSourceUrl(e.target.value.trim());
            const embedItem = {
                ...(sidebar.editingPoint.embeds?.[index] || {}),
                type: 'embed',
                url: sourceUrl
            };

            if (!isEmbedContent(embedItem)) {
                alert('Lütfen geçerli bir http/https yerleştirme bağlantısı giriniz.');
                e.target.value = sidebar.editingPoint.embeds?.[index]?.url || '';
                return;
            }

            if (sidebar.editingPoint.embeds && sidebar.editingPoint.embeds[index]) {
                sidebar.editingPoint.embeds[index].url = sourceUrl;
                updateEmbedGrid(sidebar);
            }
        });
    });
}

/**
 * Medya kartı listener'ları
 */
function setupMediaItemListeners(sidebar, root) {
    if (!root) return;
    if (root._hasMediaItemListeners) return;
    root._hasMediaItemListeners = true;

    // Lightbox, silme ve açıklama düzenleme (kalem) için tek bir click delegasyonu
    root.addEventListener('click', (e) => {
        // 1. Açıklama düzenleme (kalem) butonu tıklandıysa
        const editBtn = e.target.closest('.sidebar__media-edit-caption');
        if (editBtn) {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(editBtn.dataset.mediaIndex, 10);
            const captionInput = root.querySelector(`.sidebar__media-caption[data-media-index="${index}"]`);
            if (captionInput) {
                captionInput.focus();
                // İmleci metnin sonuna almak için
                const val = captionInput.value;
                captionInput.value = '';
                captionInput.value = val;
            }
            return;
        }

        // 2. Medya silme (çarpı) butonu tıklandıysa
        const removeBtn = e.target.closest('.sidebar__media-remove');
        if (removeBtn) {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(removeBtn.dataset.mediaIndex, 10);
            removeMedia(sidebar, index);
            return;
        }

        // 3. Medya önizleme (lightbox) tıklandıysa (butonlar harici)
        const preview = e.target.closest('[data-media-preview]');
        if (preview && !e.target.closest('.sidebar__media-remove') && !e.target.closest('.sidebar__media-edit-caption')) {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(preview.dataset.mediaPreview, 10);
            if (sidebar.lightbox && sidebar.editingPoint?.media?.[index]) {
                sidebar.lightbox.open(sidebar.editingPoint.media, index);
            }
        }
    });

    // Medya açıklama (caption) girdileri için input olay delegasyonu
    root.addEventListener('input', (e) => {
        const input = e.target.closest('.sidebar__media-caption');
        if (input) {
            const index = parseInt(input.dataset.mediaIndex, 10);
            if (sidebar.editingPoint.media && sidebar.editingPoint.media[index]) {
                sidebar.editingPoint.media[index].caption = input.value;
            }
        }
    });
}

/**
 * Medya yükleme işleyici - MediaManager üzerinden yükler
 */
async function handleMediaUpload(sidebar, files) {
    if (!files || files.length === 0) return;

    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo', 'video/webm'];
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB limit (fotoğraflar için)
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB limit (videolar için - backend sınırı 50MB)
    const filesArray = Array.from(files);

    // Dosya formatı kontrolü - sadece resim ve video kabul et
    const invalidFiles = filesArray.filter(f => !ALLOWED_IMAGE_TYPES.includes(f.type) && !ALLOWED_VIDEO_TYPES.includes(f.type) && !isVideoFile(f));
    if (invalidFiles.length > 0) {
        alert(`Desteklenmeyen dosya formatı!\n\nKabul edilen fotoğraf formatları: JPG, PNG, GIF, WebP, SVG, BMP\nKabul edilen video formatları: MP4, MOV, MKV, AVI, WEBM\n\nGeçersiz dosyalar: ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
    }

    // Dosya boyutu kontrolü
    const oversizedFiles = filesArray.filter(f => {
        const isVideo = isVideoFile(f);
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        return f.size > maxSize;
    });
    if (oversizedFiles.length > 0) {
        alert(`Bazı dosyalar çok büyük!\nResimler için maksimum: 10MB\nVideolar için maksimum: 50MB\nBüyük dosyalar: ${oversizedFiles.map(f => f.name).join(', ')}`);
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
        });
    } else {
        // Fallback: MediaManager yoksa base64 kullan (IndexedDB mode)
        let loadedCount = 0;
        filesArray.forEach((file, index) => {
            setTimeout(() => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const mediaItem = {
                        type: isVideoFile(file) ? 'video' : 'image',
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
 * Yerleştirme bloğu silme işleyici
 */
function removeEmbed(sidebar, index) {
    if (authManager.isStudent()) return;

    if (sidebar.editingPoint.embeds && sidebar.editingPoint.embeds[index]) {
        sidebar.editingPoint.embeds.splice(index, 1);
        updateEmbedGrid(sidebar);
    }
}

/**
 * Medya grid'ini günceller
 */
function updateMediaGrid(sidebar) {
    const mediaGrid = sidebar.container.querySelector('#media-grid');
    if (!mediaGrid) return;
    
    mediaGrid.innerHTML = renderMediaItems(sidebar.editingPoint.media);
    setupMediaItemListeners(sidebar, mediaGrid);

    // Sağ taraftaki detay paneli açıksa ve düzenlenen noktayı gösteriyorsa anında güncelle
    if (sidebar.detailPanel && sidebar.detailPanel.isOpen && sidebar.editingPoint) {
        const pointIndex = sidebar.pointManager.findPointIndex(sidebar.editingPoint.originalId);
        if (sidebar.detailPanel.pointIndex === pointIndex) {
            sidebar.detailPanel.point.media = sidebar.editingPoint.media;
            sidebar.detailPanel.render();
        }
    }
}

/**
 * Yerleştirme grid'ini günceller
 */
function updateEmbedGrid(sidebar) {
    const embedGrid = sidebar.container.querySelector('#embed-grid');
    if (!embedGrid) return;

    const canEdit = !sidebar.viewMode && !authManager.isStudent();
    embedGrid.innerHTML = renderEmbedItems(sidebar.editingPoint.embeds || [], { canEdit });
    setupEmbedItemListeners(sidebar, embedGrid);

    // Sağ taraftaki detay paneli açıksa ve düzenlenen noktayı gösteriyorsa anında güncelle
    if (sidebar.detailPanel && sidebar.detailPanel.isOpen && sidebar.editingPoint) {
        const pointIndex = sidebar.pointManager.findPointIndex(sidebar.editingPoint.originalId);
        if (sidebar.detailPanel.pointIndex === pointIndex) {
            sidebar.detailPanel.point.embeds = sidebar.editingPoint.embeds;
            sidebar.detailPanel.render();
        }
    }
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
            const zoom = Math.max(1, Math.min(18, parseInt(e.target.value, 10) || 12));
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
