import { useState, useEffect, useContext, createContext } from 'react';
import { useSettings } from '../contexts/SettingsContext';

// Traductions disponibles
import frTranslations from '../locales/fr.json';
import enTranslations from '../locales/en.json';

const translations = {
  fr: frTranslations,
  en: enTranslations
};

// Contexte pour les traductions
const TranslationContext = createContext();

// Provider pour les traductions
export const TranslationProvider = ({ children }) => {
  const { settings } = useSettings();
  const [currentLanguage, setCurrentLanguage] = useState(settings.language || 'fr');
  const [currentTranslations, setCurrentTranslations] = useState(translations.fr);

  // Mettre à jour la langue quand les paramètres changent
  useEffect(() => {
    if (settings.language && settings.language !== currentLanguage) {
      setCurrentLanguage(settings.language);
      setCurrentTranslations(translations[settings.language] || translations.fr);
      
      // Mettre à jour l'attribut lang du document
      document.documentElement.lang = settings.language;
      
      console.log(`🌐 Language changed to: ${settings.language}`);
    }
  }, [settings.language, currentLanguage]);

  // Fonction de traduction
  const t = (key, params = {}) => {
    // Naviguer dans l'objet de traduction avec la clé (ex: "settings.appearance.theme")
    const keys = key.split('.');
    let value = currentTranslations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`⚠️ Translation missing for key: ${key} in language: ${currentLanguage}`);
        return key; // Retourner la clé si la traduction n'existe pas
      }
    }
    
    // Remplacer les paramètres dans la chaîne (ex: "Hello {name}")
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }
    
    return value;
  };

  // Fonction pour obtenir les langues disponibles
  const getAvailableLanguages = () => {
    return [
      { code: 'fr', name: 'Français', nativeName: 'Français' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ];
  };

  // Fonction pour changer de langue
  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setCurrentLanguage(newLanguage);
      setCurrentTranslations(translations[newLanguage]);
      
      // Mettre à jour les paramètres via le contexte
      // Cette mise à jour sera gérée par le SettingsProvider
    }
  };

  const value = {
    t,
    currentLanguage,
    changeLanguage,
    getAvailableLanguages
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

// Hook pour utiliser les traductions
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

// Hook simplifié qui retourne juste la fonction de traduction
export const useT = () => {
  const { t } = useTranslation();
  return t;
};