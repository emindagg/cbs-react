/**
 * Liste görünümü event handler'ları
 */

export function setupListViewListeners(sidebar) {
    const container = sidebar.container;
    
    // Toggle button
    const toggleBtn = container.querySelector('#sidebar-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.toggle();
        });
    }

    // Tab buttons
    const tabBtns = container.querySelectorAll('.sidebar__tab');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab === 'settings') {
                sidebar.currentView = 'settings';
                sidebar.render();
            } else {
                sidebar.currentView = 'list';
                sidebar.render();
            }
        });
    });

    // Şablon tipine göre listener ayarla
    const isPointTemplate = sidebar.data.templateName === 'Nokta Eklenen';
    const isRouteTemplate = sidebar.data.templateName === 'Rota Bazlı';
    const isTimelineTemplate = sidebar.data.templateName === 'Timeline Bazlı';
    const isStoryMapTemplate = sidebar.data.templateName === 'Hikâye Haritası';

    if (isTimelineTemplate) {
        setupTimelineListeners(sidebar);
    } else if (isPointTemplate || isRouteTemplate || isStoryMapTemplate) {
        setupPointListeners(sidebar);
    } else {
        setupStepListeners(sidebar);
    }

    // Footer buttons
    setupFooterListeners(sidebar);
}

/**
 * Nokta listesi listener'ları
 */
function setupPointListeners(sidebar) {
    // Minimal design için
    const minimalItems = sidebar.container.querySelectorAll('.sidebar__point-item-minimal');
    minimalItems.forEach((item) => {
        // Nokta içeriğine tıklama (focus)
        const pointContent = item.querySelector('.sidebar__point-content-minimal[data-action="focus"]');
        if (pointContent) {
            pointContent.addEventListener('click', (e) => {
                e.stopPropagation();
                const pointId = item.dataset.pointId;
                sidebar.handlePointAction('focus', pointId);
            });
        }

        // Minimal butonlar
        const minimalBtn = item.querySelector('.sidebar__point-btn-minimal');
        if (minimalBtn) {
            minimalBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = minimalBtn.dataset.action;
                const pointId = item.dataset.pointId;
                sidebar.handlePointAction(action, pointId);
            });
        }
    });

    // Eski tasarım için (backward compatibility)
    const pointItems = sidebar.container.querySelectorAll('.sidebar__point-item:not(.sidebar__point-item-minimal)');
    pointItems.forEach((item) => {
        // Nokta içeriğine tıklama (focus)
        const pointContent = item.querySelector('.sidebar__point-content[data-action="focus"]');
        if (pointContent) {
            pointContent.addEventListener('click', (e) => {
                e.stopPropagation();
                const pointId = item.dataset.pointId;
                sidebar.handlePointAction('focus', pointId);
            });
        }

        // Aksiyon butonları
        const actionBtns = item.querySelectorAll('.sidebar__point-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const pointId = item.dataset.pointId;
                sidebar.handlePointAction(action, pointId);
            });
        });
    });

    // Point Playback Controls
    setupPointPlaybackControls(sidebar);
}

/**
 * Point template otomatik oynatma kontrollerini kur
 */
function setupPointPlaybackControls(sidebar) {
    const container = sidebar.container;
    const playbackToggle = container.querySelector('#point-playback-toggle');
    const speedButtons = container.querySelectorAll('.point-playback__speed-btn');

    if (playbackToggle) {
        playbackToggle.addEventListener('click', () => {
            const isPlaying = playbackToggle.getAttribute('data-playing') === 'true';

            if (isPlaying) {
                // Durdur
                if (sidebar.onPointPlaybackStop) {
                    sidebar.onPointPlaybackStop();
                }
                playbackToggle.setAttribute('data-playing', 'false');
                playbackToggle.innerHTML = '<i class="fa-solid fa-play"></i>';
                playbackToggle.title = 'Otomatik Oynat';
            } else {
                // Başlat
                if (sidebar.onPointPlaybackStart) {
                    sidebar.onPointPlaybackStart();
                }
                playbackToggle.setAttribute('data-playing', 'true');
                playbackToggle.innerHTML = '<i class="fa-solid fa-pause"></i>';
                playbackToggle.title = 'Duraklat';
            }
        });
    }

    if (speedButtons.length > 0) {
        speedButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const speed = parseFloat(btn.dataset.speed);

                // Aktif durumu güncelle
                speedButtons.forEach(b => b.classList.remove('point-playback__speed-btn--active'));
                btn.classList.add('point-playback__speed-btn--active');

                // Hız değiştiğinde callback çağır
                if (sidebar.onPointPlaybackSpeedChange) {
                    sidebar.onPointPlaybackSpeedChange(speed);
                }
            });
        });
    }
}

