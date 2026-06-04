// ============================================================
//  Kappy — Google Apps Script Backend
//  Versão: 2.0.0
// ============================================================
//
//  INSTRUÇÕES DE INSTALAÇÃO:
//
//  1. Abre o Google Sheets em sheets.google.com
//  2. Cria uma nova spreadsheet — "Kappy DB"
//  3. Extensões → Apps Script
//  4. Apaga o código existente e cola este ficheiro completo
//  5. Guardar (Ctrl+S)
//  6. Executar → setup() → aceita as permissões
//
//  CONFIGURAR A API KEY (obrigatório):
//  7. Apps Script → Ícone de engrenagem (Project Settings)
//  8. Scroll até "Script Properties" → "Add script property"
//     Nome:  API_KEY
//     Valor: uma palavra-passe forte (ex: kappy-2025-xK9#mP)
//  9. Guardar
//
//  PUBLICAR:
//  10. Implementar → Nova implementação
//      Tipo: Aplicação Web
//      Executar como: Eu
//      Quem tem acesso: Qualquer pessoa
//  11. Copia o URL gerado
//  12. Cola o URL e a API Key em Kappy → Definições → Sheet Config
//
//  SEGURANÇA:
//  - A API Key fica encriptada nas Script Properties da Google
//  - Não aparece no código fonte nem em nenhum repositório
//  - Rate limiting activo: máximo 60 pedidos/minuto
//  - Nunca partilhes o URL nem a API Key
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
    types:   ["id",  "id",       "num",    "str",      "str",  "id",            "str",   "str",  "bool"],
  },
  recurring_rules: {
    headers: ["id", "accountId", "amount", "currency", "subcategoryId", "type", "notes", "startDate", "endDate", "hasNoEnd", "active"],
    types:   ["id",  "id",       "num",    "str",      "id",            "str",  "str",   "str",       "str",     "bool",     "bool"],
  },
  budgets: {
    headers: ["id", "year", "subcategoryId", "month", "amount"],
    types:   ["id",  "num",  "id",            "num",   "num"],
  },
  investments: {
    headers: ["id", "accountId", "opType", "assetType", "exchange", "ticker", "name", "date", "quantity", "unitPrice", "otherCosts", "currency", "totalValue", "dyAnnual"],
    types:   ["id",  "str",      "str",    "str",       "str",      "str",    "str",  "str",  "num",      "num",       "num",        "str",      "num",        "num"],
  },
  goals: {
    headers: ["id", "type", "label", "targetValue", "currency"],
    types:   ["id",  "str",  "str",   "num",         "str"],
  },
  settings: {
    headers: ["id", "key", "value"],
    types:   ["str", "str", "str"],
  },
};


// ── Segurança ────────────────────────────────────────────────

/**
 * Valida a API Key enviada pelo Kappy.
 * A chave correcta está guardada nas Script Properties (encriptada pela Google).
 * Lança erro se a chave for inválida ou não estiver configurada.
 */
function validateApiKey(key) {
  const storedKey = PropertiesService
    .getScriptProperties()
    .getProperty("API_KEY");

  // Se não há chave configurada, avisa o utilizador
  if (!storedKey) {
    throw new Error(
      "API_KEY não configurada. " +
      "Vai a Project Settings → Script Properties e define API_KEY."
    );
  }

  if (!key || key !== storedKey) {
    throw new Error("Chave de acesso inválida.");
  }
}

/**
 * Rate limiting: máximo 60 pedidos por minuto.
 * Usa o CacheService do Apps Script (memória partilhada do script).
 */
function checkRateLimit() {
  const cache  = CacheService.getScriptCache();
  const bucket = "rl_" + Math.floor(Date.now() / 60000); // chave por minuto
  const count  = parseInt(cache.get(bucket) || "0");

  if (count >= 60) {
    throw new Error("Rate limit excedido. Tenta novamente em 1 minuto.");
  }

  cache.put(bucket, String(count + 1), 90); // TTL de 90s para cobrir transição
}

/**
 * Extrai a API Key do pedido (GET: query param, POST: body).
 */
function extractKey(e, body) {
  return (e && e.parameter && e.parameter.key) ||
         (body && body.key) ||
         "";
}


// ── Setup / Migrate ───────────────────────────────────────────

