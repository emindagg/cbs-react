/**
 * Ayarlar görünümü event handler'ları
 */

export function setupSettingsListeners(sidebar) {
    const container = sidebar.container;
    
    // Toggle button
    const toggleBtn = container.querySelector('#sidebar-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => sidebar.toggle());
    }

    // Tab buttons
    const tabBtns = container.querySelectorAll('.sidebar__tab');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab === 'settings') {
                sidebar.currentView = 'settings';
            } else {
                sidebar.currentView = 'list';
            }
            sidebar.render();
        });
    });

    // Basemap selector
    setupBasemapSelector(sidebar);

    // Configuration checkboxes
    setupConfigListeners(sidebar);

    // Footer buttons
    setupFooterListeners(sidebar);
}

/**
 * Altlık harita seçici listener'ları
 */
function setupBasemapSelector(sidebar) {
    const container = sidebar.container;
    const basemapSelectorBtn = container.querySelector('#basemap-selector-btn');
    const basemapDropdown = container.querySelector('#basemap-dropdown');
    
    if (!basemapSelectorBtn || !basemapDropdown) return;
    
    basemapSelectorBtn.addEventListener('click', () => {
        basemapDropdown.classList.toggle('sidebar__basemap-dropdown--open');
    });

    const basemapOptions = basemapDropdown.querySelectorAll('.sidebar__basemap-option');
    basemapOptions.forEach(option => {
        option.addEventListener('click', () => {
            const basemapId = option.dataset.basemapId;
            sidebar.mapSettings.selectedBasemap = basemapId;
            basemapDropdown.classList.remove('sidebar__basemap-dropdown--open');
            
            if (sidebar.onBasemapChange) {
                sidebar.onBasemapChange(basemapId);
            }
            
            sidebar.render();
        });
    });

    // Dropdown dışına tıklayınca kapat
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sidebar__basemap-selector')) {
            basemapDropdown.classList.remove('sidebar__basemap-dropdown--open');
        }
    });
}

/**
 * Yapılandırma checkbox'ları listener'ları
 */
function setupConfigListeners(sidebar) {
    const container = sidebar.container;
    
    const configNavigation = container.querySelector('#config-navigation');
    if (configNavigation) {
        configNavigation.addEventListener('change', (e) => {
            sidebar.mapSettings.allowNavigation = e.target.checked;
            if (sidebar.onNavigationChange) sidebar.onNavigationChange(e.target.checked);
        });
    }

    const configSearch = container.querySelector('#config-search');
    if (configSearch) {
        configSearch.addEventListener('change', (e) => {
            sidebar.mapSettings.showSearch = e.target.checked;
            if (sidebar.onSearchChange) sidebar.onSearchChange(e.target.checked);
        });
    }
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
}
