// src/services/sheetsApi.js
// Cliente HTTP para o kappy-engine.
// O engine é o único ponto de contacto — nunca o Apps Script directamente.

const ENGINE_URL = import.meta.env.VITE_ENGINE_URL ?? "http://localhost:3001";

export const IS_CONFIGURED = Boolean(ENGINE_URL);

// ── Primitivas ───────────────────────────────────────────────

async function get(path) {
  const res  = await fetch(`${ENGINE_URL}/api/sheets/${path}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

async function post(path, body) {
  const res = await fetch(`${ENGINE_URL}/api/sheets/${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

async function remove(path) {
  const res = await fetch(`${ENGINE_URL}/api/sheets/${path}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return true;
}

async function bulkPost(path, rows) {
  return post(path, { action: "bulk", rows });
}

// ── API por entidade ─────────────────────────────────────────

function makeApi(entity) {
  return {
    getAll:  ()     => get(entity),
    save:    (row)  => post(entity, row),
    delete:  (id)   => remove(`${entity}/${id}`),
    seedAll: (rows) => bulkPost(entity, rows),
  };
}

export const accountsApi       = makeApi("accounts");
export const categoriesApi     = makeApi("categories");
export const subcategoriesApi  = makeApi("subcategories");
export const transactionsApi   = makeApi("transactions");
export const recurringRulesApi = makeApi("recurring_rules");
export const budgetsApi        = makeApi("budgets");
export const investmentsApi    = makeApi("investments");
export const goalsApi          = makeApi("goals");

// ── Transações (endpoint dedicado com lógica no engine) ───────

export const transactionsEngineApi = {
  // Cria/actualiza transação — engine actualiza saldo da conta automaticamente
  save: async (transaction) => {
    const res = await fetch(`${ENGINE_URL}/api/transactions`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ transaction }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
  },

  // Elimina transação — engine reverte saldo automaticamente
  delete: async (id) => {
    const res = await fetch(`${ENGINE_URL}/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return true;
  },

  getAll: () => makeApi("transactions").getAll(),

  // Regras recorrentes
  saveRecurring: async (rule) => {
    const res = await fetch(`${ENGINE_URL}/api/transactions/recurring`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ rule }),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
  },

  deleteRecurring: async (id) => {
    const res = await fetch(`${ENGINE_URL}/api/transactions/recurring/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return true;
  },

  getAllRecurring: () => makeApi("recurring_rules").getAll(),
};