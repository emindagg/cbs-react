// Admin Panel Application - Professional Enhanced Version
// Features: Animated counters, smooth transitions, enhanced UX

class AdminAppPro {
    constructor() {
        this.accessKey = 'admin';
        this.reports = [];
        this.currentSection = 'dashboard';

        this.init();
    }

    init() {
        // Check access
        if (!this.checkAccess()) {
            return;
        }

        // Show admin panel with animation
        document.getElementById('access-denied').classList.add('hidden');
        const adminPanel = document.getElementById('admin-panel');
        adminPanel.classList.remove('hidden');

        // Delay to trigger CSS animations
        requestAnimationFrame(() => {
            adminPanel.style.opacity = '1';
        });

        // Load data
        this.loadReports();

        // Setup UI
        this.setupNavigation();
        this.setupFilters();
        this.updateDate();
        this.renderDashboard();
    }

    checkAccess() {
        // Admin paneli şimdilik devre dışı - backend auth hazır olunca aktif edilecek
        // return window.location.pathname.includes('/admin/');
        return false;
    }

    loadReports() {
        try {
            this.reports = JSON.parse(localStorage.getItem('storymap_reports') || '[]');
            // Add status if not exists
            this.reports = this.reports.map(r => ({
                ...r,
                status: r.status || 'pending'
            }));
        } catch (e) {
            console.error('Failed to load reports:', e);
            this.reports = [];
        }
    }

    getProjectCount() {
        try {
            const data = JSON.parse(localStorage.getItem('storymap_data') || '{}');
            if (data.stories) return data.stories.length;
            if (data.markers) return data.markers.length;
            if (Array.isArray(data)) return data.length;
            return Object.keys(data).length > 0 ? 1 : 0;
        } catch (e) {
            return 0;
        }
    }

