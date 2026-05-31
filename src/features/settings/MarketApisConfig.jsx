// src/features/settings/MarketApisConfig.jsx
// Configuração das APIs de cotações por bolsa.
// Cada bolsa tem os seus providers suportados.
// As credenciais ficam guardadas no kappy-engine (.env), não no browser.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button, Input, Select } from "../../components/ui";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

// ── Catálogo de bolsas e providers suportados ─────────────────
// implemented: true  → configuração disponível
// implemented: false → "Em breve"
//
// Para adicionar suporte a uma nova bolsa/provider:
//   1. Adiciona a bolsa a EXCHANGES_CATALOG
//   2. Cria o XxxRepository no kappy-engine
//   3. Regista na StockRepositoryFactory
//   4. Muda implemented para true

const EXCHANGES_CATALOG = [
  {
    value:    "B3",
    label:    "B3 – Bovespa",
    flag:     "🇧🇷",
    currency: "BRL",
    providers: [
      {
        id:          "brapi",
        name:        "brapi.dev",
        url:         "https://brapi.dev",
        implemented: true,
        fields: [
          {
            key:         "token",
            label:       "Token de Acesso",
            type:        "password",
            placeholder: "Cole aqui o teu token brapi",
            helpText:    "Obtém um token gratuito em brapi.dev. Sem token, apenas tickers populares ficam disponíveis.",
            helpLink:    "https://brapi.dev",
            helpLinkLabel: "Criar conta gratuita →",
            required:    false,
          },
        ],
      },
    ],
  },
  {
    value:    "NYSE",
    label:    "NYSE – Nova York",
    flag:     "🇺🇸",
    currency: "USD",
    providers: [
      {
        id:          "alphaVantage",
        name:        "Alpha Vantage",
        url:         "https://www.alphavantage.co",
        implemented: false,
        fields: [],
      },
      {
        id:          "yahooFinance",
        name:        "Yahoo Finance",
        url:         "https://finance.yahoo.com",
        implemented: false,
        fields: [],
      },
    ],
  },
  {
    value:    "NASDAQ",
    label:    "NASDAQ",
    flag:     "🇺🇸",
    currency: "USD",
    providers: [
      {
        id:          "alphaVantage",
        name:        "Alpha Vantage",
        url:         "https://www.alphavantage.co",
        implemented: false,
        fields: [],
      },
    ],
  },
  {
    value:    "LSE",
    label:    "LSE – Londres",
    flag:     "🇬🇧",
    currency: "GBP",
    providers: [
      {
        id:          "alphaVantage",
        name:        "Alpha Vantage",
        url:         "https://www.alphavantage.co",
        implemented: false,
        fields: [],
      },
    ],
  },
  {
    value:    "EURONEXT",
    label:    "Euronext",
    flag:     "🇪🇺",
    currency: "EUR",
    providers: [
      {
        id:          "alphaVantage",
        name:        "Alpha Vantage",
        url:         "https://www.alphavantage.co",
        implemented: false,
        fields: [],
      },
    ],
  },
  {
    value:    "TSE",
    label:    "TSE – Tóquio",
    flag:     "🇯🇵",
    currency: "JPY",
    providers: [
      {
        id:          "alphaVantage",
        name:        "Alpha Vantage",
        implemented: false,
        fields: [],
      },
    ],
  },
  {
    value:    "XETRA",
    label:    "XETRA – Frankfurt",
    flag:     "🇩🇪",
    currency: "EUR",
    providers: [
      {
        id:          "alphaVantage",
        name:        "Alpha Vantage",
        implemented: false,
        fields: [],
      },
    ],
  },
];

