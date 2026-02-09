/**
 * Tools Event Handlers Module
 * Handles tools panel operations and keyboard shortcuts
 * Part of the modularized EventHandlers system
 */

class ToolsEventHandlers {
    constructor(config) {
        this.map = config.map;
    }

    initialize() {
        this.setupToolsPanelHandlers();
        this.setupKeyboardHandlers();
    }

    setupToolsPanelHandlers() {
        // Tool checkboxes
        const toolMeasurement = document.getElementById('tool-measurement');
        const toolAnalysis = document.getElementById('tool-analysis');
        const toolTimeline = document.getElementById('tool-timeline');

        // Timeline kontrolü
        if (toolTimeline) {
            toolTimeline.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (window.timelineManager) {
                        window.timelineManager.show();
                        if (typeof showEducationalFeedback === 'function') {
                            showEducationalFeedback('🕐 Zaman Çizelgesi aktif! Veri eklerken tarih bilgisi ekleyerek zaman tabanlı analiz yapabilirsiniz.');
                        }
                    }
                } else {
                    if (window.timelineManager) {
                        window.timelineManager.hide();
                    }
                }
            });
        }

        if (toolMeasurement) {
            toolMeasurement.addEventListener('change', function() {
                const distanceBtn = document.getElementById('measure-distance');
                const areaBtn = document.getElementById('measure-area');

                if (this.checked) {
                    distanceBtn.classList.add('active');
                    areaBtn.classList.add('active');
                    updateToolsMessage();
                    if (typeof showEducationalFeedback === 'function') {
                        showEducationalFeedback('📏 Ölçüm Araçları aktif! Sağ üst köşedeki CBS Araçları panelinden mesafe ve alan ölçümü yapabilirsiniz.');
                    }
                } else {
                    distanceBtn.classList.remove('active');
                    areaBtn.classList.remove('active');
                    updateToolsMessage();
                    if (window.distanceMeasurementTool && window.distanceMeasurementTool.isActive) {
                        window.distanceMeasurementTool.deactivate();
                    }
                    if (window.areaMeasurementTool && window.areaMeasurementTool.isActive) {
                        window.areaMeasurementTool.deactivate();
                    }
                }
            });
        }

        if (toolAnalysis) {
            toolAnalysis.addEventListener('change', function() {
                const buttons = [
                    'buffer-analysis', 'toggle-cluster', 'build-convex',
                    'build-voronoi', 'nearest-facility', 'toggle-heatmap'
                ];
                const reportBtn = document.getElementById('generate-report');
                void document.getElementById('heat-controls'); // heat-controls sadece toggle-heatmap'te kullanılır

                buttons.forEach(id => {
                    const btn = document.getElementById(id);
                    if (btn) {
                        btn.classList.toggle('active', this.checked);
                    }
                });

                // heat-controls sadece toggle-heatmap butonuna basılınca açılmalı
                // Burada active class'i eklemeyin

                if (reportBtn) {
                    reportBtn.disabled = !this.checked;
                    reportBtn.classList.toggle('opacity-50', !this.checked);
                    reportBtn.classList.toggle('hover:bg-emerald-50', this.checked);
                }

                updateToolsMessage();

                if (this.checked && typeof showEducationalFeedback === 'function') {
                    showEducationalFeedback('🔍 Mekânsal Analiz aktif! Etki alanı analizi ve detaylı raporlama yapabilirsiniz.');
                }
            });
        }

        function updateToolsMessage() {
            const measurementChecked = toolMeasurement?.checked;
            const analysisChecked = toolAnalysis?.checked;
            const toolsMessage = document.getElementById('tools-inactive');

            if (toolsMessage) {
                if (measurementChecked || analysisChecked) {
                    toolsMessage.style.display = 'none';
                } else {
                    toolsMessage.style.display = 'block';
                }
            }
        }

        // Initial sync - call updateToolsMessage immediately to prevent flash
        updateToolsMessage();

        // Then apply active classes after a short delay for smooth initialization
        setTimeout(() => {
            if (toolMeasurement?.checked) {
                const distanceBtn = document.getElementById('measure-distance');
                const areaBtn = document.getElementById('measure-area');
                distanceBtn?.classList.add('active');
                areaBtn?.classList.add('active');
            }
            if (toolAnalysis?.checked) {
                const buttons = [
                    'buffer-analysis', 'toggle-cluster', 'build-convex',
                    'build-voronoi', 'nearest-facility', 'toggle-heatmap'
                ];
                buttons.forEach(id => {
                    document.getElementById(id)?.classList.add('active');
                });
                // heat-controls sadece toggle-heatmap butonuna basılınca açılmalı
            }
        }, 100);
    }

    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;

            // Mesafe ölçümünü iptal et
            if (window.distanceMeasurementTool && window.distanceMeasurementTool.isActive) {
                window.distanceMeasurementTool.deactivate();
            }

            // Alan ölçümünü iptal et
            if (window.areaMeasurementTool && window.areaMeasurementTool.isActive) {
                window.areaMeasurementTool.deactivate();
            }

            // Ekran görüntüsü seçim aracını iptal et
            if (window.screenshotSelectionTool && window.screenshotSelectionTool.isActive) {
                window.screenshotSelectionTool.cancel();
                // Update button visual state
                const screenshotBtn = document.getElementById('screenshot-selection');
                if (screenshotBtn) {
                    screenshotBtn.classList.remove('tool-active');
                }
            }

            this.map.getContainer().style.cursor = '';

            if (window.uiStateManager && window.uiStateManager.updateMeasurementSelection) {
                window.uiStateManager.updateMeasurementSelection();
            }
        });
    }
}

// Make it globally available
window.ToolsEventHandlers = ToolsEventHandlers;
