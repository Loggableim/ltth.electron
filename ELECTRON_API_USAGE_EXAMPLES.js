/* 
 * Example: How to use the Electron API in the Renderer Process
 * 
 * This file demonstrates how to use the exposed electronAPI
 * from your frontend JavaScript code (dashboard, overlays, etc.)
 */

// =============================================================================
// 1. CHECK IF RUNNING IN ELECTRON
// =============================================================================

if (window.isElectron) {
  console.log('Running in Electron desktop app');
  // Show Electron-specific UI elements
} else {
  console.log('Running in browser (development/web mode)');
  // Hide Electron-specific features
}

// =============================================================================
// 2. GET APP VERSION
// =============================================================================

async function displayAppVersion() {
  if (window.electronAPI) {
    try {
      const version = await window.electronAPI.getAppVersion();
      console.log('App version:', version);
      
      // Display in UI
      const versionElement = document.getElementById('app-version');
      if (versionElement) {
        versionElement.textContent = `v${version}`;
      }
    } catch (error) {
      console.error('Failed to get app version:', error);
    }
  }
}

// =============================================================================
// 3. STORE USER PREFERENCES
// =============================================================================

async function saveUserPreferences(preferences) {
  if (window.electronAPI) {
    try {
      // Save entire preferences object
      await window.electronAPI.setStoreValue('userPreferences', preferences);
      console.log('Preferences saved successfully');
      
      // Save individual settings
      await window.electronAPI.setStoreValue('theme', preferences.theme);
      await window.electronAPI.setStoreValue('language', preferences.language);
      
      return true;
    } catch (error) {
      console.error('Failed to save preferences:', error);
      return false;
    }
  }
}

async function loadUserPreferences() {
  if (window.electronAPI) {
    try {
      // Load with default values
      const preferences = await window.electronAPI.getStoreValue('userPreferences', {
        theme: 'dark',
        language: 'de',
        autoConnect: false,
        volume: 80
      });
      
      console.log('Loaded preferences:', preferences);
      return preferences;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return null;
    }
  }
}

// =============================================================================
// 4. AUTO-UPDATE NOTIFICATIONS
// =============================================================================

function setupUpdateNotifications() {
  if (window.electronAPI) {
    // Listen for update available
    window.electronAPI.onUpdateAvailable((info) => {
      console.log('Update available:', info);
      
      // Show notification to user
      showNotification({
        title: 'Update verfügbar',
        message: `Version ${info.version} kann heruntergeladen werden.`,
        type: 'info'
      });
    });
    
    // Listen for update downloaded
    window.electronAPI.onUpdateDownloaded((info) => {
      console.log('Update downloaded:', info);
      
      // Show notification that app will restart
      showNotification({
        title: 'Update heruntergeladen',
        message: 'Die App wird in 5 Sekunden neu gestartet...',
        type: 'success',
        duration: 5000
      });
      
      // Optional: Show countdown
      let countdown = 5;
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(countdownInterval);
        } else {
          console.log(`Neustart in ${countdown} Sekunden...`);
        }
      }, 1000);
    });
  }
}

// Call on page load
if (window.isElectron) {
  setupUpdateNotifications();
}

// =============================================================================
// 5. COMPLETE EXAMPLE - USER SETTINGS MANAGER
// =============================================================================

class ElectronSettingsManager {
  constructor() {
    this.isElectron = window.isElectron || false;
  }
  
  async save(key, value) {
    if (!this.isElectron) {
      // Fallback to localStorage in browser mode
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
    
    try {
      await window.electronAPI.setStoreValue(key, value);
      return true;
    } catch (error) {
      console.error('Settings save failed:', error);
      return false;
    }
  }
  
  async load(key, defaultValue = null) {
    if (!this.isElectron) {
      // Fallback to localStorage in browser mode
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    }
    
    try {
      return await window.electronAPI.getStoreValue(key, defaultValue);
    } catch (error) {
      console.error('Settings load failed:', error);
      return defaultValue;
    }
  }
  
  async delete(key) {
    if (!this.isElectron) {
      localStorage.removeItem(key);
      return true;
    }
    
    try {
      await window.electronAPI.deleteStoreValue(key);
      return true;
    } catch (error) {
      console.error('Settings delete failed:', error);
      return false;
    }
  }
  
  async getAppInfo() {
    if (!this.isElectron) {
      return {
        version: 'browser',
        mode: 'web'
      };
    }
    
    try {
      const version = await window.electronAPI.getAppVersion();
      return {
        version,
        mode: 'electron'
      };
    } catch (error) {
      console.error('Failed to get app info:', error);
      return null;
    }
  }
}

// Usage example:
const settings = new ElectronSettingsManager();

async function initializeApp() {
  // Get app info
  const appInfo = await settings.getAppInfo();
  console.log('App info:', appInfo);
  
  // Load user settings
  const userSettings = await settings.load('userSettings', {
    darkMode: true,
    notifications: true,
    autoStart: false
  });
  
  // Apply settings to UI
  applySettings(userSettings);
  
  // Save when user changes settings
  document.getElementById('save-settings')?.addEventListener('click', async () => {
    const newSettings = {
      darkMode: document.getElementById('dark-mode')?.checked,
      notifications: document.getElementById('notifications')?.checked,
      autoStart: document.getElementById('auto-start')?.checked
    };
    
    const success = await settings.save('userSettings', newSettings);
    if (success) {
      console.log('Settings saved!');
    }
  });
}

function applySettings(userSettings) {
  // Apply dark mode
  if (userSettings.darkMode) {
    document.body.classList.add('dark-mode');
  }
  
  // Update UI controls
  const darkModeCheckbox = document.getElementById('dark-mode');
  if (darkModeCheckbox) {
    darkModeCheckbox.checked = userSettings.darkMode;
  }
  
  // etc...
}

// =============================================================================
// 6. UTILITY FUNCTION - SHOW NOTIFICATION
// =============================================================================

function showNotification({ title, message, type = 'info', duration = 3000 }) {
  // This is just an example - adapt to your actual notification system
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  
  // Example with browser notification API
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: '/path/to/icon.png'
    });
  }
  
  // Or show in-app notification banner
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <strong>${title}</strong>
    <p>${message}</p>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, duration);
}

// =============================================================================
// 7. INITIALIZATION
// =============================================================================

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.isElectron) {
      console.log('Electron API ready');
      displayAppVersion();
      setupUpdateNotifications();
      initializeApp();
    }
  });
} else {
  if (window.isElectron) {
    console.log('Electron API ready');
    displayAppVersion();
    setupUpdateNotifications();
    initializeApp();
  }
}
