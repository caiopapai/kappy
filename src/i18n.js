// src/i18n.js
// Configuração do i18next para suporte a múltiplos idiomas.
// Idiomas disponíveis: pt-BR, pt-PT, en, es

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBR from "./locale/pt-BR.json";
import ptPT from "./locale/pt-PT.json";
import en   from "./locale/en.json";
import es   from "./locale/es.json";

const STORAGE_KEY = "kappy_language";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { translation: ptBR },
      "pt-PT": { translation: ptPT },
      "en":    { translation: en  },
      "es":    { translation: es  },
    },

    // Idioma guardado pelo utilizador → detector do browser → fallback
    lng: localStorage.getItem(STORAGE_KEY) || undefined,
    fallbackLng: "pt-BR",

    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },

    interpolation: {
      escapeValue: false, // React já escapa por defeito
    },
  });

export default i18n;

// Utilitário para mudar idioma e persistir a escolha
export function setLanguage(lang) {
  localStorage.setItem(STORAGE_KEY, lang);
  i18n.changeLanguage(lang);
}

export const SUPPORTED_LANGUAGES = [
  { code: "pt-BR", label: "Português (Brasil)",   flag: "🇧🇷" },
  { code: "pt-PT", label: "Português (Portugal)", flag: "🇵🇹" },
  { code: "en",    label: "English",              flag: "🇬🇧" },
  { code: "es",    label: "Español",              flag: "🇪🇸" },
];
