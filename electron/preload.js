const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform detection
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  isElectron: true,

  // Notifications
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),

  // Window effects
  flashFrame: () => ipcRenderer.invoke('flash-frame'),
  setBadge: (count) => ipcRenderer.invoke('set-badge', count),

  // Theme
  onThemeChange: (callback) => {
    ipcRenderer.on('theme-changed', (event, theme) => callback(theme));
  },

  // Deep links
  onDeepLink: (callback) => {
    ipcRenderer.on('deep-link', (event, url) => callback(url));
  },

  // App events
  onFlashDeal: (callback) => {
    ipcRenderer.on('flash-deal', (event, deal) => callback(deal));
  },

  // Offline detection
  isOnline: () => navigator.onLine,
  onOnlineStatusChange: (callback) => {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  },
});

// Add smooth scrolling polyfill
document.addEventListener('DOMContentLoaded', () => {
  // Add custom scrollbar styles for desktop
  const style = document.createElement('style');
  style.textContent = `
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 107, 53, 0.4);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 107, 53, 0.6);
    }

    /* Smooth animations */
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Desktop-specific hover effects */
    @media (hover: hover) {
      .deal-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }
    }
  `;
  document.head.appendChild(style);
});

// Log that Electron is ready
console.log('SmartDealsIQ Desktop - Electron Preload Ready');
