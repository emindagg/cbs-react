import { SearchManager } from './modules/SearchManager.js';
import { HistoryManager } from './modules/HistoryManager.js';
import { ToolManager } from './modules/ToolManager.js';
import { ActionManager } from './modules/ActionManager.js';
import { ImportPanel } from './panels/ImportPanel.js';

export class ToolbarComponent {
    constructor(viewMode = false) {
        this.toolbar = document.getElementById('map-toolbar');
        this.viewMode = viewMode;

        this.searchManager = new SearchManager(this.toolbar);
        this.historyManager = new HistoryManager(this.toolbar);
        this.toolManager = new ToolManager(this.toolbar);
        this.actionManager = new ActionManager(this.toolbar);
        
        this.importPanel = null;
        this.onImportDataSubmit = null;
    }

    init(mapComponent, sidebarComponent, viewMode = false) {
        this.viewMode = viewMode;

        this.searchManager.setMapComponent(mapComponent);
        this.historyManager.setComponents(sidebarComponent, mapComponent);
        this.toolManager.setComponents(mapComponent, sidebarComponent, viewMode);

        if (!this.viewMode) {
            this.importPanel = new ImportPanel();
            this.importPanel.onImportSubmit = (data) => {
                if (this.onImportDataSubmit) {
                    this.onImportDataSubmit(data);
                }
            };
        }

        // View mode artık geçici çizim yapabilir, araçları devre dışı bırakma
        // if (this.viewMode) {
        //     this.disableEditingTools();
        // }

        this.setupEventListeners();
    }

    show() {
        if (this.toolbar) {
            this.toolbar.classList.remove('hidden');
            this.toolbar.style.removeProperty('display');

            // View mode'da action butonlarını gizle (sadece çizim araçları görünsün)
            if (this.viewMode) {
                this.hideActionButtons();
            }
        }
    }

    hideActionButtons() {
        if (!this.toolbar) return;

        // toolbar__right sağ taraftaki action butonlarını içerir
        const toolbarRight = this.toolbar.querySelector('.toolbar__right');
        if (toolbarRight) {
            toolbarRight.style.display = 'none';
        }
    }

    hide() {
        if (this.toolbar) {
            this.toolbar.classList.add('hidden');
            this.toolbar.style.removeProperty('display');
        }
    }

    setupEventListeners() {
        if (!this.toolbar) return;

        const importBtn = this.toolbar.querySelector('#btn-import-data');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                if (this.importPanel) {
                    this.importPanel.open();
                }
            });
        }

        const toolBtns = this.toolbar.querySelectorAll('.toolbar__btn[data-tool]');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = btn.dataset.tool;
                
                if (this.toolManager.isToolLocked) {
                    if (tool === 'select') {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toolManager.cancelCurrentTool();
                        return;
                    }
                    // Allow clicking on the active measurement tool for toggle functionality
                    if (tool === 'measure-distance' && tool === this.toolManager.currentTool) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toolManager.selectTool(tool);
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                
                if (tool === 'undo') {
                    this.historyManager.undo();
                    this.toolManager.selectTool('select');
                } else if (tool === 'redo') {
                    this.historyManager.redo();
                    this.toolManager.selectTool('select');
                } else {
                    this.toolManager.selectTool(tool);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.toolManager.isToolLocked) {
                this.toolManager.cancelCurrentTool();
            }
        });
    }

    disableEditingTools() {
        if (!this.toolbar) return;

        console.log('[ToolbarComponent] View mode: Düzenleme araçları devre dışı bırakılıyor...');

        // Disable editing tools
        const editingTools = [
            'undo',
            'redo',
            'marker',
            'numbered',
            'line',
            'polygon',
            'circle',
            'rectangle',
            'text',
            'measure-distance'
        ];

        editingTools.forEach(tool => {
            const btn = this.toolbar.querySelector(`[data-tool="${tool}"]`);
            if (btn) {
                btn.classList.add('toolbar__btn--view-mode-disabled');
            }
        });

        // Ensure select tool is active
        const selectBtn = this.toolbar.querySelector('[data-tool="select"]');
        if (selectBtn && !selectBtn.classList.contains('toolbar__btn--active')) {
            selectBtn.classList.add('toolbar__btn--active');
        }
    }

    addAction(action) {
        this.historyManager.addAction(action);
    }
}
