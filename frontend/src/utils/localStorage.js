/**
 * Utilitaires pour gérer localStorage de manière sécurisée
 */

// Préfixe pour toutes les clés de l'application
const APP_PREFIX = 'poker_pro_';

// Clés de stockage utilisées dans l'application
export const STORAGE_KEYS = {
  USER_SETTINGS: 'user_settings',
  THEME_PREFERENCE: 'theme_preference',
  LANGUAGE_PREFERENCE: 'language_preference',
  CALCULATOR_HISTORY: 'calculator_history',
  USER_PREFERENCES: 'user_preferences',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LAST_LOGIN: 'last_login'
};

/**
 * Obtenir une clé avec le préfixe de l'application
 * @param {string} key - La clé sans préfixe
 * @param {string} userId - ID utilisateur optionnel pour des données spécifiques
 * @returns {string} La clé avec préfixe
 */
export const getStorageKey = (key, userId = null) => {
  if (userId) {
    return `${APP_PREFIX}${userId}_${key}`;
  }
  return `${APP_PREFIX}${key}`;
};

/**
 * Sauvegarder des données dans localStorage
 * @param {string} key - La clé de stockage
 * @param {any} data - Les données à sauvegarder
 * @param {string} userId - ID utilisateur optionnel
 * @returns {boolean} Succès ou échec
 */
export const saveToStorage = (key, data, userId = null) => {
  try {
    const storageKey = getStorageKey(key, userId);
    const serializedData = JSON.stringify({
      data,
      timestamp: Date.now(),
      version: '1.0'
    });
    
    localStorage.setItem(storageKey, serializedData);
    console.log(`💾 Saved to localStorage: ${storageKey}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
    
    // Gérer les cas d'espace insuffisant
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage quota exceeded, attempting cleanup');
      cleanupOldData();
      
      // Retry une fois après cleanup
      try {
        const storageKey = getStorageKey(key, userId);
        const serializedData = JSON.stringify({ data, timestamp: Date.now() });
        localStorage.setItem(storageKey, serializedData);
        return true;
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError);
      }
    }
    
    return false;
  }
};

/**
 * Charger des données depuis localStorage
 * @param {string} key - La clé de stockage
 * @param {any} defaultValue - Valeur par défaut si aucune donnée trouvée
 * @param {string} userId - ID utilisateur optionnel
 * @returns {any} Les données chargées ou la valeur par défaut
 */
export const loadFromStorage = (key, defaultValue = null, userId = null) => {
  try {
    const storageKey = getStorageKey(key, userId);
    const serializedData = localStorage.getItem(storageKey);
    
    if (!serializedData) {
      console.log(`📂 No data found for key: ${storageKey}, using default`);
      return defaultValue;
    }
    
    const parsed = JSON.parse(serializedData);
    
    // Vérifier la structure des données
    if (parsed && typeof parsed === 'object' && 'data' in parsed) {
      console.log(`📂 Loaded from localStorage: ${storageKey}`);
      return parsed.data;
    } else {
      // Format legacy - juste les données directement
      console.log(`📂 Loaded legacy format: ${storageKey}`);
      return parsed;
    }
  } catch (error) {
    console.error(`❌ Error loading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Supprimer des données de localStorage
 * @param {string} key - La clé de stockage
 * @param {string} userId - ID utilisateur optionnel
 * @returns {boolean} Succès ou échec
 */
export const removeFromStorage = (key, userId = null) => {
  try {
    const storageKey = getStorageKey(key, userId);
    localStorage.removeItem(storageKey);
    console.log(`🗑️ Removed from localStorage: ${storageKey}`);
    return true;
  } catch (error) {
    console.error('❌ Error removing from localStorage:', error);
    return false;
  }
};

/**
 * Vérifier si une clé existe dans localStorage
 * @param {string} key - La clé de stockage
 * @param {string} userId - ID utilisateur optionnel
 * @returns {boolean} True si la clé existe
 */
export const existsInStorage = (key, userId = null) => {
  try {
    const storageKey = getStorageKey(key, userId);
    return localStorage.getItem(storageKey) !== null;
  } catch (error) {
    console.error('❌ Error checking localStorage:', error);
    return false;
  }
};

/**
 * Obtenir la taille utilisée par localStorage (approximative)
 * @returns {number} Taille en bytes
 */
export const getStorageSize = () => {
  try {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith(APP_PREFIX)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    return totalSize;
  } catch (error) {
    console.error('❌ Error calculating storage size:', error);
    return 0;
  }
};

/**
 * Nettoyer les anciennes données pour libérer de l'espace
 * @param {number} maxAgeMs - Âge maximum des données en millisecondes (défaut: 30 jours)
 */
export const cleanupOldData = (maxAgeMs = 30 * 24 * 60 * 60 * 1000) => {
  try {
    const cutoffTime = Date.now() - maxAgeMs;
    const keysToRemove = [];
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith(APP_PREFIX)) {
        try {
          const data = JSON.parse(localStorage[key]);
          if (data && data.timestamp && data.timestamp < cutoffTime) {
            keysToRemove.push(key);
          }
        } catch (parseError) {
          // Si on ne peut pas parser, c'est probablement un ancien format
          // On le garde pour éviter de supprimer des données importantes
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Cleaned up old data: ${key}`);
    });
    
    console.log(`🧹 Cleanup completed, removed ${keysToRemove.length} old entries`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

/**
 * Exporter toutes les données utilisateur pour sauvegarde
 * @param {string} userId - ID utilisateur
 * @returns {object} Toutes les données utilisateur
 */
export const exportUserData = (userId) => {
  try {
    const userData = {};
    const userPrefix = getStorageKey('', userId).slice(0, -1); // Enlever le _ final
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith(userPrefix)) {
        const shortKey = key.replace(userPrefix + '_', '');
        try {
          userData[shortKey] = JSON.parse(localStorage[key]);
        } catch (parseError) {
          userData[shortKey] = localStorage[key];
        }
      }
    }
    
    console.log('📤 User data exported:', Object.keys(userData));
    return userData;
  } catch (error) {
    console.error('❌ Error exporting user data:', error);
    return {};
  }
};

/**
 * Importer des données utilisateur depuis une sauvegarde
 * @param {string} userId - ID utilisateur
 * @param {object} userData - Données à importer
 * @returns {boolean} Succès ou échec
 */
export const importUserData = (userId, userData) => {
  try {
    Object.entries(userData).forEach(([key, value]) => {
      saveToStorage(key, value, userId);
    });
    
    console.log('📥 User data imported successfully');
    return true;
  } catch (error) {
    console.error('❌ Error importing user data:', error);
    return false;
  }
};

// Écouter les changements de localStorage depuis d'autres onglets
export const onStorageChange = (callback) => {
  const handleStorageChange = (event) => {
    if (event.key && event.key.startsWith(APP_PREFIX)) {
      callback(event);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Retourner une fonction de cleanup
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};