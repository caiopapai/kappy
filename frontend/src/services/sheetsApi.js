// src/services/sheetsApi.js
// Todas as chamadas passam pelo kappy-engine.

const ENGINE_URL = import.meta.env.KAPPY_ENGINE_URL || "http://localhost:3001";

// IS_CONFIGURED — true quando KAPPY_ENGINE_URL está definido no .env.local
// Com o engine desligado os stores usam dados mock (INITIAL_*)
export const IS_CONFIGURED = Boolean(import.meta.env.KAPPY_ENGINE_URL);

// ── Factory de API por entidade ───────────────────────────────

function makeApi(entity) {
  const base = `${ENGINE_URL}/api/${entity}`;

  return {
    getAll: async () => {
      const res  = await fetch(base);
      if (!res.ok) { throw new Error("HTTP " + res.status); }
      const json = await res.json();
      if (!json.ok) { throw new Error(json.error); }
      return json.data;
    },

    save: async (row) => {
      const res  = await fetch(base, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ row }),
      });
      if (!res.ok) { throw new Error("HTTP " + res.status); }
      const json = await res.json();
      if (!json.ok) { throw new Error(json.error); }
      return json.data;
    },

    bulkSave: async (rows) => {
      const res  = await fetch(`${base}/bulk`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ rows }),
      });
      if (!res.ok) { throw new Error("HTTP " + res.status); }
      const json = await res.json();
      if (!json.ok) { throw new Error(json.error); }
      return json;
    },

    delete: async (id) => {
      const res  = await fetch(`${base}/${id}`, { method: "DELETE" });
      if (!res.ok) { throw new Error("HTTP " + res.status); }
      const json = await res.json();
      if (!json.ok) { throw new Error(json.error); }
      return true;
    },
  };
}

// ── APIs por entidade ─────────────────────────────────────────

export const accountsApi       = makeApi("accounts");
export const categoriesApi = {
  ...makeApi("categories"),
  getPage: async (page, limit = 10) => {
    const res  = await fetch(`${ENGINE_URL}/api/categories?page=${page}&limit=${limit}`);
    if (!res.ok) { throw new Error("HTTP " + res.status); }
    const json = await res.json();
    if (!json.ok) { throw new Error(json.error); }
    return json; // { data, total, page, pages, limit }
  },
};

export const subcategoriesApi = {
  ...makeApi("subcategories"),
  getPage: async (page, limit = 10) => {
    const res  = await fetch(`${ENGINE_URL}/api/subcategories?page=${page}&limit=${limit}`);
    if (!res.ok) { throw new Error("HTTP " + res.status); }
    const json = await res.json();
    if (!json.ok) { throw new Error(json.error); }
    return json;
  },
};
export const transactionsApi   = makeApi("transactions");
export const recurringRulesApi = makeApi("recurring_rules");
export const investmentsApi    = makeApi("investments");
export const goalsApi          = makeApi("goals");
export const budgetsApi        = makeApi("budgets");

// ── Transações (lógica de saldo no engine) ────────────────────

export const transactionsEngineApi = {
  save: async (transaction) => {
    const res  = await fetch(`${ENGINE_URL}/api/transactions`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ transaction }),
    });
    if (!res.ok) { throw new Error("HTTP " + res.status); }
    const json = await res.json();
    if (!json.ok) { throw new Error(json.error); }
    return json.data;
  },

  delete: async (id) => {
    const res  = await fetch(`${ENGINE_URL}/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) { throw new Error("HTTP " + res.status); }
    const json = await res.json();
    if (!json.ok) { throw new Error(json.error); }
    return true;
  },

  getAll:        () => makeApi("transactions").getAll(),
  getAllRecurring:() => makeApi("recurring_rules").getAll(),

  saveRecurring: async (rule) => {
    const res  = await fetch(`${ENGINE_URL}/api/transactions/recurring`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ rule }),
    });
    if (!res.ok) { throw new Error("HTTP " + res.status); }
    const json = await res.json();
    if (!json.ok) { throw new Error(json.error); }
    return json.data;
  },

  deleteRecurring: async (id) => {
    const res  = await fetch(`${ENGINE_URL}/api/transactions/recurring/${id}`, { method: "DELETE" });
    if (!res.ok) { throw new Error("HTTP " + res.status); }
    const json = await res.json();
    if (!json.ok) { throw new Error(json.error); }
    return true;
  },
};

// ── Stocks ────────────────────────────────────────────────────

export const stocksApi = {
  search: async (query, type = "stock") => {
    const params = new URLSearchParams({ q: query, type });
    const res    = await fetch(`${ENGINE_URL}/api/stocks/search?${params}`);
    if (!res.ok) { throw new Error("HTTP " + res.status); }
    const json   = await res.json();
    if (!json.ok) { throw new Error(json.error); }
    return json.data;
  },

  quote: async (tickers) => {
    const list = Array.isArray(tickers) ? tickers.join(",") : tickers;
    try {
      const res  = await fetch(`${ENGINE_URL}/api/stocks/quote/${list}`);
      const json = await res.json();
      if (!json.available) {
        return { available: false, message: json.message || "Cotação indisponível" };
      }
      return { available: true, data: json.data };
    } catch {
      return { available: false, message: "Serviço de cotações indisponível" };
    }
  },
};

export async function bootstrapApi() {
  const res  = await fetch(`${ENGINE_URL}/api/bootstrap`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) { throw new Error("HTTP " + res.status); }
  const json = await res.json();
  if (!json.ok) { throw new Error(json.error); }
  return json.data;
}

export async function checkEngineHealth() {
  try {
    const res  = await fetch(`${ENGINE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    const json = await res.json();
    return json.ok === true;
  } catch {
    return false;
  }
}