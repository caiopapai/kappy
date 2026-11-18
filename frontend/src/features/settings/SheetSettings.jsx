// src/features/settings/SheetConfig.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button, Input } from "../../components/ui";

// Labels dos providers são nomes próprios de produtos — não se traduzem.
// As descrições e mensagens UI vêm dos locales.
const PROVIDERS = {
  online: [
    { id: "google_sheets",       label: "Google Sheets",   icon: "📗", implemented: true  },
    { id: "excel_365",           label: "Excel 365",       icon: "📘", implemented: false },
    { id: "apple_numbers_cloud", label: "Numbers",         icon: "🍎", implemented: false },
    { id: "airtable",            label: "Airtable",        icon: "🟠", implemented: false },
    { id: "notion",              label: "Notion",          icon: "⬛", implemented: false },
  ],
  offline: [
    { id: "excel_local",         label: "Excel",           icon: "📊", implemented: false },
    { id: "libreoffice",         label: "LibreOffice Calc",icon: "📋", implemented: false },
    { id: "apple_numbers_local", label: "Numbers",         icon: "🍎", implemented: false },
    { id: "csv",                 label: "CSV",             icon: "📄", implemented: true  },
  ],
};

export default function SheetConfig() {
  const { t } = useTranslation();
  const [selectedProvider, setSelectedProvider] = useState("google_sheets");
  const provider = [...PROVIDERS.online, ...PROVIDERS.offline].find(p => p.id === selectedProvider);

  return (
    <div className="flex flex-col gap-6">

      {/* Aviso de segurança */}
      <div className="flex gap-3 p-4 rounded-xl bg-warning border border-[var(--border)]">
        <span className="text-lg shrink-0">⚠️</span>
        <div className="text-xs text-warning leading-relaxed">
          <strong className="block mb-1">{t("settings.sheet.security.title")}</strong>
          {t("settings.sheet.security.message")}
        </div>
      </div>

      {/* Selector de provider */}
      <div>
        <div className="text-[11px] text-faint uppercase tracking-widest font-semibold mb-2">
          {t("settings.sheet.providers.online")}
        </div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {PROVIDERS.online.map(p => (
            <ProviderCard key={p.id} provider={p} selected={selectedProvider === p.id}
              onSelect={() => p.implemented && setSelectedProvider(p.id)} />
          ))}
        </div>
        <div className="text-[11px] text-faint uppercase tracking-widest font-semibold mb-2">
          {t("settings.sheet.providers.offline")}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {PROVIDERS.offline.map(p => (
            <ProviderCard key={p.id} provider={p} selected={selectedProvider === p.id}
              onSelect={() => p.implemented && setSelectedProvider(p.id)} />
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div>
        {selectedProvider === "google_sheets" && <GoogleSheetsForm />}
        {selectedProvider === "csv"           && <CsvForm />}
        {provider && !provider.implemented && <ComingSoonForm provider={provider} />}
      </div>
    </div>
  );
}

function ProviderCard({ provider, selected, onSelect }) {
  const { t } = useTranslation();
  const isDisabled = !provider.implemented;
  const desc = isDisabled
    ? t("common.comingSoon")
    : t("settings.sheet.providers.descs." + provider.id);

  return (
    <button onClick={onSelect} disabled={isDisabled}
      className={`
        flex flex-col items-center gap-1.5 p-3 rounded-xl border
        text-center transition-all text-xs font-medium
        ${selected
          ? "bg-overlay border-[var(--border-focus)] text-brand-light"
          : isDisabled
            ? "bg-card border-default text-faint cursor-not-allowed opacity-50"
            : "bg-card border-default text-muted hover:border-strong hover:text-secondary cursor-pointer"}
      `}
    >
      <span className="text-xl">{provider.icon}</span>
      <span>{provider.label}</span>
      <span className={`text-[10px] font-normal ${selected ? "text-[#6366f188]" : "text-faint"}`}>
        {desc}
      </span>
    </button>
  );
}

function GoogleSheetsForm() {
  const { t } = useTranslation();
  const [status,  setStatus]  = useState(null);
  const [message, setMessage] = useState("");
  const [saved,   setSaved]   = useState(false);

  const engineUrl    = import.meta.env.KAPPY_ENGINE_URL || "http://localhost:3001";
  const isConfigured = Boolean(import.meta.env.KAPPY_ENGINE_URL);

  async function handleTest() {
    setStatus("testing");
    setMessage("");
    try {
      // Testa o engine primeiro
      const health = await fetch(`${engineUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (!health.ok) { throw new Error("engine offline"); }

      // Depois testa as sheets via engine
      const res  = await fetch(`${engineUrl}/api/accounts`, { signal: AbortSignal.timeout(5000) });
      const json = await res.json();
      if (json.ok) {
        setStatus("ok");
        setMessage(t("settings.sheet.testOk", { count: json.count ?? 0 }));
      } else {
        setStatus("error");
        setMessage(json.error || t("settings.sheet.testError"));
      }
    } catch {
      setStatus("error");
      setMessage(t("settings.sheet.engineOffline"));
    }
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">📗</span>
        <div>
          <div className="text-sm font-semibold text-primary">Google Sheets</div>
          <div className="text-xs text-faint">via kappy-engine + Google Apps Script</div>
        </div>
        {isConfigured && (
          <span className="ml-auto text-xs font-semibold text-success bg-success px-2.5 py-1 rounded-full">
            ● {t("settings.sheet.configured")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">

        {/* Instrução — configura o engine, não o frontend */}
        <div className="p-3 rounded-lg bg-raised border border-default text-xs">
          <div className="text-muted font-semibold mb-2">
            {t("settings.sheet.manualSetup.title")}
          </div>
          <ol className="text-faint space-y-1 list-decimal list-inside">
            <li>{t("settings.sheet.manualSetup.step1")}</li>
            <li>{t("settings.sheet.manualSetup.step2")}</li>
            <li>{t("settings.sheet.manualSetup.step3")}</li>
            <li>{t("settings.sheet.manualSetup.step4")}</li>
          </ol>
        </div>

        <div className="flex gap-2.5 p-3 rounded-lg bg-raised border border-default text-xs text-faint">
          <span className="shrink-0">🔒</span>
          <span>
            {t("settings.sheet.securityNote")}
            <strong className="text-muted"> {t("settings.sheet.securityWarn")}</strong>
          </span>
        </div>

        {status === "testing" && (
          <div className="flex items-center gap-2 text-sm text-faint">
            <div className="w-4 h-4 border-2 border-[var(--brand-dim)] border-t-[#6366f1] rounded-full animate-spin" />
            {t("settings.sheet.testing")}
          </div>
        )}
        {status === "ok" && (
          <div className="flex items-center gap-2 text-sm text-success bg-success px-3 py-2 rounded-lg">
            ✓ {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-danger bg-[#3a1f1f] px-3 py-2 rounded-lg">
            ✕ {message}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleTest} disabled={status === "testing"} variant="secondary">
            {t("settings.sheet.testButton")}
          </Button>
          <Button onClick={handleSave}>
            {saved ? t("settings.sheet.saved") : t("settings.sheet.saveButton")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CsvForm() {
  const { t } = useTranslation();

  const RISKS = [
    { icon: "⚠️", key: "concurrency" },
    { icon: "💥", key: "atomic" },
    { icon: "🔗", key: "relations" },
    { icon: "🐢", key: "performance" },
  ];

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">📄</span>
        <div>
          <div className="text-sm font-semibold text-primary">CSV</div>
          <div className="text-xs text-faint">{t("settings.sheet.csv.subtitle")}</div>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex gap-3 p-4 rounded-xl mb-5"
        style={{ background: "var(--warning-bg)", border: "1px solid var(--warning)" }}>
        <span className="text-lg shrink-0">⚠️</span>
        <div className="text-xs leading-relaxed" style={{ color: "var(--warning)" }}>
          <strong className="block mb-1">{t("settings.sheet.csv.warningTitle")}</strong>
          {t("settings.sheet.csv.warningDesc")}
        </div>
      </div>

      {/* Riscos */}
      <div className="text-xs text-faint uppercase tracking-wide font-semibold mb-3">
        {t("settings.sheet.csv.risksTitle")}
      </div>
      <div className="flex flex-col gap-2 mb-5">
        {RISKS.map(r => (
          <div key={r.key} className="flex gap-3 p-3 rounded-lg bg-raised border border-default">
            <span className="shrink-0">{r.icon}</span>
            <div className="text-xs text-secondary leading-relaxed">
              <strong className="block text-primary mb-0.5">
                {t(`settings.sheet.csv.risks.${r.key}.title`)}
              </strong>
              {t(`settings.sheet.csv.risks.${r.key}.desc`)}
            </div>
          </div>
        ))}
      </div>

      {/* Casos de uso */}
      <div className="text-xs text-faint uppercase tracking-wide font-semibold mb-3">
        {t("settings.sheet.csv.useCasesTitle")}
      </div>
      <div className="flex flex-col gap-1.5 mb-5">
        {["solo", "migration", "backup"].map(u => (
          <div key={u} className="flex gap-2 items-start text-xs text-secondary">
            <span className="text-success mt-0.5">✓</span>
            {t(`settings.sheet.csv.useCases.${u}`)}
          </div>
        ))}
      </div>

      {/* Setup */}
      <div className="text-xs text-faint uppercase tracking-wide font-semibold mb-3">
        {t("settings.sheet.csv.setupTitle")}
      </div>
      <div className="p-3 rounded-lg bg-raised border border-default text-xs mb-2">
        <div className="text-secondary mb-2">
          {t("settings.sheet.csv.setupDesc")}{" "}
          <code className="text-brand-light bg-base px-1 rounded">kappy-engine/.env</code>
        </div>
        <pre className="text-success bg-base p-2 rounded text-[10px] leading-relaxed whitespace-pre">
{`DATA_PROVIDER=csv
CSV_DIR=./data`}
        </pre>
      </div>
      <div className="text-[11px] text-faint">{t("settings.sheet.csv.filesDesc")}</div>
    </Card>
  );
}

function ComingSoonForm({ provider }) {
  const { t } = useTranslation();
  return (
    <Card>
      <div className="flex flex-col items-center py-12 text-center">
        <span className="text-4xl mb-4">{provider.icon}</span>
        <div className="text-[15px] text-secondary mb-2">
          {provider.label} — {t("common.comingSoon")}
        </div>
        <div className="text-sm text-faint max-w-xs">
          {provider.label} {t("settings.sheet.comingSoonDesc")}
        </div>
      </div>
    </Card>
  );
}