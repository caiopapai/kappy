// src/services/engineApi.js
const ENGINE_URL = import.meta.env.VITE_ENGINE_URL ?? "http://localhost:3001";

export const stocksApi = {
  search: async (query, type = "stock") => {
    const params = new URLSearchParams({ q: query, type });
    const res    = await fetch(`${ENGINE_URL}/api/stocks/search?${params}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
  },

  /**
   * Cotação resiliente — nunca lança erro.
   * Devolve { available: true, data: {...} } ou { available: false, message: "..." }
   */
  quote: async (tickers) => {
    const list = Array.isArray(tickers) ? tickers.join(",") : tickers;
    try {
      const res  = await fetch(`${ENGINE_URL}/api/stocks/quote/${list}`);
      const json = await res.json();

      // Engine devolveu resposta amigável de não disponível
      if (!json.available) {
        return { available: false, message: json.message || "Cotação indisponível" };
      }

      return { available: true, data: json.data };
    } catch {
      return { available: false, message: "Serviço de cotações indisponível de momento" };
    }
  },

  provider: async () => {
    const res  = await fetch(`${ENGINE_URL}/api/stocks/provider`);
    const json = await res.json();
    return json.provider;
  },
};

export async function checkEngineHealth() {
  try {
    const res  = await fetch(`${ENGINE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    const json = await res.json();
    return json.ok === true;
  } catch {
    return false;
  }
}