/**
 * migrate() — seguro para correr a qualquer momento.
 *
 * Para cada aba definida no SHEETS_CONFIG:
 *   1. Cria a aba se não existir
 *   2. Se a aba existe mas não tem headers → adiciona headers
 *   3. Se a aba existe com headers → detecta colunas em falta
 *      e adiciona-as à direita SEM tocar nos dados existentes
 *
 * Nunca apaga dados. Pode correr múltiplas vezes com segurança.
 */
function migrate() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const results = [];

  Object.entries(SHEETS_CONFIG).forEach(([sheetName, config]) => {
    let sheet  = ss.getSheetByName(sheetName);
    let status = "";

    // ── 1. Cria a aba se não existir ──────────────────────────
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, config.headers.length)
        .setValues([config.headers])
        .setFontWeight("bold")
        .setBackground("#1a1a2e")
        .setFontColor("#ffffff");
      sheet.setFrozenRows(1);
      sheet.setColumnWidths(1, config.headers.length, 140);
      status = "✅ criada";

    } else {
      // ── 2. Aba existe — verifica headers ──────────────────────
      const lastCol      = sheet.getLastColumn();
      const existingHeaders = lastCol > 0
        ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String)
        : [];

      if (existingHeaders.length === 0 || !existingHeaders[0]) {
        // Sem headers — escreve tudo
        sheet.getRange(1, 1, 1, config.headers.length)
          .setValues([config.headers])
          .setFontWeight("bold")
          .setBackground("#1a1a2e")
          .setFontColor("#ffffff");
        sheet.setFrozenRows(1);
        status = "✅ headers adicionados";

      } else {
        // ── 3. Tem headers — adiciona só as colunas em falta ────
        const missing = config.headers.filter(h => !existingHeaders.includes(h));

        if (missing.length > 0) {
          const startCol = lastCol + 1;
          const range    = sheet.getRange(1, startCol, 1, missing.length);
          range.setValues([missing])
            .setFontWeight("bold")
            .setBackground("#1a1a2e")
            .setFontColor("#ffffff");
          sheet.setColumnWidths(startCol, missing.length, 140);
          status = "🔧 colunas adicionadas: " + missing.join(", ");
        } else {
          status = "✔ sem alterações";
        }
      }
    }

    Logger.log(sheetName + ": " + status);
    results.push(sheetName + " → " + status);
  });

  // Remove a aba em branco criada automaticamente pelo Google
  const defaultSheet = ss.getSheetByName("Folha1") || ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  // Verifica API_KEY
  const key       = PropertiesService.getScriptProperties().getProperty("API_KEY");
  const keyStatus = key
    ? "✅ API_KEY configurada"
    : "⚠️ API_KEY não configurada — define em Project Settings → Script Properties";

  Logger.log("─────────────────────────────────────");
  Logger.log("✅ Migração concluída!");
  Logger.log(keyStatus);
  Logger.log("Próximo passo: Implementar → Nova implementação → Web App");

  return results.join("\n");
}

/**
 * setup() mantido como alias de migrate() para compatibilidade.
 * Pode correr com segurança em qualquer altura — não apaga dados.
 */
function setup() {
  return migrate();
}


// ── Entry points HTTP ────────────────────────────────────────

