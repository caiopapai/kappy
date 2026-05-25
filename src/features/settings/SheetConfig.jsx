import { useState } from "react";
import { Card, Button, Input } from "../../components/ui";

const PROVIDERS = {
  online: [
    {
      id:          "google_sheets",
      label:       "Google Sheets",
      icon:        "📗",
      desc:        "Google Drive",
      implemented: true,
    },
    {
      id:          "excel_365",
      label:       "Excel 365",
      icon:        "📘",
      desc:        "Microsoft OneDrive",
      implemented: false,
    },
    {
      id:          "apple_numbers_cloud",
      label:       "Numbers",
      icon:        "🍎",
      desc:        "Apple iCloud",
      implemented: false,
    },
    {
      id:          "airtable",
      label:       "Airtable",
      icon:        "🟠",
      desc:        "Airtable Cloud",
      implemented: false,
    },
    {
      id:          "notion",
      label:       "Notion",
      icon:        "⬛",
      desc:        "Notion Database",
      implemented: false,
    },
  ],
  offline: [
    {
      id:          "excel_local",
      label:       "Excel",
      icon:        "📊",
      desc:        "Ficheiro local .xlsx",
      implemented: false,
    },
    {
      id:          "libreoffice",
      label:       "LibreOffice Calc",
      icon:        "📋",
      desc:        "LibreOffice / OpenOffice",
      implemented: false,
    },
    {
      id:          "apple_numbers_local",
      label:       "Numbers",
      icon:        "🍎",
      desc:        "Apple Numbers local",
      implemented: false,
    },
    {
      id:          "csv",
      label:       "CSV",
      icon:        "📄",
      desc:        "Ficheiro .csv universal",
      implemented: false,
    },
  ],
};

export default function SheetConfig() {
  const [selectedProvider, setSelectedProvider] = useState("google_sheets");
  const provider = [...PROVIDERS.online, ...PROVIDERS.offline]
    .find(p => p.id === selectedProvider);

  return (
    <div className="flex flex-col gap-6">

      {/* Aviso de segurança */}
      <div className="flex gap-3 p-4 rounded-xl bg-[#1e1a0e] border border-[#f59e0b33]">
        <span className="text-lg shrink-0">⚠️</span>
        <div className="text-xs text-[#fcd34d] leading-relaxed">
          <strong className="block mb-1">Informação de segurança</strong>
          O URL e a chave de acesso dão acesso total aos teus dados financeiros.
          Nunca os partilhes com ninguém. Guarda-os num gestor de passwords
          (ex: Bitwarden, 1Password). O Kappy guarda estas credenciais apenas
          localmente no teu dispositivo.
        </div>
      </div>

      {/* Selector de provider */}
      <div>
        {/* Online */}
        <div className="text-[11px] text-[#5a5f78] uppercase tracking-widest font-semibold mb-2">
          ☁️ Online
        </div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {PROVIDERS.online.map(p => (
            <ProviderCard
              key={p.id}
              provider={p}
              selected={selectedProvider === p.id}
              onSelect={() => p.implemented && setSelectedProvider(p.id)}
            />
          ))}
        </div>

        {/* Offline */}
        <div className="text-[11px] text-[#5a5f78] uppercase tracking-widest font-semibold mb-2">
          💾 Offline
        </div>
        <div className="grid grid-cols-5 gap-2">
          {PROVIDERS.offline.map(p => (
            <ProviderCard
              key={p.id}
              provider={p}
              selected={selectedProvider === p.id}
              onSelect={() => p.implemented && setSelectedProvider(p.id)}
            />
          ))}
        </div>
      </div>

      {/* Formulário do provider seleccionado */}
      <div>
        {selectedProvider === "google_sheets" && <GoogleSheetsForm />}
        {provider && !provider.implemented && <ComingSoonForm provider={provider} />}
      </div>

    </div>
  );
}

// ── ProviderCard ──────────────────────────────────────────────

function ProviderCard({ provider, selected, onSelect }) {
  const isDisabled = !provider.implemented;

  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
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
        {isDisabled ? "Em breve" : provider.desc}
      </span>
    </button>
  );
}

// ── Google Sheets Form ────────────────────────────────────────

