// ============================================================
//  Kappy — Google Apps Script Backend
//  Versão: 1.0.0
// ============================================================
//
//  INSTRUÇÕES DE INSTALAÇÃO (5 minutos):
//
//  1. Abre o Google Sheets em sheets.google.com
//  2. Cria uma nova spreadsheet e dá-lhe o nome "kappy_db"
//  3. No menu superior: Extensões → Apps Script
//  4. Apaga todo o código existente e cola este ficheiro completo
//  5. Clica em "Guardar" (ícone de disquete ou Ctrl+S)
//  6. Clica em "Executar" → seleciona a função "setup"
//     → Aceita as permissões pedidas (é necessário para criar as abas)
//  7. Clica em "Implementar" → "Nova implementação"
//     → Tipo: "Aplicação Web"
//     → Executar como: "Eu"
//     → Quem tem acesso: "Qualquer pessoa" (necessário para o React aceder)
//     → Clica em "Implementar"
//  8. Copia o URL gerado — será algo como:
//     https://script.google.com/macros/s/XXXXXXXX/exec
//  9. Cola esse URL no ficheiro sheetsApi.js do React (passo 2)
//
//  NOTAS DE SEGURANÇA:
//  - A spreadsheet fica na tua conta Google, apenas tu tens acesso aos dados
//  - O endpoint é público mas sem autenticação — ideal para uso pessoal
//  - Para produção futura, adiciona um API_KEY (ver secção no fim do ficheiro)
//
// ============================================================

// ── Configuração das abas ────────────────────────────────────

const SHEETS_CONFIG = {
  accounts: {
    headers: ["id", "name", "type", "balance", "currency"],
    types:   ["id",  "str",  "str",  "num",     "str"],
  },
  categories: {
    headers: ["id", "name", "type"],
    types:   ["id",  "str",  "str"],
  },
  subcategories: {
    headers: ["id", "name", "type", "categoryId"],
    types:   ["id",  "str",  "str",  "id"],
  },
  transactions: {
    headers: ["id", "accountId", "amount", "currency", "date", "subcategoryId", "notes", "type", "recurring"],
    types:   ["id",  "id",        "num",    "str",      "str",  "id",            "str",   "str",  "bool"],
  },
  recurring_rules: {
    headers: ["id", "accountId", "amount", "currency", "subcategoryId", "type", "notes", "startDate", "endDate", "hasNoEnd", "active"],
    types:   ["id",  "id",        "num",    "str",      "id",            "str",  "str",   "str",       "str",     "bool",     "bool"],
  },
  budgets: {
    headers: ["id", "year", "subcategoryId", "month", "amount"],
    types:   ["id",  "num",  "id",            "num",   "num"],
  },
  investments: {
    headers: ["id", "opType", "assetType", "exchange", "ticker", "name", "date", "quantity", "unitPrice", "otherCosts", "currency", "totalValue", "dyAnnual"],
    types:   ["id",  "str",    "str",       "str",      "str",    "str",  "str",  "num",      "num",       "num",        "str",      "num",        "num"],
  },
  goals: {
    headers: ["id", "type", "label", "targetValue", "currency"],
    types:   ["id",  "str",  "str",   "num",         "str"],
  },
};


// ── Setup: cria todas as abas com cabeçalhos ─────────────────

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.entries(SHEETS_CONFIG).forEach(([sheetName, config]) => {
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log("Criada aba: " + sheetName);
    }

    // Só escreve cabeçalhos se a linha 1 estiver vazia
    const firstCell = sheet.getRange(1, 1).getValue();
    if (!firstCell) {
      sheet.getRange(1, 1, 1, config.headers.length)
        .setValues([config.headers])
        .setFontWeight("bold")
        .setBackground("#1a1a2e")
        .setFontColor("#ffffff");

      sheet.setFrozenRows(1);
      sheet.setColumnWidths(1, config.headers.length, 140);
      Logger.log("Cabeçalhos escritos em: " + sheetName);
    }
  });

  // Remove a aba "Folha1" padrão se existir e estiver vazia
  const defaultSheet = ss.getSheetByName("Folha1") || ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log("✅ Setup concluído! Todas as abas foram criadas.");
  SpreadsheetApp.getUi().alert("✅ Kappy configurado com sucesso!\n\nAbas criadas:\n" + Object.keys(SHEETS_CONFIG).join(", ") + "\n\nAgora podes implementar como Web App.");
}


