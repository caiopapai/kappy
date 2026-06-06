// src/i18n.js
// i18next com namespaces por feature.
// Cada feature tem os seus próprios ficheiros de locale em locales/.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// ── Shared ────────────────────────────────────────────────────
import commonPtBR from "./shared/locales/common.pt-BR.json";
import commonPtPT from "./shared/locales/common.pt-PT.json";
import commonEn   from "./shared/locales/common.en.json";
import commonEs   from "./shared/locales/common.es.json";

import navPtBR from "./shared/locales/nav.pt-BR.json";
import navPtPT from "./shared/locales/nav.pt-PT.json";
import navEn   from "./shared/locales/nav.en.json";
import navEs   from "./shared/locales/nav.es.json";

import bannerPtBR from "./shared/locales/banner.pt-BR.json";
import bannerPtPT from "./shared/locales/banner.pt-PT.json";
import bannerEn   from "./shared/locales/banner.en.json";
import bannerEs   from "./shared/locales/banner.es.json";

// ── Features ──────────────────────────────────────────────────
import accountsPtBR from "./features/accounts/locales/pt-BR.json";
import accountsPtPT from "./features/accounts/locales/pt-PT.json";
import accountsEn   from "./features/accounts/locales/en.json";
import accountsEs   from "./features/accounts/locales/es.json";

import goalsPtBR from "./features/goals/locales/pt-BR.json";
import goalsPtPT from "./features/goals/locales/pt-PT.json";
import goalsEn   from "./features/goals/locales/en.json";
import goalsEs   from "./features/goals/locales/es.json";

import categoriesPtBR from "./features/categories/locales/pt-BR.json";
import categoriesPtPT from "./features/categories/locales/pt-PT.json";
import categoriesEn   from "./features/categories/locales/en.json";
import categoriesEs   from "./features/categories/locales/es.json";

import investmentsPtBR from "./features/investments/locales/pt-BR.json";
import investmentsPtPT from "./features/investments/locales/pt-PT.json";
import investmentsEn   from "./features/investments/locales/en.json";
import investmentsEs   from "./features/investments/locales/es.json";

import transactionsPtBR from "./features/transactions/locales/pt-BR.json";
import transactionsPtPT from "./features/transactions/locales/pt-PT.json";
import transactionsEn   from "./features/transactions/locales/en.json";
import transactionsEs   from "./features/transactions/locales/es.json";

import dashboardPtBR from "./features/dashboard/locales/pt-BR.json";
import dashboardPtPT from "./features/dashboard/locales/pt-PT.json";
import dashboardEn   from "./features/dashboard/locales/en.json";
import dashboardEs   from "./features/dashboard/locales/es.json";

import budgetPtBR from "./features/budget/locales/pt-BR.json";
import budgetPtPT from "./features/budget/locales/pt-PT.json";
import budgetEn   from "./features/budget/locales/en.json";
import budgetEs   from "./features/budget/locales/es.json";

import calendarPtBR from "./features/calendar/locales/pt-BR.json";
import calendarPtPT from "./features/calendar/locales/pt-PT.json";
import calendarEn   from "./features/calendar/locales/en.json";
import calendarEs   from "./features/calendar/locales/es.json";

import settingsPtBR from "./features/settings/locales/pt-BR.json";
import settingsPtPT from "./features/settings/locales/pt-PT.json";
import settingsEn   from "./features/settings/locales/en.json";
import settingsEs   from "./features/settings/locales/es.json";

// ── Merge numa só translation (compatibilidade com t("nav.x") existente) ──
// Mantemos o namespace "translation" único para não ter de mudar todos os
// componentes agora — a migração para useTranslation('accounts') etc.
// pode ser feita progressivamente.

function merge(...objs) {
  return Object.assign({}, ...objs);
}

const STORAGE_KEY = "kappy_language";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { translation: merge(
        commonPtBR, { nav: navPtBR, banner: bannerPtBR },
        { accounts: accountsPtBR, goals: goalsPtBR, categories: categoriesPtBR,
          investments: investmentsPtBR, transactions: transactionsPtBR,
          dashboard: dashboardPtBR, budget: budgetPtBR, calendar: calendarPtBR,
          settings: settingsPtBR }
      )},
      "pt-PT": { translation: merge(
        commonPtPT, { nav: navPtPT, banner: bannerPtPT },
        { accounts: accountsPtPT, goals: goalsPtPT, categories: categoriesPtPT,
          investments: investmentsPtPT, transactions: transactionsPtPT,
          dashboard: dashboardPtPT, budget: budgetPtPT, calendar: calendarPtPT,
          settings: settingsPtPT }
      )},
      "en": { translation: merge(
        commonEn, { nav: navEn, banner: bannerEn },
        { accounts: accountsEn, goals: goalsEn, categories: categoriesEn,
          investments: investmentsEn, transactions: transactionsEn,
          dashboard: dashboardEn, budget: budgetEn, calendar: calendarEn,
          settings: settingsEn }
      )},
      "es": { translation: merge(
        commonEs, { nav: navEs, banner: bannerEs },
        { accounts: accountsEs, goals: goalsEs, categories: categoriesEs,
          investments: investmentsEs, transactions: transactionsEs,
          dashboard: dashboardEs, budget: budgetEs, calendar: calendarEs,
          settings: settingsEs }
      )},
    },

    lng:         localStorage.getItem(STORAGE_KEY) || undefined,
    fallbackLng: "pt-BR",

    detection: {
      order:               ["localStorage", "navigator"],
      lookupLocalStorage:  STORAGE_KEY,
      caches:              ["localStorage"],
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

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