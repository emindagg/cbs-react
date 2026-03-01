import { authManager } from './services/authManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // Helper function to navigate (iframe-aware)
    const navigateTo = (url) => {
        const isIframe = window.parent !== window;
        console.log('[landingMain] navigateTo called');
        console.log('[landingMain] URL:', url);
        console.log('[landingMain] Is iframe?', isIframe);

        // Check if we're inside an iframe
        if (isIframe) {
            console.log('[landingMain] Sending postMessage to parent');
            // Add storymap/ prefix for parent context
            const parentUrl = url.startsWith('http') ? url : `storymap/${url}`;
            // Send message to parent to open in new tab
            window.parent.postMessage({
                type: 'storymap-open-new-tab',
                url: parentUrl
            }, '*');
            console.log('[landingMain] postMessage sent, NOT navigating');
        } else {
            console.log('[landingMain] Direct navigation (not in iframe)');
            // Normal navigation
            window.location.href = url;
        }
    };

    // Check if already authenticated
    if (authManager.isAuthenticated()) {
        console.log('[Landing] User already authenticated, redirecting to app');
        navigateTo('app.html');
        return;
    }

    const publicKeyInput = document.getElementById('public-key-input');
    const btnViewPublic = document.getElementById('btn-view-public');
    const btnTeacherLogin = document.getElementById('btn-teacher-login');
    const btnStudentLogin = document.getElementById('btn-student-login');
    const errorMessage = document.getElementById('public-key-error');

    // Public view handler
    btnViewPublic.addEventListener('click', () => {
        const publicKey = publicKeyInput.value.trim();

        if (!publicKey) {
            errorMessage.textContent = 'Lütfen paylaşım kodunu girin';
            errorMessage.style.display = 'block';
            return;
        }

        // Navigate to view page with public key
        const viewUrl = `view.html?code=${encodeURIComponent(publicKey)}`;
        navigateTo(viewUrl);
    });

    // Clear error on input
    publicKeyInput.addEventListener('input', () => {
        errorMessage.style.display = 'none';
    });

    // Teacher login handler
    btnTeacherLogin.addEventListener('click', () => {
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
        const loginUrl = authManager.getMebbisLoginUrl(baseUrl, 1); // 1 = teacher
        navigateTo(loginUrl);
    });

    // Student login handler
    btnStudentLogin.addEventListener('click', () => {
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
        const loginUrl = authManager.getMebbisLoginUrl(baseUrl, 0); // 0 = student
        navigateTo(loginUrl);
    });

    // Enter key on public key input
    publicKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnViewPublic.click();
        }
    });
});
