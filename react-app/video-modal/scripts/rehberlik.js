/**
 * CBS Rehber Platform
 * Video ve döküman içerik yönetimi - Nasıl Kullanılır?
 */

class RehberlikPlatform {
    constructor() {
        this.currentFilter = 'videos';
        this.players = new Map();
        
        // CBS içerik verileri - tek düz liste (kategorisiz)
        this.content = {
            videos: [
                { id: 'cbs-1', type: 'video', title: '1. OGM Materyal CBS Platformu Arayüz Tanıtımı', description: 'OGM Materyal CBS Platformuna giriş ve arayüz tanıtımı.', duration: '03:10', thumbnail: 'thumbnails/1.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/1_cbs_arayuz.mp4', isNew: false },
                { id: 'cbs-2', type: 'video', title: '2. Veri Görselleştirme', description: 'Veri görselleştirme ve harita üretme.', duration: '06:06', thumbnail: 'thumbnails/2.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/2_veri_gorsellestirme.mp4', isNew: false },
                { id: 'cbs-3', type: 'video', title: '3. Harita Etiketleme Seçenekleri', description: 'Harita etiketleme ve sınıflandırma seçenekleri.', duration: '02:56', thumbnail: 'thumbnails/3.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/3_etiketleme.mp4', isNew: false },
                { id: 'cbs-4', type: 'video', title: '4. Astronomi Modülü', description: 'Astronomi modülü kullanımı.', duration: '01:43', thumbnail: 'thumbnails/4.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/4_astronomi_modulu.mp4', isNew: false },
                { id: 'cbs-5', type: 'video', title: '5. Veri Oluşturma', description: 'Veri oluşturma ve yönetimi.', duration: '03:41', thumbnail: 'thumbnails/5.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/5_veri_olusturma.mp4', isNew: false },
                { id: 'cbs-6', type: 'video', title: '6. Zaman Çizelgesi', description: 'Zaman çizelgesi modülünün kullanımı.', duration: '02:57', thumbnail: 'thumbnails/6.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/6_zaman_cizelgesi.mp4', isNew: false },
                { id: 'cbs-7', type: 'video', title: '7. Ölçüm Araçları', description: 'Mesafe ve alan ölçüm araçları kullanımı.', duration: '01:34', thumbnail: 'thumbnails/7.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/7_olcum_araclari.mp4', isNew: false },
                { id: 'cbs-8', type: 'video', title: '8. Mekânsal Analiz Araçları-1', description: 'Mekânsal analiz araçlarına giriş ve etki alanı analizi.', duration: '01:46', thumbnail: 'thumbnails/8.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/8_mekansal_analiz_1.mp4', isNew: false },
                { id: 'cbs-9', type: 'video', title: '9. Mekânsal Analiz Araçları-2', description: 'Nokta kümeleri, dış sınır analizi, en yakın alanlar analizi, iki nokta analizi ve ısı haritası.', duration: '04:17', thumbnail: 'thumbnails/9.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/9_mekansal_analiz_2.mp4', isNew: false },
                { id: 'cbs-10', type: 'video', title: '10. Altlık Harita ve Katmanlar', description: 'Altlık harita seçimi ve katman yönetimi.', duration: '02:33', thumbnail: 'thumbnails/10.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/10_altlik_harita_ve_katmanlar.mp4', isNew: false },
                { id: 'cbs-11', type: 'video', title: '11. Proje Yönetimi', description: 'Proje oluşturma, veri yükleme,veri kaydetme ve veri yönetimi.', duration: '03:20', thumbnail: 'thumbnails/11.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/11_proje_yonetimi.mp4', isNew: false },
                { id: 'cbs-12', type: 'video', title: '12. Hikâye Haritası Giriş', description: 'Hikâye haritasına giriş ve platforma giriş seçenekleri.', duration: '01:45', thumbnail: 'thumbnails/12.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/12_hikaye_haritasi_giris.mp4', isNew: false },
                { id: 'cbs-13', type: 'video', title: '13. Hikâye Haritası arayüz Tanıtımı', description: 'Hikâye Haritası arayüz özellikleri ve çizim araçlarının kullanımı.', duration: '02:17', thumbnail: 'thumbnails/13.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/13_arayuz_hikaye.mp4', isNew: false },
                { id: 'cbs-14', type: 'video', title: '14. Hikâye Haritası Oluşturma 1', description: 'Varsayılan ve Hikâye Haritası şablonlarından hikâye haritası oluşturma.', duration: '04:00', thumbnail: 'thumbnails/14.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/14_hikaye_haritasi_olusturma_1.mp4', isNew: false },
                { id: 'cbs-15', type: 'video', title: '15. Hikâye Haritası Oluşturma 2', description: 'Rota Hikâyesi ve Zaman Çizelgesi şablonlarından hikâye haritası oluşturma ve paylaşılan hikâye haritasını görüntüleme .', duration: '04:36', thumbnail: 'thumbnails/15.png', src: 'https://ogm-large-cdn.eba.gov.tr/Cbs/videos/15_hikaye_haritasi_olusturma_2.mp4', isNew: false }
            ],
            documents: [
                {
                    id: 'cbs-doc-1',
                    type: 'document',
                    title: 'CBS Hızlı Başlangıç Rehberi',
                    description: 'Uygulamayı kullanmaya başlamak için temel adımlar.',
                    thumbnail: 'images/1.jpg',
                    isNew: true
                },
                {
                    id: 'cbs-doc-2',
                    type: 'document',
                    title: 'Mekânsal Analiz Kılavuzu',
                    description: 'Tampon bölge, kesişim ve diğer analiz araçları.',
                    thumbnail: 'images/2.jpg'
                }
            ]
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderContent();
        this.setupParentMessageListener();

        // Set initial glider position
        const initialActiveButton = document.querySelector('.filter-btn.active');
        if (initialActiveButton) {
            const filterButtonsContainer = document.querySelector('.filter-buttons');
            const left = initialActiveButton.offsetLeft;
            const width = initialActiveButton.offsetWidth;
            filterButtonsContainer.style.setProperty('--glider-left', `${left}px`);
            filterButtonsContainer.style.setProperty('--glider-width', `${width}px`);
        }

        // Parent SPA hazır olduğumuzu bilsin — varsa beklenen PLAY_VIDEO mesajını gönderebilir
        try {
            window.parent?.postMessage({ type: 'VIDEO_MODAL_READY' }, '*');
        } catch (_) { /* iframe sandbox vs. */ }
    }

    /**
     * Parent SPA'dan gelen mesajları dinle:
     *   { type: 'PLAY_VIDEO', videoId: 'cbs-7' }
     */
    setupParentMessageListener() {
        window.addEventListener('message', (event) => {
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            if (data.type !== 'PLAY_VIDEO') return;
            const videoId = String(data.videoId || '');
            if (!videoId) return;
            this.playVideoById(videoId);
        });
    }

    /**
     * Belirli bir video ID'sine ait kartı bulur, viewport'a kaydırır
     * ve oynatmayı başlatır.
     */
    playVideoById(videoId) {
        const tryPlay = (attempt = 0) => {
            const card = document.querySelector(`.video-card[data-video-id="${videoId}"]`);
            if (!card) {
                // Render henüz tamamlanmamış olabilir — birkaç frame bekle
                if (attempt < 10) {
                    requestAnimationFrame(() => tryPlay(attempt + 1));
                }
                return;
            }
            const playBtn = card.querySelector('.play-button');
            if (!playBtn) return;
            const videoSrc = playBtn.dataset.videoSrc;
            const videoPoster = playBtn.dataset.videoPoster;
            // Viewport'a yumuşak kaydır
            try {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (_) {
                card.scrollIntoView();
            }
            // Render'ın oturması için kısa gecikme
            setTimeout(() => this.playVideo(videoSrc, videoPoster), 120);
        };
        tryPlay();
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.switchFilter(filter);
            });
        });
    }

    switchFilter(filter) {
        this.currentFilter = filter;
        
        // Update active state and move glider
        const filterButtonsContainer = document.querySelector('.filter-buttons');
        const buttons = filterButtonsContainer.querySelectorAll('.filter-btn');
        let activeButton = null;

        buttons.forEach(btn => {
            const isActive = btn.dataset.filter === filter;
            btn.classList.toggle('active', isActive);
            if (isActive) {
                activeButton = btn;
            }
        });

        if (activeButton) {
            const left = activeButton.offsetLeft;
            const width = activeButton.offsetWidth;
            filterButtonsContainer.style.setProperty('--glider-left', `${left}px`);
            filterButtonsContainer.style.setProperty('--glider-width', `${width}px`);
        }

        this.renderContent();
    }

    renderContent() {
        const contentGrid = document.getElementById('content-grid');
        const documentGrid = document.getElementById('document-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (!contentGrid || !documentGrid || !emptyState) return;

        const items = this.content[this.currentFilter] || [];

        if (items.length === 0) {
            contentGrid.style.display = 'none';
            documentGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        if (this.currentFilter === 'videos') {
            contentGrid.style.display = 'grid';
            documentGrid.style.display = 'none';
            contentGrid.innerHTML = items.map(video => this.createVideoCard(video)).join('');
            
            // Add click handlers to play buttons
            contentGrid.querySelectorAll('.play-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const videoSrc = btn.dataset.videoSrc;
                    const videoPoster = btn.dataset.videoPoster;
                    this.playVideo(videoSrc, videoPoster);
                });
            });

            // Add click handlers to video cards
            contentGrid.querySelectorAll('.video-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    // Don't play video if clicking on info icon or tooltip
                    if (e.target.closest('.info-icon') || e.target.closest('.tooltip')) {
                        return;
                    }
                    
                    const playBtn = card.querySelector('.play-button');
                    if (playBtn) {
                        const videoSrc = playBtn.dataset.videoSrc;
                        const videoPoster = playBtn.dataset.videoPoster;
                        this.playVideo(videoSrc, videoPoster);
                    }
                });
            });

            // Setup tooltip handlers
            this.setupTooltips();
        } else {
            contentGrid.style.display = 'none';
            documentGrid.style.display = 'grid';
            documentGrid.innerHTML = items.map(doc => this.createDocumentCard(doc)).join('');
            
            // Add click handlers to document cards
            documentGrid.querySelectorAll('.document-card').forEach(card => {
                card.addEventListener('click', () => {
                    alert('Doküman görüntüleme özelliği yakında eklenecek!');
                });
            });

            // Setup tooltip handlers
            this.setupTooltips();
        }
    }

    createVideoCard(video) {
        return `
            <article class="video-card" data-video-id="${video.id}">
                ${video.isNew ? '<div class="new-badge">Yeni</div>' : ''}
                <figure class="video-thumbnail-container">
                    <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
                    <div class="video-duration-badge">${video.duration}</div>
                    <button class="play-button" data-video-src="${video.src}" data-video-poster="${video.thumbnail}">
                        <img src="images/thumbnail-play.svg" 
                             alt="Play" 
                             class="play-icon"
                             >
                    </button>
                </figure>
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
                    <div class="info-icon">
                        <img src="images/info.svg" alt="Info Icon" />
                        <div class="tooltip">${video.description}</div>
                    </div>
                </div>
            </article>
        `;
    }

    createDocumentCard(doc) {
        return `
            <article class="document-card" data-document-id="${doc.id}">
                ${doc.isNew ? '<div class="new-badge">Yeni</div>' : ''}
                <div class="document-thumbnail-container">
                    <img src="${doc.thumbnail || 'images/document-placeholder.png'}" alt="${doc.title}" class="document-thumbnail">
                </div>
                <div class="document-info">
                    <div class="document-header">
                        <h3 class="document-title">${doc.title}</h3>
                        <div class="info-icon">
                            <img src="images/info.svg" alt="Info Icon" />
                            <div class="tooltip">${doc.description}</div>
                        </div>
                    </div>
                    <div class="document-actions">
                        <button class="view-btn" title="Görüntüle">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor"/>
                            </svg>
                        </button>
                        <button class="download-btn" title="İndir">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Setup tooltip functionality - Dijital Kopru style
     */
    setupTooltips() {
        const infoIcons = document.querySelectorAll('.info-icon');

        const closeAllTooltips = () => {
            document.querySelectorAll('.tooltip.open').forEach(t => {
                t.classList.remove('open');
            });
        };

        infoIcons.forEach(icon => {
            const tooltip = icon.querySelector('.tooltip');
            if (!tooltip) return;

            // Toggle tooltip when clicking the info icon
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const isOpen = tooltip.classList.contains('open');
                closeAllTooltips();
                
                if (!isOpen) {
                    tooltip.classList.add('open');
                }
            });

            // Prevent clicks inside tooltip from closing it
            tooltip.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Close tooltips when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.info-icon') && !e.target.closest('.tooltip')) {
                closeAllTooltips();
            }
        });

        // Close tooltips on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllTooltips();
            }
        });
    }

    /**
     * Play a video inline within the video card - ZindeKal style
     */
    playVideo(videoSrc, videoPoster = '') {
        // Pause all other playing videos first
        this.pauseAllOtherVideos();
        
        // Find the play button that was clicked
        const playButton = document.querySelector(`[data-video-src="${videoSrc}"]`);
        
        if (!playButton) {
            return;
        }

        const videoCard = playButton.closest('.video-card');
        const thumbnailContainer = videoCard.querySelector('.video-thumbnail-container');
        
        if (!thumbnailContainer) {
            return;
        }

        // Create unique ID for this video player
        const videoId = `inline-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Store original thumbnail content for potential restoration
        const originalContent = thumbnailContainer.innerHTML;
        
        // Replace thumbnail container content with video player
        thumbnailContainer.innerHTML = `
            <div class="inline-video-player" id="${videoId}">
                <video crossorigin class="inline-video" data-poster="${videoPoster}">
                    <source src="${videoSrc}" type="video/mp4">
                </video>
            </div>
        `;

        // Initialize inline video player
        const videoElement = thumbnailContainer.querySelector('.inline-video');
        const playerContainer = thumbnailContainer.querySelector('.inline-video-player');
        
        if (!videoElement) {
            thumbnailContainer.innerHTML = originalContent;
            return;
        }

        try {
            this.initializeVideoPlayer(videoElement, playerContainer, originalContent, videoSrc);
        } catch (error) {
            console.error('Error initializing video player:', error);
            thumbnailContainer.innerHTML = originalContent;
        }
    }

    /**
     * Initialize video player with Plyr
     */
    initializeVideoPlayer(videoElement, playerContainer, originalContent, videoSrc) {
        // Force layout refresh before initializing Plyr
        playerContainer.offsetHeight;
        
        // Initialize Plyr for this specific video
        const player = new Plyr(videoElement, this.getInlinePlayerConfig());
        
        // Store player reference on the container for cleanup
        playerContainer._plyrInstance = player;
        playerContainer._originalContent = originalContent;
        
        // Add loading state
        playerContainer.classList.add('plyr-loading');
        
        // Handle fullscreen changes to show/hide volume slider
        player.on('enterfullscreen', () => {
            // Add data-fullscreen attribute to bypass container query restriction
            // The CSS container query checks :not([data-fullscreen]) so this allows
            // the volume slider to display even in containers narrower than 400px
            const volumeInput = playerContainer.querySelector('.plyr__volume input[type="range"]');
            if (volumeInput) {
                volumeInput.setAttribute('data-fullscreen', 'true');
                volumeInput.style.display = 'inline-block';
                volumeInput.style.width = '60px';
            }
            
            const volumeContainer = playerContainer.querySelector('.plyr__volume');
            if (volumeContainer) {
                volumeContainer.style.display = 'inline-flex';
            }
        });
        
        player.on('exitfullscreen', () => {
            // Remove data-fullscreen attribute so container query hides it again
            // in narrow containers, and remove inline styles to let CSS take over
            const volumeInput = playerContainer.querySelector('.plyr__volume input[type="range"]');
            if (volumeInput) {
                volumeInput.removeAttribute('data-fullscreen');
                volumeInput.style.display = '';
                volumeInput.style.width = '';
            }
            
            const volumeContainer = playerContainer.querySelector('.plyr__volume');
            if (volumeContainer) {
                volumeContainer.style.display = '';
            }
        });


        player.on('ready', () => {
            // Remove loading state and ensure visibility
            playerContainer.classList.remove('plyr-loading');
            playerContainer.style.visibility = 'visible';
            playerContainer.style.opacity = '1';
            
            // Force another layout refresh
            playerContainer.offsetHeight;
            
            // Auto-play the video
            player.play().catch(error => {
                // Silently handle auto-play failures
                console.log('Auto-play prevented:', error);
            });
        });

        // Add event listener for when video actually starts playing
        player.on('play', () => {
            // Pause all OTHER videos when this one starts playing
            this.pauseAllOtherVideos(playerContainer);
        });

        player.on('loadstart', () => {
            playerContainer.style.visibility = 'visible';
        });

        player.on('loadeddata', () => {
            playerContainer.style.opacity = '1';
        });

        player.on('error', (error) => {
            console.error('Video playback error:', error);
            this.restoreVideoThumbnail(playerContainer.closest('.video-thumbnail-container'));
        });

        // Set initial visibility
        setTimeout(() => {
            playerContainer.style.visibility = 'visible';
            playerContainer.style.opacity = '1';
            playerContainer.offsetHeight; // Force layout
        }, 100);
        
        // Store player instance
        this.players.set(videoSrc, player);
    }

    /**
     * Get Plyr configuration for inline video players
     */
    getInlinePlayerConfig() {
        return {
            clickToPlay: true,
            invertTime: false,
            playsinline: true,
            hideControls: true,
            controls: [
                'play-large', 'play', 'progress', 'current-time', 'duration', 
                'mute', 'volume', 'fullscreen'
            ],
            i18n: {
                restart: "Tekrar başlat",
                rewind: "{seektime}s geri",
                play: "Oynat",
                pause: "Duraklat",
                fastForward: "{seektime}s İleri",
                seek: "Git",
                seekLabel: "{currentTime}/{duration}",
                played: "Oynatılan",
                buffered: "Önbellek",
                currentTime: "Şimdiki zaman",
                duration: "Süre",
                volume: "Ses",
                mute: "Sessiz",
                unmute: "Ses aç",
                enableCaptions: "Altyazıları aç",
                disableCaptions: "Altyazıları kapat",
                download: "İndir",
                enterFullscreen: "Tam ekran",
                exitFullscreen: "Tam ekranı kapat",
                frameTitle: "Player for {title}",
                captions: "Altyazılar",
                settings: "Ayarlar",
                pip: "Resim içinde resim",
                menuBack: "Önceki menüye dön",
                speed: "Hız",
                normal: "Normal",
                quality: "Kalite",
                loop: "Döngü",
                start: "Başlangıç",
                end: "Son",
                all: "Tümü",
                reset: "Sıfırla",
                disabled: "Kapalı",
                enabled: "Açık",
            }
        };
    }

    /**
     * Pause all currently playing videos
     * @param {Element} excludeContainer - Optional container to exclude from pausing
     */
    pauseAllOtherVideos(excludeContainer = null) {
        const allVideoPlayers = document.querySelectorAll('.inline-video-player');
        
        allVideoPlayers.forEach(playerContainer => {
            // Skip the container we want to exclude (current playing video)
            if (excludeContainer && playerContainer === excludeContainer) {
                return;
            }
            
            if (playerContainer._plyrInstance) {
                try {
                    // Pause the video if it's playing
                    if (!playerContainer._plyrInstance.paused) {
                        playerContainer._plyrInstance.pause();
                    }
                } catch (error) {
                    // Silently handle pause errors
                    console.error('Error pausing video:', error);
                }
            }
        });
    }

    /**
     * Restore video thumbnail (optional method for future use)
     */
    restoreVideoThumbnail(thumbnailContainer) {
        const playerContainer = thumbnailContainer.querySelector('.inline-video-player');
        if (playerContainer && playerContainer._plyrInstance) {
            // Destroy Plyr instance
            playerContainer._plyrInstance.destroy();
            
            // Restore original content
            if (playerContainer._originalContent) {
                thumbnailContainer.innerHTML = playerContainer._originalContent;
            }
        }
    }
}

// Initialize the platform when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RehberlikPlatform();
});
