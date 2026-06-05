// src/store/settingsStore.js
// Preferências do utilizador.
//
// Hierarquia de persistência:
//   IS_CONFIGURED = true  → lê/escreve no engine (/api/settings)
//   IS_CONFIGURED = false → lê/escreve no localStorage (modo demo)
//
// Valores por defeito aplicados no primeiro arranque.

import { create }        from "zustand";
import { IS_CONFIGURED } from "../services/sheetsApi";
import i18n              from "../i18n";

const ENGINE_URL = import.meta.env.KAPPY_ENGINE_URL || "http://localhost:3001";

const LS_KEY = "kappy_settings";

const DEFAULTS = {
  language:       "pt-BR",
  currency:       "EUR",
  theme:          "dark",
  firstRunDone:   false,
};

// ── localStorage helpers ──────────────────────────────────────

function lsLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function lsSave(settings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

// ── Engine helpers ────────────────────────────────────────────

async function engineLoad() {
  const res  = await fetch(`${ENGINE_URL}/api/settings`, { signal: AbortSignal.timeout(5000) });
  const json = await res.json();
  if (!json.ok) { throw new Error(json.error); }
  return {
    language:     json.data.language      || DEFAULTS.language,
    currency:     json.data.currency      || DEFAULTS.currency,
    theme:        json.data.theme         || DEFAULTS.theme,
    firstRunDone: json.data.first_run_done === "true",
  };
}

async function engineSave(updates) {
  // Converte camelCase → snake_case para o engine
  const payload = {};
  if (updates.language     !== undefined) { payload.language      = updates.language; }
  if (updates.currency     !== undefined) { payload.currency      = updates.currency; }
  if (updates.theme        !== undefined) { payload.theme         = updates.theme; }
  if (updates.firstRunDone !== undefined) { payload.first_run_done = String(updates.firstRunDone); }

  const res  = await fetch(`${ENGINE_URL}/api/settings`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.ok) { throw new Error(json.error); }
}

// ── Aplica o idioma ao i18n ───────────────────────────────────

function applyLanguage(lang) {
  if (lang && i18n.language !== lang) {
    i18n.changeLanguage(lang);
    localStorage.setItem("kappy_language", lang);
  }
}

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
}

// ── Store ─────────────────────────────────────────────────────

// Aplica o tema guardado em localStorage imediatamente ao carregar
// evita flash de dark→light antes do engine responder
const savedTheme = (() => {
  try {
    const ls = localStorage.getItem("kappy_settings");
    return ls ? JSON.parse(ls).theme : null;
  } catch { return null; }
})();
if (savedTheme) applyTheme(savedTheme);

export const useSettingsStore = create((set, get) => ({
  ...DEFAULTS,
  loading: false,

  // ── Carrega preferências no arranque ────────────────────────
  load: async () => {
    set({ loading: true });
    try {
      let settings;

      if (IS_CONFIGURED) {
        settings = await engineLoad();

        // Primeira vez com engine — migra preferências do localStorage
        const ls = lsLoad();
        if (!settings.firstRunDone && ls.language !== DEFAULTS.language) {
          settings.language = ls.language;
          await engineSave({ language: ls.language, firstRunDone: true });
        } else if (!settings.firstRunDone) {
          await engineSave({ firstRunDone: true });
        }
      } else {
        // Modo demo — usa localStorage
        settings = lsLoad();
      }

      set({ ...settings, loading: false });
      applyLanguage(settings.language);
      applyTheme(settings.theme);
    } catch {
      // Fallback para localStorage em caso de erro
      const settings = lsLoad();
      set({ ...settings, loading: false });
      applyLanguage(settings.language);
      applyTheme(settings.theme);
    }
  },

  // ── Actualiza uma ou mais preferências ──────────────────────
  update: async (updates) => {
    const prev = get();
    const next = { ...prev, ...updates };

    // Optimistic
    set(updates);

    // Aplica idioma imediatamente
    if (updates.language) { applyLanguage(updates.language); }
    if (updates.theme)    { applyTheme(updates.theme); }

    try {
      if (IS_CONFIGURED) {
        await engineSave(updates);
        // Sincroniza sempre com localStorage para arranque rápido sem flash
        lsSave({ ...lsLoad(), ...updates });
      } else {
        lsSave({ language: next.language, currency: next.currency, theme: next.theme, firstRunDone: next.firstRunDone });
      }
    } catch {
      // Rollback
      set(prev);
      if (prev.language) { applyLanguage(prev.language); }
    }
  },

  // ── Setters de conveniência ──────────────────────────────────
  setLanguage: (lang)     => get().update({ language: lang }),
  setCurrency: (currency) => get().update({ currency }),
  setTheme:    (theme)    => { applyTheme(theme); return get().update({ theme }); },
}));