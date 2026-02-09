/**
 * UI Panels Initialization Module
 * Handles sidebar, tools panel, basemap panel, and astro panel initialization
 * Part of the modularized initialization system
 */

/**
 * Initialize UI panels and their controls
 * Sets up: sidebar, tools panel, basemap panel, astro panel
 */
function initializeUIPanels() {
    // Note: We query elements dynamically when needed (in functions) instead of caching them here
    const mapControls = document.getElementById('map-control-container');

    const toggleBasemapBtn = document.getElementById('toggle-basemap-button');
    const basemapPanel = document.getElementById('basemap-panel');
    const toggleAstroBtn = document.getElementById('toggle-astro-button');
    const astroPanel = document.getElementById('astro-panel');

    const SIDEBAR_STATE_KEY = 'ui.sidebar.open';

    function positionControls() {
        if (!mapControls) return;

        // Query sidebar dynamically (may be rendered after initialization)
        const sidebar = document.getElementById('sidebar');
        const sidebarVisible = sidebar && !isElementHidden(sidebar);
        const isMdUp = window.matchMedia('(min-width: 768px)').matches;

        const coordinateDisplay = document.getElementById('coordinate-display');
        const labelFab = document.getElementById('label-fab');
        const searchContainer = document.getElementById('search-container');

        // Sidebar genişliğini hesapla (kapalıyken 0, açıkken gerçek genişlik)
        let sidebarWidth = 0;
        if (sidebar) {
            if (sidebarVisible && isMdUp) {
                sidebarWidth = sidebar.offsetWidth || 288; // Varsayılan genişlik
            } else {
                sidebarWidth = 0; // Kapalıyken genişlik 0
            }
        }

        // Sidebar kapalıyken kontrolleri 0.6rem (9.6px) konumuna koy, açıkken sidebar'ın sağına
        const spacing = sidebarWidth > 0 ? 16 : 9.6; // Sidebar açıkken 16px, kapalıyken 0.6rem
        mapControls.style.left = `${sidebarWidth + spacing}px`;

        // basemapPanel artık butonun yanında dinamik konumlandırılıyor, positionControls'da ayarlamıyoruz

        if (astroPanel) {
            astroPanel.style.left = `${sidebarWidth + spacing}px`;
            astroPanel.style.top = '20rem';
        }

        if (coordinateDisplay) {
            coordinateDisplay.style.left = `${sidebarWidth + spacing}px`;
        }

        if (labelFab) {
            labelFab.style.left = `${sidebarWidth + spacing}px`;
        }

        // Arama çubuğunu hamburger menünün yanına konumlandır (40px hamburger + 8px gap)
        if (searchContainer) {
            const hamburgerWidth = 40; // control-button genişliği
            const searchGap = 8; // Hamburger ile arama arasındaki boşluk
            searchContainer.style.left = `${sidebarWidth + spacing + hamburgerWidth + searchGap}px`;
        }
    }

    window.positionControls = positionControls;

    // IDs of buttons to fade when sidebar is open on mobile
    const MOBILE_FADE_BUTTON_IDS = [
        'open-tools',
        'storymap-toggle-btn',
        'globe-toggle-btn',
        'layers-toggle-btn',
        'geocoder-toggle-btn',
        'zoom-in-button',
        'zoom-out-button',
        'toggle-basemap-button',
        'toggle-astro-button'
    ];

    // Helper to fade out/in mobile controls
    function setMobileControlsVisibility(visible) {
        MOBILE_FADE_BUTTON_IDS.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.transition = 'opacity 0.3s ease-in-out';
                element.style.opacity = visible ? '1' : '0';
                element.style.pointerEvents = visible ? 'auto' : 'none';
            }
        });
        // Also fade the zoom control container
        const zoomControl = document.querySelector('.zoom-control-custom');
        if (zoomControl) {
            zoomControl.style.transition = 'opacity 0.3s ease-in-out';
            zoomControl.style.opacity = visible ? '1' : '0';
            zoomControl.style.pointerEvents = visible ? 'auto' : 'none';
        }
    }

    function openSidebarPanel() {
        const sidebarElement = document.getElementById('sidebar');
        if (!sidebarElement) return;
        const isMdUp = window.matchMedia('(min-width: 768px)').matches;

        // Reset display and remove hidden first
        sidebarElement.classList.remove('hidden');
        sidebarElement.style.display = 'flex';

        // Trigger animation after a small delay to ensure display:flex is registered
        setTimeout(() => {
            sidebarElement.classList.add('active');
            if (!isMdUp) {
                setMobileControlsVisibility(false); // Fade out controls
            }
        }, 10);

        // Update aria-expanded attribute (query fresh in case button was added dynamically)
        const openSidebarBtn = document.getElementById('open-sidebar');
        if (openSidebarBtn) {
            openSidebarBtn.setAttribute('aria-expanded', 'true');
        }

        positionControls();
        setTimeout(() => {
            if (window.map && typeof window.map.resize === 'function') {
                window.map.resize();
            }
        }, 100);
    }

    function closeSidebarPanel() {
        const sidebarElement = document.getElementById('sidebar');
        if (!sidebarElement) return;
        const isMdUp = window.matchMedia('(min-width: 768px)').matches;

        // Update aria-expanded attribute (query fresh in case button was added dynamically)
        const openSidebarBtn = document.getElementById('open-sidebar');
        if (openSidebarBtn) {
            openSidebarBtn.setAttribute('aria-expanded', 'false');
        }

        // Remove active class to trigger slide-out animation
        sidebarElement.classList.remove('active');

        if (!isMdUp) {
            setMobileControlsVisibility(true); // Fade in controls

            const handleTransitionEnd = () => {
                // Only hide if it's still supposed to be closed
                if (!sidebarElement.classList.contains('active')) {
                    sidebarElement.classList.add('hidden');
                    sidebarElement.style.display = 'none';
                }
                sidebarElement.removeEventListener('transitionend', handleTransitionEnd);
            };
            sidebarElement.addEventListener('transitionend', handleTransitionEnd, { once: true });

            // Fallback: if transition doesn't fire, hide after timeout
            setTimeout(() => {
                if (!sidebarElement.classList.contains('active')) {
                    sidebarElement.style.display = 'none';
                    sidebarElement.classList.add('hidden');
                }
            }, 350);
        } else {
            sidebarElement.classList.add('hidden');
            sidebarElement.style.display = 'none';
        }

        positionControls();
        setTimeout(() => {
            if (window.map && typeof window.map.resize === 'function') {
                window.map.resize();
            }
        }, 100);
    }

    function openToolsPanel() {
        const toolsPanelElement = document.getElementById('tools-panel');
        if (!toolsPanelElement) return;

        // MUTEX: Close Layer Style Panel if open
        if (window.layerStylePanel && window.layerStylePanel.isVisible) {
            window.layerStylePanel.hidePanel();
        }

        toolsPanelElement.classList.remove('hidden');
        toolsPanelElement.style.display = 'block';

        // Update aria-expanded attribute (query fresh in case button was added dynamically)
        const openToolsBtn = document.getElementById('open-tools');
        if (openToolsBtn) {
            openToolsBtn.setAttribute('aria-expanded', 'true');
        }
    }

    function closeToolsPanel() {
        const toolsPanelElement = document.getElementById('tools-panel');
        if (!toolsPanelElement) return;
        toolsPanelElement.classList.add('hidden');
        toolsPanelElement.style.display = 'none';

        // Update aria-expanded attribute (query fresh in case button was added dynamically)
        const openToolsBtn = document.getElementById('open-tools');
        if (openToolsBtn) {
            openToolsBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // Export to window for cross-panel communication
    window.openToolsPanel = openToolsPanel;
    window.closeToolsPanel = closeToolsPanel;

    // Use event delegation to handle sidebar toggle (more reliable for dynamic content)
    document.addEventListener('click', function (e) {
        const target = e.target.closest('#open-sidebar');
        if (target) {
            const sidebarElement = document.getElementById('sidebar');
            if (sidebarElement && isElementHidden(sidebarElement)) {
                openSidebarPanel();
                setStorageItem(SIDEBAR_STATE_KEY, '1');
            } else if (sidebarElement) {
                closeSidebarPanel();
                setStorageItem(SIDEBAR_STATE_KEY, '0');
            }
        }
    });

    try {
        const isMdUp = window.matchMedia('(min-width: 768px)').matches;

        // On mobile, always start with sidebar closed (ignore localStorage)
        if (!isMdUp) {
            closeSidebarPanel();
        } else {
            // On desktop, respect localStorage state
            const sidebarState = getStorageItem(SIDEBAR_STATE_KEY);
            if (sidebarState === '1') { openSidebarPanel(); }
            if (sidebarState === '0') { closeSidebarPanel(); }
        }

        // İlk yüklemede kontrolleri konumlandır
        positionControls();

        // Her açılışta tools panel kapalı başlar (localStorage kullanılmaz)
        closeToolsPanel();
        // Sidebar render edildikten sonra kontrolleri konumlandır
        setTimeout(() => {
            positionControls();
        }, 100);
    } catch (e) {
        // localStorage erişimine izin yoksa sessiz geç
        // Yine de kontrolleri konumlandırmayı dene
        setTimeout(() => {
            positionControls();
        }, 100);
    }

    // Use event delegation for tools panel toggle as well
    document.addEventListener('click', function (e) {
        const target = e.target.closest('#open-tools');
        if (target) {
            const toolsPanelElement = document.getElementById('tools-panel');
            if (toolsPanelElement && isElementHidden(toolsPanelElement)) {
                openToolsPanel();
            } else if (toolsPanelElement) {
                closeToolsPanel();
            }
        }
    });

    setTimeout(positionControls, 50);

    // Altlık Harita Paneli
    if (toggleBasemapBtn && basemapPanel) {
        toggleBasemapBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            if (basemapPanel.classList.contains('hidden')) {
                const fabMenu = document.getElementById('fab-menu');
                if (fabMenu) {
                    fabMenu.style.display = 'none';
                }

                // Astronomi panelini kapat
                if (astroPanel && !astroPanel.classList.contains('hidden')) {
                    astroPanel.classList.add('hidden');
                }

                // Katman panelini kapat (ikisi aynı anda açık olmasın)
                const layersPanel = document.getElementById('layers-panel');
                const layersToggleBtn = document.getElementById('layers-toggle-btn');
                if (layersPanel && layersPanel.style.display !== 'none') {
                    layersPanel.style.display = 'none';
                    if (layersToggleBtn) {
                        layersToggleBtn.classList.remove('active');
                    }
                    // layerPanel.isOpen durumunu güncelle
                    if (window.layerPanel) {
                        window.layerPanel.isOpen = false;
                    }
                }

                // Paneli butonun hemen sağında konumlandır
                const btnRect = toggleBasemapBtn.getBoundingClientRect();
                basemapPanel.style.top = `${btnRect.top}px`;
                basemapPanel.style.left = `${btnRect.right + 8}px`;
            }

            basemapPanel.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!basemapPanel.classList.contains('hidden') &&
                !basemapPanel.contains(e.target) &&
                e.target !== toggleBasemapBtn &&
                !toggleBasemapBtn.contains(e.target)) {
                basemapPanel.classList.add('hidden');
            }
        });
    }

    // Astronomi Paneli
    console.log('🔍 Astro panel init:', { toggleAstroBtn, astroPanel });
    if (toggleAstroBtn && astroPanel) {
        toggleAstroBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🌟 Astro button clicked, panel hidden:', astroPanel.classList.contains('hidden'));

            if (astroPanel.classList.contains('hidden')) {
                const fabMenu = document.getElementById('fab-menu');
                const basemapPanel = document.getElementById('basemap-panel');
                if (fabMenu) fabMenu.style.display = 'none';
                if (basemapPanel) basemapPanel.classList.add('hidden');
            }

            astroPanel.classList.toggle('hidden');
            console.log('🌟 After toggle, panel hidden:', astroPanel.classList.contains('hidden'));
        });

        document.addEventListener('click', (e) => {
            if (!astroPanel.classList.contains('hidden') &&
                !astroPanel.contains(e.target) &&
                e.target !== toggleAstroBtn &&
                !toggleAstroBtn.contains(e.target)) {
                astroPanel.classList.add('hidden');
            }
        });
    } else {
        console.error('❌ Astro panel elements not found!', { toggleAstroBtn, astroPanel });
    }

    // Add window resize listener to reposition controls
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(positionControls, 100);
    });

    // Additional delayed positionControls calls to catch late rendering
    // This fixes race condition where sidebar renders after initial positionControls
    setTimeout(positionControls, 200);
    setTimeout(positionControls, 500);
    setTimeout(positionControls, 1000);
    setTimeout(positionControls, 3000);

    // Also call positionControls when map finishes loading
    if (window.map && typeof window.map.on === 'function') {
        window.map.on('load', positionControls);
    }

    if (window.Logger && typeof window.Logger.log === 'function') {
        window.Logger.log('✅ UI panels initialized');
    } else {
        console.log('✅ UI panels initialized');
    }
}

// Make it globally available
window.initializeUIPanels = initializeUIPanels;
