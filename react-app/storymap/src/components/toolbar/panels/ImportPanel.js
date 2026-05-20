import { ImportManager } from '../../../utils/ImportManager.js';
import { toast } from '../../../utils/toast.js';

export class ImportPanel {
    constructor() {
        this.modal = document.getElementById('import-modal');
        this.isOpen = false;
        
        // Elementler
        this.dropzone = document.getElementById('import-dropzone');
        this.fileInput = document.getElementById('import-file-input');
        this.statusPanel = document.getElementById('import-status');
        this.spinner = document.getElementById('import-spinner');
        
        this.successIcon = document.getElementById('import-success-icon');
        this.errorIcon = document.getElementById('import-error-icon');
        this.statusTitle = document.getElementById('import-status-title');
        this.statusDesc = document.getElementById('import-status-desc');
        
        this.summaryPanel = document.getElementById('import-summary');
        this.countPoints = document.getElementById('import-count-points');
        this.countDrawings = document.getElementById('import-count-drawings');
        
        this.closeBtn = document.getElementById('btn-import-close');
        this.cancelBtn = document.getElementById('btn-import-cancel');
        this.submitBtn = document.getElementById('btn-import-submit');
        
        // İş Mantığı ve Veriler
        this.importManager = new ImportManager();
        this.parsedData = null;
        this.escKeyHandler = null;

        // Callback
        this.onImportSubmit = null; // Entegrasyon için kullanılacak

        this.setupListeners();
    }

    setupListeners() {
        if (!this.modal) return;

        // Kapatma butonları
        this.closeBtn?.addEventListener('click', () => this.close());
        this.cancelBtn?.addEventListener('click', () => this.close());
        
        // Gönder butonu
        this.submitBtn?.addEventListener('click', () => this.submitImport());

        // Dropzone tıklama olayı -> Gizli file input'u tetikler
        this.dropzone?.addEventListener('click', () => {
            this.fileInput?.click();
        });

        // File input değişim olayı
        this.fileInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                this.handleFileSelection(file);
            }
        });

        // Sürükle-Bırak Olayları
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropzone?.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.dropzone.classList.add('import-modal__dropzone--active');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropzone?.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.dropzone.classList.remove('import-modal__dropzone--active');
            }, false);
        });

        this.dropzone?.addEventListener('drop', (e) => {
            const file = e.dataTransfer?.files?.[0];
            if (file) {
                this.handleFileSelection(file);
            }
        }, false);
    }

    open() {
        if (!this.modal) return;
        
        this.resetUI();
        this.modal.classList.add('import-modal--active');
        this.isOpen = true;

        // ESC tuşu ile kapatma dinleyicisi
        this.escKeyHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        document.addEventListener('keydown', this.escKeyHandler);
    }

    close() {
        if (!this.modal) return;

        this.modal.classList.remove('import-modal--active');
        this.isOpen = false;

        if (this.escKeyHandler) {
            document.removeEventListener('keydown', this.escKeyHandler);
            this.escKeyHandler = null;
        }

        this.resetUI();
    }

    resetUI() {
        this.parsedData = null;
        if (this.fileInput) this.fileInput.value = '';

        // Dropzone'u göster, durum panelini gizle
        if (this.dropzone) this.dropzone.style.display = 'flex';
        if (this.statusPanel) {
            this.statusPanel.style.display = 'none';
            this.statusPanel.className = 'import-modal__status';
        }

        // İkonları ve butonları sıfırla
        if (this.spinner) this.spinner.style.display = 'block';
        if (this.successIcon) this.successIcon.style.display = 'none';
        if (this.errorIcon) this.errorIcon.style.display = 'none';
        if (this.summaryPanel) this.summaryPanel.style.display = 'none';
        
        if (this.submitBtn) {
            this.submitBtn.disabled = true;
            this.submitBtn.textContent = 'Haritaya Ekle';
        }
    }

    async handleFileSelection(file) {
        this.resetUI();

        // Arayüzü yükleniyor moduna geçir
        if (this.dropzone) this.dropzone.style.display = 'none';
        if (this.statusPanel) {
            this.statusPanel.style.display = 'flex';
            this.statusPanel.classList.add('import-modal__status--active');
        }

        if (this.statusTitle) this.statusTitle.textContent = 'Dosya Çözümleniyor...';
        if (this.statusDesc) this.statusDesc.textContent = `${file.name} dosyası okunuyor ve CBS geometrileri ayrıştırılıyor. Lütfen bekleyin...`;

        try {
            // Parser'ı çalıştır
            const result = await this.importManager.parseFile(file);
            const totalPoints = result.points.length;
            const totalDrawings = result.drawings.length;

            if (totalPoints === 0 && totalDrawings === 0) {
                throw new Error('Dosya içerisinde geçerli bir nokta, çizgi veya alan geometrisi bulunamadı.');
            }

            // Başarı Durumu
            this.parsedData = result;
            
            if (this.spinner) this.spinner.style.display = 'none';
            if (this.successIcon) this.successIcon.style.display = 'block';
            this.statusPanel.classList.add('import-modal__status--success');

            if (this.statusTitle) this.statusTitle.textContent = 'Çözümleme Başarılı!';
            if (this.statusDesc) this.statusDesc.textContent = `${file.name} başarıyla harita veri formatına dönüştürüldü.`;

            // Özeti Güncelle
            if (this.countPoints) this.countPoints.textContent = totalPoints;
            if (this.countDrawings) this.countDrawings.textContent = totalDrawings;
            if (this.summaryPanel) this.summaryPanel.style.display = 'block';

            // Ekle Butonunu Aktif Et
            if (this.submitBtn) {
                this.submitBtn.disabled = false;
                this.submitBtn.textContent = `Verileri Ekle (${totalPoints + totalDrawings})`;
            }

            toast.success('CBS Dosyası başarıyla çözümlendi!');

        } catch (error) {
            // Hata Durumu
            console.error('[ImportPanel] Dosya işlenemedi:', error);

            if (this.spinner) this.spinner.style.display = 'none';
            if (this.errorIcon) this.errorIcon.style.display = 'block';
            this.statusPanel.classList.add('import-modal__status--error');

            if (this.statusTitle) this.statusTitle.textContent = 'İçe Aktarım Başarısız!';
            if (this.statusDesc) this.statusDesc.textContent = error.message || 'Geçersiz CBS veri dosyası.';
            
            if (this.submitBtn) this.submitBtn.disabled = true;
            toast.error('Dosya ayrıştırılırken hata oluştu.');
        }
    }

    submitImport() {
        if (!this.parsedData) return;

        if (this.onImportSubmit) {
            try {
                this.onImportSubmit(this.parsedData);
                toast.success('CBS verileri haritaya başarıyla eklendi!');
                this.close();
            } catch (err) {
                console.error('[ImportPanel] Haritaya ekleme hatası:', err);
                toast.error('Veriler haritaya eklenirken bir sorun oluştu.');
            }
        } else {
            console.warn('[ImportPanel] onImportSubmit callback tanımlanmamış.');
        }
    }
}
