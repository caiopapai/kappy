import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button, Input } from "../../components/ui";

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
    { id: "csv",                 label: "CSV",             icon: "📄", implemented: false },
  ],
};

export default function SheetConfig() {
  const { t } = useTranslation();
  const [selectedProvider, setSelectedProvider] = useState("google_sheets");
  const provider = [...PROVIDERS.online, ...PROVIDERS.offline].find(p => p.id === selectedProvider);

  return (
    <div className="flex flex-col gap-6">

      {/* Aviso de segurança */}
      <div className="flex gap-3 p-4 rounded-xl bg-[#1e1a0e] border border-[#f59e0b33]">
        <span className="text-lg shrink-0">⚠️</span>
        <div className="text-xs text-[#fcd34d] leading-relaxed">
          <strong className="block mb-1">{t("settings.sheet.security.title")}</strong>
          {t("settings.sheet.security.message")}
        </div>
      </div>

      {/* Selector de provider */}
      <div>
        <div className="text-[11px] text-[#5a5f78] uppercase tracking-widest font-semibold mb-2">
          {t("settings.sheet.providers.online")}
        </div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {PROVIDERS.online.map(p => (
            <ProviderCard key={p.id} provider={p} selected={selectedProvider === p.id}
              onSelect={() => p.implemented && setSelectedProvider(p.id)} />
          ))}
        </div>
        <div className="text-[11px] text-[#5a5f78] uppercase tracking-widest font-semibold mb-2">
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
          ? "bg-[#1e2235] border-[#6366f1] text-[#a5b4fc]"
          : isDisabled
            ? "bg-[#161820] border-[#2a2d3a] text-[#3a3d52] cursor-not-allowed opacity-50"
            : "bg-[#161820] border-[#2a2d3a] text-[#8a8fa8] hover:border-[#3a3d52] hover:text-[#c4c0b8] cursor-pointer"}
      `}
    >
      <span className="text-xl">{provider.icon}</span>
      <span>{provider.label}</span>
      <span className={`text-[10px] font-normal ${selected ? "text-[#6366f188]" : "text-[#5a5f78]"}`}>
        {desc}
      </span>
    </button>
  );
}

function GoogleSheetsForm() {
  const { t } = useTranslation();
  const [url,     setUrl]    = useState(import.meta.env.VITE_SHEETS_URL || "");
  const [apiKey,  setApiKey] = useState(import.meta.env.VITE_SHEETS_API_KEY || "");
  const [status,  setStatus] = useState(null);
  const [message, setMessage]= useState("");
  const [saved,   setSaved]  = useState(false);

  const isConfigured = url.startsWith("https://script.google.com");

  async function handleTest() {
    if (!url) return;
    setStatus("testing");
    setMessage("");
    try {
      const params = new URLSearchParams({ sheet: "accounts" });
      if (apiKey) params.append("key", apiKey);
      const res  = await fetch(url + "?" + params.toString());
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
      setMessage(t("settings.sheet.testError"));
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
          <div className="text-sm font-semibold text-[#e8e6e0]">Google Sheets</div>
          <div className="text-xs text-[#5a5f78]">via Google Apps Script</div>
        </div>
        {isConfigured && (
          <span className="ml-auto text-xs font-semibold text-[#4ade80] bg-[#1f3a2a] px-2.5 py-1 rounded-full">
            ● {t("settings.sheet.configured")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <Input
            label={t("settings.sheet.url")}
            placeholder={t("settings.sheet.urlPlaceholder")}
            value={url}
            onChange={e => { setUrl(e.target.value); setStatus(null); }}
          />
          <div className="text-[11px] text-[#5a5f78] mt-1.5 leading-relaxed">
            {t("settings.sheet.urlHelp")}{" "}
            <a href="https://developers.google.com/apps-script/guides/web" target="_blank" rel="noreferrer"
              className="text-[#a5b4fc] hover:underline">
              {t("settings.sheet.urlHelpLink")}
            </a>
          </div>
        </div>

        <div>
          <Input
            label={t("settings.sheet.apiKey")}
            placeholder={t("settings.sheet.apiKeyPlaceholder")}
            type="password"
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setStatus(null); }}
          />
          <div className="text-[11px] text-[#5a5f78] mt-1.5 leading-relaxed">
            {t("settings.sheet.apiKeyHelp")}
          </div>
        </div>

        <div className="flex gap-2.5 p-3 rounded-lg bg-[#1a1d2e] border border-[#2a2d3a] text-xs text-[#5a5f78]">
          <span className="shrink-0">🔒</span>
          <span>
            {t("settings.sheet.securityNote")}
            <strong className="text-[#8a8fa8]"> {t("settings.sheet.securityWarn")}</strong>
          </span>
        </div>

        {status === "testing" && (
          <div className="flex items-center gap-2 text-sm text-[#5a5f78]">
            <div className="w-4 h-4 border-2 border-[#6366f133] border-t-[#6366f1] rounded-full animate-spin" />
            {t("settings.sheet.testing")}
          </div>
        )}
        {status === "ok" && (
          <div className="flex items-center gap-2 text-sm text-[#4ade80] bg-[#1f3a2a] px-3 py-2 rounded-lg">
            ✓ {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-[#f87171] bg-[#3a1f1f] px-3 py-2 rounded-lg">
            ✕ {message}
          </div>
        )}

        {!isConfigured && (
          <div className="p-3 rounded-lg bg-[#1a1d2e] border border-[#2a2d3a] text-xs">
            <div className="text-[#8a8fa8] font-semibold mb-2">
              {t("settings.sheet.manualSetup.title")}
            </div>
            <ol className="text-[#5a5f78] space-y-1 list-decimal list-inside">
              <li>{t("settings.sheet.manualSetup.step1")}</li>
              <li>{t("settings.sheet.manualSetup.step2")}</li>
              <li>{t("settings.sheet.manualSetup.step3")}</li>
              <li>{t("settings.sheet.manualSetup.step4")}</li>
            </ol>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleTest} disabled={!url || status === "testing"} variant="secondary">
            {t("settings.sheet.testButton")}
          </Button>
          <Button onClick={handleSave} disabled={!url}>
            {saved ? t("settings.sheet.saved") : t("settings.sheet.saveButton")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ComingSoonForm({ provider }) {
  const { t } = useTranslation();
  return (
    <Card>
      <div className="flex flex-col items-center py-12 text-center">
        <span className="text-4xl mb-4">{provider.icon}</span>
        <div className="text-[15px] text-[#c4c0b8] mb-2">
          {provider.label} — {t("common.comingSoon")}
        </div>
        <div className="text-sm text-[#5a5f78] max-w-xs">
          {provider.label} {t("settings.sheet.comingSoonDesc")}
        </div>
      </div>
    </Card>
  );
}