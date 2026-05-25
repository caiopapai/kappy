const SHEETS_URL = import.meta.env.VITE_SHEETS_URL ?? "";
const SHEETS_KEY = import.meta.env.VITE_SHEETS_API_KEY ?? "";

export const IS_CONFIGURED = Boolean(
  SHEETS_URL && SHEETS_URL.startsWith("https://")
);


async function getAll(sheet) {
  const params = new URLSearchParams({ sheet });
  if (SHEETS_KEY) params.append("key", SHEETS_KEY);
  const res  = await fetch(SHEETS_URL + "?" + params.toString());
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Erro ao ler " + sheet);
  return json.data;
}

async function upsert(sheet, row) {
  const res = await fetch(SHEETS_URL, {
    method: "POST",
    body: JSON.stringify({ action: "upsert", sheet, row, key: SHEETS_KEY }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

async function remove(sheet, id) {
  const res = await fetch(SHEETS_URL, {
    method: "POST",
    body: JSON.stringify({ action: "delete", sheet, id, key: SHEETS_KEY }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return true;
}

async function bulkUpsert(sheet, rows) {
  if (!rows?.length) return [];
  const res = await fetch(SHEETS_URL, {
    method: "POST",
    body: JSON.stringify({ action: "bulk_upsert", sheet, rows, key: SHEETS_KEY }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export const accountsApi = {
  getAll:  ()     => getAll("accounts"),
  save:    (row)  => upsert("accounts", row),
  delete:  (id)   => remove("accounts", id),
  seedAll: (rows) => bulkUpsert("accounts", rows),
};

export const categoriesApi = {
  getAll:  ()     => getAll("categories"),
  save:    (row)  => upsert("categories", row),
  delete:  (id)   => remove("categories", id),
  seedAll: (rows) => bulkUpsert("categories", rows),
};

export const subcategoriesApi = {
  getAll:  ()     => getAll("subcategories"),
  save:    (row)  => upsert("subcategories", row),
  delete:  (id)   => remove("subcategories", id),
  seedAll: (rows) => bulkUpsert("subcategories", rows),
};

export const goalsApi = {
  getAll:  ()     => getAll("goals"),
  save:    (row)  => upsert("goals", row),
  delete:  (id)   => remove("goals", id),
  seedAll: (rows) => bulkUpsert("goals", rows),
};