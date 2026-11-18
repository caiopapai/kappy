// src/store/configStore.js
// Estado da configuração do engine — provider activo e estado da ligação.
// Consultado uma vez no arranque. As páginas usam este store para
// mostrar o estado correcto e decidir se usam dados reais ou mocks.

import { create }        from "zustand";
import { IS_CONFIGURED } from "../services/sheetsApi";

const ENGINE_URL = import.meta.env.KAPPY_ENGINE_URL || "http://localhost:3001";

export const useConfigStore = create((set) => ({
  // Estado da ligação
  checked:       false,   // true depois da primeira verificação
  connected:     false,   // engine acessível e provider operacional
  provider:      null,    // "google_sheets" | "excel_365" | etc.
  providerLabel: null,    // "Google Sheets"
  providerIcon:  null,    // "📗"
  stocks:        null,    // "brapi"
  error:         null,    // mensagem de erro se não conectado

  // Verifica o estado do engine e do provider no arranque
  check: async () => {
    if (!IS_CONFIGURED) {
      set({ checked: true, connected: false, provider: "mock", providerLabel: "Dados de Demonstração", providerIcon: "🎭" });
      return;
    }

    try {
      const res  = await fetch(`${ENGINE_URL}/api/config`, { signal: AbortSignal.timeout(5000) });
      const json = await res.json();

      set({
        checked:       true,
        connected:     json.connected,
        provider:      json.provider,
        providerLabel: json.providerLabel,
        providerIcon:  json.providerIcon,
        stocks:        json.stocks,
        error:         json.error || null,
      });
    } catch (err) {
      set({
        checked:       true,
        connected:     false,
        provider:      null,
        providerLabel: null,
        error:         "Engine inacessível: " + err.message,
      });
    }
  },
}));