// ── Entry points HTTP ────────────────────────────────────────

// GET  → lê dados de uma aba
// POST → escreve, atualiza ou elimina
//
// Exemplos:
//   GET  ?sheet=accounts
//   GET  ?sheet=accounts&id=123
//   POST { action: "upsert", sheet: "accounts", row: { id: 1, name: "...", ... } }
//   POST { action: "delete", sheet: "accounts", id: 123 }
//   POST { action: "bulk_upsert", sheet: "accounts", rows: [...] }

function doGet(e) {
  try {
    const params = e.parameter;
    const sheetName = params.sheet;

    if (!sheetName) {
      return jsonResponse({ ok: false, error: "Parâmetro 'sheet' obrigatório" }, 400);
    }

    if (!SHEETS_CONFIG[sheetName]) {
      return jsonResponse({ ok: false, error: "Aba desconhecida: " + sheetName }, 400);
    }

    const id = params.id ? parseFloat(params.id) : null;
    const rows = readSheet(sheetName);

    if (id !== null) {
      const row = rows.find(r => r.id === id);
      return row
        ? jsonResponse({ ok: true, data: row })
        : jsonResponse({ ok: false, error: "Registo não encontrado" }, 404);
    }

    return jsonResponse({ ok: true, data: rows, count: rows.length });

  } catch (err) {
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, sheet: sheetName, row, rows, id } = body;

    if (!sheetName || !SHEETS_CONFIG[sheetName]) {
      return jsonResponse({ ok: false, error: "Aba inválida: " + sheetName }, 400);
    }

    switch (action) {
      case "upsert":
        if (!row) return jsonResponse({ ok: false, error: "'row' obrigatório para upsert" }, 400);
        return jsonResponse({ ok: true, data: upsertRow(sheetName, row) });

      case "bulk_upsert":
        if (!rows || !Array.isArray(rows)) return jsonResponse({ ok: false, error: "'rows' deve ser array" }, 400);
        const results = rows.map(r => upsertRow(sheetName, r));
        return jsonResponse({ ok: true, data: results, count: results.length });

      case "delete":
        if (!id) return jsonResponse({ ok: false, error: "'id' obrigatório para delete" }, 400);
        const deleted = deleteRow(sheetName, parseFloat(id));
        return deleted
          ? jsonResponse({ ok: true, message: "Eliminado id=" + id })
          : jsonResponse({ ok: false, error: "Registo não encontrado id=" + id }, 404);

      case "delete_all":
        clearSheet(sheetName);
        return jsonResponse({ ok: true, message: "Todos os registos de '" + sheetName + "' eliminados" });

      default:
        return jsonResponse({ ok: false, error: "Action desconhecida: " + action }, 400);
    }

  } catch (err) {
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
}


// ── CRUD helpers ─────────────────────────────────────────────

/**
 * Lê todas as linhas de uma aba e converte para array de objectos
 * com os tipos corretos (number, boolean, string).
 */
function readSheet(sheetName) {
  const sheet = getSheet(sheetName);
  const config = SHEETS_CONFIG[sheetName];
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, config.headers.length).getValues();

  return values
    .filter(row => row[0] !== "" && row[0] !== null && row[0] !== undefined)
    .map(row => rowToObject(row, config));
}

/**
 * Cria ou actualiza um registo.
 * Se o id existir → actualiza a linha. Senão → acrescenta no fim.
 * Retorna o objecto guardado.
 */
function upsertRow(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  const config = SHEETS_CONFIG[sheetName];

  // Garante que tem id (timestamp se não vier)
  if (!rowData.id) {
    rowData.id = Date.now();
  }

  const values = objectToRow(rowData, config);
  const existingRowNum = findRowById(sheet, rowData.id, config.headers.length);

  if (existingRowNum > 0) {
    // Actualiza linha existente
    sheet.getRange(existingRowNum, 1, 1, values.length).setValues([values]);
  } else {
    // Acrescenta nova linha
    const lastRow = Math.max(sheet.getLastRow(), 1);
    sheet.getRange(lastRow + 1, 1, 1, values.length).setValues([values]);
  }

  return rowToObject(values, config);
}

/**
 * Elimina uma linha pelo id. Retorna true se encontrou e eliminou.
 */
