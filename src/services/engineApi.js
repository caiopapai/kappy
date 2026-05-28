// src/services/engineApi.js
// Cliente para os endpoints do kappy-engine que não são sheets.
// Actualmente: cotações e pesquisa de ativos.

const ENGINE_URL = import.meta.env.VITE_ENGINE_URL ?? "http://localhost:3001";

// ── Stocks ────────────────────────────────────────────────────

export const stocksApi = {
  /**
   * Pesquisa ativos por ticker ou nome.
   * @param {string} query - Ex: "PETR", "Petrobras"
   * @param {string} type  - "stock" | "fii" | "bdr" | "all"
   * @returns {Promise<Array<{ ticker, name, type, price, change, currency }>>}
   */
  search: async (query, type = "stock") => {
    const params = new URLSearchParams({ q: query, type });
    const res    = await fetch(`${ENGINE_URL}/api/stocks/search?${params}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
  },

  /**
   * Cotação em tempo real de um ou mais tickers.
   * @param {string|string[]} tickers - Ex: "PETR4" ou ["PETR4","VALE3"]
   * @returns {Promise<{ ticker, name, price, currency, change, changePercent, source }>}
   */
  quote: async (tickers) => {
    const list = Array.isArray(tickers) ? tickers.join(",") : tickers;
    const res  = await fetch(`${ENGINE_URL}/api/stocks/quote/${list}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
  },

  /**
   * Provider de cotações activo no engine.
   * @returns {Promise<string>}
   */
  provider: async () => {
    const res  = await fetch(`${ENGINE_URL}/api/stocks/provider`);
    const json = await res.json();
    return json.provider;
  },
};

// ── Health ────────────────────────────────────────────────────

export async function checkEngineHealth() {
  try {
    const res  = await fetch(`${ENGINE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    const json = await res.json();
    return json.ok === true;
  } catch {
    return false;
  }
}
