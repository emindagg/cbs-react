import { SharePanel } from '../panels/SharePanel.js';
import { ReportPanel } from '../panels/ReportPanel.js';

export class ActionManager {
    constructor(toolbar) {
        this.toolbar = toolbar;
        this.adminButton = null;
        this.statsButton = null;
        this.isAdminMode = false;
        
        // Panel instances
        this.sharePanel = new SharePanel();
        this.reportPanel = new ReportPanel();
        
        this.init();
    }

    init() {
        this.checkAdminAccess();
        this.setupEventListeners();
    }

    checkAdminAccess() {
        // Check for admin in URL (query param or hash)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') !== null || window.location.hash === '#admin') {
            this.enableAdminMode();
        }

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            if (window.location.hash === '#admin') {
                this.enableAdminMode();
            } else {
                this.disableAdminMode();
            }
        });
    }

    enableAdminMode() {
        if (this.isAdminMode) return;
        
        this.isAdminMode = true;
        this.adminButton = this.toolbar.querySelector('.toolbar__btn--admin');
        this.statsButton = this.toolbar.querySelector('.toolbar__btn--stats');
        
        if (this.adminButton) {
            this.adminButton.classList.remove('hidden');
        }
        
        if (this.statsButton) {
            this.statsButton.classList.remove('hidden');
        }
        
        console.log('[ActionManager] Admin mode enabled - Admin panel and Stats visible');
    }

    disableAdminMode() {
        if (!this.isAdminMode) return;
        
        this.isAdminMode = false;
        
        if (this.adminButton) {
            this.adminButton.classList.add('hidden');
        }
        
        if (this.statsButton) {
            this.statsButton.classList.add('hidden');
        }
        
        console.log('[ActionManager] Admin mode disabled - Admin panel and Stats hidden');
    }

    setupEventListeners() {
        if (!this.toolbar) return;

        // Action button listeners
        const actionBtns = this.toolbar.querySelectorAll('.toolbar__btn[data-action]');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const action = btn.dataset.action;
                this.handleAction(action);
            });
        });
    }

    handleAction(action) {
        switch (action) {
            case 'home':
                this.goToHome();
                break;
            case 'share':
                this.openSharePanel();
                break;
            case 'report':
                this.openReportPanel();
                break;
            case 'stats':
                this.openStatsPanel();
                break;
            case 'admin':
                if (this.isAdminMode) {
                    this.openAdminPanel();
                }
                break;
            default:
                console.warn('[ActionManager] Unknown action:', action);
        }
    }

    goToHome() {
        console.log('[ActionManager] Navigating to home (story selection)...');
        // Hikâye seçme ekranına dön
        window.dispatchEvent(new CustomEvent('navigate-home'));
    }

    openSharePanel() {
        console.log('[ActionManager] Opening share panel...');
        this.sharePanel.open();
    }

    openReportPanel() {
        console.log('[ActionManager] Opening report panel...');
        this.reportPanel.open();
    }

    openStatsPanel() {
        console.log('[ActionManager] Opening stats panel...');
        // Redirect to admin panel stats section
        window.open('admin.html?admin', '_blank');
    }

    openAdminPanel() {
        console.log('[ActionManager] Opening admin panel...');
        // Open admin panel in new tab
        window.open('admin.html?admin', '_blank');
    }
}