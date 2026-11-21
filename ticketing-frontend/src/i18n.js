import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationFr from './locales/fr/translation.json'; // Fichier français
import translationEn from './locales/en/translation.json'; // Fichier anglais
import translationDe from './locales/de/translation.json'; // Fichier allemand
import translationIt from './locales/it/translation.json'; // Fichier italien
import translationAr from './locales/ar/translation.json'; // Fichier arabe

i18n
  .use(initReactI18next) // Intégration avec React
  .init({
    resources: {
      fr: { translation: translationFr },
      en: { translation: translationEn },
      de: { translation: translationDe },
      it: { translation: translationIt },
      ar: { translation: translationAr }
    },
    lng: localStorage.getItem('language') || 'fr', // Langue par défaut ou celle stockée
    fallbackLng: 'fr', // Langue de secours
    interpolation: {
      escapeValue: false, // Pas besoin d'échapper les valeurs dans React
    },
  });

export default i18n;