/**
 * Timeline listener'ları
 */
function setupTimelineListeners(sidebar) {
    const container = sidebar.container;

    // Timeline event items
    const eventItems = container.querySelectorAll('.timeline__event-item');
    eventItems.forEach((item) => {
        const eventId = item.dataset.eventId;

        // Event header ve body'ye tıklama (focus)
        const focusElements = item.querySelectorAll('[data-action="focus"]');
        focusElements.forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.handlePointAction('focus', eventId);
            });
        });

        // Detail button
        const detailBtn = item.querySelector('[data-action="openDetail"]');
        if (detailBtn) {
            detailBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.handlePointAction('openDetail', eventId);
            });
        }
    });

    // Playback controls
    const playbackStartBtn = container.querySelector('[data-action="playback-start"]');
    const playbackStopBtn = container.querySelector('[data-action="playback-stop"]');
    const nextEventBtn = container.querySelector('[data-action="next-event"]');
    const prevEventBtn = container.querySelector('[data-action="previous-event"]');

    if (playbackStartBtn) {
        playbackStartBtn.addEventListener('click', () => {
            if (sidebar.onTimelinePlaybackStart) {
                sidebar.onTimelinePlaybackStart();
                playbackStartBtn.disabled = true;
                if (playbackStopBtn) playbackStopBtn.disabled = false;
            }
        });
    }

    if (playbackStopBtn) {
        playbackStopBtn.addEventListener('click', () => {
            if (sidebar.onTimelinePlaybackStop) {
                sidebar.onTimelinePlaybackStop();
                playbackStopBtn.disabled = true;
                if (playbackStartBtn) playbackStartBtn.disabled = false;
            }
        });
    }

    if (nextEventBtn) {
        nextEventBtn.addEventListener('click', () => {
            if (sidebar.onTimelineNextEvent) {
                sidebar.onTimelineNextEvent();
            }
        });
    }

    if (prevEventBtn) {
        prevEventBtn.addEventListener('click', () => {
            if (sidebar.onTimelinePreviousEvent) {
                sidebar.onTimelinePreviousEvent();
            }
        });
    }

    // Filter controls (if present)
    const clearFiltersBtn = container.querySelector('[data-action="clear-filters"]');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (sidebar.onTimelineClearFilters) {
                sidebar.onTimelineClearFilters();
            }
        });
    }

    const categoryCheckboxes = container.querySelectorAll('[data-action="filter-category"]');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (sidebar.onTimelineFilterCategory) {
                const selectedCategories = Array.from(categoryCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                sidebar.onTimelineFilterCategory(selectedCategories);
            }
        });
    });

    // TimelineJS yenileme butonu
    const refreshTimelineBtn = container.querySelector('[data-action="refresh-timelinejs"]');
    if (refreshTimelineBtn) {
        refreshTimelineBtn.addEventListener('click', () => {
            console.log('[Timeline] Refresh button clicked');
            if (sidebar.onRefreshTimelineJS) {
                sidebar.onRefreshTimelineJS();
            }
        });
    }
}

/**
 * Adım listesi listener'ları
 */
function setupStepListeners(sidebar) {
    const stepItems = sidebar.container.querySelectorAll('.sidebar__step-item');
    stepItems.forEach((item) => {
        const actionBtns = item.querySelectorAll('.sidebar__step-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const stepId = item.dataset.stepId;
                sidebar.handleStepAction(action, stepId);
            });
        });
    });
}

/**
 * Footer butonları listener'ları
 */
function setupFooterListeners(sidebar) {
    const container = sidebar.container;

    const saveBtn = container.querySelector('#btn-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (sidebar.onSave) sidebar.onSave();
        });
    }

    const exportBtn = container.querySelector('#btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (sidebar.onExport) sidebar.onExport();
        });
    }

    const storyMapViewBtn = container.querySelector('#btn-storymap-view');
    if (storyMapViewBtn) {
        storyMapViewBtn.addEventListener('click', () => {
            if (sidebar.onStoryMapView) {
                sidebar.onStoryMapView();
            }
        });
    }
}