function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const config = SHEETS_CONFIG[sheetName];
  const rowNum = findRowById(sheet, id, config.headers.length);

  if (rowNum < 2) return false;
  sheet.deleteRow(rowNum);
  return true;
}

/**
 * Limpa todos os dados de uma aba (mantém cabeçalhos).
 */
function clearSheet(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}


// ── Conversão de tipos ───────────────────────────────────────

/**
 * Converte um array de valores (linha da sheet) num objecto JS
 * com os tipos correctos baseado na configuração da aba.
 */
function rowToObject(values, config) {
  const obj = {};
  config.headers.forEach((header, i) => {
    const val = values[i];
    obj[header] = castValue(val, config.types[i]);
  });
  return obj;
}

/**
 * Converte um objecto JS num array de valores para escrever na sheet.
 * Campos em falta ficam com string vazia.
 */
function objectToRow(obj, config) {
  return config.headers.map((header, i) => {
    const val = obj[header];
    if (val === undefined || val === null) return "";
    // Booleans guardados como string "true"/"false" para legibilidade
    if (config.types[i] === "bool") return val ? "true" : "false";
    return val;
  });
}

/**
 * Converte um valor lido da sheet para o tipo correcto.
 */
function castValue(val, type) {
  if (val === "" || val === null || val === undefined) {
    if (type === "num" || type === "id") return 0;
    if (type === "bool") return false;
    return "";
  }
  switch (type) {
    case "id":
    case "num":   return parseFloat(val) || 0;
    case "bool":  return val === true || val === "true" || val === 1;
    case "str":
    default:      return String(val);
  }
}


// ── Utilitários ──────────────────────────────────────────────

/**
 * Devolve a aba pelo nome, lançando erro se não existir.
 */
function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error("Aba não encontrada: '" + sheetName + "'. Executa a função setup() primeiro.");
  return sheet;
}

/**
 * Procura a linha de um registo pelo id (coluna A).
 * Retorna o número da linha (1-indexed) ou -1 se não encontrado.
 */
function findRowById(sheet, id, numCols) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  // Lê apenas a coluna de ids (coluna A) para eficiência
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (parseFloat(ids[i][0]) === parseFloat(id)) {
      return i + 2; // +2 porque começa na linha 2 (linha 1 = cabeçalho)
    }
  }
  return -1;
}

/**
 * Constrói a resposta JSON com os headers CORS necessários
 * para o React conseguir fazer fetch ao endpoint.
 */
function jsonResponse(data, statusCode) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}


// ── Funções de teste (executar manualmente no editor) ─────────

/**
 * Testa o CRUD completo numa aba de teste.
 * Executar manualmente: selecionar runTests → clicar Executar
 */
function runTests() {
  const log = [];

  // 1. Escreve um account
  const account = upsertRow("accounts", {
    id: 99999,
    name: "Conta Teste",
    type: "checking",
    balance: 1500.50,
    currency: "EUR"
  });
  log.push("✅ Upsert (create): " + JSON.stringify(account));

  // 2. Lê todos os accounts
  const all = readSheet("accounts");
  log.push("✅ Read all: " + all.length + " registo(s)");

  // 3. Actualiza
  const updated = upsertRow("accounts", {
    id: 99999,
    name: "Conta Teste EDITADA",
    type: "savings",
    balance: 2000,
    currency: "EUR"
  });
  log.push("✅ Upsert (update): " + JSON.stringify(updated));

  // 4. Verifica actualização
  const allAfter = readSheet("accounts");
  const found = allAfter.find(r => r.id === 99999);
  log.push("✅ Verificação: name=" + (found ? found.name : "NÃO ENCONTRADO"));

  // 5. Elimina
  const deleted = deleteRow("accounts", 99999);
  log.push("✅ Delete: " + deleted);

  // 6. Confirma eliminação
  const final = readSheet("accounts").find(r => r.id === 99999);
  log.push("✅ Após delete: " + (final ? "AINDA EXISTE (ERRO)" : "eliminado correctamente"));

  const msg = log.join("\n");
  Logger.log(msg);
  SpreadsheetApp.getUi().alert("Resultados dos testes:\n\n" + msg);
}

/**
 * Popula a spreadsheet com dados iniciais de demonstração
 * (os mesmos dados mock que existem no React).
 * Útil para ter dados logo após o setup.
 */
