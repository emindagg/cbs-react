export class ReportPanel {
    constructor() {
        this.modal = null;
        this.isOpen = false;
    }

    open() {
        if (this.isOpen) return;
        this.createModal();
        this.isOpen = true;
    }

    close() {
        if (!this.isOpen || !this.modal) return;
        this.modal.remove();
        this.modal = null;
        this.isOpen = false;
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'report-modal';
        this.modal.innerHTML = `
            <div class="report-modal__content">
                <button class="report-modal__close" type="button">
                    <i class="fas fa-times"></i>
                </button>
                
                <h2 class="report-modal__title">Geri Bildirim</h2>
                
                <form class="report-modal__form" id="report-form">
                    <div class="report-modal__row">
                        <input type="text" class="report-modal__input" id="fullName" required placeholder="Ad Soyad *">
                        <input type="text" class="report-modal__input" id="school" required placeholder="Okul *">
                    </div>
                    
                    <div class="report-modal__types">
                        <label class="report-modal__type">
                            <input type="radio" name="reportType" value="suggestion" required>
                            <span><i class="fas fa-lightbulb"></i> Öneri</span>
                        </label>
                        <label class="report-modal__type">
                            <input type="radio" name="reportType" value="bug">
                            <span><i class="fas fa-bug"></i> Hata</span>
                        </label>
                        <label class="report-modal__type">
                            <input type="radio" name="reportType" value="inappropriate">
                            <span><i class="fas fa-flag"></i> Uygunsuz İçerik</span>
                        </label>
                    </div>
                    
                    <input type="url" class="report-modal__input" id="reportLink" required placeholder="İlgili bağlantı *">
                    
                    <textarea class="report-modal__textarea" id="description" required placeholder="Açıklama *" rows="3"></textarea>
                    
                    <button type="submit" class="report-modal__submit">
                        <div class="report-modal__submit-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                                <path fill="none" d="M0 0h24v24H0z"></path>
                                <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"></path>
                            </svg>
                        </div>
                        <span>Gönder</span>
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.setupEventListeners();
        
        requestAnimationFrame(() => {
            this.modal.classList.add('report-modal--show');
        });
    }

    setupEventListeners() {
        const closeBtn = this.modal.querySelector('.report-modal__close');
        closeBtn.addEventListener('click', () => this.close());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        const form = this.modal.querySelector('#report-form');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const data = {
            fullName: this.modal.querySelector('#fullName').value,
            school: this.modal.querySelector('#school').value,
            reportType: this.modal.querySelector('input[name="reportType"]:checked')?.value,
            link: this.modal.querySelector('#reportLink').value,
            description: this.modal.querySelector('#description').value,
            timestamp: new Date().toISOString()
        };

        if (!data.fullName || !data.school || !data.reportType || !data.link || !data.description) {
            return;
        }

        const submitBtn = this.modal.querySelector('.report-modal__submit');
        submitBtn.innerHTML = `
            <div class="report-modal__loader">
                <div class="circle"></div>
                <div class="circle"></div>
                <div class="circle"></div>
                <div class="circle"></div>
            </div>
            <span>Gönderiliyor...</span>
        `;
        submitBtn.disabled = true;

        setTimeout(() => {
            this.storeReport(data);
            submitBtn.innerHTML = '<div class="report-modal__submit-icon" style="background:rgba(255,255,255,0.3)"><i class="fas fa-check"></i></div><span>Gönderildi!</span>';
            submitBtn.style.background = '#10b981';
            
            setTimeout(() => this.close(), 1500);
        }, 1000);
    }

    storeReport(data) {
        try {
            const reports = JSON.parse(localStorage.getItem('storymap_reports') || '[]');
            reports.push(data);
            localStorage.setItem('storymap_reports', JSON.stringify(reports));
            console.log('[ReportPanel] Report saved:', data);
        } catch (error) {
            console.error('[ReportPanel] Failed to store report:', error);
        }
    }
}