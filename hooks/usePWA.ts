import { useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  useEffect(() => {
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = event;
      
      // Show install button/banner
      showInstallPromotion();
    };

    const showInstallPromotion = () => {
      // Check if we should show the install promotion
      if (deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
        // Create install banner
        const installBanner = document.createElement('div');
        installBanner.id = 'install-banner';
        installBanner.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #0ea5e9, #3b82f6);
          color: white;
          padding: 12px;
          text-align: center;
          z-index: 10000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          transform: translateY(-100%);
          transition: transform 0.3s ease;
        `;
        
        installBanner.innerHTML = `
          <div style="max-width: 600px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <span style="font-size: 14px; flex: 1;">📱 Install Foam CRM for quick access and offline use</span>
            <button id="install-btn" style="
              background: rgba(255,255,255,0.2);
              border: 1px solid rgba(255,255,255,0.3);
              color: white;
              padding: 6px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
            ">Install</button>
            <button id="dismiss-btn" style="
              background: transparent;
              border: none;
              color: white;
              padding: 6px;
              cursor: pointer;
              font-size: 18px;
              font-weight: bold;
            ">×</button>
          </div>
        `;
        
        document.body.appendChild(installBanner);
        
        // Animate in
        setTimeout(() => {
          installBanner.style.transform = 'translateY(0)';
        }, 100);
        
        // Handle install button click
        const installBtn = document.getElementById('install-btn');
        const dismissBtn = document.getElementById('dismiss-btn');
        
        installBtn?.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            deferredPrompt = null;
            installBanner.remove();
          }
        });
        
        dismissBtn?.addEventListener('click', () => {
          installBanner.style.transform = 'translateY(-100%)';
          setTimeout(() => installBanner.remove(), 300);
          localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        });
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          if (installBanner.parentNode) {
            installBanner.style.transform = 'translateY(-100%)';
            setTimeout(() => installBanner.remove(), 300);
          }
        }, 10000);
      }
    };

    // Check if we should show install promotion
    const lastDismissed = localStorage.getItem('pwa-install-dismissed');
    const shouldShow = !lastDismissed || (Date.now() - parseInt(lastDismissed)) > 7 * 24 * 60 * 60 * 1000; // 7 days

    if (shouldShow) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      deferredPrompt = null;
      // Remove install banner if it exists
      const banner = document.getElementById('install-banner');
      if (banner) banner.remove();
    });

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('App is running in standalone mode');
      // Add any standalone mode specific styling
      document.documentElement.classList.add('pwa-standalone');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Return utilities for manual PWA management
  return {
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    canInstall: 'BeforeInstallPromptEvent' in window,
  };
};

export default usePWA;