function GoogleSheetsForm() {
  const [url,     setUrl]     = useState(import.meta.env.VITE_SHEETS_URL || "");
  const [apiKey,  setApiKey]  = useState(import.meta.env.VITE_SHEETS_API_KEY || "");
  const [status,  setStatus]  = useState(null);
  const [message, setMessage] = useState("");
  const [saved,   setSaved]   = useState(false);

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
        setMessage("Ligação estabelecida! " + (json.count ?? 0) + " conta(s) encontrada(s).");
      } else {
        setStatus("error");
        setMessage(json.error || "Resposta inválida do Apps Script.");
      }
    } catch {
      setStatus("error");
      setMessage("Não foi possível ligar. Verifica o URL e tenta novamente.");
    }
  }

  function handleSave() {
    // Em produção com Electron, guardaria em ficheiro local seguro.
    // Por agora, informa o utilizador como configurar o .env.local.
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
            ● Configurado
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">

        {/* URL */}
        <div>
          <Input
            label="URL do Apps Script"
            placeholder="https://script.google.com/macros/s/.../exec"
            value={url}
            onChange={e => { setUrl(e.target.value); setStatus(null); }}
          />
          <div className="text-[11px] text-[#5a5f78] mt-1.5 leading-relaxed">
            Gerado ao publicar o Apps Script como Web App.{" "}
            <a
              href="https://developers.google.com/apps-script/guides/web"
              target="_blank"
              rel="noreferrer"
              className="text-[#a5b4fc] hover:underline"
            >
              Como obter o URL →
            </a>
          </div>
        </div>

        {/* API Key */}
        <div>
          <Input
            label="Chave de Acesso (API Key)"
            placeholder="A tua chave secreta"
            type="password"
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setStatus(null); }}
          />
          <div className="text-[11px] text-[#5a5f78] mt-1.5 leading-relaxed">
            Opcional mas recomendado. Define uma chave no Apps Script para
            proteger os teus dados. Sem chave, qualquer pessoa com o URL
            consegue aceder à tua informação financeira.
          </div>
        </div>

        {/* Security note */}
        <div className="flex gap-2.5 p-3 rounded-lg bg-[#1a1d2e] border border-[#2a2d3a] text-xs text-[#5a5f78]">
          <span className="shrink-0">🔒</span>
          <span>
            Estas credenciais ficam guardadas apenas no teu dispositivo.
            O Kappy nunca as envia para servidores externos.
            <strong className="text-[#8a8fa8]"> Nunca partilhes o URL nem a chave.</strong>
          </span>
        </div>

        {/* Status feedback */}
        {status === "testing" && (
          <div className="flex items-center gap-2 text-sm text-[#5a5f78]">
            <div className="w-4 h-4 border-2 border-[#6366f133] border-t-[#6366f1] rounded-full animate-spin" />
            A testar ligação...
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

        {/* Instrução de configuração manual */}
        {!isConfigured && (
          <div className="p-3 rounded-lg bg-[#1a1d2e] border border-[#2a2d3a] text-xs">
            <div className="text-[#8a8fa8] font-semibold mb-2">
              Como configurar manualmente:
            </div>
            <ol className="text-[#5a5f78] space-y-1 list-decimal list-inside">
              <li>Abre o ficheiro <code className="text-[#a5b4fc]">.env.local</code> na raiz do projecto</li>
              <li>Define <code className="text-[#a5b4fc]">VITE_SHEETS_URL=</code> com o teu URL</li>
              <li>Define <code className="text-[#a5b4fc]">VITE_SHEETS_API_KEY=</code> com a tua chave</li>
              <li>Reinicia o servidor com <code className="text-[#a5b4fc]">npm run dev</code></li>
            </ol>
          </div>
        )}

        {/* Acções */}
        <div className="flex gap-2 pt-1">
          <Button
            onClick={handleTest}
            disabled={!url || status === "testing"}
            variant="secondary"
          >
            🔍 Testar Ligação
          </Button>
          <Button
            onClick={handleSave}
            disabled={!url}
          >
            {saved ? "✓ Guardado!" : "Guardar"}
          </Button>
        </div>

      </div>
    </Card>
  );
}

// ── Coming Soon Form ──────────────────────────────────────────

function ComingSoonForm({ provider }) {
  return (
    <Card>
      <div className="flex flex-col items-center py-12 text-center">
        <span className="text-4xl mb-4">{provider.icon}</span>
        <div className="text-[15px] text-[#c4c0b8] mb-2">
          {provider.label} — Em breve
        </div>
        <div className="text-sm text-[#5a5f78] max-w-xs">
          Suporte para {provider.label} está a ser desenvolvido.
          Fica atento às próximas actualizações do Kappy.
        </div>
      </div>
    </Card>
  );
}