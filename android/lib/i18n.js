// lib/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Safely import translation files with fallbacks
let enTranslation, hiTranslation, khaTranslation, brxTranslation;

try {
  enTranslation = require('./locales/en/translation.json');
} catch (error) {
  console.warn('English translations not found, using fallback');
  enTranslation = {};
}

try {
  hiTranslation = require('./locales/hi/translation.json');
} catch (error) {
  console.warn('Hindi translations not found, using fallback');
  hiTranslation = {};
}

try {
  khaTranslation = require('./locales/kha/translation.json');
} catch (error) {
  console.warn('Khasi translations not found, using fallback');
  khaTranslation = {};
}

try {
  brxTranslation = require('./locales/brx/translation.json');
} catch (error) {
  console.warn('Bodo translations not found, using fallback');
  brxTranslation = {};
}

// Safely get device locale
const getDeviceLocale = () => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0 && locales[0].languageCode) {
      return locales[0].languageCode;
    }
  } catch (error) {
    console.warn('Failed to get device locale:', error);
  }
  return 'en'; // fallback to English
};

// Initialize i18n with error handling
const initializeI18n = async () => {
  try {
    await i18n
      .use(initReactI18next)
      .init({
        compatibilityJSON: 'v3',
        resources: {
          en: { translation: enTranslation },
          hi: { translation: hiTranslation },
          kha: { translation: khaTranslation }, 
          brx: { translation: brxTranslation }, 
        },
        lng: getDeviceLocale(),
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false, // Prevent suspense-related crashes
        },
        // Add missing translation handler
        missingKeyHandler: (lng, ns, key, fallbackValue) => {
          console.warn(`Missing translation: ${lng}.${ns}.${key}`);
          return fallbackValue || key;
        },
        // Add error handling
        initImmediate: false,
        debug: __DEV__ ? true : false,
      });
    
    console.log('i18n initialized successfully');
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    // Initialize with minimal config as fallback
    try {
      await i18n.init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
          en: { translation: {} }
        },
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        }
      });
    } catch (fallbackError) {
      console.error('Even fallback i18n initialization failed:', fallbackError);
    }
  }
};

// Initialize immediately
initializeI18n();

export default i18n;