import { authManager } from './services/authManager.js';
import { apiService } from './services/apiService.js';

async function handleLoginRedirect() {
    const loader = document.getElementById('loading-overlay');
    const errorBox = document.getElementById('error-box');
    const errorMessage = document.getElementById('error-message');

    try {
        // 1. Parse query parameter - URL'den ham değeri al (decode etmeden)
        const searchString = window.location.search;
        const userMatch = searchString.match(/[?&]user=([^&]*)/);
        
        if (!userMatch || !userMatch[1]) {
            throw new Error('Geçersiz giriş parametresi. Lütfen tekrar deneyin.');
        }

        // URL-encoded haliyle gönder (decode etmeden)
        const mebbisToken = userMatch[1];


        // 2. Call backend login API
        const response = await apiService.login(mebbisToken);
        

        // Backend { data: { token, kullaniciid }, errorMessage } formatında dönüyor (küçük harf)
        const loginData = response?.data;
        
        if (!loginData || !loginData.token || !loginData.kullaniciid) {
            throw new Error('Sunucudan geçersiz yanıt alındı.');
        }


        // 3. Save token and user ID
        authManager.saveAuth(loginData.token, loginData.kullaniciid);

        // 4. Redirect to app
        window.location.href = 'app.html';

    } catch (error) {
        console.error('[LoginRedirect] Login failed:', error);

        // Show error
        loader.style.display = 'none';
        errorBox.style.display = 'block';
        errorMessage.textContent = error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', handleLoginRedirect);