    getRegisteredTeachers() {
        try {
            const data = JSON.parse(localStorage.getItem('storymap_data') || '{}');
            if (data.teachers && Array.isArray(data.teachers)) {
                return data.teachers.length;
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }

    getRegisteredStudents() {
        try {
            const data = JSON.parse(localStorage.getItem('storymap_data') || '{}');
            if (data.students && Array.isArray(data.students)) {
                return data.students.length;
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }

    getTotalPhotos() {
        try {
            const data = JSON.parse(localStorage.getItem('storymap_data') || '{}');
            let photoCount = 0;

            if (data.markers && Array.isArray(data.markers)) {
                data.markers.forEach(m => {
                    if (m.media && Array.isArray(m.media)) {
                        photoCount += m.media.filter(med => med.type === 'image').length;
                    }
                });
            }

            if (data.drawings && Array.isArray(data.drawings)) {
                data.drawings.forEach(d => {
                    if (d.media && Array.isArray(d.media)) {
                        photoCount += d.media.filter(med => med.type === 'image').length;
                    }
                });
            }

            return photoCount;
        } catch (e) {
            return 0;
        }
    }

    getTotalVideos() {
        try {
            const data = JSON.parse(localStorage.getItem('storymap_data') || '{}');
            let videoCount = 0;

            if (data.markers && Array.isArray(data.markers)) {
                data.markers.forEach(m => {
                    if (m.media && Array.isArray(m.media)) {
                        videoCount += m.media.filter(med => med.type === 'video').length;
                    }
                });
            }

            if (data.drawings && Array.isArray(data.drawings)) {
                data.drawings.forEach(d => {
                    if (d.media && Array.isArray(d.media)) {
                        videoCount += d.media.filter(med => med.type === 'video').length;
                    }
                });
            }

            return videoCount;
        } catch (e) {
            return 0;
        }
    }

    saveReports() {
        localStorage.setItem('storymap_reports', JSON.stringify(this.reports));
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.admin__nav-item[data-section]');
        const panelLinks = document.querySelectorAll('.panel__link[data-section]');

        const handleNav = (section) => {
            // Update nav
            navItems.forEach(item => {
                item.classList.toggle('admin__nav-item--active', item.dataset.section === section);
            });

            // Update sections with animation
            document.querySelectorAll('.admin__section').forEach(sec => {
                sec.classList.add('hidden');
            });

            const targetSection = document.getElementById(`section-${section}`);
            targetSection.classList.remove('hidden');

            // Update title
            const titles = { dashboard: 'Dashboard', reports: 'Şikayetler', stats: 'İstatistikler' };
            document.getElementById('page-title').textContent = titles[section];

            this.currentSection = section;

            // Render section
            if (section === 'reports') this.renderAllReports();
            if (section === 'stats') this.renderStats();
            if (section === 'dashboard') this.renderDashboard();
        };

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                handleNav(item.dataset.section);
            });
        });

        panelLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                handleNav(link.dataset.section);
            });
        });
    }

    setupFilters() {
        const typeFilter = document.getElementById('filter-type');
        const statusFilter = document.getElementById('filter-status');

        typeFilter?.addEventListener('change', () => this.renderAllReports());
        statusFilter?.addEventListener('change', () => this.renderAllReports());
    }

    updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent =
            new Date().toLocaleDateString('tr-TR', options);
    }

    // Animated counter for numbers
    animateCounter(element, target, duration = 1000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    // Dashboard
    renderDashboard() {
        const total = this.reports.length;
        const pending = this.reports.filter(r => r.status === 'pending').length;
        const resolved = this.reports.filter(r => r.status === 'resolved').length;
        const suggestions = this.reports.filter(r => r.reportType === 'suggestion').length;
        const projects = this.getProjectCount();

        // Animate counters
        this.animateCounter(document.getElementById('total-projects'), projects);
        this.animateCounter(document.getElementById('total-reports'), total);
        this.animateCounter(document.getElementById('pending-reports'), pending);
        this.animateCounter(document.getElementById('resolved-reports'), resolved);
        this.animateCounter(document.getElementById('suggestion-count'), suggestions);

        document.getElementById('reports-count').textContent = pending;

        // Recent reports
        this.renderRecentReports();
    }

    renderRecentReports() {
        const tbody = document.getElementById('recent-reports');
        const recent = [...this.reports].reverse().slice(0, 5);

        if (recent.length === 0) {
            tbody.innerHTML = '<tr class="table__empty"><td colspan="4">Henüz şikayet bulunmuyor</td></tr>';
            return;
        }

        tbody.innerHTML = recent.map(r => `
            <tr>
                <td>${this.escapeHtml(r.fullName)}</td>
                <td><span class="badge badge--${r.reportType}">${this.getTypeLabel(r.reportType)}</span></td>
                <td>${this.formatDate(r.timestamp)}</td>
                <td><span class="badge badge--${r.status}">${this.getStatusLabel(r.status)}</span></td>
            </tr>
        `).join('');
    }

    // All Reports
    renderAllReports() {
        const tbody = document.getElementById('all-reports');
        const typeFilter = document.getElementById('filter-type').value;
        const statusFilter = document.getElementById('filter-status').value;

        let filtered = [...this.reports].reverse();
        if (typeFilter) filtered = filtered.filter(r => r.reportType === typeFilter);
        if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter);

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr class="table__empty"><td colspan="9">Şikayet bulunamadı</td></tr>';
            document.getElementById('select-all').checked = false;
            this.updateBulkDeleteBtn();
            return;
        }

        tbody.innerHTML = filtered.map((r, i) => `
            <tr data-index="${this.reports.indexOf(r)}">
                <td class="td-checkbox"><input type="checkbox" class="report-checkbox" value="${this.reports.indexOf(r)}" onchange="adminApp.updateBulkDeleteBtn()"></td>
                <td>${this.escapeHtml(r.fullName)}</td>
                <td>${this.escapeHtml(r.school || '-')}</td>
                <td><span class="badge badge--${r.reportType}">${this.getTypeLabel(r.reportType)}</span></td>
                <td>
                    <span class="description-short">${this.truncate(r.description, 30)}</span>
                    <button class="btn btn--view" onclick="adminApp.showDescription(${this.reports.indexOf(r)})">Göster</button>
                </td>
                <td>${r.link ? `<a href="${this.escapeHtml(r.link)}" target="_blank" style="color: var(--color-teal)">Aç</a>` : '-'}</td>
                <td>${this.formatDate(r.timestamp)}</td>
                <td><span class="badge badge--${r.status}">${this.getStatusLabel(r.status)}</span></td>
                <td>
                    ${r.status === 'pending' ?
                        `<button class="btn btn--resolve" onclick="adminApp.resolveReport(${this.reports.indexOf(r)})">Çözüldü</button>` :
                        `<button class="btn btn--pending" onclick="adminApp.unresolveReport(${this.reports.indexOf(r)})">Çözülmedi</button>`
                    }
                    <button class="btn btn--delete" onclick="adminApp.deleteReport(${this.reports.indexOf(r)})">Sil</button>
                </td>
            </tr>
        `).join('');

        document.getElementById('select-all').checked = false;
        this.updateBulkDeleteBtn();
    }

    // Stats
    renderStats() {
        // Update top cards with animation
        const projects = this.getProjectCount();
        const teachers = this.getRegisteredTeachers();
        const students = this.getRegisteredStudents();
        const photos = this.getTotalPhotos();
        const videos = this.getTotalVideos();

        this.animateCounter(document.getElementById('stats-total-projects'), projects);
        this.animateCounter(document.getElementById('stats-registered-teachers'), teachers);
        this.animateCounter(document.getElementById('stats-registered-students'), students);
        this.animateCounter(document.getElementById('stats-total-photos'), photos);
        this.animateCounter(document.getElementById('stats-total-videos'), videos);

        // Update charts
        const total = this.reports.length || 1;
        const types = {
            suggestion: this.reports.filter(r => r.reportType === 'suggestion').length,
            bug: this.reports.filter(r => r.reportType === 'bug').length,
            inappropriate: this.reports.filter(r => r.reportType === 'inappropriate').length
        };
        const statuses = {
            pending: this.reports.filter(r => r.status === 'pending').length,
            resolved: this.reports.filter(r => r.status === 'resolved').length
        };

        document.getElementById('type-stats').innerHTML = `
            <div class="stat-bar">
                <div class="stat-bar__header">
                    <span class="stat-bar__label">Öneri</span>
                    <span class="stat-bar__value">${types.suggestion}</span>
                </div>
                <div class="stat-bar__track">
                    <div class="stat-bar__fill stat-bar__fill--suggestion" style="width: ${(types.suggestion/total)*100}%"></div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-bar__header">
                    <span class="stat-bar__label">Hata</span>
                    <span class="stat-bar__value">${types.bug}</span>
                </div>
                <div class="stat-bar__track">
                    <div class="stat-bar__fill stat-bar__fill--bug" style="width: ${(types.bug/total)*100}%"></div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-bar__header">
                    <span class="stat-bar__label">Uygunsuz İçerik</span>
                    <span class="stat-bar__value">${types.inappropriate}</span>
                </div>
                <div class="stat-bar__track">
                    <div class="stat-bar__fill stat-bar__fill--inappropriate" style="width: ${(types.inappropriate/total)*100}%"></div>
                </div>
            </div>
        `;

        document.getElementById('status-stats').innerHTML = `
            <div class="stat-bar">
                <div class="stat-bar__header">
                    <span class="stat-bar__label">Bekleyen</span>
                    <span class="stat-bar__value">${statuses.pending}</span>
                </div>
                <div class="stat-bar__track">
                    <div class="stat-bar__fill stat-bar__fill--pending" style="width: ${(statuses.pending/total)*100}%"></div>
                </div>
            </div>
            <div class="stat-bar">
                <div class="stat-bar__header">
                    <span class="stat-bar__label">Çözülen</span>
                    <span class="stat-bar__value">${statuses.resolved}</span>
                </div>
                <div class="stat-bar__track">
                    <div class="stat-bar__fill stat-bar__fill--resolved" style="width: ${(statuses.resolved/total)*100}%"></div>
                </div>
            </div>
        `;
    }

    // Actions
    resolveReport(index) {
        this.reports[index].status = 'resolved';
        this.saveReports();
        this.renderDashboard();
        this.renderAllReports();
    }

    unresolveReport(index) {
        this.reports[index].status = 'pending';
        this.saveReports();
        this.renderDashboard();
        this.renderAllReports();
    }

    // Bulk Selection
    toggleSelectAll(checkbox) {
        const checkboxes = document.querySelectorAll('.report-checkbox');
        checkboxes.forEach(cb => cb.checked = checkbox.checked);
        this.updateBulkDeleteBtn();
    }

    updateBulkDeleteBtn() {
        const checkboxes = document.querySelectorAll('.report-checkbox:checked');
        const count = checkboxes.length;
        const btn = document.getElementById('bulk-delete-btn');
        const countSpan = document.getElementById('selected-count');

        if (count > 0) {
            btn.classList.remove('hidden');
            countSpan.textContent = count;
        } else {
            btn.classList.add('hidden');
        }
    }

    bulkDelete() {
        const checkboxes = document.querySelectorAll('.report-checkbox:checked');
        const indices = Array.from(checkboxes).map(cb => parseInt(cb.value));

        if (indices.length === 0) return;

        if (confirm(`${indices.length} şikayeti silmek istediğinize emin misiniz?`)) {
            // Sort descending to delete from end first (avoid index shifting)
            indices.sort((a, b) => b - a);
            indices.forEach(index => {
                this.reports.splice(index, 1);
            });

            this.saveReports();
            this.renderDashboard();
            this.renderAllReports();
        }
    }

    showDescription(index) {
        const report = this.reports[index];
        const modal = document.createElement('div');
        modal.className = 'detail-modal';
        modal.innerHTML = `
            <div class="detail-modal__content">
                <button class="detail-modal__close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
                <h3 class="detail-modal__title">Şikayet Detayı</h3>
                <div class="detail-modal__info">
                    <p><strong>Ad Soyad</strong>${this.escapeHtml(report.fullName)}</p>
                    <p><strong>Okul</strong>${this.escapeHtml(report.school || '-')}</p>
                    <p><strong>Tür</strong>${this.getTypeLabel(report.reportType)}</p>
                    <p><strong>Tarih</strong>${this.formatDate(report.timestamp)}</p>
                    ${report.link ? `<p><strong>Link</strong><a href="${this.escapeHtml(report.link)}" target="_blank">${this.escapeHtml(report.link)}</a></p>` : ''}
                </div>
                <div class="detail-modal__description">
                    <strong>Açıklama</strong>
                    <p>${this.escapeHtml(report.description)}</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    deleteReport(index) {
        if (confirm('Bu şikayeti silmek istediğinize emin misiniz?')) {
            this.reports.splice(index, 1);
            this.saveReports();
            this.renderDashboard();
            this.renderAllReports();
        }
    }

    // Helpers
    getTypeLabel(type) {
        const labels = { suggestion: 'Öneri', bug: 'Hata', inappropriate: 'Uygunsuz' };
        return labels[type] || type;
    }

    getStatusLabel(status) {
        const labels = { pending: 'Bekliyor', resolved: 'Çözüldü' };
        return labels[status] || status;
    }

    formatDate(timestamp) {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    truncate(str, len) {
        if (!str) return '-';
        return str.length > len ? str.substring(0, len) + '...' : str;
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Initialize
const adminApp = new AdminAppPro();
window.adminApp = adminApp;
