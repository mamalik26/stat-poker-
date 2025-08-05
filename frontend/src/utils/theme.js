/**
 * Utilitaires pour la gestion des thèmes
 */

// Thèmes disponibles
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// Classes CSS pour les thèmes
export const THEME_CLASSES = {
  [THEMES.LIGHT]: 'light',
  [THEMES.DARK]: 'dark',
  [THEMES.AUTO]: 'auto'
};

/**
 * Détecter la préférence système de l'utilisateur
 * @returns {string} 'dark' ou 'light'
 */
export const getSystemThemePreference = () => {
  if (typeof window === 'undefined') return THEMES.LIGHT;
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? THEMES.DARK 
    : THEMES.LIGHT;
};

/**
 * Appliquer un thème au document
 * @param {string} theme - Le thème à appliquer ('light', 'dark', 'auto')
 */
export const applyTheme = (theme) => {
  const html = document.documentElement;
  const body = document.body;
  
  // Supprimer toutes les classes de thème existantes
  html.classList.remove(THEMES.LIGHT, THEMES.DARK);
  body.classList.remove(`theme-${THEMES.LIGHT}`, `theme-${THEMES.DARK}`);
  
  let effectiveTheme = theme;
  
  if (theme === THEMES.AUTO) {
    effectiveTheme = getSystemThemePreference();
  }
  
  // Appliquer les classes de thème
  html.classList.add(effectiveTheme);
  body.classList.add(`theme-${effectiveTheme}`);
  
  // Mettre à jour les meta tags pour mobile
  updateThemeColorMeta(effectiveTheme);
  
  console.log(`🎨 Theme applied: ${theme} (effective: ${effectiveTheme})`);
};

/**
 * Mettre à jour les couleurs des meta tags pour mobile
 * @param {string} theme - Le thème effectif
 */
const updateThemeColorMeta = (theme) => {
  const themeColors = {
    [THEMES.LIGHT]: '#ffffff',
    [THEMES.DARK]: '#1a1a1a'
  };
  
  const statusBarColors = {
    [THEMES.LIGHT]: '#f8f9fa',
    [THEMES.DARK]: '#0f0f10'
  };
  
  // Meta tag pour la barre de statut mobile
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.content = themeColors[theme] || themeColors[THEMES.LIGHT];
  
  // Meta tag pour iOS Safari
  let appleMobileWebMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!appleMobileWebMeta) {
    appleMobileWebMeta = document.createElement('meta');
    appleMobileWebMeta.name = 'apple-mobile-web-app-status-bar-style';
    document.head.appendChild(appleMobileWebMeta);
  }
  appleMobileWebMeta.content = theme === THEMES.DARK ? 'black-translucent' : 'default';
};

/**
 * Écouter les changements de préférence système
 * @param {function} callback - Fonction appelée lors du changement
 * @returns {function} Fonction de cleanup
 */
export const watchSystemTheme = (callback) => {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (event) => {
    const newTheme = event.matches ? THEMES.DARK : THEMES.LIGHT;
    callback(newTheme);
  };
  
  // Écouter les changements
  if (mediaQuery.addListener) {
    mediaQuery.addListener(handleChange);
  } else {
    // Fallback pour les navigateurs plus anciens
    mediaQuery.addEventListener('change', handleChange);
  }
  
  // Fonction de cleanup
  return () => {
    if (mediaQuery.removeListener) {
      mediaQuery.removeListener(handleChange);
    } else {
      mediaQuery.removeEventListener('change', handleChange);
    }
  };
};

/**
 * Obtenir le thème actuellement appliqué
 * @returns {string} Le thème actuel
 */
export const getCurrentTheme = () => {
  if (typeof window === 'undefined') return THEMES.LIGHT;
  
  const html = document.documentElement;
  
  if (html.classList.contains(THEMES.DARK)) {
    return THEMES.DARK;
  } else if (html.classList.contains(THEMES.LIGHT)) {
    return THEMES.LIGHT;
  }
  
  // Fallback sur la préférence système
  return getSystemThemePreference();
};

/**
 * Vérifier si le thème sombre est actif
 * @returns {boolean} True si le thème sombre est actif
 */
export const isDarkTheme = () => {
  return getCurrentTheme() === THEMES.DARK;
};

/**
 * Vérifier si le thème clair est actif
 * @returns {boolean} True si le thème clair est actif
 */
export const isLightTheme = () => {
  return getCurrentTheme() === THEMES.LIGHT;
};

/**
 * Basculer entre thème clair et sombre
 * @returns {string} Le nouveau thème
 */
export const toggleTheme = () => {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  applyTheme(newTheme);
  return newTheme;
};

/**
 * Obtenir les propriétés CSS personnalisées pour un thème
 * @param {string} theme - Le thème
 * @returns {object} Les propriétés CSS
 */
export const getThemeProperties = (theme) => {
  const properties = {
    [THEMES.LIGHT]: {
      '--background': '0 0% 100%',
      '--foreground': '0 0% 3.9%',
      '--primary': '0 0% 9%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '0 0% 96.1%',
      '--secondary-foreground': '0 0% 9%',
      '--muted': '0 0% 96.1%',
      '--muted-foreground': '0 0% 45.1%',
      '--border': '0 0% 89.8%',
      '--input': '0 0% 89.8%'
    },
    [THEMES.DARK]: {
      '--background': '0 0% 3.9%',
      '--foreground': '0 0% 98%',
      '--primary': '0 0% 98%',
      '--primary-foreground': '0 0% 9%',
      '--secondary': '0 0% 14.9%',
      '--secondary-foreground': '0 0% 98%',
      '--muted': '0 0% 14.9%',
      '--muted-foreground': '0 0% 63.9%',
      '--border': '0 0% 14.9%',
      '--input': '0 0% 14.9%'
    }
  };
  
  return properties[theme] || properties[THEMES.LIGHT];
};

/**
 * Appliquer des propriétés CSS personnalisées
 * @param {object} properties - Les propriétés CSS à appliquer
 */
export const applyCSSProperties = (properties) => {
  const root = document.documentElement;
  
  Object.entries(properties).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

/**
 * Initialiser le thème au démarrage de l'application
 * @param {string} savedTheme - Le thème sauvegardé (optionnel)
 */
export const initializeTheme = (savedTheme = null) => {
  let themeToApply = savedTheme;
  
  if (!themeToApply) {
    // Si aucun thème sauvegardé, utiliser la préférence système
    themeToApply = THEMES.AUTO;
  }
  
  applyTheme(themeToApply);
  
  console.log(`🎨 Theme initialized: ${themeToApply}`);
};