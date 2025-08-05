import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Constantes pour les paramètres par défaut
const DEFAULT_SETTINGS = {
  // Thème et apparence
  theme: 'auto', // 'light', 'dark', 'auto' (suit la préférence système)
  language: 'fr', // 'fr', 'en', etc.
  compactMode: false,
  
  // Notifications et sons
  notifications: true,
  soundEffects: true,
  autoSave: true,
  
  // Paramètres calculateur
  simulations: 100000, // Nombre d'itérations Monte Carlo
  autoCalculate: false,
  showProbabilityDetails: true,
  
  // Analytics et confidentialité
  analyticsOptIn: false,
  dataSharing: false,
  
  // Interface utilisateur
  animationsEnabled: true,
  tooltipsEnabled: true,
  advancedMode: false
};

// Créer le contexte
const SettingsContext = createContext();

// Hook personnalisé pour utiliser les paramètres
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Provider des paramètres
export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Clé localStorage basée sur l'utilisateur connecté ou générique
  const getStorageKey = () => {
    return user?.id ? `poker_settings_${user.id}` : 'poker_settings_guest';
  };

  // Charger les paramètres depuis localStorage
  const loadSettings = () => {
    try {
      const storageKey = getStorageKey();
      const savedSettings = localStorage.getItem(storageKey);
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Fusionner avec les paramètres par défaut pour les nouvelles options
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(merged);
        console.log('✅ Settings loaded:', merged);
      } else {
        console.log('📝 Using default settings');
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder les paramètres dans localStorage
  const saveSettings = (newSettings) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(newSettings));
      console.log('💾 Settings saved:', newSettings);
    } catch (error) {
      console.error('❌ Error saving settings:', error);
    }
  };

  // Mettre à jour un paramètre spécifique
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    // Appliquer immédiatement certains changements
    applySettingChange(key, value);
    
    console.log(`⚙️ Setting updated: ${key} = ${value}`);
  };

  // Mettre à jour plusieurs paramètres en une fois
  const updateSettings = (updates) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    // Appliquer les changements
    Object.entries(updates).forEach(([key, value]) => {
      applySettingChange(key, value);
    });
    
    console.log('⚙️ Multiple settings updated:', updates);
  };

  // Réinitialiser aux paramètres par défaut
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    
    // Réappliquer tous les paramètres
    Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
      applySettingChange(key, value);
    });
    
    console.log('🔄 Settings reset to default');
  };

  // Appliquer immédiatement certains changements de paramètres
  const applySettingChange = (key, value) => {
    switch (key) {
      case 'theme':
        applyTheme(value);
        break;
      case 'language':
        // Le changement de langue sera géré par le composant i18n
        document.documentElement.lang = value;
        break;
      case 'soundEffects':
        if (value && typeof window !== 'undefined') {
          playNotificationSound('settings_change');
        }
        break;
      case 'notifications':
        if (value && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
        break;
      case 'analyticsOptIn':
        if (value) {
          initializeAnalytics();
        } else {
          disableAnalytics();
        }
        break;
      case 'compactMode':
        document.body.classList.toggle('compact-mode', value);
        break;
      case 'animationsEnabled':
        document.body.classList.toggle('no-animations', !value);
        break;
      default:
        // Aucune action spéciale requise
        break;
    }
  };

  // Appliquer le thème
  const applyTheme = (theme) => {
    const html = document.documentElement;
    
    if (theme === 'auto') {
      // Suivre la préférence système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('dark', prefersDark);
      html.classList.toggle('light', !prefersDark);
    } else {
      html.classList.toggle('dark', theme === 'dark');
      html.classList.toggle('light', theme === 'light');
    }
  };

  // Fonctions utilitaires pour les effets de paramètres
  const playNotificationSound = (type = 'default') => {
    if (!settings.soundEffects) return;
    
    try {
      // Créer un son synthétique simple
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Différents sons selon le type
      const frequencies = {
        'settings_change': 800,
        'success': 1000,
        'error': 300,
        'notification': 600
      };
      
      oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  };

  const initializeAnalytics = () => {
    // Simuler l'initialisation d'analytics
    console.log('📊 Analytics initialized');
    if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  };

  const disableAnalytics = () => {
    // Simuler la désactivation d'analytics
    console.log('🚫 Analytics disabled');
    if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
    }
  };

  // Notification système (si autorisée)
  const showNotification = (title, message, options = {}) => {
    if (!settings.notifications || !('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag: 'poker-pro-calculator',
        ...options
      });
    }
  };

  // Sauvegarde automatique (simulée)
  const autoSave = (data) => {
    if (!settings.autoSave) return;
    
    // Simuler une sauvegarde automatique
    console.log('💾 Auto-save triggered:', data);
    playNotificationSound('success');
  };

  // Vérifier les privilèges premium
  const isPremiumFeature = (feature) => {
    const premiumFeatures = ['advancedMode', 'analyticsOptIn', 'dataSharing'];
    return premiumFeatures.includes(feature) && 
           user?.role !== 'moderator' && 
           user?.role !== 'admin' && 
           user?.subscription_status !== 'active';
  };

  // Charger les paramètres au démarrage ou changement d'utilisateur
  useEffect(() => {
    // Ajouter un délai pour s'assurer que le contexte Auth est initialisé
    const timeoutId = setTimeout(() => {
      loadSettings();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [user?.id]);

  // Écouter les changements de préférence système pour le thème auto
  useEffect(() => {
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [settings.theme]);

  // Appliquer les paramètres initiaux
  useEffect(() => {
    if (!isLoading) {
      // Appliquer tous les paramètres qui nécessitent une action immédiate
      Object.entries(settings).forEach(([key, value]) => {
        applySettingChange(key, value);
      });
    }
  }, [isLoading]);

  const value = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    isLoading,
    
    // Fonctions utilitaires
    playNotificationSound,
    showNotification,
    autoSave,
    isPremiumFeature,
    
    // Getters pour des valeurs calculées
    isDarkTheme: settings.theme === 'dark' || 
                 (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches),
    isLightTheme: settings.theme === 'light' || 
                  (settings.theme === 'auto' && !window.matchMedia('(prefers-color-scheme: dark)').matches),
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};