// Chave de localStorage para persistir as configurações
// Em produção (Electron) isto irá para ficheiro local seguro
const STORAGE_KEY = "kappy_market_apis";

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveToStorage(configs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

// ── Componente principal ──────────────────────────────────────

export default function MarketApisConfig() {
  const { t } = useTranslation();
  const { toast, showToast } = useToast();

  // configs: { "B3": { provider: "brapi", fields: { token: "xxx" } }, ... }
  const [configs,          setConfigs]          = useState(loadSaved);
  const [selectedExchange, setSelectedExchange] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [fieldValues,      setFieldValues]      = useState({});
  const [editingExchange,  setEditingExchange]  = useState(null);
  const [showReveal,       setShowReveal]       = useState({});

  const exchange = EXCHANGES_CATALOG.find(e => e.value === selectedExchange);
  const provider = exchange?.providers.find(p => p.id === selectedProvider);

  // ── Seleccionar bolsa ─────────────────────────────────────────

  function handleSelectExchange(value) {
    setSelectedExchange(value);
    setSelectedProvider("");
    setFieldValues({});
    setEditingExchange(null);

    // Pré-preenche se já houver config guardada
    const saved = configs[value];
    if (saved) {
      setSelectedProvider(saved.provider);
      setFieldValues(saved.fields || {});
    }
  }

  // ── Seleccionar provider ──────────────────────────────────────

  function handleSelectProvider(pid) {
    setSelectedProvider(pid);
    setFieldValues({});

    // Pré-preenche se já houver config para esta bolsa + provider
    const saved = configs[selectedExchange];
    if (saved && saved.provider === pid) {
      setFieldValues(saved.fields || {});
    }
  }

  // ── Guardar configuração ──────────────────────────────────────

  function handleSave() {
    if (!selectedExchange || !selectedProvider) return;

    const newConfigs = {
      ...configs,
      [selectedExchange]: {
        provider:    selectedProvider,
        fields:      fieldValues,
        savedAt:     new Date().toISOString(),
        exchangeLabel: exchange?.label,
        providerName:  provider?.name,
      },
    };

    setConfigs(newConfigs);
    saveToStorage(newConfigs);
    setEditingExchange(null);
    showToast(t("settings.marketApis.toast.saved"));
  }

  // ── Editar ────────────────────────────────────────────────────

  function handleEdit(exchangeValue) {
    const saved = configs[exchangeValue];
    if (!saved) return;
    setSelectedExchange(exchangeValue);
    setSelectedProvider(saved.provider);
    setFieldValues(saved.fields || {});
    setEditingExchange(exchangeValue);
  }

  // ── Eliminar ──────────────────────────────────────────────────

  function handleDelete(exchangeValue) {
    const newConfigs = { ...configs };
    delete newConfigs[exchangeValue];
    setConfigs(newConfigs);
    saveToStorage(newConfigs);
    if (selectedExchange === exchangeValue) {
      setSelectedExchange("");
      setSelectedProvider("");
      setFieldValues({});
    }
    showToast(t("settings.marketApis.toast.deleted"));
  }

  // ── Cancelar edição ───────────────────────────────────────────

  function handleCancel() {
    setSelectedExchange("");
    setSelectedProvider("");
    setFieldValues({});
    setEditingExchange(null);
  }

  const isEditing   = editingExchange !== null;
  const savedList   = Object.entries(configs);
  const canSave     = selectedExchange && selectedProvider && provider?.implemented;

  return (
    <div className="flex flex-col gap-5">
      <Toast toast={toast} />

      {/* Aviso de segurança */}
      <div className="flex gap-3 p-4 rounded-xl bg-[#1e1a0e] border border-[#f59e0b33]">
        <span className="text-lg shrink-0">⚠️</span>
        <div className="text-xs text-[#fcd34d] leading-relaxed">
          <strong className="block mb-1">{t("settings.marketApis.securityTitle")}</strong>
          {t("settings.marketApis.securityMessage")}
        </div>
      </div>

      {/* Configurações guardadas */}
      {savedList.length > 0 && (
        <div>
          <div className="text-[11px] text-[#5a5f78] uppercase tracking-widest font-semibold mb-3">
            {t("settings.marketApis.configured")}
          </div>
          <div className="flex flex-col gap-2">
            {savedList.map(([exValue, cfg]) => {
              const ex = EXCHANGES_CATALOG.find(e => e.value === exValue);
              return (
                <div key={exValue}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    editingExchange === exValue
                      ? "bg-[#1e2235] border-[#6366f1]"
                      : "bg-[#1a1d2e] border-[#1f3a2a]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{ex?.flag}</span>
                    <div>
                      <div className="text-sm font-semibold text-[#e8e6e0]">{cfg.exchangeLabel || exValue}</div>
                      <div className="text-xs text-[#5a5f78]">
                        {cfg.providerName}
                        {cfg.fields && Object.values(cfg.fields).some(v => v) && (
                          <span className="ml-2 text-[#4ade80]">● {t("settings.marketApis.withCredentials")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm"
                      onClick={() => editingExchange === exValue ? handleCancel() : handleEdit(exValue)}
                      className={editingExchange === exValue ? "text-[#a5b4fc] border-[#6366f1]" : ""}>
                      {editingExchange === exValue ? t("common.cancel") : t("common.edit")}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(exValue)}>×</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulário */}
      <Card className={isEditing ? "border-[#6366f1]" : ""}>
        <div className="text-sm font-semibold text-[#a5b4fc] mb-5">
          {isEditing
            ? "✏ " + t("settings.marketApis.editConfig")
            : "+ " + t("settings.marketApis.addConfig")}
        </div>

        {/* Selector de bolsa */}
        <div className="mb-4">
          <label className="block text-[11px] text-[#5a5f78] uppercase tracking-wide font-medium mb-1.5">
            {t("settings.marketApis.exchange")}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {EXCHANGES_CATALOG.map(ex => {
              const isSelected  = selectedExchange === ex.value;
              const isSaved     = Boolean(configs[ex.value]);
              const hasSupport  = ex.providers.some(p => p.implemented);

              return (
                <button
                  key={ex.value}
                  onClick={() => handleSelectExchange(ex.value)}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm
                    font-medium transition-all cursor-pointer text-left
                    ${isSelected
                      ? "bg-[#1e2235] border-[#6366f1] text-[#a5b4fc]"
                      : hasSupport
                        ? "bg-[#161820] border-[#2a2d3a] text-[#8a8fa8] hover:border-[#3a3d52] hover:text-[#c4c0b8]"
                        : "bg-[#161820] border-[#2a2d3a] text-[#3a3d52] cursor-not-allowed opacity-50"}
                  `}
                >
                  <span>{ex.flag}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{ex.value}</div>
                    <div className="text-[10px] opacity-60 truncate">
                      {hasSupport ? ex.label : t("common.comingSoon")}
                    </div>
                  </div>
                  {isSaved && !isSelected && (
                    <span className="ml-auto text-[#4ade80] text-xs shrink-0">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de provider */}
        {exchange && (
          <div className="mb-4">
            <label className="block text-[11px] text-[#5a5f78] uppercase tracking-wide font-medium mb-1.5">
              {t("settings.marketApis.provider")}
            </label>
            <div className="flex flex-col gap-2">
              {exchange.providers.map(p => {
                const isSelected = selectedProvider === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => p.implemented && handleSelectProvider(p.id)}
                    className={`
                      flex items-center justify-between px-4 py-3 rounded-xl border
                      text-left transition-all
                      ${!p.implemented ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      ${isSelected
                        ? "bg-[#1e2235] border-[#6366f1]"
                        : "bg-[#161820] border-[#2a2d3a] hover:border-[#3a3d52]"}
                    `}
                  >
                    <div>
                      <div className={`text-sm font-semibold ${isSelected ? "text-[#a5b4fc]" : "text-[#c4c0b8]"}`}>
                        {p.name}
                      </div>
                      <a href={p.url} target="_blank" rel="noreferrer"
                        className="text-xs text-[#5a5f78] hover:text-[#a5b4fc] transition-colors"
                        onClick={e => e.stopPropagation()}>
                        {p.url} ↗
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      {!p.implemented && (
                        <span className="text-xs text-[#5a5f78] bg-[#2a2d3a] px-2 py-0.5 rounded-full">
                          {t("common.comingSoon")}
                        </span>
                      )}
                      {isSelected && p.implemented && (
                        <span className="text-[#6366f1] text-base">✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Campos do provider seleccionado */}
        {provider && provider.implemented && provider.fields.length > 0 && (
          <div className="mb-4 flex flex-col gap-3">
            <div className="text-[11px] text-[#5a5f78] uppercase tracking-wide font-medium">
              {t("settings.marketApis.credentials")}
            </div>
            {provider.fields.map(field => (
              <div key={field.key}>
                <label className="block text-[11px] text-[#5a5f78] uppercase tracking-wide font-medium mb-1.5">
                  {field.label}
                  {!field.required && (
                    <span className="ml-2 normal-case text-[#3a3d52]">({t("settings.marketApis.optional")})</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-[#1a1d2e] border border-[#2a2d3a] rounded-lg px-3 py-2.5 pr-10 text-sm text-[#e8e6e0] outline-none focus:border-[#6366f1] transition-colors"
                    type={showReveal[field.key] ? "text" : field.type}
                    placeholder={field.placeholder}
                    value={fieldValues[field.key] || ""}
                    onChange={e => setFieldValues(v => ({ ...v, [field.key]: e.target.value }))}
                  />
                  {field.type === "password" && (
                    <button
                      onClick={() => setShowReveal(r => ({ ...r, [field.key]: !r[field.key] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a5f78] hover:text-[#8a8fa8] cursor-pointer bg-transparent border-0 p-0"
                    >
                      {showReveal[field.key] ? "🙈" : "👁"}
                    </button>
                  )}
                </div>
                {field.helpText && (
                  <div className="text-[11px] text-[#5a5f78] mt-1.5 leading-relaxed">
                    {field.helpText}{" "}
                    {field.helpLink && (
                      <a href={field.helpLink} target="_blank" rel="noreferrer"
                        className="text-[#a5b4fc] hover:underline">
                        {field.helpLinkLabel}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Nota de segurança */}
            <div className="flex gap-2 p-3 rounded-lg bg-[#1a1d2e] border border-[#2a2d3a] text-xs text-[#5a5f78]">
              <span className="shrink-0">🔒</span>
              <span>{t("settings.marketApis.storageNote")}</span>
            </div>
          </div>
        )}

        {/* Provider sem fields (só selecção) */}
        {provider && provider.implemented && provider.fields.length === 0 && (
          <div className="mb-4 flex gap-2 p-3 rounded-lg bg-[#1a1d2e] border border-[#2a2d3a] text-xs text-[#5a5f78]">
            <span>ℹ️</span>
            <span>{t("settings.marketApis.noCredentialsNeeded")}</span>
          </div>
        )}

        {/* Acções */}
        {selectedExchange && selectedProvider && (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!canSave}>
              {isEditing ? t("common.save") : t("settings.marketApis.saveConfig")}
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              {t("common.cancel")}
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!selectedExchange && savedList.length === 0 && (
          <div className="text-center py-8 text-[#5a5f78] text-sm">
            {t("settings.marketApis.emptyState")}
          </div>
        )}
      </Card>
    </div>
  );
}
