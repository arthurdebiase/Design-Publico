import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
import enTranslation from './locales/en.json';
import ptTranslation from './locales/pt.json';

// Function to detect if the user is in Brazil
const isBrazil = () => {
  try {
    // Check if the Intl.DateTimeFormat().resolvedOptions().timeZone includes Brazil
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone.includes('Brazil') || timeZone.includes('America/Sao_Paulo');
  } catch (error) {
    return false;
  }
};

// Initialize i18n
i18n
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Use language detector
  .use(LanguageDetector)
  // Initialize the i18n configuration
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      pt: {
        translation: ptTranslation
      }
    },
    // Set default language based on location
    lng: isBrazil() ? 'pt' : 'en',
    fallbackLng: 'pt', // Portuguese as default/fallback
    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator'],
      // Cache the language selection in localStorage
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;