function doGet(e) {
  try {
    checkRateLimit();
    validateApiKey(extractKey(e, null));

    const sheetName = e.parameter.sheet;
    if (!sheetName)                    return jsonResponse({ ok: false, error: "Parâmetro 'sheet' obrigatório" });
    if (!SHEETS_CONFIG[sheetName])     return jsonResponse({ ok: false, error: "Aba desconhecida: " + sheetName });

    const id   = e.parameter.id ? parseFloat(e.parameter.id) : null;
    const rows = readSheet(sheetName);

    if (id !== null) {
      const row = rows.find(r => r.id === id);
      return row
        ? jsonResponse({ ok: true, data: row })
        : jsonResponse({ ok: false, error: "Registo não encontrado" });
    }

    return jsonResponse({ ok: true, data: rows, count: rows.length });

  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    checkRateLimit();

    const body = JSON.parse(e.postData.contents);
    validateApiKey(extractKey(e, body));

    const { action, sheet: sheetName, row, rows, id } = body;

    if (!sheetName || !SHEETS_CONFIG[sheetName]) {
      return jsonResponse({ ok: false, error: "Aba inválida: " + sheetName });
    }

    switch (action) {
      case "upsert":
        if (!row) return jsonResponse({ ok: false, error: "'row' obrigatório" });
        return jsonResponse({ ok: true, data: upsertRow(sheetName, row) });

      case "bulk_upsert":
        if (!rows || !Array.isArray(rows)) return jsonResponse({ ok: false, error: "'rows' deve ser array" });
        return jsonResponse({ ok: true, data: rows.map(r => upsertRow(sheetName, r)), count: rows.length });

      case "delete":
        if (!id) return jsonResponse({ ok: false, error: "'id' obrigatório" });
        return deleteRow(sheetName, parseFloat(id))
          ? jsonResponse({ ok: true, message: "Eliminado id=" + id })
          : jsonResponse({ ok: false, error: "Registo não encontrado" });

      case "delete_all":
        clearSheet(sheetName);
        return jsonResponse({ ok: true, message: "Aba '" + sheetName + "' limpa" });

      default:
        return jsonResponse({ ok: false, error: "Action desconhecida: " + action });
    }

  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}


// ── CRUD helpers ─────────────────────────────────────────────

function readSheet(sheetName) {
  const sheet   = getSheet(sheetName);
  const config  = SHEETS_CONFIG[sheetName];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet
    .getRange(2, 1, lastRow - 1, config.headers.length)
    .getValues()
    .filter(row => row[0] !== "" && row[0] !== null)
    .map(row => rowToObject(row, config));
}

function upsertRow(sheetName, rowData) {
  const sheet   = getSheet(sheetName);
  const config  = SHEETS_CONFIG[sheetName];
  if (!rowData.id) rowData.id = Date.now();
  const values      = objectToRow(rowData, config);
  const existingRow = findRowById(sheet, rowData.id, config.headers.length);
  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, values.length).setValues([values]);
  } else {
    sheet.getRange(Math.max(sheet.getLastRow(), 1) + 1, 1, 1, values.length).setValues([values]);
  }
  return rowToObject(values, config);
}

function deleteRow(sheetName, id) {
  const sheet   = getSheet(sheetName);
  const config  = SHEETS_CONFIG[sheetName];
  const rowNum  = findRowById(sheet, id, config.headers.length);
  if (rowNum < 2) return false;
  sheet.deleteRow(rowNum);
  return true;
}

function clearSheet(sheetName) {
  const sheet   = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
}


// ── Conversão de tipos ───────────────────────────────────────

function rowToObject(values, config) {
  const obj = {};
  config.headers.forEach((h, i) => { obj[h] = castValue(values[i], config.types[i]); });
  return obj;
}

function objectToRow(obj, config) {
  return config.headers.map((h, i) => {
    const val = obj[h];
    if (val === undefined || val === null) return "";
    if (config.types[i] === "bool") return val ? "true" : "false";
    return val;
  });
}

function castValue(val, type) {
  if (val === "" || val === null || val === undefined) {
    if (type === "num" || type === "id") return 0;
    if (type === "bool") return false;
    return "";
  }
  switch (type) {
    case "id":
    case "num":  return parseFloat(val) || 0;
    case "bool": return val === true || val === "true" || val === 1;
    default:     return String(val);
  }
}


// ── Utilitários ──────────────────────────────────────────────

function getSheet(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error("Aba não encontrada: '" + sheetName + "'. Executa setup() primeiro.");
  return sheet;
}

function findRowById(sheet, id, numCols) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (parseFloat(ids[i][0]) === parseFloat(id)) return i + 2;
  }
  return -1;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


// ── Testes ───────────────────────────────────────────────────

function runTests() {
  const log = [];

  try {
    const key = PropertiesService.getScriptProperties().getProperty("API_KEY");
    log.push(key ? "✅ API_KEY configurada" : "⚠️ API_KEY não configurada");

    checkRateLimit();
    log.push("✅ Rate limit OK");

    const test = { id: 99999, name: "Teste", type: "checking", balance: 100, currency: "EUR" };
    upsertRow("accounts", test);
    log.push("✅ Upsert OK");

    const all = readSheet("accounts");
    log.push("✅ Read OK — " + all.length + " registos");

    deleteRow("accounts", 99999);
    log.push("✅ Delete OK");

    Logger.log("Resultados:\n" + log.join("\n"));
  } catch (e) {
    Logger.log("Erro: " + e.message + "\n" + log.join("\n"));
  }
}