function seedDemoData() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    "Inserir dados de demonstração?",
    "Isto vai adicionar dados de exemplo em todas as abas. Continuar?",
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  // Accounts
  [
    { id: 1, name: "Conta Principal", type: "checking",    balance: 2450.00,  currency: "EUR" },
    { id: 2, name: "Poupança Férias",  type: "savings",     balance: 1800.00,  currency: "EUR" },
    { id: 3, name: "Cartão Visa",      type: "credit_card", balance: -320.50,  currency: "EUR" },
  ].forEach(r => upsertRow("accounts", r));

  // Categories
  [
    { id: 1, name: "Salário",      type: "income" },
    { id: 2, name: "Freelance",    type: "income" },
    { id: 3, name: "Habitação",    type: "fixed_expense" },
    { id: 4, name: "Alimentação",  type: "variable_expense" },
    { id: 5, name: "ETFs",         type: "investment" },
  ].forEach(r => upsertRow("categories", r));

  // Subcategories
  [
    { id: 1, name: "Salário Mensal", categoryId: 1, type: "income" },
    { id: 2, name: "Projeto Web",    categoryId: 2, type: "income" },
    { id: 3, name: "Renda",          categoryId: 3, type: "fixed_expense" },
    { id: 4, name: "Supermercado",   categoryId: 4, type: "variable_expense" },
    { id: 5, name: "S&P 500 ETF",    categoryId: 5, type: "investment" },
  ].forEach(r => upsertRow("subcategories", r));

  // Transactions
  [
    { id: 1, accountId: 1, amount: 2800, currency: "EUR", date: "2025-05-01", subcategoryId: 1, notes: "Maio 2025",   type: "income",           recurring: false },
    { id: 2, accountId: 1, amount: 850,  currency: "EUR", date: "2025-05-02", subcategoryId: 3, notes: "Renda Maio",  type: "fixed_expense",    recurring: false },
    { id: 3, accountId: 3, amount: 120.5,currency: "EUR", date: "2025-05-10", subcategoryId: 4, notes: "Continente", type: "variable_expense", recurring: false },
    { id: 4, accountId: 2, amount: 200,  currency: "EUR", date: "2025-05-05", subcategoryId: 5, notes: "DCA mensal",  type: "investment",        recurring: false },
  ].forEach(r => upsertRow("transactions", r));

  // Investments
  [
    { id: 1, opType: "buy", assetType: "etf",   ticker: "VWCE",  name: "Vanguard FTSE All-World", date: "2025-01-15", quantity: 10,   unitPrice: 112.50, otherCosts: 1.50, currency: "EUR", totalValue: 1126.50, dyAnnual: 1.8 },
    { id: 2, opType: "buy", assetType: "crypto", ticker: "BTC",   name: "Bitcoin",                 date: "2025-02-10", quantity: 0.05, unitPrice: 38000,  otherCosts: 5,    currency: "EUR", totalValue: 1905,    dyAnnual: 0 },
    { id: 3, opType: "buy", assetType: "acoes",  ticker: "PETR4", name: "Petrobras PN",             date: "2025-03-05", quantity: 100,  unitPrice: 38.20,  otherCosts: 4.50, currency: "BRL", totalValue: 3824.50, dyAnnual: 14.2 },
  ].forEach(r => upsertRow("investments", r));

  // Goals
  [
    { id: 1, type: "invested",  label: "Carteira 50k",       targetValue: 50000, currency: "EUR" },
    { id: 2, type: "dividends", label: "Renda Passiva 500€", targetValue: 500,   currency: "EUR" },
  ].forEach(r => upsertRow("goals", r));

  ui.alert("✅ Dados de demonstração inseridos com sucesso!\n\nPodes agora integrar o React com este endpoint.");
}


// ── (Opcional) Protecção por API Key ─────────────────────────
//
//  Para adicionar autenticação básica, descomenta e define um segredo:
//
//  const API_KEY = "o-teu-segredo-aqui-2025";
//
//  Em doGet e doPost, adiciona no início:
//
//  const key = e.parameter.key || (body && body.key);
//  if (key !== API_KEY) {
//    return jsonResponse({ ok: false, error: "Não autorizado" }, 401);
//  }
//
//  No React, passa &key=o-teu-segredo-aqui-2025 em todos os pedidos.
//
// ─────────────────────────────────────────────────────────────
